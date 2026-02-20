'use client'

import { useState, useCallback, useRef } from 'react'
import { useTheme } from 'next-themes'
import { useSalsa } from '@/hooks/use-salsa'

/* ── Types ── */
interface TrainingEntry {
  score: number
  category: string
  timestamp: string
}

interface TrainingData {
  totalPoints: number
  history: TrainingEntry[]
}

type Category = 'codigo' | 'diseno' | 'proyecto' | 'aprendizaje'

interface EvalResult {
  score: number
  feedback: string
  points: number
  tokens: number
}

/* ── Constants ── */
const CATEGORIES: { key: Category; emoji: string; label: string }[] = [
  { key: 'codigo', emoji: '💻', label: 'Código' },
  { key: 'diseno', emoji: '🎨', label: 'Diseño' },
  { key: 'proyecto', emoji: '🚀', label: 'Proyecto' },
  { key: 'aprendizaje', emoji: '📚', label: 'Aprendizaje' },
]

const STAGES = [
  { emoji: '🥚', name: 'Bebé', min: 0, max: 499 },
  { emoji: '🐣', name: 'Joven', min: 500, max: 1499 },
  { emoji: '🐉', name: 'Adulto', min: 1500, max: Infinity },
]

function getStage(pts: number) {
  if (pts >= 1500) return STAGES[2]
  if (pts >= 500) return STAGES[1]
  return STAGES[0]
}

function getNextStageThreshold(pts: number): number {
  if (pts < 500) return 500
  if (pts < 1500) return 1500
  return 1500 // already max
}

function getScoreEmoji(score: number) {
  if (score >= 80) return '🏆'
  if (score >= 60) return '⭐'
  if (score >= 40) return '👍'
  return '💪'
}

const TRAINING_STORAGE_KEY = 'tacomon-training'

function loadTraining(): TrainingData {
  try {
    const raw = localStorage.getItem(TRAINING_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* noop */ }
  return { totalPoints: 0, history: [] }
}

function saveTraining(data: TrainingData) {
  data.history = data.history.slice(-20)
  localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(data))
}

/* ── Component ── */
interface TrainingViewProps {
  onUpdateStats: (stat: 'happiness' | 'energy' | 'hunger', amount: number) => void
  onBack: () => void
}

export function TrainingView({ onUpdateStats, onBack }: TrainingViewProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const { addSalsa } = useSalsa()
  const fileRef = useRef<HTMLInputElement>(null)

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EvalResult | null>(null)
  const [trainingData, setTrainingData] = useState<TrainingData>(loadTraining)

  const cardStyle = {
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    border: isDark ? '2px solid rgba(255,255,255,0.1)' : '2px solid rgba(0,0,0,0.1)',
    borderRadius: '12px',
    padding: '16px',
  }

  const stage = getStage(trainingData.totalPoints)
  const nextThreshold = getNextStageThreshold(trainingData.totalPoints)
  const prevThreshold = trainingData.totalPoints >= 1500 ? 1500 : trainingData.totalPoints >= 500 ? 500 : 0
  const progressPct = trainingData.totalPoints >= 1500
    ? 100
    : Math.min(100, ((trainingData.totalPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (file.size > 5 * 1024 * 1024) {
      setError('⚠️ La imagen debe ser menor a 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setImagePreview(dataUrl)
      setImageBase64(dataUrl)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleCancel = useCallback(() => {
    setImagePreview(null)
    setImageBase64(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  const handleEvaluate = useCallback(async () => {
    if (!imageBase64 || !selectedCategory) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, category: selectedCategory }),
      })
      const data: EvalResult = await res.json()

      // Check for evolution before adding points
      const oldStage = getStage(trainingData.totalPoints)
      const newTotal = trainingData.totalPoints + data.points
      const newStage = getStage(newTotal)

      // Apply stat effects
      const score = data.score
      if (score >= 80) {
        onUpdateStats('happiness', 15)
        onUpdateStats('energy', -20)
        onUpdateStats('hunger', 15)
      } else if (score >= 60) {
        onUpdateStats('happiness', 8)
        onUpdateStats('energy', -15)
        onUpdateStats('hunger', 12)
      } else if (score >= 40) {
        onUpdateStats('happiness', 3)
        onUpdateStats('energy', -12)
        onUpdateStats('hunger', 10)
      } else {
        onUpdateStats('happiness', -10)
        onUpdateStats('energy', -15)
        onUpdateStats('hunger', 10)
      }

      // Add $SALSA tokens
      addSalsa(data.tokens, `Entrenamiento ${selectedCategory}`)

      // Update training data
      const updated: TrainingData = {
        totalPoints: newTotal,
        history: [...trainingData.history, {
          score: data.score,
          category: selectedCategory,
          timestamp: new Date().toISOString(),
        }],
      }
      saveTraining(updated)
      setTrainingData(updated)

      // Evolution check
      if (newStage.name !== oldStage.name) {
        addSalsa(100, `¡Evolución a ${newStage.emoji} ${newStage.name}!`)
        setTimeout(() => {
          alert(`🎉 ¡Tu Tacomon evolucionó a ${newStage.emoji} ${newStage.name}! +100 $SALSA de bonus`)
        }, 500)
      }

      setResult(data)
    } catch {
      setError('Error al evaluar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [imageBase64, selectedCategory, trainingData, onUpdateStats, addSalsa])

  const handleTrainAgain = useCallback(() => {
    setResult(null)
    setImagePreview(null)
    setImageBase64(null)
    setSelectedCategory(null)
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  // ── Results Screen ──
  if (result) {
    const newStage = getStage(trainingData.totalPoints)
    const newNextThreshold = getNextStageThreshold(trainingData.totalPoints)
    const newPrevThreshold = trainingData.totalPoints >= 1500 ? 1500 : trainingData.totalPoints >= 500 ? 500 : 0
    const newProgressPct = trainingData.totalPoints >= 1500
      ? 100
      : Math.min(100, ((trainingData.totalPoints - newPrevThreshold) / (newNextThreshold - newPrevThreshold)) * 100)

    return (
      <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full">
        {/* Back */}
        <button onClick={onBack} className="nes-btn" style={{ fontSize: 'var(--text-xs)', alignSelf: 'flex-start' }}>
          ← Volver
        </button>

        {/* Score Card */}
        <div style={cardStyle}>
          <div className="text-center">
            <span style={{ fontSize: '2.5rem' }}>{getScoreEmoji(result.score)}</span>
            <h3 style={{ fontFamily: 'var(--font-press-start)', fontSize: 'var(--text-base)', color: '#e8762e', marginTop: '8px' }}>
              {result.score}/100
            </h3>
          </div>
        </div>

        {/* Feedback Card */}
        <div style={cardStyle}>
          <h4 style={{ fontFamily: 'var(--font-press-start)', fontSize: 'var(--text-xs)', marginBottom: '8px', color: isDark ? '#fdf6e3' : '#2d2d2d' }}>
            💬 Feedback
          </h4>
          <p style={{ fontSize: 'var(--text-sm)', color: isDark ? '#ccc' : '#555', lineHeight: 1.6 }}>
            {result.feedback}
          </p>
        </div>

        {/* Rewards Card */}
        <div style={cardStyle}>
          <h4 style={{ fontFamily: 'var(--font-press-start)', fontSize: 'var(--text-xs)', marginBottom: '8px', color: isDark ? '#fdf6e3' : '#2d2d2d' }}>
            🎁 Recompensas
          </h4>
          <div className="flex justify-around">
            <span style={{ fontSize: 'var(--text-sm)', color: '#4caf50' }}>⭐ +{result.points} Puntos</span>
            <span style={{ fontSize: 'var(--text-sm)', color: '#e8762e' }}>🍎 +{result.tokens} Tokens</span>
          </div>
        </div>

        {/* Evolution Progress */}
        <div style={cardStyle}>
          <h4 style={{ fontFamily: 'var(--font-press-start)', fontSize: 'var(--text-xs)', marginBottom: '8px', color: isDark ? '#fdf6e3' : '#2d2d2d' }}>
            {newStage.emoji} Evolución: {newStage.name}
          </h4>
          <div style={{
            width: '100%',
            height: '20px',
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${newProgressPct}%`,
              height: '100%',
              backgroundColor: '#e8762e',
              borderRadius: '10px',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: isDark ? '#aaa' : '#888', textAlign: 'center', marginTop: '4px' }}>
            {trainingData.totalPoints} / {trainingData.totalPoints >= 1500 ? '∞' : newNextThreshold} pts
          </p>
        </div>

        <button onClick={handleTrainAgain} className="nes-btn is-primary w-full" style={{ fontSize: 'var(--text-sm)' }}>
          🎓 Entrenar Nuevamente
        </button>
      </div>
    )
  }

  // ── Main Training View ──
  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full">
      {/* Back */}
      <button onClick={onBack} className="nes-btn" style={{ fontSize: 'var(--text-xs)', alignSelf: 'flex-start' }}>
        ← Volver
      </button>

      {/* Header with stage info */}
      <div style={cardStyle} className="text-center">
        <h3 style={{ fontFamily: 'var(--font-press-start)', fontSize: 'var(--text-sm)', color: '#e8762e', marginBottom: '8px' }}>
          🎓 Entrenamiento
        </h3>
        <p style={{ fontSize: 'var(--text-xs)', color: isDark ? '#aaa' : '#888' }}>
          {stage.emoji} {stage.name} — {trainingData.totalPoints} pts
        </p>
        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '12px',
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderRadius: '6px',
          overflow: 'hidden',
          marginTop: '8px',
        }}>
          <div style={{
            width: `${progressPct}%`,
            height: '100%',
            backgroundColor: '#e8762e',
            borderRadius: '6px',
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Category Selection */}
      <div style={cardStyle}>
        <h4 style={{ fontFamily: 'var(--font-press-start)', fontSize: 'var(--text-xs)', marginBottom: '12px', color: isDark ? '#fdf6e3' : '#2d2d2d' }}>
          Elige categoría
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              style={{
                padding: '12px 8px',
                borderRadius: '10px',
                border: selectedCategory === cat.key ? '2px solid #e8762e' : isDark ? '2px solid rgba(255,255,255,0.1)' : '2px solid rgba(0,0,0,0.1)',
                backgroundColor: selectedCategory === cat.key
                  ? (isDark ? 'rgba(232,118,46,0.2)' : 'rgba(232,118,46,0.1)')
                  : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'),
                color: selectedCategory === cat.key ? '#e8762e' : (isDark ? '#ccc' : '#555'),
                cursor: 'pointer',
                textAlign: 'center' as const,
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-press-start)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '4px' }}>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image Upload */}
      {selectedCategory && (
        <div style={cardStyle}>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {!imagePreview ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="nes-btn is-primary w-full"
              style={{ fontSize: 'var(--text-sm)' }}
            >
              📸 Subir Captura
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {/* Preview */}
              <div style={{
                width: '100%',
                maxWidth: '300px',
                border: '3px solid #e8762e',
                borderRadius: '12px',
                overflow: 'hidden',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" style={{ width: '100%', display: 'block' }} />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleEvaluate}
                  disabled={loading}
                  className={`nes-btn is-success flex-1`}
                  style={{ fontSize: 'var(--text-xs)', opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? '⏳ Evaluando...' : '✅ Evaluar'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="nes-btn is-error flex-1"
                  style={{ fontSize: 'var(--text-xs)' }}
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          )}

          {error && (
            <p style={{ color: '#e53935', fontSize: 'var(--text-xs)', textAlign: 'center', marginTop: '8px' }}>
              {error}
            </p>
          )}
        </div>
      )}

      {/* Training History */}
      {trainingData.history.length > 0 && (
        <div style={cardStyle}>
          <h4 style={{ fontFamily: 'var(--font-press-start)', fontSize: 'var(--text-xs)', marginBottom: '8px', color: isDark ? '#fdf6e3' : '#2d2d2d' }}>
            📜 Historial
          </h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {trainingData.history.slice().reverse().slice(0, 10).map((entry, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 0',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                fontSize: 'var(--text-xs)',
              }}>
                <span>{CATEGORIES.find(c => c.key === entry.category)?.emoji} {entry.score}/100</span>
                <span style={{ color: isDark ? '#888' : '#aaa' }}>
                  {new Date(entry.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Helper to show training info in main screen ── */
export function TrainingBadge() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const data = typeof window !== 'undefined' ? loadTraining() : { totalPoints: 0, history: [] }
  const stage = getStage(data.totalPoints)

  if (data.totalPoints === 0) return null

  return (
    <span style={{
      fontSize: 'var(--text-xs)',
      color: isDark ? '#e8762e' : '#c26020',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    }}>
      {stage.emoji} {data.totalPoints} pts
    </span>
  )
}
