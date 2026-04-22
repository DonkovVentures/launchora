import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { evaluateCombination, getDefaultPlatform } from '@/lib/compatibility';

const placeholders = {
  'Planner':       'e.g. A weekly planner for busy moms who want to organize their family, meals, and goals in one place',
  'Checklist':     'e.g. A pre-launch checklist for digital product creators launching their first Etsy shop',
  'Tracker':       'e.g. A 90-day fitness tracker for women who want to build consistent workout habits',
  'Workbook':      'e.g. A mindset workbook for freelancers struggling with imposter syndrome and pricing their work',
  'Journal':       'e.g. A morning journal for entrepreneurs to set intentions and reflect on daily wins',
  'Prompt Pack':   'e.g. A ChatGPT prompt pack for coaches to create client onboarding materials 10x faster',
  'Mini Ebook':    'e.g. A guide teaching Etsy sellers how to write product descriptions that convert',
  'Template Pack': 'e.g. A pack of 5 Canva client proposal templates for freelance designers',
};

export default function StepIdeaAndGenerate({ data, onIdeaChange, onGenerate, loading }) {
  const { lang } = useLang();
  const { score, suggestions } = evaluateCombination({ productType: data.productType, niche: data.niche, tone: data.tone });
  const platform = getDefaultPlatform(data.productType);
  const placeholder = placeholders[data.productType] || 'Describe your product idea in a few sentences...';
  const charCount = (data.idea || '').length;
  const isReady = charCount >= 15;

  const scoreConfig = {
    strong:     { label: 'Great combination!', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
    acceptable: { label: 'Good combination', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    weak:       { label: 'Weak match', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  };
  const cfg = scoreConfig[score] || scoreConfig.acceptable;

  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
        Describe your idea
      </h2>
      <p className="text-muted-foreground mb-6">
        Give us a short description — the AI will handle the rest.
      </p>

      {/* Summary */}
      <div className={`border rounded-xl p-4 mb-5 ${cfg.bg}`}>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</span>
          <div className="flex flex-wrap gap-1.5">
            {[data.productType, data.niche, data.tone, platform].filter(Boolean).map(tag => (
              <span key={tag} className="text-xs bg-white/80 border border-white px-2 py-0.5 rounded-full text-foreground font-medium">{tag}</span>
            ))}
          </div>
        </div>
        {suggestions.length > 0 && (
          <p className="text-xs text-muted-foreground">💡 {suggestions[0]}</p>
        )}
      </div>

      {/* Idea input */}
      <div className="mb-6">
        <textarea
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
          rows={5}
          placeholder={placeholder}
          value={data.idea}
          onChange={e => onIdeaChange(e.target.value)}
        />
        <div className="flex justify-between items-center mt-1.5">
          <p className="text-xs text-muted-foreground">
            {charCount < 15 ? `${15 - charCount} more characters needed` : '✓ Ready to generate'}
          </p>
          <span className={`text-xs ${charCount >= 15 ? 'text-green-600' : 'text-muted-foreground'}`}>{charCount} chars</span>
        </div>
      </div>

      {/* Generate button */}
      <Button
        onClick={onGenerate}
        disabled={!isReady || loading}
        size="lg"
        className="gradient-bg text-white hover:opacity-90 rounded-xl font-bold w-full text-base py-6"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating your product...</>
        ) : (
          <><Sparkles className="w-5 h-5 mr-2" /> Generate My Product</>
        )}
      </Button>

      {!loading && isReady && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          ✦ Takes about 30–60 seconds · You'll see it update in real time
        </p>
      )}
    </div>
  );
}