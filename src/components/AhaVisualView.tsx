import type { AhaVisual } from '@/content/types'
import { ContrastPanels } from '@/components/ui/ContrastPanels'
import { GitStateFlow } from '@/components/ui/GitStateFlow'
import { Text } from '@/components/ui/Typography'

/**
 * Draws the picture an Aha card asks for (Section 4). The card names a kind
 * and the arguments; choosing the primitive happens here, so content stays
 * plain data and never reaches for a component.
 *
 * `state-flow` deliberately reuses the Git state model rather than drawing
 * something new — half of these statements are really about which box work
 * is sitting in, and the reader has already met that diagram in Learn.
 */
export function AhaVisualView({ visual }: { visual: AhaVisual }) {
  return (
    <figure className="m-0 flex flex-col gap-2">
      {visual.kind === 'state-flow' ? (
        <GitStateFlow activeStates={visual.activeStates} activeCommand={visual.activeCommand} />
      ) : (
        <ContrastPanels sounds={visual.sounds} actually={visual.actually} />
      )}

      {visual.caption && (
        <Text as="figcaption" variant="body-sm" tone="secondary">
          {visual.caption}
        </Text>
      )}
    </figure>
  )
}
