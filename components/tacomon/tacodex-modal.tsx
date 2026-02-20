'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'
import type { Specialty } from '@/lib/tacomon-types'
import { SPECIALTY_CONFIG } from '@/lib/tacomon-types'
import { TACODEX_DATA } from '@/lib/tacodex-data'

interface TacodexModalProps {
  specialty: Specialty
  onClose: () => void
}

export function TacodexModal({ specialty, onClose }: TacodexModalProps) {
  const config = SPECIALTY_CONFIG[specialty]
  const data = TACODEX_DATA[specialty]
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const textColor = isDark ? '#fdf6e3' : '#2d2d2d'
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const cardBorder = isDark ? '2px solid rgba(255,255,255,0.1)' : '2px solid rgba(0,0,0,0.1)'

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="max-w-md w-full animate-slide-up"
        style={{
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--background)',
          borderRadius: '20px',
          border: isDark ? '3px solid rgba(255,255,255,0.15)' : '3px solid rgba(0,0,0,0.12)',
          boxShadow: isDark
            ? '0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 12px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
          padding: '24px 20px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 style={{
            fontFamily: 'var(--font-press-start)',
            fontSize: 'var(--text-sm)',
            color: 'var(--foreground)',
          }}>
            📖 Tacodex
          </h2>
          <button
            onClick={onClose}
            className="nes-btn is-error"
            style={{ fontSize: '10px', padding: '2px 8px' }}
          >
            ✕
          </button>
        </div>

        {/* Sprite */}
        <div className="flex flex-col items-center mb-4">
          <div className="relative w-24 h-24 mb-2">
            <Image
              src={config.sprite}
              alt={config.label}
              fill
              className="object-contain pixel-sprite"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <h3 style={{ fontSize: 'var(--text-base)', color: '#f9a825', fontFamily: 'var(--font-press-start)' }}>
            {config.emoji} {config.label}
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginTop: '4px', textAlign: 'center' }}>
            {config.description}
          </p>
        </div>

        {/* Ingrediente */}
        <div style={{ backgroundColor: cardBg, border: cardBorder, borderRadius: '12px', padding: '12px 16px', marginBottom: '10px' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: '#e8762e', marginBottom: '4px', fontWeight: 700, fontFamily: 'var(--font-press-start)' }}>
            🥩 Ingrediente
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: textColor, lineHeight: 1.5 }}>
            {data.ingrediente}
          </p>
        </div>

        {/* Acompañamiento */}
        <div style={{ backgroundColor: cardBg, border: cardBorder, borderRadius: '12px', padding: '12px 16px', marginBottom: '10px' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: '#4caf50', marginBottom: '4px', fontWeight: 700, fontFamily: 'var(--font-press-start)' }}>
            🥗 Acompañamiento
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: textColor, lineHeight: 1.5 }}>
            {data.acompanamiento}
          </p>
        </div>

        {/* Dato curioso */}
        <div style={{ backgroundColor: cardBg, border: cardBorder, borderRadius: '12px', padding: '12px 16px' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: '#4fc3f7', marginBottom: '4px', fontWeight: 700, fontFamily: 'var(--font-press-start)' }}>
            💡 Dato curioso
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: textColor, lineHeight: 1.5 }}>
            {data.datoCurioso}
          </p>
        </div>
      </div>
    </div>
  )
}
