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

    // ── PHASE 1: Core concept (fast) ──────────────────────────
    setLoadingPhase('Generating product concept...');
    const phase1 = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a world-class digital product strategist. Create a PREMIUM digital product based on this brief:
- Type: ${formData.productType}
- Niche: ${formData.niche}
- Idea: ${formData.idea}
- Tone: ${formData.tone}
- Platform: ${formData.platform}

Return ONLY valid JSON:
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
}`,
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

    // Save immediately with phase 1 — user navigates to product right away
    const productTitle = (phase1.title || formData.idea || 'Untitled Product').toString().trim().slice(0, 150) || 'Untitled Product';
    const saved = await base44.entities.Product.create({
      title: productTitle,
      subtitle: phase1.subtitle,
      product_type: formData.productType, niche: formData.niche,
      idea_description: formData.idea, tone: formData.tone,
      platform: formData.platform, status: 'draft', generated_data: phase1,
    });

    setLoading(false);
    navigate(`/product/${saved.id}?generating=true`);

    // ── PHASE 2, 3, 4: Run in background sequentially to avoid truncation ──
    (async () => {
      try {
        // Phase 2: Content draft only
        const phase2 = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert content creator. Write premium content for a ${formData.productType} product.
Product: "${phase1.title}" — ${phase1.subtitle}
Tone: ${formData.tone} | Niche: ${formData.niche}

Return ONLY valid JSON:
{
  "content_draft": "400-500 words of ACTUAL product content — real exercises, prompts, frameworks, or checklists a buyer would pay for. Use the product's tone. Include headers, numbered lists, and actionable steps."
}`,
          model: 'claude_sonnet_4_6',
          response_json_schema: {
            type: 'object',
            properties: { content_draft: { type: 'string' } }
          }
        });

        await base44.entities.Product.update(saved.id, {
          generated_data: { ...phase1, ...phase2 },
        });

        // Phase 3: Marketing copy (listing + keywords)
        const phase3 = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a top-converting digital product copywriter. Write marketing copy for ${formData.platform}.
Product: "${phase1.title}" — ${phase1.subtitle}
Audience: ${phase1.audience}
Niche: ${formData.niche}

Return ONLY valid JSON:
{
  "listing_title": "platform-optimized listing title for ${formData.platform}, front-loading best keywords (max 140 chars)",
  "listing_description": "120-150 word listing: hook sentence → problem → solution → 4 bullet benefits → what's included → CTA",
  "keywords": ["12-13 real buyer search terms for ${formData.platform}"]
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

        // Phase 4: Platform strategy
        const phase4 = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a ${formData.platform} sales expert. Give platform strategy for this product.
Product: "${phase1.title}" in the ${formData.niche} niche.
Platform: ${formData.platform}

Return ONLY valid JSON:
{
  "platform_guidance": {
    "why_this_platform": "specific reason this platform is ideal (2-3 sentences)",
    "platform_audience": "who buys this type of product on ${formData.platform}",
    "pricing_strategy": "specific pricing advice with exact numbers for ${formData.platform}",
    "thumbnail_guidance": "exact thumbnail design advice for ${formData.platform}",
    "pro_tips": ["4 advanced platform-specific tips that most sellers miss"],
    "mistakes_to_avoid": ["4 common mistakes that tank sales on ${formData.platform}"]
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

        await base44.entities.Product.update(saved.id, {
          generated_data: { ...phase1, ...phase2, ...phase3, ...phase4 },
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