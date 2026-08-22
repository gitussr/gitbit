import { useMemo, useState } from 'react'
import { Terminal } from 'lucide-react'
import { commands } from '@/services/content'
import type { DangerLevel } from '@/content/types'
import { Heading, Text } from '@/components/ui/Typography'
import { SearchInput } from '@/components/ui/SearchInput'
import { Tag } from '@/components/ui/Tag'
import { EmptyState } from '@/components/ui/EmptyState'
import { CommandCard } from '@/components/cards'

const dangerFilters: { value: DangerLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'All commands' },
  { value: 'safe', label: 'Safe / everyday' },
  { value: 'caution', label: 'Understand first' },
  { value: 'high-caution', label: 'High caution' },
]

export default function QuickPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<DangerLevel | 'all'>('all')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return commands.filter((command) => {
      const matchesFilter = filter === 'all' || command.dangerLevel === filter
      const matchesQuery =
        !q || `${command.command} ${command.humanMeaning} ${command.whenToUse}`.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [query, filter])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading level={1}>GitBit Quick</Heading>
        <Text tone="secondary" className="mt-2">
          Fast answers to "what command do I need?"
        </Text>
      </div>

      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery('')}
        placeholder="Search commands — try “undo” or “branch”…"
        className="max-w-xl"
      />

      <div className="flex flex-wrap gap-2">
        {dangerFilters.map((item) => (
          <Tag key={item.value} selected={filter === item.value} onClick={() => setFilter(item.value)}>
            {item.label}
          </Tag>
        ))}
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<Terminal className="size-6" aria-hidden="true" />}
          title="No commands match that search"
          description="Try a different word, or clear the filter above."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((command) => (
            <CommandCard key={command.slug} command={command} />
          ))}
        </div>
      )}
    </div>
  )
}
