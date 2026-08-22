import { useParams } from 'react-router-dom'
import { getCommandBySlug, getRelatedCommands } from '@/services/content'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Heading, Text } from '@/components/ui/Typography'
import { DangerBadge } from '@/components/ui/Badge'
import { CommandBlock } from '@/components/ui/CommandBlock'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { CommandCard } from '@/components/cards'

export default function CommandDetailPage() {
  const { commandSlug } = useParams()
  const command = commandSlug ? getCommandBySlug(commandSlug) : undefined

  if (!command) {
    return <EmptyState title="Command not found" description="That command isn't in GitBit Quick yet." />
  }

  const related = getRelatedCommands(command)

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <Breadcrumbs items={[{ label: 'Quick', to: '/quick' }, { label: command.command }]} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <code className="font-mono text-2xl font-semibold text-foreground">{command.command}</code>
          <DangerBadge level={command.dangerLevel} />
        </div>
        <Text variant="body-lg" tone="secondary">
          {command.humanMeaning}
        </Text>
      </div>

      <Text variant="body">{command.technicalMeaning}</Text>

      <CommandBlock command={command.example} anatomy={command.anatomy} />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Heading level={4}>When to use it</Heading>
          <Text tone="secondary">{command.whenToUse}</Text>
        </div>
        <div className="flex flex-col gap-1.5">
          <Heading level={4}>Mental model</Heading>
          <Text tone="secondary">{command.mentalModel}</Text>
        </div>
        {command.whatHappens && (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Heading level={4}>What actually happens</Heading>
            <Text tone="secondary">{command.whatHappens}</Text>
          </div>
        )}
      </div>

      {command.commonMistake && (
        <Alert variant="warning" title="Common mistake">
          {command.commonMistake}
        </Alert>
      )}

      {related.length > 0 && (
        <div className="flex flex-col gap-3">
          <Heading level={4}>Related commands</Heading>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((r) => (
              <CommandCard key={r.slug} command={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
