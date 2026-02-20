'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { useRouter, useParams } from 'next/navigation'
import { useSalsa } from '@/hooks/use-salsa'

const HUB_URL = 'https://regenmon-final.vercel.app'

interface RegenmonProfile {
  id: string
  name: string
  ownerName: string
  spriteUrl: string
  stage?: string
  stats: { happiness: number; energy: number; hunger: number }
  totalPoints: number
  balance: number
  visits?: number
  registeredAt?: string
}

interface Message {
  id?: string
  fromName: string
  message: string
  timestamp: string
}

function relativeTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

export default function RegenmonProfilePage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { balance, deductSalsa } = useSalsa()

  const [profile, setProfile] = useState<RegenmonProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMyProfile, setIsMyProfile] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  // Social states
  const [feedLoading, setFeedLoading] = useState(false)
  const [feedSuccess, setFeedSuccess] = useState(false)
  const [giftLoading, setGiftLoading] = useState<number | null>(null)
  const [giftSuccess, setGiftSuccess] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [msgLoading, setMsgLoading] = useState(false)
  const [socialError, setSocialError] = useState<string | null>(null)

  useEffect(() => {
    const myHubId = localStorage.getItem('hubRegenmonId')
    setIsMyProfile(myHubId === id)
    setIsRegistered(localStorage.getItem('isRegisteredInHub') === 'true')
    fetchProfile()
    fetchMessages()
  }, [id])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      let res = await fetch(`${HUB_URL}/api/regenmon/${id}`)
      if (!res.ok) {
        await new Promise(r => setTimeout(r, 2000))
        res = await fetch(`${HUB_URL}/api/regenmon/${id}`)
      }
      if (!res.ok) { setError('No se encontró este Tacomon 🌮'); setLoading(false); return }
      const data = await res.json()
      setProfile(data)
    } catch { setError('El HUB está descansando, intenta después 🌮') }
    setLoading(false)
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${HUB_URL}/api/regenmon/${id}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(Array.isArray(data) ? data : data.messages || [])
      }
    } catch { /* silent */ }
  }

  const handleFeed = useCallback(async () => {
    if (balance < 10) { setSocialError('Necesitas al menos 10 🍅 $SALSA'); return }
    setFeedLoading(true)
    setSocialError(null)
    try {
      const myHubId = localStorage.getItem('hubRegenmonId')
      const res = await fetch(`${HUB_URL}/api/regenmon/${id}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId: myHubId }),
      })
      if (res.ok) {
        deductSalsa(10, `Alimentar a ${profile?.name || 'Tacomon'}`)
        setFeedSuccess(true)
        setTimeout(() => setFeedSuccess(false), 3000)
      } else { setSocialError('No se pudo alimentar, intenta después 🌮') }
    } catch { setSocialError('El HUB está descansando 🌮') }
    setFeedLoading(false)
  }, [balance, id, profile, deductSalsa])

  const handleGift = useCallback(async (amount: number) => {
    if (balance < amount) { setSocialError(`Necesitas al menos ${amount} 🍅 $SALSA`); return }
    setGiftLoading(amount)
    setSocialError(null)
    try {
      const myHubId = localStorage.getItem('hubRegenmonId')
      const res = await fetch(`${HUB_URL}/api/regenmon/${id}/gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId: myHubId, amount }),
      })
      if (res.ok) {
        deductSalsa(amount, `Regalo a ${profile?.name || 'Tacomon'}`)
        setGiftSuccess(`¡Enviaste ${amount} 🍅 $SALSA!`)
        setTimeout(() => setGiftSuccess(null), 3000)
      } else { setSocialError('No se pudo enviar el regalo 🌮') }
    } catch { setSocialError('El HUB está descansando 🌮') }
    setGiftLoading(null)
  }, [balance, id, profile, deductSalsa])

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim()) return
    setMsgLoading(true)
    setSocialError(null)
    try {
      const myHubId = localStorage.getItem('hubRegenmonId')
      const res = await fetch(`${HUB_URL}/api/regenmon/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId: myHubId, message: newMessage.slice(0, 140) }),
      })
      if (res.ok) {
        setNewMessage('')
        fetchMessages()
      } else { setSocialError('No se pudo enviar el mensaje 🌮') }
    } catch { setSocialError('El HUB está descansando 🌮') }
    setMsgLoading(false)
  }, [newMessage, id])

  const cardStyle = {
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    border: isDark ? '2px solid rgba(255,255,255,0.1)' : '2px solid rgba(0,0,0,0.1)',
    borderRadius: '12px',
    padding: '16px',
  }

  const statColors: Record<string, string> = { happiness: '#4caf50', energy: '#f9a825', hunger: '#e53935' }
  const statLabels: Record<string, string> = { happiness: '💚 Felicidad', energy: '⚡ Energía', hunger: '🍎 Saciedad' }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <p style={{ fontSize: 'var(--text-sm)', color: '#b8a080' }}>⏳ Cargando perfil...</p>
      </main>
    )
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--background)' }}>
        <p style={{ fontSize: 'var(--text-sm)', color: '#e53935' }}>{error || 'Tacomon no encontrado'}</p>
        <button onClick={() => router.push('/')} className="nes-btn" style={{ fontSize: 'var(--text-xs)' }}>← Volver</button>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-3 md:px-6 py-2"
        style={{ backgroundColor: 'var(--card)', borderBottom: '4px solid var(--border)' }}
      >
        <button onClick={() => router.back()} className="nes-btn" style={{ fontSize: '10px', padding: '2px 8px' }}>
          ← Volver
        </button>
        <h1 style={{ fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>👤 Perfil</h1>
        <div />
      </header>

      <div className="flex-1 px-3 py-4 max-w-2xl mx-auto w-full flex flex-col gap-4">
        {/* Profile card */}
        <div style={cardStyle} className="text-center">
          {profile.spriteUrl && (
            <img
              src={profile.spriteUrl}
              alt={profile.name}
              width={96}
              height={96}
              style={{ imageRendering: 'pixelated', margin: '0 auto 12px' }}
            />
          )}
          <h2 style={{ fontSize: 'var(--text-lg)', color: '#f97316', fontFamily: 'var(--font-press-start)' }}>
            {profile.name}
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: isDark ? '#b8a080' : '#666', marginTop: '4px' }}>
            Dueño: {profile.ownerName}
            {profile.stage && ` • ${profile.stage}`}
          </p>
          {isMyProfile && (
            <span className="nes-badge" style={{ display: 'inline-block', marginTop: '8px' }}>
              <span className="is-primary" style={{ fontSize: '10px' }}>TÚ</span>
            </span>
          )}
        </div>

        {/* Stats */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-press-start)', marginBottom: '12px', color: isDark ? '#fdf6e3' : '#2d2d2d' }}>
            📊 Stats
          </h3>
          {Object.entries(profile.stats || {}).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '8px' }}>
              <div className="flex justify-between" style={{ fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                <span style={{ color: isDark ? '#fdf6e3' : '#2d2d2d' }}>{statLabels[key] || key}</span>
                <span style={{ color: statColors[key] || '#999' }}>{value}/100</span>
              </div>
              <div style={{
                width: '100%',
                height: '12px',
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                borderRadius: '6px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.min(100, Math.max(0, value as number))}%`,
                  height: '100%',
                  backgroundColor: statColors[key] || '#999',
                  borderRadius: '6px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Points & info */}
        <div style={cardStyle} className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p style={{ fontSize: 'var(--text-xs)', color: isDark ? '#b8a080' : '#666' }}>Puntos</p>
            <p style={{ fontSize: 'var(--text-sm)', color: '#e8762e', fontWeight: 700 }}>{profile.totalPoints}</p>
          </div>
          <div className="text-center">
            <p style={{ fontSize: 'var(--text-xs)', color: isDark ? '#b8a080' : '#666' }}>$SALSA</p>
            <p style={{ fontSize: 'var(--text-sm)', color: '#f9a825', fontWeight: 700 }}>{profile.balance} 🍅</p>
          </div>
          {profile.visits !== undefined && (
            <div className="text-center">
              <p style={{ fontSize: 'var(--text-xs)', color: isDark ? '#b8a080' : '#666' }}>Visitas</p>
              <p style={{ fontSize: 'var(--text-sm)', color: isDark ? '#fdf6e3' : '#2d2d2d' }}>{profile.visits}</p>
            </div>
          )}
          {profile.registeredAt && (
            <div className="text-center">
              <p style={{ fontSize: 'var(--text-xs)', color: isDark ? '#b8a080' : '#666' }}>Registro</p>
              <p style={{ fontSize: 'var(--text-sm)', color: isDark ? '#fdf6e3' : '#2d2d2d' }}>
                {new Date(profile.registeredAt).toLocaleDateString('es-MX')}
              </p>
            </div>
          )}
        </div>

        {/* Social interactions (other profiles only) */}
        {!isMyProfile && isRegistered && (
          <>
            {socialError && (
              <div style={{ ...cardStyle, borderColor: '#e53935', textAlign: 'center' as const }}>
                <p style={{ fontSize: 'var(--text-xs)', color: '#e53935' }}>{socialError}</p>
              </div>
            )}

            {feedSuccess && (
              <div style={{ ...cardStyle, borderColor: '#4caf50', textAlign: 'center' as const }}>
                <p style={{ fontSize: 'var(--text-xs)', color: '#4caf50' }}>🍎 ¡Le diste de comer! +1 felicidad para {profile.name}</p>
              </div>
            )}

            {giftSuccess && (
              <div style={{ ...cardStyle, borderColor: '#4caf50', textAlign: 'center' as const }}>
                <p style={{ fontSize: 'var(--text-xs)', color: '#4caf50' }}>{giftSuccess}</p>
              </div>
            )}

            {/* Feed button */}
            <button
              onClick={handleFeed}
              disabled={feedLoading || balance < 10}
              className={`nes-btn ${feedLoading || balance < 10 ? 'is-disabled' : 'is-success'}`}
              style={{
                fontSize: 'var(--text-xs)',
                padding: '12px',
                width: '100%',
                opacity: feedLoading || balance < 10 ? 0.5 : 1,
              }}
            >
              {feedLoading ? '⏳ Alimentando...' : `🍎 Alimentar (10 🍅 $SALSA)`}
            </button>

            {/* Gift buttons */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-press-start)', marginBottom: '8px', color: isDark ? '#fdf6e3' : '#2d2d2d' }}>
                🎁 Enviar regalo
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 25].map(amount => (
                  <button
                    key={amount}
                    onClick={() => handleGift(amount)}
                    disabled={giftLoading !== null || balance < amount}
                    className={`nes-btn ${giftLoading !== null || balance < amount ? 'is-disabled' : 'is-warning'}`}
                    style={{
                      fontSize: 'var(--text-xs)',
                      padding: '8px 4px',
                      opacity: giftLoading !== null || balance < amount ? 0.5 : 1,
                    }}
                  >
                    {giftLoading === amount ? '⏳' : `${amount} 🍅`}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-press-start)', marginBottom: '8px', color: isDark ? '#fdf6e3' : '#2d2d2d' }}>
                💬 Mensajes
              </h3>
              <div className="flex gap-2 mb-3">
                <textarea
                  className="nes-textarea flex-1"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value.slice(0, 140))}
                  placeholder="Escribe un mensaje..."
                  rows={2}
                  style={{ fontSize: 'var(--text-xs)', resize: 'none' }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={msgLoading || !newMessage.trim()}
                  className={`nes-btn ${msgLoading || !newMessage.trim() ? 'is-disabled' : 'is-primary'}`}
                  style={{ fontSize: 'var(--text-xs)', alignSelf: 'flex-end' }}
                >
                  {msgLoading ? '⏳' : '📤'}
                </button>
              </div>
              <p style={{ fontSize: '10px', color: '#7a6140', textAlign: 'right', marginBottom: '8px' }}>
                {newMessage.length}/140
              </p>
              {messages.length === 0 ? (
                <p style={{ fontSize: 'var(--text-xs)', color: '#b8a080' }}>Sin mensajes aún</p>
              ) : (
                <div className="flex flex-col gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {messages.map((msg, i) => (
                    <div key={msg.id || i} style={{
                      padding: '8px',
                      borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                      fontSize: 'var(--text-xs)',
                    }}>
                      <div className="flex justify-between">
                        <span style={{ color: '#f97316', fontWeight: 700 }}>{msg.fromName}</span>
                        <span style={{ color: '#7a6140' }}>{relativeTime(msg.timestamp)}</span>
                      </div>
                      <p style={{ color: isDark ? '#ddd' : '#444', marginTop: '4px' }}>{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!isMyProfile && !isRegistered && (
          <div style={{ ...cardStyle, textAlign: 'center' as const }}>
            <p style={{ fontSize: 'var(--text-xs)', color: '#b8a080' }}>
              🌐 Regístrate en el HUB para interactuar con este Tacomon
            </p>
            <button
              onClick={() => router.push('/')}
              className="nes-btn is-primary"
              style={{ fontSize: 'var(--text-xs)', marginTop: '8px' }}
            >
              Ir a registrarse
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
