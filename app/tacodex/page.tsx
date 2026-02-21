'use client'

import { useState, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useTheme } from 'next-themes'
import { useTacodex } from '@/hooks/use-tacodex'
import { useTacomon } from '@/hooks/use-tacomon'
import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { COLLECTIBLE_LOG_ABI, COLLECTIBLE_LOG_ADDRESS, MONAD_TESTNET } from '@/lib/contract'
import Link from 'next/link'
import Image from 'next/image'

function TacoForm({ onSubmit, isUploading }: { onSubmit: (data: { name: string; taqueria: string; location: string; imageUrl: string }) => void; isUploading: boolean }) {
  const [name, setName] = useState('')
  const [taqueria, setTaqueria] = useState('')
  const [location, setLocation] = useState('')
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [preview, setPreview] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const { user } = usePrivy()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const wallet = user?.wallet?.address || 'anonymous'
      const fd = new FormData()
      fd.append('file', file)
      fd.append('wallet', wallet)
      const res = await fetch('/api/upload-taco', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setImageUrl(data.url)
    } catch (err) {
      console.error('Upload failed:', err)
    }
    setUploading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !taqueria) return
    onSubmit({ name, taqueria, location, imageUrl })
    setName(''); setTaqueria(''); setLocation(''); setImageUrl(''); setPreview('')
  }

  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const cardBorder = isDark ? '2px solid rgba(255,255,255,0.1)' : '2px solid rgba(0,0,0,0.1)'
  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: cardBorder,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)',
    color: isDark ? '#fdf6e3' : '#2d2d2d',
    fontFamily: 'var(--font-press-start)',
    fontSize: 'var(--text-xs)',
  }

  return (
    <form onSubmit={handleSubmit} style={{ backgroundColor: cardBg, border: cardBorder, borderRadius: '16px', padding: '16px' }}>
      <h3 style={{ fontFamily: 'var(--font-press-start)', fontSize: 'var(--text-sm)', color: '#f9a825', marginBottom: '12px' }}>
        🌮 Log a Taco
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input placeholder="Taco name (e.g. Al Pastor)" value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
        <input placeholder="Taquería name" value={taqueria} onChange={e => setTaqueria(e.target.value)} style={inputStyle} required />
        <input placeholder="Location (optional)" value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" onClick={() => fileRef.current?.click()} style={{
            ...inputStyle, cursor: 'pointer', textAlign: 'center' as const,
            backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          }}>
            {uploading ? '⏳ Uploading...' : preview ? '✅ Photo ready' : '📸 Add Photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
          {preview && (
            <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', border: cardBorder, flexShrink: 0 }}>
              <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        <button type="submit" disabled={!name || !taqueria || isUploading || uploading} style={{
          fontFamily: 'var(--font-press-start)',
          fontSize: 'var(--text-xs)',
          padding: '10px',
          borderRadius: '10px',
          border: 'none',
          backgroundColor: '#d4520a',
          color: 'white',
          cursor: 'pointer',
          opacity: (!name || !taqueria || isUploading || uploading) ? 0.5 : 1,
        }}>
          🌮 ¡Registrar Taco!
        </button>
      </div>
    </form>
  )
}

function TacoCard({ entry, onMint, minting }: { entry: any; onMint: () => void; minting: boolean }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const cardBorder = isDark ? '2px solid rgba(255,255,255,0.1)' : '2px solid rgba(0,0,0,0.1)'

  return (
    <div style={{ backgroundColor: cardBg, border: cardBorder, borderRadius: '12px', overflow: 'hidden' }}>
      {entry.imageUrl && (
        <div style={{ width: '100%', aspectRatio: '1', position: 'relative', backgroundColor: isDark ? '#2d1b00' : '#f5e6c8' }}>
          <img src={entry.imageUrl} alt={entry.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ padding: '10px' }}>
        <p style={{ fontFamily: 'var(--font-press-start)', fontSize: 'var(--text-xs)', color: '#f9a825', marginBottom: 4 }}>
          🌮 {entry.name}
        </p>
        <p style={{ fontSize: '0.7rem', color: isDark ? '#b8a080' : '#7a6140', marginBottom: 2 }}>
          📍 {entry.taqueria}
        </p>
        <p style={{ fontSize: '0.65rem', color: isDark ? '#8a7060' : '#9a8a70' }}>
          {new Date(entry.timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
        {entry.minted ? (
          <div style={{ marginTop: 6, fontFamily: 'var(--font-press-start)', fontSize: '0.55rem', color: '#4caf50' }}>
            ✅ Minted #{entry.tokenId}
          </div>
        ) : (
          <button onClick={onMint} disabled={minting} style={{
            marginTop: 6,
            fontFamily: 'var(--font-press-start)',
            fontSize: '0.55rem',
            padding: '6px 10px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#e8762e',
            color: 'white',
            cursor: minting ? 'wait' : 'pointer',
            opacity: minting ? 0.5 : 1,
            width: '100%',
          }}>
            {minting ? '⏳...' : '⛓️ Mint NFT'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function TacodexPage() {
  const { ready, authenticated, login, user } = usePrivy()
  const walletAddress = user?.wallet?.address
  const { entries, stats, isLoaded, addEntry, markMinted } = useTacodex(walletAddress)
  const { tacomon, updateStats } = useTacomon()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [feedback, setFeedback] = useState('')
  const [mintingId, setMintingId] = useState<string | null>(null)

  const handleLogTaco = (data: { name: string; taqueria: string; location: string; imageUrl: string }) => {
    addEntry({ ...data, timestamp: Date.now() })
    
    // Boost Tacomon stats
    if (tacomon) {
      updateStats('happiness', 5)
      updateStats('energy', 2)
      updateStats('hunger', 2)
    }
    
    setFeedback('🌮 ¡Tu Tacomon se alimentó con un taco real!')
    setTimeout(() => setFeedback(''), 3000)
  }

  const handleMint = async (entry: any) => {
    if (!walletAddress) {
      login()
      return
    }

    setMintingId(entry.id)
    try {
      // Request wallet from Privy
      const provider = await (window as any).ethereum
      if (!provider) {
        alert('No wallet found. Please connect a wallet.')
        setMintingId(null)
        return
      }

      const walletClient = createWalletClient({
        chain: {
          id: MONAD_TESTNET.id,
          name: MONAD_TESTNET.name,
          nativeCurrency: MONAD_TESTNET.nativeCurrency,
          rpcUrls: MONAD_TESTNET.rpcUrls,
        },
        transport: custom(provider),
      })

      const [account] = await walletClient.requestAddresses()

      // Switch to Monad testnet
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${MONAD_TESTNET.id.toString(16)}` }],
        })
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${MONAD_TESTNET.id.toString(16)}`,
              chainName: MONAD_TESTNET.name,
              nativeCurrency: MONAD_TESTNET.nativeCurrency,
              rpcUrls: [MONAD_TESTNET.rpcUrls.default.http[0]],
            }],
          })
        }
      }

      const hash = await walletClient.writeContract({
        address: COLLECTIBLE_LOG_ADDRESS,
        abi: COLLECTIBLE_LOG_ABI,
        functionName: 'mint',
        args: [entry.name, `${entry.taqueria} - ${entry.location}`, entry.imageUrl || ''],
        account,
      })

      // Wait for receipt
      const publicClient = createPublicClient({
        chain: {
          id: MONAD_TESTNET.id,
          name: MONAD_TESTNET.name,
          nativeCurrency: MONAD_TESTNET.nativeCurrency,
          rpcUrls: MONAD_TESTNET.rpcUrls,
        },
        transport: http(MONAD_TESTNET.rpcUrls.default.http[0]),
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      // Get token ID from logs
      const tokenId = receipt.logs[0]?.topics[3] ? parseInt(receipt.logs[0].topics[3] as string, 16) : 0
      markMinted(entry.id, tokenId)
      setFeedback(`✅ ¡Taco "${entry.name}" minted como NFT #${tokenId}!`)
      setTimeout(() => setFeedback(''), 4000)
    } catch (err: any) {
      console.error('Mint failed:', err)
      alert('Mint failed: ' + (err.shortMessage || err.message))
    }
    setMintingId(null)
  }

  if (!ready || !isLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
        <p style={{ fontFamily: 'var(--font-press-start)', fontSize: 'var(--text-sm)', color: '#f9a825' }}>🌮 Loading...</p>
      </div>
    )
  }

  const textColor = isDark ? '#fdf6e3' : '#2d2d2d'
  const mutedColor = isDark ? '#b8a080' : '#7a6140'
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const cardBorder = isDark ? '2px solid rgba(255,255,255,0.1)' : '2px solid rgba(0,0,0,0.1)'

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      color: textColor,
      padding: '16px',
      maxWidth: '600px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-press-start)', fontSize: 'var(--text-xs)', color: mutedColor, textDecoration: 'none' }}>
          ← Tacomon
        </Link>
        {!authenticated && (
          <button onClick={login} style={{
            fontFamily: 'var(--font-press-start)',
            fontSize: '0.6rem',
            padding: '6px 12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#d4520a',
            color: 'white',
            cursor: 'pointer',
          }}>
            🔐 Login
          </button>
        )}
      </div>

      <h1 style={{ fontFamily: 'var(--font-press-start)', fontSize: 'var(--text-lg)', color: '#f9a825', textAlign: 'center', marginBottom: '16px' }}>
        🌮 Tacodex
      </h1>

      {/* Feedback */}
      {feedback && (
        <div style={{
          backgroundColor: '#4caf5022',
          border: '2px solid #4caf50',
          borderRadius: '12px',
          padding: '10px',
          marginBottom: '12px',
          textAlign: 'center',
          fontFamily: 'var(--font-press-start)',
          fontSize: 'var(--text-xs)',
          color: '#4caf50',
          animation: 'pulse 0.5s ease-in-out',
        }}>
          {feedback}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'Tacos', value: stats.totalTacos, emoji: '🌮' },
          { label: 'Taquerías', value: stats.uniqueTaquerias, emoji: '📍' },
          { label: 'Racha', value: `${stats.streak}d`, emoji: '🔥' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: cardBg, border: cardBorder, borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem' }}>{s.emoji}</div>
            <div style={{ fontFamily: 'var(--font-press-start)', fontSize: 'var(--text-sm)', color: '#f9a825' }}>{s.value}</div>
            <div style={{ fontSize: '0.6rem', color: mutedColor, fontFamily: 'var(--font-press-start)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Log Form */}
      <TacoForm onSubmit={handleLogTaco} isUploading={false} />

      {/* Collection */}
      {entries.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-press-start)', fontSize: 'var(--text-sm)', color: '#f9a825', marginBottom: '12px' }}>
            📖 Mi Colección ({entries.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {entries.map(entry => (
              <TacoCard
                key={entry.id}
                entry={entry}
                onMint={() => handleMint(entry)}
                minting={mintingId === entry.id}
              />
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '40px', color: mutedColor }}>
          <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🌮</p>
          <p style={{ fontFamily: 'var(--font-press-start)', fontSize: 'var(--text-xs)' }}>
            ¡Registra tu primer taco!
          </p>
        </div>
      )}
    </div>
  )
}
