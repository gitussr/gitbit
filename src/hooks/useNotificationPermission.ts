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
 * Whether the page has settled enough to auto-open the landing prompt.
 * It no longer waits for the provider SDK: a first-time visitor is asked
 * from the browser's own permission, and the SDK loads only when they say
 * yes (see the effect below). Where the SDK then can't load — an ad
 * blocker, most often — they learn it from the "Enable" click, and closing
 * that panel counts as dismissing, so nobody is asked again every visit.
 */
let readyState = false
/** An "Enable" click is loading the SDK and waiting on the browser prompt. */
let pendingState = false
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
 * called from an explicit user action, does that. `dismissed` persists so
 * a user who says "not now" isn't asked again on every visit (Section 14:
 * do not repeatedly ask).
 *
 * The provider SDK is not loaded on page load unless it has a job to do.
 * It costs ~470 ms of main thread on a mid-range phone (measured: mobile
 * Lighthouse TBT 690 ms with it, 220 ms without), and for most visits it
 * has none: a first-time visitor needs it only once they click "Enable",
 * and a denied, dismissed or unsupported one can't subscribe at all. Only
 * an already-subscribed visitor loads it unprompted, after the page has
 * finished loading, so their subscription stays current.
 */
export function useNotificationPermission() {
  const state = useSyncExternalStore(subscribe, () => permissionState)
  const dismissed = useSyncExternalStore(subscribe, () => dismissedState)
  const ready = useSyncExternalStore(subscribe, () => readyState)
  const pending = useSyncExternalStore(subscribe, () => pendingState)
  const [error, setError] = useState(false)

  useEffect(() => {
    watchBrowserPermission()
    refreshPermission()

    // Settled: late enough that a landing prompt doesn't compete with the page
    // itself. The timeout caps how long idle can be deferred on a busy page;
    // Safari has no requestIdleCallback, so it gets a plain delay.
    const settle = () => {
      if (readyState) return
      readyState = true
      emit()
    }
    const idle = 'requestIdleCallback' in window
    const handle = idle ? window.requestIdleCallback(settle, { timeout: 3000 }) : window.setTimeout(settle, 1500)

    // A subscribed visitor's SDK keeps their subscription current; nothing on
    // screen waits for it, so it runs once the page has fully loaded and gone idle.
    let syncHandle: number | undefined
    const sync = () => {
      NotificationService.initialize()
        .catch(() => {})
        .then(refreshPermission)
    }
    const scheduleSync = () => {
      syncHandle = idle ? window.requestIdleCallback(sync, { timeout: 10000 }) : window.setTimeout(sync, 5000)
    }
    if (permissionState === 'granted') {
      if (document.readyState === 'complete') scheduleSync()
      else window.addEventListener('load', scheduleSync, { once: true })
    }

    return () => {
      if (idle) window.cancelIdleCallback(handle as number)
      else window.clearTimeout(handle as number)
      window.removeEventListener('load', scheduleSync)
      if (syncHandle !== undefined) {
        if (idle) window.cancelIdleCallback(syncHandle)
        else window.clearTimeout(syncHandle)
      }
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (pendingState) return
    setError(false)
    pendingState = true
    emit()
    try {
      // Loads the SDK on first use; resolves 'unavailable' if it can't load.
      await NotificationService.requestPermission()
      refreshPermission()
    } catch {
      setError(true)
    } finally {
      pendingState = false
      emit()
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
    pending,
    error,
    requestPermission,
    dismiss,
  }
}
