'use client'

import { useEffect, useRef, useCallback } from 'react'

const HUB_URL = 'https://regenmon-final.vercel.app'
const SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutes
const TRAINING_STORAGE_KEY = 'tacomon-training'

interface SyncPayload {
  regenmonId: string
  stats: { happiness: number; energy: number; hunger: number }
  totalPoints: number
  trainingHistory: Array<{ score: number; category: string; timestamp: string }>
}

async function doSync(payload: SyncPayload) {
  try {
    const res = await fetch(`${HUB_URL}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      // retry once after 2s
      await new Promise(r => setTimeout(r, 2000))
      await fetch(`${HUB_URL}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
  } catch {
    try {
      await new Promise(r => setTimeout(r, 2000))
      await fetch(`${HUB_URL}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch { /* silent */ }
  }
}

function buildPayload(): SyncPayload | null {
  try {
    const hubId = localStorage.getItem('hubRegenmonId')
    if (!hubId) return null

    const tacomonRaw = localStorage.getItem('tacomon-data')
    if (!tacomonRaw) return null
    const tacomon = JSON.parse(tacomonRaw)

    const trainingRaw = localStorage.getItem(TRAINING_STORAGE_KEY)
    const training = trainingRaw ? JSON.parse(trainingRaw) : { totalPoints: 0, history: [] }

    return {
      regenmonId: hubId,
      stats: {
        happiness: tacomon.happiness ?? 50,
        energy: tacomon.energy ?? 50,
        hunger: tacomon.hunger ?? 50,
      },
      totalPoints: training.totalPoints ?? 0,
      trainingHistory: training.history ?? [],
    }
  } catch {
    return null
  }
}

export function useHubSync() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const syncNow = useCallback(() => {
    const payload = buildPayload()
    if (payload) doSync(payload)
  }, [])

  useEffect(() => {
    const isRegistered = localStorage.getItem('isRegisteredInHub') === 'true'
    if (!isRegistered) return

    // Initial sync
    syncNow()

    // Periodic sync
    intervalRef.current = setInterval(syncNow, SYNC_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [syncNow])

  return { syncNow }
}
