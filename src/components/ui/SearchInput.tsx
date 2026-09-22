import { forwardRef, type InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Kbd } from './Kbd'

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
  shortcutHint?: string
}

/** GitBit's core search field (Section 20) — commands, concepts, lessons, Aha, SOS. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { className, value, onClear, shortcutHint, placeholder = 'Search Git commands, concepts…', ...props },
  ref,
) {
  const hasValue = typeof value === 'string' && value.length > 0

  return (
    <div
      className={cn(
        'flex h-10 items-center gap-2 border-2 border-accent bg-surface px-3',
        'transition-shadow duration-150 ease-standard focus-within:shadow-brutal-sm',
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-foreground-tertiary" aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        role="searchbox"
        value={value}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-tertiary outline-none"
        {...props}
      />
      {hasValue && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="shrink-0 p-1 text-foreground-tertiary hover:bg-accent-subtle hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
      {!hasValue && shortcutHint && (
        <Kbd>{shortcutHint}</Kbd>
      )}
    </div>
  )
})
