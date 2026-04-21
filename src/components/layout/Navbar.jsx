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
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-md" style={{boxShadow: '0 2px 12px rgba(234,88,12,0.35)'}}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 2L11.5 7H16L12 10.5L13.5 16L9 13L4.5 16L6 10.5L2 7H6.5L9 2Z" fill="white" fillOpacity="0.9"/>
                <path d="M9 2L9 13" stroke="white" strokeWidth="0.5" strokeOpacity="0.4"/>
              </svg>
            </div>
            <div>
              <span className="font-serif text-foreground text-xl leading-none tracking-tight" style={{letterSpacing: '-0.02em'}}>Launchora</span>
              <span className="block text-[8px] text-muted-foreground tracking-[0.2em] uppercase leading-none mt-0.5 font-medium">DONKOV VENTURES</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t(lang, 'nav_how_it_works')}</Link>
            <Link to="/#what-you-can-create" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t(lang, 'nav_products')}</Link>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t(lang, 'nav_pricing')}</Link>
            <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Projects</Link>
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