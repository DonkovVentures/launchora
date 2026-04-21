import { motion } from 'framer-motion';

function PreviewCover({ content, preset }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl mb-6" style={{ background: preset.accent, minHeight: 300 }}>
      <div className="p-10 flex flex-col justify-between min-h-[300px]">
        <div className="text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: preset.bg }}>Digital Product</div>
        <div>
          <h1 className="text-4xl font-bold mb-3 leading-tight" style={{ color: preset.bg, fontFamily: preset.font === 'serif' ? 'Georgia, serif' : 'inherit' }}>
            {content.title || 'Product Title'}
          </h1>
          {content.subtitle && (
            <p className="text-lg opacity-80 mb-4" style={{ color: preset.bg }}>{content.subtitle}</p>
          )}
          {content.promise && (
            <div className="inline-block px-4 py-2 rounded-full text-xs font-semibold" style={{ background: preset.bg, color: preset.accent }}>
              {content.promise}
            </div>
          )}
        </div>
        {content.audience && (
          <p className="text-xs opacity-60 mt-4" style={{ color: preset.bg }}>For: {content.audience}</p>
        )}
      </div>
    </div>
  );
}

function PreviewToc({ content, preset }) {
  return (
    <div className="rounded-xl border p-6 mb-6" style={{ borderColor: preset.accent + '30', background: preset.bg }}>
      <h2 className="text-lg font-bold mb-4" style={{ color: preset.heading, fontFamily: preset.font === 'serif' ? 'Georgia, serif' : 'inherit' }}>
        Table of Contents
      </h2>
      <ol className="space-y-2">
        {(content.items || []).map((item, i) => (
          <li key={i} className="flex items-center gap-3 text-sm" style={{ color: preset.text }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0" style={{ background: preset.accent }}>{i + 1}</span>
            {item}
          </li>
        ))}
      </ol>
    </div>
  );
}

function PreviewSection({ content, preset }) {
  return (
    <div className="rounded-xl p-6 mb-6" style={{ background: preset.bg, border: `1px solid ${preset.accent}20` }}>
      {content.heading && (
        <h2 className="text-xl font-bold mb-3" style={{ color: preset.heading, fontFamily: preset.font === 'serif' ? 'Georgia, serif' : 'inherit' }}>
          {content.heading}
        </h2>
      )}
      <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: preset.text }}>
        {content.body}
      </div>
    </div>
  );
}

function PreviewChecklist({ content, preset }) {
  return (
    <div className="rounded-xl p-6 mb-6" style={{ background: preset.bg, border: `1px solid ${preset.accent}20` }}>
      {content.title && (
        <h2 className="text-lg font-bold mb-4" style={{ color: preset.heading }}>{content.title}</h2>
      )}
      <div className="space-y-3">
        {(content.items || []).map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5" style={{ borderColor: preset.accent }} />
            <span className="text-sm" style={{ color: preset.text }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewWorksheet({ content, preset }) {
  return (
    <div className="rounded-xl p-6 mb-6" style={{ background: preset.bg, border: `1px solid ${preset.accent}20` }}>
      {content.title && (
        <h2 className="text-lg font-bold mb-2" style={{ color: preset.heading }}>{content.title}</h2>
      )}
      {content.instructions && (
        <p className="text-sm mb-5 italic" style={{ color: preset.text, opacity: 0.7 }}>{content.instructions}</p>
      )}
      <div className="space-y-6">
        {(content.questions || []).map((q, i) => (
          <div key={i}>
            <p className="text-sm font-semibold mb-2" style={{ color: preset.text }}>{i + 1}. {q}</p>
            <div className="space-y-1">
              {[...Array(4)].map((_, li) => (
                <div key={li} className="h-px w-full" style={{ background: preset.accent + '40' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewPrompt({ content, preset }) {
  return (
    <div className="rounded-xl p-6 mb-6" style={{ background: preset.bg, border: `1px solid ${preset.accent}20` }}>
      {content.title && <h2 className="text-lg font-bold mb-2" style={{ color: preset.heading }}>{content.title}</h2>}
      {content.intro && <p className="text-sm mb-4 italic" style={{ color: preset.text, opacity: 0.7 }}>{content.intro}</p>}
      <div className="space-y-3">
        {(content.prompts || []).map((p, i) => (
          <div key={i} className="p-3 rounded-lg text-sm" style={{ background: preset.accent + '15', color: preset.text, borderLeft: `3px solid ${preset.accent}` }}>
            <span className="font-semibold mr-2" style={{ color: preset.accent }}>→</span>{p}
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewNotes({ content, preset }) {
  const lines = content.lines || 10;
  return (
    <div className="rounded-xl p-6 mb-6" style={{ background: preset.bg, border: `1px solid ${preset.accent}20` }}>
      {content.title && <h2 className="text-lg font-bold mb-4" style={{ color: preset.heading }}>{content.title}</h2>}
      <div className="space-y-4">
        {[...Array(lines)].map((_, i) => (
          <div key={i} className="h-px w-full" style={{ background: preset.accent + '35' }} />
        ))}
      </div>
    </div>
  );
}

function PreviewListing({ content, preset }) {
  return (
    <div className="rounded-xl p-6 mb-6" style={{ background: preset.bg, border: `2px solid ${preset.accent}` }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: preset.accent }}>Marketplace Listing Copy</p>
      {content.listing_title && (
        <h2 className="text-lg font-bold mb-3" style={{ color: preset.heading }}>{content.listing_title}</h2>
      )}
      {content.listing_description && (
        <p className="text-sm mb-4 whitespace-pre-wrap" style={{ color: preset.text }}>{content.listing_description}</p>
      )}
      {content.keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {content.keywords.map((k, i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: preset.accent + '20', color: preset.accent }}>{k}</span>
          ))}
        </div>
      )}
      {(content.price_min || content.price_max) && (
        <p className="text-xl font-bold" style={{ color: preset.accent }}>${content.price_min}–${content.price_max}</p>
      )}
    </div>
  );
}

const PREVIEW_COMPONENTS = {
  cover: PreviewCover,
  toc: PreviewToc,
  section: PreviewSection,
  checklist: PreviewChecklist,
  worksheet: PreviewWorksheet,
  prompt: PreviewPrompt,
  notes: PreviewNotes,
  listing: PreviewListing,
};

export default function ProductPreview({ blocks, product, preset }) {
  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Live Preview</p>
          <h2 className="font-display font-bold text-foreground">How your product looks</h2>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
          {blocks.length} blocks
        </span>
      </div>

      <div className="space-y-2">
        {blocks.map((block, i) => {
          const Component = PREVIEW_COMPONENTS[block.type];
          if (!Component) return null;
          return (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Component content={block.content || {}} preset={preset} />
            </motion.div>
          );
        })}
      </div>

      {blocks.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-sm">Add blocks to see your product preview</p>
        </div>
      )}
    </div>
  );
}