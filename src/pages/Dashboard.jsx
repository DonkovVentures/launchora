import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Plus, Rocket, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const statusColors = {
  draft: 'bg-muted text-muted-foreground',
  ready: 'bg-blue-50 text-blue-700',
  launched: 'bg-green-50 text-green-700',
};

const platformIcons = {
  Etsy: '🛍️', Gumroad: '💚', Payhip: '💜', Shopify: '🛒',
  'Ko-fi': '☕', 'Stan Store': '⭐', 'Creative Market': '🎨', 'Custom Website': '🌐'
};

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Product.list('-created_date', 50).then(p => {
      setProducts(p || []);
      setLoading(false);
    });
  }, []);

  const copyListing = (product) => {
    const d = product.generated_data || {};
    const text = `TITLE: ${d.listing_title || d.title}\n\nDESCRIPTION:\n${d.listing_description}\n\nKEYWORDS: ${(d.keywords || []).join(', ')}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Product Library</h1>
              <p className="text-muted-foreground mt-1">Your generated products, ready to launch and sell.</p>
            </div>
            <Link to="/create">
              <Button className="gradient-bg text-white hover:opacity-90 font-semibold rounded-xl">
                <Plus className="w-4 h-4 mr-2" /> Create New Product
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse h-48" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">No products yet</h2>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Create your first digital product and launch it for sale today.</p>
              <Link to="/create">
                <Button className="gradient-bg text-white hover:opacity-90 font-semibold rounded-xl px-8">
                  Create My First Product
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="bg-card border border-border rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{platformIcons[product.platform] || '📦'}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColors[product.status] || statusColors.draft}`}>
                        {product.status || 'draft'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">{product.product_type}</span>
                  </div>

                  <h3 className="font-display font-bold text-foreground text-sm mb-1 line-clamp-2 leading-snug">
                    {product.generated_data?.title || product.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-1">{product.niche}</p>
                  {product.platform && (
                    <p className="text-xs text-primary font-medium mb-4">{product.platform}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-border">
                    <Link to={`/product/${product.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open
                      </Button>
                    </Link>
                    <Link to={`/launch/${product.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                        <Rocket className="w-3.5 h-3.5 mr-1" /> Launch Plan
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => copyListing(product)}>
                      <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}