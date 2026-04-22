import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles, Download, X, Loader2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    period: '',
    features: ['1 ZIP export total', 'PDF + TXT files', 'All templates'],
    cta: 'Download Free (1 left)',
    popular: false,
    isFree: true,
  },
  {
    key: 'starter',
    name: 'Starter',
    price: '$9',
    period: '/mo',
    features: ['10 products/month', 'ZIP export always', 'All templates', 'SEO copy included'],
    cta: 'Start Starter',
    popular: false,
  },
  {
    key: 'creator',
    name: 'Creator',
    price: '$19',
    period: '/mo',
    features: ['Unlimited products', 'ZIP export always', 'Priority AI generation', 'Platform launch guide'],
    cta: 'Start Creator',
    popular: true,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$39',
    period: '/mo',
    features: ['Everything in Creator', 'White-label exports', 'Team access', 'Priority support'],
    cta: 'Start Pro',
    popular: false,
  },
];

const FREE_EXPORT_KEY = 'launchora_free_zip_used';

export default function ZipExportModal({ product, style, onClose }) {
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [freeUsed, setFreeUsed] = useState(false);

  useEffect(() => {
    setFreeUsed(localStorage.getItem(FREE_EXPORT_KEY) === 'true');
  }, []);

  const downloadZip = async (markFreeUsed = false) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('generateZip', {
        productId: product.id,
        stylePreset: style,
      });
      // res.data is the raw response — for binary we need to re-fetch using the function URL
      // Instead, use fetch directly with the base44 token approach via axios blob
      const safeName = (product.generated_data?.title || product.title || 'product')
        .replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 40);

      // The SDK invoke returns the response. For binary zip, use arraybuffer approach
      if (res.data instanceof ArrayBuffer || res.data instanceof Uint8Array) {
        const blob = new Blob([res.data], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${safeName}_launchora.zip`; a.click();
        URL.revokeObjectURL(url);
      } else {
        // Fallback: re-invoke using raw fetch with session token
        const tokenRes = await base44.auth.me().catch(() => null);
        const token = document.cookie.match(/session_token=([^;]+)/)?.[1] || '';
        const fetchRes = await fetch('/api/functions/generateZip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ productId: product.id, stylePreset: style }),
          credentials: 'include',
        });
        if (!fetchRes.ok) throw new Error('Failed to generate ZIP');
        const blob = await fetchRes.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${safeName}_launchora.zip`; a.click();
        URL.revokeObjectURL(url);
      }

      if (markFreeUsed) {
        localStorage.setItem(FREE_EXPORT_KEY, 'true');
        setFreeUsed(true);
      }
    } catch (e) {
      alert('Error generating ZIP: ' + e.message);
    }
    setLoading(false);
  };

  const handleCheckout = async (planKey) => {
    // Check if in iframe
    if (window.self !== window.top) {
      alert('Checkout only works from the published app. Please open the app in a new tab.');
      return;
    }
    setCheckoutLoading(planKey);
    try {
      const res = await base44.functions.invoke('createCheckout', {
        plan: planKey,
        successUrl: window.location.href,
        cancelUrl: window.location.href,
      });
      if (res.data?.url) window.location.href = res.data.url;
    } catch (e) {
      alert('Checkout error: ' + e.message);
    }
    setCheckoutLoading(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" /> Download Your Product
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Choose a plan to export your ZIP package (PDF + Listing + Content + Platform Guide)
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plans */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`relative border rounded-xl p-4 flex flex-col ${
                plan.popular
                  ? 'border-primary shadow-md shadow-primary/10'
                  : 'border-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="gradient-bg text-white text-[10px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Popular
                  </div>
                </div>
              )}
              <div className="mb-3">
                <div className="font-bold text-foreground">{plan.name}</div>
                <div className="flex items-baseline gap-0.5 mt-1">
                  <span className="font-display text-2xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-1.5 mb-4 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.isFree ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs font-semibold"
                  onClick={() => downloadZip(true)}
                  disabled={freeUsed || loading}
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : freeUsed ? (
                    <><Lock className="w-3.5 h-3.5 mr-1" /> Used</>
                  ) : (
                    <><Download className="w-3.5 h-3.5 mr-1" /> {plan.cta}</>
                  )}
                </Button>
              ) : (
                <Button
                  size="sm"
                  className={`w-full text-xs font-semibold ${plan.popular ? 'gradient-bg text-white hover:opacity-90' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleCheckout(plan.key)}
                  disabled={checkoutLoading === plan.key}
                >
                  {checkoutLoading === plan.key ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    plan.cta
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground pb-5">
          Secure payment via Stripe · Cancel anytime
        </p>
      </motion.div>
    </div>
  );
}