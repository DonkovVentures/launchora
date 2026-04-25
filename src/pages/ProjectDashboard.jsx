import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Plus, Rocket, Share2, FileText, MoreVertical, Loader2, CheckCircle2, Clock, Trash2, Search, SlidersHorizontal, Download } from 'lucide-react';
import ExportStatusBadge from '@/components/studio/ExportStatusBadge';
import { getExportStatus, EXPORT_STATUS } from '@/lib/exportStatus';
import { motion, AnimatePresence } from 'framer-motion';
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
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-border rounded-2xl p-5 card-shadow hover:card-shadow-hover transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[11px] gradient-bg text-white px-2 py-0.5 rounded-full font-semibold">{product.product_type}</span>
                <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{product.platform}</span>
                <StatusBadge status={product.status} />
                <ExportStatusBadge status={getExportStatus(product)} short />
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

      <div className="flex items-center justify-between mt-3">
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />{date}
        </p>
        {(() => {
          const expStatus = getExportStatus(product);
          const files = product.export_files || [];
          if (expStatus === EXPORT_STATUS.STALE && files.length > 0) {
            return (
              <a
                href={files[0].url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-amber-600 hover:text-amber-800 font-medium"
                title="Outdated export — click to download anyway"
              >
                <Download className="w-3 h-3" /> Outdated ZIP
              </a>
            );
          }
          if (expStatus === EXPORT_STATUS.READY && files.length > 0) {
            return (
              <a
                href={files[0].url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-green-600 hover:text-green-800 font-medium"
              >
                <Download className="w-3 h-3" /> Download ZIP
              </a>
            );
          }
          return null;
        })()}
      </div>
    </motion.div>
  );
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
];

export default function ProjectDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    base44.entities.Product.list('-created_date', 100).then(data => {
      setProducts(data || []);
      setLoading(false);
    });

    // Real-time updates
    const unsubscribe = base44.entities.Product.subscribe((event) => {
      if (event.type === 'create') {
        setProducts(prev => [event.data, ...prev]);
      } else if (event.type === 'update') {
        setProducts(prev => prev.map(p => p.id === event.id ? event.data : p));
      } else if (event.type === 'delete') {
        setProducts(prev => prev.filter(p => p.id !== event.id));
      }
    });

    return unsubscribe;
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    setProducts(prev => prev.filter(p => p.id !== id));
    try {
      await base44.entities.Product.delete(id);
    } catch (e) {
      // Already deleted or not found — ignore
    }
  };

  const platforms = useMemo(() => {
    const all = products.map(p => p.platform).filter(Boolean);
    return [...new Set(all)];
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.generated_data?.title || p.title || '').toLowerCase().includes(q) ||
        (p.niche || '').toLowerCase().includes(q) ||
        (p.product_type || '').toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') list = list.filter(p => p.status === filterStatus);
    if (filterPlatform !== 'all') list = list.filter(p => p.platform === filterPlatform);
    if (sort === 'oldest') list = list.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    else if (sort === 'name') list = list.sort((a, b) => (a.generated_data?.title || a.title || '').localeCompare(b.generated_data?.title || b.title || ''));
    else list = list.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return list;
  }, [products, search, filterStatus, filterPlatform, sort]);

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

          {/* Search + Filters */}
          {products.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="text-sm bg-card border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="all">All Status</option>
                  <option value="draft">Generating</option>
                  <option value="ready">Ready</option>
                  <option value="launched">Launched</option>
                </select>
                {platforms.length > 1 && (
                  <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}
                    className="text-sm bg-card border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="all">All Platforms</option>
                    {platforms.map(pl => <option key={pl} value={pl}>{pl}</option>)}
                  </select>
                )}
                <select value={sort} onChange={e => setSort(e.target.value)}
                  className="text-sm bg-card border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          )}

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
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No products match your filters.</p>
              <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterPlatform('all'); }}
                className="text-primary text-sm mt-2 hover:underline">Clear filters</button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(product => (
                  <ProductCard key={product.id} product={product} onDelete={handleDelete} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}