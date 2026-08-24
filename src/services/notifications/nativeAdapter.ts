import type { NotificationPermissionState, NotificationProviderAdapter } from './types'

function isPushCapable() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * Placeholder adapter used until a real provider is wired in (Section 12
 * decision: OneSignal, not yet implemented). It only surfaces the
 * browser's native permission state — no subscription, no delivery.
 * OneSignal's own SDK also drives this same native permission prompt, so
 * the permission UX built against this adapter carries over unchanged
 * once the OneSignal adapter replaces it.
 */
export const nativeAdapter: NotificationProviderAdapter = {
  id: 'native',

  isSupported() {
    return isPushCapable()
  },

  getPermissionState() {
    if (!isPushCapable()) return 'unsupported'
    return Notification.permission as NotificationPermissionState
  },

  async requestPermission() {
    if (!isPushCapable()) return 'unsupported'
    const result = await Notification.requestPermission()
    return result as NotificationPermissionState
  },
}
