import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { dailyContent } from '@/services/content'
import { selectDailyItem } from '@/services/dailySelection'
import { dailyTypeMeta as typeMeta } from './dailyTypeMeta'
import { Heading, Text } from '@/components/ui/Typography'
import { Badge } from '@/components/ui/Badge'
import { cardClassName } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
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
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="GitBit Daily" description="One small, useful thing about Git — every day." />

      <NotificationOptIn />

      {today && (
        <Link
          to={`/daily/${today.slug}`}
          className={cardClassName(true, 'group flex flex-col gap-2 p-5')}
        >
          <div className="flex items-center gap-2">
            <Badge variant="accent">Today</Badge>
            <Text as="span" variant="caption" className="font-bold">
              {typeMeta[today.type].label}
            </Text>
          </div>
          <Heading level={2} size={3}>
            {today.title}
          </Heading>
          <Text variant="body-lg" className="whitespace-pre-line">
            {today.body}
          </Text>
          <Text
            as="span"
            variant="body-sm"
            className="mt-1 inline-flex items-center gap-1 font-bold"
          >
            Open
            <ArrowRight
              className="size-3.5 transition-transform duration-200 ease-standard group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Text>
        </Link>
      )}

      <section className="flex flex-col gap-4">
        <Heading level={2} size={4}>
          More GitBits
        </Heading>
        {rest.map((item) => {
          const Icon = typeMeta[item.type].icon
          return (
            <Link key={item.slug} to={`/daily/${item.slug}`} className={cardClassName(true, 'flex gap-3 p-3.5')}>
              <Icon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <Text as="p" className="truncate font-semibold">
                    {item.title}
                  </Text>
                  <Badge variant="neutral">{typeMeta[item.type].label}</Badge>
                </div>
                <Text variant="body-sm" tone="secondary" className="line-clamp-2 whitespace-pre-line">
                  {item.body}
                </Text>
              </div>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
