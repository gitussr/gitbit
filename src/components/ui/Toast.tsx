import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, AlertTriangle, OctagonAlert } from 'lucide-react'
import { cn } from '@/utils/cn'

type ToastVariant = 'info' | 'success' | 'warning' | 'danger'

interface ToastItem {
  id: string
  description: string
  title?: string
  variant: ToastVariant
}

type ToastInput = Omit<ToastItem, 'id' | 'variant'> & { variant?: ToastVariant }

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

  const showToast = useCallback((input: ToastInput) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, variant: 'info', ...input }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 4000)
  }, [])

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
            <div className="flex flex-col gap-0.5">
              {toast.title && <p className="text-sm font-semibold text-foreground">{toast.title}</p>}
              <p className="text-sm text-foreground-secondary">{toast.description}</p>
            </div>
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
