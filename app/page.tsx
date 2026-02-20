'use client'

import { useState } from 'react'
import { useTacomon } from '@/hooks/use-tacomon'
import { CreationScreen } from '@/components/tacomon/creation-screen'
import { MainScreen } from '@/components/tacomon/main-screen'
import { usePrivy } from '@privy-io/react-auth'
import { TacomonData } from '@/lib/tacomon-types'
import { useTheme } from 'next-themes'

function SavePromptModal({ onLogin, onSkip }: { onLogin: () => void; onSkip: () => void }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const cardBorder = isDark ? '2px solid rgba(255,255,255,0.1)' : '2px solid rgba(0,0,0,0.1)'
  const textColor = isDark ? '#fdf6e3' : '#2d2d2d'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="max-w-sm w-full animate-slide-up"
        style={{
          backgroundColor: 'var(--background)',
          borderRadius: '20px',
          border: isDark ? '3px solid rgba(255,255,255,0.15)' : '3px solid rgba(0,0,0,0.12)',
          boxShadow: isDark
            ? '0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 12px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
          padding: '24px 20px',
          textAlign: 'center' as const,
        }}
      >
        <span className="text-4xl block mb-3">🌮</span>

        {/* Title card - Tacodex style */}
        <div style={{
          backgroundColor: cardBg,
          border: cardBorder,
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
        }}>
          <h3 style={{
            fontSize: 'var(--text-sm)',
            color: '#f9a825',
            fontFamily: 'var(--font-press-start)',
            marginBottom: '8px',
          }}>
            ¡Tu Tacomon está listo!
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: textColor, lineHeight: 1.5 }}>
            Inicia sesión para guardar tu progreso y no perder a tu taco mascota.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={onLogin} className="nes-btn is-primary w-full" style={{ fontSize: 'var(--text-xs)' }}>
            🔐 Iniciar Sesión
          </button>
          <button onClick={onSkip} className="nes-btn w-full" style={{ fontSize: 'var(--text-xs)' }}>
            Continuar sin cuenta
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TacomonPage() {
  const { tacomon, isLoaded, createTacomon, updateStats, resetTacomon } = useTacomon()
  const { ready, authenticated, login } = usePrivy()
  const [showSavePrompt, setShowSavePrompt] = useState(false)

  // Show loading while Privy or localStorage initializes
  if (!ready || !isLoaded) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      >
        <div className="text-center animate-taco-bounce">
          <span className="text-4xl block mb-4">{'\u{1F32E}'}</span>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
            {'Cargando...'}
          </p>
        </div>
      </main>
    )
  }

  // No saved Tacomon → creation screen (no login required)
  if (!tacomon) {
    const handleCreated = (data: TacomonData) => {
      createTacomon(data)
      // Show save prompt only if not logged in
      if (!authenticated) {
        setShowSavePrompt(true)
      }
    }

    return (
      <>
        <CreationScreen onCreated={handleCreated} />
        {showSavePrompt && (
          <SavePromptModal
            onLogin={() => { setShowSavePrompt(false); login() }}
            onSkip={() => setShowSavePrompt(false)}
          />
        )}
      </>
    )
  }

  // Existing Tacomon → main screen
  return (
    <>
      <MainScreen
        tacomon={tacomon}
        onUpdateStats={updateStats}
        onReset={resetTacomon}
      />
      {showSavePrompt && (
        <SavePromptModal
          onLogin={() => { setShowSavePrompt(false); login() }}
          onSkip={() => setShowSavePrompt(false)}
        />
      )}
    </>
  )
}
