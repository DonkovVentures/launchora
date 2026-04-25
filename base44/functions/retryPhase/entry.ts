import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const platformContext = {
  'Etsy':            'visual-first marketplace, craft/print audience, search-driven discovery',
  'Gumroad':         'creator economy platform, direct audience, buyers are professionals and learners',
  'Creative Market': 'design-forward marketplace, buyers are designers and creatives',
  'Teachable':       'course platform, buyers expect structured learning paths',
  'Payhip':          'digital download store, versatile audience, good for niche communities',
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { productId, phase } = await req.json();
    if (!productId || !phase) {
      return Response.json({ error: 'productId and phase are required' }, { status: 400 });
    }

    const validPhases = ['salesCopy', 'platformGuides', 'socialKit', 'launchPlan'];
    if (!validPhases.includes(phase)) {
      return Response.json({ error: `Invalid phase. Must be one of: ${validPhases.join(', ')}` }, { status: 400 });
    }

    const product = await base44.asServiceRole.entities.Product.get(productId);
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify blueprint is done before allowing secondary retries
    const progress = product.generationProgress || {};
    if (progress.blueprint !== 'done') {
      return Response.json({ error: 'Cannot retry secondary phases until blueprint is complete' }, { status: 422 });
    }

    const { title, product_type, niche, tone, platform, marketing_assets, target_audience, promise } = product;
    const ma = marketing_assets || {};
    const platContext = platformContext[platform] || 'digital marketplace with buyers seeking professional resources';
    const priceMin = ma.price_min || 17;
    const priceMax = ma.price_max || 37;

    // Mark the specific phase as regenerating
    await base44.asServiceRole.entities.Product.update(productId, {
      generationProgress: { ...progress, [phase]: 'generating' },
    });

    console.log(`[retryPhase] Retrying phase: ${phase} for product: ${productId}`);

    let update = {};

    if (phase === 'salesCopy') {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a world-class conversion copywriter for ${platform} digital products.

PRODUCT: "${title}" (${product_type} for ${niche} on ${platform})
AUDIENCE: ${target_audience}
PROMISE: ${promise}
PRICE: $${priceMin}–$${priceMax}
PLATFORM CONTEXT: ${platContext}

Write complete, ready-to-paste sales copy:
LISTING TITLE (max 140 chars): Front-load buyer keywords.
LISTING DESCRIPTION (200-250 words): Hook, problem, product reveal, 5 benefits (✓), what's included, CTA.
KEYWORDS: 15 buyer-intent search phrases.
PLATFORM CTA: Most compelling action phrase.
SEO META DESCRIPTION (150-160 chars): Primary keyword + benefit.

Return ONLY valid JSON:
{"listing_title":"...","listing_description":"...","keywords":["..."],"platform_cta":"...","seo_meta_description":"..."}`,
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
      });
      update.marketing_assets = { ...ma, ...result };
      // Update listing block in pages if present
      if (product.pages) {
        const pages = product.pages.map(b => {
          if (b.type === 'listing') {
            return { ...b, content: { ...b.content, ...result, price_min: priceMin, price_max: priceMax } };
          }
          return b;
        });
        update.pages = pages;
      }
    }

    if (phase === 'platformGuides') {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert in selling digital products on ${platform}.

PRODUCT: "${title}" (${product_type} for ${niche})
PRICE: $${priceMin}–$${priceMax}
PLATFORM: ${platform} — ${platContext}
AUDIENCE: ${target_audience}

Write ALL sections fully:
WHY_THIS_PLATFORM (150 words), PLATFORM_AUDIENCE (100 words), PRICING_STRATEGY (150 words),
THUMBNAIL_GUIDANCE (150 words), LAUNCH_PLAN (200 words), PRO_TIPS (6 tips), MISTAKES_TO_AVOID (5 mistakes).

Return ONLY valid JSON:
{"why_this_platform":"...","platform_audience":"...","pricing_strategy":"...","thumbnail_guidance":"...","launch_plan":"...","pro_tips":["..."],"mistakes_to_avoid":["..."]}`,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            why_this_platform: { type: 'string' },
            platform_audience: { type: 'string' },
            pricing_strategy: { type: 'string' },
            thumbnail_guidance: { type: 'string' },
            launch_plan: { type: 'string' },
            pro_tips: { type: 'array', items: { type: 'string' } },
            mistakes_to_avoid: { type: 'array', items: { type: 'string' } },
          }
        }
      });
      update.platform_guides = result;
    }

    if (phase === 'socialKit') {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a social media strategist. Create a complete social media kit for a digital product launch.

PRODUCT: "${title}" (${product_type} for ${niche} on ${platform})
AUDIENCE: ${target_audience}
PROMISE: ${promise}
PRICE: $${priceMin}–$${priceMax}

Generate:
1. INSTAGRAM_CAPTIONS: 5 caption variations (hook + value + CTA + hashtags)
2. CONTENT_CALENDAR: 7-day post schedule with platform, content type, and key message
3. VIDEO_SCRIPTS: 3 short-form video scripts (30-60 seconds) with hook, body, CTA

Return ONLY valid JSON:
{"instagram_captions":["..."],"content_calendar":[{"day":1,"platform":"Instagram","content_type":"Reel","message":"..."}],"video_scripts":[{"title":"...","hook":"...","body":"...","cta":"..."}]}`,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            instagram_captions: { type: 'array', items: { type: 'string' } },
            content_calendar: { type: 'array', items: { type: 'object' } },
            video_scripts: { type: 'array', items: { type: 'object' } },
          }
        }
      });
      update.social_media_kit = result;
    }

    if (phase === 'launchPlan') {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a digital product launch strategist. Create a detailed 30-day launch plan.

PRODUCT: "${title}" (${product_type} for ${niche} on ${platform})
AUDIENCE: ${target_audience}
PROMISE: ${promise}
PRICE: $${priceMin}–$${priceMax}

Write a comprehensive week-by-week launch plan:
- Pre-launch preparation (Days 1-7)
- Launch week activities (Days 8-14)
- Post-launch momentum (Days 15-30)
- Key milestones and success metrics
- Contingency strategies if sales are slow

Be specific, actionable, and platform-optimized for ${platform}.`,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: { plan: { type: 'string' } }
        }
      });
      update.launch_plan = result.plan || '';
    }

    // Recompute overall generationStatus
    const newProgress = { ...progress, [phase]: 'done' };
    const allDone = ['blueprint', 'salesCopy', 'platformGuides', 'socialKit', 'launchPlan'].every(p => newProgress[p] === 'done');
    const newGenStatus = allDone ? 'completed' : 'assets_ready';

    await base44.asServiceRole.entities.Product.update(productId, {
      ...update,
      generationProgress: newProgress,
      generationStatus: newGenStatus,
    });

    console.log(`[retryPhase] Phase ${phase} retried successfully. Status: ${newGenStatus}`);
    return Response.json({ success: true, phase, generationStatus: newGenStatus });

  } catch (error) {
    console.error('[retryPhase] Error:', error.message);
    // Mark the phase as failed
    try {
      const { productId, phase } = await req.clone().json().catch(() => ({}));
      if (productId && phase) {
        const product = await base44.asServiceRole.entities.Product.get(productId);
        const progress = product?.generationProgress || {};
        await base44.asServiceRole.entities.Product.update(productId, {
          generationProgress: { ...progress, [phase]: 'failed' },
        });
      }
    } catch (_) {}
    return Response.json({ error: error.message }, { status: 500 });
  }
});