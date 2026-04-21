import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  { q: 'Do I need any design or writing skills?', a: 'No. Launchora generates everything for you — product content, titles, descriptions, keywords and launch instructions. You just describe your idea and the AI does the work.' },
  { q: 'How long does it take to create a product?', a: 'Most products are fully generated in 2–3 minutes. You can go from idea to a complete, sell-ready product and launch plan in one session.' },
  { q: 'What kinds of digital products can I create?', a: 'You can create planners, checklists, trackers, worksheets, workbooks, journals, prompt packs, mini eBooks, template packs, social media packs, printable bundles and lead magnets.' },
  { q: 'Which selling platforms does Launchora support?', a: 'Etsy, Gumroad, Payhip, Shopify, Ko-fi, Stan Store, Creative Market and custom websites. Each platform gets tailored guidance — title format, description style, pricing and publishing steps.' },
  { q: 'Is the free plan really free?', a: 'Yes. You can create one full product for free with no credit card required. Upgrade when you\'re ready to create more.' },
  { q: 'Can I export my product content?', a: 'Yes. You can copy your listing, export your product draft, keywords, launch checklist and platform-specific guidance to use anywhere.' },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section className="py-24 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl font-bold text-foreground mb-3">Frequently asked questions</h2>
          <p className="text-muted-foreground">Everything you need to know about Launchora.</p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="font-medium text-foreground text-sm">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ml-4 ${open === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                      {faq.a}
                    </div>
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