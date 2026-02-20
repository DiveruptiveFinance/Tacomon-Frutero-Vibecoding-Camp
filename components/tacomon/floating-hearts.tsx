'use client'

import { useState, useCallback } from 'react'

export function useFloatingHearts() {
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([])

  const spawnHearts = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    let clientX: number, clientY: number

    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = clientX - rect.left
    const y = clientY - rect.top

    const newHearts = Array.from({ length: 3 }, (_, i) => ({
      id: Date.now() + i,
      x: x + (Math.random() * 40 - 20),
      y: y + (Math.random() * 20 - 10),
    }))

    setHearts((prev) => [...prev, ...newHearts])

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => !newHearts.find((nh) => nh.id === h.id)))
    }, 1500)
  }, [])

  const HeartsLayer = () => (
    <>
      {hearts.map((h) => (
        <span
          key={h.id}
          className="absolute animate-float-hearts pointer-events-none text-sm md:text-base"
          style={{ left: h.x, top: h.y }}
        >
          {'\u{2764}\u{FE0F}'}
        </span>
      ))}
    </>
  )

  return { spawnHearts, HeartsLayer }
}
