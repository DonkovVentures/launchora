import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function WizardProgress({ currentStep }) {
  const { lang } = useLang();
  const steps = t(lang, 'wizard_step_labels');
  const total = steps.length;

  return (
    <div className="w-full mb-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-primary">{t(lang, 'wizard_step')} {currentStep + 1} {t(lang, 'wizard_of')} {total}</span>
        <span className="text-xs text-muted-foreground">{Math.round(((currentStep + 1) / total) * 100)}{t(lang, 'wizard_complete')}</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full gradient-bg rounded-full transition-all duration-500" style={{ width: `${((currentStep + 1) / total) * 100}%` }} />
      </div>
      <div className="hidden sm:flex items-center justify-between mt-3">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < currentStep ? 'gradient-bg text-white' :
              i === currentStep ? 'bg-primary text-white ring-4 ring-primary/20' :
              'bg-muted text-muted-foreground'
            }`}>
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] font-medium ${i === currentStep ? 'text-primary' : 'text-muted-foreground'}`}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}