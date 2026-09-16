import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dailyContent } from '@/services/content'
import { selectDailyItem } from '@/services/dailySelection'
import { dailyTypeMeta as typeMeta } from './dailyTypeMeta'
import { Heading, Text } from '@/components/ui/Typography'
import { Badge } from '@/components/ui/Badge'
import { cardClassName } from '@/components/ui/Card'
import { NotificationOptIn } from '@/components/NotificationOptIn'
import { useUnreadDailyNotification } from '@/hooks/useUnreadDailyNotification'

export default function DailyPage() {
  const { markRead } = useUnreadDailyNotification()

  // Reaching this page is the point the day's bit has actually been read, so
  // it dismisses the tray notification, the header bell's dot and the
  // home-screen badge together.
  useEffect(() => {
    void markRead()
  }, [markRead])

  // Shared with the cron job that pushes it (api/daily-push.ts) so the
  // notification and this card never name different bits.
  const today = selectDailyItem(dailyContent)
  const rest = dailyContent.filter((item) => item.slug !== today?.slug)

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <Heading level={1}>GitBit Daily</Heading>
        <Text tone="secondary" className="mt-2">
          One small, useful thing about Git — every day.
        </Text>
      </div>

      <NotificationOptIn />

      {today && (
        <Link
          to={`/daily/${today.slug}`}
          className={cardClassName(true, 'flex flex-col gap-3 rounded-xl border-accent-border bg-accent-subtle p-6')}
        >
          <div className="flex items-center gap-2">
            <Text variant="caption" className="font-semibold tracking-wide text-accent-strong uppercase">
              Today's GitBit
            </Text>
            <Badge variant="accent">{typeMeta[today.type].label}</Badge>
          </div>
          <Heading level={2}>{today.title}</Heading>
          <Text variant="body-lg" className="whitespace-pre-line text-foreground">
            {today.body}
          </Text>
        </Link>
      )}

      <div className="flex flex-col gap-3">
        {rest.map((item) => {
          const Icon = typeMeta[item.type].icon
          return (
            <Link key={item.slug} to={`/daily/${item.slug}`} className={cardClassName(true, 'flex gap-3')}>
              <Icon className="mt-0.5 size-5 shrink-0 text-foreground-tertiary" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Text className="font-semibold">{item.title}</Text>
                  <Badge variant="neutral">{typeMeta[item.type].label}</Badge>
                </div>
                <Text tone="secondary" className="whitespace-pre-line">
                  {item.body}
                </Text>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
