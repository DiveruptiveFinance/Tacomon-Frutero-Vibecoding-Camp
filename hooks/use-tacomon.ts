'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TacomonData } from '@/lib/tacomon-types'
import { SPECIALTIES_BY_TYPE } from '@/lib/tacomon-types'

const STORAGE_KEY = 'tacomon-data'

export function useTacomon() {
  const [tacomon, setTacomon] = useState<TacomonData | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as TacomonData
        // Backward compat: assign default specialty if missing
        if (!parsed.specialty && parsed.type) {
          parsed.specialty = SPECIALTIES_BY_TYPE[parsed.type][0]
        }
        setTacomon(parsed)
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage whenever tacomon changes
  useEffect(() => {
    if (tacomon && isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tacomon))
    }
  }, [tacomon, isLoaded])

  const createTacomon = useCallback((data: TacomonData) => {
    setTacomon(data)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [])

  const updateStats = useCallback((stat: 'happiness' | 'energy' | 'hunger', amount: number) => {
    setTacomon((prev) => {
      if (!prev) return prev
      const newValue = Math.min(100, Math.max(0, prev[stat] + amount))
      const now = new Date().toISOString()

      let lastKey: 'lastFed' | 'lastChatted' | 'lastPlayed'
      if (stat === 'hunger') lastKey = 'lastFed'
      else if (stat === 'happiness') lastKey = 'lastChatted'
      else lastKey = 'lastPlayed'

      const updated = {
        ...prev,
        [stat]: newValue,
        [lastKey]: now,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const resetTacomon = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setTacomon(null)
  }, [])

  return {
    tacomon,
    isLoaded,
    createTacomon,
    updateStats,
    resetTacomon,
  }
}
