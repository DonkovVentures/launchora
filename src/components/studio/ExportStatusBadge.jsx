import { EXPORT_STATUS_CONFIG } from '@/lib/exportStatus';

/**
 * ExportStatusBadge
 * Shows a coloured pill for any exportStatus value.
 * @param {string} status - one of the EXPORT_STATUS values
 * @param {boolean} short  - use shorter label
 */
export default function ExportStatusBadge({ status, short = false }) {
  const cfg = EXPORT_STATUS_CONFIG[status] || EXPORT_STATUS_CONFIG['not_generated'];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dotColor} ${cfg.spin ? 'animate-pulse' : ''}`}
      />
      {short ? cfg.shortLabel : cfg.label}
    </span>
  );
}