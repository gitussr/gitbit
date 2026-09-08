import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, AlertTriangle, OctagonAlert, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'
import { IconButton } from './IconButton'

type ToastVariant = 'info' | 'success' | 'warning' | 'danger'

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastItem {
  id: string
  description: string
  title?: string
  variant: ToastVariant
  action?: ToastAction
  /** ms before it auto-dismisses; `null` keeps it until acted on or dismissed. */
  duration: number | null
}

type ToastInput = Omit<ToastItem, 'id' | 'variant' | 'duration'> & {
  variant?: ToastVariant
  duration?: number | null
}

const DEFAULT_DURATION = 4000

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null)

const variantStyles: Record<ToastVariant, string> = {
  info: 'text-accent-strong',
  success: 'text-safe',
  warning: 'text-caution',
  danger: 'text-danger',
}

const variantIcons: Record<ToastVariant, ReactNode> = {
  info: <Info className="size-4.5" aria-hidden="true" />,
  success: <CheckCircle2 className="size-4.5" aria-hidden="true" />,
  warning: <AlertTriangle className="size-4.5" aria-hidden="true" />,
  danger: <OctagonAlert className="size-4.5" aria-hidden="true" />,
}

/** Wrap the app once; call `useToast()` anywhere below to show transient feedback (e.g. "Copied"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (input: ToastInput) => {
      const id = crypto.randomUUID()
      const toast: ToastItem = { id, variant: 'info', duration: DEFAULT_DURATION, ...input }
      setToasts((prev) => [...prev, toast])
      // A toast carrying an action can opt out of auto-dismissal (duration:
      // null) — four seconds is not long enough to notice and act on one.
      if (toast.duration !== null) {
        window.setTimeout(() => dismiss(id), toast.duration)
      }
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed right-4 bottom-4 z-toast flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="glass flex items-start gap-2.5 rounded-lg px-4 py-3 shadow-md"
          >
            <span className={cn('mt-0.5 shrink-0', variantStyles[toast.variant])}>{variantIcons[toast.variant]}</span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              {toast.title && <p className="text-sm font-semibold text-foreground">{toast.title}</p>}
              <p className="text-sm text-foreground-secondary">{toast.description}</p>
              {toast.action && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2 self-start"
                  onClick={() => {
                    dismiss(toast.id)
                    toast.action?.onClick()
                  }}
                >
                  {toast.action.label}
                </Button>
              )}
            </div>
            {toast.duration === null && (
              <IconButton
                icon={<X aria-hidden="true" />}
                label="Dismiss"
                size="sm"
                className="-mt-1 -mr-1.5 shrink-0"
                onClick={() => dismiss(toast.id)}
              />
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
