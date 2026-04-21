import { motion } from 'framer-motion';
import { MousePointerClick, Wand2, Globe, Rocket, FileText, DollarSign } from 'lucide-react';

const steps = [
  { icon: MousePointerClick, step: '01', title: 'Pick a product type', desc: 'Choose from planners, checklists, prompt packs, mini eBooks, workbooks and more.' },
  { icon: FileText, step: '02', title: 'Describe your idea', desc: 'Tell the AI what your product is about in plain language — no writing skills needed.' },
  { icon: Wand2, step: '03', title: 'Generate your product', desc: 'AI creates your full product outline, content draft, title, description and keywords.' },
  { icon: Globe, step: '04', title: 'Choose your platform', desc: 'Pick where you want to sell — Etsy, Gumroad, Payhip, Ko-fi, Shopify and more.' },
  { icon: Rocket, step: '05', title: 'Get launch instructions', desc: 'Receive platform-specific guidance: title, description, pricing, tags and publishing steps.' },
  { icon: DollarSign, step: '06', title: 'Publish and start selling', desc: 'Upload, publish, share — your product is live and ready to earn.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-5">
            From idea to sale in a few steps
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
            How Launchora works
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            The simplest way to turn an idea into a digital product you can sell today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative bg-card border border-border rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-primary font-bold tracking-wider mb-1">STEP {s.step}</div>
                  <h3 className="font-display font-semibold text-foreground text-base mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}