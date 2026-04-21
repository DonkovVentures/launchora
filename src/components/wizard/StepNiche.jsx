import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { getTypeFitForNiche, getBestTypesForNiche } from '@/lib/compatibility';

const niches = [
  { name: 'Productivity', emoji: '⚡' },
  { name: 'Fitness', emoji: '💪' },
  { name: 'Self-care', emoji: '🌸' },
  { name: 'Business', emoji: '💼' },
  { name: 'Budgeting', emoji: '💰' },
  { name: 'Moms', emoji: '👶' },
  { name: 'Students', emoji: '🎓' },
  { name: 'Freelancers', emoji: '💻' },
  { name: 'Real Estate', emoji: '🏠' },
  { name: 'Coaches', emoji: '🎯' },
  { name: 'Creators', emoji: '🎨' },
  { name: 'Social Media', emoji: '📱' },
  { name: 'Wellness', emoji: '🧘' },
  { name: 'Organization', emoji: '🗂️' },
];

export default function StepNiche({ value, onChange, productType }) {
  const { lang } = useLang();

  // Sort: strong matches (niche pairs well with chosen productType) come first
  const sorted = [...niches].sort((a, b) => {
    const aStrong = getTypeFitForNiche(a.name, productType) === 'strong' ? 0 : 1;
    const bStrong = getTypeFitForNiche(b.name, productType) === 'strong' ? 0 : 1;
    return aStrong - bStrong;
  });

  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">{t(lang, 'step_niche_title')}</h2>
      <p className="text-muted-foreground mb-2">{t(lang, 'step_niche_sub')}</p>

      {productType && (
        <div className="mb-5 text-xs text-muted-foreground bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          💡 Highlighted niches sell well as a <strong>{productType}</strong>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sorted.map(n => {
          const isStrong = productType && getTypeFitForNiche(n.name, productType) === 'strong';
          const isSelected = value === n.name;
          return (
            <button key={n.name} onClick={() => onChange(n.name)}
              className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-left transition-all hover:scale-[1.02] relative ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : isStrong
                  ? 'border-green-300 bg-green-50/60 hover:border-green-400'
                  : 'border-border bg-card hover:border-primary/40'
              }`}>
              <span className="text-lg">{n.emoji}</span>
              <span className="font-medium text-sm text-foreground">{n.name}</span>
              {isStrong && !isSelected && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-green-400" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-foreground block mb-2">{t(lang, 'step_niche_custom_label')}</label>
        <input type="text" placeholder={t(lang, 'step_niche_custom_placeholder')}
          value={niches.find(n => n.name === value) ? '' : value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary" />
      </div>
    </div>
  );
}