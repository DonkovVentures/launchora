import { useLang } from '@/lib/LanguageContext';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <button
        onClick={() => setLang('en')}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${lang === 'en' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('bg')}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${lang === 'bg' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        БГ
      </button>
    </div>
  );
}