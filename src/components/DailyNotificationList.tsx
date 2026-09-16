import { Link } from 'react-router-dom'
import { dailyContent } from '@/services/content'
import { recentSentDailyItems } from '@/services/dailySelection'
import { cn } from '@/utils/cn'
import { Text } from '@/components/ui/Typography'

const RECENT_COUNT = 7

/** Local calendar days, not UTC ones: the push goes out at 09:00 UTC, which is still "today" for the reader wherever they are. */
function localDayNumber(date: Date) {
  return Math.round(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86_400_000)
}

function formatSentAt(sentAt: Date, now: Date) {
  const daysAgo = localDayNumber(now) - localDayNumber(sentAt)
  if (daysAgo === 0) return 'Today'
  if (daysAgo === 1) return 'Yesterday'
  return sentAt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export interface DailyNotificationListProps {
  /** Marks the newest entry as unread — the state at the moment the panel opened, since opening it clears the dot. */
  newestUnread?: boolean
  /** Called when an entry is followed, so a hosting Dialog can close. */
  onNavigate?: () => void
}

/**
 * The GitBit Daily pushes already sent, newest first, shown in the header
 * bell's panel. Built from the same rotation the cron uses
 * (`recentSentDailyItems`) rather than the OS tray, which the user can
 * clear — so the history doesn't disappear once a notification is read.
 */
export function DailyNotificationList({ newestUnread = false, onNavigate }: DailyNotificationListProps) {
  const now = new Date()
  const sent = recentSentDailyItems(dailyContent, RECENT_COUNT, now)
  if (sent.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <Text variant="caption" tone="tertiary" className="font-semibold tracking-wide uppercase">
        Recent notifications
      </Text>
      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
        {sent.map(({ item, sentAt }, index) => {
          const unread = newestUnread && index === 0
          return (
            <li key={sentAt.getTime()}>
              <Link
                to="/daily"
                onClick={onNavigate}
                className="flex gap-3 px-4 py-3 transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none"
              >
                <span
                  aria-hidden="true"
                  className={cn('mt-2 size-2 shrink-0 rounded-full', unread ? 'bg-danger' : 'bg-transparent')}
                />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="flex items-center justify-between gap-2">
                    <Text as="span" variant="body-sm" className="truncate font-semibold">
                      {unread && <span className="sr-only">Unread: </span>}
                      {item.title}
                    </Text>
                    <Text as="span" variant="caption" tone="tertiary" className="shrink-0">
                      {formatSentAt(sentAt, now)}
                    </Text>
                  </span>
                  <Text as="span" variant="body-sm" tone="secondary" className="line-clamp-2">
                    {item.body}
                  </Text>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
