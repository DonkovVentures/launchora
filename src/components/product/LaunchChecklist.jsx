import { useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';

const items = [
  'Finalize your product title',
  'Copy your listing description',
  'Review your pricing',
  'Add your keywords and tags',
  'Create your cover image',
  'Upload your product file',
  'Publish on your chosen platform',
  'Share your product link',
];

export default function LaunchChecklist() {
  const [checked, setChecked] = useState([]);

  const toggle = (i) => setChecked(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  const pct = Math.round((checked.length / items.length) * 100);

  return (
    <div className="bg-card border border-border rounded-xl p-6 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-foreground">Launch This Today</h3>
        <span className={`text-sm font-bold ${pct === 100 ? 'text-green-500' : 'text-primary'}`}>{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full mb-5">
        <div className="h-full gradient-bg rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i}>
            <button
              onClick={() => toggle(i)}
              className="flex items-center gap-3 w-full text-left group"
            >
              {checked.includes(i)
                ? <CheckSquare className="w-4 h-4 text-green-500 flex-shrink-0" />
                : <Square className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
              }
              <span className={`text-sm transition-colors ${checked.includes(i) ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item}</span>
            </button>
          </li>
        ))}
      </ul>
      {pct === 100 && (
        <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-green-700 font-bold text-sm">🎉 Your product is launched!</p>
          <p className="text-green-600 text-xs mt-1">Start earning now.</p>
        </div>
      )}
    </div>
  );
}