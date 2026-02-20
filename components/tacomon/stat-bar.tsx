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
        <span className="text-[7px] md:text-[9px]" style={{ color: 'var(--foreground)' }}>
          {emoji} {label}
        </span>
        <span className="text-[7px] md:text-[9px]" style={{ color: 'var(--muted-foreground)' }}>
          {value}/{maxValue}
        </span>
      </div>
      <div
        className="w-full h-5 md:h-6 relative"
        style={{
          backgroundColor: bgColor,
          border: '3px solid var(--border)',
          imageRendering: 'pixelated',
        }}
      >
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
        {/* Pixel scanline effect */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)`,
          }}
        />
      </div>
    </div>
  )
}
