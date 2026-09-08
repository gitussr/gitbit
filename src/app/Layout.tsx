import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, Search, X } from 'lucide-react'
import { GitBitLogo } from '@/components/GitBitLogo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NotificationBell } from '@/components/NotificationBell'
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
    'inline-flex items-center rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors duration-150 ease-standard',
    isActive
      ? 'bg-accent-subtle text-accent-strong'
      : 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground',
  )

/**
 * App shell: skip link, sticky glass header, and routed content.
 * Every visual decision here comes from design tokens (styles/tokens.css)
 * and Design System primitives (components/ui) — no one-off styling.
 *
 * Below `md`, seven nav items don't fit inline (Section 18: nothing should
 * rely on undiscoverable horizontal scroll) — a menu button replaces them.
 */
export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const [lastPathname, setLastPathname] = useState(location.pathname)

  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname)
    setMenuOpen(false)
  }

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
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-tooltip focus-visible:rounded-md focus-visible:bg-accent focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:text-foreground-inverse"
      >
        Skip to content
      </a>

      <header className="safe-top glass sticky top-0 z-header border-b shadow-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <IconButton
            icon={menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            size="sm"
            className="shrink-0 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
          />

          <NavLink to="/" className="shrink-0">
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

          <div className="flex flex-1 shrink-0 items-center justify-end gap-2 md:flex-none">
            <NavLink
              to="/search"
              aria-label="Search"
              title="Search"
              className="inline-flex size-8 items-center justify-center rounded-md text-foreground-secondary transition-colors duration-150 ease-standard hover:bg-surface-hover hover:text-foreground"
            >
              <Search className="size-4" aria-hidden="true" />
            </NavLink>
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>

        {menuOpen && (
          <nav aria-label="Primary" className="glass border-t px-4 py-3 shadow-sm md:hidden">
            <ul className="flex flex-col gap-1">
              {primaryNav.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className={(state) => cn(navLinkClassName(state), 'block w-full px-3 py-2')}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="safe-bottom mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 focus:outline-none"
      >
        <Outlet />
      </main>
    </div>
  )
}
