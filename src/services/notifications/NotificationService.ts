import { nativeAdapter } from './nativeAdapter'
import type { NotificationPermissionState, NotificationProviderAdapter } from './types'

/**
 * Single entry point feature code uses for notifications — never import
 * an adapter or a provider SDK directly outside this file (Section 13).
 * Swapping providers later means changing the one line below, not every
 * call site.
 */
const activeAdapter: NotificationProviderAdapter = nativeAdapter

export const NotificationService = {
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
