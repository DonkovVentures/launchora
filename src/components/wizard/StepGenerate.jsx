import { Wand2, Sparkles, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { evaluateCombination } from '@/lib/compatibility';

const scoreConfig = {
  strong: {
    icon: CheckCircle2,
    label: 'Strong combination',
    desc: 'Great fit — this setup works well commercially.',
    className: 'bg-green-50 border-green-200 text-green-800',
    iconClass: 'text-green-500',
    barClass: 'bg-green-500',
    barWidth: '100%',
  },
  acceptable: {
    icon: AlertTriangle,
    label: 'Acceptable combination',
    desc: 'This can work, but there may be stronger options.',
    className: 'bg-amber-50 border-amber-200 text-amber-800',
    iconClass: 'text-amber-500',
    barClass: 'bg-amber-400',
    barWidth: '60%',
  },
  weak: {
    icon: XCircle,
    label: 'Weak combination',
    desc: 'This setup may produce lower-quality results. See suggestions below.',
    className: 'bg-red-50 border-red-200 text-red-800',
    iconClass: 'text-red-500',
    barClass: 'bg-red-400',
    barWidth: '30%',
  },
};

export default function StepGenerate({ data, onGenerate, loading }) {
  const { lang } = useLang();
  const evaluation = evaluateCombination({
    productType: data.productType,
    niche: data.niche,
    tone: data.tone,
    platform: data.platform,
  });

  const cfg = scoreConfig[evaluation.score];
  const ScoreIcon = cfg.icon;

  return (
    <div className="text-center">
      <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-6 glow">
        <Wand2 className="w-8 h-8 text-white" />
      </div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">{t(lang, 'step_gen_title')}</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t(lang, 'step_gen_sub')}</p>

      {/* Summary card */}
      <div className="bg-secondary/50 border border-border rounded-xl p-5 text-left mb-5 max-w-sm mx-auto space-y-3">
        {[
          [t(lang, 'step_gen_type'), data.productType],
          [t(lang, 'step_gen_niche'), data.niche],
          [t(lang, 'step_gen_tone'), data.tone],
          [t(lang, 'step_gen_platform'), data.platform],
        ].map(([label, val]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-foreground">{val || '—'}</span>
          </div>
        ))}
      </div>

      {/* Compatibility assessment */}
      <div className={`max-w-sm mx-auto rounded-xl border p-4 text-left mb-6 ${cfg.className}`}>
        <div className="flex items-center gap-2 mb-2">
          <ScoreIcon className={`w-4 h-4 flex-shrink-0 ${cfg.iconClass}`} />
          <span className="font-semibold text-sm">{cfg.label}</span>
        </div>
        {/* Score bar */}
        <div className="w-full h-1.5 bg-white/60 rounded-full mb-2">
          <div className={`h-full rounded-full transition-all ${cfg.barClass}`} style={{ width: cfg.barWidth }} />
        </div>
        <p className="text-xs mb-3 opacity-80">{cfg.desc}</p>

        {evaluation.issues.length > 0 && (
          <ul className="space-y-1">
            {evaluation.issues.map((issue, i) => (
              <li key={i} className="text-xs flex items-start gap-1.5">
                <span className="mt-0.5 flex-shrink-0">⚠️</span>{issue}
              </li>
            ))}
          </ul>
        )}

        {evaluation.suggestions.length > 0 && (
          <div className="mt-2 pt-2 border-t border-current/20">
            <p className="text-xs font-medium mb-1">Suggestions:</p>
            <ul className="space-y-1">
              {evaluation.suggestions.map((s, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5">
                  <span className="mt-0.5 flex-shrink-0">💡</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Button onClick={onGenerate} disabled={loading} size="lg" className="gradient-bg text-white hover:opacity-90 font-bold px-10 py-6 text-base rounded-xl glow">
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {t(lang, 'step_gen_loading')}
          </div>
        ) : (
          <><Sparkles className="w-5 h-5 mr-2" />{t(lang, 'step_gen_btn')}</>
        )}
      </Button>
      {loading && <p className="text-sm text-muted-foreground mt-4">{t(lang, 'step_gen_loading_sub')}</p>}
    </div>
  );
}