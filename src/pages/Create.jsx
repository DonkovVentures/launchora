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

        const phase2 = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an elite digital product content writer. Write REAL, COMPLETE product content that a buyer would find immediately valuable and usable.

PRODUCT: "${phase1.title}"
TYPE: ${formData.productType} | NICHE: ${formData.niche} | TONE: ${formData.tone}
AUDIENCE: ${phase1.audience}

CONTENT REQUIREMENTS:
${contentGuide}

QUALITY RULES:
- Write ACTUAL content — no placeholders, no "[write content here]"
- Every exercise/prompt must be specific to the ${formData.niche} niche
- Avoid generic filler phrases like "this will help you grow" or "take action today"
- Use ${formData.tone} tone throughout
- Make it feel like it was written by a human expert, not an AI
- Density over volume: every sentence must add value

Return ONLY valid JSON:
{
  "content_draft": "The complete formatted product content — use markdown formatting with ## for section headers, **bold** for key terms, numbered lists for steps, and - for checklist items. Minimum 600 words of real usable content.",
  "product_blocks": [
    {
      "id": "1",
      "type": "cover",
      "heading": "Cover",
      "content": {
        "title": "${phase1.title || ''}",
        "subtitle": "${phase1.subtitle || ''}",
        "promise": "${phase1.promise || ''}",
        "audience": "For: [specific audience description]"
      }
    },
    {
      "id": "2", 
      "type": "toc",
      "heading": "Contents",
      "content": {
        "items": ["section title 1", "section title 2", "section title 3", "section title 4", "section title 5", "section title 6", "BONUS section"]
      }
    },
    {
      "id": "3",
      "type": "${formData.productType === 'Checklist' ? 'checklist' : formData.productType === 'Journal' || formData.productType === 'Workbook' ? 'worksheet' : formData.productType === 'Prompt Pack' ? 'prompt' : 'section'}",
      "heading": "First Section",
      "content": {}
    },
    {
      "id": "4",
      "type": "${formData.productType === 'Checklist' ? 'checklist' : formData.productType === 'Journal' || formData.productType === 'Workbook' ? 'worksheet' : formData.productType === 'Prompt Pack' ? 'prompt' : 'section'}",
      "heading": "Second Section",
      "content": {}
    },
    {
      "id": "5",
      "type": "notes",
      "heading": "Notes",
      "content": { "title": "Your Notes", "lines": 12 }
    }
  ]
}`,
          model: 'claude_sonnet_4_6',
          response_json_schema: {
            type: 'object',
            properties: {
              content_draft: { type: 'string' },
              product_blocks: { type: 'array', items: { type: 'object' } }
            }
          }
        });

        await base44.entities.Product.update(saved.id, {
          generated_data: { ...phase1, ...phase2 },
        });

        // Phase 3: Marketing copy (listing + keywords)
        const phase3 = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a 7-figure digital product copywriter specializing in ${formData.platform} listings. Write high-converting marketplace copy for this product.

PRODUCT: "${phase1.title}"
SUBTITLE: ${phase1.subtitle}
AUDIENCE: ${phase1.audience}
NICHE: ${formData.niche}
PLATFORM: ${formData.platform}
SELLING ANGLE: ${phase1.selling_angle}

Return ONLY valid JSON:
{
  "listing_title": "Front-load the most searched keyword for ${formData.niche} on ${formData.platform}. Include product type + key benefit + audience hint. Max 140 chars. No generic phrases. No ALL CAPS.",
  "listing_description": "Write a 130-160 word listing that converts. Structure: [1 sentence hook that names their exact pain point] → [1 sentence on what they've tried and why it failed] → [2 sentences on what this product IS and what it delivers] → [4 bullet points each starting with ✓ and naming a specific benefit] → [1 sentence on what's included with file format] → [closing CTA that creates desire, not urgency]. Sound like a human expert, not an AI.",
  "keywords": ["12 highly specific buyer-intent search terms that real customers type into ${formData.platform} when looking for ${formData.productType.toLowerCase()} products in the ${formData.niche} niche — mix of broad and long-tail"]
}`,
          model: 'gemini_3_flash',
          response_json_schema: {
            type: 'object',
            properties: {
              listing_title: { type: 'string' },
              listing_description: { type: 'string' },
              keywords: { type: 'array', items: { type: 'string' } },
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
    <StepNiche value={formData.niche} onChange={update('niche')} />,
    <StepIdea value={formData.idea} onChange={update('idea')} productType={formData.productType} niche={formData.niche} />,
    <StepTone value={formData.tone} onChange={update('tone')} />,
    <StepPlatform value={formData.platform} onChange={update('platform')} />,
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