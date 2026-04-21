import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, Trash2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Field({ label, value, onChange, multiline, hint }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-foreground mb-1.5">{label}</label>
      {hint && <p className="text-[11px] text-muted-foreground mb-1.5">{hint}</p>}
      {multiline ? (
        <textarea
          className="w-full text-sm text-foreground bg-background border border-border rounded-lg p-3 min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
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
  const update = (i, val) => {
    const next = [...items];
    next[i] = val;
    onChange(next);
  };
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

function AIRewriteBar({ onRewrite, loading }) {
  const opts = [
    { label: '✨ Punchier', instruction: 'make it shorter and more compelling' },
    { label: '🎯 More specific', instruction: 'add concrete details and examples' },
    { label: '💼 Professional', instruction: 'make it sound authoritative and premium' },
    { label: '🔥 Stronger CTA', instruction: 'make the call to action more urgent and persuasive' },
  ];
  return (
    <div className="flex flex-wrap gap-1.5 mb-4 p-3 bg-muted/40 rounded-lg">
      <p className="w-full text-[11px] text-muted-foreground mb-1">✦ AI Rewrite</p>
      {opts.map(o => (
        <button
          key={o.label}
          onClick={() => onRewrite(o.instruction)}
          disabled={loading}
          className="text-[11px] px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-3 h-3 animate-spin inline mr-1" /> : null}
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Block-type specific editors
function CoverEditor({ content, onChange }) {
  const u = (k, v) => onChange({ ...content, [k]: v });
  return (
    <>
      <Field label="Product Title" value={content.title} onChange={v => u('title', v)} />
      <Field label="Subtitle" value={content.subtitle} onChange={v => u('subtitle', v)} />
      <Field label="Promise / Tagline" value={content.promise} onChange={v => u('promise', v)} multiline />
      <Field label="Who it's for" value={content.audience} onChange={v => u('audience', v)} multiline />
    </>
  );
}

function TocEditor({ content, onChange }) {
  return (
    <ArrayField label="Contents" items={content.items || []} onChange={items => onChange({ ...content, items })} hint="Each line is a section in your Table of Contents" />
  );
}

function SectionEditor({ content, onChange }) {
  const u = (k, v) => onChange({ ...content, [k]: v });
  return (
    <>
      <Field label="Section Heading" value={content.heading} onChange={v => u('heading', v)} />
      <Field label="Body Text" value={content.body} onChange={v => u('body', v)} multiline />
    </>
  );
}

function ChecklistEditor({ content, onChange }) {
  const u = (k, v) => onChange({ ...content, [k]: v });
  return (
    <>
      <Field label="Checklist Title" value={content.title} onChange={v => u('title', v)} />
      <ArrayField label="Checklist Items" items={content.items || []} onChange={items => u('items', items)} hint="Each item becomes a checkbox" />
    </>
  );
}

function WorksheetEditor({ content, onChange }) {
  const u = (k, v) => onChange({ ...content, [k]: v });
  return (
    <>
      <Field label="Worksheet Title" value={content.title} onChange={v => u('title', v)} />
      <Field label="Instructions" value={content.instructions} onChange={v => u('instructions', v)} multiline />
      <ArrayField label="Questions / Exercises" items={content.questions || []} onChange={q => u('questions', q)} />
    </>
  );
}

function PromptEditor({ content, onChange }) {
  const u = (k, v) => onChange({ ...content, [k]: v });
  return (
    <>
      <Field label="Section Title" value={content.title} onChange={v => u('title', v)} />
      <Field label="Introduction" value={content.intro} onChange={v => u('intro', v)} multiline />
      <ArrayField label="Prompts" items={content.prompts || []} onChange={p => u('prompts', p)} hint="Each prompt the buyer will use" />
    </>
  );
}

function NotesEditor({ content, onChange }) {
  const u = (k, v) => onChange({ ...content, [k]: v });
  return (
    <>
      <Field label="Notes Page Title" value={content.title} onChange={v => u('title', v)} />
      <Field label="Number of lines" value={String(content.lines || 10)} onChange={v => u('lines', parseInt(v) || 10)} hint="How many blank lines to show" />
    </>
  );
}

function ListingEditor({ content, onChange }) {
  const u = (k, v) => onChange({ ...content, [k]: v });
  return (
    <>
      <Field label="Listing Title" value={content.listing_title} onChange={v => u('listing_title', v)} />
      <Field label="Listing Description" value={content.listing_description} onChange={v => u('listing_description', v)} multiline />
      <ArrayField label="Keywords / Tags" items={content.keywords || []} onChange={k => u('keywords', k)} hint="Search terms buyers use" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Min Price ($)" value={String(content.price_min || '')} onChange={v => u('price_min', Number(v))} />
        <Field label="Max Price ($)" value={String(content.price_max || '')} onChange={v => u('price_max', Number(v))} />
      </div>
      <Field label="Call to Action" value={content.cta} onChange={v => u('cta', v)} />
    </>
  );
}

const EDITORS = {
  cover: CoverEditor,
  toc: TocEditor,
  section: SectionEditor,
  checklist: ChecklistEditor,
  worksheet: WorksheetEditor,
  prompt: PromptEditor,
  notes: NotesEditor,
  listing: ListingEditor,
};

export default function BlockEditor({ blocks, activeBlock, onBlocksChange, onSelectBlock, product }) {
  const [aiLoading, setAiLoading] = useState(false);

  const block = blocks.find(b => b.id === activeBlock);

  const updateBlock = (updated) => {
    onBlocksChange(blocks.map(b => b.id === updated.id ? updated : b));
  };

  const duplicateBlock = () => {
    if (!block) return;
    const copy = { ...block, id: String(Date.now()), heading: block.heading + ' (copy)' };
    const idx = blocks.findIndex(b => b.id === block.id);
    const next = [...blocks];
    next.splice(idx + 1, 0, copy);
    onBlocksChange(next);
    onSelectBlock(copy.id);
  };

  const aiRewrite = async (instruction) => {
    if (!block) return;
    setAiLoading(true);
    const context = JSON.stringify(block.content || {});
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert digital product copywriter for ${product?.product_type || 'digital products'} in the "${product?.niche || ''}" niche.\n\nRewrite this block's content to ${instruction}.\n\nCurrent content:\n${context}\n\nReturn ONLY a JSON object with the same keys as the input but with improved values. Do not add keys.`,
      model: 'gemini_3_flash',
      response_json_schema: { type: 'object' },
    });
    if (result && typeof result === 'object') {
      updateBlock({ ...block, content: { ...block.content, ...result } });
    }
    setAiLoading(false);
  };

  const EditorComponent = block ? EDITORS[block.type] : null;

  if (!block) {
    return (
      <div className="flex items-center justify-center h-full text-center p-12">
        <div>
          <div className="text-5xl mb-4">👈</div>
          <h3 className="font-display font-bold text-foreground mb-2">Select a block to edit</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Click any block in the left panel to start editing, or add a new block.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <motion.div key={block.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {/* Block header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Editing Block</p>
            <h2 className="font-display font-bold text-xl text-foreground">{block.heading}</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={duplicateBlock} className="h-8 gap-1.5 text-xs">
              <Copy className="w-3.5 h-3.5" /> Duplicate
            </Button>
          </div>
        </div>

        {/* Heading rename */}
        <div className="mb-6 p-3 bg-muted/50 rounded-lg">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Block Label (sidebar name)</label>
          <input
            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={block.heading || ''}
            onChange={e => updateBlock({ ...block, heading: e.target.value })}
          />
        </div>

        {/* AI rewrite bar */}
        <AIRewriteBar onRewrite={aiRewrite} loading={aiLoading} />

        {/* Editor */}
        {EditorComponent && (
          <div className="bg-card border border-border rounded-xl p-5">
            <EditorComponent
              content={block.content || {}}
              onChange={content => updateBlock({ ...block, content })}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}