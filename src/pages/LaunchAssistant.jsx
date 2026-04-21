import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Copy, Check, ArrowLeft, AlertTriangle, Rocket, CheckSquare, Square } from 'lucide-react';
import { motion } from 'framer-motion';

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-muted-foreground hover:text-foreground">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      <span className="ml-1 text-xs">{copied ? 'Copied' : label}</span>
    </Button>
  );
}

function Section({ title, children, action }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function LaunchAssistant() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState([]);

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
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <Link to="/dashboard"><Button>Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const d = product.generated_data || {};
  const pg = d.platform_guidance || {};
  const toggle = (i) => setChecked(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  const launchItems = ['Finalize your title', 'Copy your listing description', 'Set your price', 'Add keywords/tags', 'Create cover image', 'Upload product file', 'Publish', 'Share your link'];

  const platformIcons = {
    Etsy: '🛍️', Gumroad: '💚', Payhip: '💜', Shopify: '🛒',
    'Ko-fi': '☕', 'Stan Store': '⭐', 'Creative Market': '🎨', 'Custom Website': '🌐'
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Link to={`/product/${id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to product
            </Link>

            <div className="gradient-bg rounded-2xl p-8 text-white mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">{platformIcons[product.platform] || '🚀'}</div>
                <div>
                  <p className="text-white/70 text-xs uppercase tracking-wider font-semibold mb-1">Launch Assistant</p>
                  <h1 className="font-display text-2xl font-bold">{product.platform} Launch Plan</h1>
                  <p className="text-white/70 text-sm mt-1">{d.title}</p>
                </div>
              </div>
              <div className="bg-white/15 rounded-xl p-4">
                <p className="text-sm text-white/90 font-medium">I know exactly what to do next.</p>
                <p className="text-xs text-white/60 mt-1">Follow this plan and your product will be live today.</p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-5">
            {/* Why this platform */}
            <Section title={`Why ${product.platform} is right for this product`}>
              <p className="text-sm text-muted-foreground leading-relaxed">{pg.why_this_platform}</p>
            </Section>

            {/* Platform audience */}
            <Section title="Who buys this on this platform">
              <p className="text-sm text-muted-foreground leading-relaxed">{pg.platform_audience}</p>
            </Section>

            {/* Best title */}
            <Section
              title={`Best title for ${product.platform}`}
              action={<CopyButton text={pg.best_title || d.listing_title} />}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="font-semibold text-foreground text-sm">{pg.best_title || d.listing_title}</p>
              </div>
            </Section>

            {/* Best description */}
            <Section
              title={`Optimized description for ${product.platform}`}
              action={<CopyButton text={pg.best_description || d.listing_description} />}
            >
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{pg.best_description || d.listing_description}</p>
            </Section>

            {/* Pricing */}
            <Section title="Pricing strategy">
              <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl font-display font-bold gradient-text">${d.price_min}–${d.price_max}</div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{pg.pricing_strategy || d.price_rationale}</p>
            </Section>

            {/* Tags */}
            <Section title="Tags & keywords">
              <div className="flex flex-wrap gap-2">
                {(pg.tags?.length ? pg.tags : d.keywords || []).map((tag, i) => (
                  <span key={i} className="bg-secondary text-secondary-foreground text-xs px-3 py-1.5 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </Section>

            {/* Thumbnail */}
            <Section title="Thumbnail & cover guidance">
              <p className="text-sm text-muted-foreground leading-relaxed">{pg.thumbnail_guidance || d.cover_concept}</p>
            </Section>

            {/* Publishing steps */}
            <Section title={`Step-by-step: How to publish on ${product.platform}`}>
              <ol className="space-y-3">
                {(pg.publishing_steps || []).map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold mt-0.5">{i + 1}</span>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </Section>

            {/* Pro tips */}
            {pg.pro_tips?.length > 0 && (
              <Section title="Pro tips for better conversion">
                <ul className="space-y-2.5">
                  {pg.pro_tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">✦</span> {tip}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Mistakes */}
            {pg.mistakes_to_avoid?.length > 0 && (
              <Section title="Common mistakes to avoid">
                <ul className="space-y-2.5">
                  {pg.mistakes_to_avoid.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" /> {m}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Launch checklist */}
            <div className="bg-gradient-to-br from-primary/5 to-purple-50 border border-primary/15 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <Rocket className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-foreground">Launch This Today</h3>
                <span className="text-xs text-muted-foreground ml-auto">{checked.length}/{launchItems.length}</span>
              </div>
              <ul className="space-y-3">
                {launchItems.map((item, i) => (
                  <li key={i}>
                    <button onClick={() => toggle(i)} className="flex items-center gap-3 w-full text-left group">
                      {checked.includes(i)
                        ? <CheckSquare className="w-4 h-4 text-green-500 flex-shrink-0" />
                        : <Square className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
                      }
                      <span className={`text-sm ${checked.includes(i) ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {checked.length === launchItems.length && (
                <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="font-bold text-green-800">🎉 You're live! Start earning now.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}