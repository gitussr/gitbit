import { Link } from 'react-router-dom'
import { learnLevels, getConceptsForLevel, getCommandsForLevel } from '@/services/content'
import { Heading, Text } from '@/components/ui/Typography'
import { Badge } from '@/components/ui/Badge'
import { cardClassName } from '@/components/ui/Card'

export default function LearnPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading level={1}>GitBit Learn</Heading>
        <Text tone="secondary" className="mt-2">
          A structured path from "what is Git" to branching, collaboration, and undoing mistakes with confidence.
        </Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {learnLevels.map((level) => {
          const itemCount = getConceptsForLevel(level).length + getCommandsForLevel(level).length
          return (
            <Link key={level.slug} to={`/learn/${level.slug}`} className={cardClassName(true, 'flex flex-col gap-3')}>
              <div className="flex items-center justify-between gap-2">
                <Badge variant="accent">Level {level.order}</Badge>
                <Text variant="caption" tone="tertiary">
                  {itemCount} {itemCount === 1 ? 'topic' : 'topics'}
                </Text>
              </div>
              <Heading level={3}>{level.title}</Heading>
              <Text tone="secondary">{level.description}</Text>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
