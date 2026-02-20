'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { usePrivy } from '@privy-io/react-auth'

interface SalsaContextType {
  balance: number
  addSalsa: (amount: number) => void
  deductSalsa: (amount: number) => boolean
  earnFromChat: () => number
}

const SalsaContext = createContext<SalsaContextType>({
  balance: 0,
  addSalsa: () => {},
  deductSalsa: () => false,
  earnFromChat: () => 0,
})

const SALSA_STORAGE_KEY = 'tacomon-salsa'
const INITIAL_BALANCE = 100

function getStorageKey(userId: string | null) {
  return userId ? `${SALSA_STORAGE_KEY}-${userId}` : SALSA_STORAGE_KEY
}

export function SalsaProvider({ children }: { children: ReactNode }) {
  const { user, authenticated } = usePrivy()
  const [balance, setBalance] = useState(INITIAL_BALANCE)
  const [loaded, setLoaded] = useState(false)

  const userId = authenticated && user ? user.id : null

  // Load balance
  useEffect(() => {
    try {
      const key = getStorageKey(userId)
      const saved = localStorage.getItem(key)
      if (saved !== null) {
        setBalance(Number(saved))
      } else {
        setBalance(INITIAL_BALANCE)
      }
    } catch {
      setBalance(INITIAL_BALANCE)
    }
    setLoaded(true)
  }, [userId])

  // Save balance
  useEffect(() => {
    if (!loaded) return
    const key = getStorageKey(userId)
    localStorage.setItem(key, String(balance))
  }, [balance, loaded, userId])

  const addSalsa = useCallback((amount: number) => {
    setBalance(prev => prev + amount)
  }, [])

  const deductSalsa = useCallback((amount: number): boolean => {
    let success = false
    setBalance(prev => {
      if (prev >= amount) {
        success = true
        return prev - amount
      }
      return prev
    })
    return success
  }, [])

  const earnFromChat = useCallback((): number => {
    const baseAmount = Math.floor(Math.random() * 4) + 2 // 2-5
    let earned = 0

    setBalance(prev => {
      if (prev > 100) {
        // 20% probability
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

    return earned
  }, [])

  return (
    <SalsaContext.Provider value={{ balance, addSalsa, deductSalsa, earnFromChat }}>
      {children}
    </SalsaContext.Provider>
  )
}

export function useSalsa() {
  return useContext(SalsaContext)
}
