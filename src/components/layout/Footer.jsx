import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-display font-bold text-foreground text-lg leading-none">Launchora</span>
                <span className="block text-[9px] text-muted-foreground tracking-widest uppercase leading-none mt-0.5">by DONKOV VENTURES</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Create digital products and launch them for sale — with AI. Fast, simple, beginner-friendly.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/create" className="hover:text-foreground transition-colors">Create Product</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><span className="text-xs">DONKOV VENTURES</span></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 Launchora by DONKOV VENTURES. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Build it. List it. Sell it.</p>
        </div>
      </div>
    </footer>
  );
}