import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { commands, getConceptBySlug, getDailyBySlug, getLevelForConcept } from '@/services/content'
import { dailyTypeMeta } from './dailyTypeMeta'
import { useUnreadDailyNotification } from '@/hooks/useUnreadDailyNotification'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Heading, Text } from '@/components/ui/Typography'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cardClassName } from '@/components/ui/Card'

/**
 * A single GitBit Daily bit — where a tapped push notification and an entry
 * in the header bell's list both land, so the reader sees the bit they
 * tapped rather than whichever one heads the feed today.
 */
export default function DailyDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const item = slug ? getDailyBySlug(slug) : undefined
  const { markRead } = useUnreadDailyNotification()

  // Opening the bit is reading it, same as visiting /daily.
  useEffect(() => {
    void markRead()
  }, [markRead])

  if (!item) {
    return <EmptyState title="GitBit not found" description="That one isn't in GitBit Daily any more." />
  }

  const { label, icon: Icon } = dailyTypeMeta[item.type]
  const relatedConcepts = (item.relatedConcepts ?? []).map(getConceptBySlug).filter((c) => c !== undefined)
  const relatedCommands = (item.relatedCommands ?? [])
    .map((text) => commands.find((command) => command.command === text))
    .filter((c) => c !== undefined)

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <Breadcrumbs items={[{ label: 'Daily', to: '/daily' }, { label: item.title }]} />

      <div className="flex flex-col gap-4 rounded-xl border border-accent-border bg-accent-subtle p-8">
        <div className="flex items-center gap-2">
          <Icon className="size-5 text-accent-strong" aria-hidden="true" />
          <Badge variant="accent">{label}</Badge>
        </div>
        <Heading level={1} size={2} className="leading-snug">
          {item.title}
        </Heading>
        <Text variant="body-lg" className="whitespace-pre-line text-foreground">
          {item.body}
        </Text>
      </div>

      {(relatedConcepts.length > 0 || relatedCommands.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {relatedConcepts.map((concept) => {
            const level = getLevelForConcept(concept.slug)
            return (
              <Link
                key={concept.slug}
                to={level ? `/learn/${level.slug}/${concept.slug}` : '/learn'}
                className={cardClassName(true, 'px-3 py-1.5 text-sm')}
              >
                {concept.term}
              </Link>
            )
          })}
          {relatedCommands.map((command) => (
            <Link key={command.slug} to={`/quick/${command.slug}`} className={cardClassName(true, 'px-3 py-1.5 font-mono text-sm')}>
              {command.command}
            </Link>
          ))}
        </div>
      )}

      <Button variant="secondary" trailingIcon={<ArrowRight aria-hidden="true" />} onClick={() => navigate('/daily')} className="self-start">
        All GitBit Daily
      </Button>
    </div>
  )
}
