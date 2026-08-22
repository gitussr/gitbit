import { useMemo, useState } from 'react'
import { commands } from '@/services/content'
import { Heading, Text } from '@/components/ui/Typography'
import { SearchInput } from '@/components/ui/SearchInput'
import { TerminalBlock } from '@/components/ui/TerminalBlock'
import { EmptyState } from '@/components/ui/EmptyState'

export default function TerminalPage() {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((command) => command.command.toLowerCase().includes(q))
  }, [query])

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Heading level={1}>GitBit Terminal</Heading>
        <Text tone="secondary" className="mt-2">
          A terminal-inspired way to see what a command actually does — for learning, not replacing your real terminal.
        </Text>
      </div>

      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery('')}
        placeholder="Try “status”, “commit”, “push”…"
      />

      {results.length === 0 ? (
        <EmptyState title="No matching commands" description="Try a different word." />
      ) : (
        <div className="flex flex-col gap-4">
          {results.map((command) => (
            <TerminalBlock
              key={command.slug}
              command={command.example}
              gitSays={command.whatHappens}
              humanTranslation={command.humanMeaning}
            />
          ))}
        </div>
      )}
    </div>
  )
}
