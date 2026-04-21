import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function FinalCTA() {
  const { lang } = useLang();
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="gradient-bg rounded-3xl p-12 sm:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          </div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              {t(lang, 'cta_badge')}
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">{t(lang, 'cta_title')}</h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-10 leading-relaxed">{t(lang, 'cta_sub')}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/create">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold px-8 py-6 text-base rounded-xl">
                  {t(lang, 'cta_btn1')} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base rounded-xl font-medium">
                  {t(lang, 'cta_btn2')}
                </Button>
              </Link>
            </div>
            <p className="text-white/50 text-xs mt-6">{t(lang, 'cta_note')}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}