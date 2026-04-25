import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { productId, productAngle, formData } = await req.json();
    if (!productId || !productAngle) {
      return Response.json({ error: 'productId and productAngle are required' }, { status: 400 });
    }

    const { productType, niche, tone, platform } = formData || {};

    console.log('[regenerateFromAngle] productId:', productId, '| finalAngle:', productAngle.finalAngle);

    // Mark as generating
    await base44.asServiceRole.entities.Product.update(productId, {
      generation_status: 'generating',
      generation_progress: 'Regenerating from new product angle…',
      product_angle: productAngle,
    });

    const angleContext = `
PRODUCT ANGLE (this is the definitive strategic direction — everything must serve it):
- Exact Audience: ${productAngle.audience}
- Pain Point: ${productAngle.painPoint}
- Transformation: ${productAngle.transformation}
- Unique Mechanism: ${productAngle.uniqueMechanism}
- Emotional Hook: ${productAngle.emotionalHook}
- Positioning: ${productAngle.positioning}
- Final Angle: ${productAngle.finalAngle}
`;

    // Regenerate title, subtitle, promise, buyer profile + all marketing copy in parallel
    const [identityResult, salesResult] = await Promise.all([

      // Identity: title, subtitle, promise, buyer_profile, cta
      base44.integrations.Core.InvokeLLM({
        prompt: `You are a digital product strategist. Rewrite the core product identity based on the updated product angle below.
${angleContext}

PRODUCT TYPE: ${productType || 'Digital Product'}
NICHE: ${niche || 'General'}
TONE: ${tone || 'Professional'}
PLATFORM: ${platform || 'Gumroad'}

Return ONLY valid JSON:
{
  "title": "Benefit-driven product title (50–70 chars) — must reflect the final angle",
  "subtitle": "Audience-specific subtitle (max 100 chars) — call out who it's for and the transformation",
  "promise": "Specific measurable transformation this product delivers",
  "buyer_profile": "Vivid 2–3 sentence persona built on the exact audience and pain point",
  "problem_solved": "The exact pain point from the angle, written as the reader would describe it",
  "cta": "Urgency-driven CTA phrase that speaks to the emotional hook"
}`,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            subtitle: { type: 'string' },
            promise: { type: 'string' },
            buyer_profile: { type: 'string' },
            problem_solved: { type: 'string' },
            cta: { type: 'string' },
          }
        }
      }),

      // Sales copy: listing title, description, keywords, SEO, CTA
      base44.integrations.Core.InvokeLLM({
        prompt: `You are a world-class conversion copywriter for ${platform || 'digital product'} listings. Rewrite all sales copy based on the updated product angle.
${angleContext}

PRODUCT TYPE: ${productType || 'Digital Product'}
NICHE: ${niche || 'General'}
PLATFORM: ${platform || 'Gumroad'}
TONE: ${tone || 'Professional'}

Return ONLY valid JSON:
{
  "listing_title": "SEO-optimised listing title (max 140 chars) — front-load the top buyer keyword from the angle",
  "listing_description": "200–250 word platform-ready listing description built around the angle's pain point, transformation, and emotional hook",
  "keywords": ["keyword 1","keyword 2","keyword 3","keyword 4","keyword 5","keyword 6","keyword 7","keyword 8","keyword 9","keyword 10","keyword 11","keyword 12","keyword 13","keyword 14","keyword 15"],
  "platform_cta": "Most compelling CTA for this platform",
  "seo_meta_description": "150–160 char SEO meta description with primary keyword + transformation"
}`,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            listing_title: { type: 'string' },
            listing_description: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
            platform_cta: { type: 'string' },
            seo_meta_description: { type: 'string' },
          }
        }
      }),
    ]);

    // Fetch existing product to merge without overwriting content blocks
    const existingProduct = await base44.asServiceRole.entities.Product.get(productId);
    const existingMa = existingProduct?.marketing_assets || {};
    const existingPages = existingProduct?.pages || [];
    const existingSections = existingProduct?.sections || [];

    // Update cover block title/subtitle/promise if present
    const updatedPages = existingPages.map(block => {
      if (block.type === 'cover') {
        return {
          ...block,
          content: {
            ...block.content,
            title: identityResult.title || block.content?.title,
            subtitle: identityResult.subtitle || block.content?.subtitle,
            promise: identityResult.promise || block.content?.promise,
          }
        };
      }
      if (block.type === 'listing') {
        return {
          ...block,
          content: {
            ...block.content,
            listing_title: salesResult.listing_title,
            listing_description: salesResult.listing_description,
            keywords: salesResult.keywords,
            platform_cta: salesResult.platform_cta,
            seo_meta_description: salesResult.seo_meta_description,
            cta: identityResult.cta,
          }
        };
      }
      return block;
    });

    await base44.asServiceRole.entities.Product.update(productId, {
      product_angle: productAngle,
      title: identityResult.title,
      subtitle: identityResult.subtitle,
      promise: identityResult.promise,
      buyer_profile: identityResult.buyer_profile,
      problem_solved: identityResult.problem_solved,
      target_audience: productAngle.audience,
      product_angle_text: productAngle.finalAngle,
      marketing_assets: {
        ...existingMa,
        listing_title: salesResult.listing_title,
        listing_description: salesResult.listing_description,
        keywords: salesResult.keywords,
        platform_cta: salesResult.platform_cta,
        seo_meta_description: salesResult.seo_meta_description,
        cta: identityResult.cta,
      },
      pages: updatedPages,
      generation_status: 'done',
      generation_progress: null,
      last_edited_at: new Date().toISOString(),
      // Mark export as stale since content changed
      ...(existingProduct?.last_exported_at ? { export_status: 'stale' } : {}),
    });

    console.log('[regenerateFromAngle] Done — title:', identityResult.title);
    return Response.json({ success: true, title: identityResult.title });

  } catch (error) {
    console.error('[regenerateFromAngle] Error:', error.message);
    try {
      await base44.asServiceRole.entities.Product.update(
        (await req.clone().json().catch(() => ({}))).productId,
        { generation_status: 'done', generation_progress: null }
      );
    } catch {}
    return Response.json({ error: error.message }, { status: 500 });
  }
});