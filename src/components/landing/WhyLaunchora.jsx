import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Heart, TrendingUp } from 'lucide-react';

const benefits = [
  { icon: Zap, title: 'Launch in minutes, not weeks', desc: 'From first idea to a complete, sell-ready product in one session. No experience needed.' },
  { icon: CheckCircle2, title: 'No writing from scratch', desc: 'AI generates your titles, descriptions, content and listing copy automatically.' },
  { icon: Heart, title: 'Beginner-friendly by design', desc: 'Every step is clear, simple and guided. Even if you\'ve never sold online before.' },
  { icon: TrendingUp, title: 'Start earning sooner', desc: 'The faster you launch, the sooner you earn. Launchora removes every delay and excuse.' },
];

export default function WhyLaunchora() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              Why Launchora
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-6 leading-tight">
              Start earning faster than you ever thought possible
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Most people never launch because they get stuck. Writing the product, creating the listing, figuring out pricing and tags — it all adds up. Launchora removes all of that friction.
            </p>
            <div className="space-y-2">
              {['No design skills needed', 'No writing from scratch', 'No complicated setup', 'No listing experience needed', 'No excuses left'].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-5 card-shadow"
              >
                <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center mb-4">
                  <b.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-2">{b.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}