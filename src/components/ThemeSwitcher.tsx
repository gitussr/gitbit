import { Monitor, Moon, Sun } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl'
import { useTheme } from '@/hooks/useTheme'
import type { ThemePreference } from '@/services/theme'

const options: SegmentedOption<ThemePreference>[] = [
  { value: 'light', label: 'Light', icon: <Sun aria-hidden="true" /> },
  { value: 'dark', label: 'Dark', icon: <Moon aria-hidden="true" /> },
  { value: 'system', label: 'System', icon: <Monitor aria-hidden="true" /> },
]

/** All three theme choices side by side — the mobile menu's setting. Light is the default. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme()
  return <SegmentedControl label="Theme" options={options} value={preference} onChange={setPreference} className={className} />
}

/**
 * The desktop header's one-tap switch between what's showing and the other
 * theme. It always sets an explicit choice — following the OS ("System")
 * is offered in the phone menu's switcher, where there's room for three.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, setPreference } = useTheme()
  const next = resolved === 'dark' ? 'light' : 'dark'
  return (
    <IconButton
      icon={resolved === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      label={next === 'dark' ? 'Switch to dark theme' : 'Switch to light theme'}
      size="sm"
      className={className}
      onClick={() => setPreference(next)}
    />
  )
}
