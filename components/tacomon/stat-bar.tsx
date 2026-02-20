'use client'

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

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center">
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--foreground)' }}>
          {emoji} {label}
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
          {value}/{maxValue}
        </span>
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
