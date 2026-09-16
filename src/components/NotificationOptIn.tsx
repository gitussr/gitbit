import { useNotificationPermission } from '@/hooks/useNotificationPermission'
import { NotificationStatus } from '@/components/NotificationStatus'

/**
 * GitBit Daily opt-in, embedded on /daily (Section 14/27). Renders one of
 * the calm states via `NotificationStatus` (nothing once granted) — never the browser's native
 * prompt on mount, only from the button there. Provider-agnostic: reads
 * `useNotificationPermission`, which reads `NotificationService` —
 * swapping in OneSignal later changes neither.
 */
export function NotificationOptIn() {
  const permission = useNotificationPermission()
  // Once on, there's nothing left to ask here — the header bell still shows the confirmation.
  if (permission.state === 'granted') return null
  return <NotificationStatus {...permission} dismissible />
}
