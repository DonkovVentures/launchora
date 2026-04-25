import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Copy, Check, ArrowLeft, AlertTriangle, Rocket, CheckSquare, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { normalizeProduct } from '@/lib/normalizeProduct';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const { lang } = useLang();
  return (
    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="h-7 px-2 text-muted-foreground hover:text-foreground">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
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

const platformIcons = { Etsy: '🛍️', Gumroad: '💚', Payhip: '💜', Shopify: '🛒', 'Ko-fi': '☕', 'Stan Store': '⭐', 'Creative Market': '🎨', 'Custom Website': '🌐' };

export default function LaunchAssistant() {
  const { id } = useParams();
  const { lang } = useLang();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState([]);

  useEffect(() => {
    base44.entities.Product.list().then(results => {
      const found = (results || []).find(p => p.id === id);
      if (found) setProduct(found);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <Link to="/dashboard"><Button>Dashboard</Button></Link>
      </div>
    </div>
  );

  const norm = normalizeProduct(product);
  const d = product.generated_data || {};
  const pg = norm.platformGuides;
  const ma = norm.marketingAssets;
  const toggle = (i) => setChecked(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  const launchItems = t(lang, 'checklist_items');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Link to={`/product/${id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> {t(lang, 'launch_back')}
            </Link>
            <div className="gradient-bg rounded-2xl p-8 text-white mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">{platformIcons[product.platform] || '🚀'}</div>
                <div>
                  <p className="text-white/70 text-xs uppercase tracking-wider font-semibold mb-1">{t(lang, 'launch_assistant')}</p>
                  <h1 className="font-display text-2xl font-bold">{product.platform} {t(lang, 'launch_plan')}</h1>
                  <p className="text-white/70 text-sm mt-1">{d.title}</p>
                </div>
              </div>
              <div className="bg-white/15 rounded-xl p-4">
                <p className="text-sm text-white/90 font-medium">{t(lang, 'launch_ready_msg')}</p>
                <p className="text-xs text-white/60 mt-1">{t(lang, 'launch_ready_sub')}</p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-5">
            <Section title={t(lang, 'launch_why_title', { platform: product.platform })}>
              <p className="text-sm text-muted-foreground leading-relaxed">{pg.why_this_platform}</p>
            </Section>
            <Section title={t(lang, 'launch_who')}>
              <p className="text-sm text-muted-foreground leading-relaxed">{pg.platform_audience}</p>
            </Section>
            <Section title={t(lang, 'launch_best_title', { platform: product.platform })} action={<CopyButton text={pg.best_title} />}>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="font-semibold text-foreground text-sm">{pg.best_title}</p>
              </div>
            </Section>
            <Section title={t(lang, 'launch_best_desc', { platform: product.platform })} action={<CopyButton text={pg.best_description} />}>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{pg.best_description}</p>
            </Section>
            <Section title={t(lang, 'launch_pricing')}>
              <div className="text-3xl font-display font-bold gradient-text mb-3">${ma.price_min}–${ma.price_max}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{pg.pricing_strategy}</p>
            </Section>
            <Section title={t(lang, 'launch_tags')}>
              <div className="flex flex-wrap gap-2">
                {(pg.tags || []).map((tag, i) => (
                  <span key={i} className="bg-secondary text-secondary-foreground text-xs px-3 py-1.5 rounded-full font-medium">{tag}</span>
                ))}
              </div>
            </Section>
            <Section title={t(lang, 'launch_thumbnail')}>
              <p className="text-sm text-muted-foreground leading-relaxed">{pg.thumbnail_guidance}</p>
            </Section>
            {pg.launch_plan && (
              <Section title={t(lang, 'launch_steps_title', { platform: product.platform })}>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{pg.launch_plan}</p>
              </Section>
            )}
            {(pg.pro_tips || []).length > 0 && (
              <Section title={t(lang, 'launch_pro_tips')}>
                <ul className="space-y-2.5">
                  {pg.pro_tips.map((tip, i) => <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="text-primary">✦</span> {tip}</li>)}
                </ul>
              </Section>
            )}
            {(pg.mistakes_to_avoid || []).length > 0 && (
              <Section title={t(lang, 'launch_mistakes')}>
                <ul className="space-y-2.5">
                  {pg.mistakes_to_avoid.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" /> {m}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            <div className="bg-gradient-to-br from-primary/5 to-purple-50 border border-primary/15 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <Rocket className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-foreground">{t(lang, 'checklist_title')}</h3>
                <span className="text-xs text-muted-foreground ml-auto">{checked.length}/{launchItems.length}</span>
              </div>
              <ul className="space-y-3">
                {launchItems.map((item, i) => (
                  <li key={i}>
                    <button onClick={() => toggle(i)} className="flex items-center gap-3 w-full text-left group">
                      {checked.includes(i) ? <CheckSquare className="w-4 h-4 text-green-500 flex-shrink-0" /> : <Square className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />}
                      <span className={`text-sm ${checked.includes(i) ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {checked.length === launchItems.length && (
                <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="font-bold text-green-800">{t(lang, 'launch_done')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}