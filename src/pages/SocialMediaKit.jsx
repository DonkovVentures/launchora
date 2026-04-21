import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import ContentCalendar from '@/components/social/ContentCalendar';
import InstagramCaptions from '@/components/social/InstagramCaptions';
import VideoScripts from '@/components/social/VideoScripts';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

const TABS = [
  { id: 'calendar', label: '📅 30-Day Calendar' },
  { id: 'instagram', label: '📸 Instagram Captions' },
  { id: 'video', label: '🎬 Video Scripts' },
];

export default function SocialMediaKit() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar');

  useEffect(() => {
    base44.entities.Product.filter({ id }).then(results => {
      if (results?.[0]) setProduct(results[0]);
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
          <Link to="/dashboard"><Button className="gradient-bg text-white">Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const d = product.generated_data || {};

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Link to={`/product/${id}`}>
              <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground hover:text-foreground -ml-2">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Product
              </Button>
            </Link>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Social Media Kit</h1>
                <p className="text-sm text-muted-foreground">{d.title || product.title}</p>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'gradient-bg text-white shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'calendar' && <ContentCalendar product={product} />}
          {activeTab === 'instagram' && <InstagramCaptions product={product} />}
          {activeTab === 'video' && <VideoScripts product={product} />}
        </div>
      </main>
    </div>
  );
}