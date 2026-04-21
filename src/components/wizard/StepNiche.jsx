import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

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

export default function StepNiche({ value, onChange }) {
  const { lang } = useLang();
  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">{t(lang, 'step_niche_title')}</h2>
      <p className="text-muted-foreground mb-8">{t(lang, 'step_niche_sub')}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {niches.map(n => (
          <button key={n.name} onClick={() => onChange(n.name)}
            className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-left transition-all hover:scale-[1.02] ${
              value === n.name ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border bg-card hover:border-primary/40'
            }`}>
            <span className="text-lg">{n.emoji}</span>
            <span className="font-medium text-sm text-foreground">{n.name}</span>
          </button>
        ))}
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