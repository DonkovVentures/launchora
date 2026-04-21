import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Zap, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function Hero() {
  const { lang } = useLang();

  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-40 left-1/4 w-64 h-64 rounded-full bg-purple-300/10 blur-3xl" />
        <div className="absolute top-40 right-1/4 w-64 h-64 rounded-full bg-pink-300/10 blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto text-center relative">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          {t(lang, 'hero_badge')}
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-6">
          {t(lang, 'hero_headline_1')}
          <br />
          <span className="gradient-text">{t(lang, 'hero_headline_2')}</span>
          <br />
          {t(lang, 'hero_headline_3')}
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          {t(lang, 'hero_sub')}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Link to="/create">
            <Button size="lg" className="gradient-bg text-white hover:opacity-90 transition-opacity font-semibold px-8 py-6 text-base rounded-xl glow">
              {t(lang, 'hero_cta1')} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a href="#how-it-works">
              <Button size="lg" variant="outline" className="px-8 py-6 text-base rounded-xl font-medium border-border hover:bg-muted/50">
                {t(lang, 'hero_cta2')}
              </Button>
            </a>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}</div>
            <span>{t(lang, 'hero_social_creators')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span>{t(lang, 'hero_social_launch')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>{t(lang, 'hero_social_noskills')}</span>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
        className="max-w-4xl mx-auto mt-16 relative">
        <div className="bg-white border border-border rounded-2xl card-shadow overflow-hidden">
          <div className="bg-muted/50 border-b border-border px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-muted-foreground ml-2">Launchora — Product Creation Wizard</span>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider">{t(lang, 'hero_wizard_step1')}</div>
              <div className="space-y-2">
                {['Planner', 'Checklist', 'Prompt Pack', 'Mini eBook'].map((item, i) => (
                  <div key={item} className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${i === 0 ? 'gradient-bg text-white border-transparent' : 'bg-muted/50 border-border text-muted-foreground'}`}>{item}</div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider">{t(lang, 'hero_wizard_step4')}</div>
              <div className="space-y-2">
                {['Etsy', 'Gumroad', 'Payhip', 'Ko-fi'].map((item, i) => (
                  <div key={item} className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${i === 1 ? 'gradient-bg text-white border-transparent' : 'bg-muted/50 border-border text-muted-foreground'}`}>{item}</div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider">{t(lang, 'hero_wizard_output')}</div>
              <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                <div className="text-xs font-semibold text-foreground">Weekly Productivity Planner for Busy Moms</div>
                <div className="text-xs text-muted-foreground">Listing description, keywords, price: $9–$17</div>
                <div className="text-xs text-muted-foreground">Target: Moms 25–45, productivity niche</div>
                <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full w-4/5 gradient-bg rounded-full" />
                </div>
                <div className="text-[10px] text-primary font-semibold">{t(lang, 'hero_wizard_ready')}</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}