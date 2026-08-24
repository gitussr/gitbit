import { useCallback, useEffect, useState } from 'react'
import { NotificationService, type NotificationPermissionState } from '@/services/notifications/NotificationService'

const DISMISSED_KEY = 'gitbit-notification-prompt-dismissed'

function readDismissed() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(DISMISSED_KEY) === '1'
}

/**
 * Drives the GitBit Daily opt-in UI (Section 14/27). Never requests the
 * browser permission prompt on its own — only `requestPermission()`,
 * called from an explicit user action, does that; `initialize()` on
 * mount only loads the provider SDK so an already-subscribed returning
 * visitor's subscription stays current. `dismissed` persists so a user
 * who says "not now" isn't asked again on every visit (Section 14: do
 * not repeatedly ask).
 */
export function useNotificationPermission() {
  const [state, setState] = useState<NotificationPermissionState>(() => NotificationService.getPermissionState())
  const [dismissed, setDismissed] = useState(readDismissed)
  const [error, setError] = useState(false)

  useEffect(() => {
    NotificationService.initialize().catch(() => setError(true))
  }, [])

  const requestPermission = useCallback(async () => {
    setError(false)
    try {
      const result = await NotificationService.requestPermission()
      setState(result)
    } catch {
      setError(true)
    }
  }, [])

  const dismiss = useCallback(() => {
    window.localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }, [])

  return {
    state,
    supported: state !== 'unsupported',
    dismissed,
    error,
    requestPermission,
    dismiss,
  }
}
