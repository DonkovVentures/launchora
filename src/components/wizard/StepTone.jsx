import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { getToneFit, getStrongTonesForType, TONES } from '@/lib/compatibility';

const toneDetails = {
  'Professional': { emoji: '👔', desc: 'Clear, authoritative, business-ready' },
  'Friendly':     { emoji: '😊', desc: 'Warm, approachable, conversational' },
  'Motivational': { emoji: '🔥', desc: 'Energetic, inspiring, action-driving' },
  'Educational':  { emoji: '🎓', desc: 'Instructional, clear, step-by-step' },
  'Calm':         { emoji: '🌿', desc: 'Gentle, reflective, nurturing' },
};

export default function StepTone({ value, onChange, productType }) {
  const { lang } = useLang();

  // Only show tones that are strong or neutral for this product type
  const strongTones = getStrongTonesForType(productType);
  const visibleTones = productType
    ? TONES.filter(tone => getToneFit(productType, tone) !== 'weak')
    : TONES;

  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
        {t(lang, 'step_tone_title')}
      </h2>
      <p className="text-muted-foreground mb-4">{t(lang, 'step_tone_sub')}</p>

      {productType && (
        <div className="mb-5 text-xs text-muted-foreground bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          💡 Recommended tones for a <strong>{productType}</strong> are highlighted below
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleTones.map(toneName => {
          const fit = getToneFit(productType, toneName);
          const isSelected = value === toneName;
          const isRecommended = fit === 'strong';
          const detail = toneDetails[toneName] || { emoji: '✦', desc: '' };

          return (
            <button key={toneName} onClick={() => onChange(toneName)}
              className={`flex items-start gap-4 p-5 rounded-xl border text-left transition-all hover:scale-[1.01] ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/40'
              }`}>
              <span className="text-2xl flex-shrink-0">{detail.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-foreground">{toneName}</span>
                  {isRecommended && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Recommended
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{detail.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}