import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { chipClassName } from './ChipLink'
import { Text } from './Typography'

export interface ComparisonSide {
  command: string
  plainEnglish: string
  /** The command's Quick page, when GitBit has one for it. */
  to?: string
}

export interface ComparisonSplitProps {
  left: ComparisonSide
  right: ComparisonSide
  className?: string
}

/**
 * Two commonly-confused commands, side by side (Section 30).
 *
 * Three grid tracks — panel, marker, panel — so the "vs" sits between the
 * sides at every width without positioning it against a divider: side by
 * side from `sm`, stacked below it. `items-stretch` keeps both panels the
 * same height so neither side reads as the more important one.
 */
export function ComparisonSplit({ left, right, className }: ComparisonSplitProps) {
  return (
    <div className={cn('grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]', className)}>
      <Side side={left} />

      {/* Decorative: the heading above already names the pair as "X vs. Y". */}
      <div className="flex items-center justify-center" aria-hidden="true">
        <span className="flex size-9 shrink-0 items-center justify-center border-2 border-accent bg-accent font-mono text-body-sm font-bold text-on-accent">
          vs
        </span>
      </div>

      <Side side={right} />
    </div>
  )
}

function Side({ side }: { side: ComparisonSide }) {
  const chip = chipClassName({ code: true, interactive: Boolean(side.to), className: 'h-8 max-w-full text-sm' })

  return (
    <div className="flex min-w-0 flex-col items-start gap-2.5 border-2 border-accent bg-surface p-4">
      {side.to ? (
        <Link to={side.to} className={chip}>
          <span className="truncate">{side.command}</span>
        </Link>
      ) : (
        <span className={chip}>
          <span className="truncate">{side.command}</span>
        </span>
      )}
      <Text variant="body-sm" tone="secondary">
        {side.plainEnglish}
      </Text>
    </div>
  )
}
