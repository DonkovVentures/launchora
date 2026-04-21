import { useState } from 'react';
import { getPlatformGuide } from '@/lib/platformGuides';
import { ChevronDown, ChevronUp, CheckSquare, Square, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlatformPublishGuide({ platform }) {
  const guide = getPlatformGuide(platform);
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState([]);

  if (!guide) return null;

  const toggle = (i) => setChecked(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  return (
    <div className="bg-card border border-border rounded-xl card-shadow overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
            <ExternalLink className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-foreground text-sm">How to Publish on {guide.name}</p>
            <p className="text-xs text-muted-foreground">Step-by-step checklist & technical requirements</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 border-t border-border pt-4">

              {/* Technical Requirements */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Technical Requirements</h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: 'Accepted Formats', value: guide.fileFormats.join(', ') },
                    { label: 'Max File Size', value: guide.maxFileSize },
                    { label: 'Title Limit', value: guide.titleLimit },
                    { label: 'Description Limit', value: guide.descriptionLimit },
                    { label: 'Tags/Keywords', value: guide.tagsLimit },
                    { label: 'Image Requirements', value: guide.imageRequirements },
                    { label: 'Best Category', value: guide.categoryTip },
                  ].map(item => (
                    <div key={item.label} className="flex gap-2 text-xs">
                      <span className="font-semibold text-foreground min-w-[120px] flex-shrink-0">{item.label}:</span>
                      <span className="text-muted-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Publishing Checklist */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Publishing Checklist
                  <span className="ml-2 font-normal text-primary">{checked.length}/{guide.publishingSteps.length}</span>
                </h4>
                <div className="w-full h-1 bg-muted rounded-full mb-3">
                  <div
                    className="h-full gradient-bg rounded-full transition-all duration-500"
                    style={{ width: `${(checked.length / guide.publishingSteps.length) * 100}%` }}
                  />
                </div>
                <ul className="space-y-2">
                  {guide.publishingSteps.map((step, i) => (
                    <li key={i}>
                      <button onClick={() => toggle(i)} className="flex items-start gap-2.5 w-full text-left group">
                        {checked.includes(i)
                          ? <CheckSquare className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          : <Square className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />}
                        <span className={`text-xs leading-relaxed ${checked.includes(i) ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          <span className="font-semibold text-primary mr-1">{i + 1}.</span> {step}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro Tips */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Platform Tips</h4>
                <ul className="space-y-1.5">
                  {guide.technicalNotes.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-primary mt-0.5 flex-shrink-0">→</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}