import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { useState } from 'react';

export default function PricingSection() {
  const { lang } = useLang();
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  const handleCheckout = async (planKey) => {
    if (window.self !== window.top) {
      alert('Checkout works only from the published app. Please open it in a new tab.');
      return;
    }
    setCheckoutLoading(planKey);
    try {
      const res = await base44.functions.invoke('createCheckout', {
        plan: planKey,
        successUrl: window.location.origin + '/dashboard',
        cancelUrl: window.location.href,
      });
      if (res.data?.url) window.location.href = res.data.url;
    } catch (e) {
      alert('Checkout error: ' + e.message);
    }
    setCheckoutLoading(null);
  };

  const plans = [
    {
      name: 'Free', subtitleKey: 'pricing_free_sub', price: '$0', periodKey: '',
      ctaKey: 'pricing_cta_free', popular: false,
      featureKeys: ['pricing_free_f1','pricing_free_f2','pricing_free_f3','pricing_free_f4','pricing_free_f5'],
    },
    {
      name: 'Starter', subtitleKey: 'pricing_starter_sub', price: '$9', periodKey: 'pricing_month',
      ctaKey: 'pricing_cta_starter', popular: false,
      featureKeys: ['pricing_starter_f1','pricing_starter_f2','pricing_starter_f3','pricing_starter_f4','pricing_starter_f5','pricing_starter_f6'],
    },
    {
      name: 'Creator', subtitleKey: 'pricing_creator_sub', price: '$19', periodKey: 'pricing_month',
      ctaKey: 'pricing_cta_creator', popular: true,
      featureKeys: ['pricing_creator_f1','pricing_creator_f2','pricing_creator_f3','pricing_creator_f4','pricing_creator_f5','pricing_creator_f6'],
    },
    {
      name: 'Pro', subtitleKey: 'pricing_pro_sub', price: '$39', periodKey: 'pricing_month',
      ctaKey: 'pricing_cta_pro', popular: false,
      featureKeys: ['pricing_pro_f1','pricing_pro_f2','pricing_pro_f3','pricing_pro_f4','pricing_pro_f5'],
    },
  ];

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-5">
            {t(lang, 'pricing_badge')}
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">{t(lang, 'pricing_title')}</h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">{t(lang, 'pricing_sub')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`relative bg-card border rounded-2xl p-6 flex flex-col ${plan.popular ? 'border-primary shadow-lg shadow-primary/10 scale-105' : 'border-border card-shadow'}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="gradient-bg text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {t(lang, 'pricing_popular')}
                  </div>
                </div>
              )}
              <div className="mb-5">
                <div className="font-display font-bold text-foreground text-lg">{plan.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t(lang, plan.subtitleKey)}</div>
              </div>
              <div className="mb-6">
                <span className="font-display text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.periodKey ? t(lang, plan.periodKey) : ''}</span>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.featureKeys.map(fk => (
                  <li key={fk} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{t(lang, fk)}</span>
                  </li>
                ))}
              </ul>
              {plan.name === 'Free' ? (
                <Link to="/create">
                  <Button className="w-full font-semibold rounded-xl border-border hover:bg-muted/50" variant="outline">
                    {t(lang, plan.ctaKey)}
                  </Button>
                </Link>
              ) : (
                <Button
                  className={`w-full font-semibold rounded-xl ${plan.popular ? 'gradient-bg text-white hover:opacity-90' : 'border-border hover:bg-muted/50'}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleCheckout(plan.name.toLowerCase())}
                  disabled={checkoutLoading === plan.name.toLowerCase()}
                >
                  {checkoutLoading === plan.name.toLowerCase() ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t(lang, plan.ctaKey)
                  )}
                </Button>
              )}
            </motion.div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-8">{t(lang, 'pricing_note')}</p>
      </div>
    </section>
  );
}