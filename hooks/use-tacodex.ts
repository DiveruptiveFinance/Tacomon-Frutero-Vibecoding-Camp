'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TacoEntry, TacodexStats } from '@/lib/tacodex-types'

const STORAGE_KEY = 'tacodex-entries'

export function useTacodex(walletAddress?: string) {
  const [entries, setEntries] = useState<TacoEntry[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const storageKey = walletAddress ? `${STORAGE_KEY}-${walletAddress.toLowerCase()}` : STORAGE_KEY

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setEntries(JSON.parse(saved))
    } catch { /* ignore */ }
    setIsLoaded(true)
  }, [storageKey])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(storageKey, JSON.stringify(entries))
    }
  }, [entries, isLoaded, storageKey])

  const addEntry = useCallback((entry: Omit<TacoEntry, 'id' | 'minted'>) => {
    const newEntry: TacoEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      minted: false,
    }
    setEntries(prev => [newEntry, ...prev])
    return newEntry
  }, [])

  const markMinted = useCallback((id: string, tokenId: number) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, minted: true, tokenId } : e))
  }, [])

  const stats: TacodexStats = (() => {
    const uniqueTaquerias = new Set(entries.map(e => e.taqueria.toLowerCase())).size
    
    // Calculate streak
    const dates = [...new Set(entries.map(e => {
      const d = new Date(e.timestamp)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }))].sort().reverse()
    
    let streak = 0
    const today = new Date()
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today)
      expected.setDate(expected.getDate() - i)
      const expectedKey = `${expected.getFullYear()}-${expected.getMonth()}-${expected.getDate()}`
      if (dates[i] === expectedKey) streak++
      else break
    }

    return { totalTacos: entries.length, uniqueTaquerias, streak }
  })()

  return { entries, stats, isLoaded, addEntry, markMinted }
}
