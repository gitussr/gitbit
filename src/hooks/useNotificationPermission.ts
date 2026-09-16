import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { NotificationService, type NotificationPermissionState } from '@/services/notifications/NotificationService'

const DISMISSED_KEY = 'gitbit-notification-prompt-dismissed'

function readDismissed() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(DISMISSED_KEY) === '1'
}

/**
 * Module-level store shared by every caller. The header bell (and its
 * auto-opening landing popup) and the /daily card each call this hook; with
 * per-instance `useState`, granting from the popup updated only the bell, so
 * the /daily card kept asking until a remount. One store means one answer.
 */
let permissionState: NotificationPermissionState = NotificationService.getPermissionState()
let dismissedState = readDismissed()
/**
 * Whether the provider SDK has finished loading. Until then `state` is only
 * the browser's raw permission, which reads 'default' even where init is
 * about to fail and flip it to 'unavailable' — so nothing should act on
 * 'default' (e.g. auto-open a prompt) before this is true.
 */
let readyState = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function refreshPermission() {
  const next = NotificationService.getPermissionState()
  if (next === permissionState) return
  permissionState = next
  emit()
}

let watchingBrowserPermission = false

/** Picks up changes made outside the app (browser site settings, another tab). */
function watchBrowserPermission() {
  if (watchingBrowserPermission || typeof navigator === 'undefined' || !navigator.permissions) return
  watchingBrowserPermission = true
  navigator.permissions
    .query({ name: 'notifications' })
    .then((status) => {
      status.addEventListener('change', refreshPermission)
    })
    .catch(() => {})
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Drives the GitBit Daily opt-in UI (Section 14/27). Never requests the
 * browser permission prompt on its own — only `requestPermission()`,
 * called from an explicit user action, does that; `initialize()` on
 * mount only loads the provider SDK so an already-subscribed returning
 * visitor's subscription stays current. State is re-read after init
 * resolves, since the provider can flip it to 'unavailable' (e.g. an
 * origin OneSignal isn't configured for) without throwing. `dismissed`
 * persists so a user who says "not now" isn't asked again on every visit
 * (Section 14: do not repeatedly ask).
 */
export function useNotificationPermission() {
  const state = useSyncExternalStore(subscribe, () => permissionState)
  const dismissed = useSyncExternalStore(subscribe, () => dismissedState)
  const ready = useSyncExternalStore(subscribe, () => readyState)
  const [error, setError] = useState(false)

  useEffect(() => {
    watchBrowserPermission()
    refreshPermission()
    NotificationService.initialize()
      .catch(() => {})
      .then(() => {
        refreshPermission()
        if (readyState) return
        readyState = true
        emit()
      })
  }, [])

  const requestPermission = useCallback(async () => {
    setError(false)
    try {
      await NotificationService.requestPermission()
      refreshPermission()
    } catch {
      setError(true)
    }
  }, [])

  const dismiss = useCallback(() => {
    window.localStorage.setItem(DISMISSED_KEY, '1')
    dismissedState = true
    emit()
  }, [])

  return {
    state,
    supported: state !== 'unsupported',
    dismissed,
    ready,
    error,
    requestPermission,
    dismiss,
  }
}
