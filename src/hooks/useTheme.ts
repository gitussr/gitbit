import { useSyncExternalStore } from 'react'
import {
  getThemePreference,
  setThemePreference,
  subscribeToTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '@/services/theme'

/** The reader's theme choice, what it resolves to right now, and a setter. */
export function useTheme(): {
  preference: ThemePreference
  resolved: ResolvedTheme
  setPreference: (next: ThemePreference) => void
} {
  const preference = useSyncExternalStore(subscribeToTheme, getThemePreference, () => 'light' as const)
  // Resolved from `data-theme` rather than recomputed, so it is always what the page is actually showing.
  const resolved = useSyncExternalStore(
    subscribeToTheme,
    () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'),
    () => 'light' as const,
  )
  return { preference, resolved, setPreference: setThemePreference }
}
