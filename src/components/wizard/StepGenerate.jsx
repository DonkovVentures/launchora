import { Wand2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function StepGenerate({ data, onGenerate, loading }) {
  const { lang } = useLang();
  return (
    <div className="text-center">
      <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-6 glow">
        <Wand2 className="w-8 h-8 text-white" />
      </div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">{t(lang, 'step_gen_title')}</h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">{t(lang, 'step_gen_sub')}</p>
      <div className="bg-secondary/50 border border-border rounded-xl p-5 text-left mb-8 max-w-sm mx-auto space-y-3">
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