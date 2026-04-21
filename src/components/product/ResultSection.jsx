import { useState } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ResultSection({ title, content, onRegenerate, badge }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = Array.isArray(content) ? content.join('\n') : content;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 card-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground text-sm">{title}</h3>
          {badge && <span className="text-[10px] gradient-bg text-white px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <Button variant="ghost" size="sm" onClick={onRegenerate} className="h-7 px-2 text-muted-foreground hover:text-foreground">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-muted-foreground hover:text-foreground">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
      {Array.isArray(content) ? (
        <ul className="space-y-1.5">
          {content.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] text-white font-bold">{i + 1}</span>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
      )}
    </div>
  );
}