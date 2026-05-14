import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles, Bot, User, Trash2 } from 'lucide-react'
import { useAppStore } from '../../store'
import { useTranslation } from '../../lib/i18n'
import { useDashboardData } from '../../hooks/useDashboardData'
import { buildAIContext } from '../../lib/analytics'

interface Message {
  role: 'user' | 'model'
  text: string
}

export function AIAssistant() {
  const { aiOpen, toggleAI, language } = useAppStore()
  const t = useTranslation(language)
  const { kpis, sims, activities, actStats, userStats, isLoading } = useDashboardData()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const handleSend = async () => {
    if (!input.trim() || thinking || isLoading || !kpis) return
    const userText = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: userText }])
    setThinking(true)

    const context = buildAIContext(kpis, sims, activities, actStats ?? [], userStats ?? [])
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY

    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: t('ai_no_key') },
      ])
      setThinking(false)
      return
    }

    try {
      console.log('[AI] Sending request to gemini-2.5-flash', { question: userText, language })
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const prompt = `${context}\n\nUser question (${language === 'es' ? 'Spanish' : 'English'}): ${userText}\n\nRespond in ${language === 'es' ? 'Spanish' : 'English'}. Be concise, data-driven, and actionable. Use bullet points when appropriate.`
      const t0 = performance.now()
      const result = await model.generateContent(prompt)
      const elapsed = Math.round(performance.now() - t0)
      const text = result.response.text()
      console.log(`[AI] Response received in ${elapsed}ms`, {
        inputTokens: result.response.usageMetadata?.promptTokenCount,
        outputTokens: result.response.usageMetadata?.candidatesTokenCount,
        finishReason: result.response.candidates?.[0]?.finishReason,
      })
      setMessages((prev) => [...prev, { role: 'model', text }])
    } catch (err) {
      console.error('[AI] Request failed:', err)
      setMessages((prev) => [...prev, { role: 'model', text: t('ai_error') }])
    } finally {
      setThinking(false)
    }
  }

  const greeting = t('ai_greeting')

  return (
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
                <p className="text-[10px] text-slate-600">{t('ai_subtitle')}</p>
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
                  {greeting}
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
                  {m.text}
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
  )
}
