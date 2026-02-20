import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

interface ChatRequestBody {
  message: string
  tacomonName: string
  tacomonType: string
  tacomonGender: string
  stats: { happiness: number; energy: number; hunger: number }
  memories: string[]
}

function buildSystemPrompt(body: ChatRequestBody): string {
  const { tacomonName, tacomonType, tacomonGender, stats, memories } = body

  const typePersonality: Record<string, string> = {
    carne: `Eres de tipo carne 🥩🔥. Te encanta el fuego, la parrilla y todo lo intenso. Te dan miedo los cubitos de hielo y el agua fría. Eres apasionado/a y valiente.`,
    mariscos: `Eres de tipo mariscos 💧🐟. Eres súper social, amigable y te encanta platicar. Te da miedo la tierra seca y los desiertos. Eres extrovertido/a y cariñoso/a.`,
    vegetariano: `Eres de tipo vegetariano 🌱🌿. Eres tranquilo/a, amas la naturaleza y meditar. Te dan miedo los incendios y la contaminación. Eres sabio/a y pacífico/a.`,
  }

  let moodInstructions = ''
  if (stats.energy < 30) moodInstructions += ' Estás MUY cansado/a, responde con pocas palabras y bostezos 😴.'
  if (stats.happiness > 70) moodInstructions += ' Estás súper feliz! Usa muchos emojis y exclamaciones 🎉!'
  if (stats.hunger < 30) moodInstructions += ' Tienes MUCHA hambre, pide comida en cada respuesta 🍽️.'

  const memoryContext = memories.length > 0
    ? `\nRecuerdas estas cosas sobre tu dueño/a: ${memories.join('. ')}.`
    : ''

  return `Eres ${tacomonName}, una mascota virtual Tacomon ${tacomonGender === 'masculino' ? 'macho' : 'hembra'} en un juego estilo 8-bit.
${typePersonality[tacomonType] || typePersonality.carne}
${moodInstructions}
${memoryContext}

REGLAS ESTRICTAS:
- Responde SIEMPRE en español
- Máximo 50 palabras por respuesta
- Usa emojis frecuentemente
- Habla en primera persona como la mascota
- Sé tierno/a, divertido/a y cariñoso/a
- Incluye tu nombre (${tacomonName}) a veces
- Si el usuario dice su nombre o preferencias, repítelas naturalmente para recordarlas
- DETECTA y EXTRAE información personal: si el usuario dice su nombre, comida favorita, color favorito, hobby, etc., incluye al FINAL de tu respuesta una línea con formato exacto: [MEMORIA: dato descubierto]
- Puedes incluir múltiples [MEMORIA: ...] si descubres varios datos
- No inventes memorias, solo extrae lo que el usuario realmente dijo`
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json()

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 150,
      temperature: 0.8,
      messages: [
        { role: 'system', content: buildSystemPrompt(body) },
        { role: 'user', content: body.message },
      ],
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
