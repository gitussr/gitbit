import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'
import { search, type SearchResultType } from '@/services/content'
import { Badge } from '@/components/ui/Badge'
import { Kbd } from '@/components/ui/Kbd'
import { Text } from '@/components/ui/Typography'
import { cn } from '@/utils/cn'

/** Kept short on purpose — a palette is for jumping somewhere, not for browsing. */
const MAX_RESULTS = 7

const typeLabel: Record<SearchResultType, string> = {
  command: 'Command',
  concept: 'Concept',
  aha: 'Aha',
  sos: 'SOS',
  comparison: 'Compare',
}

interface PaletteItem {
  key: string
  href: string
  title: string
  snippet?: string
  type?: SearchResultType
}

export interface SearchPaletteProps {
  onClose: () => void
}

/**
 * Keyboard-first search over the whole knowledge base (Section 20), opened
 * with Cmd/Ctrl-K or the header's search button.
 *
 * Built on the native `<dialog>`, like `Dialog` — `showModal()` gives the
 * focus trap and Escape for free. It doesn't reuse `Dialog` itself because
 * that primitive owns a title bar and padding a palette shouldn't have.
 *
 * Mounted only while open, rather than kept in the tree behind an `open`
 * prop. Mirroring the dialog's state in React lets the two drift, and once
 * they do — React holding `true` while the element is closed — asking to
 * open again sets the same value, no effect re-runs, and the palette is
 * dead until something else remounts it. Existing only while open makes
 * that unrepresentable, and each opening starts from a fresh, empty state
 * for free.
 */
export function SearchPalette({ onClose }: SearchPaletteProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const results = useMemo(() => search(query), [query])

  const items = useMemo<PaletteItem[]>(() => {
    const shown: PaletteItem[] = results.slice(0, MAX_RESULTS).map((result) => ({
      key: `${result.type}-${result.slug}`,
      href: result.href,
      title: result.title,
      snippet: result.snippet,
      type: result.type,
    }))

    // The full page is the way out when a query matches more than fits here.
    if (results.length > MAX_RESULTS) {
      shown.push({
        key: 'see-all',
        href: `/search?q=${encodeURIComponent(query)}`,
        title: `See all ${results.length} results`,
      })
    }
    return shown
  }, [results, query])

  useEffect(() => {
    ref.current?.showModal()
    inputRef.current?.focus()
  }, [])

  // Keep the highlighted row in view when arrowing past the visible edge.
  useEffect(() => {
    itemRefs.current[active]?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const go = (item: PaletteItem | undefined) => {
    if (!item) return
    onClose()
    navigate(item.href)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (items.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => (index + 1) % items.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => (index - 1 + items.length) % items.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      go(items[active])
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      aria-label="Search GitBit"
      className={cn(
        'm-0 mx-auto mt-[12vh] w-[97%] max-w-xl border-2 border-accent bg-surface p-0 text-foreground shadow-brutal',
        'backdrop:bg-palette-ink/50',
      )}
    >
      <div className="flex items-center gap-2 border-b-2 border-accent px-3 py-2.5">
        <SearchIcon className="size-4 shrink-0 text-foreground-tertiary" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Search commands, concepts, fixes…"
          aria-label="Search GitBit"
          role="combobox"
          aria-expanded={items.length > 0}
          aria-controls={items.length > 0 ? 'search-palette-results' : undefined}
          aria-activedescendant={items[active] ? `search-palette-${items[active].key}` : undefined}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-tertiary outline-none"
        />
      </div>

      {query.trim() !== '' && (
        <ul
          id="search-palette-results"
          role="listbox"
          aria-label="Search results"
          className="max-h-[50vh] overflow-y-auto"
        >
          {items.length === 0 ? (
            <li className="px-3 py-4">
              <Text variant="body-sm" tone="secondary">
                Nothing matches “{query.trim()}”.
              </Text>
            </li>
          ) : (
            items.map((item, index) => (
              <li
                key={item.key}
                id={`search-palette-${item.key}`}
                ref={(node) => {
                  itemRefs.current[index] = node
                }}
                role="option"
                aria-selected={index === active}
                onClick={() => go(item)}
                onMouseMove={() => setActive(index)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 border-b-2 border-accent/10 px-3 py-2.5 last:border-b-0',
                  index === active && 'bg-accent-subtle',
                )}
              >
                {item.type && <Badge variant="neutral">{typeLabel[item.type]}</Badge>}
                <span className="flex min-w-0 flex-1 flex-col">
                  <Text as="span" variant="body-sm" className="truncate font-semibold">
                    {item.title}
                  </Text>
                  {item.snippet && (
                    <Text as="span" variant="caption" tone="secondary" className="truncate">
                      {item.snippet}
                    </Text>
                  )}
                </span>
              </li>
            ))
          )}
        </ul>
      )}

      <div className="flex items-center gap-3 border-t-2 border-accent bg-background-subtle px-3 py-2">
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          <Text as="span" variant="caption" tone="tertiary">
            navigate
          </Text>
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>↵</Kbd>
          <Text as="span" variant="caption" tone="tertiary">
            open
          </Text>
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>esc</Kbd>
          <Text as="span" variant="caption" tone="tertiary">
            close
          </Text>
        </span>
      </div>
    </dialog>
  )
}
