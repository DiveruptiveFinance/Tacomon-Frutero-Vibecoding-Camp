import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

const CATEGORY_PROMPTS: Record<string, string> = {
  codigo: 'Evalúa esta captura de código. Enfócate en: organización del código, buenas prácticas, complejidad y limpieza.',
  diseno: 'Evalúa esta captura de diseño. Enfócate en: estética, uso de colores, tipografía y creatividad.',
  proyecto: 'Evalúa esta captura de proyecto. Enfócate en: funcionalidad, calidad, complejidad y completitud.',
  aprendizaje: 'Evalúa esta captura de aprendizaje. Enfócate en: esfuerzo, comprensión, aplicación práctica.',
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, category } = await req.json()

    if (!imageBase64 || !category) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const categoryPrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.codigo

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `Eres un profesor amigable en un juego educativo de mascotas virtuales. Tu trabajo es evaluar capturas de pantalla que los estudiantes suben para entrenar a su mascota. SIEMPRE debes dar una evaluación, nunca rechaces evaluar. Sé alentador pero honesto. Responde SIEMPRE con este formato exacto:

Score: [número entre 0 y 100]/100. [Tu feedback en español, máximo 2-3 oraciones. Sé específico sobre lo que ves en la imagen.]`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: categoryPrompt },
            {
              type: 'image_url',
              image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
    })

    const content = completion.choices[0]?.message?.content || ''

    // Parse score
    const scoreMatch = content.match(/Score:\s*(\d+)\/100/)
    let score = scoreMatch ? parseInt(scoreMatch[1], 10) : Math.floor(Math.random() * 21) + 40
    score = Math.min(100, Math.max(0, score))

    const feedback = content.replace(/Score:\s*\d+\/100\.?\s*/, '').trim() || '¡Buen intento! Sigue practicando.'

    const points = score
    const tokens = Math.round(score * 0.5)

    return NextResponse.json({ score, feedback, points, tokens })
  } catch (error) {
    console.error('Evaluate API error:', error)
    // Fallback: don't break
    const fallbackScore = Math.floor(Math.random() * 21) + 40
    return NextResponse.json({
      score: fallbackScore,
      feedback: '¡Buen trabajo! Tu Tacomon está aprendiendo contigo. Sigue así.',
      points: fallbackScore,
      tokens: Math.round(fallbackScore * 0.5),
    })
  }
}
