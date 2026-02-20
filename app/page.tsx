'use client'

import { useTacomon } from '@/hooks/use-tacomon'
import { CreationScreen } from '@/components/tacomon/creation-screen'
import { MainScreen } from '@/components/tacomon/main-screen'
import { usePrivy } from '@privy-io/react-auth'

function LoginGate() {
  const { login } = usePrivy()

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="text-center flex flex-col items-center gap-6">
        {/* Spinning tortilla */}
        <div className="spinning-tortilla" aria-hidden="true">
          🫓
        </div>
        <h1 style={{ fontSize: 'var(--text-lg)', color: 'var(--foreground)' }}>
          🌮 Tacomon
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
          ¡Cría tu propio taco mascota!
        </p>
        <button
          onClick={login}
          className="nes-btn is-primary"
          style={{ fontSize: 'var(--text-sm)', padding: '12px 24px' }}
        >
          Iniciar Sesión para continuar
        </button>
      </div>

      <style jsx>{`
        .spinning-tortilla {
          font-size: 5rem;
          animation: spin-tortilla 2s linear infinite;
          display: inline-block;
          filter: drop-shadow(0 0 8px rgba(212, 82, 10, 0.4));
        }
        @keyframes spin-tortilla {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
    </main>
  )
}

export default function TacomonPage() {
  const { tacomon, isLoaded, createTacomon, updateStats, resetTacomon } = useTacomon()
  const { ready, authenticated } = usePrivy()

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

  // Not authenticated → login gate
  if (!authenticated) {
    return <LoginGate />
  }

  // No saved Tacomon → creation (no hatching)
  if (!tacomon) {
    return <CreationScreen onCreated={createTacomon} />
  }

  // Existing Tacomon → main screen
  return (
    <MainScreen
      tacomon={tacomon}
      onUpdateStats={updateStats}
      onReset={resetTacomon}
    />
  )
}
