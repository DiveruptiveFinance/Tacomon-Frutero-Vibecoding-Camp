'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'

const HUB_URL = 'https://regenmon-final.vercel.app'

interface LeaderboardEntry {
  id: string
  name: string
  ownerName: string
  spriteUrl: string
  stage?: string
  totalPoints: number
  balance: number
}

export default function LeaderboardPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const router = useRouter()

  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchLeaderboard = async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      let res = await fetch(`${HUB_URL}/api/leaderboard?page=${p}&limit=10`)
      if (!res.ok) {
        await new Promise(r => setTimeout(r, 2000))
        res = await fetch(`${HUB_URL}/api/leaderboard?page=${p}&limit=10`)
      }
      if (!res.ok) {
        setError('El HUB está descansando, intenta después 🌮')
        setLoading(false)
        return
      }
      const data = await res.json()
      const list = data.leaderboard || data.entries || data || []
      setEntries(Array.isArray(list) ? list : [])
      setHasMore(Array.isArray(list) && list.length >= 10)
    } catch {
      setError('El HUB está descansando, intenta después 🌮')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLeaderboard(page)
  }, [page])

  const cardStyle = {
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    border: isDark ? '2px solid rgba(255,255,255,0.1)' : '2px solid rgba(0,0,0,0.1)',
    borderRadius: '12px',
    padding: '16px',
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-3 md:px-6 py-2"
        style={{
          backgroundColor: 'var(--card)',
          borderBottom: '4px solid var(--border)',
        }}
      >
        <button onClick={() => router.push('/')} className="nes-btn" style={{ fontSize: '10px', padding: '2px 8px' }}>
          ← Volver
        </button>
        <h1 style={{ fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>🏆 Leaderboard</h1>
        <div />
      </header>

      <div className="flex-1 px-3 py-4 max-w-2xl mx-auto w-full">
        {loading && (
          <div className="text-center" style={{ padding: '40px', fontSize: 'var(--text-sm)', color: '#b8a080' }}>
            ⏳ Cargando...
          </div>
        )}

        {error && (
          <div style={{ ...cardStyle, borderColor: '#e53935', textAlign: 'center' as const, marginBottom: '16px' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: '#e53935' }}>{error}</p>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div style={{ ...cardStyle, textAlign: 'center' as const }}>
            <p style={{ fontSize: 'var(--text-xs)', color: '#b8a080' }}>No hay participantes aún 🌮</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {entries.map((entry, i) => {
            const rank = (page - 1) * 10 + i + 1
            return (
              <div key={entry.id} style={cardStyle} className="flex items-center gap-3">
                <span style={{ fontSize: 'var(--text-base)', minWidth: '30px', textAlign: 'center' }}>
                  {rank <= 3 ? medals[rank - 1] : `#${rank}`}
                </span>
                {entry.spriteUrl && (
                  <img src={entry.spriteUrl} alt="" width={32} height={32} style={{ imageRendering: 'pixelated' }} />
                )}
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 'var(--text-xs)', color: '#f97316', fontWeight: 700 }}>{entry.name}</p>
                  <p style={{ fontSize: '10px', color: isDark ? '#7a6140' : '#999' }}>
                    {entry.ownerName} {entry.stage && `• ${entry.stage}`}
                  </p>
                </div>
                <div className="text-right">
                  <p style={{ fontSize: 'var(--text-xs)', color: '#e8762e', fontWeight: 700 }}>{entry.totalPoints} pts</p>
                  <p style={{ fontSize: '10px', color: '#b8a080' }}>{entry.balance} 🍅 $SALSA</p>
                </div>
                <button
                  onClick={() => router.push(`/regenmon/${entry.id}`)}
                  className="nes-btn is-primary"
                  style={{ fontSize: '10px', padding: '4px 8px' }}
                >
                  Ver
                </button>
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        {(!loading && entries.length > 0) && (
          <div className="flex justify-center gap-3 mt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={`nes-btn ${page <= 1 ? 'is-disabled' : ''}`}
              style={{ fontSize: 'var(--text-xs)', opacity: page <= 1 ? 0.4 : 1 }}
            >
              ← Anterior
            </button>
            <span style={{ fontSize: 'var(--text-xs)', color: isDark ? '#b8a080' : '#666', alignSelf: 'center' }}>
              Pág. {page}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className={`nes-btn ${!hasMore ? 'is-disabled' : ''}`}
              style={{ fontSize: 'var(--text-xs)', opacity: !hasMore ? 0.4 : 1 }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
