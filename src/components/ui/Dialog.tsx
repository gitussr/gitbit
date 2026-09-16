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
        // 97% rather than full width so the dialog never touches the screen edges on phones.
        'm-auto max-h-[90dvh] w-[97%] max-w-md overflow-y-auto border-2 border-accent bg-surface p-0 text-foreground shadow-brutal',
        'backdrop:bg-palette-ink/50',
        className,
      )}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-accent bg-highlight px-4 py-3">
        <h2 className="text-base font-bold">{title}</h2>
        <IconButton icon={<X aria-hidden="true" />} label="Close" size="sm" onClick={onClose} />
      </div>
      <div className="p-4">{children}</div>
    </dialog>
  )
}
