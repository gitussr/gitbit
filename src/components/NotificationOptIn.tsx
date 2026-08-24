import { Bell, BellOff, X } from 'lucide-react'
import { useNotificationPermission } from '@/hooks/useNotificationPermission'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Alert } from '@/components/ui/Alert'
import { Heading, Text } from '@/components/ui/Typography'

/**
 * GitBit Daily opt-in (Section 14/27). Renders one of five calm states —
 * never the browser's native prompt on mount, only from the button here.
 * Provider-agnostic: reads `useNotificationPermission`, which reads
 * `NotificationService` — swapping in OneSignal later changes neither.
 */
export function NotificationOptIn() {
  const { state, supported, dismissed, error, requestPermission, dismiss } = useNotificationPermission()

  if (!supported) {
    return (
      <Alert variant="info" icon={<BellOff className="size-4.5" aria-hidden="true" />}>
        Your current browser does not support GitBit notifications.
      </Alert>
    )
  }

  if (state === 'granted') {
    return (
      <Alert variant="success" title="🔔 GitBit Daily is on">
        You'll get one useful GitBit a day — a command, an aha moment, or a small Git concept.
      </Alert>
    )
  }

  if (state === 'denied') {
    return (
      <Alert variant="warning" title="Notifications are blocked">
        Notifications are currently blocked in your browser settings. You can turn them back on anytime from your
        browser's site permissions.
      </Alert>
    )
  }

  if (state === 'unavailable') {
    return (
      <Alert variant="info" icon={<BellOff className="size-4.5" aria-hidden="true" />}>
        GitBit Daily notifications aren't available in this environment — they're live on the deployed app.
      </Alert>
    )
  }

  if (error) {
    return (
      <Alert variant="danger" title="Something went wrong">
        We couldn't enable notifications right now. Please try again later.
      </Alert>
    )
  }

  if (dismissed) return null

  return (
    <div className="relative flex flex-col gap-3 rounded-xl border border-accent-border bg-accent-subtle p-6">
      <IconButton
        icon={<X aria-hidden="true" />}
        label="Dismiss"
        size="sm"
        className="absolute top-3 right-3"
        onClick={dismiss}
      />
      <Bell className="size-5 text-accent-strong" aria-hidden="true" />
      <div className="flex flex-col gap-1 pr-8">
        <Heading level={2} size={4}>
          Get one useful GitBit a day
        </Heading>
        <Text tone="secondary">A command, an aha moment, or a small Git concept — delivered once a day.</Text>
      </div>
      <Button className="self-start" onClick={requestPermission}>
        Enable GitBit Daily
      </Button>
    </div>
  )
}
