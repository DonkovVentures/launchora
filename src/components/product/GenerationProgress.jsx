import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Loader2, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const PHASES = [
  { key: 'blueprint',      label: 'Product Blueprint',   description: 'Structure & core content', retryable: false },
  { key: 'salesCopy',      label: 'Sales Copy',           description: 'Listing title, description & keywords', retryable: true },
  { key: 'platformGuides', label: 'Platform Guide',       description: 'Launch tips & pricing strategy', retryable: true },
  { key: 'socialKit',      label: 'Social Media Kit',     description: 'Captions, scripts & content calendar', retryable: true },
  { key: 'launchPlan',     label: 'Launch Plan',          description: '30-day launch roadmap', retryable: true },
];

function PhaseIcon({ status }) {
  if (status === 'done')      return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />;
  if (status === 'generating') return <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />;
  if (status === 'failed')    return <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />;
  return <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
}

export default function GenerationProgress({ product, onRetry }) {
  const [retrying, setRetrying] = useState({});
  const progress = product?.generationProgress || {};
  const genStatus = product?.generationStatus;

  // Hide when fully complete or not yet started
  if (!genStatus || genStatus === 'idle' || genStatus === 'completed') return null;

  const hasAnyFailed = Object.entries(progress).some(([k, v]) => v === 'failed' && k !== 'blueprint');
  const isGenerating = Object.values(progress).some(s => s === 'generating');
  const secondaryAssetsFailed = hasAnyFailed && !isGenerating;

  // Blueprint is always considered done now (phase1-based)
  const headerMsg = isGenerating
    ? 'Generating launch assets in the background...'
    : secondaryAssetsFailed
    ? 'Some assets failed — retry individual steps below'
    : 'All assets ready';

  const handleRetry = async (phase) => {
    setRetrying(prev => ({ ...prev, [phase]: true }));
    try {
      await base44.functions.invoke('enrichProduct', { productId: product.id, retryStep: phase });
      onRetry?.();
    } catch (e) {
      console.error('[GenerationProgress] Retry failed:', e);
    }
    setRetrying(prev => ({ ...prev, [phase]: false }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 mb-4 ${
        secondaryAssetsFailed
          ? 'bg-amber-50 border-amber-200'
          : isGenerating
          ? 'bg-orange-50 border-orange-200'
          : 'bg-green-50 border-green-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {isGenerating && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
        {secondaryAssetsFailed && !isGenerating && <AlertCircle className="w-4 h-4 text-amber-600" />}
        <p className={`text-sm font-semibold ${
          secondaryAssetsFailed && !isGenerating ? 'text-amber-800' : isGenerating ? 'text-orange-800' : 'text-green-800'
        }`}>
          {headerMsg}
        </p>
      </div>

      <div className="space-y-2">
        {PHASES.map(phase => {
          const status = progress[phase.key] || (phase.key === 'blueprint' ? 'done' : 'pending');
          const isRetrying = retrying[phase.key];
          const canRetry = phase.retryable && status === 'failed';

          return (
            <div
              key={phase.key}
              className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${
                status === 'done'      ? 'bg-green-50/60' :
                status === 'failed'    ? 'bg-red-50/80' :
                status === 'generating' ? 'bg-white/80' :
                'bg-white/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <PhaseIcon status={status} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">{phase.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{phase.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  status === 'done'      ? 'bg-green-100 text-green-700' :
                  status === 'generating' ? 'bg-orange-100 text-orange-700' :
                  status === 'failed'    ? 'bg-red-100 text-red-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {status === 'pending' ? 'Queued' : status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
                {canRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10px] border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => handleRetry(phase.key)}
                    disabled={isRetrying}
                  >
                    {isRetrying
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <><RefreshCw className="w-3 h-3 mr-1" />Retry</>
                    }
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}