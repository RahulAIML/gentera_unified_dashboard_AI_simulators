import type { Language } from '../store'

const MODEL = 'gemini-1.5-flash'

function getClient() {
  // Dynamically import to avoid issues when key is missing
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (!key || key === 'your_gemini_api_key_here') return null
  return { key }
}

export function isGeminiConfigured(): boolean {
  return !!getClient()
}

function buildSystemPrompt(context: string, language: Language): string {
  if (language === 'es') {
    return `Eres un asistente de inteligencia artificial especializado en el análisis de plataformas de simulación conversacional para Gentera (Compartamos Banco). Responde SIEMPRE en español de manera clara, concisa y ejecutiva. Analiza los datos del dashboard y proporciona perspectivas valiosas y accionables. No inventes datos; solo usa el contexto proporcionado.

DATOS ACTUALES DEL DASHBOARD:
${context}

Instrucciones:
- Responde de forma directa y ejecutiva
- Usa viñetas para listas
- Destaca hallazgos clave
- Sugiere acciones concretas cuando sea relevante
- Si no tienes suficientes datos, indícalo claramente`
  }
  return `You are an AI assistant specialized in analyzing conversational simulation platforms for Gentera (Compartamos Banco). ALWAYS respond in English clearly and concisely in an executive manner. Analyze dashboard data and provide valuable, actionable insights. Do not invent data; only use the provided context.

CURRENT DASHBOARD DATA:
${context}

Instructions:
- Respond directly and in executive style
- Use bullet points for lists
- Highlight key findings
- Suggest concrete actions when relevant
- If you don't have enough data, state it clearly`
}

export async function* streamGeminiResponse(
  userMessage: string,
  context: string,
  language: Language,
): AsyncGenerator<string, void, unknown> {
  const client = getClient()
  if (!client) {
    yield language === 'es'
      ? 'Asistente IA no configurado. Por favor, agrega VITE_GEMINI_API_KEY en tu archivo .env.'
      : 'AI Assistant not configured. Please add VITE_GEMINI_API_KEY to your .env file.'
    return
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(client.key)
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: buildSystemPrompt(context, language),
    })

    const result = await model.generateContentStream(userMessage)

    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) yield text
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    yield language === 'es'
      ? `Error al conectar con Gemini: ${msg}`
      : `Error connecting to Gemini: ${msg}`
  }
}
