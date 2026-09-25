import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readThemePreference, resolveTheme, THEME_STORAGE_KEY } from './theme'

/**
 * Light is the default and must stay the default: a reader is only ever in
 * dark because they chose Dark, or chose System on a dark OS.
 */
function stubStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  })
  return store
}

describe('theme default', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('is light for a first-time visitor, even on a dark OS', () => {
    stubStorage()
    const preference = readThemePreference()
    expect(preference).toBe('light')
    expect(resolveTheme(preference, true)).toBe('light')
  })

  it("ignores and clears the first dark mode's leftover `gitbit-theme` value", () => {
    for (const legacy of ['system', 'dark']) {
      const store = stubStorage({ 'gitbit-theme': legacy })
      expect(resolveTheme(readThemePreference(), true)).toBe('light')
      expect(store.has('gitbit-theme')).toBe(false)
    }
  })

  it('is light when the stored value is not a known preference', () => {
    stubStorage({ [THEME_STORAGE_KEY]: 'sepia' })
    expect(readThemePreference()).toBe('light')
  })

  it('is light when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError')
      },
      removeItem: () => {
        throw new Error('SecurityError')
      },
    })
    expect(readThemePreference()).toBe('light')
  })

  it('goes dark only on an explicit choice', () => {
    stubStorage({ [THEME_STORAGE_KEY]: 'dark' })
    expect(resolveTheme(readThemePreference(), false)).toBe('dark')
    stubStorage({ [THEME_STORAGE_KEY]: 'system' })
    expect(resolveTheme(readThemePreference(), true)).toBe('dark')
    expect(resolveTheme(readThemePreference(), false)).toBe('light')
  })
})
