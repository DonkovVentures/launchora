import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Copy, Check, Play } from 'lucide-react';
import { motion } from 'framer-motion';

const VIDEO_FORMATS = [
  { id: 'hook_reveal', label: '🎣 Hook & Reveal', desc: '15-30 sec', platform: 'TikTok / Reels' },
  { id: 'problem_solution', label: '💡 Problem/Solution', desc: '30-60 sec', platform: 'All platforms' },
  { id: 'day_in_life', label: '📆 Day in the Life', desc: '45-90 sec', platform: 'TikTok / YouTube' },
  { id: 'product_walkthrough', label: '🎬 Product Walkthrough', desc: '60-90 sec', platform: 'Instagram / YouTube' },
  { id: 'testimonial_style', label: '⭐ Testimonial Style', desc: '20-40 sec', platform: 'All platforms' },
];

function ScriptCard({ script, index }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fullScript = `[${script.format_label}] ${script.duration}\n\nHOOK: ${script.hook}\n\n${(script.scenes || []).map((s, i) => `Scene ${i+1}: ${s}`).join('\n')}\n\nCTA: ${script.cta}\n\nSPOKEN SCRIPT:\n${script.spoken_script}`;

  const copy = () => {
    navigator.clipboard.writeText(fullScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card border border-border rounded-xl overflow-hidden card-shadow"
    >
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">{script.format_label}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground">{script.duration}</span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] text-primary">{script.platform}</span>
          </div>
        </div>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
          {copied ? <><Check className="w-3.5 h-3.5 text-green-500" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Hook */}
        <div className="bg-primary/5 border border-primary/15 rounded-lg p-3">
          <p className="text-[10px] font-bold text-primary mb-1 uppercase tracking-wider">Opening Hook</p>
          <p className="text-sm font-semibold text-foreground">"{script.hook}"</p>
        </div>

        {/* Scenes */}
        <div>
          <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <Play className="w-3 h-3" />Scene Breakdown
          </p>
          <div className="space-y-1.5">
            {(script.scenes || []).map((scene, i) => (
              <div key={i} className="flex gap-2.5 text-xs">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0 mt-0.5">{i+1}</span>
                <p className="text-muted-foreground leading-relaxed">{scene}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Spoken script toggle */}
        <button onClick={() => setExpanded(e => !e)} className="text-xs text-primary font-medium hover:underline">
          {expanded ? 'Hide' : 'Show'} full spoken script →
        </button>

        {expanded && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs font-semibold text-foreground mb-2">Full Script (word-for-word)</p>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{script.spoken_script}</p>
          </div>
        )}

        {/* CTA */}
        <div className="border-t border-border pt-2">
          <p className="text-[10px] font-semibold text-muted-foreground mb-1">END SCREEN CTA</p>
          <p className="text-xs text-foreground font-medium">{script.cta}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function VideoScripts({ product }) {
  const [scripts, setScripts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState(['hook_reveal', 'problem_solution', 'testimonial_style']);

  const toggleFormat = (id) => {
    setSelectedFormats(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const generate = async () => {
    setLoading(true);
    const d = product.generated_data || {};
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a viral short-form video scriptwriter for digital product creators. Write video scripts based on this product.

Product: "${d.title}" — ${d.subtitle}
Selling angle: ${d.selling_angle}
Promise: ${d.promise}
Audience: ${d.audience}
Tone: ${product.tone || 'warm and authentic'}

Generate one script for each format: ${selectedFormats.join(', ')}.

For each script provide:
- format: the format id
- format_label: human readable label (e.g. "Hook & Reveal", "Problem/Solution")
- duration: estimated video duration (e.g. "15-20 sec")
- platform: best platform(s)
- hook: the exact first sentence/question that stops the scroll (punchy, max 15 words)
- scenes: array of 4-6 short scene descriptions (what's on screen + what's said, 1 sentence each)
- spoken_script: word-for-word script the creator reads out loud (natural, conversational, NOT robotic)
- cta: the exact end screen call-to-action text`,
      response_json_schema: {
        type: 'object',
        properties: {
          scripts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                format: { type: 'string' },
                format_label: { type: 'string' },
                duration: { type: 'string' },
                platform: { type: 'string' },
                hook: { type: 'string' },
                scenes: { type: 'array', items: { type: 'string' } },
                spoken_script: { type: 'string' },
                cta: { type: 'string' },
              }
            }
          }
        }
      }
    });
    setScripts(result);
    setLoading(false);
  };

  return (
    <div>
      <div className="bg-card border border-border rounded-xl p-4 mb-6 card-shadow">
        <p className="text-sm font-semibold text-foreground mb-3">Choose video formats</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {VIDEO_FORMATS.map(f => (
            <button key={f.id} onClick={() => toggleFormat(f.id)}
              className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                selectedFormats.includes(f.id) ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-primary/30'
              }`}>
              <div>
                <p className="text-sm font-medium text-foreground">{f.label}</p>
                <p className="text-[10px] text-muted-foreground">{f.platform}</p>
              </div>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{f.desc}</span>
            </button>
          ))}
        </div>
        <Button
          onClick={generate}
          disabled={loading || selectedFormats.length === 0}
          className="gradient-bg text-white hover:opacity-90 font-semibold mt-4 w-full"
        >
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Writing scripts...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate {selectedFormats.length} Scripts</>}
        </Button>
      </div>

      {scripts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(scripts.scripts || []).map((s, i) => <ScriptCard key={i} script={s} index={i} />)}
        </div>
      )}
    </div>
  );
}