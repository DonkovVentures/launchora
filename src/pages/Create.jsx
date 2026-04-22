import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import WizardProgress from '@/components/wizard/WizardProgress';
import StepProductType from '@/components/wizard/StepProductType';
import StepNiche from '@/components/wizard/StepNiche';
import StepTone from '@/components/wizard/StepTone';
import StepIdeaAndGenerate from '@/components/wizard/StepIdeaAndGenerate';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import {
  getDefaultPlatform,
  getStructureTemplate,
  getNicheGuide,
  getDefaultTone,
} from '@/lib/compatibility';

const TOTAL_STEPS = 4;

export default function Create() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ productType: '', niche: '', tone: '', idea: '' });

  const update = (field) => (value) => setFormData(prev => ({ ...prev, [field]: value }));

  const canProceed = () => {
    if (step === 0) return !!formData.productType;
    if (step === 1) return !!formData.niche;
    if (step === 2) return !!formData.tone;
    if (step === 3) return formData.idea.length >= 15;
    return true;
  };

  const handleGenerate = async () => {
    setLoading(true);

    const platform = getDefaultPlatform(formData.productType);
    const structureTemplate = getStructureTemplate(formData.productType);
    const nicheGuide = getNicheGuide(formData.niche);
    const tone = formData.tone || getDefaultTone(formData.productType);

    const phase1 = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an elite digital product designer. Create a premium sellable digital product blueprint for ${platform}.

PRODUCT BRIEF:
- Type: ${formData.productType}
- Niche: ${formData.niche}
- Tone: ${tone}
- Core Idea: ${formData.idea}
- Platform: ${platform}
- Content style: ${nicheGuide.style} / ${nicheGuide.language}

PREDEFINED STRUCTURE: ${structureTemplate.map((s, i) => `${i + 1}. ${s}`).join(', ')}

Return ONLY valid JSON (every field required, no empty values):
{
  "title": "Specific benefit-driven title (50-70 chars)",
  "subtitle": "[audience] + [core benefit] (max 100 chars)",
  "promise": "Specific measurable transformation",
  "audience": "Vivid 2-sentence buyer profile: pain + aspiration",
  "format": "Format description: page count, what's included",
  "structure": ${JSON.stringify(structureTemplate)},
  "benefits": ["Verb-led benefit 1","Verb-led benefit 2","Verb-led benefit 3","Verb-led benefit 4","Verb-led benefit 5"],
  "selling_angle": "Most compelling reason to buy over alternatives",
  "price_min": 17,
  "price_max": 37,
  "price_rationale": "Pricing rationale for ${platform}",
  "buyer_profile": "Vivid persona: who they are, why they need this NOW",
  "cta": "Urgency-driven CTA phrase",
  "visual_direction": "2 hex colors, typography style, mood",
  "cover_concept": "Cover layout, text, visual elements, color placement"
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

    const productTitle = (phase1.title || formData.idea || 'Untitled Product').toString().trim().slice(0, 150) || 'Untitled Product';

    const initialBlocks = [
      { id: '1', type: 'cover', heading: 'Cover', content: { title: phase1.title, subtitle: phase1.subtitle, promise: phase1.promise, audience: phase1.audience } },
      { id: '2', type: 'toc', heading: 'Contents', content: { items: structureTemplate.map(s => s.split(' — ')[0]) } },
    ];

    const saved = await base44.entities.Product.create({
      title: productTitle,
      subtitle: phase1.subtitle,
      product_type: formData.productType,
      niche: formData.niche,
      idea_description: formData.idea,
      tone,
      platform,
      status: 'draft',
      generated_data: { ...phase1, product_blocks: initialBlocks },
    });

    setLoading(false);
    navigate(`/product/${saved.id}?generating=true`);

    // Phases 2-3 run server-side via backend function
    base44.functions.invoke('enrichProduct', {
      productId: saved.id,
      phase1,
      formData: { ...formData, tone, platform },
    }).catch(() => {});
  };

  const stepComponents = [
    <StepProductType value={formData.productType} onChange={update('productType')} />,
    <StepNiche value={formData.niche} onChange={update('niche')} productType={formData.productType} />,
    <StepTone value={formData.tone} onChange={update('tone')} productType={formData.productType} />,
    <StepIdeaAndGenerate data={formData} onIdeaChange={update('idea')} onGenerate={handleGenerate} loading={loading} />,
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <WizardProgress currentStep={step} totalSteps={TOTAL_STEPS} />
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