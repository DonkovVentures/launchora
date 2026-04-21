const tones = [
  { name: 'Professional', emoji: '👔', desc: 'Clean, authoritative, corporate-friendly' },
  { name: 'Friendly', emoji: '😊', desc: 'Warm, approachable and conversational' },
  { name: 'Motivational', emoji: '🔥', desc: 'Energetic, inspiring, action-driven' },
  { name: 'Calm & Nurturing', emoji: '🌿', desc: 'Soft, gentle, self-care focused' },
  { name: 'Bold & Direct', emoji: '⚡', desc: 'No-fluff, punchy and results-focused' },
  { name: 'Educational', emoji: '🎓', desc: 'Informative, structured, clear explanations' },
];

export default function StepTone({ value, onChange }) {
  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">Choose your product style</h2>
      <p className="text-muted-foreground mb-8">This shapes the tone, writing style and feel of your generated product and listing copy.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tones.map(t => (
          <button
            key={t.name}
            onClick={() => onChange(t.name)}
            className={`flex items-start gap-4 p-5 rounded-xl border text-left transition-all hover:scale-[1.01] ${
              value === t.name
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border bg-card hover:border-primary/40'
            }`}
          >
            <span className="text-2xl flex-shrink-0">{t.emoji}</span>
            <div>
              <div className="font-semibold text-sm text-foreground mb-1">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}