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
    const prompt = `You are an expert digital product creator. Generate a complete, premium, sell-ready digital product based on these inputs:

Product Type: ${formData.productType}
Niche/Audience: ${formData.niche}
Idea Description: ${formData.idea}
Tone/Style: ${formData.tone}
Selling Platform: ${formData.platform}

Generate a comprehensive, high-quality product creation package. Return ONLY valid JSON with this structure:
{
  "title": "compelling product title (60-80 chars for SEO)",
  "subtitle": "one-line product subtitle",
  "promise": "what transformation/outcome the product delivers",
  "audience": "detailed buyer profile and demographic",
  "format": "file format and delivery details",
  "structure": ["section 1 title", "section 2 title", "section 3 title", "section 4 title", "section 5 title", "section 6 title", "section 7 title", "section 8 title"],
  "content_draft": "Write 400-600 words of actual premium product content — real sections, real exercises, real value. Make it feel polished and sell-ready.",
  "benefits": ["benefit 1", "benefit 2", "benefit 3", "benefit 4", "benefit 5"],
  "selling_angle": "the unique angle that makes this product stand out",
  "listing_title": "platform-optimized listing title",
  "listing_description": "Write a 200-300 word premium listing description with strong opening, benefits, what's included, and CTA.",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8", "keyword9", "keyword10"],
  "price_min": 9,
  "price_max": 19,
  "price_rationale": "why this price range is optimal",
  "buyer_profile": "detailed description of ideal buyer",
  "cta": "suggested call-to-action text",
  "platform_guidance": {
    "why_this_platform": "why this product fits the chosen platform",
    "platform_audience": "who buys this type of product on this platform",
    "pricing_strategy": "specific pricing advice for this platform",
    "best_title": "optimized title for this specific platform",
    "best_description": "optimized description style for this platform",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "thumbnail_guidance": "what the cover image should look like",
    "publishing_steps": ["step 1", "step 2", "step 3", "step 4", "step 5", "step 6"],
    "pro_tips": ["tip 1", "tip 2", "tip 3"],
    "mistakes_to_avoid": ["mistake 1", "mistake 2", "mistake 3"]
  },
  "visual_direction": "describe the ideal visual style for this product — colors, typography, layout, cover design",
  "cover_concept": "detailed description of what the product cover should look like for maximum appeal on the chosen platform"
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' }, subtitle: { type: 'string' }, promise: { type: 'string' },
          audience: { type: 'string' }, format: { type: 'string' },
          structure: { type: 'array', items: { type: 'string' } },
          content_draft: { type: 'string' },
          benefits: { type: 'array', items: { type: 'string' } },
          selling_angle: { type: 'string' }, listing_title: { type: 'string' },
          listing_description: { type: 'string' },
          keywords: { type: 'array', items: { type: 'string' } },
          price_min: { type: 'number' }, price_max: { type: 'number' },
          price_rationale: { type: 'string' }, buyer_profile: { type: 'string' },
          cta: { type: 'string' }, platform_guidance: { type: 'object' },
          visual_direction: { type: 'string' }, cover_concept: { type: 'string' },
        }
      }
    });

    const saved = await base44.entities.Product.create({
      title: result.title, subtitle: result.subtitle,
      product_type: formData.productType, niche: formData.niche,
      idea_description: formData.idea, tone: formData.tone,
      platform: formData.platform, status: 'ready', generated_data: result,
    });

    setLoading(false);
    navigate(`/product/${saved.id}`);
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