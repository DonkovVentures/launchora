import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Plus, Rocket, Share2, FileText, MoreVertical, Loader2, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const STATUS_CONFIG = {
  draft: { label: 'Generating...', color: 'bg-orange-100 text-orange-700', icon: Loader2, spin: true },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-700', icon: CheckCircle2, spin: false },
  launched: { label: 'Launched', color: 'bg-blue-100 text-blue-700', icon: Rocket, spin: false },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
      <Icon className={`w-3 h-3 ${cfg.spin ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
  );
}

function ProductCard({ product, onDelete }) {
  const d = product.generated_data || {};
  const date = new Date(product.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 card-shadow hover:card-shadow-hover transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] gradient-bg text-white px-2 py-0.5 rounded-full font-semibold">{product.product_type}</span>
            <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{product.platform}</span>
            <StatusBadge status={product.status} />
          </div>
          <h3 className="font-display font-bold text-foreground text-base leading-tight truncate">{d.title || product.title}</h3>
          {d.subtitle && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{d.subtitle}</p>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/product/${product.id}`}>View Product</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/launch/${product.id}`}>Launch Plan</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/social/${product.id}`}>Social Kit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(product.id)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {d.price_min && (
        <div className="text-xl font-display font-bold gradient-text mb-3">${d.price_min}–${d.price_max}</div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Link to={`/product/${product.id}`}>
          <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg">
            <FileText className="w-3 h-3 mr-1" />View
          </Button>
        </Link>
        {product.status === 'ready' && (
          <>
            <Link to={`/launch/${product.id}`}>
              <Button size="sm" className="h-8 text-xs rounded-lg gradient-bg text-white hover:opacity-90">
                <Rocket className="w-3 h-3 mr-1" />Launch
              </Button>
            </Link>
            <Link to={`/social/${product.id}`}>
              <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg border-primary/30 text-primary">
                <Share2 className="w-3 h-3 mr-1" />Social
              </Button>
            </Link>
          </>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
        <Clock className="w-3 h-3" />{date}
      </p>
    </motion.div>
  );
}

export default function ProjectDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = () => {
    base44.entities.Product.list('-created_date', 50).then(data => {
      setProducts(data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchProducts();
    // Poll to catch draft→ready transitions
    const interval = setInterval(fetchProducts, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await base44.entities.Product.delete(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const stats = {
    total: products.length,
    ready: products.filter(p => p.status === 'ready').length,
    launched: products.filter(p => p.status === 'launched').length,
    generating: products.filter(p => p.status === 'draft').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Project Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1">All your digital products in one place</p>
            </div>
            <Link to="/create">
              <Button className="gradient-bg text-white hover:opacity-90 font-semibold rounded-xl">
                <Plus className="w-4 h-4 mr-2" />New Product
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Products', value: stats.total, color: 'text-foreground' },
              { label: 'Ready to Sell', value: stats.ready, color: 'text-green-600' },
              { label: 'Launched', value: stats.launched, color: 'text-blue-600' },
              { label: 'Generating', value: stats.generating, color: 'text-orange-500' },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-4 card-shadow text-center">
                <div className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🚀</div>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">No products yet</h2>
              <p className="text-muted-foreground text-sm mb-6">Create your first digital product in minutes</p>
              <Link to="/create">
                <Button className="gradient-bg text-white font-semibold rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />Create Your First Product
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map(product => (
                <ProductCard key={product.id} product={product} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}