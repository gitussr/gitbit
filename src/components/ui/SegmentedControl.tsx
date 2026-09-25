import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

export interface SegmentedControlProps<T extends string> {
  /** Names the group for assistive tech. */
  label: string
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/**
 * A row of mutually exclusive choices, all visible at once — for a small
 * setting where a dropdown would hide the options (the theme picker).
 * A radio group underneath: one tab stop, arrow keys move and select,
 * matching the WAI-ARIA radio pattern.
 */
export function SegmentedControl<T extends string>({ label, options, value, onChange, className }: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    if (step === undefined) return
    event.preventDefault()
    const next = (index + step + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div role="radiogroup" aria-label={label} className={cn('grid auto-cols-fr grid-flow-col border-2 border-accent', className)}>
      {options.map((option, index) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            ref={(element) => {
              refs.current[index] = element
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'inline-flex h-10 min-w-0 items-center justify-center gap-1.5 px-2 text-body-sm font-bold transition-colors duration-150 ease-standard [&_svg]:size-4 [&_svg]:shrink-0',
              'not-first:border-l-2 not-first:border-accent',
              selected ? 'bg-accent text-on-accent' : 'bg-surface text-foreground hover:bg-accent-subtle',
            )}
          >
            {option.icon}
            <span className="truncate">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
