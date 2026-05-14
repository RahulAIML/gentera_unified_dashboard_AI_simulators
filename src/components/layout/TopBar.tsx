import { Globe, RefreshCw, Sun, Moon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore, type Language } from '../../store'
import { useTranslation } from '../../lib/i18n'
import { cn } from '../../lib/cn'

const LANGS: { code: Language; label: string; flag: string }[] = [
  { code: 'es', label: 'ES', flag: '🇲🇽' },
  { code: 'en', label: 'EN', flag: '🇺🇸' },
]

export function TopBar() {
  const { language, setLanguage, theme, toggleTheme } = useAppStore()
  const t = useTranslation(language)
  const queryClient = useQueryClient()

  return (
    <header className="h-14 bg-surface border-b border-line/40 flex items-center justify-between px-5 shrink-0 z-10">
      {/* Left: Brand tagline on large screens */}
      <div className="hidden lg:flex items-center gap-2">
        <span className="text-xs text-slate-500 font-medium tracking-wide uppercase">
          Conversational Intelligence Platform
        </span>
      </div>

      {/* Right: Controls */}
      <div className="ml-auto flex items-center gap-2">
        {/* Refresh */}
        <button
          onClick={() => queryClient.invalidateQueries()}
          title="Refresh data"
          className="btn-ghost p-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className="btn-ghost p-2"
        >
          {theme === 'light' ? (
            <Moon className="w-3.5 h-3.5" />
          ) : (
            <Sun className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Language toggle */}
        <div className="flex items-center gap-1 bg-card border border-line/60 rounded-lg p-1">
          <Globe className="w-3 h-3 text-slate-500 ml-1" />
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={cn(
                'px-2 py-0.5 rounded-md text-xs font-medium transition-all duration-150',
                language === l.code
                  ? 'bg-accent/15 text-accent'
                  : 'text-slate-500 hover:text-slate-400',
              )}
            >
              <span className="mr-1">{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
