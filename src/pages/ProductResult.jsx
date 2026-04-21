import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import ResultSection from '@/components/product/ResultSection';
import LaunchChecklist from '@/components/product/LaunchChecklist';
import { Button } from '@/components/ui/button';
import { Copy, Download, ArrowRight, Plus, Rocket, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductResult() {
  const { id } = useParams();
  const navigate = useNavigate();
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Loading your product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center"><p className="text-muted-foreground mb-4">Product not found.</p>
            <Link to="/create"><Button className="gradient-bg text-white">Create a Product</Button></Link>
          </div>
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
    const content = `LAUNCHORA PRODUCT EXPORT
===========================
Product: ${d.title}
Type: ${product.product_type}
Platform: ${product.platform}

TITLE: ${d.title}
SUBTITLE: ${d.subtitle}
PROMISE: ${d.promise}

TARGET AUDIENCE: ${d.audience}
FORMAT: ${d.format}

STRUCTURE:
${(d.structure || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}

CONTENT DRAFT:
${d.content_draft}

LISTING TITLE: ${d.listing_title}
LISTING DESCRIPTION:
${d.listing_description}

KEYWORDS: ${(d.keywords || []).join(', ')}
PRICE: $${d.price_min}–$${d.price_max}

PLATFORM GUIDANCE (${product.platform}):
${d.platform_guidance?.best_description || ''}

PUBLISHING STEPS:
${(d.platform_guidance?.publishing_steps || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}
`;
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
          {/* Header */}
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

            {/* Ready banner */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-green-800 text-sm">Your product is ready to launch</p>
                  <p className="text-green-600 text-xs">Start earning now — pick a platform and publish today.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={copyAllListing} variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  {copiedAll ? 'Copied!' : 'Copy Listing'}
                </Button>
                <Button size="sm" onClick={exportProduct} variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Export
                </Button>
                <Link to={`/launch/${id}`}>
                  <Button size="sm" className="gradient-bg text-white hover:opacity-90">
                    <Rocket className="w-3.5 h-3.5 mr-1.5" />
                    View Launch Plan
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <ResultSection title="Product Title" content={d.title} />
              <ResultSection title="Subtitle" content={d.subtitle} />
              <ResultSection title="Product Promise" content={d.promise} />
              <ResultSection title="Target Audience" content={d.audience} />
              <ResultSection title="Product Format" content={d.format} />
              <ResultSection title="Product Structure" content={d.structure} />
              <ResultSection title="Product Content Draft" content={d.content_draft} badge="Premium" />
              <ResultSection title="Key Benefits" content={d.benefits} />
              <ResultSection title="Selling Angle" content={d.selling_angle} />
              <ResultSection title="Listing Title" content={d.listing_title} badge="Platform Ready" />
              <ResultSection title="Listing Description" content={d.listing_description} badge="Platform Ready" />
              <ResultSection title="SEO Keywords & Tags" content={d.keywords} />
              <ResultSection title="Visual Direction" content={d.visual_direction} />
              <ResultSection title="Cover Concept" content={d.cover_concept} />
            </div>

            <div className="space-y-4">
              {/* Price */}
              <div className="bg-card border border-border rounded-xl p-5 card-shadow">
                <h3 className="font-semibold text-foreground text-sm mb-3">Recommended Price</h3>
                <div className="text-3xl font-display font-bold gradient-text mb-1">
                  ${d.price_min}–${d.price_max}
                </div>
                <p className="text-xs text-muted-foreground">{d.price_rationale}</p>
              </div>

              {/* Buyer profile */}
              <div className="bg-card border border-border rounded-xl p-5 card-shadow">
                <h3 className="font-semibold text-foreground text-sm mb-2">Ideal Buyer</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{d.buyer_profile}</p>
              </div>

              {/* CTA */}
              <div className="bg-card border border-border rounded-xl p-5 card-shadow">
                <h3 className="font-semibold text-foreground text-sm mb-2">Suggested CTA</h3>
                <p className="text-sm font-semibold text-primary">{d.cta}</p>
              </div>

              {/* Launch checklist */}
              <LaunchChecklist />

              {/* Actions */}
              <div className="space-y-3">
                <Link to={`/launch/${id}`} className="block">
                  <Button className="gradient-bg text-white w-full hover:opacity-90 font-semibold rounded-xl">
                    <Rocket className="w-4 h-4 mr-2" />
                    View Full Launch Plan
                  </Button>
                </Link>
                <Link to="/create" className="block">
                  <Button variant="outline" className="w-full rounded-xl font-medium">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Another Product
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}