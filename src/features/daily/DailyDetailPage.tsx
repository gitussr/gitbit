import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { commands, getConceptBySlug, getDailyBySlug, getLevelForConcept } from '@/services/content'
import { dailyTypeMeta } from './dailyTypeMeta'
import { useUnreadDailyNotification } from '@/hooks/useUnreadDailyNotification'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Heading, Text } from '@/components/ui/Typography'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ChipLink } from '@/components/ui/ChipLink'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * A single GitBit Daily bit — where a tapped push notification and an entry
 * in the header bell's list both land, so the reader sees the bit they
 * tapped rather than whichever one heads the feed today.
 */
export default function DailyDetailPage() {
  const { slug } = useParams()
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
    <div className="flex max-w-2xl flex-col gap-5">
      <Breadcrumbs items={[{ label: 'Daily', to: '/daily' }, { label: item.title }]} />

      <Card variant="accent" className="flex flex-col gap-2.5 p-5">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-accent-strong" aria-hidden="true" />
          <Badge variant="accent">{label}</Badge>
        </div>
        <Heading level={1} size={2}>
          {item.title}
        </Heading>
        <Text variant="body-lg" className="whitespace-pre-line">
          {item.body}
        </Text>
      </Card>

      {(relatedConcepts.length > 0 || relatedCommands.length > 0) && (
        <div className="flex flex-col gap-2">
          <Heading level={2} size={4}>
            Related
          </Heading>
          <div className="flex flex-wrap gap-2">
            {relatedConcepts.map((concept) => {
              const level = getLevelForConcept(concept.slug)
              return (
                <ChipLink key={concept.slug} to={level ? `/learn/${level.slug}/${concept.slug}` : '/learn'}>
                  {concept.term}
                </ChipLink>
              )
            })}
            {relatedCommands.map((command) => (
              <ChipLink key={command.slug} to={`/quick/${command.slug}`} code>
                {command.command}
              </ChipLink>
            ))}
          </div>
        </div>
      )}

      <ButtonLink to="/daily" variant="secondary" leadingIcon={<ArrowLeft aria-hidden="true" />} className="self-start">
        All GitBit Daily
      </ButtonLink>
    </div>
  )
}
