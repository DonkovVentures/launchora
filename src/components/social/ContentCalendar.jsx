import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Copy, Check, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const CONTENT_TYPES = {
  'Awareness': 'bg-blue-100 text-blue-700',
  'Engagement': 'bg-purple-100 text-purple-700',
  'Value': 'bg-green-100 text-green-700',
  'Promo': 'bg-orange-100 text-orange-700',
  'Social Proof': 'bg-pink-100 text-pink-700',
};

function DayCard({ day }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(`Day ${day.day} — ${day.theme}\n${day.hook}\n\nCaption: ${day.caption}\n\nCTA: ${day.cta}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const typeColor = CONTENT_TYPES[day.type] || 'bg-gray-100 text-gray-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: day.day * 0.02 }}
      className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground w-12">Day {day.day}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>{day.type}</span>
        </div>
        <button onClick={copy} className="opacity-0 group-hover:opacity-100 transition-opacity">
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
      </div>
      <p className="text-xs font-semibold text-foreground mb-1">{day.theme}</p>
      <p className="text-xs text-muted-foreground mb-2 italic">"{day.hook}"</p>
      <p className="text-xs text-foreground leading-relaxed mb-2">{day.caption}</p>
      <p className="text-[10px] text-primary font-medium">→ {day.cta}</p>
    </motion.div>
  );
}

export default function ContentCalendar({ product }) {
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const d = product.generated_data || {};
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a social media strategist for digital product creators. Create a 30-day content calendar for this product.

Product: "${d.title}"
Type: ${product.product_type} | Niche: ${product.niche} | Platform: ${product.platform}
Selling angle: ${d.selling_angle}
Target audience: ${d.audience}
Benefits: ${(d.benefits || []).slice(0, 4).join('; ')}

Create 30 days of content. Distribute types: 30% Awareness, 25% Value, 20% Engagement, 15% Promo, 10% Social Proof.
Each day: day number, type (one of: Awareness/Value/Engagement/Promo/Social Proof), theme (3-5 word topic), hook (attention-grabbing opening line), caption (50-70 words, platform-agnostic), cta (specific action to take).
Make content feel natural and authentic, not spammy. Build toward a purchase decision by day 30.`,
      response_json_schema: {
        type: 'object',
        properties: {
          days: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                day: { type: 'number' },
                type: { type: 'string' },
                theme: { type: 'string' },
                hook: { type: 'string' },
                caption: { type: 'string' },
                cta: { type: 'string' },
              }
            }
          }
        }
      }
    });
    setCalendar(result);
    setLoading(false);
  };

  const exportCalendar = () => {
    const text = (calendar?.days || []).map(d =>
      `DAY ${d.day} [${d.type}]\nTheme: ${d.theme}\nHook: ${d.hook}\nCaption: ${d.caption}\nCTA: ${d.cta}\n`
    ).join('\n---\n\n');
    const blob = new Blob([`30-DAY CONTENT CALENDAR\n${product.generated_data?.title}\n\n` + text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'content-calendar.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {!calendar ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center card-shadow">
          <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-4 glow">
            <span className="text-3xl">📅</span>
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">30-Day Content Calendar</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
            Get a full month of ready-to-post content — hooks, captions, and CTAs — all tailored to your product and audience.
          </p>
          <Button onClick={generate} disabled={loading} className="gradient-bg text-white hover:opacity-90 font-semibold px-8">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating 30 days...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Calendar</>}
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">30-Day Content Calendar</h2>
              <p className="text-xs text-muted-foreground">{calendar.days?.length} posts ready to publish</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportCalendar}>
                <Download className="w-3.5 h-3.5 mr-1.5" />Export
              </Button>
              <Button size="sm" onClick={generate} variant="outline">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />Regenerate
              </Button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mb-4">
            {Object.entries(CONTENT_TYPES).map(([type, cls]) => (
              <span key={type} className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${cls}`}>{type}</span>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(calendar.days || []).map(day => <DayCard key={day.day} day={day} />)}
          </div>
        </div>
      )}
    </div>
  );
}