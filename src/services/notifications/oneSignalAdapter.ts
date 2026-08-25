import OneSignal from 'react-onesignal'
import type { NotificationPermissionState, NotificationProviderAdapter } from './types'

const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID

function isPushCapable() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * Hosted at /onesignal/ with its own scope so it coexists with the
 * vite-plugin-pwa service worker, which keeps root scope '/' for
 * offline app caching (Section 22/6). Push delivery isn't scope-bound —
 * it goes to whichever registration created the subscription — so this
 * only affects which pages each worker can control.
 */
let initPromise: Promise<void> | null = null

/**
 * init() rejects for several unrelated reasons that look identical to the
 * promise — origin not matching the app's configured Site URL (localhost
 * dev, Vercel previews), a wrong app ID, or (observed in prod) an ad
 * blocker/privacy extension blocking the cdn.onesignal.com script itself.
 * There's no distinct error code to branch on, so we can't relabel one
 * cause as an "environment limitation" and drop it. Log the real error so
 * the actual cause is diagnosable instead of vanishing into the
 * 'unavailable' state (see NotificationOptIn).
 */
let unavailable = false

function initialize() {
  if (!APP_ID || !isPushCapable()) return Promise.resolve()
  if (!initPromise) {
    initPromise = OneSignal.init({
      appId: APP_ID,
      serviceWorkerPath: 'onesignal/OneSignalSDKWorker.js',
      serviceWorkerParam: { scope: '/onesignal/' },
      allowLocalhostAsSecureOrigin: import.meta.env.DEV,
    }).catch((err: unknown) => {
      unavailable = true
      console.error('[GitBit] OneSignal.init() failed — GitBit Daily notifications unavailable:', err)
    })
  }
  return initPromise
}

export const oneSignalAdapter: NotificationProviderAdapter = {
  id: 'onesignal',

  initialize,

  isSupported() {
    return isPushCapable() && Boolean(APP_ID)
  },

  getPermissionState() {
    if (!isPushCapable()) return 'unsupported'
    if (unavailable) return 'unavailable'
    return Notification.permission as NotificationPermissionState
  },

  async requestPermission() {
    if (!isPushCapable()) return 'unsupported'
    await initialize()
    if (unavailable) return 'unavailable'
    await OneSignal.Notifications.requestPermission()
    return Notification.permission as NotificationPermissionState
  },
}
