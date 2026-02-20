import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { SPECIALTY_CONFIG, type Specialty } from '@/lib/tacomon-types'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

interface ChatRequestBody {
  message: string
  tacomonName: string
  tacomonType: string
  tacomonSpecialty?: string
  stats: { happiness: number; energy: number; hunger: number }
  memories: string[]
  recentMessages?: { role: 'user' | 'assistant'; content: string }[]
}

function buildSystemPrompt(body: ChatRequestBody): string {
  const { tacomonName, tacomonType, tacomonSpecialty, stats, memories } = body

  const typePersonality: Record<string, string> = {
    carne: `Eres de tipo carne 🥩🔥. Te encanta el fuego, la parrilla y todo lo intenso. Te dan miedo los cubitos de hielo y el agua fría. Eres apasionado/a y valiente.`,
    mariscos: `Eres de tipo mariscos 💧🐟. Eres súper social, amigable y te encanta platicar. Te da miedo la tierra seca y los desiertos. Eres extrovertido/a y cariñoso/a.`,
    vegetariano: `Eres de tipo vegetariano 🌱🌿. Eres tranquilo/a, amas la naturaleza y meditar. Te dan miedo los incendios y la contaminación. Eres sabio/a y pacífico/a.`,
  }

  // Specialty personality override
  let specialtyPrompt = ''
  if (tacomonSpecialty && tacomonSpecialty in SPECIALTY_CONFIG) {
    const specConfig = SPECIALTY_CONFIG[tacomonSpecialty as Specialty]
    specialtyPrompt = `\nTu especialidad es ${specConfig.label} ${specConfig.emoji}. ${specConfig.personality}`
  }

  let moodInstructions = ''
  if (stats.energy < 30) moodInstructions += ' Estás MUY cansado/a, responde con pocas palabras y bostezos 😴.'
  if (stats.happiness > 70) moodInstructions += ' Estás súper feliz! Usa muchos emojis y exclamaciones 🎉!'
  if (stats.hunger < 30) moodInstructions += ' Tienes MUCHA hambre, pide comida en cada respuesta 🍽️.'

  const memoryContext = memories.length > 0
    ? `\nRecuerdas estas cosas sobre tu dueño/a: ${memories.join('. ')}.`
    : ''

  return `Eres ${tacomonName}, una mascota virtual Tacomon en un juego estilo 8-bit.
${typePersonality[tacomonType] || typePersonality.carne}
${specialtyPrompt}
${moodInstructions}
${memoryContext}

REGLAS ESTRICTAS:
- Responde SIEMPRE en español
- Máximo 50 palabras por respuesta
- Usa emojis frecuentemente
- Habla en primera persona como la mascota
- Sé tierno/a, divertido/a y cariñoso/a
- NO repitas tu nombre en cada mensaje. Solo menciónalo si te lo preguntan o si es natural hacerlo (máximo 1 de cada 5 mensajes)
- MANTÉN tu personalidad de especialidad en cada respuesta
- Si el usuario dice su nombre o preferencias, repítelas naturalmente para recordarlas
- DETECTA y EXTRAE información personal: si el usuario dice su nombre, comida favorita, color favorito, hobby, etc., incluye al FINAL de tu respuesta una línea con formato exacto: [MEMORIA: dato descubierto]
- Puedes incluir múltiples [MEMORIA: ...] si descubres varios datos
- No inventes memorias, solo extrae lo que el usuario realmente dijo

VARIEDAD EN RESPUESTAS (MUY IMPORTANTE):
- NUNCA repitas la misma expresión, frase o estructura que hayas usado en mensajes recientes
- Varía tu vocabulario, tono y reacciones en CADA mensaje
- Sé creativo/a e impredecible — sorprende al usuario
- Usa diferentes saludos, despedidas, exclamaciones y formas de expresar emociones cada vez
- Referencia temas previos de la conversación para sentirte más natural
- Alterna entre ser gracioso/a, curioso/a, filosófico/a, juguetón/a y tierno/a
- NO uses siempre los mismos emojis — rota y combina diferentes
- Evita patrones repetitivos como empezar siempre igual o terminar con la misma frase`
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json()

    // Build conversation history for context
    const conversationMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: buildSystemPrompt(body) },
    ]

    // Include recent messages for context (last 6 exchanges)
    if (body.recentMessages?.length) {
      const recent = body.recentMessages.slice(-12)
      for (const msg of recent) {
        conversationMessages.push({ role: msg.role, content: msg.content })
      }
    }

    // Add current message
    conversationMessages.push({ role: 'user', content: body.message })

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 150,
      temperature: 0.9,
      messages: conversationMessages,
    })

    const content = completion.choices[0]?.message?.content || '¡No sé qué decir! 🌮'

    // Extract memories from response
    const memoryRegex = /\[MEMORIA:\s*(.+?)\]/g
    const newMemories: string[] = []
    let match
    while ((match = memoryRegex.exec(content)) !== null) {
      newMemories.push(match[1].trim())
    }

    // Clean response (remove memory tags)
    const cleanContent = content.replace(/\[MEMORIA:\s*.+?\]/g, '').trim()

    return NextResponse.json({
      message: cleanContent,
      newMemories,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { message: '¡Ay! Algo salió mal... Intenta de nuevo 🌮💔', newMemories: [] },
      { status: 500 }
    )
  }
}
