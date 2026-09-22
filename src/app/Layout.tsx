import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, Search, X } from 'lucide-react'
import { GitBitLogo } from '@/components/GitBitLogo'
import { NotificationBell } from '@/components/NotificationBell'
import { SearchPalette } from '@/components/SearchPalette'
import { IconButton } from '@/components/ui/IconButton'
import { cn } from '@/utils/cn'

const primaryNav = [
  { to: '/quick', label: 'Quick' },
  { to: '/learn', label: 'Learn' },
  { to: '/aha', label: 'Aha' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/sos', label: 'SOS' },
  { to: '/terminal', label: 'Terminal' },
  { to: '/daily', label: 'Daily' },
]

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
 * rely on undiscoverable horizontal scroll) — a menu button replaces them.
 */
export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()
  const [lastPathname, setLastPathname] = useState(location.pathname)

  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname)
    setMenuOpen(false)
  }

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

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <div className="safe-x flex min-h-svh flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-tooltip focus-visible:bg-accent focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:text-highlight"
      >
        Skip to content
      </a>

      <header className="safe-top glass sticky top-0 z-header border-x-0 border-t-0">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <IconButton
            icon={menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            size="sm"
            className="shrink-0 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
          />

          {/* `flex`, not the default inline flow: the logo's inline-flex box sits on
              the anchor's text baseline, which leaves descender space underneath and
              pushes the mark a couple of pixels above the header's centre line. */}
          <NavLink to="/" className="flex shrink-0 items-center">
            <GitBitLogo />
          </NavLink>

          <nav aria-label="Primary" className="hidden min-w-0 flex-1 md:block">
            <ul className="flex items-center gap-1">
              {primaryNav.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className={navLinkClassName}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-1 shrink-0 items-center justify-end gap-1 md:flex-none">
            <IconButton
              icon={<Search aria-hidden="true" />}
              label="Search"
              size="sm"
              onClick={() => setSearchOpen(true)}
            />
            <NotificationBell />
          </div>
        </div>

        {menuOpen && (
          <nav aria-label="Primary" className="glass border-x-0 border-b-0 px-4 py-3 md:hidden">
            <ul className="flex flex-col gap-1">
              {primaryNav.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className={(state) => cn(navLinkClassName(state), 'flex h-10 w-full px-3 text-sm')}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      {/* Bottom padding adds the safe-area inset rather than using `safe-bottom`, which would replace it with 0 on most phones. */}
      <main
        id="main-content"
        tabIndex={-1}
        className="page-grid w-full flex-1 pt-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:pt-8 sm:pb-[calc(3rem+env(safe-area-inset-bottom))] focus:outline-none"
      >
        <Outlet />
      </main>

      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}
    </div>
  )
}
