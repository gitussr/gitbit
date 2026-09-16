import { Link } from 'react-router-dom'
import type { GitCommand } from '@/content/types'
import { cardClassName } from '@/components/ui/Card'
import { DangerBadge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Typography'

export function CommandCard({ command }: { command: GitCommand }) {
  return (
    <Link to={`/quick/${command.slug}`} className={cardClassName(true, 'flex flex-col gap-1.5')}>
      <div className="flex items-center justify-between gap-2">
        <code className="truncate font-mono text-sm font-bold text-accent">{command.command}</code>
        <DangerBadge level={command.dangerLevel} />
      </div>
      <Text as="p" className="font-semibold">
        {command.humanMeaning}
      </Text>
      <Text variant="body-sm" tone="secondary" className="line-clamp-2">
        {command.whenToUse}
      </Text>
    </Link>
  )
}
