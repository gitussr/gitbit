import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'
import { search, type SearchResultType } from '@/services/content'
import { PageHeader } from '@/components/ui/PageHeader'
import { Text } from '@/components/ui/Typography'
import { SearchInput } from '@/components/ui/SearchInput'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { cardClassName } from '@/components/ui/Card'

const typeLabel: Record<SearchResultType, string> = {
  command: 'Command',
  concept: 'Concept',
  aha: 'Aha',
  sos: 'SOS',
  comparison: 'Compare',
}

export default function SearchPage() {
  // Seeded from ?q= so the palette's "see all results" arrives with the query intact.
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const results = useMemo(() => search(query), [query])

  const onQueryChange = (next: string) => {
    setQuery(next)
    // `replace` so typing doesn't stack a history entry per keystroke.
    setSearchParams(next ? { q: next } : {}, { replace: true })
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <PageHeader title="Search" description={'Commands, concepts, comparisons, Aha explanations, and SOS guides — all in one place.'} />

      <SearchInput
        aria-label="Search GitBit"
        autoFocus
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onClear={() => onQueryChange('')}
        placeholder="Try “undo commit”, “branch”, “merge conflict”…"
      />

      {query.trim() === '' ? (
        <EmptyState icon={<SearchIcon className="size-6" aria-hidden="true" />} title="Start typing to search" />
      ) : results.length === 0 ? (
        <EmptyState title="No results" description="Try a different word." />
      ) : (
        <ul className="flex flex-col gap-4">
          {results.map((result) => (
            <li key={`${result.type}-${result.slug}`}>
              <Link to={result.href} className={cardClassName(true, 'flex flex-col gap-1 p-3.5')}>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{typeLabel[result.type]}</Badge>
                  <Text as="p" className="truncate font-semibold">{result.title}</Text>
                </div>
                <Text variant="body-sm" tone="secondary" className="line-clamp-2">
                  {result.snippet}
                </Text>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
