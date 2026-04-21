import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import StudioSidebar from '@/components/studio/StudioSidebar';
import BlockEditor from '@/components/studio/BlockEditor';
import ProductPreview from '@/components/studio/ProductPreview';
import StylePanel from '@/components/studio/StylePanel';
import { exportBlocksPDF } from '@/lib/exportBlocks';

const STYLE_PRESETS = {
  minimal: { bg: '#ffffff', text: '#1a1a1a', accent: '#ea580c', font: 'sans', heading: '#111111' },
  premium: { bg: '#0f0f0f', text: '#e8e0d4', accent: '#c9a96e', font: 'serif', heading: '#f5efe8' },
  feminine: { bg: '#fff5f7', text: '#4a3040', accent: '#d4628a', font: 'sans', heading: '#2d1a28' },
  business: { bg: '#f8fafc', text: '#1e293b', accent: '#2563eb', font: 'sans', heading: '#0f172a' },
  elegant: { bg: '#faf8f5', text: '#2c2417', accent: '#8b6914', font: 'serif', heading: '#1a1208' },
  modern: { bg: '#f0fdf4', text: '#14532d', accent: '#16a34a', font: 'sans', heading: '#052e16' },
  pastel: { bg: '#fef9f0', text: '#78716c', accent: '#fb923c', font: 'sans', heading: '#44403c' },
  bold: { bg: '#18181b', text: '#d4d4d8', accent: '#f59e0b', font: 'sans', heading: '#fafafa' },
};

export default function Studio() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeBlock, setActiveBlock] = useState(null);
  const [style, setStyle] = useState('minimal');
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [copiedListing, setCopiedListing] = useState(false);

  useEffect(() => {
    base44.entities.Product.list().then(results => {
      const p = (results || []).find(r => r.id === id);
      if (p) {
        setProduct(p);
        const existingBlocks = p.generated_data?.product_blocks;
        if (existingBlocks && existingBlocks.length > 0) {
          setBlocks(existingBlocks);
        } else {
          setBlocks(buildBlocksFromData(p));
        }
        if (p.generated_data?.style_preset) setStyle(p.generated_data.style_preset);
      }
      setLoading(false);
    });
  }, [id]);

  // Real-time updates
  useEffect(() => {
    if (!id) return;
    const unsub = base44.entities.Product.subscribe((event) => {
      if (event.id === id && event.type === 'update') {
        setProduct(event.data);
        const newBlocks = event.data?.generated_data?.product_blocks;
        if (newBlocks && newBlocks.length > 0) {
          setBlocks(prev => prev.length === 0 ? newBlocks : prev);
        }
      }
    });
    return unsub;
  }, [id]);

  const saveBlocks = async (newBlocks, newStyle) => {
    setSaving(true);
    setSaved(false);
    const updatedData = {
      ...product.generated_data,
      product_blocks: newBlocks || blocks,
      style_preset: newStyle || style,
    };
    await base44.entities.Product.update(id, { generated_data: updatedData });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleBlocksChange = (newBlocks) => {
    setBlocks(newBlocks);
    saveBlocks(newBlocks, style);
  };

  const handleStyleChange = (newStyle) => {
    setStyle(newStyle);
    saveBlocks(blocks, newStyle);
  };

  const copyListing = async () => {
    const d = product?.generated_data || {};
    const text = `LISTING TITLE:\n${d.listing_title || ''}\n\nDESCRIPTION:\n${d.listing_description || ''}\n\nKEYWORDS:\n${(d.keywords || []).join(', ')}\n\nPRICE: $${d.price_min}–$${d.price_max}`;
    await navigator.clipboard.writeText(text);
    setCopiedListing(true);
    setTimeout(() => setCopiedListing(false), 2500);
  };

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

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Link to="/dashboard"><Button>← Back to Dashboard</Button></Link>
      </div>
    );
  }

  const d = product.generated_data || {};
  const preset = STYLE_PRESETS[style] || STYLE_PRESETS.minimal;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link to={`/product/${id}`}>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          </Link>
          <div className="w-px h-5 bg-border" />
          <div>
            <p className="font-semibold text-sm text-foreground leading-none">{d.title || product.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{product.product_type} · {product.platform}</p>
          </div>
          {product.status !== 'ready' && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full animate-pulse">Generating...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs ${saving ? 'text-orange-500' : saved ? 'text-green-500' : 'text-transparent'} transition-colors`}>
            {saving ? 'Saving...' : 'Saved ✓'}
          </span>
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
          <Button size="sm" onClick={() => exportBlocksPDF(blocks, product, preset)} className="gradient-bg text-white h-8 gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <StudioSidebar
          blocks={blocks}
          activeBlock={activeBlock}
          onSelectBlock={setActiveBlock}
          onBlocksChange={handleBlocksChange}
          product={product}
        />

        {/* Center - editor or preview */}
        <div className="flex-1 overflow-y-auto bg-muted/30">
          {showPreview ? (
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

        {/* Style panel - right overlay */}
        {showStylePanel && (
          <StylePanel
            style={style}
            onStyleChange={handleStyleChange}
            presets={STYLE_PRESETS}
            onClose={() => setShowStylePanel(false)}
          />
        )}
      </div>
    </div>
  );
}

// Build blocks from flat generated_data when no blocks exist yet
function buildBlocksFromData(product) {
  const d = product.generated_data || {};
  const blocks = [];
  let id = 1;
  const mk = (type, content, heading) => ({ id: String(id++), type, content, heading });

  blocks.push(mk('cover', { title: d.title || product.title, subtitle: d.subtitle, promise: d.promise, audience: d.audience }, 'Cover'));

  if (d.structure && d.structure.length > 0) {
    blocks.push(mk('toc', { items: d.structure }, 'Table of Contents'));
  }

  if (d.content_draft) {
    // Split content into sections
    const sections = d.content_draft.split(/\n\n+/).filter(s => s.trim().length > 50);
    sections.forEach((section, i) => {
      const lines = section.trim().split('\n');
      const heading = lines[0].replace(/^#+\s*/, '').substring(0, 60) || `Section ${i + 1}`;
      const body = lines.slice(1).join('\n').trim() || section;
      blocks.push(mk('section', { heading, body }, heading));
    });
  }

  if (d.benefits && d.benefits.length > 0) {
    blocks.push(mk('checklist', { title: 'Key Benefits', items: d.benefits }, 'Key Benefits'));
  }

  if (d.keywords && d.keywords.length > 0) {
    blocks.push(mk('listing', {
      listing_title: d.listing_title,
      listing_description: d.listing_description,
      keywords: d.keywords,
      price_min: d.price_min,
      price_max: d.price_max,
      cta: d.cta,
    }, `${product.platform} Listing`));
  }

  return blocks;
}