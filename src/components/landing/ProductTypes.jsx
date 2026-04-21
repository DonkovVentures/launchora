import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function ProductTypes() {
  const { lang } = useLang();

  const products = [
    { name: 'Planner', emoji: '📅', descKey: 'pt_planner_desc', color: 'bg-purple-50 border-purple-200' },
    { name: 'Checklist', emoji: '✅', descKey: 'pt_checklist_desc', color: 'bg-blue-50 border-blue-200' },
    { name: 'Tracker', emoji: '📊', descKey: 'pt_tracker_desc', color: 'bg-green-50 border-green-200' },
    { name: 'Worksheet', emoji: '📝', descKey: 'pt_worksheet_desc', color: 'bg-orange-50 border-orange-200' },
    { name: 'Workbook', emoji: '📚', descKey: 'pt_workbook_desc', color: 'bg-pink-50 border-pink-200' },
    { name: 'Journal', emoji: '🗒️', descKey: 'pt_journal_desc', color: 'bg-yellow-50 border-yellow-200' },
    { name: 'Prompt Pack', emoji: '✨', descKey: 'pt_prompt_desc', color: 'bg-purple-50 border-purple-200' },
    { name: 'Mini eBook', emoji: '📖', descKey: 'pt_ebook_desc', color: 'bg-blue-50 border-blue-200' },
    { name: 'Template Pack', emoji: '🎨', descKey: 'pt_template_desc', color: 'bg-green-50 border-green-200' },
    { name: 'Social Media Pack', emoji: '📱', descKey: 'pt_social_desc', color: 'bg-orange-50 border-orange-200' },
    { name: 'Printable Bundle', emoji: '🖨️', descKey: 'pt_printable_desc', color: 'bg-pink-50 border-pink-200' },
    { name: 'Lead Magnet', emoji: '🧲', descKey: 'pt_lead_desc', color: 'bg-yellow-50 border-yellow-200' },
  ];

  return (
    <section id="what-you-can-create" className="py-24 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">{t(lang, 'pt_title')}</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t(lang, 'pt_sub')}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {products.map((p, i) => (
            <motion.div key={p.name} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className={`${p.color} border rounded-xl p-4 hover:scale-105 transition-transform cursor-default`}>
              <div className="text-2xl mb-2">{p.emoji}</div>
              <div className="font-semibold text-foreground text-sm mb-1">{p.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{t(lang, p.descKey)}</div>
            </motion.div>
          ))}
        </div>
        <div className="text-center">
          <Link to="/create">
            <Button size="lg" className="gradient-bg text-white hover:opacity-90 font-semibold px-8 rounded-xl">
              {t(lang, 'pt_cta')} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}