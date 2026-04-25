import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Download, Eye, EyeOff, Copy, Check,
  Save, AlertTriangle, FileEdit,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StudioSidebar from '@/components/studio/StudioSidebar';
import BlockEditor from '@/components/studio/BlockEditor';
import ProductPreview from '@/components/studio/ProductPreview';
import StylePanel from '@/components/studio/StylePanel';
import ZipExportModal from '@/components/studio/ZipExportModal';
import MetaEditor from '@/components/studio/MetaEditor';
import { normalizeProduct } from '@/lib/normalizeProduct';

// ── Constants ─────────────────────────────────────────────────────────────────
const AUTOSAVE_DELAY = 800;

const STYLE_PRESETS = {
  minimal:  { bg: '#ffffff', text: '#1a1a1a', accent: '#ea580c', font: 'sans', heading: '#111111' },
  premium:  { bg: '#0f0f0f', text: '#e8e0d4', accent: '#c9a96e', font: 'serif', heading: '#f5efe8' },
  feminine: { bg: '#fff5f7', text: '#4a3040', accent: '#d4628a', font: 'sans', heading: '#2d1a28' },
  business: { bg: '#f8fafc', text: '#1e293b', accent: '#2563eb', font: 'sans', heading: '#0f172a' },
  elegant:  { bg: '#faf8f5', text: '#2c2417', accent: '#8b6914', font: 'serif', heading: '#1a1208' },
  modern:   { bg: '#f0fdf4', text: '#14532d', accent: '#16a34a', font: 'sans', heading: '#052e16' },
  pastel:   { bg: '#fef9f0', text: '#78716c', accent: '#fb923c', font: 'sans', heading: '#44403c' },
  bold:     { bg: '#18181b', text: '#d4d4d8', accent: '#f59e0b', font: 'sans', heading: '#fafafa' },
};

// Save status enum
const SaveStatus = {
  IDLE: 'idle',
  UNSAVED: 'unsaved',
  SAVING: 'saving',
  SAVED: 'saved',
  FAILED: 'failed',
};

// ── Validation ────────────────────────────────────────────────────────────────
function validateForExport(draft, blocks) {
  const errors = [];
  if (!draft.title?.trim()) errors.push('Product title is required.');
  if (!draft.target_audience?.trim()) errors.push('Target audience is required.');
  if (!draft.product_type?.trim()) errors.push('Product type is missing.');
  if (!blocks || blocks.length === 0) {
    if (!draft.sections || draft.sections.length === 0) {
      errors.push('At least one content block or section is required.');
    }
  }
  return errors;
}

// ── Build the entity update payload from draft + blocks + style ───────────────
function buildUpdatePayload(draft, blocks, stylePreset) {
  // Derive sections from section-type blocks so generateZip gets them
  const sections = blocks
    .filter(b => b.type === 'section')
    .map(b => ({ title: b.heading || b.content?.heading || '', body: b.content?.body || '' }));

  return {
    // Top-level structured fields
    title: draft.title || '',
    subtitle: draft.subtitle || '',
    promise: draft.promise || '',
    target_audience: draft.target_audience || '',
    buyer_profile: draft.buyer_profile || '',
    problem_solved: draft.problem_solved || '',
    checklist_items: draft.checklist_items || [],
    marketing_assets: draft.marketing_assets || {},
    sections,
    pages: blocks,
    visual_style: {
      ...(draft.visual_style || {}),
      preset: stylePreset,
    },
    last_edited_at: new Date().toISOString(),
    // Mirror into generated_data for backwards-compat ZIP export
    generated_data: {
      ...(draft.generated_data || {}),
      title: draft.title || '',
      subtitle: draft.subtitle || '',
      promise: draft.promise || '',
      audience: draft.target_audience || '',
      buyer_profile: draft.buyer_profile || '',
      sections,
      product_blocks: blocks,
      style_preset: stylePreset,
      listing_title: draft.marketing_assets?.listing_title || '',
      listing_description: draft.marketing_assets?.listing_description || '',
      keywords: draft.marketing_assets?.keywords || [],
      price_min: draft.marketing_assets?.price_min,
      price_max: draft.marketing_assets?.price_max,
      cta: draft.marketing_assets?.cta || '',
    },
  };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Studio() {
  const { id } = useParams();

  // Remote product record (source of truth after load)
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Local editing draft (structured fields)
  const [draft, setDraft] = useState(null);

  // Studio-specific UI state
  const [blocks, setBlocks] = useState([]);
  const [style, setStyle] = useState('minimal');
  const [activeBlock, setActiveBlock] = useState(null);
  const [activeTab, setActiveTab] = useState('blocks'); // 'blocks' | 'meta'
  const [showPreview, setShowPreview] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [showZipModal, setShowZipModal] = useState(false);
  const [copiedListing, setCopiedListing] = useState(false);

  // Save state
  const [saveStatus, setSaveStatus] = useState(SaveStatus.IDLE);
  const [saveError, setSaveError] = useState(null);

  // Stale export warning: shown when content is edited after last export
  const [exportIsStale, setExportIsStale] = useState(false);

  // Refs
  const autosaveTimer = useRef(null);
  const isInitialLoad = useRef(true);
  const lastSavedPayloadRef = useRef(null);

  // ── Load product ────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    base44.entities.Product.list().then(results => {
      const p = (results || []).find(r => r.id === id);
      if (p) {
        hydrateFromProduct(p);
      }
      setLoading(false);
      // Allow autosave to fire after initial hydration
      setTimeout(() => { isInitialLoad.current = false; }, 200);
    });
  }, [id]);

  // ── Real-time subscription (only pick up AI generation updates, not user edits) ──
  useEffect(() => {
    if (!id) return;
    const unsub = base44.entities.Product.subscribe((event) => {
      if (event.id !== id || event.type !== 'update') return;
      // Only sync if not currently editing (saveStatus is idle/saved)
      // to avoid overwriting unsaved user edits with AI generation pushes
      setProduct(event.data);
      if (saveStatus === SaveStatus.IDLE || saveStatus === SaveStatus.SAVED) {
        hydrateFromProduct(event.data, { blocksOnly: true });
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, saveStatus]);

  function hydrateFromProduct(p, opts = {}) {
    const norm = normalizeProduct(p);
    setProduct(p);

    if (!opts.blocksOnly) {
      // Full hydration: populate the editing draft from structured fields
      setDraft({
        title: norm.title,
        subtitle: norm.subtitle,
        promise: norm.promise,
        target_audience: norm.targetAudience,
        buyer_profile: norm.buyerProfile,
        problem_solved: norm.problemSolved,
        checklist_items: norm.checklistItems,
        marketing_assets: norm.marketingAssets,
        visual_style: p.visual_style || {},
        sections: norm.sections,
        product_type: norm.product_type,
        // Keep generated_data for backward-compat payload building
        generated_data: p.generated_data || {},
      });
      setStyle(norm.visualStyle.preset || 'minimal');
    }

    // Always update blocks (use existing blocks if we already have them, to
    // avoid resetting mid-edit, unless blocks are empty)
    setBlocks(prev => {
      if (prev.length > 0 && opts.blocksOnly) return prev;
      return norm.pages;
    });
  }

  // ── Autosave ────────────────────────────────────────────────────────────────
  // Mark unsaved whenever draft or blocks change (skip initial load)
  useEffect(() => {
    if (isInitialLoad.current || !draft) return;
    setSaveStatus(SaveStatus.UNSAVED);
    setSaveError(null);

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      persistDraft(draft, blocks, style);
    }, AUTOSAVE_DELAY);

    return () => clearTimeout(autosaveTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, blocks, style]);

  // ── Persist to entity ───────────────────────────────────────────────────────
  const persistDraft = useCallback(async (currentDraft, currentBlocks, currentStyle) => {
    if (!currentDraft || !id) return;
    setSaveStatus(SaveStatus.SAVING);
    setSaveError(null);

    const payload = buildUpdatePayload(currentDraft, currentBlocks, currentStyle);

    // Mark export as stale if there was a previous export and content changed
    if (product?.last_exported_at) {
      payload.export_status = 'stale';
      setExportIsStale(true);
    }

    try {
      const updated = await base44.entities.Product.update(id, payload);
      setProduct(updated);
      lastSavedPayloadRef.current = payload;
      setSaveStatus(SaveStatus.SAVED);
      // Reset to idle after 2.5s
      setTimeout(() => setSaveStatus(s => s === SaveStatus.SAVED ? SaveStatus.IDLE : s), 2500);
    } catch (err) {
      console.error('[Studio] Save failed:', err);
      setSaveError(err.message || 'Save failed');
      setSaveStatus(SaveStatus.FAILED);
    }
  }, [id, product]);

  // ── Manual save ─────────────────────────────────────────────────────────────
  const handleManualSave = () => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    persistDraft(draft, blocks, style);
  };

  // ── Block change handlers ───────────────────────────────────────────────────
  const handleBlocksChange = (newBlocks) => {
    setBlocks(newBlocks);
    // Sync checklist_items from checklist blocks back to draft
    const checklistBlock = newBlocks.find(b => b.type === 'checklist');
    if (checklistBlock?.content?.items) {
      setDraft(prev => ({ ...prev, checklist_items: checklistBlock.content.items }));
    }
    // Sync title/subtitle/promise/audience from cover block back to draft
    const coverBlock = newBlocks.find(b => b.type === 'cover');
    if (coverBlock?.content) {
      setDraft(prev => ({
        ...prev,
        title: coverBlock.content.title ?? prev.title,
        subtitle: coverBlock.content.subtitle ?? prev.subtitle,
        promise: coverBlock.content.promise ?? prev.promise,
        target_audience: coverBlock.content.audience ?? prev.target_audience,
      }));
    }
    // Sync listing block → marketing_assets
    const listingBlock = newBlocks.find(b => b.type === 'listing');
    if (listingBlock?.content) {
      setDraft(prev => ({
        ...prev,
        marketing_assets: {
          ...(prev.marketing_assets || {}),
          listing_title: listingBlock.content.listing_title ?? prev.marketing_assets?.listing_title,
          listing_description: listingBlock.content.listing_description ?? prev.marketing_assets?.listing_description,
          keywords: listingBlock.content.keywords ?? prev.marketing_assets?.keywords,
          price_min: listingBlock.content.price_min ?? prev.marketing_assets?.price_min,
          price_max: listingBlock.content.price_max ?? prev.marketing_assets?.price_max,
          cta: listingBlock.content.cta ?? prev.marketing_assets?.cta,
        },
      }));
    }
  };

  const handleStyleChange = (newStyle) => {
    setStyle(newStyle);
    setDraft(prev => ({ ...prev, visual_style: { ...(prev.visual_style || {}), preset: newStyle } }));
  };

  // ── Copy listing ────────────────────────────────────────────────────────────
  const copyListing = async () => {
    const ma = draft?.marketing_assets || {};
    const text = [
      `LISTING TITLE:\n${ma.listing_title || draft?.title || ''}`,
      `\nDESCRIPTION:\n${ma.listing_description || ''}`,
      `\nKEYWORDS:\n${(ma.keywords || []).join(', ')}`,
      `\nPRICE: $${ma.price_min ?? ''}–$${ma.price_max ?? ''}`,
    ].join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedListing(true);
    setTimeout(() => setCopiedListing(false), 2500);
  };

  // ── Export with validation ──────────────────────────────────────────────────
  const handleExportClick = () => {
    const errors = validateForExport(draft || {}, blocks);
    if (errors.length > 0) {
      alert('Cannot export:\n\n' + errors.join('\n'));
      return;
    }
    if (saveStatus === SaveStatus.UNSAVED || saveStatus === SaveStatus.SAVING) {
      alert('Please wait — your changes are still saving.');
      return;
    }
    setShowZipModal(true);
  };

  // ── Save status label ────────────────────────────────────────────────────────
  const saveLabel = {
    [SaveStatus.IDLE]:    { text: '', color: 'text-transparent' },
    [SaveStatus.UNSAVED]: { text: 'Unsaved changes', color: 'text-amber-500' },
    [SaveStatus.SAVING]:  { text: 'Saving...', color: 'text-orange-500' },
    [SaveStatus.SAVED]:   { text: 'Saved ✓', color: 'text-green-500' },
    [SaveStatus.FAILED]:  { text: 'Save failed', color: 'text-destructive' },
  }[saveStatus];

  // ── Loading / not found ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading Product Studio...</p>
        </div>
      </div>
    );
  }

  if (!product || !draft) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Link to="/projects"><Button>← Back to Dashboard</Button></Link>
      </div>
    );
  }

  const preset = STYLE_PRESETS[style] || STYLE_PRESETS.minimal;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">

      {/* ── Top Bar ── */}
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link to={`/product/${id}`}>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          </Link>
          <div className="w-px h-5 bg-border" />
          <div>
            <p className="font-semibold text-sm text-foreground leading-none">{draft.title || 'Untitled'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{product.product_type} · {product.platform}</p>
          </div>
          {product.status !== 'ready' && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full animate-pulse">Generating...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Save status indicator */}
          <span className={`text-xs transition-colors ${saveLabel.color}`}>
            {saveLabel.text}
          </span>
          {saveStatus === SaveStatus.FAILED && saveError && (
            <span className="text-[11px] text-destructive">({saveError})</span>
          )}

          {/* Manual save button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualSave}
            disabled={saveStatus === SaveStatus.SAVING || saveStatus === SaveStatus.SAVED}
            className="h-8 gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </Button>

          <Button size="sm" variant="outline" onClick={copyListing} className="h-8 gap-1.5">
            {copiedListing ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedListing ? 'Copied!' : 'Copy Listing'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowStylePanel(!showStylePanel)} className="h-8 gap-1.5">
            🎨 Style
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowPreview(!showPreview)} className="h-8 gap-1.5">
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? 'Edit' : 'Preview'}
          </Button>
          <Button
            size="sm"
            onClick={handleExportClick}
            className="gradient-bg text-white h-8 gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Download ZIP
          </Button>
        </div>
      </div>

      {/* ── Stale Export Warning ── */}
      <AnimatePresence>
        {exportIsStale && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-amber-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
              <p className="text-xs font-medium flex-1">
                Your product has changed since the last export. Regenerate your ZIP to include the latest edits.
              </p>
              <button
                onClick={() => setExportIsStale(false)}
                className="text-amber-600 hover:text-amber-800 text-xs underline"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-card flex-shrink-0">
        <button
          onClick={() => setActiveTab('blocks')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'blocks'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📄 Content Blocks
        </button>
        <button
          onClick={() => setActiveTab('meta')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
            activeTab === 'meta'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileEdit className="w-3 h-3" /> Product Details
        </button>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — only in blocks tab */}
        {activeTab === 'blocks' && (
          <StudioSidebar
            blocks={blocks}
            activeBlock={activeBlock}
            onSelectBlock={setActiveBlock}
            onBlocksChange={handleBlocksChange}
            product={product}
            draft={draft}
          />
        )}

        {/* Center panel */}
        <div className="flex-1 overflow-y-auto bg-muted/30">
          {activeTab === 'meta' ? (
            <MetaEditor draft={draft} onDraftChange={setDraft} />
          ) : showPreview ? (
            <ProductPreview blocks={blocks} product={product} preset={preset} />
          ) : (
            <BlockEditor
              blocks={blocks}
              activeBlock={activeBlock}
              onBlocksChange={handleBlocksChange}
              onSelectBlock={setActiveBlock}
              product={product}
              preset={preset}
            />
          )}
        </div>

        {/* Style panel — right overlay */}
        {showStylePanel && (
          <StylePanel
            style={style}
            onStyleChange={handleStyleChange}
            presets={STYLE_PRESETS}
            onClose={() => setShowStylePanel(false)}
          />
        )}
      </div>

      {/* ── ZIP Export Modal — always uses latest saved product from entity ── */}
      <AnimatePresence>
        {showZipModal && (
          <ZipExportModal
            product={product}
            style={style}
            onClose={() => setShowZipModal(false)}
            onExported={() => setExportIsStale(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}