import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function FAQ() {
  const [open, setOpen] = useState(null);
  const { lang } = useLang();

  const faqs = [
    { qKey: 'faq_q1', aKey: 'faq_a1' },
    { qKey: 'faq_q2', aKey: 'faq_a2' },
    { qKey: 'faq_q3', aKey: 'faq_a3' },
    { qKey: 'faq_q4', aKey: 'faq_a4' },
    { qKey: 'faq_q5', aKey: 'faq_a5' },
    { qKey: 'faq_q6', aKey: 'faq_a6' },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl font-bold text-foreground mb-3">{t(lang, 'faq_title')}</h2>
          <p className="text-muted-foreground">{t(lang, 'faq_sub')}</p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-6 py-5 text-left">
                <span className="font-medium text-foreground text-sm">{t(lang, faq.qKey)}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ml-4 ${open === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">{t(lang, faq.aKey)}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}