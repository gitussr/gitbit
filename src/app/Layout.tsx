import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Menu, Search } from 'lucide-react'
import { headerNav } from '@/app/navigation'
import { GitBitLogo } from '@/components/GitBitLogo'
import { MobileMenu, MOBILE_MENU_ID } from '@/components/MobileMenu'
import { NotificationBell } from '@/components/NotificationBell'
import { ThemeToggle } from '@/components/ThemeSwitcher'
import { IconButton } from '@/components/ui/IconButton'
import { useHistoryFlag } from '@/hooks/useHistoryFlag'
import { cn } from '@/utils/cn'

/**
 * Search needs the whole knowledge base, which is most of what the content
 * layer weighs — too much to make every page load pay for a palette most
 * visits never open. It loads on intent (hover, focus, touch on the button)
 * or on open, and the service worker precaches it for next time.
 */
const loadSearchPalette = () => import('@/components/SearchPalette')
const SearchPalette = lazy(() => loadSearchPalette().then((module) => ({ default: module.SearchPalette })))
const warmSearch = () => void loadSearchPalette()

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex h-8 items-center border-2 px-2.5 text-body-sm font-bold transition-colors duration-150 ease-standard',
    isActive
      ? 'border-accent bg-accent-subtle text-foreground'
      : 'border-transparent text-foreground hover:border-accent',
  )

/**
 * App shell: skip link, sticky header, and routed content.
 * Every visual decision here comes from design tokens (styles/tokens.css)
 * and Design System primitives (components/ui) — no one-off styling.
 *
 * Below `md`, seven nav items don't fit inline (Section 18: nothing should
 * rely on undiscoverable horizontal scroll) — a menu button opens the
 * full-screen `MobileMenu` instead. Its open state lives in a history entry,
 * so Back closes it and any navigation (a tile, search, a link) leaves it
 * behind.
 */
export function Layout() {
  const [menuOpen, setMenuOpen] = useHistoryFlag('menu')
  const [searchOpen, setSearchOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [setMenuOpen])

  /* Section 20: search is keyboard-reachable from anywhere. Cmd/Ctrl-K is the
     convention readers already have from their editor, so it's the one to match. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="safe-x flex min-h-svh flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-tooltip focus-visible:bg-accent focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:text-on-accent"
      >
        Skip to content
      </a>

      {/* `!`: the `glass` utility's `border` shorthand is emitted after these, so without it the header had a border on all four sides. */}
      <header className="safe-top glass sticky top-0 z-header border-x-0! border-t-0!">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <IconButton
            icon={<Menu aria-hidden="true" />}
            label="Open menu"
            aria-expanded={menuOpen}
            aria-controls={MOBILE_MENU_ID}
            aria-haspopup="dialog"
            size="sm"
            className="shrink-0 md:hidden"
            onClick={() => setMenuOpen(true)}
          />

          {/* `flex`, not the default inline flow: the logo's inline-flex box sits on
              the anchor's text baseline, which leaves descender space underneath and
              pushes the mark a couple of pixels above the header's centre line. */}
          <NavLink to="/" className="flex shrink-0 items-center">
            <GitBitLogo />
          </NavLink>

          <nav aria-label="Primary" className="hidden min-w-0 flex-1 md:block">
            <ul className="flex items-center gap-1">
              {headerNav.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className={navLinkClassName}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-1 shrink-0 items-center justify-end gap-1 md:flex-none">
            {/* Phones get all three theme choices in the menu; the header stays at search + bell. */}
            <ThemeToggle className="hidden md:inline-flex" />
            <IconButton
              icon={<Search aria-hidden="true" />}
              label="Search"
              size="sm"
              onClick={() => setSearchOpen(true)}
              onPointerEnter={warmSearch}
              onFocus={warmSearch}
              onTouchStart={warmSearch}
            />
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Bottom padding adds the safe-area inset rather than using `safe-bottom`, which would replace it with 0 on most phones. */}
      <main
        id="main-content"
        tabIndex={-1}
        className="page-grid w-full flex-1 pt-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:pt-8 sm:pb-[calc(3rem+env(safe-area-inset-bottom))] focus:outline-none"
      >
        <Outlet />
      </main>

      <MobileMenu
        open={menuOpen}
        onClose={closeMenu}
        onSearch={() => {
          closeMenu()
          setSearchOpen(true)
        }}
      />

      {searchOpen && (
        <Suspense fallback={null}>
          <SearchPalette onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}
