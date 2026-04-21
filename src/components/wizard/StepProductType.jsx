const types = [
  { name: 'Planner', emoji: '📅', desc: 'Planning systems' },
  { name: 'Checklist', emoji: '✅', desc: 'Step-by-step lists' },
  { name: 'Tracker', emoji: '📊', desc: 'Habit & goal tracking' },
  { name: 'Worksheet', emoji: '📝', desc: 'Guided worksheets' },
  { name: 'Workbook', emoji: '📚', desc: 'Deep-dive exercises' },
  { name: 'Journal', emoji: '🗒️', desc: 'Reflective journals' },
  { name: 'Prompt Pack', emoji: '✨', desc: 'AI & writing prompts' },
  { name: 'Mini eBook', emoji: '📖', desc: 'Short-form guides' },
  { name: 'Template Pack', emoji: '🎨', desc: 'Ready-to-use templates' },
  { name: 'Social Media Pack', emoji: '📱', desc: 'Content templates' },
  { name: 'Printable Bundle', emoji: '🖨️', desc: 'Printable collections' },
  { name: 'Lead Magnet', emoji: '🧲', desc: 'List building resources' },
];

export default function StepProductType({ value, onChange }) {
  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">What do you want to create?</h2>
      <p className="text-muted-foreground mb-8">Pick the type of digital product you want to build and sell.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {types.map(t => (
          <button
            key={t.name}
            onClick={() => onChange(t.name)}
            className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${
              value === t.name
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border bg-card hover:border-primary/40'
            }`}
          >
            <span className="text-xl flex-shrink-0">{t.emoji}</span>
            <div>
              <div className="font-semibold text-sm text-foreground">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}