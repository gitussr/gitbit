import { useNotificationPermission } from '@/hooks/useNotificationPermission'
import { NotificationStatus } from '@/components/NotificationStatus'

/**
 * GitBit Daily opt-in, embedded on /daily (Section 14/27). Renders one of
 * five calm states via `NotificationStatus` — never the browser's native
 * prompt on mount, only from the button there. Provider-agnostic: reads
 * `useNotificationPermission`, which reads `NotificationService` —
 * swapping in OneSignal later changes neither.
 */
export function NotificationOptIn() {
  const permission = useNotificationPermission()
  return <NotificationStatus {...permission} dismissible />
}
