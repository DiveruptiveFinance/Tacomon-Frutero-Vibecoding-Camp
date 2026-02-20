'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { TacomonData, TACO_CONFIG } from '@/lib/tacomon-types'
import { TacoSprite } from './taco-sprite'

interface HatchingSceneProps {
  tacomon: TacomonData
  onComplete: () => void
}

type HatchPhase = 'shaking' | 'cracking' | 'hatched' | 'message'

export function HatchingScene({ tacomon, onComplete }: HatchingSceneProps) {
  const [phase, setPhase] = useState<HatchPhase>('shaking')
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([])

  const config = TACO_CONFIG[tacomon.type]

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(setTimeout(() => setPhase('cracking'), 2500))

    timers.push(setTimeout(() => {
      const newSparkles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 200 - 100,
        y: Math.random() * 200 - 100,
      }))
      setSparkles(newSparkles)
      setPhase('hatched')
    }, 4000))

    timers.push(setTimeout(() => setPhase('message'), 5500))

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: config.bgColor }}
    >
      {/* Sparkle particles */}
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="absolute animate-sparkle"
          style={{
            left: `calc(50% + ${s.x}px)`,
            top: `calc(45% + ${s.y}px)`,
            width: '12px',
            height: '12px',
            backgroundColor: config.color,
            clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
            animationDelay: `${s.id * 0.1}s`,
          }}
        />
      ))}

      {/* Egg / Hatching / Taco display */}
      <div className="relative flex flex-col items-center">
        {phase === 'shaking' && (
          <div className="animate-egg-shake">
            <div className="relative w-32 h-32 md:w-48 md:h-48">
              <Image
                src="/sprites/taco-egg.jpg"
                alt="Huevo de Tacomon"
                fill
                className="pixel-sprite object-contain"
                priority
              />
            </div>
            <p className="text-center mt-4" style={{ fontSize: 'var(--text-sm)', color: 'var(--foreground)' }}>
              {'Algo se mueve dentro...'}
            </p>
            <div className="flex justify-center gap-2 mt-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: config.color,
                    animation: `taco-bounce 1s ease-in-out infinite`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {phase === 'cracking' && (
          <div className="animate-egg-crack">
            <div className="relative w-32 h-32 md:w-48 md:h-48">
              <Image
                src="/sprites/taco-hatch.jpg"
                alt="Huevo eclosionando"
                fill
                className="pixel-sprite object-contain"
                priority
              />
            </div>
          </div>
        )}

        {(phase === 'hatched' || phase === 'message') && (
          <div className="flex flex-col items-center animate-slide-up">
            <div className="animate-taco-bounce">
              <TacoSprite specialty={tacomon.specialty} size="lg" />
            </div>

            {phase === 'message' && (
              <div className="modern-card mt-6 text-center max-w-sm animate-slide-up">
                <p className="leading-relaxed" style={{ fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: config.color, fontSize: 'var(--text-base)' }}>
                    {tacomon.name}
                  </span>
                  {' ha nacido y esta listo para ser el mejor taco de todos!'}
                </p>
                <p className="mt-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                  {tacomon.gender === 'masculino' ? '♂' : '♀'} {config.label}
                </p>

                <button
                  onClick={onComplete}
                  className="btn btn-primary mt-4"
                  style={{ cursor: 'pointer', fontSize: 'var(--text-sm)' }}
                >
                  {'Continuar'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
