'use client'

import { useState, useEffect, useRef } from 'react'

interface StatDelta {
  id: number
  amount: number
}

interface StatBarProps {
  label: string
  emoji: string
  value: number
  maxValue: number
  color: string
  bgColor: string
}

export function StatBar({ label, emoji, value, maxValue, color, bgColor }: StatBarProps) {
  const percentage = Math.round((value / maxValue) * 100)
  const [deltas, setDeltas] = useState<StatDelta[]>([])
  const prevValue = useRef(value)
  const idRef = useRef(0)

  useEffect(() => {
    const diff = value - prevValue.current
    if (diff !== 0) {
      const id = ++idRef.current
      setDeltas(prev => [...prev, { id, amount: diff }])
      setTimeout(() => {
        setDeltas(prev => prev.filter(d => d.id !== id))
      }, 1500)
    }
    prevValue.current = value
  }, [value])

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center">
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--foreground)' }}>
          {emoji} {label}
        </span>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
            {value}/{maxValue}
          </span>
          {deltas.map(d => (
            <span
              key={d.id}
              className="animate-stat-delta"
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                color: d.amount > 0 ? '#4caf50' : '#e53935',
              }}
            >
              {d.amount > 0 ? '+' : ''}{d.amount}
            </span>
          ))}
        </div>
      </div>
      <div
        className="stat-bar-track"
        style={{ backgroundColor: bgColor }}
      >
        <div
          className="stat-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}
