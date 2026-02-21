'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useSalsa } from '@/hooks/use-salsa'
import { useHubSync } from '@/hooks/use-hub-sync'
import { SPECIALTY_CONFIG } from '@/lib/tacomon-types'
import type { Specialty } from '@/lib/tacomon-types'

const HUB_URL = 'https://regenmon-final.vercel.app'

function emojiToTwemojiUrl(emoji: string): string {
  const codepoints = [...emoji]
    .map(c => c.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join('-')
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${codepoints}.png`
}

interface ActivityItem {
  type: string
  fromName?: string
  amount?: number
  message?: string
  timestamp: string
}

interface RegisterHubProps {
  onBack: () => void
}

export function RegisterHub({ onBack }: RegisterHubProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const router = useRouter()
  const { balance } = useSalsa()
  const { syncNow } = useHubSync()

  const [isRegistered, setIsRegistered] = useState(false)
  const [hubId, setHubId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [activityLoading, setActivityLoading] = useState(false)

  // Auto-detect data
  const [tacomonName, setTacomonName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [spriteUrl, setSpriteUrl] = useState('')
  const [specialty, setSpecialty] = useState<string>('')

  useEffect(() => {
    const registered = localStorage.getItem('isRegisteredInHub') === 'true'
    const savedHubId = localStorage.getItem('hubRegenmonId')
    setIsRegistered(registered)
    setHubId(savedHubId)

    try {
      const raw = localStorage.getItem('tacomon-data')
      if (raw) {
        const data = JSON.parse(raw)
        setTacomonName(data.name || 'Tacomon')
        setOwnerName(data.name || 'Taquero')
        const spec = data.specialty as Specialty
        setSpecialty(spec || '')
        if (spec && SPECIALTY_CONFIG[spec]) {
          setSpriteUrl(emojiToTwemojiUrl(SPECIALTY_CONFIG[spec].emoji))
        } else {
          setSpriteUrl(emojiToTwemojiUrl('🌮'))
        }
      }
    } catch { /* */ }

    if (registered && savedHubId) {
      loadActivity(savedHubId)
    }
  }, [])

  const loadActivity = async (id: string) => {
    setActivityLoading(true)
    try {
      const res = await fetch(`${HUB_URL}/api/regenmon/${id}/activity?limit=10`)
      if (res.ok) {
        const data = await res.json()
        setActivity(data.activities || data || [])
      }
    } catch { /* silent */ }
    setActivityLoading(false)
  }

  const handleRegister = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

    const payload = {
      name: tacomonName,
      ownerName,
      spriteUrl,
      appUrl,
      email: email || undefined,
      stats: (() => {
        try {
          const raw = localStorage.getItem('tacomon-data')
          if (raw) {
            const d = JSON.parse(raw)
            return { happiness: d.happiness, energy: d.energy, hunger: d.hunger }
          }
        } catch { /* */ }
        return { happiness: 50, energy: 50, hunger: 50 }
      })(),
      balance,
    }

    try {
      let res = await fetch(`${HUB_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        // retry once
        await new Promise(r => setTimeout(r, 2000))
        res = await fetch(`${HUB_URL}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        setError('El HUB está descansando, intenta después 🌮')
        setLoading(false)
        return
      }

      const data = await res.json()

      if (data.alreadyRegistered) {
        const id = data.regenmonId || data.id
        localStorage.setItem('hubRegenmonId', id)
        localStorage.setItem('isRegisteredInHub', 'true')
        setHubId(id)
        setIsRegistered(true)
        setSuccess('¡Ya estabas registrado! Bienvenido de vuelta 🌮')
        syncNow()
        loadActivity(id)
      } else {
        const id = data.regenmonId || data.id
        localStorage.setItem('hubRegenmonId', id)
        localStorage.setItem('isRegisteredInHub', 'true')
        setHubId(id)
        setIsRegistered(true)
        setSuccess('¡Registro exitoso! Tu Tacomon está en el HUB 🎉')
        syncNow()
        loadActivity(id)
      }
    } catch {
      setError('El HUB está descansando, intenta después 🌮')
    }
    setLoading(false)
  }, [tacomonName, ownerName, spriteUrl, email, balance, syncNow])

  const cardStyle = {
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    border: isDark ? '2px solid rgba(255,255,255,0.1)' : '2px solid rgba(0,0,0,0.1)',
    borderRadius: '12px',
    padding: '16px',
  }

  const activityEmoji: Record<string, string> = {
    feed_received: '🍎',
    gift_received: '🎁',
    message_received: '💬',
  }

  const activityLabel: Record<string, string> = {
    feed_received: 'te alimentó',
    gift_received: 'te envió un regalo',
    message_received: 'te dejó un mensaje',
  }

  function relativeTime(ts: string) {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `hace ${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `hace ${hrs}h`
    const days = Math.floor(hrs / 24)
    return `hace ${days}d`
  }

  // POST-REGISTRATION VIEW
  if (isRegistered && hubId) {
    return (
      <div className="flex flex-col gap-4 w-full animate-slide-up">
        {/* Back button */}
        <button
          onClick={onBack}
          className="nes-btn"
          style={{ fontSize: 'var(--text-xs)', padding: '6px 12px', alignSelf: 'flex-start' }}
        >
          ← Volver
        </button>

        {/* HUB Member badge */}
        <div style={cardStyle} className="text-center">
          <span className="nes-badge" style={{ display: 'inline-block' }}>
            <span className="is-success" style={{ fontSize: 'var(--text-xs)' }}>🌐 HUB MEMBER</span>
          </span>
          <p style={{ fontSize: 'var(--text-xs)', color: isDark ? '#b8a080' : '#666', marginTop: '8px' }}>
            Tu Tacomon está conectado al mundo
          </p>
        </div>

        {success && (
          <div style={{ ...cardStyle, borderColor: '#4caf50', textAlign: 'center' as const }}>
            <p style={{ fontSize: 'var(--text-xs)', color: '#4caf50' }}>{success}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => router.push('/leaderboard')}
            className="nes-btn is-primary"
            style={{
              fontSize: 'var(--text-xs)',
              padding: '10px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '1.2em' }}>🏆</span>
            <span>Leaderboard</span>
          </button>
          <button
            onClick={() => router.push(`/regenmon/${hubId}`)}
            className="nes-btn is-success"
            style={{
              fontSize: 'var(--text-xs)',
              padding: '10px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '1.2em' }}>👤</span>
            <span>Mi Perfil</span>
          </button>
          <button
            onClick={() => router.push('/tacodex')}
            className="nes-btn is-warning"
            style={{
              fontSize: 'var(--text-xs)',
              padding: '10px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '1.2em' }}>🌮</span>
            <span>Tacodex</span>
          </button>
        </div>

        {/* Activity Feed */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-press-start)', marginBottom: '12px', color: isDark ? '#fdf6e3' : '#2d2d2d' }}>
            📬 Actividad reciente
          </h3>
          {activityLoading ? (
            <p style={{ fontSize: 'var(--text-xs)', color: '#b8a080' }}>Cargando...</p>
          ) : activity.length === 0 ? (
            <p style={{ fontSize: 'var(--text-xs)', color: '#b8a080' }}>
              Sin actividad aún. ¡Comparte tu perfil para recibir visitas! 🌮
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {activity.map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px',
                    borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <span>{activityEmoji[item.type] || '📌'} </span>
                  <span style={{ color: '#f97316' }}>{item.fromName || 'Alguien'}</span>
                  <span style={{ color: isDark ? '#b8a080' : '#666' }}>
                    {' '}{activityLabel[item.type] || item.type}
                    {item.amount ? ` (${item.amount} 🍅)` : ''}
                  </span>
                  <span style={{ color: '#7a6140', float: 'right' }}>{relativeTime(item.timestamp)}</span>
                  {item.message && (
                    <p style={{ color: isDark ? '#ddd' : '#444', marginTop: '4px', fontStyle: 'italic' }}>
                      &quot;{item.message}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // REGISTRATION VIEW
  return (
    <div className="flex flex-col gap-4 w-full animate-slide-up">
      <button
        onClick={onBack}
        className="nes-btn"
        style={{ fontSize: 'var(--text-xs)', padding: '6px 12px', alignSelf: 'flex-start' }}
      >
        ← Volver
      </button>

      <div style={cardStyle} className="text-center">
        <h3 style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-press-start)', color: '#2196F3', marginBottom: '8px' }}>
          🌐 Conectar al HUB
        </h3>
        <p style={{ fontSize: 'var(--text-xs)', color: isDark ? '#b8a080' : '#666' }}>
          Registra tu Tacomon en el HUB global para competir, socializar y más
        </p>
      </div>

      {/* Preview */}
      <div style={cardStyle}>
        <h4 style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-press-start)', marginBottom: '12px', color: isDark ? '#fdf6e3' : '#2d2d2d' }}>
          Vista previa
        </h4>
        <div className="flex items-center gap-3">
          {spriteUrl && (
            <img src={spriteUrl} alt="sprite" width={48} height={48} style={{ imageRendering: 'pixelated' }} />
          )}
          <div>
            <p style={{ fontSize: 'var(--text-sm)', color: '#f97316', fontWeight: 700 }}>{tacomonName}</p>
            <p style={{ fontSize: 'var(--text-xs)', color: isDark ? '#b8a080' : '#666' }}>
              Dueño: {ownerName}
            </p>
            {specialty && (
              <p style={{ fontSize: 'var(--text-xs)', color: isDark ? '#b8a080' : '#666' }}>
                {SPECIALTY_CONFIG[specialty as Specialty]?.label || specialty}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Email (optional) */}
      <div style={cardStyle}>
        <label style={{ fontSize: 'var(--text-xs)', color: isDark ? '#b8a080' : '#666', display: 'block', marginBottom: '8px' }}>
          📧 Email (opcional)
        </label>
        <input
          type="email"
          className="nes-input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.com"
          style={{ fontSize: 'var(--text-xs)', width: '100%' }}
        />
      </div>

      {error && (
        <div style={{ ...cardStyle, borderColor: '#e53935', textAlign: 'center' as const }}>
          <p style={{ fontSize: 'var(--text-xs)', color: '#e53935' }}>{error}</p>
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={loading}
        className={`nes-btn ${loading ? 'is-disabled' : 'is-primary'}`}
        style={{
          fontSize: 'var(--text-xs)',
          padding: '12px',
          width: '100%',
          opacity: loading ? 0.5 : 1,
        }}
      >
        {loading ? '⏳ Registrando...' : '🌐 Registrar en el HUB'}
      </button>
    </div>
  )
}
