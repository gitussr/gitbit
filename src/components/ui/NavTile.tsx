import type { CSSProperties } from 'react'
import { NavLink, type NavLinkProps } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface NavTileProps extends Omit<NavLinkProps, 'className' | 'children' | 'style'> {
  icon: LucideIcon
  label: string
  /** A few words under the label. */
  hint: string
  /** `wide` spans the row and sets the icon beside the text — for the one featured destination. */
  size?: 'tile' | 'wide'
  className?: string
  style?: CSSProperties
}

/**
 * A square-cornered navigation tile: icon chip, bold label, short hint —
 * the mobile menu's unit. The current page is lime and its hint reads
 * "You're here", so it reads at a glance without relying on colour alone.
 * Press-in on touch mirrors the cards (`Card.tsx`): it moves toward the
 * shadow it loses.
 */
export function NavTile({ icon: Icon, label, hint, size = 'tile', className, style, ...props }: NavTileProps) {
  const wide = size === 'wide'
  return (
    <NavLink
      {...props}
      style={style}
      className={({ isActive }) =>
        cn(
          'group flex min-w-0 border-2 border-accent p-3 shadow-brutal-sm',
          'transition-[transform,box-shadow,background-color] duration-150 ease-standard',
          'active:-translate-x-[3px] active:translate-y-[3px] active:shadow-none',
          wide ? 'items-center gap-3' : 'flex-col justify-center gap-1.5',
          isActive ? 'bg-highlight text-highlight-ink' : 'bg-surface text-foreground hover:bg-accent-subtle',
          className,
        )
      }
    >
      {({ isActive }) => {
        const chip = (
          <span
            className={cn(
              'flex shrink-0 items-center justify-center',
              wide ? 'size-10 [&_svg]:size-5' : 'size-7 [&_svg]:size-4',
              isActive ? 'bg-highlight-ink text-highlight' : 'bg-accent text-on-accent',
            )}
          >
            <Icon aria-hidden="true" />
          </span>
        )
        // On the current page the hint gives way to where you are — NavLink also sets aria-current.
        const hintText = (
          <span className={cn('text-body-sm', wide ? 'line-clamp-2' : 'truncate', isActive ? 'font-bold' : 'text-foreground-secondary')}>
            {isActive ? 'You’re here' : hint}
          </span>
        )
        return wide ? (
          <>
            {chip}
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-base font-bold">{label}</span>
              {hintText}
            </span>
          </>
        ) : (
          <>
            {/* Icon beside the label, hint on its own line under both: the hint gets the tile's full width, so it isn't cut off at 320px. */}
            <span className="flex min-w-0 items-center gap-2">
              {chip}
              <span className="truncate text-sm font-bold">{label}</span>
            </span>
            {hintText}
          </>
        )
      }}
    </NavLink>
  )
}
