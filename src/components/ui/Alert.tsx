import type { HTMLAttributes, ReactNode } from 'react'
import { CheckCircle2, Info, AlertTriangle, OctagonAlert } from 'lucide-react'
import { cn } from '@/utils/cn'

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
  title?: string
  icon?: ReactNode
}

const variantStyles: Record<AlertVariant, string> = {
  info: 'bg-accent-subtle border-accent-border text-accent-strong',
  success: 'bg-safe-subtle border-safe-border text-safe',
  warning: 'bg-caution-subtle border-caution-border text-caution',
  danger: 'bg-danger-subtle border-danger-border text-danger',
}

const variantIcons: Record<AlertVariant, ReactNode> = {
  info: <Info className="size-4.5" aria-hidden="true" />,
  success: <CheckCircle2 className="size-4.5" aria-hidden="true" />,
  warning: <AlertTriangle className="size-4.5" aria-hidden="true" />,
  danger: <OctagonAlert className="size-4.5" aria-hidden="true" />,
}

/** Calm, non-alarming status messaging (Section 32) — never fear-based language in `children`. */
export function Alert({ className, variant = 'info', title, icon, children, ...props }: AlertProps) {
  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg border p-4', variantStyles[variant], className)}
      {...props}
    >
      <div className="mt-0.5 shrink-0">{icon ?? variantIcons[variant]}</div>
      <div className="flex flex-col gap-1 text-foreground">
        {title && <p className="text-sm font-semibold">{title}</p>}
        <div className="text-sm text-foreground-secondary">{children}</div>
      </div>
    </div>
  )
}
