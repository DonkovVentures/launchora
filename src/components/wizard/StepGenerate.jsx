import { Wand2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StepGenerate({ data, onGenerate, loading }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-6 glow">
        <Wand2 className="w-8 h-8 text-white" />
      </div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">Ready to generate your product</h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        The AI will create a complete, sell-ready product with titles, content, listing copy, keywords and platform-specific launch guidance.
      </p>

      <div className="bg-secondary/50 border border-border rounded-xl p-5 text-left mb-8 max-w-sm mx-auto space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Product type</span>
          <span className="font-medium text-foreground">{data.productType || '—'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Niche</span>
          <span className="font-medium text-foreground">{data.niche || '—'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tone</span>
          <span className="font-medium text-foreground">{data.tone || '—'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Platform</span>
          <span className="font-medium text-foreground">{data.platform || '—'}</span>
        </div>
      </div>

      <Button
        onClick={onGenerate}
        disabled={loading}
        size="lg"
        className="gradient-bg text-white hover:opacity-90 font-bold px-10 py-6 text-base rounded-xl glow"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating your product...
          </div>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Generate My Product
          </>
        )}
      </Button>
      {loading && (
        <p className="text-sm text-muted-foreground mt-4">This takes about 30 seconds. Creating something great...</p>
      )}
    </div>
  );
}