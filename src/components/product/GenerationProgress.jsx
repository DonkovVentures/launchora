import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Loader2, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const PHASES = [
  {
    key: 'blueprint',
    label: 'Product Blueprint',
    description: 'Content structure & core product',
    critical: true,
  },
  {
    key: 'salesCopy',
    label: 'Sales Copy',
    description: 'Listing title, description & keywords',
    critical: false,
  },
  {
    key: 'platformGuides',
    label: 'Platform Guide',
    description: 'Launch tips & pricing strategy',
    critical: false,
  },
  {
    key: 'socialKit',
    label: 'Social Media Kit',
    description: 'Captions, scripts & content calendar',
    critical: false,
  },
  {
    key: 'launchPlan',
    label: 'Launch Plan',
    description: '30-day launch roadmap',
    critical: false,
  },
];

function PhaseIcon({ status }) {
  if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />;
  if (status === 'generating') return <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />;
  if (status === 'failed') return <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />;
  return <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
}

export default function GenerationProgress({ product, onRetry }) {
  const [retrying, setRetrying] = useState({});
  const progress = product?.generationProgress || {};
  const genStatus = product?.generationStatus;

  // Don't show if completed cleanly or idle
  if (!genStatus || genStatus === 'idle' || genStatus === 'completed') return null;

  const hasFailed = Object.values(progress).some(s => s === 'failed');
  const isGenerating = Object.values(progress).some(s => s === 'generating');
  const blueprintFailed = progress.blueprint === 'failed';

  const handleRetry = async (phase) => {
    setRetrying(prev => ({ ...prev, [phase]: true }));
    try {
      await base44.functions.invoke('retryPhase', { productId: product.id, phase });
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
        blueprintFailed
          ? 'bg-red-50 border-red-200'
          : hasFailed
          ? 'bg-amber-50 border-amber-200'
          : 'bg-orange-50 border-orange-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {isGenerating && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
        {!isGenerating && hasFailed && <AlertCircle className="w-4 h-4 text-amber-600" />}
        <p className={`text-sm font-semibold ${
          blueprintFailed ? 'text-red-800' : hasFailed ? 'text-amber-800' : 'text-orange-800'
        }`}>
          {blueprintFailed
            ? 'Blueprint generation failed — product unavailable'
            : hasFailed
            ? 'Some assets failed to generate — retry below'
            : 'Generating your product assets...'}
        </p>
      </div>

      {blueprintFailed ? (
        <p className="text-xs text-red-600 mb-3">
          The core blueprint failed. Please go back and try creating the product again.
        </p>
      ) : (
        <div className="space-y-2">
          {PHASES.map(phase => {
            const status = progress[phase.key] || 'pending';
            const isRetrying = retrying[phase.key];
            const canRetry = status === 'failed' && !phase.critical;

            return (
              <div
                key={phase.key}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${
                  status === 'done' ? 'bg-green-50/60' :
                  status === 'failed' ? 'bg-red-50/80' :
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
                    status === 'done' ? 'bg-green-100 text-green-700' :
                    status === 'generating' ? 'bg-orange-100 text-orange-700' :
                    status === 'failed' ? 'bg-red-100 text-red-700' :
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
      )}
    </motion.div>
  );
}