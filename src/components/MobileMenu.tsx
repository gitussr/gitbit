import { useEffect, type MouseEvent } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { navModules } from '@/app/navigation'
import { GitBitLogo } from '@/components/GitBitLogo'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { IconButton } from '@/components/ui/IconButton'
import { NavTile } from '@/components/ui/NavTile'
import { Sheet } from '@/components/ui/Sheet'

export const MOBILE_MENU_ID = 'mobile-menu'

/** Matches the header's `md:hidden` menu button: at `md` the inline nav takes over. */
const DESKTOP_QUERY = '(min-width: 48rem)'

export interface MobileMenuProps {
  open: boolean
  onClose: () => void
  onSearch: () => void
}

/**
 * The phone menu: a full-screen launcher rather than a dropdown list.
 *
 * Every module is a tile in a two-column grid, so the width of the screen is
 * used rather than a column of short words beside a strip of white space,
 * and each destination says what it's for. The Visualizer, GitBit's
 * flagship, spans the top row. The current page is lime and says "You're
 * here". Search and the theme sit at the bottom, in thumb reach.
 *
 * Its top bar mirrors the header it covers — the close button sits exactly
 * where the menu button was, so open and close are the same tap.
 *
 * Opening pushes a history entry (the owner's `useHistoryFlag`), so the
 * phone's Back button closes the menu instead of leaving the page. Tile
 * links `replace` that entry, so Back from the new page goes to the page
 * you came from, not to a menu.
 */
export function MobileMenu({ open, onClose, onSearch }: MobileMenuProps) {
  const location = useLocation()
  const [featured, ...rest] = navModules

  // Rotating a tablet (or widening a window) past `md` hides the menu button; don't leave a menu open with no way to see why.
  useEffect(() => {
    if (!open) return
    const media = window.matchMedia(DESKTOP_QUERY)
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) onClose()
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [open, onClose])

  /** Tapping where you already are just closes the menu, rather than reloading the page underneath. */
  const onTileClick = (to: string) => (event: MouseEvent) => {
    if (location.pathname === to) {
      event.preventDefault()
      onClose()
    }
  }

  return (
    <Sheet open={open} onClose={onClose} label="Menu" id={MOBILE_MENU_ID}>
      <div className="flex min-h-full flex-col">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b-2 border-accent px-4">
          <IconButton icon={<X aria-hidden="true" />} label="Close menu" size="sm" className="shrink-0" onClick={onClose} />
          <NavLink to="/" replace className="flex shrink-0 items-center" aria-label="GitBit home">
            <GitBitLogo />
          </NavLink>
        </div>

        <nav aria-label="Primary" className="flex-1 px-4 pt-4 pb-3">
          <ul className="grid grid-cols-2 gap-3">
            <li className="col-span-2">
              <NavTile
                to={featured.to}
                replace
                icon={featured.icon}
                label={featured.label}
                hint={featured.description}
                size="wide"
                className="motion-safe:animate-tile-in"
                onClick={onTileClick(featured.to)}
              />
            </li>
            {rest.map((module, index) => (
              <li key={module.to} className="flex">
                <NavTile
                  to={module.to}
                  replace
                  icon={module.icon}
                  label={module.label}
                  hint={module.tagline}
                  className="w-full motion-safe:animate-tile-in"
                  // Row by row, a short beat apart: the eye reads the grid top to bottom as it lands.
                  style={{ animationDelay: `${40 + Math.floor(index / 2) * 35}ms` }}
                  onClick={onTileClick(module.to)}
                />
              </li>
            ))}
          </ul>
        </nav>

        <div className="safe-bottom sticky bottom-0 flex shrink-0 flex-col gap-3 border-t-2 border-accent bg-background px-4 pt-3 pb-4">
          <button
            type="button"
            onClick={onSearch}
            className="flex h-11 w-full items-center gap-2 border-2 border-accent bg-surface px-3 text-left text-sm text-foreground-secondary shadow-brutal-sm transition-[transform,box-shadow] duration-150 ease-standard active:-translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            <Search className="size-4 shrink-0 text-foreground" aria-hidden="true" />
            Search commands, concepts, fixes…
          </button>
          {/* No visible "Theme" label: at 320px it would squeeze "System" to an ellipsis, and sun/moon/monitor say it. The group is still named "Theme" for screen readers. */}
          <ThemeSwitcher />
        </div>
      </div>
    </Sheet>
  )
}
