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
    const prompt = `You are a world-class digital product strategist and copywriter with 10+ years of experience selling on Etsy, Gumroad, and creative marketplaces. You've created hundreds of best-selling digital products. Your task is to create a PREMIUM, POLISHED, SELL-READY digital product — not a generic template or rough draft.

PRODUCT BRIEF:
- Type: ${formData.productType}
- Niche/Audience: ${formData.niche}
- Creator's Idea: ${formData.idea}
- Tone/Style: ${formData.tone}
- Selling Platform: ${formData.platform}

CRITICAL QUALITY STANDARDS:
1. The title must be magnetic and specific — not generic. Think like a bestseller, not a template.
2. The content_draft must be REAL, USABLE content — actual prompts, actual exercises, actual pages, actual frameworks. Not placeholders. Not "Section 1: [content here]". Write real content a buyer would pay for.
3. The listing_description must follow professional copywriting principles: hook → problem → solution → benefits → what's included → social proof language → strong CTA. No fluff.
4. Keywords must be real search terms buyers actually use on ${formData.platform}.
5. Platform guidance must be hyper-specific to ${formData.platform} — not generic advice that works for any platform.
6. The structure must reflect a logical, professional product flow — not just a list of vague topics.

Return ONLY valid JSON (no markdown, no preamble) with this exact structure:
{
  "title": "A specific, benefit-driven, SEO-optimized product title (50-70 chars). Must feel premium and professional. NO generic words like 'Ultimate Guide' or 'Complete Bundle'. Be specific to the niche.",
  "subtitle": "One punchy line that clarifies who this is for and what they'll get. Max 100 chars.",
  "promise": "The specific, measurable transformation this product delivers. Be concrete — not vague like 'improve your life'. Example: 'Go from scattered and overwhelmed to having a clear 90-day plan in one afternoon.'",
  "audience": "Describe the ideal buyer in 2-3 sentences: their situation, their frustration, their aspiration. Be psychographically specific.",
  "format": "Specific delivery format — e.g. '24-page PDF workbook, A4, print-ready + digital fill-in version'. Include page count estimate.",
  "structure": [
    "Section title — with brief description of what's in it (8-10 sections minimum, each title should be evocative and specific)"
  ],
  "content_draft": "Write 600-900 words of ACTUAL product content. This must be real, polished, sellable content — not a description of the content. If it's a planner, write actual planner pages with prompts. If it's a checklist, write the actual checklist items with context. If it's a workbook, write actual exercises with instructions. If it's a prompt pack, write 10-15 real prompts. Make it feel like something worth paying $15-25 for. Use the correct tone: ${formData.tone}.",
  "benefits": [
    "Specific, outcome-oriented benefit (not vague — not 'save time' but 'cut your weekly planning from 2 hours to 20 minutes')",
    "benefit 2", "benefit 3", "benefit 4", "benefit 5", "benefit 6"
  ],
  "selling_angle": "The single most compelling reason someone buys THIS product over alternatives. What makes it unique? What specific gap does it fill?",
  "listing_title": "Platform-optimized title following ${formData.platform}'s best practices for search ranking and click-through rate.",
  "listing_description": "Write a 250-350 word premium listing description. Structure: 1) Attention-grabbing hook (1-2 sentences identifying the pain point). 2) Empathy bridge (you understand them). 3) Product intro as the solution. 4) 5-6 specific bullet-point benefits. 5) Exactly what's included (format, pages, sections). 6) Who it's perfect for. 7) Strong, urgency-based CTA. Use line breaks for readability. No emoji overuse.",
  "keywords": ["10-13 real search terms buyers use on ${formData.platform} — mix of short-tail and long-tail, specific to this niche and product type"],
  "price_min": 12,
  "price_max": 27,
  "price_rationale": "Data-backed pricing rationale for this specific product type and niche on ${formData.platform}. Include psychological pricing notes.",
  "buyer_profile": "Paint a vivid picture of the ideal buyer: name-level persona, their daily struggle, what they've tried before, why this product is the answer they've been looking for.",
  "cta": "A specific, action-oriented CTA that creates urgency or excitement. Not 'Buy Now'. Example: 'Download instantly and start planning today.'",
  "visual_direction": "Specific visual direction: exact color palette (hex codes if possible), typography pairings, layout style, design mood. Be specific enough that a designer could execute this without asking questions.",
  "cover_concept": "Detailed mockup description: what the cover looks like, what text appears, what visual elements, what mockup style (flat lay, device mockup, etc.), what would make someone stop scrolling and click.",
  "platform_guidance": {
    "why_this_platform": "Specific, data-driven reason why ${formData.platform} is ideal for THIS product — buyer demographics, search volume, competition level, pricing norms.",
    "platform_audience": "Who specifically shops on ${formData.platform} for this type of product — their age range, income level, buying motivation, what they search for.",
    "pricing_strategy": "Hyper-specific pricing advice for ${formData.platform}: launch price, regular price, bundle pricing, seasonal pricing, competitor benchmarks.",
    "best_title": "The exact title format that performs best on ${formData.platform} for this category — follow their algorithm and buyer psychology.",
    "best_description": "Platform-specific description formatted correctly for ${formData.platform}'s listing page — correct length, formatting style, what to include vs omit.",
    "tags": ["13 tags optimized specifically for ${formData.platform}'s search algorithm — not generic, not repeated from title"],
    "thumbnail_guidance": "Specific thumbnail/cover guidance for ${formData.platform}: correct dimensions, what high-performing covers in this category look like, color psychology for this niche, text overlay strategy.",
    "publishing_steps": ["7-8 specific, actionable steps to publish on ${formData.platform} — technical steps, settings to configure, what to fill in where"],
    "pro_tips": ["4-5 advanced, platform-specific tips that most sellers don't know — real insider knowledge"],
    "mistakes_to_avoid": ["4-5 common mistakes that tank sales on ${formData.platform} — be specific, not generic"]
  }
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
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