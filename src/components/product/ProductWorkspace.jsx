import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X, RefreshCw, RotateCcw, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Single editable field
function EditableField({ label, value, fieldPath, onSave, badge, isArray }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [rewriting, setRewriting] = useState(false);

  const startEdit = () => {
    setDraft(isArray ? (value || []).join('\n') : (value || ''));
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = () => {
    const newVal = isArray
      ? draft.split('\n').map(s => s.trim()).filter(Boolean)
      : draft;
    onSave(fieldPath, newVal);
    setEditing(false);
  };

  const rewrite = async (instruction) => {
    setRewriting(true);
    const currentText = isArray ? (value || []).join('\n') : (value || '');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert digital product copywriter. Take this content and ${instruction}. Return ONLY the improved text, no explanations.\n\nContent:\n${currentText}`,
      model: 'gemini_3_flash',
    });
    setDraft(result);
    setRewriting(false);
  };

  const displayValue = isArray ? (value || []) : value;

  return (
    <div className="bg-card border border-border rounded-xl p-5 card-shadow group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground text-sm">{label}</h3>
          {badge && <span className="text-[10px] gradient-bg text-white px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={startEdit} className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <textarea
              className="w-full text-sm text-foreground bg-muted/40 border border-border rounded-lg p-3 min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              autoFocus
            />
            {isArray && <p className="text-xs text-muted-foreground mt-1">One item per line</p>}

            {/* AI Rewrite buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
              {[
                { label: '✨ Make it punchier', instruction: 'make it shorter, punchier and more compelling' },
                { label: '🎯 More specific', instruction: 'make it more specific with concrete details and numbers where possible' },
                { label: '💼 More professional', instruction: 'make it sound more professional and authoritative' },
              ].map(opt => (
                <button
                  key={opt.label}
                  onClick={() => rewrite(opt.instruction)}
                  disabled={rewriting}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  {rewriting ? <RefreshCw className="w-3 h-3 animate-spin inline mr-1" /> : null}
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={save} className="gradient-bg text-white h-8">
                <Check className="w-3.5 h-3.5 mr-1" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={cancel} className="h-8">
                <X className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {isArray ? (
              <ul className="space-y-1.5">
                {(displayValue || []).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] text-white font-bold">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{displayValue}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Save indicator
function SaveIndicator({ saving, saved }) {
  if (!saving && !saved) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-sm font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
    >
      {saving ? (
        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving changes...</>
      ) : (
        <><Check className="w-3.5 h-3.5 text-green-400" /> Changes saved!</>
      )}
    </motion.div>
  );
}

export default function ProductWorkspace({ product, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localData, setLocalData] = useState(product?.generated_data || {});

  const handleSave = async (fieldPath, newValue) => {
    const updated = { ...localData, [fieldPath]: newValue };
    setLocalData(updated);
    setSaving(true);
    setSaved(false);
    await base44.entities.Product.update(product.id, { generated_data: updated });
    setSaving(false);
    setSaved(true);
    if (onUpdate) onUpdate({ ...product, generated_data: updated });
    setTimeout(() => setSaved(false), 2500);
  };

  const d = localData;

  const fields = [
    { label: 'Title', path: 'title', isArray: false },
    { label: 'Subtitle', path: 'subtitle', isArray: false },
    { label: 'The Promise', path: 'promise', isArray: false },
    { label: 'Target Audience', path: 'audience', isArray: false },
    { label: 'Format & Delivery', path: 'format', isArray: false },
    { label: 'Product Structure', path: 'structure', isArray: true },
    { label: 'Content Draft', path: 'content_draft', isArray: false, badge: 'Premium' },
    { label: 'Key Benefits', path: 'benefits', isArray: true },
    { label: 'Selling Angle', path: 'selling_angle', isArray: false },
    { label: 'Listing Title', path: 'listing_title', isArray: false, badge: 'Platform Ready' },
    { label: 'Listing Description', path: 'listing_description', isArray: false, badge: 'Platform Ready' },
    { label: 'SEO Meta Description', path: 'seo_meta_description', isArray: false, badge: 'SEO' },
    { label: 'Platform CTA', path: 'platform_cta', isArray: false, badge: 'Platform Ready' },
    { label: 'Keywords', path: 'keywords', isArray: true, badge: 'SEO' },
    { label: 'Visual Direction', path: 'visual_direction', isArray: false },
    { label: 'Cover Concept', path: 'cover_concept', isArray: false },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-display font-bold text-foreground text-lg">Product Workspace</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Click the pencil icon on any section to edit. Use AI to rewrite instantly.</p>
        </div>
      </div>

      {fields.map(f => (
        <EditableField
          key={f.path}
          label={f.label}
          value={d[f.path]}
          fieldPath={f.path}
          onSave={handleSave}
          badge={f.badge}
          isArray={f.isArray}
        />
      ))}

      <AnimatePresence>
        <SaveIndicator saving={saving} saved={saved} />
      </AnimatePresence>
    </div>
  );
}