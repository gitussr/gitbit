/**
 * Colour theme: light by default, dark on request.
 *
 * The reader's choice is one of three preferences. `light` is the default
 * for anyone who hasn't chosen — including an OS set to dark, because the
 * light design is GitBit's defined look. `system` is the opt-in for
 * following the OS. The resolved theme is written to `<html data-theme>`,
 * which is all tokens.css keys off.
 *
 * IMPORTANT: `index.html` repeats the storage key, the resolution and the
 * theme-color values in an inline script so the right theme is on the page
 * before first paint (a module script runs too late and flashes white).
 * Change one, change both.
 */

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'gitbit-theme'

/** The browser chrome colour (`<meta name="theme-color">`) for each theme — the page background. */
const THEME_COLOR: Record<ResolvedTheme, string> = { light: '#ffffff', dark: '#14150d' }

const DARK_QUERY = '(prefers-color-scheme: dark)'

function isPreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isPreference(stored) ? stored : 'light'
  } catch {
    // Blocked storage (private mode, sandboxed frame): fall back to the default.
    return 'light'
  }
}

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches
}

export function resolveTheme(preference: ThemePreference, prefersDark = systemPrefersDark()): ResolvedTheme {
  if (preference === 'system') return prefersDark ? 'dark' : 'light'
  return preference
}

export function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement
  if (theme === 'dark') root.dataset.theme = 'dark'
  else delete root.dataset.theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
}

const listeners = new Set<() => void>()
let preference: ThemePreference = typeof window === 'undefined' ? 'light' : readThemePreference()

export function getThemePreference(): ThemePreference {
  return preference
}

export function setThemePreference(next: ThemePreference) {
  preference = next
  try {
    // The default isn't stored, so a reader who goes back to light is
    // indistinguishable from one who never chose.
    if (next === 'light') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // Still applies for this visit; it just won't be remembered.
  }
  applyTheme(resolveTheme(next))
  listeners.forEach((listener) => listener())
}

/**
 * Subscribes to anything that can change the resolved theme: the reader's
 * choice, the OS setting (which only matters under `system`), and another
 * tab changing the choice.
 */
export function subscribeToTheme(listener: () => void): () => void {
  listeners.add(listener)
  const media = window.matchMedia(DARK_QUERY)
  const onSystemChange = () => {
    if (preference !== 'system') return
    applyTheme(resolveTheme('system'))
    listener()
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return
    preference = readThemePreference()
    applyTheme(resolveTheme(preference))
    listener()
  }
  media.addEventListener('change', onSystemChange)
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    media.removeEventListener('change', onSystemChange)
    window.removeEventListener('storage', onStorage)
  }
}
