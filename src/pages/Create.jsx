import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import WizardProgress from '@/components/wizard/WizardProgress';
import StepProductType from '@/components/wizard/StepProductType';
import StepNiche from '@/components/wizard/StepNiche';
import StepIdea from '@/components/wizard/StepIdea';
import StepTone from '@/components/wizard/StepTone';
import StepPlatform from '@/components/wizard/StepPlatform';
import StepGenerate from '@/components/wizard/StepGenerate';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

const TOTAL_STEPS = 6;

export default function Create() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ productType: '', niche: '', idea: '', tone: '', platform: '' });

  const update = (field) => (value) => setFormData(prev => ({ ...prev, [field]: value }));

  const canProceed = () => {
    if (step === 0) return !!formData.productType;
    if (step === 1) return !!formData.niche;
    if (step === 2) return formData.idea.length >= 20;
    if (step === 3) return !!formData.tone;
    if (step === 4) return !!formData.platform;
    return true;
  };

  const [loadingPhase, setLoadingPhase] = useState('');

  const handleGenerate = async () => {
    setLoading(true);

    // ── PHASE 1: Core concept ──────────────────────────────────
    setLoadingPhase('Generating product concept...');

    const productTypeGuidance = {
      'Planner': 'daily/weekly/monthly planning pages, goal-setting sections, habit trackers, reflection prompts, priority matrices',
      'Checklist': 'step-by-step actionable items grouped by phase, pre-launch, during, post checklists, progress indicators',
      'Tracker': 'data entry rows, progress columns, milestone markers, summary sections, charts/tables',
      'Workbook': 'modules with theory, exercises, reflection prompts, action steps, space for responses',
      'Journal': 'daily prompts, gratitude sections, intention-setting, emotional check-ins, guided reflection',
      'Prompt Pack': 'categorized AI/writing prompts, usage instructions, context-setting intro, clear prompt formatting',
      'Mini Ebook': 'intro chapter, 4-6 content chapters with frameworks, examples, key takeaways, conclusion + resources',
      'Template Pack': 'reusable fill-in-the-blank templates with instructions, examples, and customization notes',
    };
    const typeGuide = productTypeGuidance[formData.productType] || 'clear sections, practical content, logical flow';

    const phase1 = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an elite digital product designer and strategist with 10+ years creating best-selling Etsy and Gumroad products. Your job is to design a PREMIUM, SELLABLE digital product — not a description of one.

PRODUCT BRIEF:
- Type: ${formData.productType}
- Niche: ${formData.niche}
- Core Idea: ${formData.idea}
- Tone: ${formData.tone}
- Platform: ${formData.platform}

PRODUCT TYPE REQUIREMENTS (${formData.productType}):
This product MUST include: ${typeGuide}

QUALITY STANDARDS — every field must be:
✓ Specific (not vague or generic)
✓ Audience-targeted (written for a real person with a real problem)
✓ Premium and polished (not AI-sounding filler)
✓ Useful and actionable (something a buyer would pay for)

Return ONLY valid JSON:
{
  "title": "Specific, magnetic, benefit-driven product title (50-70 chars) — must include who it's for OR what outcome it delivers. No generic titles.",
  "subtitle": "One punchy line: [audience] + [core benefit or promise] (max 100 chars). Must be instantly understood.",
  "promise": "The single specific measurable transformation this product delivers. E.g. 'Go from scattered freelancer to fully booked in 30 days using this exact planning system.'",
  "audience": "3-sentence vivid buyer profile. Include: their current pain point, their aspiration, their daily context. Be psychographically specific — name their frustration.",
  "format": "Exact delivery format with page count, structure overview, and what the buyer opens when they download it.",
  "structure": [
    "Section 1 Title — what this section covers and why it matters (1 sentence)",
    "Section 2 Title — what this section covers and why it matters",
    "Section 3 Title — what this section covers and why it matters",
    "Section 4 Title — what this section covers and why it matters",
    "Section 5 Title — what this section covers and why it matters",
    "Section 6 Title — what this section covers and why it matters",
    "Section 7 Title — what this section covers and why it matters",
    "Section 8 Title — what this section covers and why it matters",
    "BONUS: Value-adding bonus section title and what it contains"
  ],
  "benefits": [
    "Specific outcome benefit 1 — starts with a verb, ends with a measurable result",
    "Specific outcome benefit 2",
    "Specific outcome benefit 3",
    "Specific outcome benefit 4",
    "Specific outcome benefit 5",
    "Specific outcome benefit 6 — must reference the niche specifically"
  ],
  "selling_angle": "The single most compelling reason to buy THIS product over any other similar option. Be specific. Reference a real buyer fear or desire.",
  "price_min": 17,
  "price_max": 37,
  "price_rationale": "Justify pricing with comparable products on ${formData.platform} and value delivered.",
  "buyer_profile": "Vivid 3-sentence persona: their name/archetype, their exact situation, what they Google at 11pm, why they need this NOW.",
  "cta": "Specific action-oriented CTA that creates urgency and speaks directly to the buyer's desire.",
  "visual_direction": "Specific visual identity: 2-3 exact hex colors, typography style, mood, layout density. Reference a known design aesthetic.",
  "cover_concept": "Detailed mockup description: layout, what text appears on cover, visual elements, color placement, what makes it look premium."
}`,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' }, subtitle: { type: 'string' }, promise: { type: 'string' },
          audience: { type: 'string' }, format: { type: 'string' },
          structure: { type: 'array', items: { type: 'string' } },
          benefits: { type: 'array', items: { type: 'string' } },
          selling_angle: { type: 'string' },
          price_min: { type: 'number' }, price_max: { type: 'number' },
          price_rationale: { type: 'string' }, buyer_profile: { type: 'string' },
          cta: { type: 'string' }, visual_direction: { type: 'string' }, cover_concept: { type: 'string' },
        }
      }
    });

    // Save immediately with phase 1 — user navigates to product right away
    const productTitle = (phase1.title || formData.idea || 'Untitled Product').toString().trim().slice(0, 150) || 'Untitled Product';

    // Build initial cover block from phase1
    const initialBlocks = [
      { id: '1', type: 'cover', heading: 'Cover', content: { title: phase1.title, subtitle: phase1.subtitle, promise: phase1.promise, audience: phase1.audience } },
      { id: '2', type: 'toc', heading: 'Contents', content: { items: (phase1.structure || []).map(s => s.split(' — ')[0]) } },
    ];

    const saved = await base44.entities.Product.create({
      title: productTitle,
      subtitle: phase1.subtitle,
      product_type: formData.productType, niche: formData.niche,
      idea_description: formData.idea, tone: formData.tone,
      platform: formData.platform, status: 'draft',
      generated_data: { ...phase1, product_blocks: initialBlocks },
    });

    setLoading(false);
    navigate(`/product/${saved.id}?generating=true`);

    // ── PHASE 2, 3, 4: Run in background sequentially to avoid truncation ──
    (async () => {
      try {
        // Phase 2: Full real product content + product blocks
        const contentInstructions = {
          'Planner': `Write 3 complete planner pages:
PAGE 1 — Weekly Planner: 7 daily columns with: priority task (1 item), top 3 tasks, time blocks (6am-9pm in 2-hour slots), energy level tracker, evening reflection prompt.
PAGE 2 — Goal Setting Page: Monthly goal (with why it matters + success metric), 3 weekly milestones, daily non-negotiables, potential obstacles + solutions.
PAGE 3 — Weekly Reflection: What did you accomplish? What blocked you? Rate your week 1-10 (with rating criteria). Lesson learned. One thing to do differently next week.`,
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
MODULE 1 — Foundation: concept explanation (2 paragraphs, use an analogy), self-assessment exercise (5 questions with space for answers), key insight framework (3-step), action assignment with specific deliverable.
MODULE 2 — Application: case study/example scenario, step-by-step implementation exercise, reflection prompts (3 deep questions), accountability checkpoint with measurable outcome.`,
          'Journal': `Write 3 complete journal pages with guided prompts:
PAGE 1 — Morning Intention (5 prompts for clarity, gratitude, energy, focus, mindset)
PAGE 2 — Midday Check-In (4 prompts for progress, energy management, pivot moments, self-compassion)
PAGE 3 — Evening Reflection (5 prompts for wins, lessons, emotions, release, tomorrow's intention)
Each prompt must be specific, emotionally resonant, and different from common journal clichés.`,
          'Prompt Pack': `Write 3 complete prompt categories with 5 prompts each:
CATEGORY 1 — [Specific use case 1]: intro explaining when to use these, then 5 detailed, ready-to-use prompts with context instructions
CATEGORY 2 — [Specific use case 2]: intro, then 5 prompts
CATEGORY 3 — Advanced/Power prompts: intro explaining these are for experienced users, then 5 complex chained prompts
Format each prompt clearly, include any variables in [brackets].`,
          'Mini Ebook': `Write Chapter 1 and Chapter 2 fully:
CHAPTER 1 — Introduction/Foundation: compelling hook story (1 paragraph), the core problem this ebook solves, why existing solutions fail, what the reader will discover, how to use this ebook.
CHAPTER 2 — First Core Framework: main concept explained clearly, 3-step framework with each step explained in detail, real-world example, common mistake to avoid, chapter action step.`,
          'Template Pack': `Write 3 complete, fill-in-the-blank templates:
TEMPLATE 1 — [Primary use case]: instructions for use, the full template with [FILL IN] placeholders, example completed version, pro tip for customization.
TEMPLATE 2 — [Secondary use case]: instructions, template with placeholders, example.
TEMPLATE 3 — [Bonus advanced use case]: instructions, template, customization notes.`,
        };
        const contentGuide = contentInstructions[formData.productType] || 'Write 3 complete, premium sections of actual usable content with exercises, frameworks, and actionable steps.';

        // ── PHASE 2a: gemini_3_1_pro generates the raw full content (capable, cost-efficient) ──
        const blockType = formData.productType === 'Checklist' ? 'checklist'
          : (formData.productType === 'Journal' || formData.productType === 'Workbook') ? 'worksheet'
          : formData.productType === 'Prompt Pack' ? 'prompt' : 'section';

        const phase2raw = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert digital product content writer. Your job is to write COMPLETE, DETAILED, IMMEDIATELY USABLE content for a paid digital product. A real buyer will download and use this — it must be worth every cent.

PRODUCT: "${phase1.title}"
TYPE: ${formData.productType} | NICHE: ${formData.niche} | TONE: ${formData.tone}
AUDIENCE: ${phase1.audience}
PROMISE: ${phase1.promise}

CONTENT REQUIREMENTS — write EVERYTHING listed below, fully:
${contentGuide}

STRICT RULES:
- NO placeholders like "[insert here]", "[write content]", "[your answer]" — write the actual content
- NO generic filler. Every sentence must be niche-specific and actionable
- Each section must be fully written — not summarized or truncated
- Use ${formData.tone} tone throughout every word
- Minimum 1000 words of real usable content in content_draft
- Use markdown: ## headers, **bold key terms**, numbered steps, - bullet lists

Return ONLY valid JSON:
{
  "content_draft": "FULL formatted product content here — every section written completely with real exercises, prompts, frameworks, templates or tracking fields. No truncation.",
  "sections": [
    { "title": "Section title", "body": "Full written section content — at least 120 words each, specific and actionable" },
    { "title": "Section title", "body": "..." },
    { "title": "Section title", "body": "..." },
    { "title": "Section title", "body": "..." },
    { "title": "BONUS: Section title", "body": "..." }
  ]
}`,
          model: 'gemini_3_1_pro',
          response_json_schema: {
            type: 'object',
            properties: {
              content_draft: { type: 'string' },
              sections: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, body: { type: 'string' } } } }
            }
          }
        });

        // ── PHASE 2b: claude_sonnet_4_6 acts as QA — enriches weak content ──
        const wordCount = (phase2raw.content_draft || '').split(/\s+/).length;
        let finalContentDraft = phase2raw.content_draft || '';
        let finalSections = phase2raw.sections || [];

        if (wordCount < 800) {
          // Content is thin — ask Claude to enrich it
          const enriched = await base44.integrations.Core.InvokeLLM({
            prompt: `You are a senior editor reviewing a digital product draft. The content below is TOO THIN — it needs significant enrichment to be worth paying for.

PRODUCT: "${phase1.title}" (${formData.productType} for ${formData.niche})
TONE: ${formData.tone}
AUDIENCE: ${phase1.audience}

CURRENT DRAFT (needs improvement):
${finalContentDraft}

YOUR TASK:
1. Expand every section to at least 150 words with specific, actionable content
2. Add concrete examples, real scenarios, and niche-specific detail
3. Remove any vague or filler sentences — replace with substance
4. Ensure every exercise/prompt/step is fully written, not just labeled
5. Total output must be at least 1200 words

Return ONLY valid JSON:
{
  "content_draft": "The fully enriched, expanded content in markdown format — complete and polished",
  "sections": [
    { "title": "Section title", "body": "Fully enriched section body — specific, detailed, actionable" }
  ]
}`,
            model: 'claude_sonnet_4_6',
            response_json_schema: {
              type: 'object',
              properties: {
                content_draft: { type: 'string' },
                sections: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, body: { type: 'string' } } } }
              }
            }
          });
          finalContentDraft = enriched.content_draft || finalContentDraft;
          finalSections = enriched.sections || finalSections;
        }

        // Build product_blocks from the enriched sections
        const sectionBlocks = (finalSections || []).map((sec, i) => ({
          id: String(3 + i),
          type: blockType,
          heading: sec.title || `Section ${i + 1}`,
          content: {
            title: sec.title,
            body: sec.body,
            // For checklist blocks
            items: sec.body ? sec.body.split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim()).filter(Boolean) : [],
            // For worksheet blocks
            prompts: sec.body ? sec.body.split('\n').filter(l => /^\d+\./.test(l.trim())).map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean) : [],
          }
        }));

        const phase2 = {
          content_draft: finalContentDraft,
          product_blocks: [
            { id: '1', type: 'cover', heading: 'Cover', content: { title: phase1.title, subtitle: phase1.subtitle, promise: phase1.promise, audience: phase1.audience } },
            { id: '2', type: 'toc', heading: 'Contents', content: { items: (finalSections || []).map(s => s.title).filter(Boolean) } },
            ...sectionBlocks,
            { id: String(Date.now() + 1), type: 'notes', heading: 'Notes', content: { title: 'Your Notes', lines: 12 } },
          ]
        };

        await base44.entities.Product.update(saved.id, {
          generated_data: { ...phase1, ...phase2 },
        });

        // Phase 3: Platform-specific SEO copy — claude_sonnet writes, gemini_3_flash verifies/augments keywords
        const platformSeoContext = {
          'Etsy': 'Etsy SEO uses up to 13 tags (each max 20 chars), 140-char title front-loading the primary keyword, and a description where the first 160 chars appear in Google search snippets. Buyers search conversationally. Long-tail phrases like "weekly planner for moms printable" outperform generic terms. Etsy ranks listings with high click-through and conversion rates.',
          'Gumroad': 'Gumroad has no internal search algorithm — traffic is mostly from creator audiences, Twitter/X, newsletters, and Google. The product page title and first paragraph are indexed by Google. Use emotional hooks, social proof language, and benefit-driven headlines. The description should read like a sales page, not a product listing.',
          'Payhip': 'Payhip pages are crawled by Google. Use H1-style titles with primary keyword + audience. First 200 chars of description serve as meta description. Buyers arrive mostly via Pinterest, Instagram, and Google search. Descriptions should be benefit-led with clear deliverables and a bold CTA.',
          'Creative Market': 'Creative Market buyers are designers, marketers, and creative professionals. They search by use case ("brand kit", "Instagram template") and style. Titles should include format + style + use case. Tags allow up to 10 comma-separated terms. The platform rewards detailed, specific descriptions that mention software compatibility and file types.',
          'Stan Store': 'Stan Store is creator-economy focused — buyers follow the creator first, then buy. Descriptions should feel personal and conversational. CTAs like "grab your copy" outperform "buy now". Highlight transformation and community. SEO matters less; social proof and specificity matter more.',
          'Ko-fi': 'Ko-fi buyers are supporters who already follow the creator. Descriptions should be warm, personal, and specific about what they get. Mention the exact format, page count, and who it\'s for. No complex SEO — just clear value communication.',
          'Shopify': 'Shopify product pages are fully Google-indexed. Use schema-friendly titles with primary keyword first. Meta descriptions (155 chars) and product descriptions must include semantic keyword clusters. Use bullet points for scannability. Internal linking and collections help with on-site SEO.',
          'Custom Website': 'Custom website product pages should be fully SEO-optimized with title tags, meta descriptions, H1/H2 structure, and semantic keywords throughout the body. Target long-tail transactional keywords. Include schema markup for digital products. First 150 words must contain the primary keyword naturally.',
        };
        const seoContext = platformSeoContext[formData.platform] || 'Optimize for search with buyer-intent keywords, clear benefit-led copy, and a strong CTA.';

        const phase3 = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a world-class SEO copywriter and digital product launch specialist. You know exactly how ${formData.platform} ranks and converts listings for ${formData.productType} products in the ${formData.niche} niche.

PLATFORM SEO RULES FOR ${formData.platform.toUpperCase()}:
${seoContext}

PRODUCT DETAILS:
- Title: "${phase1.title}"
- Type: ${formData.productType}
- Niche: ${formData.niche}
- Tone: ${formData.tone}
- Audience: ${phase1.audience}
- Promise: ${phase1.promise}
- Selling angle: ${phase1.selling_angle}
- Benefits: ${(phase1.benefits || []).slice(0, 3).join(' | ')}
- Price: $${phase1.price_min}–$${phase1.price_max}

TASK — Generate ALL of the following, fully written and ready to copy-paste:

1. LISTING TITLE: Front-load the #1 buyer-intent keyword for this niche on ${formData.platform}. Include product type + core benefit + audience signal. Max 140 chars. No ALL CAPS. No filler words.

2. LISTING DESCRIPTION: 180-220 words. Structure for ${formData.platform}:
   - Hook (1 sentence): Name the exact pain or desire the buyer feels right now
   - Problem agitation (1-2 sentences): What they've tried, why it hasn't worked
   - Product reveal (2 sentences): What this IS and what it DOES — specific, not vague
   - Benefits list (4 items starting with ✓): Each one names a concrete outcome, not a feature
   - What's included (1 sentence): Exact deliverable, format, page count, file type
   - CTA (1 sentence): Creates desire and specificity, not generic urgency
   Write in ${formData.tone} tone. Sound like a human expert.

3. SEO KEYWORDS: 15 buyer-intent search terms. Mix:
   - 3 broad (1-2 words, high volume)
   - 7 mid-tail (3-4 words, specific)
   - 5 long-tail (5+ words, high intent, conversational)
   All must be terms real buyers actually type when looking for a ${formData.productType.toLowerCase()} in ${formData.niche}.

4. PLATFORM CTA: The single most compelling call-to-action phrase for ${formData.platform} buyers — specific to their mindset on this platform.

5. SEO META DESCRIPTION: 150-155 chars. Includes primary keyword naturally. Appears in Google search results for this product page.

Return ONLY valid JSON:
{
  "listing_title": "...",
  "listing_description": "...",
  "keywords": ["keyword 1", "keyword 2", "... 15 total"],
  "platform_cta": "...",
  "seo_meta_description": "..."
}`,
          model: 'claude_sonnet_4_6',
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

        await base44.entities.Product.update(saved.id, {
          generated_data: { ...phase1, ...phase2, ...phase3 },
        });

        // Phase 4: Platform strategy + finalize product_blocks
        const blocksFromPhase2 = phase2.product_blocks || [];
        // Enrich blocks with real content from content_draft
        const enrichedBlocks = blocksFromPhase2.map((block, idx) => {
          if (block.type === 'cover') {
            return { ...block, content: { title: phase1.title, subtitle: phase1.subtitle, promise: phase1.promise, audience: phase1.audience } };
          }
          if (block.type === 'toc') {
            const tocItems = (phase1.structure || []).map(s => s.split(' — ')[0]);
            return { ...block, content: { items: tocItems.length > 0 ? tocItems : block.content?.items || [] } };
          }
          return block;
        });

        // Add listing block at end
        const allBlocks = [...enrichedBlocks];

        const phase4 = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a top ${formData.platform} seller with $500K+ in digital product revenue. Give precise, battle-tested platform strategy for this exact product.

PRODUCT: "${phase1.title}" — ${formData.productType} in ${formData.niche}
PLATFORM: ${formData.platform}
PRICE RANGE: $${phase1.price_min}–$${phase1.price_max}

Return ONLY valid JSON:
{
  "platform_guidance": {
    "why_this_platform": "Specific data-backed reason this platform works for this product type and niche — mention who the platform's buyer base is and why they buy ${formData.productType.toLowerCase()} products.",
    "platform_audience": "Exactly who buys this on ${formData.platform}: their demographics, what they search for, what drives purchase decisions on this platform specifically.",
    "pricing_strategy": "Exact pricing recommendation with launch price vs. full price, bundle opportunities, and how to position value on ${formData.platform}.",
    "thumbnail_guidance": "Precise thumbnail design: dimensions, what text to show (max 3-5 words), background color, font weight, mockup style. Reference what converts on ${formData.platform}.",
    "launch_plan": "5-step launch sequence for the first 7 days — specific daily actions to get first sales.",
    "pro_tips": [
      "Advanced tip 1 that most ${formData.platform} sellers miss — specific and actionable",
      "Advanced tip 2 — platform algorithm or search optimization insight",
      "Advanced tip 3 — pricing or bundling strategy specific to ${formData.platform}",
      "Advanced tip 4 — customer experience or review-generation tactic"
    ],
    "mistakes_to_avoid": [
      "Critical mistake 1 that kills ${formData.platform} conversions for this product type",
      "Critical mistake 2 — thumbnail or listing copy error",
      "Critical mistake 3 — pricing or positioning mistake",
      "Critical mistake 4 — post-launch mistake that stops growth"
    ]
  }
}`,
          model: 'gemini_3_flash',
          response_json_schema: {
            type: 'object',
            properties: {
              platform_guidance: { type: 'object' }
            }
          }
        });

        // Add listing block to product_blocks
        const listingBlock = {
          id: String(Date.now()),
          type: 'listing',
          heading: `${formData.platform} Listing`,
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
        const finalBlocks = [...allBlocks, listingBlock];

        await base44.entities.Product.update(saved.id, {
          generated_data: { ...phase1, ...phase2, ...phase3, ...phase4, product_blocks: finalBlocks },
          status: 'ready',
        });

      } catch (e) {
        // Mark ready even if background phases partially fail
        await base44.entities.Product.update(saved.id, { status: 'ready' });
      }
    })();
  };

  const stepComponents = [
    <StepProductType value={formData.productType} onChange={update('productType')} />,
    <StepNiche value={formData.niche} onChange={update('niche')} productType={formData.productType} />,
    <StepIdea value={formData.idea} onChange={update('idea')} productType={formData.productType} niche={formData.niche} />,
    <StepTone value={formData.tone} onChange={update('tone')} productType={formData.productType} />,
    <StepPlatform value={formData.platform} onChange={update('platform')} productType={formData.productType} />,
    <StepGenerate data={formData} onGenerate={handleGenerate} loading={loading} />,
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <WizardProgress currentStep={step} />
          <div className="bg-card border border-border rounded-2xl p-8 card-shadow min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                {stepComponents[step]}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="rounded-xl font-medium">
              <ArrowLeft className="w-4 h-4 mr-2" />{t(lang, 'wizard_back')}
            </Button>
            {step < TOTAL_STEPS - 1 && (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="gradient-bg text-white hover:opacity-90 rounded-xl font-semibold">
                {t(lang, 'wizard_continue')}<ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}