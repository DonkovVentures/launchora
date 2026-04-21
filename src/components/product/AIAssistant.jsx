import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_PROMPTS = [
  'How can I improve my title?',
  'What price should I charge?',
  'How do I get my first sale?',
  'What makes this stand out?',
];

export default function AIAssistant({ product }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Hi! I'm your product coach for "${product.generated_data?.title || product.title}". Ask me anything about improving, pricing, or launching it! 🚀` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const d = product.generated_data || {};
    const context = `You are a helpful digital product coach. The user has created this product:
Title: "${d.title}" | Type: ${product.product_type} | Niche: ${product.niche} | Platform: ${product.platform}
Price: $${d.price_min}–$${d.price_max}
Promise: ${d.promise}
Answer their question concisely and specifically to their product. Max 120 words. Be encouraging and actionable.`;

    const history = messages.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');

    const reply = await base44.integrations.Core.InvokeLLM({
      prompt: `${context}\n\nConversation:\n${history}\nUser: ${userMsg}\nAssistant:`,
    });

    setMessages(prev => [...prev, { role: 'assistant', text: typeof reply === 'string' ? reply : reply?.response || 'Let me think about that...' }]);
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 gradient-bg rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-all hover:scale-105"
        style={{ boxShadow: '0 4px 24px rgba(234,88,12,0.4)' }}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-6 h-6 text-white" /></motion.div>
            : <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageCircle className="w-6 h-6 text-white" /></motion.div>
          }
        </AnimatePresence>
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: '520px' }}
          >
            {/* Header */}
            <div className="gradient-bg px-4 py-3 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Product Coach</p>
                <p className="text-[10px] text-white/70">AI-powered guidance</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: 0 }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'gradient-bg text-white rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            {messages.length <= 1 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map(q => (
                  <button key={q} onClick={() => send(q)}
                    className="text-[11px] bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground px-2.5 py-1 rounded-full transition-colors border border-transparent hover:border-primary/20">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask anything..."
                className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-primary/40 border border-transparent focus:border-primary/30"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 gradient-bg rounded-xl flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}