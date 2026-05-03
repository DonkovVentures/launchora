import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Timing helpers ────────────────────────────────────────────────────────────
function now() { return Date.now(); }
function elapsed(startMs) { return Date.now() - startMs; }
function logStep(label, durationMs) {
  console.log(`[enrichProduct] ⏱ ${label}: ${durationMs}ms`);
}

// ── Timeout wrapper ───────────────────────────────────────────────────────────
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`TIMEOUT after ${ms}ms: ${label}`)), ms);
  });
  return Promise.race([promise, timeout])
    .then(r => { clearTimeout(timer); return { ok: true, result: r }; })
    .catch(e => {
      clearTimeout(timer);
      const timedOut = e.message?.startsWith('TIMEOUT');
      console.warn(`[enrichProduct] ${timedOut ? '⏰ TIMEOUT' : '❌ ERROR'} — ${label}: ${e.message}`);
      return { ok: false, timedOut, error: e.message };
    });
}

// ── Section expansion helpers ─────────────────────────────────────────────────
// Each expands ONE section with a small, focused prompt — max ~300 words output.
async function expandSection(base44, sec, context) {
  const { productType, niche, tone, audience, promise: productPromise } = context;
  const isTemplate = (productType || '').toLowerCase().includes('template');

  // RULE: The core product content must deliver standalone value.
  // Marketing materials (emails, social, launch plan) are support — not the product.
  // Each section must be fully self-contained and actionable without any marketing context.
  const prompt = isTemplate
    ? `You are a professional ${niche} designer creating a complete, standalone template specification.
The buyer purchased a Template Pack for ${niche}. They need ACTUAL, COMPLETE template specifications — not summaries or advice.

Template name: "${sec.title}"
Niche: ${niche}. Audience: ${audience}. Tone: ${tone}.

Write a COMPLETE template specification with ALL of the following. Do not abbreviate or truncate any section:

1. BEST USE CASE — one specific sentence on when to use this template
2. LAYOUT STRUCTURE — describe the exact visual layout (page dimensions, sections, columns, spacing, header/footer, visual hierarchy)
3. REQUIRED ASSETS — list every asset the buyer needs before customizing (photos, logos, data, fonts)
4. COPY BLOCKS — write the FULL ready-to-customize copy for every section (use [BRACKETS] for buyer fields)
5. HEADLINE OPTIONS — 3 complete, ready-to-use headline variations specific to ${niche}
6. CTA OPTIONS — 2 specific calls-to-action
7. CUSTOMIZATION GUIDE — 5 specific, actionable steps to customize this template
8. EXPORT INSTRUCTIONS — exact format recommendations (PDF/PNG/JPG, resolution, naming convention)
9. QUALITY CONTROL — 5 checklist items to verify before delivering to a client

Rules:
- Minimum 400 words — this is the product, not a summary
- Write ACTUAL copy and layout specs — the buyer must be able to build this template from your specification alone
- Use [BRACKETS] for every buyer-specific field
- Be specific to ${niche} — no generic placeholders

Return ONLY valid JSON: {"body": "...complete template specification..."}`
    : `You are writing substantive content for a premium digital ${productType} in the ${niche} niche.
Tone: ${tone}. Target audience: ${audience}. Product promise: ${productPromise}.

RULE: This section is the PRODUCT. It must deliver standalone, actionable value — not an introduction to something else.

Write complete, substantive content for this section:
Section title: "${sec.title}"
Existing stub (if any): "${sec.body || ''}"

Requirements:
- Minimum 250 words of real, specific, actionable content
- Use appropriate structure: headers, numbered steps, bullet points, examples, or frameworks
- Every point must be specific to ${niche} — no generic filler
- Include at least one concrete example, framework, or template the buyer can use immediately
- Do NOT write "Introduction to..." or "Overview of..." — write the actual content
- Do NOT repeat the section title in the body

Return ONLY valid JSON: {"body": "...complete section content..."}`;

  const result = await withTimeout(
    base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: { body: { type: 'string' } }
      }
    }),
    20_000,
    `expandSection/${sec.title}`
  );

  return result.ok ? result.result.body : sec.body;
}

// ── Platform context ──────────────────────────────────────────────────────────
const platformContext = {
  'Etsy':            'visual-first marketplace, craft/print audience, search-driven discovery, buyers want printables and planners',
  'Gumroad':         'creator economy platform, direct audience, buyers are professionals and learners seeking niche expertise',
  'Creative Market': 'design-forward marketplace, buyers are designers and creatives, premium aesthetic standards expected',
  'Teachable':       'course platform, buyers expect structured learning paths, transformation-focused positioning works best',
  'Payhip':          'digital download store, versatile audience, good for niche communities and direct sales',
};

// ── Progress update (patch only, no GET) ─────────────────────────────────────
async function updateProgress(base44, productId, generationStatus, progressPatch, existingProgress) {
  try {
    const merged = { ...(existingProgress || {}), ...progressPatch };
    await base44.asServiceRole.entities.Product.update(productId, {
      generationStatus,
      generationProgress: merged,
    });
    return merged;
  } catch (e) {
    console.error('[enrichProduct] updateProgress failed:', e.message);
    return existingProgress || {};
  }
}

// ── Build listing block ───────────────────────────────────────────────────────
function buildListingBlock(salesResult, phase1, platform) {
  return {
    id: String(Date.now()),
    type: 'listing',
    heading: `${platform} Listing`,
    content: {
      listing_title: salesResult.listing_title,
      listing_description: salesResult.listing_description,
      keywords: salesResult.keywords,
      platform_cta: salesResult.platform_cta,
      seo_meta_description: salesResult.seo_meta_description,
      price_min: phase1.price_min,
      price_max: phase1.price_max,
      cta: phase1.cta,
    }
  };
}

const SECONDARY_TIMEOUT_MS = 30_000;
const SECTION_EXPAND_TIMEOUT_MS = 20_000;

// ── Main Handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let productId = null;
  const enrichStart = now();
  const timings = {
    enrichStartedAt: new Date().toISOString(),
    blueprintSkippedBecausePhase1Exists: false,
    errors: [],
  };

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    productId = body.productId;
    const retryStep = body.retryStep || null; // Optional: "salesCopy" | "platformGuides" | "socialKit" | "launchPlan" | "sectionExpansion"

    if (!productId) {
      return Response.json({ error: 'productId is required' }, { status: 400 });
    }

    // If it's a retry of a specific step, delegate to retry logic below
    if (retryStep) {
      return handleRetryStep({ base44, productId, retryStep, timings, enrichStart });
    }

    const { phase1: rawPhase1, formData, productAngle } = body;

    if (!rawPhase1 || !formData) {
      return Response.json({ error: 'Missing required params: phase1 and formData' }, { status: 400 });
    }

    console.log(`[enrichProduct] ▶ START productId=${productId}`);

    const { productType, niche, tone, platform } = formData;
    const phase1 = { ...rawPhase1 };
    phase1.price_min = Number(phase1.price_min) || 17;
    phase1.price_max = Number(phase1.price_max) || 37;

    const platContext = platformContext[platform] || 'digital marketplace with buyers seeking professional resources';

    const angleContext = productAngle ? `
PRODUCT ANGLE:
- Audience: ${productAngle.audience}
- Pain Point: ${productAngle.painPoint}
- Transformation: ${productAngle.transformation}
- Unique Mechanism: ${productAngle.uniqueMechanism}
- Emotional Hook: ${productAngle.emotionalHook}
- Final Angle: ${productAngle.finalAngle}
` : '';

    // ── BLUEPRINT: Use phase1 + existing pages — no heavy AI call ────────────
    // phase1 was already generated on the frontend before redirect.
    // The initial product_blocks were already saved. We treat that as "done".
    console.log(`[enrichProduct] ✅ Blueprint skipped — using phase1 from Create.jsx`);
    timings.blueprintSkippedBecausePhase1Exists = true;

    // Build initial blocks from phase1 structure if not already set
    const structureItems = phase1.structure || [];
    const initialSections = structureItems.map((title, i) => ({ title, body: '' }));

    // Initial cover + toc + stub sections
    const stubSectionBlocks = initialSections.map((sec, i) => ({
      id: String(3 + i),
      type: 'section',
      heading: sec.title,
      content: { title: sec.title, body: '' }
    }));

    const initialBlocks = [
      { id: '1', type: 'cover', heading: 'Cover', content: { title: phase1.title, subtitle: phase1.subtitle, promise: phase1.promise, audience: phase1.audience } },
      { id: '2', type: 'toc', heading: 'Contents', content: { items: structureItems } },
      ...stubSectionBlocks,
      { id: String(Date.now() + 1), type: 'notes', heading: 'Notes', content: { title: 'Your Notes', lines: 12 } },
    ];

    // ── Save blueprint_ready immediately ──────────────────────────────────────
    timings.blueprintStartedAt = new Date().toISOString();
    timings.blueprintFinishedAt = new Date().toISOString();
    timings.blueprintDurationMs = 0;

    let currentProgress = {
      blueprint: 'done',
      salesCopy: 'generating',
      platformGuides: 'generating',
      socialKit: 'pending',
      launchPlan: 'pending',
    };

    await base44.asServiceRole.entities.Product.update(productId, {
      title: phase1.title,
      subtitle: phase1.subtitle,
      promise: phase1.promise,
      target_audience: phase1.audience,
      buyer_profile: phase1.buyer_profile,
      checklist_items: phase1.benefits || [],
      pages: initialBlocks,
      sections: initialSections,
      status: 'ready',
      generationStatus: 'blueprint_ready',
      generationProgress: currentProgress,
      generation_status: 'generating',
      generation_progress: 'Blueprint ready! Generating sales copy & platform guide...',
      generated_data: {
        ...phase1,
        product_blocks: initialBlocks,
        sections: initialSections,
        _progress: 'Generating secondary assets...',
      },
      ...(productAngle ? { product_angle: productAngle } : {}),
      generationTimings: { ...timings },
    });
    logStep('blueprint_ready save', elapsed(enrichStart));

    // ── SECONDARY ASSETS: ALL in parallel, fully non-blocking ────────────────
    timings.salesCopyStartedAt = new Date().toISOString();
    timings.platformGuidesStartedAt = new Date().toISOString();
    timings.sectionExpansionStartedAt = new Date().toISOString();

    const sectionExpStart = now();

    // Section expansion: each section independently, in parallel
    const sectionExpansionPromises = initialSections.map(sec =>
      expandSection(base44, sec, {
        productType, niche, tone,
        audience: phase1.audience,
        promise: phase1.promise,
      }).then(body => ({ ...sec, body }))
    );

    const salesCopyPromise = withTimeout(
      base44.integrations.Core.InvokeLLM({
        prompt: `You are a world-class conversion copywriter for ${platform} digital products. Write complete, ready-to-paste sales copy.

PRODUCT: "${phase1.title}"
TYPE: ${productType} | NICHE: ${niche} | TONE: ${tone} | PLATFORM: ${platform}
AUDIENCE: ${phase1.audience}
PROMISE: ${phase1.promise}
SELLING ANGLE: ${phase1.selling_angle}
BENEFITS: ${(phase1.benefits || []).join(' | ')}
PRICE: $${phase1.price_min}–$${phase1.price_max}
PLATFORM CONTEXT: ${platContext}
${angleContext}

Return concise JSON (no field may be empty):
{
  "listing_title": "max 140 chars, front-load keyword",
  "listing_description": "150-200 words: hook, problem, product, 4 benefits (✓), CTA",
  "keywords": ["15 buyer-intent phrases"],
  "platform_cta": "action phrase",
  "seo_meta_description": "max 155 chars"
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
      SECONDARY_TIMEOUT_MS,
      'salesCopy/gemini_3_flash'
    );

    const platformGuidePromise = withTimeout(
      base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert in selling digital products on ${platform}. Write a practical launch guide.

PRODUCT: "${phase1.title}" (${productType} for ${niche})
PRICE: $${phase1.price_min}–$${phase1.price_max}
PLATFORM: ${platform} — ${platContext}
AUDIENCE: ${phase1.audience}

Return concise JSON (all fields required):
{
  "why_this_platform": "100 words",
  "platform_audience": "80 words",
  "pricing_strategy": "100 words",
  "thumbnail_guidance": "80 words",
  "launch_plan": "150 words",
  "pro_tips": ["tip1","tip2","tip3","tip4","tip5"],
  "mistakes_to_avoid": ["m1","m2","m3","m4","m5"]
}`,
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
      }),
      SECONDARY_TIMEOUT_MS,
      'platformGuides/gemini_3_flash'
    );

    // Run salesCopy + platformGuides + sectionExpansion all in parallel
    const [salesStatus, guideStatus, ...expandedSectionResults] = await Promise.allSettled([
      salesCopyPromise,
      platformGuidePromise,
      ...sectionExpansionPromises,
    ]);

    // Unwrap allSettled results
    const salesResult = salesStatus.status === 'fulfilled' && salesStatus.value?.ok ? salesStatus.value.result : null;
    const guideResult = guideStatus.status === 'fulfilled' && guideStatus.value?.ok ? guideStatus.value.result : null;
    const expandedSections = expandedSectionResults.map((r, i) =>
      r.status === 'fulfilled' ? r.value : initialSections[i]
    );

    timings.salesCopyFinishedAt = new Date().toISOString();
    timings.salesCopyDurationMs = elapsed(sectionExpStart);
    timings.platformGuidesFinishedAt = new Date().toISOString();
    timings.platformGuidesDurationMs = elapsed(sectionExpStart);
    timings.sectionExpansionFinishedAt = new Date().toISOString();
    timings.sectionExpansionDurationMs = elapsed(sectionExpStart);

    logStep('salesCopy', timings.salesCopyDurationMs);
    logStep('platformGuides', timings.platformGuidesDurationMs);
    logStep('sectionExpansion', timings.sectionExpansionDurationMs);

    if (!salesResult) timings.errors.push({ step: 'salesCopy', error: salesStatus.reason?.message || salesStatus.value?.error || 'failed', at: new Date().toISOString() });
    if (!guideResult) timings.errors.push({ step: 'platformGuides', error: guideStatus.reason?.message || guideStatus.value?.error || 'failed', at: new Date().toISOString() });

    // Build expanded blocks
    const expandedSectionBlocks = expandedSections.map((sec, i) => ({
      id: String(3 + i),
      type: 'section',
      heading: sec.title,
      content: { title: sec.title, body: sec.body }
    }));

    // Build listing block if salesCopy succeeded
    const listingBlock = salesResult ? buildListingBlock(salesResult, phase1, platform) : null;
    const finalBlocks = [
      { id: '1', type: 'cover', heading: 'Cover', content: { title: phase1.title, subtitle: phase1.subtitle, promise: phase1.promise, audience: phase1.audience } },
      { id: '2', type: 'toc', heading: 'Contents', content: { items: expandedSections.map(s => s.title) } },
      ...expandedSectionBlocks,
      { id: String(Date.now() + 1), type: 'notes', heading: 'Notes', content: { title: 'Your Notes', lines: 12 } },
      ...(listingBlock ? [listingBlock] : []),
    ];

    // Update progress after stage 1 parallel batch
    currentProgress = {
      blueprint: 'done',
      salesCopy: salesResult ? 'done' : 'failed',
      platformGuides: guideResult ? 'done' : 'failed',
      socialKit: 'generating',
      launchPlan: 'generating',
    };

    // Save intermediate results
    await base44.asServiceRole.entities.Product.update(productId, {
      sections: expandedSections,
      pages: finalBlocks,
      ...(salesResult ? {
        marketing_assets: {
          listing_title: salesResult.listing_title,
          listing_description: salesResult.listing_description,
          keywords: salesResult.keywords || [],
          platform_cta: salesResult.platform_cta,
          seo_meta_description: salesResult.seo_meta_description,
          price_min: phase1.price_min,
          price_max: phase1.price_max,
          price_rationale: phase1.price_rationale,
          cta: phase1.cta,
        }
      } : {}),
      ...(guideResult ? { platform_guides: guideResult } : {}),
      generationStatus: 'generating_assets',
      generationProgress: currentProgress,
      generation_progress: 'Sections expanded! Generating social kit & launch plan...',
      generated_data: {
        ...phase1,
        product_blocks: finalBlocks,
        sections: expandedSections,
        ...(salesResult ? {
          listing_title: salesResult.listing_title,
          listing_description: salesResult.listing_description,
          keywords: salesResult.keywords,
        } : {}),
        _progress: null,
      },
      generationTimings: { ...timings },
    });
    logStep('intermediate save', elapsed(enrichStart));

    // ── STAGE 2: Social Kit + Launch Plan (parallel, non-blocking) ────────────
    timings.socialKitStartedAt = new Date().toISOString();
    timings.launchPlanStartedAt = new Date().toISOString();

    const socialStart = now();

    const socialKitPromise = withTimeout(
      base44.integrations.Core.InvokeLLM({
        prompt: `You are a social media strategist. Create a social media launch kit.

PRODUCT: "${phase1.title}" (${productType} for ${niche} on ${platform})
AUDIENCE: ${phase1.audience}
PROMISE: ${phase1.promise}
PRICE: $${phase1.price_min}–$${phase1.price_max}
${angleContext}

Return concise JSON:
{
  "instagram_captions": ["5 captions with hook+value+CTA+hashtags"],
  "content_calendar": [{"day":1,"platform":"Instagram","content_type":"Reel","message":"..."}],
  "video_scripts": [{"title":"...","hook":"...","body":"...","cta":"..."}]
}`,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            instagram_captions: { type: 'array', items: { type: 'string' } },
            content_calendar: { type: 'array', items: { type: 'object' } },
            video_scripts: { type: 'array', items: { type: 'object' } },
          }
        }
      }),
      SECONDARY_TIMEOUT_MS,
      'socialKit/gemini_3_flash'
    );

    const launchPlanPromise = withTimeout(
      base44.integrations.Core.InvokeLLM({
        prompt: `You are a digital product launch strategist. Write a 30-day launch plan.

PRODUCT: "${phase1.title}" (${productType} for ${niche} on ${platform})
AUDIENCE: ${phase1.audience}
PRICE: $${phase1.price_min}–$${phase1.price_max}

Cover: Days 1-7 prep, Days 8-14 launch, Days 15-30 momentum. Max 400 words. Be specific and actionable.`,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: { plan: { type: 'string' } }
        }
      }),
      SECONDARY_TIMEOUT_MS,
      'launchPlan/gemini_3_flash'
    );

    const [socialKitStatus, launchPlanStatus] = await Promise.allSettled([socialKitPromise, launchPlanPromise]);

    const socialKitResult = socialKitStatus.status === 'fulfilled' && socialKitStatus.value?.ok ? socialKitStatus.value.result : null;
    const launchPlanResult = launchPlanStatus.status === 'fulfilled' && launchPlanStatus.value?.ok ? launchPlanStatus.value.result : null;

    timings.socialKitFinishedAt = new Date().toISOString();
    timings.socialKitDurationMs = elapsed(socialStart);
    timings.launchPlanFinishedAt = new Date().toISOString();
    timings.launchPlanDurationMs = elapsed(socialStart);
    logStep('socialKit', timings.socialKitDurationMs);
    logStep('launchPlan', timings.launchPlanDurationMs);

    if (!socialKitResult) timings.errors.push({ step: 'socialKit', error: socialKitStatus.reason?.message || socialKitStatus.value?.error || 'failed', at: new Date().toISOString() });
    if (!launchPlanResult) timings.errors.push({ step: 'launchPlan', error: launchPlanStatus.reason?.message || launchPlanStatus.value?.error || 'failed', at: new Date().toISOString() });

    // ── Compute final status ──────────────────────────────────────────────────
    const finalProgress = {
      blueprint: 'done',
      salesCopy: salesResult ? 'done' : 'failed',
      platformGuides: guideResult ? 'done' : 'failed',
      socialKit: socialKitResult ? 'done' : 'failed',
      launchPlan: launchPlanResult ? 'done' : 'failed',
    };

    const successCount = [salesResult, guideResult, socialKitResult, launchPlanResult].filter(Boolean).length;
    const finalGenStatus = successCount === 4 ? 'completed' : 'assets_ready';

    const stepDurations = {
      blueprint: 0,
      sectionExpansion: timings.sectionExpansionDurationMs,
      salesCopy: timings.salesCopyDurationMs,
      platformGuides: timings.platformGuidesDurationMs,
      socialKit: timings.socialKitDurationMs,
      launchPlan: timings.launchPlanDurationMs,
    };
    timings.slowestStep = Object.entries(stepDurations).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
    timings.totalDurationMs = elapsed(enrichStart);
    timings.enrichFinishedAt = new Date().toISOString();

    console.log(`[enrichProduct] ⏱ SUMMARY — total: ${timings.totalDurationMs}ms | slowest: ${timings.slowestStep} | status: ${finalGenStatus}`);

    // ── Final save ────────────────────────────────────────────────────────────
    await base44.asServiceRole.entities.Product.update(productId, {
      generationStatus: finalGenStatus,
      generationProgress: finalProgress,
      generation_status: 'done',
      generation_progress: null,
      ...(socialKitResult ? { social_media_kit: socialKitResult } : {}),
      ...(launchPlanResult ? { launch_plan: launchPlanResult.plan || '' } : {}),
      ...(productAngle ? { product_angle: productAngle } : {}),
      generationTimings: { ...timings },
    });
    logStep('final save', elapsed(enrichStart));

    console.log(`[enrichProduct] ✅ Done — productId=${productId} status=${finalGenStatus} successes=${successCount}/4`);

    return Response.json({
      success: true,
      generationStatus: finalGenStatus,
      generationProgress: finalProgress,
      timings: { totalDurationMs: timings.totalDurationMs, slowestStep: timings.slowestStep, stepDurations },
    });

  } catch (error) {
    console.error('[enrichProduct] ❌ Fatal error:', error.message);
    timings.errors.push({ step: 'fatal', error: error.message, at: new Date().toISOString() });
    timings.totalDurationMs = elapsed(enrichStart);
    timings.enrichFinishedAt = new Date().toISOString();
    try {
      if (productId) {
        await base44.asServiceRole.entities.Product.update(productId, {
          generation_status: 'error',
          generation_progress: 'Generation hit an error. Your blueprint is safe.',
          generationTimings: timings,
        });
      }
    } catch (_) {}
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ── Retry handler for individual steps ───────────────────────────────────────
async function handleRetryStep({ base44, productId, retryStep, timings, enrichStart }) {
  const validSteps = ['salesCopy', 'platformGuides', 'socialKit', 'launchPlan', 'sectionExpansion'];
  if (!validSteps.includes(retryStep)) {
    return Response.json({ error: `Invalid retryStep. Must be one of: ${validSteps.join(', ')}` }, { status: 400 });
  }

  const product = await base44.asServiceRole.entities.Product.get(productId);
  if (!product) return Response.json({ error: 'Product not found' }, { status: 404 });

  const progress = product.generationProgress || {};
  const platContext = platformContext[product.platform] || 'digital marketplace';
  const ma = product.marketing_assets || {};
  const priceMin = ma.price_min || product.generated_data?.price_min || 17;
  const priceMax = ma.price_max || product.generated_data?.price_max || 37;

  await base44.asServiceRole.entities.Product.update(productId, {
    generationProgress: { ...progress, [retryStep]: 'generating' },
  });

  let update = {};

  if (retryStep === 'salesCopy') {
    const r = await withTimeout(
      base44.integrations.Core.InvokeLLM({
        prompt: `Write sales copy for "${product.title}" (${product.product_type} for ${product.niche} on ${product.platform}).
Audience: ${product.target_audience}. Promise: ${product.promise}. Price: $${priceMin}–$${priceMax}.
Return JSON: {"listing_title":"...","listing_description":"150-200 words","keywords":["15 phrases"],"platform_cta":"...","seo_meta_description":"max 155 chars"}`,
        model: 'gemini_3_flash',
        response_json_schema: { type: 'object', properties: { listing_title: { type: 'string' }, listing_description: { type: 'string' }, keywords: { type: 'array', items: { type: 'string' } }, platform_cta: { type: 'string' }, seo_meta_description: { type: 'string' } } }
      }),
      SECONDARY_TIMEOUT_MS, 'retry/salesCopy'
    );
    if (r.ok) update.marketing_assets = { ...ma, ...r.result };
  }

  if (retryStep === 'platformGuides') {
    const r = await withTimeout(
      base44.integrations.Core.InvokeLLM({
        prompt: `Write a platform guide for "${product.title}" on ${product.platform}. Niche: ${product.niche}. Audience: ${product.target_audience}.
Return JSON: {"why_this_platform":"...","platform_audience":"...","pricing_strategy":"...","thumbnail_guidance":"...","launch_plan":"...","pro_tips":["..."],"mistakes_to_avoid":["..."]}`,
        model: 'gemini_3_flash',
        response_json_schema: { type: 'object', properties: { why_this_platform: { type: 'string' }, platform_audience: { type: 'string' }, pricing_strategy: { type: 'string' }, thumbnail_guidance: { type: 'string' }, launch_plan: { type: 'string' }, pro_tips: { type: 'array', items: { type: 'string' } }, mistakes_to_avoid: { type: 'array', items: { type: 'string' } } } }
      }),
      SECONDARY_TIMEOUT_MS, 'retry/platformGuides'
    );
    if (r.ok) update.platform_guides = r.result;
  }

  if (retryStep === 'socialKit') {
    const r = await withTimeout(
      base44.integrations.Core.InvokeLLM({
        prompt: `Create a social media kit for "${product.title}" (${product.product_type} for ${product.niche}).
Return JSON: {"instagram_captions":["5 captions"],"content_calendar":[{"day":1,"platform":"Instagram","content_type":"Reel","message":"..."}],"video_scripts":[{"title":"...","hook":"...","body":"...","cta":"..."}]}`,
        model: 'gemini_3_flash',
        response_json_schema: { type: 'object', properties: { instagram_captions: { type: 'array', items: { type: 'string' } }, content_calendar: { type: 'array', items: { type: 'object' } }, video_scripts: { type: 'array', items: { type: 'object' } } } }
      }),
      SECONDARY_TIMEOUT_MS, 'retry/socialKit'
    );
    if (r.ok) update.social_media_kit = r.result;
  }

  if (retryStep === 'launchPlan') {
    const r = await withTimeout(
      base44.integrations.Core.InvokeLLM({
        prompt: `Write a 30-day launch plan for "${product.title}" on ${product.platform}. Audience: ${product.target_audience}. Max 400 words.`,
        model: 'gemini_3_flash',
        response_json_schema: { type: 'object', properties: { plan: { type: 'string' } } }
      }),
      SECONDARY_TIMEOUT_MS, 'retry/launchPlan'
    );
    if (r.ok) update.launch_plan = r.result.plan || '';
  }

  if (retryStep === 'sectionExpansion') {
    const sections = product.sections || [];
    if (sections.length > 0) {
      const expanded = await Promise.allSettled(
        sections.map(sec => expandSection(base44, sec, {
          productType: product.product_type,
          niche: product.niche,
          tone: product.tone,
          audience: product.target_audience,
          promise: product.promise,
        }).then(body => ({ ...sec, body })))
      );
      const newSections = expanded.map((r, i) => r.status === 'fulfilled' ? r.value : sections[i]);
      // Rebuild section blocks
      const updatedBlocks = (product.pages || []).map(b => {
        if (b.type === 'section') {
          const match = newSections.find(s => s.title === b.heading || s.title === b.content?.title);
          if (match) return { ...b, content: { ...b.content, body: match.body } };
        }
        return b;
      });
      update.sections = newSections;
      update.pages = updatedBlocks;
    }
  }

  const newProgress = { ...progress, [retryStep]: Object.keys(update).length > 0 ? 'done' : 'failed' };
  const successCount = ['salesCopy', 'platformGuides', 'socialKit', 'launchPlan'].filter(k => newProgress[k] === 'done').length;
  const newGenStatus = successCount === 4 ? 'completed' : 'assets_ready';

  await base44.asServiceRole.entities.Product.update(productId, {
    ...update,
    generationProgress: newProgress,
    generationStatus: newGenStatus,
  });

  console.log(`[enrichProduct] retry ${retryStep} done. Status: ${newGenStatus}`);
  return Response.json({ success: true, retryStep, generationStatus: newGenStatus });
}