import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const plans = [
  {
    name: 'Free',
    subtitle: 'Create your first product free',
    price: '$0',
    period: '',
    cta: 'Start Free',
    ctaVariant: 'outline',
    popular: false,
    features: ['1 free product', 'Basic AI generation', 'Basic title and description', 'Basic listing copy', 'Simple launch guidance'],
  },
  {
    name: 'Starter',
    subtitle: 'For beginners',
    price: '$9',
    period: '/month',
    cta: 'Get Starter',
    ctaVariant: 'outline',
    popular: false,
    features: ['Up to 10 products/month', 'Core product generation', 'Listing descriptions', 'Keyword suggestions', 'Export tools', 'Basic platform guidance'],
  },
  {
    name: 'Creator',
    subtitle: 'Best for active sellers',
    price: '$19',
    period: '/month',
    cta: 'Get Creator',
    ctaVariant: 'primary',
    popular: true,
    features: ['Up to 50 products/month', 'Full platform-specific guidance', 'Pricing suggestions', 'Audience suggestions', 'Saved drafts', 'Advanced launch tools'],
  },
  {
    name: 'Pro',
    subtitle: 'For power users',
    price: '$39',
    period: '/month',
    cta: 'Get Pro',
    ctaVariant: 'outline',
    popular: false,
    features: ['High-volume product generation', 'Premium launch kits', 'Advanced templates', 'Premium export tools', 'Priority support'],
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-5">
            Affordable plans for creators
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Start free. Upgrade when ready.
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Launch your first product for free. Upgrade when you're ready to create more.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`relative bg-card border rounded-2xl p-6 flex flex-col ${plan.popular ? 'border-primary shadow-lg shadow-primary/10 scale-105' : 'border-border card-shadow'}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="gradient-bg text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </div>
                </div>
              )}
              <div className="mb-5">
                <div className="font-display font-bold text-foreground text-lg">{plan.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{plan.subtitle}</div>
              </div>
              <div className="mb-6">
                <span className="font-display text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/create">
                <Button
                  className={`w-full font-semibold rounded-xl ${plan.popular ? 'gradient-bg text-white hover:opacity-90' : 'border-border hover:bg-muted/50'}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-8">No credit card required for free plan. Cancel anytime.</p>
      </div>
    </section>
  );
}