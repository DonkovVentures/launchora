import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Heart, TrendingUp } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function WhyLaunchora() {
  const { lang } = useLang();

  const benefits = [
    { icon: Zap, titleKey: 'why_b1_title', descKey: 'why_b1_desc' },
    { icon: CheckCircle2, titleKey: 'why_b2_title', descKey: 'why_b2_desc' },
    { icon: Heart, titleKey: 'why_b3_title', descKey: 'why_b3_desc' },
    { icon: TrendingUp, titleKey: 'why_b4_title', descKey: 'why_b4_desc' },
  ];

  const checks = ['why_check1', 'why_check2', 'why_check3', 'why_check4', 'why_check5'];

  return (
    <section className="py-24 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              {t(lang, 'why_badge')}
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-6 leading-tight">
              {t(lang, 'why_title')}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">{t(lang, 'why_desc')}</p>
            <div className="space-y-2">
              {checks.map(key => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{t(lang, key)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <motion.div key={b.titleKey} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-5 card-shadow">
                <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center mb-4">
                  <b.icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-2">{t(lang, b.titleKey)}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t(lang, b.descKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}