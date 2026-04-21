import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { getToneFit, getBestTonesForType } from '@/lib/compatibility';

const tones = [
  { name: 'Professional', emoji: '👔', descKey: 'tone_professional_desc' },
  { name: 'Friendly', emoji: '😊', descKey: 'tone_friendly_desc' },
  { name: 'Motivational', emoji: '🔥', descKey: 'tone_motivational_desc' },
  { name: 'Calm & Nurturing', emoji: '🌿', descKey: 'tone_calm_desc' },
  { name: 'Bold & Direct', emoji: '⚡', descKey: 'tone_bold_desc' },
  { name: 'Educational', emoji: '🎓', descKey: 'tone_educational_desc' },
];

const fitConfig = {
  strong:  { label: 'Recommended', className: 'text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium' },
  neutral: { label: null, className: '' },
  weak:    { label: 'Weak match', className: 'text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium' },
};

export default function StepTone({ value, onChange, productType }) {
  const { lang } = useLang();
  const bestTones = getBestTonesForType(productType);

  // Sort: strong first, neutral middle, weak last
  const sorted = [...tones].sort((a, b) => {
    const order = { strong: 0, neutral: 1, weak: 2 };
    return order[getToneFit(productType, a.name)] - order[getToneFit(productType, b.name)];
  });

  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">{t(lang, 'step_tone_title')}</h2>
      <p className="text-muted-foreground mb-2">{t(lang, 'step_tone_sub')}</p>

      {productType && bestTones.length > 0 && (
        <div className="mb-6 text-xs text-muted-foreground bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          💡 Best for <strong>{productType}</strong>: {bestTones.join(', ')}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map(tone => {
          const fit = getToneFit(productType, tone.name);
          const cfg = fitConfig[fit];
          const isSelected = value === tone.name;
          return (
            <button key={tone.name} onClick={() => onChange(tone.name)}
              className={`flex items-start gap-4 p-5 rounded-xl border text-left transition-all hover:scale-[1.01] ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : fit === 'weak'
                  ? 'border-border bg-card opacity-60 hover:opacity-80 hover:border-primary/30'
                  : 'border-border bg-card hover:border-primary/40'
              }`}>
              <span className="text-2xl flex-shrink-0">{tone.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm text-foreground">{tone.name}</span>
                  {productType && cfg.label && (
                    <span className={cfg.className}>{cfg.label}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{t(lang, tone.descKey)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}