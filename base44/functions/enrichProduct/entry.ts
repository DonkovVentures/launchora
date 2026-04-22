import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── DEEP CONTENT BLUEPRINTS ────────────────────────────────────────────────
// Each type gets a full structural prescription — AI fills it, doesn't invent it.

const contentBlueprint = {
  'Workbook': `You are writing a COMPLETE, PREMIUM, SELLABLE workbook. Not a draft. Not an outline. A finished product.

REQUIRED STRUCTURE — write ALL 5 modules fully. Each module must have:
  • A clear intro paragraph (2-3 sentences explaining what this module covers and why it matters)
  • A core concept section (3-4 paragraphs of practical, niche-specific guidance)
  • A self-assessment or reflection exercise (3-5 guided questions with answer space prompts)
  • A step-by-step action exercise (numbered, 4-6 steps, each with concrete instructions)
  • A worksheet or fill-in template (labeled fields, lines, or tables ready to fill out)
  • A module summary (3 key takeaways)

MODULE 1: Foundation & Mindset — What beliefs, habits, and starting conditions matter most
MODULE 2: Core Framework — The central system or method this workbook teaches
MODULE 3: Implementation — How to actually apply the framework day-to-day
MODULE 4: Troubleshooting & Obstacles — Common challenges and how to overcome them
MODULE 5: Momentum & Sustainability — How to keep going, track progress, build long-term habits

BONUS SECTION: Quick-Start Cheat Sheet — One-page summary of the most important steps and frameworks

RULES:
- Every exercise must be immediately usable — real fields, real prompts, real structure
- No generic filler phrases like "write your thoughts here" — give SPECIFIC guided prompts
- Content must be deeply specific to the niche — not interchangeable with any other workbook
- Minimum 800 words of actual content per module`,

  'Planner': `You are writing a COMPLETE, PREMIUM, SELLABLE planner. Not a template. A finished product.

REQUIRED SECTIONS — write ALL fully:
  
HOW TO USE: 6 clear, specific instructions for maximizing this planner's value. Real tips, not generic.

MONTHLY OVERVIEW PAGE:
  • Month + Year header field
  • Monthly intention (fill-in prompt)
  • Top 3 goals for the month (labeled fields)
  • Habit tracker grid: 5 specific habits (name them based on the niche) × 31 days
  • Monthly focus word + why
  • Budget snapshot (if relevant to niche)
  • End-of-month reflection: What went well, what to improve

WEEKLY PLANNING PAGE (write a full template):
  • Week dates header
  • This week's #1 priority
  • Monday–Friday columns with: Top task, 3 additional tasks, Time blocks (AM/PM/Evening), Energy level 1-5
  • Weekend section: Rest + catch-up tasks
  • Weekly theme or intention
  • End-of-week wins (3 lines)

DAILY ACTION PAGE (write a full template):
  • Date + day of week
  • Today's #1 non-negotiable goal
  • Morning ritual checklist (5 items, niche-specific)
  • Time-blocked schedule: 6am–10pm in 1-hour blocks
  • Top 3 tasks with priority labels (A/B/C)
  • Water tracker (8 cups)
  • Mood check-in (morning and evening)
  • Evening reflection: Win of the day, one thing to release, tomorrow's focus

HABIT TRACKER PAGE:
  • 31-day grid
  • 8 habit slots with name and daily checkbox
  • Streak counter column
  • Monthly total column
  • Notes section

BONUS: Goal Setting Page — 90-day goal map with milestones, obstacles, and accountability prompts`,

  'Checklist': `You are writing a COMPLETE, PREMIUM, SELLABLE checklist pack. Finished and immediately usable.

REQUIRED CHECKLISTS — write ALL 4 fully with 12-15 items each:

CHECKLIST 1 — PREPARATION PHASE:
  • Title specific to the niche task
  • Intro: What to do before you start (1 paragraph)
  • 12-15 specific, actionable checklist items (each starts with a strong verb)
  • Each item should have a 1-line explanation of WHY it matters
  • Pro tip at the bottom

CHECKLIST 2 — EXECUTION PHASE:
  • Title specific to the main activity
  • 12-15 specific steps to follow during the activity
  • Items grouped into 2-3 logical sub-phases
  • Common mistake to watch for after each group

CHECKLIST 3 — REVIEW & CLOSE-OUT:
  • Title for the review/wrap-up phase
  • 10-12 items for reviewing, documenting, and following up
  • Quality check questions (3-4 yes/no checks)
  • Completion confirmation prompt

CHECKLIST 4 — QUICK REFERENCE CARD:
  • Top 10 most critical reminders (ultra-condensed)
  • Format: printable card layout
  • Emergency "what do I do if X goes wrong" answers for top 3 scenarios

BONUS: Troubleshooting Guide — 5 common problems with step-by-step solutions`,

  'Tracker': `You are writing a COMPLETE, PREMIUM, SELLABLE tracker. Every page must be filled out and ready to use.

REQUIRED TRACKING PAGES — write ALL fully:

DAILY LOG PAGE:
  • Date + Day field
  • 6-8 specific metric fields (name them for the niche — not generic)
  • Each metric: label, unit of measurement, target vs actual columns
  • Notes field (for context)
  • Mood/energy rating 1-10
  • Daily win (1 line)
  • One thing to improve tomorrow

WEEKLY SUMMARY PAGE:
  • Week number + date range
  • 7-day totals table for each metric (rows = metrics, columns = days)
  • Weekly average for each metric
  • Best day highlight
  • Trend indicator (up / stable / down) per metric
  • Biggest win this week
  • Biggest obstacle and how I handled it
  • Consistency score (% of days on track)
  • Next week's focus

MONTHLY PROGRESS PAGE:
  • Month + Year
  • Monthly totals for all metrics
  • Personal best this month (per metric)
  • Milestone reached? (yes/no + which one)
  • Streak record
  • Month-over-month comparison (this month vs last)
  • Monthly reflection: 3 wins, 1 lesson, 1 commitment for next month

PROGRESS VISUALIZATION PAGE:
  • Blank chart template with labeled axes (specific to niche metrics)
  • Instructions for plotting the main metric over 12 weeks
  • Trend analysis guide (how to read your progress)
  • Space for written analysis

BONUS: Habit & Streak Tracker — 90-day grid for 5 core habits with streak counter and milestone rewards`,

  'Journal': `You are writing a COMPLETE, PREMIUM, SELLABLE guided journal. Every page must have real, deep prompts.

REQUIRED JOURNAL SECTIONS — write ALL fully:

MORNING INTENTION PAGES (write 2 full example pages):
  • Date + Day
  • Gratitude prompt: "Today I am grateful for... (3 specific things)"
  • Intention: "My intention for today is..."
  • One word to embody today:
  • Morning energy check (1-10) + what's affecting it
  • Today's non-negotiable:
  • What would make today a 10/10:
  • Morning affirmation (niche-specific, write it out)

MIDDAY CHECK-IN PAGES (write 2 full example pages):
  • Time of check-in
  • Energy level now vs morning:
  • Am I on track with my intention? (yes/no + reflection)
  • What's working:
  • What's draining me:
  • One pivot I can make right now:
  • Midday reset prompt (2-3 sentence guided reflection)
  • Self-compassion reminder (niche-specific phrase)

EVENING REFLECTION PAGES (write 2 full example pages):
  • 3 wins today (small counts!): 1. 2. 3.
  • One thing I'm releasing tonight:
  • What I learned today:
  • How I felt overall (1-10 + 1 word):
  • Gratitude for a challenge:
  • Tomorrow's one focus:
  • Evening wind-down ritual (5 niche-specific steps)

WEEKLY REFLECTION SPREAD (write 1 full example):
  • Week in review: What went well, what was hard
  • Consistency rating 1-10 + why
  • Key lesson this week:
  • One thing I want to do differently:
  • Next week's focus word and why:
  • Celebration prompt: "I am proud that I..."

BONUS: Monthly Intention-Setting Page + Yearly Reflection Template`,

  'Prompt Pack': `You are writing a COMPLETE, PREMIUM, SELLABLE AI prompt pack. Every prompt must be immediately usable and deeply specific.

REQUIRED PROMPT CATEGORIES — write ALL 3 with 7 prompts each:

CATEGORY 1 — FOUNDATION PROMPTS:
  Brief intro: Who these prompts are for and when to use them (2-3 sentences)
  7 prompts, each formatted as:
    PROMPT TITLE: [name]
    USE CASE: [when to use this]
    THE PROMPT: [full, detailed, ready-to-paste prompt with [VARIABLES] clearly marked]
    EXAMPLE OUTPUT: [2-3 sentences showing what good output looks like]

CATEGORY 2 — DEEP-DIVE PROMPTS:
  Brief intro: Advanced use cases (2-3 sentences)
  7 prompts following the same format as above but for more complex tasks

CATEGORY 3 — POWER CHAIN PROMPTS:
  Brief intro: Multi-step prompt workflows (2-3 sentences)
  7 prompts, each being a 2-3 step chain where output of Step 1 feeds into Step 2

BONUS SECTION:
  • 5 Fill-in-the-Blank prompt templates with [VARIABLE] placeholders
  • Prompt Customization Guide: How to adapt any prompt for different audiences/contexts
  • Troubleshooting Guide: What to do when prompts don't give good output (5 tips)`,

  'Mini Ebook': `You are writing a COMPLETE, PREMIUM, SELLABLE mini ebook. Every chapter must be fully written.

REQUIRED CHAPTERS — write ALL 4 fully:

INTRODUCTION (600+ words):
  • Hook: A compelling opening story or scenario specific to the niche (2 paragraphs)
  • The core problem this book solves (clearly stated)
  • Why existing solutions fail (3 specific reasons)
  • What the reader will learn and gain (bullet list, 5 items)
  • How to use this book (3-4 instructions)
  • Author's promise to the reader

CHAPTER 1: THE CORE CONCEPT (800+ words):
  • Chapter title relevant to the niche
  • Opening quote or principle
  • Main concept explained (3-4 paragraphs, concrete and specific)
  • Why most people misunderstand this
  • Real example from the niche (3 paragraphs, specific scenario)
  • Key principle box: "Remember this: [2-3 sentence core takeaway]"
  • Chapter action step (specific, achievable)

CHAPTER 2: THE FRAMEWORK (800+ words):
  • Framework name and overview
  • Step 1: [Name] — 2-3 paragraphs explaining and illustrating
  • Step 2: [Name] — 2-3 paragraphs
  • Step 3: [Name] — 2-3 paragraphs
  • Common mistake at each step + how to avoid it
  • Case study: Someone applying this framework (specific, niche-relevant)
  • Chapter action step

CHAPTER 3: IMPLEMENTATION (700+ words):
  • The 30-day jumpstart plan (week by week)
  • Daily practice template (what to do each day)
  • How to troubleshoot the top 3 obstacles
  • Measuring progress: What to track and how
  • Chapter action step

KEY TAKEAWAYS & NEXT STEPS:
  • 7 core lessons from the book (bulleted, specific)
  • What to do in the next 24 hours (5 concrete actions)
  • Resources and further learning
  • Closing encouragement (1 paragraph, warm and specific)

BONUS: Quick Reference Guide — 1-page cheat sheet with the framework, steps, and key reminders`,

  'Template Pack': `You are writing a COMPLETE, PREMIUM, SELLABLE template pack. Every template must be fully built out and ready to use.

REQUIRED TEMPLATES — write ALL 4 fully:

For EACH template, include:
  1. TEMPLATE NAME & PURPOSE: Who it's for, what problem it solves
  2. WHEN TO USE IT: Specific scenarios and timing
  3. HOW TO USE IT: Step-by-step instructions (5 steps)
  4. THE COMPLETE TEMPLATE: All sections, fields, labels, and placeholder text — fully structured and ready to copy-paste
  5. WORKED EXAMPLE: The template filled out with realistic, niche-specific data
  6. PRO CUSTOMIZATION TIPS: 3 ways to adapt this template for different situations
  7. COMMON MISTAKES: 2-3 errors people make with this type of template + how to avoid them

Templates must serve DIFFERENT use cases within the niche — no overlap.
Each template should be substantive: minimum 15 distinct fields or sections.`,
};

// ── NICHE LANGUAGE STYLE ──────────────────────────────────────────────────
const nicheStyle = {
  'Productivity':  'action-oriented, efficiency-first. Use words like: systemize, batch, optimize, streamline, execute.',
  'Fitness':       'energetic, results-focused. Use words like: crush, build, track, progress, commit, recover, fuel.',
  'Self-care':     'warm, affirming, gentle. Use words like: nurture, restore, honor, release, accept, soften, breathe.',
  'Business':      'sharp, strategic, ROI-focused. Use words like: leverage, convert, scale, systematize, delegate, close.',
  'Budgeting':     'clear, empowering, number-friendly. Use words like: allocate, save, eliminate, automate, track, grow.',
  'Moms':          'warm, practical, real-talk. Use words like: simplify, sanity, routine, family, balance, quick win.',
  'Students':      'clear, encouraging, structured. Use words like: focus, retain, review, manage, understand, prepare.',
  'Freelancers':   'professional, client-focused. Use words like: proposal, onboard, invoice, scope, deliver, retain.',
  'Coaches':       'transformational, framework-driven. Use words like: shift, breakthrough, accountability, vision, framework.',
  'Creators':      'creative, growth-focused. Use words like: engage, grow, batch, repurpose, brand, audience, monetize.',
  'Wellness':      'holistic, body-positive, mindful. Use words like: nourish, rest, listen, align, restore, flow.',
  'Organization':  'logical, systematic, calm. Use words like: categorize, clear, label, store, simplify, declutter.',
};

// ── BLOCK TYPE MAP ─────────────────────────────────────────────────────────
const blockTypeMap = {
  'Planner': 'section', 'Checklist': 'checklist', 'Tracker': 'section',
  'Workbook': 'worksheet', 'Journal': 'worksheet', 'Prompt Pack': 'prompt',
  'Mini Ebook': 'section', 'Template Pack': 'section',
};

// ── PLATFORM GUIDE BLUEPRINT ───────────────────────────────────────────────
const platformContext = {
  'Etsy':            'visual-first marketplace, craft/print audience, search-driven discovery, buyers want printables and planners',
  'Gumroad':         'creator economy platform, direct audience, buyers are professionals and learners seeking niche expertise',
  'Creative Market': 'design-forward marketplace, buyers are designers and creatives, premium aesthetic standards expected',
  'Teachable':       'course platform, buyers expect structured learning paths, transformation-focused positioning works best',
  'Payhip':          'digital download store, versatile audience, good for niche communities and direct sales',
};

// ── VALIDATION HELPER ──────────────────────────────────────────────────────
function validatePhase1(p1) {
  const required = ['title', 'subtitle', 'promise', 'audience', 'buyer_profile',
    'selling_angle', 'benefits', 'structure', 'price_min', 'price_max',
    'visual_direction', 'cover_concept', 'cta'];
  const missing = required.filter(k => {
    const v = p1[k];
    if (!v) return true;
    if (Array.isArray(v) && v.length === 0) return true;
    if (typeof v === 'string' && v.trim() === '') return true;
    return false;
  });
  return missing;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { productId, phase1: rawPhase1, formData } = await req.json();
    if (!productId || !rawPhase1 || !formData) {
      return Response.json({ error: 'Missing required params' }, { status: 400 });
    }

    const { productType, niche, tone, platform } = formData;
    const blueprint = contentBlueprint[productType] || contentBlueprint['Workbook'];
    const langStyle = nicheStyle[niche] || 'practical, clear, actionable';
    const blockType = blockTypeMap[productType] || 'section';
    const platContext = platformContext[platform] || 'digital marketplace with buyers seeking professional resources';

    // ── VALIDATE & PATCH phase1 if fields are missing ─────────────────────
    let phase1 = { ...rawPhase1 };
    const missingFields = validatePhase1(phase1);
    if (missingFields.length > 0) {
      console.log(`[enrichProduct] phase1 missing fields: ${missingFields.join(', ')} — patching...`);
      const patch = await base44.integrations.Core.InvokeLLM({
        prompt: `You are completing a sales profile for a digital product. Fill in ONLY the missing fields listed below. Be specific and niche-focused.

PRODUCT: "${phase1.title || 'Digital Product'}"
TYPE: ${productType} | NICHE: ${niche} | TONE: ${tone}
EXISTING DATA: ${JSON.stringify({ title: phase1.title, subtitle: phase1.subtitle, promise: phase1.promise })}

MISSING FIELDS TO COMPLETE: ${missingFields.join(', ')}

Return ONLY the missing fields as valid JSON. Every field must be non-empty.
For benefits: array of 5 strings. For structure: array of section names. For price_min/price_max: numbers.`,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' }, subtitle: { type: 'string' }, promise: { type: 'string' },
            audience: { type: 'string' }, buyer_profile: { type: 'string' }, selling_angle: { type: 'string' },
            benefits: { type: 'array', items: { type: 'string' } },
            structure: { type: 'array', items: { type: 'string' } },
            price_min: { type: 'number' }, price_max: { type: 'number' },
            visual_direction: { type: 'string' }, cover_concept: { type: 'string' }, cta: { type: 'string' },
          }
        }
      });
      phase1 = { ...phase1, ...patch };
    }

    // Ensure price fields are valid numbers
    phase1.price_min = Number(phase1.price_min) || 17;
    phase1.price_max = Number(phase1.price_max) || 37;

    // ── STAGE 1: DEEP CONTENT GENERATION ──────────────────────────────────
    console.log(`[enrichProduct] Stage 1: deep content for ${productType} / ${niche}`);

    const contentResult = await base44.integrations.Core.InvokeLLM({
      prompt: `${blueprint}

═══════════════════════════════════════
PRODUCT CONTEXT (use throughout — make every word specific to this):
- Product Title: "${phase1.title}"
- Type: ${productType}
- Niche: ${niche}
- Target Audience: ${phase1.audience}
- Core Promise: ${phase1.promise}
- Tone: ${tone}
- Language style: ${langStyle}
- Platform: ${platform}
═══════════════════════════════════════

ABSOLUTE RULES:
1. Write COMPLETE, FINISHED content — not outlines, not drafts, not placeholders
2. Every exercise, prompt, field, and section must be FULLY written out
3. Be deeply specific to "${niche}" — content must not be reusable for other niches
4. Maintain "${tone}" tone throughout — every sentence
5. Write as if this is the FINAL PRODUCT the customer downloads and uses immediately
6. Include actual worksheet fields, actual prompts, actual templates — not descriptions of them

Return JSON with these fields:
{
  "content_draft": "Complete markdown-formatted product content (all sections combined, minimum 2000 words)",
  "sections": [
    {
      "title": "Exact section title",
      "body": "Complete written content for this section (minimum 200 words, fully written out)"
    }
  ]
}

The sections array must follow the product structure. Write EVERY section fully.`,
      model: 'claude_sonnet_4_6',
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

    const sections = contentResult.sections || [];
    const contentDraft = contentResult.content_draft || sections.map(s => `## ${s.title}\n\n${s.body}`).join('\n\n');

    // Build product blocks
    const sectionBlocks = sections.map((sec, i) => ({
      id: String(3 + i),
      type: blockType,
      heading: sec.title || `Section ${i + 1}`,
      content: {
        title: sec.title,
        body: sec.body,
        items: sec.body
          ? sec.body.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•') || l.trim().startsWith('☐') || l.trim().startsWith('□')).map(l => l.replace(/^[-•☐□]\s*/, '').trim()).filter(Boolean)
          : [],
        prompts: sec.body
          ? sec.body.split('\n').filter(l => /^\d+\./.test(l.trim())).map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)
          : [],
      }
    }));

    const tocItems = sections.map(s => s.title).filter(Boolean);

    const productBlocks = [
      { id: '1', type: 'cover', heading: 'Cover', content: { title: phase1.title, subtitle: phase1.subtitle, promise: phase1.promise, audience: phase1.audience } },
      { id: '2', type: 'toc', heading: 'Contents', content: { items: tocItems } },
      ...sectionBlocks,
      { id: String(Date.now() + 1), type: 'notes', heading: 'Notes', content: { title: 'Your Notes', lines: 12 } },
    ];

    // ── SAVE after Stage 1 — user sees content immediately ────────────────
    await base44.asServiceRole.entities.Product.update(productId, {
      generated_data: { ...phase1, content_draft: contentDraft, product_blocks: productBlocks, _progress: 'Building sales copy & platform guide...' },
    });
    console.log(`[enrichProduct] Stage 1 saved — ${sections.length} sections. Starting Stage 2+3 in parallel.`);

    // ── STAGES 2 + 3: RUN IN PARALLEL ─────────────────────────────────────
    const [salesResult, guideResult] = await Promise.all([

      // STAGE 2: Sales package
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

Write ALL fields. No field may be empty.

LISTING TITLE (max 140 chars): Front-load the #1 buyer keyword. Include type + benefit + audience signal.

LISTING DESCRIPTION (200-250 words, structured):
Line 1: Bold hook — name the exact pain or desire
Lines 2-4: Problem agitation — what they've tried, why it hasn't worked
Lines 5-7: Product reveal — what this IS and DOES in concrete terms
Lines 8-12: Benefits (5 items starting with ✓) — specific outcomes, not features
Lines 13-15: What's included — format, size, instant download
Lines 16-18: Social proof signal + urgency CTA

KEYWORDS: 15 buyer-intent search phrases (mix of broad, mid-tail, and long-tail)
PLATFORM CTA: Most compelling action phrase for ${platform} buyers
SEO META DESCRIPTION (150-160 chars): Include primary keyword + benefit

Return ONLY valid JSON:
{
  "listing_title": "...",
  "listing_description": "...",
  "keywords": ["...", "..."],
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
      }),

      // STAGE 3: Platform guide
      base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert in selling digital products on ${platform}. Write a complete, practical launch guide.

PRODUCT: "${phase1.title}" (${productType} for ${niche})
PRICE: $${phase1.price_min}–$${phase1.price_max}
PLATFORM: ${platform} — ${platContext}
AUDIENCE: ${phase1.audience}

Write ALL sections fully. No placeholders. Specific, actionable, platform-specific content only.

WHY_THIS_PLATFORM (150 words): Why ${platform} is right for this product — buyer behavior, search habits, purchasing patterns.
PLATFORM_AUDIENCE (100 words): Who shops on ${platform} for this — demographics, motivations, what they search.
PRICING_STRATEGY (150 words): Launch price, evergreen price, bundle pricing, discounting strategy.
THUMBNAIL_GUIDANCE (150 words): Exact cover/thumbnail spec — colors, text, font, imagery, platform size requirements.
LAUNCH_PLAN (200 words): Specific 30-day launch sequence — launch day, week 1, weeks 2-4, month 2.
PRO_TIPS: 6 specific actionable tips for this product type on ${platform}.
MISTAKES_TO_AVOID: 5 specific mistakes + how to avoid each.

Return ONLY valid JSON:
{
  "why_this_platform": "...",
  "platform_audience": "...",
  "pricing_strategy": "...",
  "thumbnail_guidance": "...",
  "launch_plan": "...",
  "pro_tips": ["tip 1","tip 2","tip 3","tip 4","tip 5","tip 6"],
  "mistakes_to_avoid": ["mistake 1","mistake 2","mistake 3","mistake 4","mistake 5"]
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

    ]);

    // Build listing block
    const listingBlock = {
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

    const finalBlocks = [...productBlocks, listingBlock];

    // ── FINAL SAVE — all data at top level for easy export access ──────────
    const finalData = {
      // From phase1 (blueprint)
      title: phase1.title,
      subtitle: phase1.subtitle,
      promise: phase1.promise,
      audience: phase1.audience,
      format: phase1.format,
      structure: phase1.structure,
      benefits: phase1.benefits,
      selling_angle: phase1.selling_angle,
      price_min: phase1.price_min,
      price_max: phase1.price_max,
      price_rationale: phase1.price_rationale,
      buyer_profile: phase1.buyer_profile,
      cta: phase1.cta,
      visual_direction: phase1.visual_direction,
      cover_concept: phase1.cover_concept,
      // From stage 1 (content)
      content_draft: contentDraft,
      // From stage 2 (sales)
      listing_title: salesResult.listing_title,
      listing_description: salesResult.listing_description,
      keywords: salesResult.keywords,
      platform_cta: salesResult.platform_cta,
      seo_meta_description: salesResult.seo_meta_description,
      // From stage 3 (platform guide)
      platform_guidance: guideResult,
      // Blocks
      product_blocks: finalBlocks,
      _progress: null,
    };

    await base44.asServiceRole.entities.Product.update(productId, {
      generated_data: finalData,
      status: 'ready',
    });

    console.log(`[enrichProduct] Done — product ${productId} ready. ${sections.length} sections generated.`);
    return Response.json({ success: true });

  } catch (error) {
    console.error('[enrichProduct] Error:', error.message);
    try {
      const { productId } = await req.clone().json().catch(() => ({}));
      if (productId) {
        await base44.asServiceRole.entities.Product.update(productId, { status: 'ready' });
      }
    } catch {}
    return Response.json({ error: error.message }, { status: 500 });
  }
});