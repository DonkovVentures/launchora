const platforms = [
  { name: 'Etsy', icon: '🛍️', desc: 'Largest marketplace for digital downloads', tag: 'Most popular' },
  { name: 'Gumroad', icon: '💚', desc: 'Creator-first, instant payouts', tag: '' },
  { name: 'Payhip', icon: '💜', desc: 'Simple and powerful digital store', tag: '' },
  { name: 'Shopify', icon: '🛒', desc: 'Build your own brand store', tag: '' },
  { name: 'Ko-fi', icon: '☕', desc: 'Great for supporters and creators', tag: '' },
  { name: 'Stan Store', icon: '⭐', desc: 'Link-in-bio storefront for creators', tag: '' },
  { name: 'Creative Market', icon: '🎨', desc: 'Premium design marketplace', tag: '' },
  { name: 'Custom Website', icon: '🌐', desc: 'Sell directly from your own site', tag: '' },
];

export default function StepPlatform({ value, onChange }) {
  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">Where do you want to sell?</h2>
      <p className="text-muted-foreground mb-8">Launchora will generate platform-specific titles, descriptions, pricing and publishing instructions for the platform you choose.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {platforms.map(p => (
          <button
            key={p.name}
            onClick={() => onChange(p.name)}
            className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:scale-[1.01] ${
              value === p.name
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border bg-card hover:border-primary/40'
            }`}
          >
            <span className="text-2xl flex-shrink-0">{p.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">{p.name}</span>
                {p.tag && <span className="text-[10px] gradient-bg text-white px-2 py-0.5 rounded-full font-medium">{p.tag}</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{p.desc}</div>
            </div>
            {value === p.name && <div className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center flex-shrink-0"><span className="text-white text-xs">✓</span></div>}
          </button>
        ))}
      </div>
    </div>
  );
}