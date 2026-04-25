/**
 * AngleEditor — editable panel for the product_angle object in Studio.
 * Shows all 7 angle fields and a "Regenerate marketing assets" button
 * when the angle has been modified since the last save.
 */
import { useState, useEffect, useRef } from 'react';
import { Target, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const ANGLE_FIELDS = [
  { key: 'audience',        label: 'Target Audience',   hint: 'Specific demographic + situation', multiline: false },
  { key: 'painPoint',       label: 'Pain Point',         hint: 'The exact frustration they feel right now', multiline: true },
  { key: 'transformation',  label: 'Transformation',     hint: 'Before → after: what changes for them', multiline: false },
  { key: 'uniqueMechanism', label: 'Unique Mechanism',   hint: 'What makes this approach different', multiline: false },
  { key: 'emotionalHook',   label: 'Emotional Hook',     hint: 'The real feeling they are buying (confidence, control, freedom…)', multiline: false },
  { key: 'positioning',     label: 'Market Positioning', hint: 'How this product sits vs. alternatives', multiline: false },
  { key: 'finalAngle',      label: 'Final Angle Statement', hint: 'Complete 10–15 word angle that drives the title, promise, and copy', multiline: false },
];

function AngleField({ fieldKey, label, hint, multiline, value, onChange }) {
  return (
    <div className="mb-4">
      <label className="text-xs font-semibold text-foreground block mb-1">{label}</label>
      {hint && <p className="text-[11px] text-muted-foreground mb-1.5">{hint}</p>}
      {multiline ? (
        <textarea
          className="w-full text-sm bg-background border border-border rounded-lg p-3 min-h-[72px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={value || ''}
          onChange={e => onChange(fieldKey, e.target.value)}
        />
      ) : (
        <input
          type="text"
          className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={value || ''}
          onChange={e => onChange(fieldKey, e.target.value)}
        />
      )}
    </div>
  );
}

export default function AngleEditor({ draft, onDraftChange, product }) {
  const angle = draft.product_angle || {};
  const savedAngle = useRef(JSON.stringify(product?.product_angle || {}));
  const [isDirty, setIsDirty] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenSuccess, setRegenSuccess] = useState(false);

  // Track if angle has been modified vs. what's saved on the product
  useEffect(() => {
    setIsDirty(JSON.stringify(angle) !== savedAngle.current);
  }, [angle]);

  const updateField = (key, val) => {
    onDraftChange({
      ...draft,
      product_angle: { ...angle, [key]: val },
    });
  };

  const handleRegenerate = async () => {
    if (!product?.id) return;
    setRegenerating(true);
    setRegenSuccess(false);
    try {
      await base44.functions.invoke('regenerateFromAngle', {
        productId: product.id,
        productAngle: angle,
        formData: {
          productType: product.product_type,
          niche: product.niche,
          tone: product.tone,
          platform: product.platform,
        },
      });
      savedAngle.current = JSON.stringify(angle);
      setIsDirty(false);
      setRegenSuccess(true);
      setTimeout(() => setRegenSuccess(false), 4000);
    } catch (e) {
      alert('Regeneration failed: ' + e.message);
    }
    setRegenerating(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
          <Target className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">Product Angle</p>
          <p className="text-[11px] text-muted-foreground">Drives your title, promise, sales copy, and all marketing assets</p>
        </div>
      </div>

      {/* Regenerate banner — shown when angle is edited */}
      {isDirty && (
        <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-800">Angle has been edited</p>
            <p className="text-[11px] text-amber-700 mt-0.5">Regenerate your marketing assets so the title, copy, keywords, and listings reflect the new angle.</p>
          </div>
          <Button
            size="sm"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="gradient-bg text-white h-8 text-xs font-semibold flex-shrink-0"
          >
            {regenerating
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />Regenerating…</>
              : <><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Regenerate from Angle</>
            }
          </Button>
        </div>
      )}

      {regenSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-800 font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-green-600" />
          Marketing assets regenerated from the new angle ✓
        </div>
      )}

      {/* Fields */}
      {ANGLE_FIELDS.map(f => (
        <AngleField
          key={f.key}
          fieldKey={f.key}
          label={f.label}
          hint={f.hint}
          multiline={f.multiline}
          value={angle[f.key] || ''}
          onChange={updateField}
        />
      ))}
    </div>
  );
}