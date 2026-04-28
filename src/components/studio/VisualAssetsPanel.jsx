import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Image, AlertCircle, CheckCircle2, RefreshCw, Upload } from 'lucide-react';

const QUALITY_OPTIONS = [
  { value: 'standard', label: 'Standard', desc: 'Faster, lower cost' },
  { value: 'hd', label: 'HD', desc: 'Higher detail' },
];

const ASSET_LABELS = {
  marketplace_thumbnail: 'Marketplace Thumbnail',
  preview_mockup: 'Product Mockup',
  style_board: 'Style Board',
};

export default function VisualAssetsPanel({ product, onAssetsGenerated }) {
  const [quality, setQuality] = useState('standard');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);

  const existingAssets = Array.isArray(product?.visual_assets) ? product.visual_assets : [];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setWarnings([]);
    try {
      const res = await base44.functions.invoke('generateVisualAssets', {
        productId: product.id,
        quality,
        referenceImageUrl: referenceUrl || undefined,
      });
      const data = res?.data ?? res;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');
      if (data.warnings?.length) setWarnings(data.warnings);
      onAssetsGenerated?.(data.assets);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Generate AI mockups, marketplace thumbnails, and style boards for your product.
        These will be embedded in the <code className="bg-muted px-1 rounded text-[10px]">01_Product/Visuals/</code> folder of your ZIP.
      </p>

      {/* Quality picker */}
      <div className="flex gap-2">
        {QUALITY_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setQuality(opt.value)}
            className={`flex-1 border rounded-lg px-3 py-2 text-xs text-left transition-colors ${
              quality === opt.value
                ? 'border-primary bg-primary/5 text-primary font-semibold'
                : 'border-border text-muted-foreground hover:border-foreground/30'
            }`}
          >
            <div className="font-medium">{opt.label}</div>
            <div className="text-[10px] opacity-70 mt-0.5">{opt.desc}</div>
          </button>
        ))}
      </div>

      {/* Optional reference image */}
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">Reference image URL (optional)</label>
        <input
          type="url"
          value={referenceUrl}
          onChange={e => setReferenceUrl(e.target.value)}
          placeholder="https://..."
          className="w-full border border-input rounded-lg px-3 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Generate button */}
      <Button
        className="w-full gradient-bg text-white hover:opacity-90 font-semibold gap-2"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating visuals…</>
        ) : (
          <><Sparkles className="w-3.5 h-3.5" /> {existingAssets.length > 0 ? 'Regenerate' : 'Generate'} Visual Assets</>
        )}
      </Button>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-xs space-y-0.5">
          {warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
        </div>
      )}

      {/* Existing assets preview */}
      {existingAssets.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            {existingAssets.length} visual{existingAssets.length !== 1 ? 's' : ''} generated
          </div>
          <div className="grid grid-cols-3 gap-2">
            {existingAssets.map((asset, i) => (
              <div key={i} className="group relative">
                <a href={asset.url} target="_blank" rel="noreferrer">
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full aspect-square object-cover rounded-lg border border-border group-hover:opacity-90 transition-opacity"
                  />
                </a>
                <div className="mt-1 text-[10px] text-muted-foreground text-center truncate">
                  {ASSET_LABELS[asset.name] || asset.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}