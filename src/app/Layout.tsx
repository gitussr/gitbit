import { NavLink, Outlet } from 'react-router-dom'

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
 * App shell: skip link, header nav, and routed content.
 * Visual design arrives with the Design System (Phase 3) — this only
 * establishes structure and landmarks.
 */
export function Layout() {
  return (
    <div>
      <a href="#main-content">Skip to content</a>
      <header>
        <NavLink to="/">GitBit</NavLink>
        <nav aria-label="Primary">
          <ul>
            {primaryNav.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
    </div>
  )
}
