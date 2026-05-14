import { useAppStore } from '../store'
import { useTranslation } from '../lib/i18n'
import { GitBranch, Info } from 'lucide-react'

export default function BusinessLinesPage() {
  const { language } = useAppStore()
  const t = useTranslation(language)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50 tracking-tight">{t('page_lines_title')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('page_lines_subtitle')}</p>
      </div>

      <div className="card p-8 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
          <GitBranch className="w-7 h-7 text-accent" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-200 mb-1">{t('lines_coming_title')}</h2>
          <p className="text-sm text-slate-500 max-w-sm">{t('lines_coming_desc')}</p>
        </div>
        <div className="flex items-start gap-2 bg-surface border border-line/40 rounded-lg px-4 py-3 text-left max-w-sm">
          <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-500">{t('lines_coming_note')}</p>
        </div>
      </div>
    </div>
  )
}
