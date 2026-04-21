import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const products = [
  { name: 'Planner', emoji: '📅', desc: 'Daily, weekly or monthly planning systems', color: 'bg-purple-50 border-purple-200' },
  { name: 'Checklist', emoji: '✅', desc: 'Step-by-step checklists for any workflow', color: 'bg-blue-50 border-blue-200' },
  { name: 'Tracker', emoji: '📊', desc: 'Habit, goal and progress trackers', color: 'bg-green-50 border-green-200' },
  { name: 'Worksheet', emoji: '📝', desc: 'Guided worksheets for learning and growth', color: 'bg-orange-50 border-orange-200' },
  { name: 'Workbook', emoji: '📚', desc: 'Deep-dive workbooks with exercises', color: 'bg-pink-50 border-pink-200' },
  { name: 'Journal', emoji: '🗒️', desc: 'Guided journals for reflection and mindset', color: 'bg-yellow-50 border-yellow-200' },
  { name: 'Prompt Pack', emoji: '✨', desc: 'AI or writing prompts for creators', color: 'bg-purple-50 border-purple-200' },
  { name: 'Mini eBook', emoji: '📖', desc: 'Short-form guides and how-tos', color: 'bg-blue-50 border-blue-200' },
  { name: 'Template Pack', emoji: '🎨', desc: 'Ready-to-use templates for any niche', color: 'bg-green-50 border-green-200' },
  { name: 'Social Media Pack', emoji: '📱', desc: 'Content calendars and caption templates', color: 'bg-orange-50 border-orange-200' },
  { name: 'Printable Bundle', emoji: '🖨️', desc: 'Collections of printable resources', color: 'bg-pink-50 border-pink-200' },
  { name: 'Lead Magnet', emoji: '🧲', desc: 'Free resources to grow your email list', color: 'bg-yellow-50 border-yellow-200' },
];

export default function ProductTypes() {
  return (
    <section id="what-you-can-create" className="py-24 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
            What you can create
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            12 types of digital products. All sell well on major platforms. All beginner-friendly.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {products.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className={`${p.color} border rounded-xl p-4 hover:scale-105 transition-transform cursor-default`}
            >
              <div className="text-2xl mb-2">{p.emoji}</div>
              <div className="font-semibold text-foreground text-sm mb-1">{p.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{p.desc}</div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/create">
            <Button size="lg" className="gradient-bg text-white hover:opacity-90 font-semibold px-8 rounded-xl">
              Start Creating Your Product
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}