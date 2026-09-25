import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface SheetProps {
  open: boolean
  onClose: () => void
  /** Accessible name — the sheet has no visible heading of its own. */
  label: string
  id?: string
  children: ReactNode
  className?: string
}

/**
 * A modal that takes the whole screen — for phone-sized views that
 * replace the page rather than float over it (the mobile menu).
 *
 * Built on the native `<dialog>` like `Dialog`, so the focus trap, the
 * inert page behind, and Escape come from the browser. Escape is routed
 * through `onClose` rather than letting the element close itself, so the
 * owner's state (which may live in history) stays the one source of truth.
 * The page underneath can't scroll while it's open.
 */
export function Sheet({ open, onClose, label, id, children, className }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      id={id}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      className={cn(
        // The UA caps a modal dialog at the viewport minus a margin; a sheet is the viewport.
        'safe-top safe-x fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-background p-0 text-foreground',
        'open:motion-safe:animate-sheet-in',
        className,
      )}
    >
      {open && children}
    </dialog>
  )
}
