import { Link } from 'react-router-dom'
import type { GitCommand } from '@/content/types'
import { cardClassName } from '@/components/ui/Card'
import { DangerBadge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'

export function CommandCard({ command }: { command: GitCommand }) {
  return (
    <Link to={`/quick/${command.slug}`} className={cardClassName(true, 'flex flex-col gap-3')}>
      <div className="flex items-start justify-between gap-2">
        <code className="font-mono text-sm font-semibold text-accent">{command.command}</code>
        <DangerBadge level={command.dangerLevel} />
      </div>
      <Heading level={4} className="text-base">
        {command.humanMeaning}
      </Heading>
      <Text variant="body-sm" tone="secondary" className="line-clamp-2">
        {command.whenToUse}
      </Text>
    </Link>
  )
}
