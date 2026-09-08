import { Lightbulb, BookOpen, Terminal, GitCompare, AlertTriangle, MapPin, Sparkles, Brain, Trophy } from 'lucide-react'
import { dailyContent } from '@/services/content'
import { selectDailyItem } from '@/services/dailySelection'
import type { DailyContentType } from '@/content/types'
import { Heading, Text } from '@/components/ui/Typography'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { NotificationOptIn } from '@/components/NotificationOptIn'

const typeMeta: Record<DailyContentType, { label: string; icon: typeof Lightbulb }> = {
  aha: { label: 'Aha', icon: Lightbulb },
  vocabulary: { label: 'Vocabulary', icon: BookOpen },
  command: { label: 'Command', icon: Terminal },
  comparison: { label: 'Compare', icon: GitCompare },
  'common-mistake': { label: 'Common mistake', icon: AlertTriangle },
  scenario: { label: 'Real-world scenario', icon: MapPin },
  'did-you-know': { label: 'Did you know', icon: Sparkles },
  recall: { label: 'Recall', icon: Brain },
  'mini-challenge': { label: 'Mini challenge', icon: Trophy },
}

export default function DailyPage() {
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
        <div className="flex flex-col gap-3 rounded-xl border border-accent-border bg-accent-subtle p-6">
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
        </div>
      )}

      <div className="flex flex-col gap-3">
        {rest.map((item) => {
          const Icon = typeMeta[item.type].icon
          return (
            <Card key={item.slug} className="flex gap-3">
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
            </Card>
          )
        })}
      </div>
    </div>
  )
}
