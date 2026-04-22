import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Preset content instructions per product type ──────────────────────────
const contentInstructions = {
  'Planner': `Write 4 complete, immediately usable planner pages:
PAGE 1 — How to Use: 5 clear bullet instructions for getting the most from this planner.
PAGE 2 — Monthly Overview: Month name header, 4-week goal column, habits to track (5 rows), monthly focus statement.
PAGE 3 — Weekly Planner: 5-day columns, each with Top Priority, Top 3 Tasks, Time Blocks (morning/afternoon/evening), Energy Check 1-5.
PAGE 4 — Daily Action Page: Date, Today's #1 goal, 6 time-blocked task slots (with duration), water tracker, evening win + reflection.
BONUS — Habit Tracker Grid: 31-day grid for 5 habits with streak counter.`,

  'Checklist': `Write 3 complete, actionable checklists with 10-12 items each:
CHECKLIST 1 — Pre-Phase: Specific prep steps that must be done BEFORE starting (start each with a verb).
CHECKLIST 2 — During: Specific steps to follow WHILE executing the main activity.
CHECKLIST 3 — Post-Phase Review: Steps for review, iteration, and follow-up after completion.
BONUS — Quick Reference Summary: 5 most critical reminders in a compact format.`,

  'Tracker': `Write 3 complete tracking pages:
TRACKER 1 — Daily Log: Date field, 5-6 specific metric fields for this niche, notes column, 1-5 rating, mood emoji.
TRACKER 2 — Weekly Summary: 7-day totals table, weekly average, biggest win, biggest obstacle, score trend (up/flat/down).
TRACKER 3 — Monthly Progress: Monthly totals, milestone achieved (yes/no), personal best this month, streak count, next month's focus.
BONUS — Progress Visualization: Simple graph template with instructions for plotting key metric over 12 weeks.`,

  'Workbook': `Write 2 complete, deep workbook modules:
MODULE 1 — Foundation: Core concept explanation (2 paragraphs), self-assessment quiz (5 questions with reflection space), key insight framework (3-step with examples), action assignment with accountability prompt.
MODULE 2 — Application: Real scenario example relevant to this niche, step-by-step implementation exercise (5 steps), 3 deep reflection questions with guided response space, accountability checkpoint with success criteria.
BONUS — Cheat Sheet: One-page summary of the entire workbook's core framework.`,

  'Journal': `Write 3 complete journal page templates with guided prompts:
PAGE 1 — Morning Intention: Date field, gratitude prompt (3 lines), today's intention, one word to embody, energy level check, #1 focus.
PAGE 2 — Midday Check-In: Progress check prompt, energy management note, pivot moment (what needs adjusting?), self-compassion reminder.
PAGE 3 — Evening Reflection: 3 wins today (small counts), what I learned, how I felt overall, one thing to release, tomorrow's intention.
BONUS — Weekly Reflection Spread: What went well, what was hard, rating 1-10, one lesson, next week's focus word.`,

  'Prompt Pack': `Write 3 prompt categories with 5 prompts each (prompts must be immediately usable, detailed, and specific):
CATEGORY 1 — Foundation Prompts: Brief intro, then 5 detailed prompts that cover core use cases for this niche and audience.
CATEGORY 2 — Deep-Dive Prompts: Brief intro, then 5 prompts for more complex tasks, strategy, or advanced workflows.
CATEGORY 3 — Advanced / Chain Prompts: Brief intro, then 5 multi-step or chained prompts for power users.
BONUS — 3 Fill-in-the-Blank prompt templates with [VARIABLE] style placeholders for quick customization.`,

  'Mini Ebook': `Write Chapters 1 and 2 fully:
CHAPTER 1 — Introduction: Compelling hook story (2 paragraphs), core problem statement, why current solutions fail, what reader will gain.
CHAPTER 2 — Core Framework: Main concept explained clearly, 3-step framework with each step detailed (2 paragraphs each), real-world niche-specific example, common mistake to avoid, chapter action step.
BONUS — Key Takeaways box: 5 bullet points summarizing the entire book's core value.`,

  'Template Pack': `Write 4 FULLY COMPLETE, ready-to-use templates. Each template must include:
- Template title and who it's for
- Step-by-step usage instructions (3-5 steps)
- The FULL TEMPLATE BODY with all fields, sections, and [VARIABLE] placeholders filled out
- A COMPLETED EXAMPLE with realistic niche-specific data already filled in
- A PRO TIP for advanced customization
Templates must be distinct — different formats, different use cases.`,
};

// ── Niche content guide ───────────────────────────────────────────────────
const nicheGuide = {
  'Productivity':  'action-oriented, efficiency-focused, time-aware language. Examples: time blocking, task batching, weekly reviews.',
  'Fitness':       'energetic, habit-based, measurable language. Examples: workout logs, rep tracking, progress photos, macros.',
  'Self-care':     'warm, gentle, reflective language. Examples: mood check-ins, self-compassion exercises, boundary setting.',
  'Business':      'practical, results-focused, strategic language. Examples: client workflows, revenue tracking, pitch frameworks.',
  'Budgeting':     'clear, numbers-forward, motivating language. Examples: expense logs, savings goals, debt payoff trackers.',
  'Moms':          'warm, practical, time-saving language. Examples: school schedules, meal planning, family routines.',
  'Students':      'clear, structured, encouraging language. Examples: study schedules, assignment trackers, exam prep.',
  'Freelancers':   'professional, productivity-driven language. Examples: client onboarding, project timelines, invoice templates.',
  'Coaches':       'empowering, framework-driven language. Examples: discovery sessions, goal mapping, accountability systems.',
  'Creators':      'creative, strategic, growth-minded language. Examples: content calendars, engagement strategies, brand voice.',
  'Wellness':      'gentle, mindful, body-positive language. Examples: sleep logs, breathwork, gratitude journaling.',
  'Organization':  'clear, logical, systematic language. Examples: home organization, digital filing, declutter checklists.',
};

// ── Block type per product type ───────────────────────────────────────────
const blockTypeMap = {
  'Planner':       'section',
  'Checklist':     'checklist',
  'Tracker':       'section',
  'Workbook':      'worksheet',
  'Journal':       'worksheet',
  'Prompt Pack':   'prompt',
  'Mini Ebook':    'section',
  'Template Pack': 'section',
};

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
    const contentGuide = contentInstructions[productType] || 'Write 4 complete, premium, immediately usable sections of content.';
    const nicheContext = nicheGuide[niche] || 'practical, clear, useful language with actionable steps.';
    const blockType = blockTypeMap[productType] || 'section';

    // ── PHASE 2: Structured content generation ────────────────────────────
    console.log(`[enrichProduct] Phase 2: content for ${productType} / ${niche}`);

    const phase2raw = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert digital product content writer. Write COMPLETE, DETAILED, IMMEDIATELY USABLE content for a paid digital product.

PRODUCT: "${phase1.title}"
TYPE: ${productType} | NICHE: ${niche} | TONE: ${tone} | PLATFORM: ${platform}
AUDIENCE: ${phase1.audience}
PROMISE: ${phase1.promise}

NICHE LANGUAGE STYLE: Use ${nicheContext}

CONTENT REQUIREMENTS (follow exactly):
${contentGuide}

RULES:
- Write actual finished content — no placeholders, no "add your own" instructions
- Every sentence must be specific to the ${niche} niche and useful to the audience
- Use ${tone} tone consistently
- Use markdown formatting: ## headers, **bold**, numbered lists, bullet points
- Content must be ready to put directly into the product — not a draft or outline

Return ONLY valid JSON:
{
  "content_draft": "FULL formatted product content using markdown",
  "sections": [
    { "title": "Section title", "body": "Full written section body — complete, specific, usable" },
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
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: { title: { type: 'string' }, body: { type: 'string' } }
            }
          }
        }
      }
    });

    const finalSections = phase2raw.sections || [];
    const finalContentDraft = phase2raw.content_draft || '';

    const sectionBlocks = finalSections.map((sec, i) => ({
      id: String(3 + i),
      type: blockType,
      heading: sec.title || `Section ${i + 1}`,
      content: {
        title: sec.title,
        body: sec.body,
        items: sec.body
          ? sec.body.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•')).map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
          : [],
        prompts: sec.body
          ? sec.body.split('\n').filter(l => /^\d+\./.test(l.trim())).map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)
          : [],
      }
    }));

    const tocItems = finalSections.map(s => s.title).filter(Boolean);

    const phase2 = {
      content_draft: finalContentDraft,
      product_blocks: [
        { id: '1', type: 'cover', heading: 'Cover', content: { title: phase1.title, subtitle: phase1.subtitle, promise: phase1.promise, audience: phase1.audience } },
        { id: '2', type: 'toc', heading: 'Contents', content: { items: tocItems } },
        ...sectionBlocks,
        { id: String(Date.now() + 1), type: 'notes', heading: 'Notes', content: { title: 'Your Notes', lines: 12 } },
      ]
    };

    // Save phase 2
    await base44.asServiceRole.entities.Product.update(productId, {
      generated_data: { ...phase1, ...phase2 },
    });

    // ── PHASE 3: SEO listing copy ─────────────────────────────────────────
    console.log(`[enrichProduct] Phase 3: SEO listing for ${platform}`);

    const phase3 = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a world-class SEO copywriter for ${platform} digital products.

PRODUCT: "${phase1.title}"
TYPE: ${productType} | NICHE: ${niche} | TONE: ${tone}
AUDIENCE: ${phase1.audience}
PROMISE: ${phase1.promise}
SELLING ANGLE: ${phase1.selling_angle}
BENEFITS: ${(phase1.benefits || []).slice(0, 4).join(' | ')}
PRICE: $${phase1.price_min}–$${phase1.price_max}

Write platform-optimized copy ready to paste directly into ${platform}:

1. LISTING TITLE: Front-load the #1 buyer-intent keyword. Include product type + core benefit + audience. Max 140 chars.

2. LISTING DESCRIPTION (180-220 words):
   - Hook: Name the exact pain or desire (1-2 sentences)
   - Problem agitation: What they've tried, why it failed
   - Product reveal: What this IS and exactly DOES
   - Benefits (4 items starting with ✓): Concrete outcomes
   - What's included: Format, page count, deliverable
   - CTA: Specific action with urgency

3. SEO KEYWORDS: 15 buyer-intent search terms (3 broad, 7 mid-tail, 5 long-tail)

4. PLATFORM CTA: The single most compelling CTA phrase for ${platform}

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

    // Final save
    await base44.asServiceRole.entities.Product.update(productId, {
      generated_data: {
        ...phase1,
        ...phase2,
        ...phase3,
        product_blocks: finalBlocks,
      },
      status: 'ready',
    });

    console.log(`[enrichProduct] Done — product ${productId} is ready.`);
    return Response.json({ success: true });

  } catch (error) {
    console.error('[enrichProduct] Error:', error.message);
    try {
      const base44 = createClientFromRequest(req);
      const body = await req.clone().json().catch(() => ({}));
      if (body.productId) {
        await base44.asServiceRole.entities.Product.update(body.productId, { status: 'ready' });
      }
    } catch {}
    return Response.json({ error: error.message }, { status: 500 });
  }
});