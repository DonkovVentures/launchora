import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { getPlatformFit, getBestPlatformsForType } from '@/lib/compatibility';

const platforms = [
  { name: 'Etsy', icon: '🛍️', descKey: 'platform_etsy_desc' },
  { name: 'Gumroad', icon: '💚', descKey: 'platform_gumroad_desc' },
  { name: 'Payhip', icon: '💜', descKey: 'platform_payhip_desc' },
  { name: 'Shopify', icon: '🛒', descKey: 'platform_shopify_desc' },
  { name: 'Ko-fi', icon: '☕', descKey: 'platform_kofi_desc' },
  { name: 'Stan Store', icon: '⭐', descKey: 'platform_stan_desc' },
  { name: 'Creative Market', icon: '🎨', descKey: 'platform_cm_desc' },
  { name: 'Custom Website', icon: '🌐', descKey: 'platform_custom_desc' },
];

const fitConfig = {
  strong:  { label: 'Best fit', className: 'text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium' },
  neutral: { label: null, className: '' },
  weak:    { label: 'Weak fit', className: 'text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium' },
};

export default function StepPlatform({ value, onChange, productType }) {
  const { lang } = useLang();
  const bestPlatforms = getBestPlatformsForType(productType);

  // Sort: strong first, neutral middle, weak last
  const sorted = [...platforms].sort((a, b) => {
    const order = { strong: 0, neutral: 1, weak: 2 };
    return order[getPlatformFit(productType, a.name)] - order[getPlatformFit(productType, b.name)];
  });

  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">{t(lang, 'step_platform_title')}</h2>
      <p className="text-muted-foreground mb-2">{t(lang, 'step_platform_sub')}</p>

      {productType && bestPlatforms.length > 0 && (
        <div className="mb-6 text-xs text-muted-foreground bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          💡 Best for <strong>{productType}</strong>: {bestPlatforms.join(', ')}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map(p => {
          const fit = getPlatformFit(productType, p.name);
          const cfg = fitConfig[fit];
          const isSelected = value === p.name;
          return (
            <button key={p.name} onClick={() => onChange(p.name)}
              className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:scale-[1.01] ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : fit === 'weak'
                  ? 'border-border bg-card opacity-60 hover:opacity-80 hover:border-primary/30'
                  : 'border-border bg-card hover:border-primary/40'
              }`}>
              <span className="text-2xl flex-shrink-0">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">{p.name}</span>
                  {productType && cfg.label && (
                    <span className={cfg.className}>{cfg.label}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{t(lang, p.descKey)}</div>
              </div>
              {isSelected && <div className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center flex-shrink-0"><span className="text-white text-xs">✓</span></div>}
            </button>
          );
        })}
      </div>

      {value && getPlatformFit(productType, value) === 'weak' && (
        <div className="mt-4 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700">
          ⚠️ <strong>{value}</strong> is a weak fit for <strong>{productType}</strong>. Consider {bestPlatforms[0] || 'Gumroad'} or {bestPlatforms[1] || 'Payhip'} for better results.
        </div>
      )}
    </div>
  );
}