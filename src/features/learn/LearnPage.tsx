import { Link } from 'react-router-dom'
import { learnLevels, getConceptsForLevel, getCommandsForLevel } from '@/services/content'
import { Heading, Text } from '@/components/ui/Typography'
import { PageHeader } from '@/components/ui/PageHeader'
import { cardClassName } from '@/components/ui/Card'
import { GitStateFlow } from '@/components/ui/GitStateFlow'

export default function LearnPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="GitBit Learn"
        description={'A structured path from "what is Git" to branching, collaboration, and undoing mistakes with confidence.'}
      />

      {/* Section 3: the state model comes before the levels, because every level below is a way of moving work along it. */}
      <div className="flex flex-col gap-2">
        <Heading level={2} size={3}>
          Where your work lives
        </Heading>
        <Text tone="secondary">
          Almost every Git command is a way of moving your work between these four places. Knowing which one you are in
          explains most of what Git does.
        </Text>
        <GitStateFlow className="mt-1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {learnLevels.map((level) => {
          const itemCount = getConceptsForLevel(level).length + getCommandsForLevel(level).length
          return (
            <Link key={level.slug} to={`/learn/${level.slug}`} className={cardClassName(true, 'flex gap-3')}>
              <span className="flex size-9 shrink-0 items-center justify-center bg-accent font-mono text-sm font-bold text-on-accent">
                {level.order}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <Text as="p" className="font-semibold">
                    {level.title}
                  </Text>
                  <Text as="span" variant="caption" tone="tertiary" className="shrink-0">
                    {itemCount} {itemCount === 1 ? 'topic' : 'topics'}
                  </Text>
                </div>
                <Text variant="body-sm" tone="secondary" className="line-clamp-2">
                  {level.description}
                </Text>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
