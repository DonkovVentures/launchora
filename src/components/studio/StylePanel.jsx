import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PRESET_META = {
  minimal: { label: 'Minimal', emoji: '⬜', desc: 'Clean white, orange accents' },
  premium: { label: 'Premium', emoji: '⬛', desc: 'Dark luxury, gold accents' },
  feminine: { label: 'Feminine', emoji: '🌸', desc: 'Soft pink, feminine tones' },
  business: { label: 'Business', emoji: '🔵', desc: 'Professional navy & blue' },
  elegant: { label: 'Elegant', emoji: '🟤', desc: 'Warm cream, gold accents' },
  modern: { label: 'Modern Creator', emoji: '🟢', desc: 'Fresh green, clean lines' },
  pastel: { label: 'Soft Pastel', emoji: '🟠', desc: 'Warm pastels, gentle feel' },
  bold: { label: 'Bold Clean', emoji: '🟡', desc: 'Dark base, amber accents' },
};

export default function StylePanel({ style, onStyleChange, presets, onClose }) {
  return (
    <div className="w-72 border-l border-border bg-card flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">🎨 Visual Style</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-4 overflow-y-auto flex-1">
        <p className="text-[11px] text-muted-foreground mb-4">Choose a preset that matches your brand</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PRESET_META).map(([key, meta]) => {
            const preset = presets[key];
            const isActive = style === key;
            return (
              <button
                key={key}
                onClick={() => onStyleChange(key)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  isActive ? 'border-primary shadow-md' : 'border-border hover:border-primary/40'
                }`}
              >
                {/* Color preview */}
                <div className="flex gap-1 mb-2">
                  <div className="w-6 h-6 rounded-full border border-border" style={{ background: preset.bg }} />
                  <div className="w-6 h-6 rounded-full" style={{ background: preset.accent }} />
                  <div className="w-6 h-6 rounded-full" style={{ background: preset.text }} />
                </div>
                <p className={`text-xs font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>{meta.emoji} {meta.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{meta.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-xl">
          <p className="text-xs font-semibold text-foreground mb-3">Preview Colors</p>
          {presets[style] && (
            <div className="space-y-2">
              {[
                { label: 'Background', key: 'bg' },
                { label: 'Accent', key: 'accent' },
                { label: 'Text', key: 'text' },
                { label: 'Heading', key: 'heading' },
              ].map(({ label, key }) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded border border-border flex-shrink-0" style={{ background: presets[style][key] }} />
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                  <span className="text-[11px] font-mono text-foreground ml-auto">{presets[style][key]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}