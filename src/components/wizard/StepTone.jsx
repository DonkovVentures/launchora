import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

const tones = [
  { name: 'Professional', emoji: '👔', descKey: 'tone_professional_desc' },
  { name: 'Friendly', emoji: '😊', descKey: 'tone_friendly_desc' },
  { name: 'Motivational', emoji: '🔥', descKey: 'tone_motivational_desc' },
  { name: 'Calm & Nurturing', emoji: '🌿', descKey: 'tone_calm_desc' },
  { name: 'Bold & Direct', emoji: '⚡', descKey: 'tone_bold_desc' },
  { name: 'Educational', emoji: '🎓', descKey: 'tone_educational_desc' },
];

export default function StepTone({ value, onChange }) {
  const { lang } = useLang();
  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">{t(lang, 'step_tone_title')}</h2>
      <p className="text-muted-foreground mb-8">{t(lang, 'step_tone_sub')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tones.map(tone => (
          <button key={tone.name} onClick={() => onChange(tone.name)}
            className={`flex items-start gap-4 p-5 rounded-xl border text-left transition-all hover:scale-[1.01] ${
              value === tone.name ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border bg-card hover:border-primary/40'
            }`}>
            <span className="text-2xl flex-shrink-0">{tone.emoji}</span>
            <div>
              <div className="font-semibold text-sm text-foreground mb-1">{tone.name}</div>
              <div className="text-xs text-muted-foreground">{t(lang, tone.descKey)}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}