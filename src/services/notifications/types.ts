/**
 * GitBit notification abstraction (Section 13).
 *
 * Feature code and UI depend only on this file and `NotificationService`
 * (never on a provider SDK directly), so the provider behind
 * `NotificationProviderAdapter` can be swapped without touching
 * GitBit Daily, permission UX, or content.
 */

export type NotificationPermissionState = 'unsupported' | 'default' | 'granted' | 'denied'

/** The seam a real provider (currently OneSignal) plugs into. */
export interface NotificationProviderAdapter {
  readonly id: string
  /** Loads/registers the provider SDK. Never shows a permission prompt by itself. Safe to call repeatedly. */
  initialize(): Promise<void>
  isSupported(): boolean
  getPermissionState(): NotificationPermissionState
  requestPermission(): Promise<NotificationPermissionState>
}
