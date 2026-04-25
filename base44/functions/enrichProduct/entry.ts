import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildStructuredUpdate(phase1, contentResult, salesResult, guideResult, productBlocks) {
  return {
    title: phase1.title,
    subtitle: phase1.subtitle,
    promise: phase1.promise,
    target_audience: phase1.audience,
    buyer_profile: phase1.buyer_profile,
    product_angle: phase1.selling_angle,
    sections: contentResult.sections || [],
    pages: productBlocks,
    checklist_items: phase1.benefits || [],
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
    },
    platform_guides: guideResult,
    visual_style: {
      cover_concept: phase1.cover_concept,
      visual_direction: phase1.visual_direction,
    },
  };
}

async function updateProgress(base44, productId, generationStatus, progressPatch) {
  try {
    const product = await base44.asServiceRole.entities.Product.get(productId);
    const current = product.generationProgress || {};
    await base44.asServiceRole.entities.Product.update(productId, {
      generationStatus,
      generationProgress: { ...current, ...progressPatch },
    });
  } catch (e) {
    console.error('[enrichProduct] updateProgress failed:', e.message);
  }
}

// ── DEEP CONTENT BLUEPRINTS ────────────────────────────────────────────────
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
HOW TO USE: 6 clear, specific instructions for maximizing this planner's value.

MONTHLY OVERVIEW PAGE:
  • Month + Year header field
  • Monthly intention (fill-in prompt)
  • Top 3 goals for the month (labeled fields)
  • Habit tracker grid: 5 specific habits × 31 days
  • Monthly focus word + why
  • End-of-month reflection: What went well, what to improve

WEEKLY PLANNING PAGE (write a full template):
  • Week dates header
  • This week's #1 priority
  • Monday–Friday columns with: Top task, 3 tasks, Time blocks, Energy level 1-5
  • Weekend section: Rest + catch-up tasks
  • End-of-week wins (3 lines)

DAILY ACTION PAGE (write a full template):
  • Date + day of week
  • Today's #1 non-negotiable goal
  • Morning ritual checklist (5 items, niche-specific)
  • Time-blocked schedule: 6am–10pm in 1-hour blocks
  • Top 3 tasks with priority labels (A/B/C)
  • Evening reflection: Win of the day, one thing to release, tomorrow's focus

HABIT TRACKER PAGE:
  • 31-day grid
  • 8 habit slots with name and daily checkbox
  • Streak counter column

BONUS: Goal Setting Page — 90-day goal map with milestones and accountability prompts`,

  'Checklist': `You are writing a COMPLETE, PREMIUM, SELLABLE checklist pack. Finished and immediately usable.

REQUIRED CHECKLISTS — write ALL 4 fully with 12-15 items each:

CHECKLIST 1 — PREPARATION PHASE: 12-15 specific actionable items, each with 1-line explanation.
CHECKLIST 2 — EXECUTION PHASE: 12-15 steps grouped into 2-3 sub-phases.
CHECKLIST 3 — REVIEW & CLOSE-OUT: 10-12 items with quality check questions.
CHECKLIST 4 — QUICK REFERENCE CARD: Top 10 critical reminders in printable card format.

BONUS: Troubleshooting Guide — 5 common problems with step-by-step solutions`,

  'Tracker': `You are writing a COMPLETE, PREMIUM, SELLABLE tracker. Every page must be filled out and ready to use.

REQUIRED TRACKING PAGES:
DAILY LOG PAGE: 6-8 specific metric fields, target vs actual columns, mood/energy, daily win.
WEEKLY SUMMARY PAGE: 7-day totals, best day, trend indicators, consistency score.
MONTHLY PROGRESS PAGE: Monthly totals, personal bests, milestones, month-over-month comparison.
PROGRESS VISUALIZATION PAGE: Chart template with labeled axes specific to niche metrics.

BONUS: Habit & Streak Tracker — 90-day grid for 5 core habits with milestone rewards`,

  'Journal': `You are writing a COMPLETE, PREMIUM, SELLABLE guided journal. Every page must have real, deep prompts.

REQUIRED JOURNAL SECTIONS:
MORNING INTENTION PAGES (2 full examples): Gratitude, intention, energy check, non-negotiable, affirmation.
MIDDAY CHECK-IN PAGES (2 full examples): Energy update, on-track check, self-compassion reminder.
EVENING REFLECTION PAGES (2 full examples): 3 wins, lessons, mood rating, tomorrow's focus.
WEEKLY REFLECTION SPREAD (1 full example): Review, consistency rating, key lesson, celebration prompt.

BONUS: Monthly Intention-Setting Page + Yearly Reflection Template`,

  'Prompt Pack': `You are writing a COMPLETE, PREMIUM, SELLABLE AI prompt pack. Every prompt must be immediately usable.

REQUIRED PROMPT CATEGORIES — write ALL 3 with 7 prompts each:
CATEGORY 1 — FOUNDATION PROMPTS: Each with USE CASE, THE PROMPT (with [VARIABLES]), EXAMPLE OUTPUT.
CATEGORY 2 — DEEP-DIVE PROMPTS: Advanced use cases in the same format.
CATEGORY 3 — POWER CHAIN PROMPTS: 2-3 step chains where output feeds into next step.

BONUS: 5 Fill-in-the-Blank templates + Prompt Customization Guide + Troubleshooting Guide`,

  'Mini Ebook': `You are writing a COMPLETE, PREMIUM, SELLABLE mini ebook. Every chapter must be fully written.

REQUIRED CHAPTERS:
INTRODUCTION (600+ words): Hook, core problem, why solutions fail, what reader gains, author's promise.
CHAPTER 1: THE CORE CONCEPT (800+ words): Main concept, why misunderstood, real example, key principle, action step.
CHAPTER 2: THE FRAMEWORK (800+ words): 3-step framework with mistakes at each step, case study, action step.
CHAPTER 3: IMPLEMENTATION (700+ words): 30-day plan, daily practice, troubleshooting top 3 obstacles.
KEY TAKEAWAYS: 7 core lessons, next 24 hours actions, closing encouragement.

BONUS: Quick Reference Guide — 1-page cheat sheet`,

  'Template Pack': `You are writing a COMPLETE, PREMIUM, SELLABLE template pack. Every template must be fully built.

REQUIRED TEMPLATES — write ALL 4, each with:
1. NAME & PURPOSE: Who it's for, what problem it solves
2. WHEN TO USE IT: Specific scenarios
3. HOW TO USE IT: 5-step instructions
4. THE COMPLETE TEMPLATE: All fields, labels, placeholder text — ready to copy-paste
5. WORKED EXAMPLE: Template filled with realistic niche-specific data
6. PRO CUSTOMIZATION TIPS: 3 adaptation ideas
7. COMMON MISTAKES: 2-3 errors + how to avoid them

Minimum 15 distinct fields per template. Templates must serve DIFFERENT use cases.`,
};

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

const blockTypeMap = {
  'Planner': 'section', 'Checklist': 'checklist', 'Tracker': 'section',
  'Workbook': 'worksheet', 'Journal': 'worksheet', 'Prompt Pack': 'prompt',
  'Mini Ebook': 'section', 'Template Pack': 'section',
};

const platformContext = {
  'Etsy':            'visual-first marketplace, craft/print audience, search-driven discovery, buyers want printables and planners',
  'Gumroad':         'creator economy platform, direct audience, buyers are professionals and learners seeking niche expertise',
  'Creative Market': 'design-forward marketplace, buyers are designers and creatives, premium aesthetic standards expected',
  'Teachable':       'course platform, buyers expect structured learning paths, transformation-focused positioning works best',
  'Payhip':          'digital download store, versatile audience, good for niche communities and direct sales',
};

function validatePhase1(p1) {
  const required = ['title', 'subtitle', 'promise', 'audience', 'buyer_profile',
    'selling_angle', 'benefits', 'structure', 'price_min', 'price_max',
    'visual_direction', 'cover_concept', 'cta'];
  return required.filter(k => {
    const v = p1[k];
    if (!v) return true;
    if (Array.isArray(v) && v.length === 0) return true;
    if (typeof v === 'string' && v.trim() === '') return true;
    return false;
  });
}

// ── Main Handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let productId = null;

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { productId: pid, phase1: rawPhase1, formData, productAngle } = await req.json();
    productId = pid;

    if (!productId || !rawPhase1 || !formData) {
      return Response.json({ error: 'Missing required params' }, { status: 400 });
    }

    const { productType, niche, tone, platform } = formData;

    const angleContext = productAngle ? `
PRODUCT ANGLE (enforce this in every word you write):
- Exact Audience: ${productAngle.audience}
- Pain Point: ${productAngle.painPoint}
- Transformation: ${productAngle.transformation}
- Unique Mechanism: ${productAngle.uniqueMechanism}
- Emotional Hook: ${productAngle.emotionalHook}
- Positioning: ${productAngle.positioning}
- Final Angle: ${productAngle.finalAngle}

RULE: Every section, exercise, and sentence must be written for THIS specific audience and pain point. Generic content is not acceptable.
` : '';

    const blueprint = contentBlueprint[productType] || contentBlueprint['Workbook'];
    const langStyle = nicheStyle[niche] || 'practical, clear, actionable';
    const blockType = blockTypeMap[productType] || 'section';
    const platContext = platformContext[platform] || 'digital marketplace with buyers seeking professional resources';

    // ── Init state machine ────────────────────────────────────────────────────
    await base44.asServiceRole.entities.Product.update(productId, {
      generationStatus: 'generating_blueprint',
      generationProgress: {
        blueprint: 'generating',
        salesCopy: 'pending',
        platformGuides: 'pending',
        socialKit: 'pending',
        launchPlan: 'pending',
      },
    });

    // ── VALIDATE & PATCH phase1 ───────────────────────────────────────────────
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

    phase1.price_min = Number(phase1.price_min) || 17;
    phase1.price_max = Number(phase1.price_max) || 37;

    // ── STAGE 1: BLUEPRINT (DEEP CONTENT) — CRITICAL ─────────────────────────
    console.log(`[enrichProduct] Stage 1: blueprint for ${productType} / ${niche}`);
    let contentResult;
    try {
      contentResult = await base44.integrations.Core.InvokeLLM({
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
${angleContext}
═══════════════════════════════════════

ABSOLUTE RULES:
1. Write COMPLETE, FINISHED content — not outlines, not drafts, not placeholders
2. Every exercise, prompt, field, and section must be FULLY written out
3. Be deeply specific to "${niche}" — content must not be reusable for other niches
4. Maintain "${tone}" tone throughout — every sentence
5. Write as if this is the FINAL PRODUCT the customer downloads and uses immediately

Return JSON with these fields:
{
  "content_draft": "Complete markdown-formatted product content (all sections combined, minimum 2000 words)",
  "sections": [
    {
      "title": "Exact section title",
      "body": "Complete written content for this section (minimum 200 words, fully written out)"
    }
  ]
}`,
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
    } catch (blueprintError) {
      console.error('[enrichProduct] BLUEPRINT FAILED:', blueprintError.message);
      await base44.asServiceRole.entities.Product.update(productId, {
        generationStatus: 'generation_failed',
        generationProgress: {
          blueprint: 'failed',
          salesCopy: 'pending',
          platformGuides: 'pending',
          socialKit: 'pending',
          launchPlan: 'pending',
        },
        generation_status: 'error',
        generation_progress: 'Blueprint generation failed. Please retry.',
      });
      return Response.json({ error: 'Blueprint generation failed', details: blueprintError.message }, { status: 500 });
    }

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

    // ── Save after blueprint — product is usable now ──────────────────────────
    await base44.asServiceRole.entities.Product.update(productId, {
      title: phase1.title,
      subtitle: phase1.subtitle,
      promise: phase1.promise,
      target_audience: phase1.audience,
      buyer_profile: phase1.buyer_profile,
      checklist_items: phase1.benefits || [],
      sections,
      pages: productBlocks,
      status: 'ready',
      generationStatus: 'blueprint_ready',
      generationProgress: {
        blueprint: 'done',
        salesCopy: 'generating',
        platformGuides: 'generating',
        socialKit: 'pending',
        launchPlan: 'pending',
      },
      generation_status: 'generating',
      generation_progress: 'Blueprint ready! Building sales copy & platform guide...',
      generated_data: { ...phase1, content_draft: contentDraft, product_blocks: productBlocks },
      ...(productAngle ? { product_angle: productAngle } : {}),
    });

    console.log(`[enrichProduct] Blueprint saved — ${sections.length} sections. Starting secondary phases.`);

    // ── STAGES 2 + 3: SALES COPY & PLATFORM GUIDES (parallel, non-critical) ──
    let salesResult = {};
    let guideResult = {};

    const salesCopyPromise = base44.integrations.Core.InvokeLLM({
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

Write ALL fields. No field may be empty.
LISTING TITLE (max 140 chars): Front-load the #1 buyer keyword. Include type + benefit + audience signal.
LISTING DESCRIPTION (200-250 words): Hook, problem agitation, product reveal, 5 benefits (✓), what's included, CTA.
KEYWORDS: 15 buyer-intent search phrases.
PLATFORM CTA: Most compelling action phrase.
SEO META DESCRIPTION (150-160 chars): Primary keyword + benefit.

Return ONLY valid JSON:
{
  "listing_title": "...",
  "listing_description": "...",
  "keywords": ["..."],
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
    }).then(r => { salesResult = r; return { ok: true }; })
      .catch(e => { console.error('[enrichProduct] salesCopy failed:', e.message); return { ok: false, error: e.message }; });

    const platformGuidePromise = base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert in selling digital products on ${platform}. Write a complete, practical launch guide.

PRODUCT: "${phase1.title}" (${productType} for ${niche})
PRICE: $${phase1.price_min}–$${phase1.price_max}
PLATFORM: ${platform} — ${platContext}
AUDIENCE: ${phase1.audience}

Write ALL sections fully. No placeholders. Specific, actionable, platform-specific content only.

WHY_THIS_PLATFORM (150 words): Why ${platform} is right for this product.
PLATFORM_AUDIENCE (100 words): Who shops on ${platform} for this.
PRICING_STRATEGY (150 words): Launch price, evergreen price, bundle pricing, discounting strategy.
THUMBNAIL_GUIDANCE (150 words): Exact cover/thumbnail spec.
LAUNCH_PLAN (200 words): Specific 30-day launch sequence.
PRO_TIPS: 6 specific actionable tips.
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
    }).then(r => { guideResult = r; return { ok: true }; })
      .catch(e => { console.error('[enrichProduct] platformGuides failed:', e.message); return { ok: false, error: e.message }; });

    const [salesStatus, guideStatus] = await Promise.all([salesCopyPromise, platformGuidePromise]);

    // Update progress for stages 2+3
    const progressUpdate = {
      salesCopy: salesStatus.ok ? 'done' : 'failed',
      platformGuides: guideStatus.ok ? 'done' : 'failed',
    };
    await updateProgress(base44, productId, 'generating_assets', progressUpdate);

    // ── STAGE 4+5: SOCIAL KIT & LAUNCH PLAN (parallel, non-critical) ─────────
    await updateProgress(base44, productId, 'generating_assets', {
      socialKit: 'generating',
      launchPlan: 'generating',
    });

    let socialKitResult = {};
    let launchPlanResult = {};

    const socialKitPromise = base44.integrations.Core.InvokeLLM({
      prompt: `You are a social media strategist. Create a complete social media kit for a digital product launch.

PRODUCT: "${phase1.title}" (${productType} for ${niche} on ${platform})
AUDIENCE: ${phase1.audience}
PROMISE: ${phase1.promise}
PRICE: $${phase1.price_min}–$${phase1.price_max}
${angleContext}

Generate:
1. INSTAGRAM_CAPTIONS: 5 caption variations (hook + value + CTA + hashtags)
2. CONTENT_CALENDAR: 7-day post schedule with platform, content type, and key message
3. VIDEO_SCRIPTS: 3 short-form video scripts (30-60 seconds) with hook, body, CTA

Return ONLY valid JSON:
{
  "instagram_captions": ["caption1", "caption2", "caption3", "caption4", "caption5"],
  "content_calendar": [
    {"day": 1, "platform": "Instagram", "content_type": "Reel", "message": "..."}
  ],
  "video_scripts": [
    {"title": "...", "hook": "...", "body": "...", "cta": "..."}
  ]
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
    }).then(r => { socialKitResult = r; return { ok: true }; })
      .catch(e => { console.error('[enrichProduct] socialKit failed:', e.message); return { ok: false, error: e.message }; });

    const launchPlanPromise = base44.integrations.Core.InvokeLLM({
      prompt: `You are a digital product launch strategist. Create a detailed 30-day launch plan.

PRODUCT: "${phase1.title}" (${productType} for ${niche} on ${platform})
AUDIENCE: ${phase1.audience}
PROMISE: ${phase1.promise}
PRICE: $${phase1.price_min}–$${phase1.price_max}

Write a comprehensive, week-by-week launch plan covering:
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
    }).then(r => { launchPlanResult = r; return { ok: true }; })
      .catch(e => { console.error('[enrichProduct] launchPlan failed:', e.message); return { ok: false, error: e.message }; });

    const [socialKitStatus, launchPlanStatus] = await Promise.all([socialKitPromise, launchPlanPromise]);

    // ── Build listing block ───────────────────────────────────────────────────
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

    // ── Compute final generationStatus ───────────────────────────────────────
    const anySecondaryFailed = !salesStatus.ok || !guideStatus.ok || !socialKitStatus.ok || !launchPlanStatus.ok;
    const finalGenStatus = anySecondaryFailed ? 'assets_ready' : 'completed';

    const finalProgress = {
      blueprint: 'done',
      salesCopy: salesStatus.ok ? 'done' : 'failed',
      platformGuides: guideStatus.ok ? 'done' : 'failed',
      socialKit: socialKitStatus.ok ? 'done' : 'failed',
      launchPlan: launchPlanStatus.ok ? 'done' : 'failed',
    };

    // ── FINAL SAVE ────────────────────────────────────────────────────────────
    const structuredUpdate = buildStructuredUpdate(phase1, { sections, content_draft: contentDraft }, salesResult, guideResult, finalBlocks);

    const legacyData = {
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
      content_draft: contentDraft,
      listing_title: salesResult.listing_title,
      listing_description: salesResult.listing_description,
      keywords: salesResult.keywords,
      platform_cta: salesResult.platform_cta,
      seo_meta_description: salesResult.seo_meta_description,
      platform_guidance: guideResult,
      product_blocks: finalBlocks,
      _progress: null,
    };

    await base44.asServiceRole.entities.Product.update(productId, {
      ...structuredUpdate,
      generated_data: legacyData,
      status: 'ready',
      generationStatus: finalGenStatus,
      generationProgress: finalProgress,
      generation_status: 'done',
      generation_progress: null,
      social_media_kit: socialKitStatus.ok ? socialKitResult : undefined,
      launch_plan: launchPlanStatus.ok ? (launchPlanResult.plan || '') : undefined,
      ...(productAngle ? { product_angle: productAngle } : {}),
    });

    console.log(`[enrichProduct] Done — product ${productId}. Status: ${finalGenStatus}. Progress:`, JSON.stringify(finalProgress));
    return Response.json({ success: true, generationStatus: finalGenStatus, generationProgress: finalProgress });

  } catch (error) {
    console.error('[enrichProduct] Fatal error:', error.message);
    try {
      if (productId) {
        await base44.asServiceRole.entities.Product.update(productId, {
          generationStatus: 'generation_failed',
          generation_status: 'error',
          generation_progress: 'Generation failed. Please retry.',
        });
      }
    } catch (_) {}
    return Response.json({ error: error.message }, { status: 500 });
  }
});