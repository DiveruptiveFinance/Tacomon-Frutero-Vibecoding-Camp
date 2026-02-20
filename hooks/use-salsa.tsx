'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { usePrivy } from '@privy-io/react-auth'

export interface SalsaHistoryEntry {
  type: 'earn' | 'spend'
  amount: number
  reason: string
  timestamp: string
}

interface SalsaContextType {
  balance: number
  streak: number
  history: SalsaHistoryEntry[]
  addSalsa: (amount: number, reason?: string) => void
  deductSalsa: (amount: number, reason?: string) => boolean
  earnFromChat: () => number
}

const SalsaContext = createContext<SalsaContextType>({
  balance: 0,
  streak: 0,
  history: [],
  addSalsa: () => {},
  deductSalsa: () => false,
  earnFromChat: () => 0,
})

const SALSA_STORAGE_KEY = 'tacomon-salsa'
const HISTORY_STORAGE_KEY = 'tacomon-salsa-history'
const STREAK_STORAGE_KEY = 'tacomon-salsa-streak'
const INITIAL_BALANCE = 100
const MAX_HISTORY = 50

function getKey(base: string, userId: string | null) {
  return userId ? `${base}-${userId}` : base
}

export function SalsaProvider({ children }: { children: ReactNode }) {
  const { user, authenticated } = usePrivy()
  const [balance, setBalance] = useState(INITIAL_BALANCE)
  const [history, setHistory] = useState<SalsaHistoryEntry[]>([])
  const [streak, setStreak] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const userId = authenticated && user ? user.id : null

  // Load all data
  useEffect(() => {
    try {
      const balKey = getKey(SALSA_STORAGE_KEY, userId)
      const histKey = getKey(HISTORY_STORAGE_KEY, userId)
      const streakKey = getKey(STREAK_STORAGE_KEY, userId)

      const savedBal = localStorage.getItem(balKey)
      const savedHist = localStorage.getItem(histKey)
      const savedStreak = localStorage.getItem(streakKey)

      setBalance(savedBal !== null ? Number(savedBal) : INITIAL_BALANCE)
      setHistory(savedHist ? JSON.parse(savedHist) : [])
      setStreak(savedStreak ? Number(savedStreak) : 0)
    } catch {
      setBalance(INITIAL_BALANCE)
      setHistory([])
      setStreak(0)
    }
    setLoaded(true)
  }, [userId])

  // Persist
  useEffect(() => {
    if (!loaded) return
    const balKey = getKey(SALSA_STORAGE_KEY, userId)
    const histKey = getKey(HISTORY_STORAGE_KEY, userId)
    const streakKey = getKey(STREAK_STORAGE_KEY, userId)
    localStorage.setItem(balKey, String(balance))
    localStorage.setItem(histKey, JSON.stringify(history.slice(-MAX_HISTORY)))
    localStorage.setItem(streakKey, String(streak))
  }, [balance, history, streak, loaded, userId])

  const pushHistory = useCallback((entry: SalsaHistoryEntry) => {
    setHistory(prev => [...prev, entry].slice(-MAX_HISTORY))
  }, [])

  const addSalsa = useCallback((amount: number, reason = 'Ganancia') => {
    setBalance(prev => prev + amount)
    pushHistory({ type: 'earn', amount, reason, timestamp: new Date().toISOString() })
  }, [pushHistory])

  const deductSalsa = useCallback((amount: number, reason = 'Gasto'): boolean => {
    let success = false
    setBalance(prev => {
      if (prev >= amount) {
        success = true
        return prev - amount
      }
      return prev
    })
    if (success) {
      pushHistory({ type: 'spend', amount, reason, timestamp: new Date().toISOString() })
    }
    return success
  }, [pushHistory])

  const earnFromChat = useCallback((): number => {
    const baseAmount = Math.floor(Math.random() * 4) + 2 // 2-5
    let earned = 0

    setBalance(prev => {
      if (prev > 100) {
        if (Math.random() < 0.2) {
          earned = baseAmount
          return prev + baseAmount
        }
        earned = 0
        return prev
      }
      earned = baseAmount
      return prev + baseAmount
    })

    if (earned > 0) {
      setStreak(prev => prev + 1)
      pushHistory({ type: 'earn', amount: earned, reason: 'Chat con Tacomon', timestamp: new Date().toISOString() })
    }

    return earned
  }, [pushHistory])

  return (
    <SalsaContext.Provider value={{ balance, streak, history, addSalsa, deductSalsa, earnFromChat }}>
      {children}
    </SalsaContext.Provider>
  )
}

export function useSalsa() {
  return useContext(SalsaContext)
}
