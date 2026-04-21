import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Copy, FlipHorizontal, ChevronDown, ChevronUp, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Variant({ label, text, tag }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="border border-border rounded-lg p-3 bg-background group relative">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        {tag && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{tag}</span>}
      </div>
      <p className="text-sm text-foreground leading-snug pr-6">{text}</p>
      <button onClick={copy} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
    </div>
  );
}

export default function AIABTesting({ product }) {
  const [variants, setVariants] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const generate = async () => {
    setLoading(true);
    const d = product.generated_data || {};
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a conversion copywriter. Generate A/B test variants for this digital product.

Current title: "${d.listing_title || d.title}"
Current description: "${d.listing_description}"
Platform: ${product.platform} | Niche: ${product.niche}

Generate 3 title variants and 2 description variants optimized for different angles:
- title_a: Benefit-focused (emphasize the outcome)
- title_b: Curiosity-driven (create intrigue, FOMO)
- title_c: Problem-first (lead with the pain point)
- desc_a: Storytelling approach (connect emotionally)
- desc_b: Direct/results-first (bullet points, facts, outcomes)

Each title max 70 chars. Each description 80-100 words.`,
      response_json_schema: {
        type: 'object',
        properties: {
          title_a: { type: 'string' },
          title_b: { type: 'string' },
          title_c: { type: 'string' },
          desc_a: { type: 'string' },
          desc_b: { type: 'string' },
        }
      }
    });
    setVariants(result);
    setLoading(false);
    setExpanded(true);
  };

  return (
    <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden">
      <button
        onClick={() => variants ? setExpanded(e => !e) : generate()}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <FlipHorizontal className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-foreground">A/B Test Variants</p>
            <p className="text-xs text-muted-foreground">3 title + 2 description alternatives</p>
          </div>
        </div>
        {loading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> :
          variants ? (expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />) :
          <span className="text-xs text-primary font-medium">Generate</span>}
      </button>

      <AnimatePresence>
        {expanded && variants && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Title Variants</p>
                <div className="space-y-2">
                  <Variant label="A — Benefit" text={variants.title_a} />
                  <Variant label="B — Curiosity" text={variants.title_b} tag="⚡ Recommended" />
                  <Variant label="C — Problem-First" text={variants.title_c} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Description Variants</p>
                <div className="space-y-2">
                  <Variant label="A — Storytelling" text={variants.desc_a} />
                  <Variant label="B — Results-First" text={variants.desc_b} tag="🎯 High Convert" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}