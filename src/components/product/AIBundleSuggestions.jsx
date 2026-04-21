import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Package, ChevronDown, ChevronUp, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function ProductCard({ idea, index }) {
  return (
    <div className="border border-border rounded-lg p-3 bg-background hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-md gradient-bg flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs text-white font-bold">{index + 1}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{idea.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{idea.reason}</p>
          {idea.price_range && (
            <span className="inline-block mt-1.5 text-[10px] bg-primary/8 text-primary px-2 py-0.5 rounded-full font-medium">{idea.price_range}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AIBundleSuggestions({ product }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const generate = async () => {
    setLoading(true);
    const d = product.generated_data || {};
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a digital product business strategist. Based on this product, suggest complementary products to bundle or upsell.

Product: "${d.title}" (${product.product_type})
Niche: ${product.niche} | Platform: ${product.platform}
Audience: ${d.audience}
Price: $${d.price_min}–$${d.price_max}

Generate:
- 3 bundle_ideas: products to bundle with this one for higher AOV (include title, reason why they pair well, suggested bundle price_range)
- 3 upsell_ideas: premium upsell products that buyers of this would want next (include title, reason, price_range)
- bundle_pitch: a 1-sentence pitch for offering the main bundle`,
      response_json_schema: {
        type: 'object',
        properties: {
          bundle_ideas: {
            type: 'array',
            items: { type: 'object', properties: { title: { type: 'string' }, reason: { type: 'string' }, price_range: { type: 'string' } } }
          },
          upsell_ideas: {
            type: 'array',
            items: { type: 'object', properties: { title: { type: 'string' }, reason: { type: 'string' }, price_range: { type: 'string' } } }
          },
          bundle_pitch: { type: 'string' }
        }
      }
    });
    setSuggestions(result);
    setLoading(false);
    setExpanded(true);
  };

  return (
    <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden">
      <button
        onClick={() => suggestions ? setExpanded(e => !e) : generate()}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-foreground">Bundle & Upsell Ideas</p>
            <p className="text-xs text-muted-foreground">AI-powered product expansion</p>
          </div>
        </div>
        {loading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> :
          suggestions ? (expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />) :
          <span className="text-xs text-primary font-medium">Generate</span>}
      </button>

      <AnimatePresence>
        {expanded && suggestions && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
              {suggestions.bundle_pitch && (
                <div className="bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
                  <p className="text-xs text-primary font-medium flex items-center gap-1"><ArrowRight className="w-3 h-3" />{suggestions.bundle_pitch}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Bundle With</p>
                <div className="space-y-2">{(suggestions.bundle_ideas || []).map((idea, i) => <ProductCard key={i} idea={idea} index={i} />)}</div>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Upsell Ideas</p>
                <div className="space-y-2">{(suggestions.upsell_ideas || []).map((idea, i) => <ProductCard key={i} idea={idea} index={i} />)}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}