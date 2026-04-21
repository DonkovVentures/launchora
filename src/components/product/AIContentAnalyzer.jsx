import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Eye, Zap, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function ScoreBar({ label, score, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{score}/10</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score * 10}%`, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

export default function AIContentAnalyzer({ product }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const analyze = async () => {
    setLoading(true);
    const d = product.generated_data || {};
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a digital product expert. Analyze this product listing and give scores + improvements.

Product: "${d.title}"
Type: ${product.product_type} | Niche: ${product.niche} | Platform: ${product.platform}
Description: ${d.listing_description}
Promise: ${d.promise}
Benefits: ${(d.benefits || []).join(', ')}

Return JSON with:
- clarity_score (1-10): how clear and understandable is the messaging
- engagement_score (1-10): how compelling and click-worthy is the listing
- market_fit_score (1-10): how well does it fit the target niche
- overall_score (1-10): overall quality
- top_strengths: array of 2-3 specific strengths
- improvements: array of 3-4 specific, actionable improvements
- summary: one sentence overall assessment`,
      response_json_schema: {
        type: 'object',
        properties: {
          clarity_score: { type: 'number' },
          engagement_score: { type: 'number' },
          market_fit_score: { type: 'number' },
          overall_score: { type: 'number' },
          top_strengths: { type: 'array', items: { type: 'string' } },
          improvements: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
        }
      }
    });
    setAnalysis(result);
    setLoading(false);
    setExpanded(true);
  };

  return (
    <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden">
      <button
        onClick={() => analysis ? setExpanded(e => !e) : analyze()}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-foreground">AI Content Analysis</p>
            <p className="text-xs text-muted-foreground">Score your listing quality</p>
          </div>
        </div>
        {loading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> :
          analysis ? (expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />) :
          <Sparkles className="w-4 h-4 text-primary" />}
      </button>

      <AnimatePresence>
        {expanded && analysis && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <ScoreBar label="Clarity" score={analysis.clarity_score} color="bg-blue-400" />
                <ScoreBar label="Engagement" score={analysis.engagement_score} color="bg-primary" />
                <ScoreBar label="Market Fit" score={analysis.market_fit_score} color="bg-green-400" />
                <ScoreBar label="Overall" score={analysis.overall_score} color="bg-purple-400" />
              </div>
              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                <div className="text-2xl font-display font-bold gradient-text">{analysis.overall_score}/10</div>
                <p className="text-xs text-muted-foreground">{analysis.summary}</p>
              </div>
              {analysis.top_strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1"><Zap className="w-3 h-3 text-green-500" /> Strengths</p>
                  <ul className="space-y-1">{analysis.top_strengths.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✓</span>{s}</li>
                  ))}</ul>
                </div>
              )}
              {analysis.improvements?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1"><Eye className="w-3 h-3 text-primary" /> Improvements</p>
                  <ul className="space-y-1">{analysis.improvements.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-primary mt-0.5">→</span>{s}</li>
                  ))}</ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}