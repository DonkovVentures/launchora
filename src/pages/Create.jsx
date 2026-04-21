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

    // PHASE 1: Fast generation of core data
    setLoadingPhase('Generating product concept...');
    const phase1Prompt = `You are a world-class digital product strategist. Create a PREMIUM digital product based on this brief:

- Type: ${formData.productType}
- Niche: ${formData.niche}
- Idea: ${formData.idea}
- Tone: ${formData.tone}
- Platform: ${formData.platform}

Return ONLY valid JSON with these exact fields:
{
  "title": "magnetic, specific, benefit-driven title (50-70 chars)",
  "subtitle": "one punchy line clarifying who it's for and what they get (max 100 chars)",
  "promise": "specific measurable transformation the product delivers",
  "audience": "ideal buyer description in 2-3 sentences, psychographically specific",
  "format": "specific delivery format with page count estimate",
  "structure": ["8-10 evocative section titles with brief descriptions"],
  "benefits": ["6 specific outcome-oriented benefits"],
  "selling_angle": "single most compelling reason to buy THIS over alternatives",
  "price_min": 12,
  "price_max": 27,
  "price_rationale": "data-backed pricing rationale",
  "buyer_profile": "vivid ideal buyer persona",
  "cta": "specific action-oriented CTA",
  "visual_direction": "specific visual direction with hex colors, typography, mood",
  "cover_concept": "detailed mockup description"
}`;

    const phase1 = await base44.integrations.Core.InvokeLLM({
      prompt: phase1Prompt,
      model: 'gemini_3_flash',
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

    // Save immediately with phase 1 data so user can see results fast
    const saved = await base44.entities.Product.create({
      title: phase1.title || phase1.listing_title || formData.idea.slice(0, 80) || 'Untitled Product',
      subtitle: phase1.subtitle,
      product_type: formData.productType, niche: formData.niche,
      idea_description: formData.idea, tone: formData.tone,
      platform: formData.platform, status: 'draft', generated_data: phase1,
    });

    // Navigate immediately — user sees phase 1 results right away
    setLoading(false);
    navigate(`/product/${saved.id}?generating=true`);

    // PHASE 2: Generate rich content in background (fire and forget)
    const phase2Prompt = `You are a world-class digital product copywriter. Complete these missing fields for a ${formData.productType} product in the ${formData.niche} niche, sold on ${formData.platform}, with tone: ${formData.tone}.

Product concept: "${phase1.title}" — ${phase1.subtitle}

Return ONLY valid JSON:
{
  "content_draft": "300-400 words of ACTUAL product content — real prompts, exercises, or checklist items a buyer would pay for. Tone: ${formData.tone}",
  "listing_title": "platform-optimized title for ${formData.platform} with best search ranking practices",
  "listing_description": "150-200 word premium listing: hook → problem → solution → 4-5 bullet benefits → what's included → CTA",
  "keywords": ["10-13 real search terms buyers use on ${formData.platform}"],
  "platform_guidance": {
    "why_this_platform": "specific reason ${formData.platform} is ideal for this product",
    "platform_audience": "who shops on ${formData.platform} for this",
    "pricing_strategy": "hyper-specific pricing advice for ${formData.platform}",
    "best_title": "exact title format that performs best on ${formData.platform}",
    "best_description": "optimized 100-150 word description for ${formData.platform}",
    "tags": ["13 tags optimized for ${formData.platform} search algorithm"],
    "thumbnail_guidance": "specific thumbnail guidance for ${formData.platform}",
    "publishing_steps": ["7-8 specific actionable publishing steps"],
    "pro_tips": ["4-5 advanced platform-specific tips"],
    "mistakes_to_avoid": ["4-5 common mistakes that tank sales"]
  }
}`;

    // Fire phase 2 without awaiting — it will update the product in background
    base44.integrations.Core.InvokeLLM({
      prompt: phase2Prompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          content_draft: { type: 'string' },
          listing_title: { type: 'string' },
          listing_description: { type: 'string' },
          keywords: { type: 'array', items: { type: 'string' } },
          platform_guidance: { type: 'object' },
        }
      }
    }).then(phase2 => {
      const merged = { ...phase1, ...phase2 };
      base44.entities.Product.update(saved.id, {
        generated_data: merged,
        listing_title: phase2.listing_title,
        status: 'ready',
      });
    }).catch(() => {
      // silently fail — phase 1 data is already saved and shown
    });
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