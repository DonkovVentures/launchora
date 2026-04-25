/**
 * MetaEditor — editable panel for top-level structured Product fields:
 * title, subtitle, promise, targetAudience, buyerProfile, checklistItems,
 * and marketingAssets.
 *
 * All changes are emitted via onDraftChange so Studio can debounce-persist them.
 */
import { Plus, Trash2 } from 'lucide-react';

function Field({ label, value, onChange, multiline, hint, required }) {
  return (
    <div className="mb-4">
      <label className="flex items-center gap-1 text-xs font-semibold text-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {hint && <p className="text-[11px] text-muted-foreground mb-1.5">{hint}</p>}
      {multiline ? (
        <textarea
          className="w-full text-sm text-foreground bg-background border border-border rounded-lg p-3 min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className="w-full text-sm text-foreground bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function ArrayField({ label, items, onChange, hint }) {
  const update = (i, val) => { const n = [...items]; n[i] = val; onChange(n); };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, '']);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-foreground">{label}</label>
        <button onClick={add} className="text-[11px] text-primary hover:underline flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      {hint && <p className="text-[11px] text-muted-foreground mb-2">{hint}</p>}
      <div className="space-y-2">
        {(items || []).map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground w-5 flex-shrink-0">{i + 1}.</span>
            <input
              type="text"
              className="flex-1 text-sm bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={item}
              onChange={e => update(i, e.target.value)}
            />
            <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MetaEditor({ draft, onDraftChange }) {
  const u = (key, val) => onDraftChange({ ...draft, [key]: val });
  const uMa = (key, val) => onDraftChange({
    ...draft,
    marketing_assets: { ...(draft.marketing_assets || {}), [key]: val },
  });

  const ma = draft.marketing_assets || {};

  return (
    <div className="max-w-2xl mx-auto py-8 px-6 space-y-8">
      {/* Product Identity */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Product Identity</p>
        <Field label="Title" value={draft.title} onChange={v => u('title', v)} required />
        <Field label="Subtitle" value={draft.subtitle} onChange={v => u('subtitle', v)} />
        <Field label="Promise / Tagline" value={draft.promise} onChange={v => u('promise', v)} multiline hint="The core transformation or outcome you promise" />
      </section>

      {/* Audience */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Audience</p>
        <Field label="Target Audience" value={draft.target_audience} onChange={v => u('target_audience', v)} required hint="Who is this for? Be specific." />
        <Field label="Buyer Profile" value={draft.buyer_profile} onChange={v => u('buyer_profile', v)} multiline hint="Vivid description of your ideal buyer" />
        <Field label="Problem Solved" value={draft.problem_solved} onChange={v => u('problem_solved', v)} multiline />
      </section>

      {/* Marketing Assets */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Marketing Assets</p>
        <Field label="Listing Title" value={ma.listing_title} onChange={v => uMa('listing_title', v)} />
        <Field label="Listing Description" value={ma.listing_description} onChange={v => uMa('listing_description', v)} multiline />
        <ArrayField
          label="Keywords / Tags"
          items={ma.keywords || []}
          onChange={v => uMa('keywords', v)}
          hint="Search terms buyers use to find your product"
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min Price ($)" value={String(ma.price_min ?? '')} onChange={v => uMa('price_min', Number(v))} />
          <Field label="Max Price ($)" value={String(ma.price_max ?? '')} onChange={v => uMa('price_max', Number(v))} />
        </div>
        <Field label="Call to Action" value={ma.cta} onChange={v => uMa('cta', v)} />
        <Field label="SEO Meta Description" value={ma.seo_meta_description} onChange={v => uMa('seo_meta_description', v)} multiline />
      </section>

      {/* Checklist Items */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Key Benefits / Checklist</p>
        <ArrayField
          label="Checklist Items"
          items={draft.checklist_items || []}
          onChange={v => u('checklist_items', v)}
          hint="Key benefits shown as a checklist in your product"
        />
      </section>
    </div>
  );
}