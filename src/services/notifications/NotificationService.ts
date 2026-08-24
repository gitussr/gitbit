import { oneSignalAdapter } from './oneSignalAdapter'
import type { NotificationPermissionState, NotificationProviderAdapter } from './types'

/**
 * Single entry point feature code uses for notifications — never import
 * an adapter or a provider SDK directly outside this file (Section 13).
 * Swapping providers later means changing the one line below, not every
 * call site.
 */
const activeAdapter: NotificationProviderAdapter = oneSignalAdapter

export const NotificationService = {
  initialize(): Promise<void> {
    return activeAdapter.initialize()
  },
  isSupported(): boolean {
    return activeAdapter.isSupported()
  },
  getPermissionState(): NotificationPermissionState {
    return activeAdapter.getPermissionState()
  },
  requestPermission(): Promise<NotificationPermissionState> {
    return activeAdapter.requestPermission()
  },
}

export type { NotificationPermissionState } from './types'
