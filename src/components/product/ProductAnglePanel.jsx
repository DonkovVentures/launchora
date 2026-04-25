import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ChevronDown, ChevronUp } from 'lucide-react';

const ANGLE_FIELDS = [
  { key: 'audience',         label: 'Target Audience',    color: 'bg-blue-50 border-blue-200 text-blue-800' },
  { key: 'painPoint',        label: 'Pain Point',          color: 'bg-red-50 border-red-200 text-red-800' },
  { key: 'transformation',   label: 'Transformation',      color: 'bg-green-50 border-green-200 text-green-800' },
  { key: 'uniqueMechanism',  label: 'Unique Mechanism',    color: 'bg-purple-50 border-purple-200 text-purple-800' },
  { key: 'emotionalHook',    label: 'Emotional Hook',      color: 'bg-pink-50 border-pink-200 text-pink-800' },
  { key: 'positioning',      label: 'Market Positioning',  color: 'bg-amber-50 border-amber-200 text-amber-800' },
];

export default function ProductAnglePanel({ productAngle }) {
  const [expanded, setExpanded] = useState(false);

  if (!productAngle?.finalAngle) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden card-shadow">
      {/* Header / Final Angle — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left p-5 flex items-start gap-3 hover:bg-muted/30 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0 mt-0.5">
          <Target className="w-4.5 h-4.5 text-white w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Product Angle</p>
          <p className="text-sm font-semibold text-foreground leading-snug">{productAngle.finalAngle}</p>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
        }
      </button>

      {/* Expanded breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-2 border-t border-border pt-4">
              {ANGLE_FIELDS.map(({ key, label, color }) => {
                const value = productAngle[key];
                if (!value) return null;
                return (
                  <div key={key} className={`rounded-lg border px-3 py-2.5 ${color}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5">{label}</p>
                    <p className="text-xs leading-relaxed">{value}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}