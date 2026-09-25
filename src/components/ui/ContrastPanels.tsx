import { Check, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Text } from './Typography'

export interface ContrastPanelsProps {
  /** The belief the statement is correcting. */
  sounds: string
  /** What is actually true. */
  actually: string
  className?: string
}

/**
 * The shape of a GitBit Aha: a belief set against what is actually true
 * (Section 4). Both panels carry the same weight and the same ink border —
 * the mistaken one isn't shamed with alarm colours, it's just the one with
 * the cross, because the reader probably holds it right now.
 */
export function ContrastPanels({ sounds, actually, className }: ContrastPanelsProps) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2', className)}>
      <Panel icon={<X className="size-3.5" aria-hidden="true" />} label="Sounds like" body={sounds} />
      <Panel
        icon={<Check className="size-3.5" aria-hidden="true" />}
        label="Actually"
        body={actually}
        highlighted
      />
    </div>
  )
}

function Panel({
  icon,
  label,
  body,
  highlighted = false,
}: {
  icon: React.ReactNode
  label: string
  body: string
  highlighted?: boolean
}) {
  return (
    <div className={cn('flex flex-col gap-2 border-2 border-accent p-4', highlighted ? 'bg-card' : 'bg-surface')}>
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            'flex size-5 shrink-0 items-center justify-center border-2 border-accent',
            highlighted ? 'bg-accent text-on-accent' : 'bg-surface text-foreground',
          )}
        >
          {icon}
        </span>
        <Text as="span" variant="caption" className="font-bold tracking-widest uppercase">
          {label}
        </Text>
      </span>
      <Text variant="body-sm" tone={highlighted ? 'primary' : 'secondary'}>
        {body}
      </Text>
    </div>
  )
}
