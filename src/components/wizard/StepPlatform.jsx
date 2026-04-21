import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

const platforms = [
  { name: 'Etsy', icon: '🛍️', descKey: 'platform_etsy_desc', tag: true },
  { name: 'Gumroad', icon: '💚', descKey: 'platform_gumroad_desc', tag: false },
  { name: 'Payhip', icon: '💜', descKey: 'platform_payhip_desc', tag: false },
  { name: 'Shopify', icon: '🛒', descKey: 'platform_shopify_desc', tag: false },
  { name: 'Ko-fi', icon: '☕', descKey: 'platform_kofi_desc', tag: false },
  { name: 'Stan Store', icon: '⭐', descKey: 'platform_stan_desc', tag: false },
  { name: 'Creative Market', icon: '🎨', descKey: 'platform_cm_desc', tag: false },
  { name: 'Custom Website', icon: '🌐', descKey: 'platform_custom_desc', tag: false },
];

export default function StepPlatform({ value, onChange }) {
  const { lang } = useLang();
  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">{t(lang, 'step_platform_title')}</h2>
      <p className="text-muted-foreground mb-8">{t(lang, 'step_platform_sub')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {platforms.map(p => (
          <button key={p.name} onClick={() => onChange(p.name)}
            className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:scale-[1.01] ${
              value === p.name ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border bg-card hover:border-primary/40'
            }`}>
            <span className="text-2xl flex-shrink-0">{p.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">{p.name}</span>
                {p.tag && <span className="text-[10px] gradient-bg text-white px-2 py-0.5 rounded-full font-medium">{t(lang, 'platform_most_popular')}</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{t(lang, p.descKey)}</div>
            </div>
            {value === p.name && <div className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center flex-shrink-0"><span className="text-white text-xs">✓</span></div>}
          </button>
        ))}
      </div>
    </div>
  );
}