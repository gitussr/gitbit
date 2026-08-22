import { NavLink, Outlet } from 'react-router-dom'
import { Search } from 'lucide-react'
import { GitBitLogo } from '@/components/GitBitLogo'
import { ThemeToggle } from '@/components/ThemeToggle'
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

/**
 * App shell: skip link, sticky glass header, and routed content.
 * Every visual decision here comes from design tokens (styles/tokens.css)
 * and Design System primitives (components/ui) — no one-off styling.
 */
export function Layout() {
  return (
    <div className="safe-x flex min-h-svh flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-tooltip focus-visible:rounded-md focus-visible:bg-accent focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:text-foreground-inverse"
      >
        Skip to content
      </a>

      <header className="safe-top glass sticky top-0 z-header border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <NavLink to="/" className="shrink-0">
            <GitBitLogo />
          </NavLink>

          <nav aria-label="Primary" className="min-w-0 flex-1 overflow-x-auto">
            <ul className="flex items-center gap-1 whitespace-nowrap">
              {primaryNav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex items-center rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors duration-150 ease-standard',
                        isActive
                          ? 'bg-accent-subtle text-accent-strong'
                          : 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <NavLink
              to="/search"
              aria-label="Search"
              title="Search"
              className="inline-flex size-8 items-center justify-center rounded-md text-foreground-secondary transition-colors duration-150 ease-standard hover:bg-surface-hover hover:text-foreground"
            >
              <Search className="size-4" aria-hidden="true" />
            </NavLink>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main-content" className="safe-bottom mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
