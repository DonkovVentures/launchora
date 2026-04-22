import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { productId, phase1, formData } = await req.json();
    if (!productId || !phase1 || !formData) {
      return Response.json({ error: 'Missing required params' }, { status: 400 });
    }

    const { productType, niche, tone, platform } = formData;

    // ── PHASE 2: Content generation ──────────────────────────────
    const contentInstructions = {
      'Planner': `Write 3 complete planner pages:
PAGE 1 — Weekly Planner: 7 daily columns with: priority task (1 item), top 3 tasks, time blocks (6am-9pm in 2-hour slots), energy level tracker, evening reflection prompt.
PAGE 2 — Goal Setting Page: Monthly goal (with why it matters + success metric), 3 weekly milestones, daily non-negotiables, potential obstacles + solutions.
PAGE 3 — Weekly Reflection: What did you accomplish? What blocked you? Rate your week 1-10. Lesson learned. One thing to do differently next week.`,
      'Checklist': `Write 3 complete, actionable checklists:
CHECKLIST 1 — Pre-phase: 10-12 specific items that must be done BEFORE starting
CHECKLIST 2 — During phase: 10-12 items to track WHILE doing the main activity
CHECKLIST 3 — Post-phase / Review: 8-10 items to complete and review AFTER
Each item must be specific, actionable, and start with a verb.`,
      'Tracker': `Write 3 complete tracking pages:
TRACKER 1 — Daily Log: date, key metric fields (5-6 specific ones for the niche), notes column, rating 1-5
TRACKER 2 — Weekly Summary: weekly totals, trend column, wins, areas to improve, pattern notes
TRACKER 3 — Monthly Progress: monthly averages, milestone achieved (Y/N), streak count, personal bests, next month focus`,
      'Workbook': `Write 2 complete workbook modules:
MODULE 1 — Foundation: concept explanation (2 paragraphs), self-assessment exercise (5 questions), key insight framework (3-step), action assignment.
MODULE 2 — Application: case study/example scenario, step-by-step implementation exercise, reflection prompts (3 deep questions), accountability checkpoint.`,
      'Journal': `Write 3 complete journal pages with guided prompts:
PAGE 1 — Morning Intention (5 prompts for clarity, gratitude, energy, focus, mindset)
PAGE 2 — Midday Check-In (4 prompts for progress, energy management, pivot moments, self-compassion)
PAGE 3 — Evening Reflection (5 prompts for wins, lessons, emotions, release, tomorrow's intention)`,
      'Prompt Pack': `Write 3 complete prompt categories with 5 prompts each:
CATEGORY 1 — Specific use case 1: intro + 5 detailed ready-to-use prompts
CATEGORY 2 — Specific use case 2: intro + 5 prompts
CATEGORY 3 — Advanced prompts: intro + 5 complex chained prompts`,
      'Mini Ebook': `Write Chapter 1 and Chapter 2 fully:
CHAPTER 1 — Introduction: compelling hook story, core problem, why existing solutions fail, what reader will discover.
CHAPTER 2 — First Core Framework: main concept, 3-step framework with detail, real-world example, common mistake, action step.`,
      'Template Pack': `Write 4 FULLY COMPLETE templates for ${niche} professionals. Each must contain:
- Title and who it's for
- Step-by-step usage instructions
- The FULL TEMPLATE BODY with all fields written out using [VARIABLE] style placeholders
- A COMPLETED EXAMPLE with realistic niche-specific data
- A PRO TIP for advanced customization`,
    };
    const contentGuide = contentInstructions[productType] || 'Write 3 complete, premium sections of actual usable content.';

    const blockType = productType === 'Checklist' ? 'checklist'
      : (productType === 'Journal' || productType === 'Workbook') ? 'worksheet'
      : productType === 'Prompt Pack' ? 'prompt' : 'section';

    // Generate content with gemini (fast + capable)
    const phase2raw = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert digital product content writer. Write COMPLETE, DETAILED, IMMEDIATELY USABLE content for a paid digital product.

PRODUCT: "${phase1.title}"
TYPE: ${productType} | NICHE: ${niche} | TONE: ${tone}
AUDIENCE: ${phase1.audience}
PROMISE: ${phase1.promise}

CONTENT REQUIREMENTS:
${contentGuide}

RULES:
- Write actual content, no placeholders
- Every sentence must be niche-specific and actionable
- Use ${tone} tone throughout
- Use markdown: ## headers, **bold key terms**, numbered steps, bullet lists

Return ONLY valid JSON:
{
  "content_draft": "FULL formatted product content",
  "sections": [
    { "title": "Section title", "body": "Full written section body" },
    { "title": "Section title", "body": "..." },
    { "title": "Section title", "body": "..." },
    { "title": "Section title", "body": "..." },
    { "title": "BONUS: Section title", "body": "..." }
  ]
}`,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          content_draft: { type: 'string' },
          sections: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, body: { type: 'string' } } } }
        }
      }
    });

    const finalContentDraft = phase2raw.content_draft || '';
    const finalSections = phase2raw.sections || [];

    const sectionBlocks = finalSections.map((sec, i) => ({
      id: String(3 + i),
      type: blockType,
      heading: sec.title || `Section ${i + 1}`,
      content: {
        title: sec.title,
        body: sec.body,
        items: sec.body ? sec.body.split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim()).filter(Boolean) : [],
        prompts: sec.body ? sec.body.split('\n').filter(l => /^\d+\./.test(l.trim())).map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean) : [],
      }
    }));

    const phase2 = {
      content_draft: finalContentDraft,
      product_blocks: [
        { id: '1', type: 'cover', heading: 'Cover', content: { title: phase1.title, subtitle: phase1.subtitle, promise: phase1.promise, audience: phase1.audience } },
        { id: '2', type: 'toc', heading: 'Contents', content: { items: finalSections.map(s => s.title).filter(Boolean) } },
        ...sectionBlocks,
        { id: String(Date.now() + 1), type: 'notes', heading: 'Notes', content: { title: 'Your Notes', lines: 12 } },
      ]
    };

    // Save phase 2
    await base44.asServiceRole.entities.Product.update(productId, {
      generated_data: { ...phase1, ...phase2 },
    });

    // ── PHASE 3: SEO listing copy ────────────────────────────────
    const phase3 = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a world-class SEO copywriter for ${platform} digital products.

PRODUCT: "${phase1.title}"
TYPE: ${productType} | NICHE: ${niche} | TONE: ${tone}
AUDIENCE: ${phase1.audience}
PROMISE: ${phase1.promise}
SELLING ANGLE: ${phase1.selling_angle}
BENEFITS: ${(phase1.benefits || []).slice(0, 3).join(' | ')}
PRICE: $${phase1.price_min}–$${phase1.price_max}

Generate ALL of the following ready to copy-paste:

1. LISTING TITLE: Front-load the #1 buyer-intent keyword. Include product type + core benefit + audience signal. Max 140 chars.

2. LISTING DESCRIPTION: 180-220 words structured for ${platform}:
   - Hook: Name the exact pain or desire
   - Problem agitation: What they've tried, why it failed
   - Product reveal: What this IS and DOES
   - Benefits list (4 items starting with ✓): Concrete outcomes
   - What's included: Exact deliverable, format, page count
   - CTA: Creates desire and specificity

3. SEO KEYWORDS: 15 buyer-intent search terms (3 broad, 7 mid-tail, 5 long-tail)

4. PLATFORM CTA: Single most compelling CTA phrase for ${platform}

5. SEO META DESCRIPTION: 150-155 chars with primary keyword

Return ONLY valid JSON:
{
  "listing_title": "...",
  "listing_description": "...",
  "keywords": ["keyword 1", "...15 total"],
  "platform_cta": "...",
  "seo_meta_description": "..."
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
    });

    // Save phase 3
    await base44.asServiceRole.entities.Product.update(productId, {
      generated_data: { ...phase1, ...phase2, ...phase3 },
    });

    // ── PHASE 4: Platform strategy ───────────────────────────────
    const phase4 = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a top ${platform} seller. Give precise platform strategy for this product.

PRODUCT: "${phase1.title}" — ${productType} in ${niche}
PLATFORM: ${platform}
PRICE: $${phase1.price_min}–$${phase1.price_max}

Return ONLY valid JSON:
{
  "platform_guidance": {
    "why_this_platform": "Specific reason this platform works for this product type and niche",
    "platform_audience": "Who buys this on ${platform}: demographics, what they search for, purchase drivers",
    "pricing_strategy": "Exact pricing recommendation with launch price vs full price and bundle opportunities",
    "thumbnail_guidance": "Precise thumbnail design: dimensions, text, colors, font, mockup style",
    "launch_plan": "5-step launch sequence for the first 7 days",
    "pro_tips": [
      "Advanced tip 1",
      "Advanced tip 2",
      "Advanced tip 3",
      "Advanced tip 4"
    ],
    "mistakes_to_avoid": [
      "Critical mistake 1",
      "Critical mistake 2",
      "Critical mistake 3",
      "Critical mistake 4"
    ]
  }
}`,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: { platform_guidance: { type: 'object' } }
      }
    });

    // Build final listing block
    const listingBlock = {
      id: String(Date.now()),
      type: 'listing',
      heading: `${platform} Listing`,
      content: {
        listing_title: phase3.listing_title,
        listing_description: phase3.listing_description,
        keywords: phase3.keywords,
        platform_cta: phase3.platform_cta,
        seo_meta_description: phase3.seo_meta_description,
        price_min: phase1.price_min,
        price_max: phase1.price_max,
        cta: phase1.cta,
      }
    };

    const finalBlocks = [...phase2.product_blocks, listingBlock];

    // Final save with everything
    await base44.asServiceRole.entities.Product.update(productId, {
      generated_data: { ...phase1, ...phase2, ...phase3, ...phase4, product_blocks: finalBlocks },
      status: 'ready',
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('enrichProduct error:', error.message);
    // Even on error, mark as ready so user isn't stuck forever
    try {
      const base44 = createClientFromRequest(req);
      const { productId } = await req.clone().json().catch(() => ({}));
      if (productId) {
        await base44.asServiceRole.entities.Product.update(productId, { status: 'ready' });
      }
    } catch {}
    return Response.json({ error: error.message }, { status: 500 });
  }
});