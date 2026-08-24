/**
 * GitBit notification abstraction (Section 13).
 *
 * Feature code and UI depend only on this file and `NotificationService`
 * (never on a provider SDK directly), so the provider behind
 * `NotificationProviderAdapter` can be swapped without touching
 * GitBit Daily, permission UX, or content.
 */

export type NotificationPermissionState = 'unsupported' | 'default' | 'granted' | 'denied'

/** The seam a real provider (OneSignal, FCM, native Web Push) plugs into. */
export interface NotificationProviderAdapter {
  readonly id: string
  isSupported(): boolean
  getPermissionState(): NotificationPermissionState
  requestPermission(): Promise<NotificationPermissionState>
}
