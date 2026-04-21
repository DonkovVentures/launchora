import { motion } from 'framer-motion';

const platforms = [
  { name: 'Etsy', icon: '🛍️', desc: 'Huge marketplace for digital downloads', color: 'text-orange-600' },
  { name: 'Gumroad', icon: '💚', desc: 'Creator-first platform, instant payouts', color: 'text-green-600' },
  { name: 'Payhip', icon: '💜', desc: 'Simple and powerful digital store', color: 'text-purple-600' },
  { name: 'Shopify', icon: '🛒', desc: 'Build your own brand store', color: 'text-green-700' },
  { name: 'Ko-fi', icon: '☕', desc: 'Great for creators and supporters', color: 'text-blue-600' },
  { name: 'Stan Store', icon: '⭐', desc: 'Link-in-bio storefront for creators', color: 'text-yellow-600' },
  { name: 'Creative Market', icon: '🎨', desc: 'Premium design and template marketplace', color: 'text-pink-600' },
  { name: 'Custom Website', icon: '🌐', desc: 'Sell directly from your own site', color: 'text-indigo-600' },
];

export default function Platforms() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Where you can sell
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Pick your platform. Launchora adapts every listing, title, description and pricing recommendation specifically for it.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {platforms.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="bg-card border border-border rounded-2xl p-5 card-shadow hover:card-shadow-hover transition-all text-center group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{p.icon}</div>
              <div className={`font-display font-bold text-sm mb-1 ${p.color}`}>{p.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{p.desc}</div>
            </motion.div>
          ))}
        </div>

        <div className="mt-14 bg-gradient-to-br from-primary/5 to-purple-50 border border-primary/15 rounded-2xl p-8 text-center">
          <h3 className="font-display text-2xl font-bold text-foreground mb-3">Platform-specific launch intelligence</h3>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            When you choose a platform, Launchora generates a complete, platform-optimized launch kit — including the exact title format, description style, pricing strategy, tags, thumbnail guidance and step-by-step publishing instructions.
          </p>
        </div>
      </div>
    </section>
  );
}