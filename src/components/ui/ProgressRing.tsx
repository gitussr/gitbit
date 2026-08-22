import { cn } from '@/utils/cn'

export interface ProgressRingProps {
  /** 0-100 */
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  label?: string
}

/** Circular reading/lesson progress marker (Section 21) — stays subtle, communicates "how far am I?" */
export function ProgressRing({ value, size = 32, strokeWidth = 3, className, label }: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label ?? `${Math.round(clamped)}% complete`}
      className={cn('-rotate-90', className)}
    >
      <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} className="stroke-border" fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="stroke-accent transition-[stroke-dashoffset] duration-300 ease-standard"
        fill="none"
      />
    </svg>
  )
}
