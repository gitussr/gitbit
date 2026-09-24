import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { useNotificationPermission } from '@/hooks/useNotificationPermission'
import { useUnreadDailyNotification } from '@/hooks/useUnreadDailyNotification'
import { NotificationStatus } from '@/components/NotificationStatus'
import { IconButton } from '@/components/ui/IconButton'
import { Dialog } from '@/components/ui/Dialog'

/** Reads the Daily content bank, so it loads with the open panel, not with every page. */
const DailyNotificationList = lazy(() =>
  import('@/components/DailyNotificationList').then((module) => ({ default: module.DailyNotificationList })),
)

/**
 * Header-wide access point for GitBit Daily notifications (Section 14/27):
 * a bell that reflects the current permission state and opens the same
 * `NotificationStatus` panel used on /daily. Also auto-opens once per
 * visitor on landing, while the state is still undecided — closing it
 * without deciding marks it dismissed so it isn't asked again (mirrors
 * the embedded card's dismiss behavior in `useNotificationPermission`).
 *
 * Carries the unread dot for an undismissed GitBit Daily push. It lives on
 * the bell rather than the logo because that's where a notification
 * indicator is looked for — and because the logo's only action is "go
 * home", which has nothing to do with having read anything.
 *
 * `useUnreadDailyNotification` is called before the `supported` bail-out so
 * the home-screen badge keeps being maintained even where no bell renders.
 */
export function NotificationBell() {
  const permission = useNotificationPermission()
  const { state, supported, dismissed, ready, dismiss } = permission
  const { unread, markRead } = useUnreadDailyNotification()
  const [open, setOpen] = useState(false)
  // Snapshot of `unread` when the panel opens — opening it clears the dot, but the newest entry should still read as new.
  const [openedWithUnread, setOpenedWithUnread] = useState(false)
  const autoPrompted = useRef(false)

  useEffect(() => {
    // Waits for the page to settle, not for the provider SDK — that loads only
    // if they choose "Enable" (useNotificationPermission).
    if (autoPrompted.current || !ready || dismissed || state !== 'default') return
    autoPrompted.current = true
    setOpen(true)
  }, [dismissed, ready, state])

  if (!supported) return null

  const close = () => {
    setOpen(false)
    // 'unavailable' too: the SDK is only tried once they click "Enable", so a
    // visitor whose ad blocker stops it learns that here — and closing it must
    // stop the prompt, or it would greet them again on every visit.
    if (state === 'default' || state === 'unavailable') dismiss()
  }

  /** Opening the panel is the acknowledgement — it clears the tray notification and the badge with it. */
  const openPanel = () => {
    setOpenedWithUnread(unread)
    setOpen(true)
    void markRead()
  }

  const icon = state === 'granted' || state === 'default' ? <Bell aria-hidden="true" /> : <BellOff aria-hidden="true" />

  return (
    <>
      <span className="relative inline-flex shrink-0">
        <IconButton
          icon={icon}
          label={unread ? 'GitBit Daily notifications — 1 unread' : 'GitBit Daily notifications'}
          size="sm"
          onClick={openPanel}
        />
        {unread && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 size-2 rounded-full bg-danger ring-2 ring-background"
          />
        )}
      </span>
      <Dialog open={open} onClose={close} title="GitBit Daily notifications">
        <div className="flex flex-col gap-5">
          <NotificationStatus {...permission} />
          {state === 'granted' && (
            <Suspense fallback={null}>
              <DailyNotificationList newestUnread={openedWithUnread} onNavigate={() => setOpen(false)} />
            </Suspense>
          )}
        </div>
      </Dialog>
    </>
  )
}
