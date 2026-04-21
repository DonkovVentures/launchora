import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function StepIdea({ value, onChange, productType, niche }) {
  const { lang } = useLang();
  const example = productType && niche
    ? `Example: I want a ${productType?.toLowerCase()} for ${niche?.toLowerCase()} who need a simple, actionable system they can use every day.`
    : 'Example: I want a productivity planner for busy moms who need a simple weekly system they can actually stick to.';

  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">{t(lang, 'step_idea_title')}</h2>
      <p className="text-muted-foreground mb-8">{t(lang, 'step_idea_sub')}</p>
      <div className="bg-primary/4 border border-primary/15 rounded-xl p-4 mb-6">
        <p className="text-xs text-primary font-medium mb-1">{t(lang, 'step_idea_tip_label')}</p>
        <p className="text-sm text-muted-foreground">{example}</p>
      </div>
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={t(lang, 'step_idea_placeholder')} rows={7}
        className="w-full px-4 py-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none leading-relaxed" />
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-muted-foreground">{t(lang, 'step_idea_helper')}</p>
        <span className={`text-xs ${value.length < 30 ? 'text-muted-foreground' : 'text-primary font-medium'}`}>
          {value.length} {t(lang, 'step_idea_chars')}
        </span>
      </div>
    </div>
  );
}