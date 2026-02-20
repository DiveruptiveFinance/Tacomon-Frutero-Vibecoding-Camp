'use client'

import { useState, useCallback, useEffect } from 'react'
import { TacomonData, TACO_CONFIG, COOLDOWN_MS, SPECIALTY_CONFIG } from '@/lib/tacomon-types'
import { getRandomQuestion } from '@/lib/quiz-data'
import { StatBar } from './stat-bar'
import { QuizModal } from './quiz-modal'
import { ThemeToggle } from './theme-toggle'
import { useFloatingHearts } from './floating-hearts'
import { ChatSection } from './chat-section'
import { TacoSprite } from './taco-sprite'
import type { QuizQuestion } from '@/lib/tacomon-types'

interface MainScreenProps {
  tacomon: TacomonData
  onUpdateStats: (stat: 'happiness' | 'energy' | 'hunger', amount: number) => void
  onReset: () => void
}

export function MainScreen({ tacomon, onUpdateStats, onReset }: MainScreenProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState<{
    question: QuizQuestion
    actionType: 'alimentar' | 'charlar' | 'jugar'
  } | null>(null)
  const [cooldowns, setCooldowns] = useState({
    alimentar: false,
    charlar: false,
    jugar: false,
  })
  const [timeLeft, setTimeLeft] = useState({
    alimentar: 0,
    charlar: 0,
    jugar: 0,
  })

  const { spawnHearts, HeartsLayer } = useFloatingHearts()
  const config = TACO_CONFIG[tacomon.type]
  const specialtyConfig = tacomon.specialty ? SPECIALTY_CONFIG[tacomon.specialty] : null

  useEffect(() => {
    const checkCooldowns = () => {
      const now = Date.now()

      const actions: Array<{ key: 'alimentar' | 'charlar' | 'jugar'; lastAction: string | null }> = [
        { key: 'alimentar', lastAction: tacomon.lastFed },
        { key: 'charlar', lastAction: tacomon.lastChatted },
        { key: 'jugar', lastAction: tacomon.lastPlayed },
      ]

      const newCooldowns: typeof cooldowns = { alimentar: false, charlar: false, jugar: false }
      const newTimeLeft: typeof timeLeft = { alimentar: 0, charlar: 0, jugar: 0 }

      actions.forEach(({ key, lastAction }) => {
        if (lastAction) {
          const elapsed = now - new Date(lastAction).getTime()
          if (elapsed < COOLDOWN_MS) {
            newCooldowns[key] = true
            newTimeLeft[key] = Math.ceil((COOLDOWN_MS - elapsed) / 1000)
          }
        }
      })

      setCooldowns(newCooldowns)
      setTimeLeft(newTimeLeft)
    }

    checkCooldowns()
    const interval = setInterval(checkCooldowns, 1000)
    return () => clearInterval(interval)
  }, [tacomon.lastFed, tacomon.lastChatted, tacomon.lastPlayed])

  const handleAction = useCallback((actionType: 'alimentar' | 'charlar' | 'jugar') => {
    if (cooldowns[actionType]) return
    const question = getRandomQuestion(actionType)
    setActiveQuiz({ question, actionType })
  }, [cooldowns])

  const handleQuizResult = useCallback((correct: boolean) => {
    if (!activeQuiz) return
    const amount = correct ? 15 : 5
    const statMap = {
      alimentar: 'hunger' as const,
      charlar: 'happiness' as const,
      jugar: 'energy' as const,
    }

    setTimeout(() => {
      onUpdateStats(statMap[activeQuiz.actionType], amount)
      setActiveQuiz(null)
    }, 500)
  }, [activeQuiz, onUpdateStats])

  const handleReset = useCallback(() => {
    setShowResetConfirm(true)
  }, [])

  const confirmReset = useCallback(() => {
    setShowResetConfirm(false)
    onReset()
  }, [onReset])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: config.bgColor }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 md:px-6 py-3"
        style={{
          backgroundColor: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          borderRadius: '0 0 16px 16px',
        }}
      >
        <h1 style={{ fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>
          {'\u{1F32E} Tacomon'}
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={handleReset}
            className="btn btn-ghost"
            style={{ fontSize: 'var(--text-xs)' }}
          >
            {'Reiniciar'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-4 py-4 md:py-8 max-w-5xl mx-auto w-full">
        {/* Tacomon Name & Info */}
        <div className="text-center mb-4">
          <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--foreground)' }}>
            {tacomon.name}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-sm">{config.emoji}</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
              {config.label}
            </span>
            <span style={{ fontSize: 'var(--text-xs)' }}>
              {tacomon.gender === 'masculino' ? '\u{2642}' : '\u{2640}'}
            </span>
          </div>
          {specialtyConfig && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <span>{specialtyConfig.emoji}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--taco-pink)' }}>
                {specialtyConfig.label}
              </span>
            </div>
          )}
        </div>

        {/* Responsive 2-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* LEFT COLUMN: Sprite + Stats + Actions */}
          <div className="flex flex-col items-center gap-4">
            {/* Sprite Area */}
            <div
              className="pet-area relative flex items-center justify-center"
              onClick={spawnHearts}
              onTouchStart={spawnHearts}
              role="button"
              tabIndex={0}
              aria-label={`Acariciar a ${tacomon.name}`}
            >
              <TacoSprite specialty={tacomon.specialty} size="lg" />
              <HeartsLayer />
            </div>

            {/* Stats */}
            <div className="modern-card w-full">
              <div className="flex flex-col gap-3">
                <StatBar
                  label="Felicidad"
                  emoji={'\u{1F49A}'}
                  value={tacomon.happiness}
                  maxValue={100}
                  color="var(--taco-green)"
                  bgColor="var(--taco-green-bg)"
                />
                <StatBar
                  label="Energia"
                  emoji={'\u{26A1}'}
                  value={tacomon.energy}
                  maxValue={100}
                  color="var(--taco-gold)"
                  bgColor="var(--taco-gold-bg)"
                />
                <StatBar
                  label="Hambre"
                  emoji={'\u{1F34E}'}
                  value={tacomon.hunger}
                  maxValue={100}
                  color="var(--taco-red)"
                  bgColor="var(--taco-red-bg)"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 md:gap-3 w-full">
              <button
                onClick={() => handleAction('alimentar')}
                disabled={cooldowns.alimentar}
                className={`btn py-2 md:py-3 flex flex-col items-center gap-1 ${cooldowns.alimentar ? 'btn-disabled' : 'btn-danger'}`}
                style={{ cursor: cooldowns.alimentar ? 'not-allowed' : 'pointer', fontSize: 'var(--text-xs)' }}
              >
                <span className="text-base md:text-lg">{'\u{1F34E}'}</span>
                <span>{'Alimentar'}</span>
              </button>

              <button
                onClick={() => handleAction('charlar')}
                disabled={cooldowns.charlar}
                className={`btn py-2 md:py-3 flex flex-col items-center gap-1 ${cooldowns.charlar ? 'btn-disabled' : 'btn-success'}`}
                style={{ cursor: cooldowns.charlar ? 'not-allowed' : 'pointer', fontSize: 'var(--text-xs)' }}
              >
                <span className="text-base md:text-lg">{'\u{1F4AC}'}</span>
                <span>{'Charlar'}</span>
              </button>

              <button
                onClick={() => handleAction('jugar')}
                disabled={cooldowns.jugar}
                className={`btn py-2 md:py-3 flex flex-col items-center gap-1 ${cooldowns.jugar ? 'btn-disabled' : 'btn-warning'}`}
                style={{ cursor: cooldowns.jugar ? 'not-allowed' : 'pointer', fontSize: 'var(--text-xs)' }}
              >
                <span className="text-base md:text-lg">{'\u{26A1}'}</span>
                <span>{'Jugar'}</span>
              </button>
            </div>

            {/* Cooldown Timer */}
            {(cooldowns.alimentar || cooldowns.charlar || cooldowns.jugar) && (
              <div className="cooldown-timer text-center w-full">
                <span>{'⏰ '}</span>
                {cooldowns.alimentar && <span>{'🍎 '}{formatTime(timeLeft.alimentar)}{' '}</span>}
                {cooldowns.charlar && <span>{'💬 '}{formatTime(timeLeft.charlar)}{' '}</span>}
                {cooldowns.jugar && <span>{'⚡ '}{formatTime(timeLeft.jugar)}</span>}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Chat */}
          <div className="flex flex-col gap-4">
            <ChatSection tacomon={tacomon} onUpdateStats={onUpdateStats} />

            <p className="text-center" style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
              {'Toca a tu Tacomon para acariciarlo!'}
            </p>
            <p className="text-center" style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
              {'Creado el: '}{new Date(tacomon.createdAt).toLocaleDateString('es-MX')}
            </p>
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      {activeQuiz && (
        <QuizModal
          question={activeQuiz.question}
          actionType={activeQuiz.actionType}
          onResult={handleQuizResult}
          onClose={() => setActiveQuiz(null)}
        />
      )}

      {/* Reset Confirmation */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div
            className="modern-card max-w-sm w-full animate-slide-up"
          >
            <div className="text-center mb-4">
              <span className="text-2xl">{'\u{26A0}\u{FE0F}'}</span>
              <h3 className="mt-2" style={{ fontSize: 'var(--text-sm)', color: 'var(--destructive)' }}>
                {'Cuidado!'}
              </h3>
            </div>
            <p className="leading-relaxed text-center mb-4" style={{ fontSize: 'var(--text-xs)' }}>
              {'Estas seguro de que quieres reiniciar? Perderas a '}
              <span style={{ color: config.color }}>{tacomon.name}</span>
              {' y todo su progreso para siempre.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="btn btn-ghost flex-1"
                style={{ cursor: 'pointer', fontSize: 'var(--text-xs)' }}
              >
                {'Cancelar'}
              </button>
              <button
                onClick={confirmReset}
                className="btn btn-danger flex-1"
                style={{ cursor: 'pointer', fontSize: 'var(--text-xs)' }}
              >
                {'Si, reiniciar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
