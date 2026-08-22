import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { IconButton } from './IconButton'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

/** Accessible modal built on the native `<dialog>` element — free focus trap, Escape-to-close, and backdrop. */
export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      className={cn(
        'm-auto w-full max-w-md rounded-xl border border-border bg-surface p-0 text-foreground shadow-lg',
        'backdrop:bg-black/40 backdrop:backdrop-blur-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <IconButton icon={<X aria-hidden="true" />} label="Close" size="sm" onClick={onClose} />
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  )
}
