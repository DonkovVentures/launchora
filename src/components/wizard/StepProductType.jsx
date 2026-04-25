import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { Sparkles } from 'lucide-react';

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

// Niche → recommended product types + reason
const NICHE_RECOMMENDATIONS = {
  'Productivity':      { types: ['Planner', 'Checklist', 'Workbook'], reason: 'Easy to sell and quick to consume — planners and checklists dominate productivity searches.' },
  'Fitness':           { types: ['Planner', 'Tracker', 'Checklist'], reason: 'Buyers want structure and accountability — planners and trackers consistently top fitness charts.' },
  'Business':          { types: ['Mini eBook', 'Workbook', 'Template Pack'], reason: 'Business buyers pay premium for depth — ebooks and workbooks deliver high perceived value.' },
  'Real Estate':       { types: ['Checklist', 'Mini eBook'], reason: 'Checklists and guides are go-to resources for buyers and sellers navigating complex processes.' },
  'Social Media':      { types: ['Social Media Pack', 'Template Pack', 'Prompt Pack'], reason: 'Content creators want plug-and-play tools they can use immediately.' },
  'Wellness':          { types: ['Planner', 'Journal', 'Checklist'], reason: 'Journals and planners feel personal and intentional — perfect for wellness audiences.' },
  'Finance':           { types: ['Planner', 'Tracker', 'Checklist'], reason: 'Budget planners and trackers are evergreen bestsellers in the finance niche.' },
  'Interior Design':   { types: ['Checklist', 'Workbook', 'Template Pack'], reason: 'Client guides and checklists help designers and homeowners stay organised.' },
  'Self-care':         { types: ['Journal', 'Planner', 'Checklist'], reason: 'Reflective journals and planners resonate deeply with self-care audiences.' },
  'Moms':              { types: ['Planner', 'Checklist', 'Printable Bundle'], reason: 'Moms love practical, printable tools they can use at home immediately.' },
  'Freelancers':       { types: ['Template Pack', 'Workbook', 'Checklist'], reason: 'Freelancers invest in tools that save time and look professional to clients.' },
  'Students':          { types: ['Planner', 'Workbook', 'Tracker'], reason: 'Study planners and workbooks are must-haves for students of all levels.' },
  'Coaches':           { types: ['Workbook', 'Template Pack', 'Prompt Pack'], reason: 'Coaches need ready-to-deliver client materials — workbooks and templates are ideal.' },
  'Creators':          { types: ['Prompt Pack', 'Social Media Pack', 'Template Pack'], reason: 'Creators monetise their process best through prompts and content templates.' },
};

export default function StepProductType({ value, onChange, niche }) {
  const { lang } = useLang();
  const rec = niche ? NICHE_RECOMMENDATIONS[niche] : null;
  const recommendedTypes = rec ? rec.types : [];

  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">{t(lang, 'step_type_title')}</h2>
      <p className="text-muted-foreground mb-4">{t(lang, 'step_type_sub')}</p>

      {rec && (
        <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-5">
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-primary mb-0.5">Recommended for {niche}</p>
            <p className="text-xs text-muted-foreground">{rec.reason}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {types.map(tp => {
          const isRecommended = recommendedTypes.includes(tp.name);
          const isSelected = value === tp.name;
          return (
            <button
              key={tp.name}
              onClick={() => onChange(tp.name)}
              className={`relative flex items-start gap-3 p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : isRecommended
                  ? 'border-primary/40 bg-orange-50/60 hover:border-primary/60'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              {isRecommended && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-tight">
                  ★ TOP
                </span>
              )}
              <span className="text-xl flex-shrink-0">{tp.emoji}</span>
              <div>
                <div className="font-semibold text-sm text-foreground">{tp.name}</div>
                <div className="text-xs text-muted-foreground">{tp.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}