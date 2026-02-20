'use client'

import { useTacomon } from '@/hooks/use-tacomon'
import { CreationScreen } from '@/components/tacomon/creation-screen'
import { MainScreen } from '@/components/tacomon/main-screen'

export default function TacomonPage() {
  const { tacomon, isLoaded, createTacomon, updateStats, resetTacomon } = useTacomon()

  // Show nothing while loading from localStorage to prevent flash
  if (!isLoaded) {
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

  // Screen 1: No saved Tacomon
  if (!tacomon) {
    return <CreationScreen onCreated={createTacomon} />
  }

  // Screen 2: Existing Tacomon
  return (
    <MainScreen
      tacomon={tacomon}
      onUpdateStats={updateStats}
      onReset={resetTacomon}
    />
  )
}
