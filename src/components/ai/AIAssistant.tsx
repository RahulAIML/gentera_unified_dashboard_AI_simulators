import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles, Bot, User, Trash2, ImagePlus, XCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useLocation } from 'react-router-dom'
import { useAppStore } from '../../store'
import { useTranslation } from '../../lib/i18n'
import { useDashboardData } from '../../hooks/useDashboardData'
import { useRoleplayData } from '../../api/roleplayQueries'
import { buildAIContext } from '../../lib/analytics'
import { computeRpKPIs } from '../../lib/roleplayAnalytics'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const MAX_IMAGE_DIM   = 1536   // px — Gemini vision sweet spot
const MAX_IMAGE_BYTES = 4 * 1024 * 1024  // 4 MB post-resize safety
const ACCEPTED_TYPES  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface AttachedImage {
  dataUrl: string    // data:image/jpeg;base64,... — for display
  base64:  string    // raw base64 — for Gemini inlineData
  mimeType: string   // always 'image/jpeg' after resize
  originalName: string
}

interface Message {
  role: 'user' | 'model'
  text: string
  imageDataUrl?: string  // set on user messages that included an image
}

// ─────────────────────────────────────────────
// Page labels
// ─────────────────────────────────────────────
const PAGE_LABELS: Record<string, { en: string; es: string }> = {
  '/':               { en: 'Overview Dashboard',          es: 'Vista General' },
  '/simulations':    { en: 'Simulations Log',             es: 'Registro de Simulaciones' },
  '/conversational': { en: 'Conversational Intelligence', es: 'Inteligencia Conversacional' },
  '/coaching':       { en: 'AI Coaching',                 es: 'Coaching IA' },
  '/leaderboard':    { en: 'Leaderboard',                 es: 'Clasificación' },
  '/activities':     { en: 'Activities',                  es: 'Actividades' },
  '/organization':   { en: 'Organization',                es: 'Organización' },
  '/rolplay':        { en: 'Rolplay Intelligence',        es: 'Inteligencia Rolplay' },
  '/supervisors':    { en: 'Supervisors',                 es: 'Supervisores' },
  '/business-lines': { en: 'Business Lines',             es: 'Líneas de Negocio' },
  '/reports':        { en: 'Reports',                    es: 'Reportes' },
  '/settings':       { en: 'Settings',                   es: 'Configuración' },
}

// ─────────────────────────────────────────────
// Image processing helpers
// ─────────────────────────────────────────────

/**
 * Resize image using Canvas and return JPEG base64.
 * Keeps aspect ratio. Converts anything (PNG/WEBP/GIF) to JPEG for
 * consistent Gemini inlineData handling.
 */
async function processImageFile(fileOrBlob: File | Blob, name = 'image'): Promise<AttachedImage> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_TYPES.includes(fileOrBlob.type) && !fileOrBlob.type.startsWith('image/')) {
      reject(new Error(`Unsupported image type: ${fileOrBlob.type}`))
      return
    }

    const objectUrl = URL.createObjectURL(fileOrBlob)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // Calculate resized dimensions preserving aspect ratio
      let { width, height } = img
      if (width > MAX_IMAGE_DIM || height > MAX_IMAGE_DIM) {
        const ratio = Math.min(MAX_IMAGE_DIM / width, MAX_IMAGE_DIM / height)
        width  = Math.round(width  * ratio)
        height = Math.round(height * ratio)
      }

      const canvas  = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas context unavailable')); return }

      // White background before drawing (handles transparent PNGs)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      // Reduce quality iteratively until we're under MAX_IMAGE_BYTES
      let quality = 0.88
      let dataUrl = canvas.toDataURL('image/jpeg', quality)

      while (dataUrl.length * 0.75 > MAX_IMAGE_BYTES && quality > 0.4) {
        quality -= 0.1
        dataUrl = canvas.toDataURL('image/jpeg', quality)
      }

      const base64 = dataUrl.split(',')[1]
      resolve({
        dataUrl,
        base64,
        mimeType: 'image/jpeg',
        originalName: name,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

// ─────────────────────────────────────────────
// Markdown components (shared between messages)
// ─────────────────────────────────────────────
const mdComponents = {
  p:      ({ children }: any) => <p className="mb-1.5 last:mb-0">{children}</p>,
  ul:     ({ children }: any) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
  ol:     ({ children }: any) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
  li:     ({ children }: any) => <li>{children}</li>,
  strong: ({ children }: any) => <strong className="font-semibold text-slate-100">{children}</strong>,
  em:     ({ children }: any) => <em className="italic text-slate-400">{children}</em>,
  code:   ({ children }: any) => (
    <code className="bg-white/10 rounded px-1 py-0.5 text-xs font-mono text-accent">{children}</code>
  ),
  h1: ({ children }: any) => <h1 className="font-bold text-slate-100 text-base mb-1">{children}</h1>,
  h2: ({ children }: any) => <h2 className="font-semibold text-slate-100 text-sm mb-1">{children}</h2>,
  h3: ({ children }: any) => <h3 className="font-medium text-slate-200 text-sm mb-1">{children}</h3>,
}

const greetingMdComponents = {
  p:      ({ children }: any) => <p className="mb-1 last:mb-0">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold text-accent">{children}</strong>,
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export function AIAssistant() {
  const { aiOpen, toggleAI, language } = useAppStore()
  const t = useTranslation(language)
  const location = useLocation()
  const { kpis, sims, activities, actStats, userStats, isLoading } = useDashboardData()
  const { sessions: rpSessions, actividades } = useRoleplayData()

  const [messages,      setMessages]      = useState<Message[]>([])
  const [input,         setInput]         = useState('')
  const [thinking,      setThinking]      = useState(false)
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null)
  const [imageError,    setImageError]    = useState<string | null>(null)

  const bottomRef   = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)

  const isRolplayPage = location.pathname === '/rolplay' || location.pathname === '/supervisors'
  const pageName      = PAGE_LABELS[location.pathname]?.[language] ?? location.pathname

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  // ── Image processing ──────────────────────────
  const attachImage = useCallback(async (fileOrBlob: File | Blob, name?: string) => {
    setImageError(null)
    try {
      const processed = await processImageFile(fileOrBlob, name)
      setAttachedImage(processed)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image processing failed'
      setImageError(msg)
      console.error('[AI] Image processing error:', err)
    }
  }, [])

  // ── Clipboard paste on input ──────────────────
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find((item) => item.type.startsWith('image/'))
    if (!imageItem) return  // not an image paste — let text paste proceed normally

    e.preventDefault()  // prevent pasting raw binary as text
    const blob = imageItem.getAsFile()
    if (!blob) return
    attachImage(blob, 'pasted-image')
  }, [attachImage])

  // ── File picker selection ─────────────────────
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    attachImage(file, file.name)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }, [attachImage])

  // ── Remove attached image ─────────────────────
  const removeImage = useCallback(() => {
    setAttachedImage(null)
    setImageError(null)
  }, [])

  // ── Main send handler ─────────────────────────
  const handleSend = async () => {
    const hasText  = !!input.trim()
    const hasImage = !!attachedImage

    if (!hasText && !hasImage) { console.warn('[AI] Blocked: no text or image'); return }
    if (thinking)              { console.warn('[AI] Blocked: already thinking');  return }
    if (isLoading)             { console.warn('[AI] Blocked: data still loading');return }
    if (!kpis)                 { console.warn('[AI] Blocked: kpis not ready');    return }

    const userText      = input.trim()
    const imageForSend  = attachedImage

    // Optimistically update UI
    setInput('')
    setAttachedImage(null)
    setImageError(null)
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userText, imageDataUrl: imageForSend?.dataUrl },
    ])
    setThinking(true)

    // Build context
    let pageContext = `[Current page: ${pageName}]\n\n`
    if (isRolplayPage && rpSessions.length > 0) {
      const rpKpis = computeRpKPIs(rpSessions, actividades)
      pageContext +=
        `ROLPLAY DATA (${pageName})\n` +
        `Sessions: ${rpKpis.totalSessions} | Avg Score: ${rpKpis.avgTotalScore} | ` +
        `AI Robin: ${rpKpis.avgRobinPct}% | Voice: ${rpKpis.avgVoicePct}% | ` +
        `Facial: ${rpKpis.avgFacialPct}% | WPM: ${rpKpis.avgWpmPct}% | ` +
        `Active Users: ${rpKpis.activeUsers} | Branches: ${rpKpis.activeBranches}\n\n`
    }
    const dashboardContext = pageContext + buildAIContext(kpis, sims, activities, actStats ?? [], userStats ?? [])

    // Full prompt string
    const lang         = language === 'es' ? 'Spanish' : 'English'
    const imageHint    = imageForSend ? '\n[The user has shared a dashboard screenshot/image. Analyse it in the context of the dashboard data above.]' : ''
    const questionPart = userText
      ? `\n\nUser question (${lang}): ${userText}`
      : `\n\nUser shared an image (${lang}). Please analyse it in the context of the dashboard data.`

    const fullPrompt =
      `${dashboardContext}${imageHint}` +
      `\n\nThe user is currently viewing the "${pageName}" page. Focus your response on data relevant to this page.` +
      questionPart +
      `\n\nRespond in ${lang}. Be concise, data-driven, and actionable. Use bullet points where appropriate.`

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY

    console.group('[AI] handleSend')
    console.log('API key present:', !!apiKey)
    console.log('Language:', language)
    console.log('Context chars:', fullPrompt.length)
    console.log('Image attached:', !!imageForSend, imageForSend?.originalName)
    console.groupEnd()

    if (!apiKey) {
      console.error('[AI] VITE_GEMINI_API_KEY not set')
      setMessages((prev) => [...prev, { role: 'model', text: t('ai_no_key') }])
      setThinking(false)
      return
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

      const t0 = performance.now()

      let result: Awaited<ReturnType<typeof model.generateContent>>

      if (imageForSend) {
        // Multimodal request: text + image inlineData
        result = await model.generateContent([
          { text: fullPrompt },
          {
            inlineData: {
              mimeType: imageForSend.mimeType,
              data:     imageForSend.base64,
            },
          },
        ])
      } else {
        // Text-only request
        result = await model.generateContent(fullPrompt)
      }

      const elapsed = Math.round(performance.now() - t0)
      const text    = result.response.text()

      console.log(`[AI] ✅ ${elapsed}ms`, {
        tokens:      result.response.usageMetadata?.promptTokenCount,
        outTokens:   result.response.usageMetadata?.candidatesTokenCount,
        finishReason: result.response.candidates?.[0]?.finishReason,
        chars:       text.length,
        multimodal:  !!imageForSend,
      })

      setMessages((prev) => [...prev, { role: 'model', text }])
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number; statusText?: string }
      console.error('[AI] ❌ Request failed', e?.message, e?.status, e?.statusText)
      setMessages((prev) => [...prev, { role: 'model', text: t('ai_error') }])
    } finally {
      setThinking(false)
    }
  }

  const greeting = language === 'es'
    ? `¡Hola! Soy tu asistente de inteligencia conversacional de Gentera. Estás en la sección **${pageName}**. Puedo ayudarte a analizar el rendimiento del equipo, identificar áreas de mejora y generar perspectivas. También puedes **pegar o adjuntar imágenes** del dashboard para que las analice. ¿En qué te puedo ayudar?`
    : `Hello! I'm your Gentera Conversational Intelligence assistant. You're on the **${pageName}** section. I can help you analyze team performance, identify improvement areas, and generate data-driven insights. You can also **paste or attach dashboard screenshots** for analysis. How can I help?`

  const canSend = !thinking && (!!input.trim() || !!attachedImage)

  return (
    <>
      {/* ── Floating bubble ── */}
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

      {/* ── Chat panel ── */}
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
                  onClick={() => { setMessages([]); setAttachedImage(null); setImageError(null) }}
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
              {/* Greeting */}
              {messages.length === 0 && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-violet/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-violet" />
                  </div>
                  <div className="bg-card rounded-xl rounded-tl-none px-3 py-2.5 text-sm text-slate-300 leading-relaxed border border-line/30">
                    <ReactMarkdown components={greetingMdComponents}>
                      {greeting}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Chat history */}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Bot avatar */}
                  {m.role === 'model' && (
                    <div className="w-6 h-6 rounded-full bg-violet/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-violet" />
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`max-w-[85%] rounded-xl text-sm leading-relaxed border ${
                      m.role === 'user'
                        ? 'bg-accent/10 text-accent border-accent/20 rounded-tr-none'
                        : 'bg-card text-slate-300 border-line/30 rounded-tl-none'
                    }`}
                  >
                    {/* Attached image (user messages) */}
                    {m.imageDataUrl && (
                      <div className="p-2 pb-0">
                        <img
                          src={m.imageDataUrl}
                          alt="Attached"
                          className="rounded-lg max-w-full max-h-48 object-contain bg-black/20"
                        />
                      </div>
                    )}

                    {/* Text content */}
                    {m.text && (
                      <div className="px-3 py-2.5">
                        {m.role === 'user' ? (
                          m.text
                        ) : (
                          <ReactMarkdown components={mdComponents}>
                            {m.text}
                          </ReactMarkdown>
                        )}
                      </div>
                    )}
                  </div>

                  {/* User avatar */}
                  {m.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-accent" />
                    </div>
                  )}
                </div>
              ))}

              {/* Thinking indicator */}
              {thinking && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-violet/10 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-violet animate-pulse" />
                  </div>
                  <div className="bg-card rounded-xl rounded-tl-none px-3 py-2 border border-line/30">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="shrink-0 border-t border-line/30 p-3 space-y-2">

              {/* Image preview (shown when image is attached) */}
              {attachedImage && (
                <div className="relative inline-flex">
                  <img
                    src={attachedImage.dataUrl}
                    alt={attachedImage.originalName}
                    className="h-20 w-auto max-w-full rounded-lg object-cover border border-line/40 bg-black/20"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 border border-line/60 flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors"
                    title="Remove image"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-slate-300 px-1 rounded truncate max-w-[90%]">
                    {attachedImage.originalName}
                  </span>
                </div>
              )}

              {/* Image error */}
              {imageError && (
                <p className="text-[11px] text-danger px-1">{imageError}</p>
              )}

              {/* Input row */}
              <div className="flex items-center gap-2 bg-card border border-line/60 rounded-xl px-2.5 py-2">
                {/* Image upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={thinking}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-40 shrink-0"
                  title={language === 'es' ? 'Adjuntar imagen (o pega con Ctrl+V)' : 'Attach image (or paste with Ctrl+V)'}
                >
                  <ImagePlus className="w-4 h-4" />
                </button>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {/* Text input */}
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  onPaste={handlePaste}
                  placeholder={
                    attachedImage
                      ? (language === 'es' ? 'Pregunta sobre la imagen...' : 'Ask about the image...')
                      : t('ai_placeholder')
                  }
                  className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none min-w-0"
                />

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  className="p-1.5 rounded-lg bg-accent text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-400 transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Paste hint — shown only before first interaction */}
              {messages.length === 0 && !attachedImage && (
                <p className="text-[10px] text-slate-700 text-center">
                  {language === 'es'
                    ? 'Ctrl+V para pegar imágenes del portapapeles'
                    : 'Ctrl+V to paste images from clipboard'}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
