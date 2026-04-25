import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles, Download, X, Loader2, Lock, AlertCircle, Bug } from 'lucide-react';
import { motion } from 'framer-motion';

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    period: '',
    features: ['1 ZIP export total', 'TXT + content files', 'All templates'],
    cta: 'Download Free (1×)',
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
  const [showDebug, setShowDebug] = useState(false);

  // Debug state
  const [debugStatus, setDebugStatus] = useState('idle');
  const [debugLastResponse, setDebugLastResponse] = useState(null);
  const [debugLastError, setDebugLastError] = useState(null);

  // Download result state
  const [downloadResult, setDownloadResult] = useState(null); // { fileUrl, fileName, fileSize, generatedAt }
  const [exportError, setExportError] = useState(null);

  useEffect(() => {
    setFreeUsed(localStorage.getItem(FREE_EXPORT_KEY) === 'true');
  }, []);

  const downloadZip = async (markFreeUsed = false) => {
    setLoading(true);
    setExportError(null);
    setDownloadResult(null);
    setDebugStatus('loading');
    setDebugLastResponse(null);
    setDebugLastError(null);

    console.log('[ZipExport] Starting ZIP export for productId:', product?.id);

    try {
      const res = await base44.functions.invoke('generateZip', {
        productId: product.id,
        stylePreset: style || 'minimal',
      });

      console.log('[ZipExport] Raw response:', res);
      setDebugLastResponse(res?.data ?? res);

      const data = res?.data ?? res;

      if (!data) {
        throw new Error('Empty response from generateZip function');
      }

      if (data.success === false) {
        const msg = data.error || 'Unknown backend error';
        const detail = data.details || '';
        console.error('[ZipExport] Backend error:', msg, detail);
        setDebugLastError({ error: msg, details: detail });
        setExportError(msg + (detail ? ` — ${detail}` : ''));
        setDebugStatus('error');
        setLoading(false);
        return;
      }

      if (!data.fileUrl) {
        const msg = 'ZIP was generated but no download URL was returned.';
        console.error('[ZipExport]', msg, data);
        setExportError(msg);
        setDebugStatus('error');
        setLoading(false);
        return;
      }

      // Success
      console.log('[ZipExport] fileUrl:', data.fileUrl);
      setDownloadResult(data);
      setDebugStatus('success');

      // Trigger download automatically
      const a = document.createElement('a');
      a.href = data.fileUrl;
      a.target = '_blank';
      a.download = data.fileName || 'product_launchora.zip';
      a.click();

      if (markFreeUsed) {
        localStorage.setItem(FREE_EXPORT_KEY, 'true');
        setFreeUsed(true);
      }

    } catch (e) {
      console.error('[ZipExport] Exception:', e);
      setDebugLastError({ error: e.message, stack: e.stack });
      setExportError(e.message || 'Unexpected error');
      setDebugStatus('error');
    }

    setLoading(false);
  };

  const handleCheckout = async (planKey) => {
    if (window.self !== window.top) {
      alert('Checkout only works from the published app. Please open the app in a new tab.');
      return;
    }
    setCheckoutLoading(planKey);
    try {
      const res = await base44.functions.invoke('createCheckout', {
        plan: planKey,
        successUrl: window.location.origin + '/projects',
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
              Choose a plan to export your ZIP package (Listing + Content + Platform Guide)
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
                plan.popular ? 'border-primary shadow-md shadow-primary/10' : 'border-border'
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
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                  ) : freeUsed ? (
                    <><Lock className="w-3.5 h-3.5 mr-1" /> Already used — upgrade to download</>
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

        {/* Error banner */}
        {exportError && (
          <div className="mx-6 mb-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Export failed</div>
              <div className="text-xs mt-0.5 text-red-600">{exportError}</div>
            </div>
          </div>
        )}

        {/* Success + manual download button */}
        {downloadResult?.fileUrl && (
          <div className="mx-6 mb-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">ZIP ready!</div>
              <div className="text-xs text-green-600">{downloadResult.fileName} · {Math.round(downloadResult.fileSize / 1024)} KB</div>
            </div>
            <a
              href={downloadResult.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          </div>
        )}

        {/* Debug panel */}
        <div className="mx-6 mb-5">
          <button
            onClick={() => setShowDebug(v => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bug className="w-3.5 h-3.5" />
            {showDebug ? 'Hide' : 'Show'} debug panel
          </button>

          {showDebug && (
            <div className="mt-2 bg-slate-950 text-slate-300 rounded-xl p-4 text-xs font-mono space-y-2 border border-slate-800">
              <div><span className="text-slate-500">productId:</span> {product?.id ?? 'N/A'}</div>
              <div><span className="text-slate-500">status:</span>{' '}
                <span className={
                  debugStatus === 'success' ? 'text-green-400' :
                  debugStatus === 'error' ? 'text-red-400' :
                  debugStatus === 'loading' ? 'text-yellow-400' :
                  'text-slate-400'
                }>{debugStatus}</span>
              </div>
              <div>
                <span className="text-slate-500">last response:</span>
                <pre className="mt-1 text-[10px] text-slate-400 whitespace-pre-wrap break-all max-h-32 overflow-auto">
                  {debugLastResponse ? JSON.stringify(debugLastResponse, null, 2) : 'none'}
                </pre>
              </div>
              <div>
                <span className="text-slate-500">last error:</span>
                <pre className="mt-1 text-[10px] text-red-400 whitespace-pre-wrap break-all max-h-32 overflow-auto">
                  {debugLastError ? JSON.stringify(debugLastError, null, 2) : 'none'}
                </pre>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground pb-5">
          Secure payment via Stripe · Cancel anytime
        </p>
      </motion.div>
    </div>
  );
}