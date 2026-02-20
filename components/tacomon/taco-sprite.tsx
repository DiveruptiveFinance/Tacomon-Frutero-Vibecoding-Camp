'use client'

import { useMemo } from 'react'
import type { Specialty } from '@/lib/tacomon-types'

interface TacoSpriteProps {
  specialty?: Specialty | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SPECIALTY_EFFECTS: Record<string, { particles: string[]; accent: string }> = {
  pastor: { particles: ['🔥', '🔥', '💥'], accent: '#ff4500' },
  asada: { particles: ['💨', '🌫️', '💨'], accent: '#8B7355' },
  carnitas: { particles: ['💕', '💗', '💕'], accent: '#ff69b4' },
  pescado: { particles: ['💧', '🫧', '💧'], accent: '#4fc3f7' },
  camaron: { particles: ['✨', '⭐', '✨'], accent: '#ffab40' },
  pulpo: { particles: ['🔮', '🌀', '🔮'], accent: '#9c27b0' },
  frijoles: { particles: ['⭐', '💫', '⭐'], accent: '#795548' },
  nopal: { particles: ['🌵', '🍃', '🌵'], accent: '#4caf50' },
  champinones: { particles: ['☮️', '🍄', '☮️'], accent: '#ce93d8' },
}

const FLOATING_ACCESSORIES = ['🍋', '🌶️', '🥃', '🍋', '🌶️']

const sizeMap = {
  sm: { taco: 'text-5xl', container: 'w-24 h-24' },
  md: { taco: 'text-7xl', container: 'w-40 h-40' },
  lg: { taco: 'text-8xl', container: 'w-56 h-56' },
}

export function TacoSprite({ specialty, size = 'md', className = '' }: TacoSpriteProps) {
  const effect = specialty ? SPECIALTY_EFFECTS[specialty] : null
  const sizes = sizeMap[size]

  const accessories = useMemo(() =>
    FLOATING_ACCESSORIES.map((emoji, i) => ({
      emoji,
      delay: i * 1.2,
      duration: 3 + Math.random() * 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
    })), [])

  const particles = useMemo(() =>
    (effect?.particles || []).map((emoji, i) => ({
      emoji,
      delay: i * 0.8,
      angle: (i * 120) + Math.random() * 40,
    })), [effect])

  return (
    <div className={`relative ${sizes.container} ${className}`}>
      {/* Floating accessories */}
      {accessories.map((acc, i) => (
        <span
          key={`acc-${i}`}
          className="absolute pointer-events-none opacity-40"
          style={{
            left: `${acc.x}%`,
            top: `${acc.y}%`,
            fontSize: '0.75rem',
            animation: `floatAccessory ${acc.duration}s ease-in-out infinite`,
            animationDelay: `${acc.delay}s`,
          }}
        >
          {acc.emoji}
        </span>
      ))}

      {/* Glow ring */}
      {effect && (
        <div
          className="absolute inset-4 rounded-full opacity-20 blur-xl"
          style={{
            backgroundColor: effect.accent,
            animation: 'pulseGlow 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Main taco with idle animation */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'tacoFloat 3s ease-in-out infinite' }}>
        <span className={`${sizes.taco} select-none`} style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>
          🌮
        </span>
      </div>

      {/* Specialty particles */}
      {particles.map((p, i) => (
        <span
          key={`particle-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            fontSize: size === 'sm' ? '0.75rem' : '1rem',
            animation: `particleOrbit 3s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
            transformOrigin: '0 0',
            transform: `rotate(${p.angle}deg) translateX(${size === 'sm' ? 30 : 50}px)`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}
