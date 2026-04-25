import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import LaunchChecklist from '@/components/product/LaunchChecklist';
import { Button } from '@/components/ui/button';
import { Copy, Plus, Rocket, CheckCircle2, Share2, Layers, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { copyListingToClipboard } from '@/lib/exportProduct';
import { normalizeProduct } from '@/lib/normalizeProduct';
import { getExportStatus, EXPORT_STATUS, EXPORT_STATUS_CONFIG } from '@/lib/exportStatus';
import ExportStatusBadge from '@/components/studio/ExportStatusBadge';
import AIContentAnalyzer from '@/components/product/AIContentAnalyzer';
import AIABTesting from '@/components/product/AIABTesting';
import AIBundleSuggestions from '@/components/product/AIBundleSuggestions';
import AIAssistant from '@/components/product/AIAssistant';
import AICoverGenerator from '@/components/product/AICoverGenerator';
import PlatformPublishGuide from '@/components/product/PlatformPublishGuide';
import ProductAnglePanel from '@/components/product/ProductAnglePanel';

function getProgressLabel(product) {
  // Prefer structured generation_progress, fall back to legacy _progress
  const progress = product.generation_progress || product.generated_data?._progress;
  const hasBlocks = (product.pages || product.generated_data?.product_blocks || []).length > 2;
  if (progress) return progress;
  if (hasBlocks) return 'Building sales copy & platform guide...';
  return 'Generating product content...';
}

export default function ProductResult() {
  const { id } = useParams();
  const { lang } = useLang();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedAll, setCopiedAll] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipResult, setZipResult] = useState(null);

  const isGenerating = new URLSearchParams(window.location.search).get('generating') === 'true';

  useEffect(() => {
    base44.entities.Product.list().then(results => {
      const found = (results || []).find(p => p.id === id);
      if (found) setProduct(found);
      setLoading(false);
    });
  }, [id]);

  // Real-time subscription for live updates
  useEffect(() => {
    if (!id) return;
    const unsubscribe = base44.entities.Product.subscribe((event) => {
      if (event.id === id && (event.type === 'update' || event.type === 'create')) {
        setProduct(event.data);
      }
    });
    return unsubscribe;
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <Link to="/create"><Button className="gradient-bg text-white">{t(lang, 'dash_create')}</Button></Link>
        </div>
      </div>
    );
  }

  const norm = normalizeProduct(product);

  const testZipExport = async () => {
    setZipLoading(true);
    setZipResult(null);
    console.log('[TestZIP] productId:', id);
    try {
      const res = await base44.functions.invoke('generateZip', { productId: id });
      console.log('[TestZIP] response:', res);
      setZipResult(res?.data ?? res);
    } catch (e) {
      console.error('[TestZIP] error:', e);
      setZipResult({ success: false, error: e.message });
    }
    setZipLoading(false);
  };

  const copyAllListing = async () => {
    await copyListingToClipboard(product);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs gradient-bg text-white px-3 py-1 rounded-full font-semibold">{product.product_type}</span>
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">{product.platform}</span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">{norm.title}</h1>
                <p className="text-muted-foreground">{norm.subtitle}</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${product.status === 'ready' ? 'bg-green-500' : 'bg-orange-400'}`}>
                  {product.status === 'ready'
                    ? <CheckCircle2 className="w-5 h-5 text-white" />
                    : <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  }
                </div>
                <div>
                  <p className={`font-bold text-sm ${product.status === 'ready' ? 'text-green-800' : 'text-orange-800'}`}>
                    {product.status === 'ready' ? t(lang, 'result_ready_title') : getProgressLabel(product)}
                  </p>
                  <p className={`text-xs ${product.status === 'ready' ? 'text-green-600' : 'text-orange-600'}`}>
                    {product.status === 'ready' ? t(lang, 'result_ready_sub') : 'This page updates automatically — no need to refresh.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/studio/${id}`}>
                  <Button size="sm" className="gradient-bg text-white font-semibold">
                    <Layers className="w-3.5 h-3.5 mr-1.5" />Open Product Studio
                  </Button>
                </Link>
                <Button size="sm" onClick={copyAllListing} variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                  <Copy className="w-3.5 h-3.5 mr-1.5" />{copiedAll ? t(lang, 'result_copied') : t(lang, 'result_copy_listing')}
                </Button>

                <Link to={`/launch/${id}`}>
                  <Button size="sm" className="gradient-bg text-white hover:opacity-90">
                    <Rocket className="w-3.5 h-3.5 mr-1.5" />{t(lang, 'result_launch_plan')}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* ── Export Status Panel ── */}
          {(() => {
            const expStatus = getExportStatus(product);
            const expCfg = EXPORT_STATUS_CONFIG[expStatus];
            const files = product.export_files || [];
            const isStale = expStatus === EXPORT_STATUS.STALE;
            const hasPriorExport = files.length > 0;

            if (expStatus === EXPORT_STATUS.NOT_GENERATED) return null;

            return (
              <div className={`mb-6 rounded-2xl border p-4 ${isStale ? 'bg-amber-50 border-amber-200' : expStatus === EXPORT_STATUS.FAILED ? 'bg-red-50 border-red-200' : expStatus === EXPORT_STATUS.GENERATING ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <ExportStatusBadge status={expStatus} />
                  {isStale && <span className="text-xs text-amber-700 font-medium">This product was edited after the last export. Regenerate the ZIP to include the latest changes.</span>}
                  {expStatus === EXPORT_STATUS.FAILED && <span className="text-xs text-red-700">{product.export_error || 'Export failed'}</span>}
                </div>
                {hasPriorExport && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {files.map((f, i) => (
                      <a
                        key={i}
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${isStale ? 'bg-amber-200 text-amber-800 hover:bg-amber-300' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        {f.name || 'Download ZIP'}
                        {isStale && <span className="opacity-70 font-normal">(outdated)</span>}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Link to={`/studio/${id}`} className="block">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-primary/30 rounded-2xl p-10 hover:border-primary/60 transition-all cursor-pointer group text-center">
                  <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform">
                    <Layers className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-foreground text-2xl mb-2">Open Product Studio</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Edit title, subtitle, promise, content blocks, listing copy, SEO keywords and more — all in one visual editor.</p>
                  <Button size="lg" className="gradient-bg text-white font-semibold px-8 group-hover:opacity-90 transition-opacity">
                    <Layers className="w-4 h-4 mr-2" /> Open Product Studio
                  </Button>
                </div>
              </Link>
            </div>
            <div className="space-y-4">
              <ProductAnglePanel productAngle={product.product_angle} />
              <div className="bg-card border border-border rounded-xl p-5 card-shadow">
                <h3 className="font-semibold text-foreground text-sm mb-3">{t(lang, 'result_price')}</h3>
                <div className="text-3xl font-display font-bold gradient-text mb-1">${norm.marketingAssets.price_min}–${norm.marketingAssets.price_max}</div>
                <p className="text-xs text-muted-foreground">{norm.marketingAssets.price_rationale}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 card-shadow">
                <h3 className="font-semibold text-foreground text-sm mb-2">{t(lang, 'result_buyer')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{norm.buyerProfile}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 card-shadow">
                <h3 className="font-semibold text-foreground text-sm mb-2">{t(lang, 'result_cta_label')}</h3>
                <p className="text-sm font-semibold text-primary">{norm.marketingAssets.cta}</p>
              </div>
              <PlatformPublishGuide platform={product.platform} />
              <AICoverGenerator product={product} />
              <AIContentAnalyzer product={product} />
              <AIABTesting product={product} />
              <AIBundleSuggestions product={product} />
              <LaunchChecklist />
              <div className="space-y-3">
                <Link to={`/launch/${id}`} className="block">
                  <Button className="gradient-bg text-white w-full hover:opacity-90 font-semibold rounded-xl">
                    <Rocket className="w-4 h-4 mr-2" />{t(lang, 'result_full_launch')}
                  </Button>
                </Link>
                <Link to={`/social/${id}`} className="block">
                  <Button variant="outline" className="w-full rounded-xl font-medium border-primary/30 text-primary hover:bg-primary/5">
                    <Share2 className="w-4 h-4 mr-2" />Social Media Kit
                  </Button>
                </Link>
                <Link to="/create" className="block">
                  <Button variant="outline" className="w-full rounded-xl font-medium">
                    <Plus className="w-4 h-4 mr-2" />{t(lang, 'result_create_another')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── ZIP TEST PANEL ── */}
        <div className="mt-10 border border-dashed border-orange-300 bg-orange-50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-orange-700 mb-3 uppercase tracking-wide">🧪 ZIP Export Debug</p>
          <Button size="sm" onClick={testZipExport} disabled={zipLoading} className="gradient-bg text-white font-semibold">
            {zipLoading ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Generating...</> : <><Download className="w-3.5 h-3.5 mr-1.5" />Test ZIP Export</>}
          </Button>
          {zipResult && (
            <div className="mt-3 space-y-2">
              <pre className="bg-slate-950 text-slate-300 text-xs rounded-xl p-3 overflow-auto max-h-40 whitespace-pre-wrap">
                {JSON.stringify(zipResult, null, 2)}
              </pre>
              {zipResult.fileUrl ? (
                <a href={zipResult.fileUrl} target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
                  <Download className="w-3.5 h-3.5" /> Download ZIP
                </a>
              ) : (
                <p className="text-xs text-red-600 font-medium">❌ No fileUrl in response</p>
              )}
            </div>
          )}
        </div>
      </main>
      <AIAssistant product={product} />
    </div>
  );
}