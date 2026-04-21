import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { lang } = useLang();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-foreground text-lg leading-none">Launchora</span>
              <span className="block text-[9px] text-muted-foreground tracking-widest uppercase leading-none mt-0.5">by DONKOV VENTURES</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t(lang, 'nav_how_it_works')}</Link>
            <Link to="/#what-you-can-create" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t(lang, 'nav_products')}</Link>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t(lang, 'nav_pricing')}</Link>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t(lang, 'nav_dashboard')}</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/create">
              <Button className="gradient-bg text-white hover:opacity-90 transition-opacity font-semibold px-5">
                {t(lang, 'nav_start_creating')}
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />
            <button className="p-2" onClick={() => setOpen(!open)}>
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-background border-t border-border px-4 py-4 space-y-3">
          <Link to="/" className="block text-sm text-muted-foreground" onClick={() => setOpen(false)}>{t(lang, 'footer_home')}</Link>
          <Link to="/pricing" className="block text-sm text-muted-foreground" onClick={() => setOpen(false)}>{t(lang, 'nav_pricing')}</Link>
          <Link to="/dashboard" className="block text-sm text-muted-foreground" onClick={() => setOpen(false)}>{t(lang, 'nav_dashboard')}</Link>
          <Link to="/create" onClick={() => setOpen(false)}>
            <Button className="gradient-bg text-white w-full font-semibold">{t(lang, 'nav_start_creating')}</Button>
          </Link>
        </div>
      )}
    </nav>
  );
}