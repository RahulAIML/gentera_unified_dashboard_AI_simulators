import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles, Bot, User, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useLocation } from 'react-router-dom'
import { useAppStore } from '../../store'
import { useTranslation } from '../../lib/i18n'
import { useDashboardData } from '../../hooks/useDashboardData'
import { useRoleplayData } from '../../api/roleplayQueries'
import { buildAIContext } from '../../lib/analytics'
import { computeRpKPIs } from '../../lib/roleplayAnalytics'

// Map route → page name (for AI context)
const PAGE_LABELS: Record<string, { en: string; es: string }> = {
  '/':               { en: 'Overview Dashboard',       es: 'Vista General' },
  '/simulations':    { en: 'Simulations Log',           es: 'Registro de Simulaciones' },
  '/conversational': { en: 'Conversational Intelligence', es: 'Inteligencia Conversacional' },
  '/coaching':       { en: 'AI Coaching',               es: 'Coaching IA' },
  '/leaderboard':    { en: 'Leaderboard',               es: 'Clasificación' },
  '/activities':     { en: 'Activities',                es: 'Actividades' },
  '/organization':   { en: 'Organization',              es: 'Organización' },
  '/rolplay':        { en: 'Rolplay Intelligence',      es: 'Inteligencia Rolplay' },
  '/supervisors':    { en: 'Supervisors',               es: 'Supervisores' },
  '/business-lines': { en: 'Business Lines',            es: 'Líneas de Negocio' },
  '/reports':        { en: 'Reports',                   es: 'Reportes' },
  '/settings':       { en: 'Settings',                  es: 'Configuración' },
}

interface Message {
  role: 'user' | 'model'
  text: string
}

export function AIAssistant() {
  const { aiOpen, toggleAI, language } = useAppStore()
  const t = useTranslation(language)
  const location = useLocation()
  const { kpis, sims, activities, actStats, userStats, isLoading } = useDashboardData()
  const { sessions: rpSessions, actividades } = useRoleplayData()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isRolplayPage = location.pathname === '/rolplay' || location.pathname === '/supervisors'
  const pageName = PAGE_LABELS[location.pathname]?.[language] ?? location.pathname

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const handleSend = async () => {
    // Guard log — tells us exactly why a send was blocked
    if (!input.trim())  { console.warn('[AI] Blocked: empty input');        return }
    if (thinking)       { console.warn('[AI] Blocked: already thinking');   return }
    if (isLoading)      { console.warn('[AI] Blocked: dashboard data still loading'); return }
    if (!kpis)          { console.warn('[AI] Blocked: kpis not ready');     return }

    const userText = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: userText }])
    setThinking(true)

    // Build page-specific context prefix
    let pageContext = `[Current page: ${pageName}]\n\n`
    if (isRolplayPage && rpSessions.length > 0) {
      const rpKpis = computeRpKPIs(rpSessions, actividades)
      pageContext += `ROLPLAY DATA (${pageName})\n` +
        `Sessions: ${rpKpis.totalSessions} | Avg Score: ${rpKpis.avgTotalScore} | ` +
        `AI Robin: ${rpKpis.avgRobinPct}% | Voice: ${rpKpis.avgVoicePct}% | ` +
        `Facial: ${rpKpis.avgFacialPct}% | WPM: ${rpKpis.avgWpmPct}% | ` +
        `Active Users: ${rpKpis.activeUsers} | Branches: ${rpKpis.activeBranches}\n\n`
    }
    const context = pageContext + buildAIContext(kpis, sims, activities, actStats ?? [], userStats ?? [])
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY

    console.group('[AI] handleSend')
    console.log('API key present:', !!apiKey, '| key prefix:', apiKey ? apiKey.slice(0, 8) + '...' : 'MISSING')
    console.log('Language:', language)
    console.log('Context length (chars):', context.length)
    console.log('Question:', userText)
    console.groupEnd()

    if (!apiKey) {
      console.error('[AI] VITE_GEMINI_API_KEY is not set — check Render Environment Variables and redeploy')
      setMessages((prev) => [...prev, { role: 'model', text: t('ai_no_key') }])
      setThinking(false)
      return
    }

    try {
      console.log('[AI] Importing @google/generative-ai ...')
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      console.log('[AI] SDK loaded. Initialising gemini-2.5-flash ...')
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const prompt = `${context}\n\nThe user is currently viewing the "${pageName}" page. Focus your response on data relevant to this page.\n\nUser question (${language === 'es' ? 'Spanish' : 'English'}): ${userText}\n\nRespond in ${language === 'es' ? 'Spanish' : 'English'}. Be concise, data-driven, and actionable. Focus on the current page context. Use bullet points when appropriate.`
      console.log('[AI] Sending prompt — total length:', prompt.length, 'chars')
      const t0 = performance.now()
      const result = await model.generateContent(prompt)
      const elapsed = Math.round(performance.now() - t0)
      const text = result.response.text()
      console.log(`[AI] ✅ Response in ${elapsed}ms`, {
        inputTokens:  result.response.usageMetadata?.promptTokenCount,
        outputTokens: result.response.usageMetadata?.candidatesTokenCount,
        finishReason: result.response.candidates?.[0]?.finishReason,
        responseChars: text.length,
      })
      setMessages((prev) => [...prev, { role: 'model', text }])
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number; statusText?: string }
      console.error('[AI] ❌ Request failed')
      console.error('  message   :', e?.message)
      console.error('  HTTP status:', e?.status, e?.statusText)
      console.error('  full error :', err)
      setMessages((prev) => [...prev, { role: 'model', text: t('ai_error') }])
    } finally {
      setThinking(false)
    }
  }

  const greeting = language === 'es'
    ? `¡Hola! Soy tu asistente de inteligencia conversacional de Gentera. Estás en la sección **${pageName}**. Puedo ayudarte a analizar el rendimiento del equipo, identificar áreas de mejora y generar perspectivas. ¿En qué te puedo ayudar?`
    : `Hello! I'm your Gentera Conversational Intelligence assistant. You're on the **${pageName}** section. I can help you analyze team performance, identify improvement areas, and generate data-driven insights. How can I help?`

  return (
    <>
      {/* Floating bubble button */}
      <AnimatePresence>
        {!aiOpen && (
          <motion.button
            key="ai-bubble"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={toggleAI}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-accent shadow-elevated flex items-center justify-center hover:bg-blue-400 transition-colors"
            title={t('nav_ai_assistant')}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
      {aiOpen && (
        <motion.div
          initial={{ opacity: 0, x: 320 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 320 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 h-full w-[380px] max-w-full bg-surface border-l border-line/40 shadow-elevated z-50 flex flex-col"
        >
          {/* Header */}
          <div className="h-14 shrink-0 border-b border-line/30 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet" />
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{t('ai_title')}</h3>
                <p className="text-[10px] text-slate-600">
                  {t('ai_subtitle')} · <span className="text-accent/80">{pageName}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMessages([])}
                className="p-1.5 rounded-md text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors"
                title={t('ai_clear')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={toggleAI}
                className="p-1.5 rounded-md text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-violet/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-violet" />
                </div>
                <div className="bg-card rounded-xl rounded-tl-none px-3 py-2.5 text-sm text-slate-300 leading-relaxed border border-line/30">
                  <ReactMarkdown
                    components={{
                      p:      ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-accent">{children}</strong>,
                    }}
                  >
                    {greeting}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className="flex gap-2">
                {m.role === 'model' && (
                  <div className="w-6 h-6 rounded-full bg-violet/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-violet" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed border ${
                    m.role === 'user'
                      ? 'ml-auto bg-accent/10 text-accent border-accent/20 rounded-tr-none'
                      : 'bg-card text-slate-300 border-line/30 rounded-tl-none'
                  }`}
                >
                  {m.role === 'user' ? m.text : (
                    <ReactMarkdown
                      components={{
                        p:      ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                        ul:     ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
                        ol:     ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
                        li:     ({ children }) => <li>{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
                        em:     ({ children }) => <em className="italic text-slate-300">{children}</em>,
                        code:   ({ children }) => <code className="bg-white/10 rounded px-1 py-0.5 text-xs font-mono text-accent">{children}</code>,
                        h1:     ({ children }) => <h1 className="font-bold text-slate-100 text-base mb-1">{children}</h1>,
                        h2:     ({ children }) => <h2 className="font-semibold text-slate-100 text-sm mb-1">{children}</h2>,
                        h3:     ({ children }) => <h3 className="font-medium text-slate-200 text-sm mb-1">{children}</h3>,
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-accent" />
                  </div>
                )}
              </div>
            ))}
            {thinking && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-violet/10 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-violet animate-pulse" />
                </div>
                <div className="bg-card rounded-xl rounded-tl-none px-3 py-2 border border-line/30">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-line/30 p-3">
            <div className="flex items-center gap-2 bg-card border border-line/60 rounded-xl px-3 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('ai_placeholder')}
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={thinking || !input.trim()}
                className="p-1.5 rounded-lg bg-accent text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-400 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  )
}
