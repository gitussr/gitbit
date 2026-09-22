import { useId, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Text } from './Typography'

/**
 * The panel surface: white, 2px ink border, lime when something is
 * happening in it. Exported the way `cardClassName` and `buttonClassName`
 * are, so anything that needs to look like a panel without *being* a
 * labelled state region can share it rather than restyle it.
 *
 * No brutal shadow. Panels stack with an arrow between them and the shadow
 * falls down-left across it — the same reason `GitStateFlow` leaves it off.
 */
export function panelClassName(active = false, className?: string) {
  return cn(
    'border-2 border-accent p-3 transition-colors duration-200 ease-standard',
    active ? 'bg-card' : 'bg-surface',
    className,
  )
}

export interface StatePanelProps {
  label: string
  /** One line of plain English. The same copy the Git state model uses (`content/states.ts`). */
  hint?: string
  /** Lights the panel while a transition is landing in it. */
  active?: boolean
  /** Shown instead of children when there is nothing in this place yet. */
  empty?: ReactNode
  count?: number
  children?: ReactNode
  className?: string
}

/**
 * One of the places work can be: Working Directory, Staging Area, Local
 * Repository (Section 10).
 *
 * A real `<section>` with a real heading, because "the four regions" are
 * document structure, not decoration — a screen reader should be able to
 * navigate between them the way a sighted reader's eye does.
 */
export function StatePanel({ label, hint, active = false, empty, count, children, className }: StatePanelProps) {
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className={panelClassName(active, cn('flex flex-col gap-2', className))}
    >
      <div className="flex items-baseline gap-2">
        <Text as="h2" id={headingId} variant="body-sm" className="font-bold">
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <Text variant="caption" tone="secondary">
            {count} {count === 1 ? 'file' : 'files'}
          </Text>
        )}
      </div>

      {hint && (
        <Text variant="caption" tone="secondary">
          {hint}
        </Text>
      )}

      {/* A caller writing `{items.length > 0 && <ul/>}` passes `false`, not
          `undefined` — `??` would keep the `false` and the empty state would
          never appear. Any falsy child means "nothing here". */}
      {children || empty}
    </section>
  )
}
