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

  const handleGenerate = async () => {
    setLoading(true);

    const productTypeGuidance = {
      'Planner': 'daily/weekly/monthly planning pages, goal-setting sections, habit trackers, reflection prompts, priority matrices',
      'Checklist': 'step-by-step actionable items grouped by phase, pre-launch, during, post checklists, progress indicators',
      'Tracker': 'data entry rows, progress columns, milestone markers, summary sections, charts/tables',
      'Workbook': 'modules with theory, exercises, reflection prompts, action steps, space for responses',
      'Journal': 'daily prompts, gratitude sections, intention-setting, emotional check-ins, guided reflection',
      'Prompt Pack': 'categorized AI/writing prompts, usage instructions, context-setting intro, clear prompt formatting',
      'Mini Ebook': 'intro chapter, 4-6 content chapters with frameworks, examples, key takeaways, conclusion + resources',
      'Template Pack': '8-10 distinct, fully designed templates with: exact file formats (Canva/Notion/Google Docs), step-by-step usage instructions per template, a completed example for each, customization variables clearly marked, and a "Quick Start" guide explaining when to use which template',
    };
    const typeGuide = productTypeGuidance[formData.productType] || 'clear sections, practical content, logical flow';

    const templatePackExtra = formData.productType === 'Template Pack' ? `
TEMPLATE PACK SPECIFICS — the "structure" field must list each INDIVIDUAL TEMPLATE by name and exact use case:
- Each structure item = one specific template (e.g. "Client Onboarding Template — captures project scope, timeline, deliverables, and payment terms in one professional document")
- Templates must be distinct from each other — different formats, different situations
- Include file format compatibility: Canva, Google Docs, Notion, or PDF
- The "format" field must specify: number of templates, file formats, and total page count
` : '';

    const phase1 = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an elite digital product designer and strategist with 10+ years creating best-selling Etsy and ${formData.platform} products. Your job is to design a PREMIUM, SELLABLE digital product — not a description of one.

PRODUCT BRIEF:
- Type: ${formData.productType}
- Niche: ${formData.niche}
- Core Idea: ${formData.idea}
- Tone: ${formData.tone}
- Platform: ${formData.platform}

PRODUCT TYPE REQUIREMENTS (${formData.productType}):
This product MUST include: ${typeGuide}
${templatePackExtra}

QUALITY STANDARDS — every field must be:
✓ Specific (not vague or generic)
✓ Audience-targeted (written for a real person with a real problem)
✓ Premium and polished (not AI-sounding filler)
✓ Useful and actionable (something a buyer would pay for)

Return ONLY valid JSON:
{
  "title": "Specific, magnetic, benefit-driven product title (50-70 chars) — must include who it's for OR what outcome it delivers. No generic titles.",
  "subtitle": "One punchy line: [audience] + [core benefit or promise] (max 100 chars). Must be instantly understood.",
  "promise": "The single specific measurable transformation this product delivers.",
  "audience": "3-sentence vivid buyer profile. Include: their current pain point, their aspiration, their daily context.",
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
  "selling_angle": "The single most compelling reason to buy THIS product over any other similar option.",
  "price_min": 17,
  "price_max": 37,
  "price_rationale": "Justify pricing with comparable products on ${formData.platform} and value delivered.",
  "buyer_profile": "Vivid 3-sentence persona: their name/archetype, their exact situation, what they Google at 11pm, why they need this NOW.",
  "cta": "Specific action-oriented CTA that creates urgency and speaks directly to the buyer's desire.",
  "visual_direction": "Specific visual identity: 2-3 exact hex colors, typography style, mood, layout density.",
  "cover_concept": "Detailed mockup description: layout, what text appears on cover, visual elements, color placement."
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

    const productTitle = (phase1.title || formData.idea || 'Untitled Product').toString().trim().slice(0, 150) || 'Untitled Product';

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

    // Phases 2-4 run server-side via backend function (browser-independent)
    base44.functions.invoke('enrichProduct', {
      productId: saved.id,
      phase1,
      formData,
    }).catch(() => {
      // Silent fail — backend marks product ready even on error
    });
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