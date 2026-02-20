'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { TacomonData, TACO_CONFIG, COOLDOWN_MS, SPECIALTY_CONFIG } from '@/lib/tacomon-types'
import { getRandomQuestion } from '@/lib/quiz-data'
import { StatBar } from './stat-bar'
import { QuizModal } from './quiz-modal'
import { ThemeToggle } from './theme-toggle'
import { useFloatingHearts } from './floating-hearts'
import { ChatSection } from './chat-section'
import { TacodexModal } from './tacodex-modal'
import { TrainingView, TrainingBadge } from './training-view'
import { useSalsa } from '@/hooks/use-salsa'
import type { SalsaHistoryEntry } from '@/hooks/use-salsa'
import { usePrivy } from '@privy-io/react-auth'
import { useTheme } from 'next-themes'
import type { QuizQuestion } from '@/lib/tacomon-types'

/* ── Floating salsa text component ── */
interface FloatingSalsa {
  id: number
  text: string
  color: string
  x: number
}

function useSalsaFloats() {
  const [floats, setFloats] = useState<FloatingSalsa[]>([])
  const idRef = useRef(0)

  const spawn = useCallback((text: string, color: string) => {
    const id = ++idRef.current
    const x = 20 + Math.random() * 60
    setFloats(prev => [...prev, { id, text, color, x }])
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1800)
  }, [])

  const Layer = () => (
    <>
      {floats.map(f => (
        <div
          key={f.id}
          className="fixed pointer-events-none animate-salsa-float z-[100]"
          style={{
            left: `${f.x}%`,
            top: '40%',
            color: f.color,
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            textShadow: '1px 1px 0 #000',
          }}
        >
          {f.text}
        </div>
      ))}
    </>
  )

  return { spawn, Layer }
}

/* ── Processing overlay ── */
function ProcessingOverlay({ state }: { state: 'idle' | 'processing' | 'done' }) {
  if (state === 'idle') return null
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none">
      <div
        className="nes-container is-rounded animate-slide-up"
        style={{
          backgroundColor: 'rgba(0,0,0,0.85)',
          color: state === 'done' ? '#4caf50' : '#f9a825',
          padding: '16px 28px',
          fontSize: 'var(--text-sm)',
          pointerEvents: 'auto',
        }}
      >
        {state === 'processing' ? '⏳ Procesando…' : '✅ ¡Listo!'}
      </div>
    </div>
  )
}

/* ── Historial panel ── */
function HistorialPanel({ history }: { history: SalsaHistoryEntry[] }) {
  const [open, setOpen] = useState(false)
  const last10 = history.slice(-10).reverse()

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(!open)}
        className="nes-btn is-warning w-full"
        style={{ fontSize: 'var(--text-xs)', padding: '6px 12px' }}
      >
        📜 {open ? 'Cerrar Historial' : 'Historial'}
      </button>
      {open && (
        <div
          className="nes-container is-dark with-title mt-2 animate-slide-up"
          style={{ fontSize: 'var(--text-xs)', maxHeight: '200px', overflowY: 'auto' }}
        >
          <p className="title" style={{ fontSize: 'var(--text-xs)' }}>Últimos movimientos</p>
          {last10.length === 0 ? (
            <p style={{ color: 'var(--muted-foreground)' }}>Sin movimientos aún</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {last10.map((entry, i) => {
                const time = new Date(entry.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                const sign = entry.type === 'earn' ? '+' : '-'
                const color = entry.type === 'earn' ? '#4caf50' : '#e8762e'
                return (
                  <li key={i} style={{ padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color }}>{sign}{entry.amount} 🍅</span>
                    {' '}
                    <span style={{ color: '#b8a080' }}>{entry.reason}</span>
                    {' '}
                    <span style={{ color: '#7a6140', float: 'right' }}>{time}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Insufficient funds tooltip ── */
function InsufficientTooltip({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div
      className="nes-balloon from-left animate-slide-up"
      style={{
        fontSize: 'var(--text-xs)',
        position: 'absolute',
        bottom: '110%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        whiteSpace: 'nowrap',
        backgroundColor: '#2d1b00',
        color: '#fdf6e3',
        padding: '8px 14px',
        border: '2px solid #e8762e',
      }}
    >
      Necesitas 10 🍅. Habla conmigo para ganar más
    </div>
  )
}

/* ── Main Screen ── */
interface MainScreenProps {
  tacomon: TacomonData
  onUpdateStats: (stat: 'happiness' | 'energy' | 'hunger', amount: number, setCooldown?: boolean) => void
  onReset: () => void
}

export function MainScreen({ tacomon, onUpdateStats, onReset }: MainScreenProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState<{
    question: QuizQuestion
    actionType: 'alimentar' | 'charlar' | 'jugar'
  } | null>(null)
  const [cooldowns, setCooldowns] = useState({ alimentar: false, charlar: false, jugar: false })
  const [timeLeft, setTimeLeft] = useState({ alimentar: 0, charlar: 0, jugar: 0 })
  const [actionBlocked, setActionBlocked] = useState({ alimentar: false, jugar: false })
  const [processState, setProcessState] = useState<'idle' | 'processing' | 'done'>('idle')
  const [showInsufficientTip, setShowInsufficientTip] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)
  const [showTacodex, setShowTacodex] = useState(false)
  const [showTraining, setShowTraining] = useState(false)

  const { spawnHearts, HeartsLayer } = useFloatingHearts()
  const { spawn: spawnSalsa, Layer: SalsaLayer } = useSalsaFloats()
  const { balance, streak, history, deductSalsa } = useSalsa()
  const { login, logout, authenticated, user } = usePrivy()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const config = TACO_CONFIG[tacomon.type]
  const specialtyConfig = tacomon.specialty ? SPECIALTY_CONFIG[tacomon.specialty] : null

  // Cooldown check
  useEffect(() => {
    const check = () => {
      const now = Date.now()
      const actions: Array<{ key: 'alimentar' | 'charlar' | 'jugar'; lastAction: string | null }> = [
        { key: 'alimentar', lastAction: tacomon.lastFed },
        { key: 'charlar', lastAction: tacomon.lastChatted },
        { key: 'jugar', lastAction: tacomon.lastPlayed },
      ]
      const nc = { alimentar: false, charlar: false, jugar: false }
      const nt = { alimentar: 0, charlar: 0, jugar: 0 }
      actions.forEach(({ key, lastAction }) => {
        if (lastAction) {
          const elapsed = now - new Date(lastAction).getTime()
          if (elapsed < COOLDOWN_MS) {
            nc[key] = true
            nt[key] = Math.ceil((COOLDOWN_MS - elapsed) / 1000)
          }
        }
      })
      setCooldowns(nc)
      setTimeLeft(nt)
    }
    check()
    const iv = setInterval(check, 1000)
    return () => clearInterval(iv)
  }, [tacomon.lastFed, tacomon.lastChatted, tacomon.lastPlayed])

  const handleAction = useCallback((actionType: 'alimentar' | 'jugar') => {
    if (cooldowns[actionType] || actionBlocked[actionType]) return
    if (balance < 10) {
      setShowInsufficientTip(true)
      setTimeout(() => setShowInsufficientTip(false), 3000)
      return
    }
    const question = getRandomQuestion(actionType)
    setActiveQuiz({ question, actionType })
  }, [cooldowns, actionBlocked, balance])

  const handleQuizResult = useCallback((correct: boolean) => {
    if (!activeQuiz) return
    const { actionType } = activeQuiz

    // Show processing
    setProcessState('processing')

    if (correct) {
      setTimeout(() => {
        deductSalsa(10, actionType === 'alimentar' ? 'Alimentar Tacomon' : 'Jugar con Tacomon')
        spawnSalsa('-10 🍅', '#e8762e')

        const statMap = { alimentar: 'hunger' as const, jugar: 'energy' as const, charlar: 'happiness' as const }
        onUpdateStats(statMap[actionType], 15, true)

        const msgs = {
          alimentar: '¡Qué rico taco! Gracias por la salsa 😋',
          jugar: '¡Gran jugada! Tu Tacomon está feliz ⚡😋',
          charlar: '¡Buena charla!',
        }
        setFeedbackMsg(msgs[actionType])
        setProcessState('done')

        setTimeout(() => {
          setProcessState('idle')
          setFeedbackMsg(null)
          setActiveQuiz(null)
        }, 2000)
      }, 800)
    } else {
      setTimeout(() => {
        setFeedbackMsg('❌ ¡Error! Intenta más tarde')
        setProcessState('idle')
        if (actionType === 'alimentar' || actionType === 'jugar') {
          setActionBlocked(prev => ({ ...prev, [actionType]: true }))
          setTimeout(() => setActionBlocked(prev => ({ ...prev, [actionType]: false })), 30000)
        }
        setTimeout(() => { setFeedbackMsg(null); setActiveQuiz(null) }, 2000)
      }, 800)
    }
  }, [activeQuiz, onUpdateStats, deductSalsa, spawnSalsa])

  const handleReset = useCallback(() => setShowResetConfirm(true), [])
  const confirmReset = useCallback(() => { setShowResetConfirm(false); onReset() }, [onReset])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
      <SalsaLayer />
      <ProcessingOverlay state={processState} />

      {/* ── Fixed Header ── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-3 md:px-6 py-2 flex-wrap gap-2"
        style={{
          backgroundColor: 'var(--card)',
          borderBottom: '4px solid var(--border)',
          imageRendering: 'pixelated',
        }}
      >
        <h1 style={{ fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>🌮 Tacomon</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Salsa counter */}
          <div
            className="nes-container is-rounded is-dark"
            style={{ padding: '4px 10px', fontSize: 'var(--text-xs)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>🍅</span>
            <span style={{ color: '#f9a825' }}>{balance}</span>
            <span style={{ color: '#b8a080' }}>$SALSA</span>
            {streak > 0 && <span style={{ color: '#e8762e' }}>🔥{streak}</span>}
          </div>
          {/* Auth */}
          {authenticated && user ? (
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                {user.email?.address || user.google?.email || user.id.slice(0, 10)}
              </span>
              <button onClick={logout} className="nes-btn is-error" style={{ fontSize: '10px', padding: '2px 8px' }}>
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <button onClick={login} className="nes-btn is-primary" style={{ fontSize: '10px', padding: '2px 8px' }}>
              Iniciar Sesión
            </button>
          )}
          <ThemeToggle />
          <button onClick={handleReset} className="nes-btn" style={{ fontSize: '10px', padding: '2px 8px' }}>
            Reiniciar
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 px-3 py-4 md:py-6 max-w-5xl mx-auto w-full">
        {/* Name */}
        <div className="text-center mb-4">
          <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--foreground)' }}>{tacomon.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-sm">{config.emoji}</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>{config.label}</span>
          </div>
          {specialtyConfig && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <span>{specialtyConfig.emoji}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--taco-pink)' }}>{specialtyConfig.label}</span>
            </div>
          )}
          <div className="flex items-center justify-center mt-1">
            <TrainingBadge />
          </div>
        </div>

        {/* Training View */}
        {showTraining && (
          <TrainingView
            onUpdateStats={onUpdateStats}
            onBack={() => setShowTraining(false)}
          />
        )}

        {/* 2-column layout */}
        {!showTraining && <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 md:items-stretch">
          {/* LEFT: Sprite + Stats + Actions */}
          <div className="flex flex-col items-center gap-4">
            {/* Sprite */}
            <div
              className="pet-area relative flex items-center justify-center"
              onClick={spawnHearts}
              onDoubleClick={() => tacomon.specialty && setShowTacodex(true)}
              onTouchStart={spawnHearts}
              role="button"
              tabIndex={0}
              aria-label={`Acariciar a ${tacomon.name} (doble click para Tacodex)`}
            >
              <div className="relative w-32 h-32 md:w-48 md:h-48">
                <Image
                  src={specialtyConfig?.sprite || config.sprite}
                  alt={`Tacomon ${tacomon.name}`}
                  fill
                  className="object-contain animate-taco-idle pixel-sprite"
                  priority
                />
              </div>
              <HeartsLayer />
            </div>

            {/* Stats */}
            <div className="nes-container is-dark is-rounded with-title w-full" style={{ padding: '12px' }}>
              <p className="title" style={{ fontSize: 'var(--text-xs)', backgroundColor: 'var(--card)' }}>📊 Stats</p>
              <div className="flex flex-col gap-3">
                <StatBar label="Felicidad" emoji="💚" value={tacomon.happiness} maxValue={100} color="var(--taco-green)" bgColor="var(--taco-green-bg)" />
                <StatBar label="Energía" emoji="⚡" value={tacomon.energy} maxValue={100} color="var(--taco-gold)" bgColor="var(--taco-gold-bg)" />
                <StatBar label="Saciedad" emoji="🍎" value={tacomon.hunger} maxValue={100} color="var(--taco-red)" bgColor="var(--taco-red-bg)" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 w-full relative">
              <InsufficientTooltip show={showInsufficientTip} />
              {(() => {
                const feedDisabled = cooldowns.alimentar || actionBlocked.alimentar || balance < 10
                const feedReason = cooldowns.alimentar ? `⏳ ${formatTime(timeLeft.alimentar)}` : actionBlocked.alimentar ? '🚫 30s' : balance < 10 ? '🍅 Insuf.' : null
                return (
                  <button
                    onClick={() => handleAction('alimentar')}
                    disabled={feedDisabled}
                    className={`nes-btn ${feedDisabled ? 'is-disabled' : 'is-success'}`}
                    style={{
                      fontSize: 'var(--text-xs)',
                      padding: '10px 6px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: feedDisabled ? 0.45 : 1,
                      cursor: feedDisabled ? 'not-allowed' : 'pointer',
                      boxShadow: feedDisabled ? 'none' : '0 0 12px rgba(76, 175, 80, 0.5), 0 4px 8px rgba(0,0,0,0.3)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ fontSize: '1.2em' }}>🍎</span>
                    <span>Alimentar</span>
                    <span style={{ fontSize: '0.8em', opacity: 0.7 }}>{feedReason || '10 🍅'}</span>
                  </button>
                )
              })()}
              {(() => {
                const playDisabled = cooldowns.jugar || actionBlocked.jugar || balance < 10
                const playReason = cooldowns.jugar ? `⏳ ${formatTime(timeLeft.jugar)}` : actionBlocked.jugar ? '🚫 30s' : balance < 10 ? '🍅 Insuf.' : null
                return (
                  <button
                    onClick={() => handleAction('jugar')}
                    disabled={playDisabled}
                    className={`nes-btn ${playDisabled ? 'is-disabled' : 'is-primary'}`}
                    style={{
                      fontSize: 'var(--text-xs)',
                      padding: '10px 6px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: playDisabled ? 0.45 : 1,
                      cursor: playDisabled ? 'not-allowed' : 'pointer',
                      boxShadow: playDisabled ? 'none' : '0 0 12px rgba(33, 150, 243, 0.5), 0 4px 8px rgba(0,0,0,0.3)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ fontSize: '1.2em' }}>⚡</span>
                    <span>Jugar</span>
                    <span style={{ fontSize: '0.8em', opacity: 0.7 }}>{playReason || '10 🍅'}</span>
                  </button>
                )
              })()}
            </div>

            {/* Training Button */}
            <button
              onClick={() => setShowTraining(true)}
              className="nes-btn is-warning"
              style={{
                fontSize: 'var(--text-xs)',
                padding: '10px 6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                width: '100%',
                boxShadow: '0 0 12px rgba(255, 152, 0, 0.5), 0 4px 8px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '1.2em' }}>🎓</span>
              <span>Entrenar</span>
            </button>

            {/* Feedback */}
            {feedbackMsg && (
              <div
                className="nes-container is-rounded animate-slide-up w-full text-center"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: feedbackMsg.startsWith('❌') ? '#e53935' : '#4caf50',
                  backgroundColor: feedbackMsg.startsWith('❌') ? 'var(--taco-red-bg)' : 'var(--taco-green-bg)',
                  padding: '8px 12px',
                  border: `2px solid ${feedbackMsg.startsWith('❌') ? '#e53935' : '#4caf50'}`,
                }}
              >
                {feedbackMsg}
              </div>
            )}

            {/* Cooldown */}
            {(cooldowns.alimentar || cooldowns.jugar) && (
              <div className="cooldown-timer text-center w-full">
                <span>⏰ </span>
                {cooldowns.alimentar && <span>🍎 {formatTime(timeLeft.alimentar)} </span>}
                {cooldowns.jugar && <span>⚡ {formatTime(timeLeft.jugar)}</span>}
              </div>
            )}

            {/* Action blocked timer */}
            {(actionBlocked.alimentar || actionBlocked.jugar) && (
              <div style={{ fontSize: 'var(--text-xs)', color: '#e53935', textAlign: 'center' }}>
                🚫 Acción bloqueada por error en quiz (30s)
              </div>
            )}
          </div>

          {/* RIGHT: Chat + History */}
          <div className="flex flex-col gap-4 md:h-full">
            <ChatSection tacomon={tacomon} onUpdateStats={onUpdateStats} className="flex-1" />

            {/* Historial */}
            <HistorialPanel history={history} />

            <p className="text-center" style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
              Toca a tu Tacomon para acariciarlo! Doble click para abrir el 📖 Tacodex
            </p>
            <p className="text-center" style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
              Creado el: {new Date(tacomon.createdAt).toLocaleDateString('es-MX')}
            </p>
          </div>
        </div>}
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

      {/* Tacodex Modal */}
      {showTacodex && tacomon.specialty && (
        <TacodexModal specialty={tacomon.specialty} onClose={() => setShowTacodex(false)} />
      )}

      {/* Reset Confirmation */}
      {showResetConfirm && (
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
            <span className="text-3xl block mb-3">⚠️</span>
            <div style={{
              backgroundColor: isDark ? 'rgba(229,57,53,0.15)' : 'rgba(229,57,53,0.08)',
              border: isDark ? '2px solid rgba(229,57,53,0.3)' : '2px solid rgba(229,57,53,0.2)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '16px',
            }}>
              <h3 style={{
                fontSize: 'var(--text-sm)',
                color: '#e53935',
                fontFamily: 'var(--font-press-start)',
                marginBottom: '8px',
              }}>
                ¡Cuidado!
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: isDark ? '#fdf6e3' : '#2d2d2d', lineHeight: 1.5 }}>
                ¿Estás seguro? Perderás a <span style={{ color: config.color, fontWeight: 700 }}>{tacomon.name}</span> y todo su progreso.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowResetConfirm(false)} className="nes-btn flex-1" style={{ fontSize: 'var(--text-xs)' }}>
                Cancelar
              </button>
              <button onClick={confirmReset} className="nes-btn is-error flex-1" style={{ fontSize: 'var(--text-xs)' }}>
                Sí, reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
