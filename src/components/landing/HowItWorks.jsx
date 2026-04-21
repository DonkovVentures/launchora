import { motion } from 'framer-motion';
import { MousePointerClick, Wand2, Globe, Rocket, FileText, DollarSign } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function HowItWorks() {
  const { lang } = useLang();

  const steps = [
    { icon: MousePointerClick, step: '01', titleKey: 'how_step1_title', descKey: 'how_step1_desc' },
    { icon: FileText, step: '02', titleKey: 'how_step2_title', descKey: 'how_step2_desc' },
    { icon: Wand2, step: '03', titleKey: 'how_step3_title', descKey: 'how_step3_desc' },
    { icon: Globe, step: '04', titleKey: 'how_step4_title', descKey: 'how_step4_desc' },
    { icon: Rocket, step: '05', titleKey: 'how_step5_title', descKey: 'how_step5_desc' },
    { icon: DollarSign, step: '06', titleKey: 'how_step6_title', descKey: 'how_step6_desc' },
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-5">
            {t(lang, 'how_badge')}
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">{t(lang, 'how_title')}</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t(lang, 'how_sub')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative bg-card border border-border rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-primary font-bold tracking-wider mb-1">STEP {s.step}</div>
                  <h3 className="font-display font-semibold text-foreground text-base mb-2">{t(lang, s.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(lang, s.descKey)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}