import { Badge } from '@/components/ui/Badge'
import { InlineCode, Text } from '@/components/ui/Typography'
import type { GitEvent, ResetLayer } from '@/services/git-sim'

type ResetEvent = Extract<GitEvent, { type: 'RESET_PERFORMED' }>

/** Named the way the stage names the panels, so the readout and the picture agree. */
const ROWS: { layer: ResetLayer; label: string }[] = [
  { layer: 'head', label: 'HEAD (your branch)' },
  { layer: 'index', label: 'Staging Area' },
  { layer: 'worktree', label: 'Working Directory' },
]

export interface ResetLayersProps {
  event: ResetEvent
  /** How many layers have lit so far — the readout fills in step with the stage. */
  revealed: number
}

/**
 * Section 18's diagram, for the reset that just ran: the three layers, and
 * which of them this mode changed. The difference between `--soft`,
 * `--mixed` and `--hard` is exactly how far down this list the word
 * "changed" reaches, so it's shown as a list rather than described.
 */
export function ResetLayers({ event, revealed }: ResetLayersProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Text variant="caption" tone="secondary">
        <InlineCode>git reset --{event.mode}</InlineCode>
      </Text>
      <ul className="flex flex-col gap-1">
        {ROWS.map(({ layer, label }) => {
          const position = event.layers.indexOf(layer)
          const changed = position !== -1
          const shown = !changed || position < revealed
          return (
            <li key={layer} className="flex items-center justify-between gap-2">
              <Text variant="body-sm" as="span">
                {label}
              </Text>
              <Badge variant={changed && shown ? 'accent' : 'neutral'}>{changed ? (shown ? 'changed' : '…') : 'kept'}</Badge>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
