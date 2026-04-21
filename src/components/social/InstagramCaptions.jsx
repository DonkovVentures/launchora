import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const STYLES = [
  { id: 'storytelling', label: '📖 Story', desc: 'Personal narrative' },
  { id: 'listicle', label: '📋 Listicle', desc: 'Tips & bullets' },
  { id: 'before_after', label: '✨ Before/After', desc: 'Transformation' },
  { id: 'behind_scenes', label: '🎬 Behind Scenes', desc: 'Raw & authentic' },
  { id: 'promo', label: '🛒 Promo', desc: 'Direct sell' },
  { id: 'question', label: '❓ Question', desc: 'Drive comments' },
];

function CaptionCard({ caption, index }) {
  const [copied, setCopied] = useState(false);
  const fullText = `${caption.caption}\n\n${(caption.hashtags || []).join(' ')}`;
  const copy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-card border border-border rounded-xl overflow-hidden card-shadow"
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
        <div>
          <span className="text-xs font-bold text-foreground">{caption.style_label}</span>
          {caption.best_time && <span className="text-[10px] text-muted-foreground ml-2">Best time: {caption.best_time}</span>}
        </div>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
          {copied ? <><Check className="w-3.5 h-3.5 text-green-500" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
        </button>
      </div>
      <div className="p-4">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line mb-3">{caption.caption}</p>
        <div className="flex flex-wrap gap-1">
          {(caption.hashtags || []).map(tag => (
            <span key={tag} className="text-[11px] text-primary bg-primary/8 px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function InstagramCaptions({ product }) {
  const [captions, setCaptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState(['storytelling', 'listicle', 'before_after', 'promo']);

  const toggleStyle = (id) => {
    setSelectedStyles(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const generate = async () => {
    setLoading(true);
    const d = product.generated_data || {};
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert Instagram copywriter for digital product creators. Generate Instagram captions for this product.

Product: "${d.title}"
Niche: ${product.niche} | Audience: ${d.audience}
Selling angle: ${d.selling_angle}
Promise: ${d.promise}
Tone: ${product.tone || 'warm and encouraging'}

Generate one caption for each of these styles: ${selectedStyles.join(', ')}.
Each caption: 150-200 words, includes emojis naturally, conversational, ends with a clear CTA.
Also include 20-25 niche-specific hashtags for each.
style_label should be a human-readable name for the style (e.g. "Personal Story", "Top 5 Tips", etc.)
best_time should be one of: Morning (7-9am), Midday (11am-1pm), Evening (6-8pm)`,
      response_json_schema: {
        type: 'object',
        properties: {
          captions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                style: { type: 'string' },
                style_label: { type: 'string' },
                caption: { type: 'string' },
                hashtags: { type: 'array', items: { type: 'string' } },
                best_time: { type: 'string' },
              }
            }
          }
        }
      }
    });
    setCaptions(result);
    setLoading(false);
  };

  return (
    <div>
      {/* Style selector */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 card-shadow">
        <p className="text-sm font-semibold text-foreground mb-3">Choose caption styles</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STYLES.map(s => (
            <button key={s.id} onClick={() => toggleStyle(s.id)}
              className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                selectedStyles.includes(s.id) ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-primary/30'
              }`}>
              <span>{s.label}</span>
              <div>
                <p className="text-xs font-medium text-foreground leading-none">{s.label.split(' ').slice(1).join(' ')}</p>
                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <Button
          onClick={generate}
          disabled={loading || selectedStyles.length === 0}
          className="gradient-bg text-white hover:opacity-90 font-semibold mt-4 w-full"
        >
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Writing captions...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate {selectedStyles.length} Captions</>}
        </Button>
      </div>

      {captions && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(captions.captions || []).map((c, i) => <CaptionCard key={i} caption={c} index={i} />)}
        </div>
      )}
    </div>
  );
}