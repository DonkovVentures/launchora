import { motion } from 'framer-motion';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function Platforms() {
  const { lang } = useLang();

  const platforms = [
    { name: 'Etsy', icon: '🛍️', descKey: 'pl_etsy_desc', color: 'text-orange-600' },
    { name: 'Gumroad', icon: '💚', descKey: 'pl_gumroad_desc', color: 'text-green-600' },
    { name: 'Payhip', icon: '💜', descKey: 'pl_payhip_desc', color: 'text-purple-600' },
    { name: 'Shopify', icon: '🛒', descKey: 'pl_shopify_desc', color: 'text-green-700' },
    { name: 'Ko-fi', icon: '☕', descKey: 'pl_kofi_desc', color: 'text-blue-600' },
    { name: 'Stan Store', icon: '⭐', descKey: 'pl_stan_desc', color: 'text-yellow-600' },
    { name: 'Creative Market', icon: '🎨', descKey: 'pl_cm_desc', color: 'text-pink-600' },
    { name: 'Custom Website', icon: '🌐', descKey: 'pl_custom_desc', color: 'text-indigo-600' },
  ];

  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">{t(lang, 'pl_title')}</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t(lang, 'pl_sub')}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {platforms.map((p, i) => (
            <motion.div key={p.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="bg-card border border-border rounded-2xl p-5 card-shadow hover:card-shadow-hover transition-all text-center group">
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{p.icon}</div>
              <div className={`font-display font-bold text-sm mb-1 ${p.color}`}>{p.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{t(lang, p.descKey)}</div>
            </motion.div>
          ))}
        </div>
        <div className="mt-14 bg-gradient-to-br from-primary/5 to-purple-50 border border-primary/15 rounded-2xl p-8 text-center">
          <h3 className="font-display text-2xl font-bold text-foreground mb-3">{t(lang, 'pl_intel_title')}</h3>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">{t(lang, 'pl_intel_desc')}</p>
        </div>
      </div>
    </section>
  );
}