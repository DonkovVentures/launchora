import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Clock, AlertCircle } from 'lucide-react';

function Row({ label, value, mono = false, warn = false }) {
  if (value === undefined || value === null) return null;
  const displayVal = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
  return (
    <div className="flex items-start gap-2 py-1 border-b border-slate-800 last:border-0">
      <span className="text-slate-500 text-[10px] w-36 flex-shrink-0 mt-0.5">{label}</span>
      <span className={`text-[10px] break-all ${mono ? 'font-mono' : ''} ${warn ? 'text-yellow-400' : 'text-slate-300'}`}>
        {displayVal}
      </span>
    </div>
  );
}

function DurationBar({ label, ms, maxMs }) {
  if (!ms) return null;
  const pct = Math.min(100, (ms / maxMs) * 100);
  const isSlow = ms > 30000;
  return (
    <div className="mb-1">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-slate-400">{label}</span>
        <span className={`text-[10px] font-mono ${isSlow ? 'text-yellow-400' : 'text-slate-300'}`}>
          {ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`}
          {isSlow ? ' ⚠️' : ''}
        </span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${isSlow ? 'bg-yellow-500' : 'bg-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function GenerationDebugPanel({ product, lastUpdate, lastError }) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(new Date().toISOString());

  // Only show in dev/preview (not on custom domains)
  const isDev = window.location.hostname.includes('base44') ||
                window.location.hostname === 'localhost' ||
                window.location.hostname.includes('127.0.0.1');

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(new Date().toISOString()), 1000);
    return () => clearInterval(t);
  }, [open]);

  if (!isDev || !product) return null;

  const timings = product.generationTimings || {};
  const exportTimings = product.exportTimings || {};
  const progress = product.generationProgress || {};

  const stepDurations = {
    Blueprint: timings.blueprintDurationMs,
    'Sales Copy': timings.salesCopyDurationMs,
    'Platform Guides': timings.platformGuidesDurationMs,
    'Social Kit': timings.socialKitDurationMs,
    'Launch Plan': timings.launchPlanDurationMs,
  };
  const knownDurations = Object.values(stepDurations).filter(Boolean);
  const maxDuration = Math.max(...knownDurations, 1);

  const exportStepDurations = {
    'Product Fetch': exportTimings.productFetchDurationMs,
    'ZIP Build': exportTimings.zipBuildDurationMs,
    'Upload': exportTimings.uploadDurationMs,
  };
  const exportDurations = Object.values(exportStepDurations).filter(Boolean);
  const maxExportDuration = Math.max(...exportDurations, 1);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 font-mono">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between bg-slate-950 text-slate-300 text-[10px] px-3 py-2 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-primary" />
          🔬 Debug Panel
          {timings.slowestStep && (
            <span className="text-yellow-400">· slowest: {timings.slowestStep}</span>
          )}
        </span>
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      {open && (
        <div className="mt-1 bg-slate-950 border border-slate-700 rounded-xl p-3 max-h-[70vh] overflow-y-auto space-y-3 shadow-2xl">

          {/* Product identity */}
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Product</p>
            <Row label="productId" value={product.id} mono />
            <Row label="generationStatus" value={product.generationStatus} warn={product.generationStatus === 'generation_failed'} />
            <Row label="generation_status" value={product.generation_status} />
            <Row label="exportStatus" value={product.export_status} />
            <Row label="status" value={product.status} />
          </div>

          {/* Timestamps */}
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Timestamps</p>
            <Row label="createdAt" value={product.created_date} mono />
            <Row label="updatedAt" value={product.updated_date} mono />
            <Row label="lastEditedAt" value={product.last_edited_at} mono />
            <Row label="lastExportedAt" value={product.last_exported_at} mono />
            <Row label="frontendNow" value={now} mono />
            <Row label="lastBackendUpdate" value={lastUpdate} mono />
          </div>

          {/* Generation progress */}
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Generation Progress</p>
            {Object.entries(progress).map(([k, v]) => (
              <Row key={k} label={k} value={v}
                warn={v === 'failed'}
              />
            ))}
          </div>

          {/* Step durations */}
          {knownDurations.length > 0 && (
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-2">Step Durations</p>
              {Object.entries(stepDurations).map(([k, ms]) => (
                <DurationBar key={k} label={k} ms={ms} maxMs={maxDuration} />
              ))}
              {timings.totalDurationMs && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-800">
                  <Row label="totalDuration" value={`${(timings.totalDurationMs / 1000).toFixed(1)}s`} />
                  <Row label="slowestStep" value={timings.slowestStep} warn />
                </div>
              )}
            </div>
          )}

          {/* Export durations */}
          {exportDurations.length > 0 && (
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-2">Export Durations</p>
              {Object.entries(exportStepDurations).map(([k, ms]) => (
                <DurationBar key={k} label={k} ms={ms} maxMs={maxExportDuration} />
              ))}
              {exportTimings.totalDurationMs && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-800">
                  <Row label="export total" value={`${(exportTimings.totalDurationMs / 1000).toFixed(1)}s`} />
                  <Row label="export slowest" value={exportTimings.slowestStep} warn />
                </div>
              )}
            </div>
          )}

          {/* Timing errors */}
          {timings.errors?.length > 0 && (
            <div>
              <p className="text-[9px] text-red-500 uppercase tracking-widest mb-1">Generation Errors</p>
              {timings.errors.map((e, i) => (
                <div key={i} className="mb-1">
                  <Row label={e.step} value={e.error} warn />
                </div>
              ))}
            </div>
          )}

          {/* Last function response / error */}
          {lastError && (
            <div>
              <p className="text-[9px] text-red-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5" /> Last Error
              </p>
              <pre className="text-[10px] text-red-400 whitespace-pre-wrap break-all">{lastError}</pre>
            </div>
          )}

          {/* Raw timings */}
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Raw Timings</p>
            <pre className="text-[9px] text-slate-500 whitespace-pre-wrap break-all">
              {JSON.stringify(timings, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}