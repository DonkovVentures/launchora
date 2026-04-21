import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ImageIcon, Loader2, Download, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function AICoverGenerator({ product }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const generate = async () => {
    setLoading(true);
    const d = product.generated_data || {};
    const prompt = `Professional digital product cover/mockup image for a "${d.title || product.title}" ${product.product_type}. 
    Style: ${d.visual_direction || 'clean, modern, minimal'}. 
    Niche: ${product.niche}. 
    Flat lay or 3D mockup style, high quality product cover for an online marketplace like Etsy or Gumroad. 
    No text, just visual product design with colors and decorative elements matching the product theme.`;

    const result = await base44.integrations.Core.GenerateImage({ prompt });
    setImageUrl(result.url);
    setLoading(false);
    setExpanded(true);
  };

  const downloadImage = async () => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-${product.id}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden">
      <button
        onClick={() => imageUrl ? setExpanded(e => !e) : generate()}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-foreground">AI Cover Image</p>
            <p className="text-xs text-muted-foreground">Generate a product cover mockup</p>
          </div>
        </div>
        {loading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> :
          imageUrl ? (expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />) :
          <span className="text-xs text-primary font-medium">Generate</span>}
      </button>

      <AnimatePresence>
        {expanded && imageUrl && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
              <img src={imageUrl} alt="AI generated cover" className="w-full rounded-xl object-cover aspect-square" />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={downloadImage} className="flex-1 text-xs rounded-lg">
                  <Download className="w-3.5 h-3.5 mr-1.5" />Download
                </Button>
                <Button size="sm" variant="outline" onClick={generate} className="flex-1 text-xs rounded-lg">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Regenerate
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}