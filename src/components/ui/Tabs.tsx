import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface TabItem {
  value: string
  label: string
}

export interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
  className?: string
}

/** Accessible tabs with roving tabindex + arrow-key navigation (WAI-ARIA tabs pattern). */
export function Tabs({ items, value, onChange, className }: TabsProps) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.value === value)
    if (index === -1) return

    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % items.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + items.length) % items.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = items.length - 1

    if (nextIndex !== null) {
      event.preventDefault()
      const nextItem = items[nextIndex]
      onChange(nextItem.value)
      buttonRefs.current[nextItem.value]?.focus()
    }
  }

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={cn('inline-flex gap-1 rounded-lg border border-border bg-background-subtle p-1', className)}
    >
      {items.map((item) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            ref={(el) => {
              buttonRefs.current[item.value] = el
            }}
            role="tab"
            type="button"
            id={`tab-${item.value}`}
            aria-selected={selected}
            aria-controls={`panel-${item.value}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-standard',
              selected ? 'bg-surface text-foreground shadow-xs' : 'text-foreground-secondary hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({ value, activeValue, children }: { value: string; activeValue: string; children: ReactNode }) {
  if (value !== activeValue) return null
  return (
    <div role="tabpanel" id={`panel-${value}`} aria-labelledby={`tab-${value}`} tabIndex={0}>
      {children}
    </div>
  )
}
