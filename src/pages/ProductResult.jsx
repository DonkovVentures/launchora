import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import ResultSection from '@/components/product/ResultSection';
import LaunchChecklist from '@/components/product/LaunchChecklist';
import { Button } from '@/components/ui/button';
import { Copy, Download, Plus, Rocket, CheckCircle2, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import AIContentAnalyzer from '@/components/product/AIContentAnalyzer';
import AIABTesting from '@/components/product/AIABTesting';
import AIBundleSuggestions from '@/components/product/AIBundleSuggestions';
import AIAssistant from '@/components/product/AIAssistant';

export default function ProductResult() {
  const { id } = useParams();
  const { lang } = useLang();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    base44.entities.Product.filter({ id }).then(results => {
      if (results && results[0]) setProduct(results[0]);
      setLoading(false);
    });
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

  const d = product.generated_data || {};

  const copyAllListing = () => {
    const text = `TITLE: ${d.listing_title || d.title}\n\nDESCRIPTION:\n${d.listing_description}\n\nKEYWORDS: ${(d.keywords || []).join(', ')}\n\nPRICE: $${d.price_min}–$${d.price_max}`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  const exportProduct = () => {
    const content = `LAUNCHORA PRODUCT EXPORT\n===========================\nProduct: ${d.title}\nType: ${product.product_type}\nPlatform: ${product.platform}\n\nTITLE: ${d.title}\nSUBTITLE: ${d.subtitle}\nPROMISE: ${d.promise}\n\nTARGET AUDIENCE: ${d.audience}\nFORMAT: ${d.format}\n\nSTRUCTURE:\n${(d.structure || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nCONTENT DRAFT:\n${d.content_draft}\n\nLISTING TITLE: ${d.listing_title}\nLISTING DESCRIPTION:\n${d.listing_description}\n\nKEYWORDS: ${(d.keywords || []).join(', ')}\nPRICE: $${d.price_min}–$${d.price_max}\n\nPLATFORM GUIDANCE (${product.platform}):\n${d.platform_guidance?.best_description || ''}\n\nPUBLISHING STEPS:\n${(d.platform_guidance?.publishing_steps || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(d.title || 'product').replace(/\s+/g, '-').toLowerCase()}-launchora.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">{d.title || product.title}</h1>
                <p className="text-muted-foreground">{d.subtitle}</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-green-800 text-sm">{t(lang, 'result_ready_title')}</p>
                  <p className="text-green-600 text-xs">{t(lang, 'result_ready_sub')}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={copyAllListing} variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                  <Copy className="w-3.5 h-3.5 mr-1.5" />{copiedAll ? t(lang, 'result_copied') : t(lang, 'result_copy_listing')}
                </Button>
                <Button size="sm" onClick={exportProduct} variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                  <Download className="w-3.5 h-3.5 mr-1.5" />{t(lang, 'result_export')}
                </Button>
                <Link to={`/launch/${id}`}>
                  <Button size="sm" className="gradient-bg text-white hover:opacity-90">
                    <Rocket className="w-3.5 h-3.5 mr-1.5" />{t(lang, 'result_launch_plan')}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <ResultSection title={t(lang, 'result_product_title')} content={d.title} />
              <ResultSection title={t(lang, 'result_subtitle')} content={d.subtitle} />
              <ResultSection title={t(lang, 'result_promise')} content={d.promise} />
              <ResultSection title={t(lang, 'result_audience')} content={d.audience} />
              <ResultSection title={t(lang, 'result_format')} content={d.format} />
              <ResultSection title={t(lang, 'result_structure')} content={d.structure} />
              <ResultSection title={t(lang, 'result_content')} content={d.content_draft} badge={t(lang, 'result_premium')} />
              <ResultSection title={t(lang, 'result_benefits')} content={d.benefits} />
              <ResultSection title={t(lang, 'result_angle')} content={d.selling_angle} />
              <ResultSection title={t(lang, 'result_listing_title')} content={d.listing_title} badge={t(lang, 'result_platform_ready')} />
              <ResultSection title={t(lang, 'result_listing_desc')} content={d.listing_description} badge={t(lang, 'result_platform_ready')} />
              <ResultSection title={t(lang, 'result_keywords')} content={d.keywords} />
              <ResultSection title={t(lang, 'result_visual')} content={d.visual_direction} />
              <ResultSection title={t(lang, 'result_cover')} content={d.cover_concept} />
            </div>
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-5 card-shadow">
                <h3 className="font-semibold text-foreground text-sm mb-3">{t(lang, 'result_price')}</h3>
                <div className="text-3xl font-display font-bold gradient-text mb-1">${d.price_min}–${d.price_max}</div>
                <p className="text-xs text-muted-foreground">{d.price_rationale}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 card-shadow">
                <h3 className="font-semibold text-foreground text-sm mb-2">{t(lang, 'result_buyer')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{d.buyer_profile}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 card-shadow">
                <h3 className="font-semibold text-foreground text-sm mb-2">{t(lang, 'result_cta_label')}</h3>
                <p className="text-sm font-semibold text-primary">{d.cta}</p>
              </div>
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
      </main>
      <AIAssistant product={product} />
    </div>
  );
}