'use client'

import Image from 'next/image'
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

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="nes-container is-dark is-rounded with-title max-w-md w-full animate-slide-up"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="title" style={{ fontSize: 'var(--text-sm)', backgroundColor: '#212529' }}>
          📖 Tacodex
        </p>

        {/* Close button */}
        <button
          onClick={onClose}
          className="nes-btn is-error"
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            fontSize: '10px',
            padding: '2px 8px',
            zIndex: 10,
          }}
        >
          ✕
        </button>

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
          <h3 style={{ fontSize: 'var(--text-base)', color: '#f9a825' }}>
            {config.emoji} {config.label}
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginTop: '4px' }}>
            {config.description}
          </p>
        </div>

        {/* Ingrediente */}
        <div className="nes-container is-rounded mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px 14px' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: '#e8762e', marginBottom: '4px', fontWeight: 700 }}>
            🥩 Ingrediente
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: '#fdf6e3' }}>
            {data.ingrediente}
          </p>
        </div>

        {/* Acompañamiento */}
        <div className="nes-container is-rounded mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px 14px' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: '#4caf50', marginBottom: '4px', fontWeight: 700 }}>
            🥗 Acompañamiento
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: '#fdf6e3' }}>
            {data.acompanamiento}
          </p>
        </div>

        {/* Dato curioso */}
        <div className="nes-container is-rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px 14px' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: '#4fc3f7', marginBottom: '4px', fontWeight: 700 }}>
            💡 Dato curioso
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: '#fdf6e3', lineHeight: 1.5 }}>
            {data.datoCurioso}
          </p>
        </div>
      </div>
    </div>
  )
}
