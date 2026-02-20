'use client'

import { useState } from 'react'
import { useTacomon } from '@/hooks/use-tacomon'
import { CreationScreen } from '@/components/tacomon/creation-screen'
import { MainScreen } from '@/components/tacomon/main-screen'
import { usePrivy } from '@privy-io/react-auth'
import { TacomonData } from '@/lib/tacomon-types'

function SavePromptModal({ onLogin, onSkip }: { onLogin: () => void; onSkip: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="nes-container is-rounded is-dark max-w-sm w-full animate-slide-up" style={{ textAlign: 'center' }}>
        <span className="text-3xl block mb-3">🌮</span>
        <h3 style={{ fontSize: 'var(--text-sm)', color: '#f9a825' }}>¡Tu Tacomon está listo!</h3>
        <p className="leading-relaxed my-4" style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
          Inicia sesión para guardar tu progreso y no perder a tu taco mascota.
        </p>
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
        style={{ backgroundColor: 'var(--background)' }}
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
