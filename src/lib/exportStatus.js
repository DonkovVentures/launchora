/**
 * exportStatus.js
 * Shared config and helpers for the export lifecycle status.
 *
 * exportStatus values:
 *   "not_generated" – no export ever run
 *   "generating"    – ZIP is being built right now
 *   "ready"         – export succeeded and files are fresh
 *   "stale"         – product edited after last export
 *   "failed"        – last export attempt errored
 */

export const EXPORT_STATUS = {
  NOT_GENERATED: 'not_generated',
  GENERATING: 'generating',
  READY: 'ready',
  STALE: 'stale',
  FAILED: 'failed',
};

export const EXPORT_STATUS_CONFIG = {
  not_generated: {
    label: 'Not generated',
    shortLabel: 'No export',
    color: 'bg-muted text-muted-foreground',
    dotColor: 'bg-slate-400',
    description: 'No ZIP has been generated yet.',
  },
  generating: {
    label: 'Generating…',
    shortLabel: 'Generating',
    color: 'bg-orange-100 text-orange-700',
    dotColor: 'bg-orange-500',
    description: 'Your ZIP export is being built.',
    spin: true,
  },
  ready: {
    label: 'Ready to download',
    shortLabel: 'Ready',
    color: 'bg-green-100 text-green-700',
    dotColor: 'bg-green-500',
    description: 'Your export files are up to date.',
  },
  stale: {
    label: 'Needs regeneration',
    shortLabel: 'Outdated',
    color: 'bg-amber-100 text-amber-700',
    dotColor: 'bg-amber-500',
    description: 'This product was edited after the last export. Regenerate the ZIP to include the latest changes.',
  },
  failed: {
    label: 'Export failed',
    shortLabel: 'Failed',
    color: 'bg-red-100 text-red-700',
    dotColor: 'bg-red-500',
    description: 'The last export attempt failed.',
  },
};

/** Resolve the effective export status from a product record. */
export function getExportStatus(product) {
  return product?.export_status || EXPORT_STATUS.NOT_GENERATED;
}