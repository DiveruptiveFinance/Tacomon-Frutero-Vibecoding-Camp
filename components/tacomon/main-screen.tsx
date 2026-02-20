'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { TacomonData, TACO_CONFIG, COOLDOWN_MS, SPECIALTY_CONFIG } from '@/lib/tacomon-types'
import { getRandomQuestion } from '@/lib/quiz-data'
import { StatBar } from './stat-bar'
import { QuizModal } from './quiz-modal'
import { ThemeToggle } from './theme-toggle'
import { useFloatingHearts } from './floating-hearts'
import { ChatSection } from './chat-section'
import { useSalsa } from '@/hooks/use-salsa'
import { usePrivy } from '@privy-io/react-auth'
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
  const [actionBlocked, setActionBlocked] = useState<{ alimentar: boolean; jugar: boolean }>({
    alimentar: false,
    jugar: false,
  })
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  const { spawnHearts, HeartsLayer } = useFloatingHearts()
  const { balance, deductSalsa } = useSalsa()
  const { login, logout, authenticated, user } = usePrivy()
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

  const handleAction = useCallback((actionType: 'alimentar' | 'jugar') => {
    if (cooldowns[actionType]) return
    if (actionBlocked[actionType]) return
    if (balance < 10) {
      setFeedbackMsg('❌ No tienes suficiente $SALSA (mínimo 10 🍅)')
      setTimeout(() => setFeedbackMsg(null), 3000)
      return
    }
    const question = getRandomQuestion(actionType)
    setActiveQuiz({ question, actionType })
  }, [cooldowns, actionBlocked, balance])

  const handleQuizResult = useCallback((correct: boolean) => {
    if (!activeQuiz) return
    const { actionType } = activeQuiz

    if (correct) {
      deductSalsa(10)
      const statMap = {
        alimentar: 'hunger' as const,
        jugar: 'energy' as const,
        charlar: 'happiness' as const,
      }
      const amount = 15
      const msgs = {
        alimentar: '¡Qué rico taco! Gracias por la salsa 😋',
        jugar: '¡Gran jugada! Tu Tacomon está feliz ⚡😋',
        charlar: '¡Buena charla!',
      }
      setTimeout(() => {
        onUpdateStats(statMap[actionType], amount)
        setFeedbackMsg(msgs[actionType])
        setTimeout(() => setFeedbackMsg(null), 3000)
        setActiveQuiz(null)
      }, 500)
    } else {
      // Block action for 30 seconds
      setFeedbackMsg('❌ ¡Error! Intenta más tarde')
      setTimeout(() => setFeedbackMsg(null), 3000)
      if (actionType === 'alimentar' || actionType === 'jugar') {
        setActionBlocked(prev => ({ ...prev, [actionType]: true }))
        setTimeout(() => {
          setActionBlocked(prev => ({ ...prev, [actionType]: false }))
        }, 30000)
      }
      setTimeout(() => {
        setActiveQuiz(null)
      }, 500)
    }
  }, [activeQuiz, onUpdateStats, deductSalsa])

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
        className="flex items-center justify-between px-4 md:px-6 py-3 flex-wrap gap-2"
        style={{
          backgroundColor: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          borderRadius: '0 0 16px 16px',
        }}
      >
        <h1 style={{ fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>
          {'\u{1F32E} Tacomon'}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Salsa Balance */}
          <span
            className="nes-badge"
            style={{ fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}
          >
            <span className="is-warning">🍅 {balance} $SALSA</span>
          </span>
          {/* Auth */}
          {authenticated && user ? (
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                {user.email?.address || user.google?.email || user.id.slice(0, 10)}
              </span>
              <button
                onClick={logout}
                className="nes-btn is-error"
                style={{ fontSize: 'var(--text-xs)', padding: '4px 8px' }}
              >
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="nes-btn is-primary"
              style={{ fontSize: 'var(--text-xs)', padding: '4px 8px' }}
            >
              Iniciar Sesión
            </button>
          )}
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
              {specialtyConfig?.sprite ? (
                <div className="relative w-32 h-32 md:w-48 md:h-48">
                  <Image
                    src={specialtyConfig.sprite}
                    alt={`Tacomon ${tacomon.name}`}
                    fill
                    className="object-contain animate-taco-idle"
                    priority
                  />
                </div>
              ) : (
                <div className="relative w-32 h-32 md:w-48 md:h-48">
                  <Image
                    src={config.sprite}
                    alt={`Tacomon ${tacomon.name}`}
                    fill
                    className="object-contain animate-taco-idle"
                    priority
                  />
                </div>
              )}
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
            <div className="grid grid-cols-2 gap-2 md:gap-3 w-full">
              <button
                onClick={() => handleAction('alimentar')}
                disabled={cooldowns.alimentar || actionBlocked.alimentar}
                className={`btn py-2 md:py-3 flex flex-col items-center gap-1 ${cooldowns.alimentar || actionBlocked.alimentar ? 'btn-disabled' : 'btn-danger'}`}
                style={{ cursor: cooldowns.alimentar || actionBlocked.alimentar ? 'not-allowed' : 'pointer', fontSize: 'var(--text-xs)', border: '2px solid var(--taco-red)', boxShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}
              >
                <span className="text-base md:text-lg">{'\u{1F34E}'}</span>
                <span>{'Alimentar (10 🍅)'}</span>
              </button>

              <button
                onClick={() => handleAction('jugar')}
                disabled={cooldowns.jugar || actionBlocked.jugar}
                className={`btn py-2 md:py-3 flex flex-col items-center gap-1 ${cooldowns.jugar || actionBlocked.jugar ? 'btn-disabled' : 'btn-warning'}`}
                style={{ cursor: cooldowns.jugar || actionBlocked.jugar ? 'not-allowed' : 'pointer', fontSize: 'var(--text-xs)', border: '2px solid var(--taco-gold)', boxShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}
              >
                <span className="text-base md:text-lg">{'\u{26A1}'}</span>
                <span>{'Jugar (10 🍅)'}</span>
              </button>
            </div>

            {/* Feedback Message */}
            {feedbackMsg && (
              <div
                className="text-center w-full animate-slide-up"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: feedbackMsg.startsWith('❌') ? 'var(--taco-red)' : 'var(--taco-green)',
                  padding: '8px',
                  backgroundColor: feedbackMsg.startsWith('❌') ? 'var(--taco-red-bg)' : 'var(--taco-green-bg)',
                  borderRadius: '8px',
                }}
              >
                {feedbackMsg}
              </div>
            )}

            {/* Cooldown Timer */}
            {(cooldowns.alimentar || cooldowns.jugar) && (
              <div className="cooldown-timer text-center w-full">
                <span>{'⏰ '}</span>
                {cooldowns.alimentar && <span>{'🍎 '}{formatTime(timeLeft.alimentar)}{' '}</span>}
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
