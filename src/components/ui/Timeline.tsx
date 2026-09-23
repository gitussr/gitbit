import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useId } from 'react'
import { cn } from '@/utils/cn'
import { IconButton } from './IconButton'
import { Text } from './Typography'

export interface TimelineItem {
  id: string
  /** Read out and shown for the selected item, e.g. `a1b2c3d — Add the homepage`. */
  label: string
  /** Marks where you are now. Drawn as the lime-cored node, the same as HEAD in the graph. */
  current?: boolean
  /** Something nothing points at any more: drawn hollow and dimmed. */
  faded?: boolean
}

export interface TimelineProps {
  items: TimelineItem[]
  /** Index of the selected item. */
  value: number
  onChange: (index: number) => void
  label: string
  className?: string
}

/**
 * A scrubber through an ordered set of moments — oldest on the left
 * (Section 19's "A ─── B ─── C ─── D").
 *
 * The control is a native range input, so keyboard, touch and screen
 * readers all work the way they already know (arrows, Home/End, swipe),
 * and it announces the selected item's label rather than a bare number.
 * The dots above it are the picture; the buttons either side are for
 * anyone who'd rather step than drag.
 */
export function Timeline({ items, value, onChange, label, className }: TimelineProps) {
  const inputId = useId()
  const selected = items[value]
  const last = items.length - 1

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        <IconButton
          icon={<ChevronLeft />}
          label="Older"
          size="sm"
          disabled={value <= 0}
          onClick={() => onChange(Math.max(0, value - 1))}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* The picture: one dot per item, evenly spaced along the track. */}
          <div className="relative flex h-4 items-center justify-between px-1.5" aria-hidden="true">
            <span className="absolute inset-x-1.5 top-1/2 h-0.5 -translate-y-1/2 bg-accent" />
            {items.map((item, index) => (
              <span
                key={item.id}
                className={cn(
                  // Shrinks rather than overflowing when history is long.
                  'relative size-3 min-w-1 shrink rounded-full border-2 border-accent',
                  // Hollow and dimmed: a dashed border is illegible on a dot this small.
                  item.faded ? 'bg-surface opacity-50' : item.current ? 'bg-highlight' : 'bg-accent',
                  index === value && 'outline-2 outline-offset-2 outline-accent',
                )}
              />
            ))}
          </div>

          <label htmlFor={inputId} className="sr-only">
            {label}
          </label>
          <input
            id={inputId}
            type="range"
            min={0}
            max={Math.max(last, 0)}
            step={1}
            value={value}
            disabled={items.length < 2}
            aria-valuetext={selected?.label}
            onChange={(event) => onChange(Number(event.target.value))}
            className="w-full accent-accent"
          />
        </div>

        <IconButton
          icon={<ChevronRight />}
          label="Newer"
          size="sm"
          disabled={value >= last}
          onClick={() => onChange(Math.min(last, value + 1))}
        />
      </div>

      {selected && (
        <Text variant="caption" tone="secondary" className="text-center">
          {value + 1} of {items.length}
        </Text>
      )}
    </div>
  )
}
