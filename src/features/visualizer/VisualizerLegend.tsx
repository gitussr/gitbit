import { BranchLabel } from '@/components/ui/BranchLabel'
import { FileStatusSwatch } from '@/components/ui/FileNode'
import { LaneEdgeSwatch, LaneNodeSwatch } from '@/components/ui/LaneGraph'
import { Legend } from '@/components/ui/Legend'
import { panelClassName } from '@/components/ui/StatePanel'
import { visualizerLegend, type LegendGlyph } from '@/content/visualizer/legend'

/**
 * Draws a legend glyph with the primitive that draws it on the stage, so
 * the key and the picture can't disagree.
 */
function Swatch({ glyph }: { glyph: LegendGlyph }) {
  if ('node' in glyph) {
    return (
      <LaneNodeSwatch
        shape={glyph.node === 'diamond' ? 'diamond' : 'dot'}
        emphasis={glyph.node === 'head'}
        selected={glyph.node === 'selected'}
      />
    )
  }
  if ('edge' in glyph) return <LaneEdgeSwatch />
  if ('ref' in glyph) return <BranchLabel name={glyph.name} variant={glyph.ref} />
  if ('file' in glyph) return <FileStatusSwatch status={glyph.file} />
  if ('panel' in glyph) return <span aria-hidden="true" className={panelClassName(true, 'block size-6 p-0')} />
  return <span aria-hidden="true" className="block w-10 border-t-2 border-dashed border-accent" />
}

/** The Visualizer's key (Section 31): closed by default, beside the stage it explains. */
export function VisualizerLegend({ className }: { className?: string }) {
  return (
    <Legend
      className={className}
      sections={visualizerLegend.map((group) => ({
        title: group.title,
        items: group.entries.map((entry) => ({ swatch: <Swatch glyph={entry.glyph} />, label: entry.label, meaning: entry.meaning })),
      }))}
    />
  )
}
