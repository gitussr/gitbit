import { Bell, BellOff, X } from 'lucide-react'
import type { useNotificationPermission } from '@/hooks/useNotificationPermission'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Alert } from '@/components/ui/Alert'
import { Heading, Text } from '@/components/ui/Typography'

export interface NotificationStatusProps extends ReturnType<typeof useNotificationPermission> {
  /** Wraps the ask state in its own bordered card with a dismiss X (the /daily embed). Dialog-hosted callers leave this false — the Dialog owns the chrome and its own close button. */
  dismissible?: boolean
}

/**
 * The five calm states (Section 14/27) shared by every surface that asks
 * about GitBit Daily notifications — the embedded /daily card, the landing
 * popup, and the header bell's panel — so they can't drift out of sync.
 */
export function NotificationStatus({
  state,
  supported,
  error,
  dismissed,
  requestPermission,
  dismiss,
  dismissible = false,
}: NotificationStatusProps) {
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
        Couldn't load GitBit Daily notifications — this is often caused by an ad blocker or privacy extension. Try
        allowing this site if you'd like to enable them.
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

  if (dismissible && dismissed) return null

  if (!dismissible) {
    return (
      <div className="flex flex-col gap-3">
        <Bell className="size-5 text-accent-strong" aria-hidden="true" />
        <div className="flex flex-col gap-1">
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
