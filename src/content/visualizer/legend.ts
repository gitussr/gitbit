/**
 * The Visualizer's legend (Section 31): what each mark on the stage means.
 *
 * Plain data. Each entry names a *glyph* — which of the stage's own marks
 * to draw — and says what it means; the feature draws the glyph with the
 * same primitive the stage uses, so the key can't drift from the picture.
 *
 * Only marks the stage actually draws are here. Section 31's example also
 * lists ahead/behind arrows; the Visualizer shows those as `git status`
 * text, not as a mark, so a key entry for them would describe nothing.
 */

export type LegendGlyph =
  | { node: 'dot' | 'diamond' | 'head' | 'selected' }
  | { edge: true }
  | { ref: 'current' | 'branch' | 'head' | 'remote'; name: string }
  | { file: 'untracked' | 'modified' | 'staged' | 'deleted' | 'conflicted' }
  | { panel: 'lit' }
  | { boundary: true }

export interface LegendEntry {
  glyph: LegendGlyph
  label: string
  meaning: string
}

export interface LegendGroup {
  title: string
  entries: LegendEntry[]
}

export const visualizerLegend: LegendGroup[] = [
  {
    title: 'History',
    entries: [
      { glyph: { node: 'dot' }, label: 'Commit', meaning: 'A snapshot of the whole project.' },
      { glyph: { node: 'diamond' }, label: 'Merge commit', meaning: 'A commit with two parents.' },
      { glyph: { node: 'head' }, label: 'HEAD’s commit', meaning: 'The commit you’re on.' },
      { glyph: { edge: true }, label: 'Line', meaning: 'Built on: each commit points back at its parent.' },
      { glyph: { node: 'selected' }, label: 'Ringed', meaning: 'The commit the Time Machine is looking at.' },
    ],
  },
  {
    title: 'Labels',
    entries: [
      { glyph: { ref: 'current', name: 'main' }, label: 'Current branch', meaning: 'The branch you’re on. HEAD moves with it.' },
      { glyph: { ref: 'branch', name: 'feature' }, label: 'Branch', meaning: 'A name pointing at one commit.' },
      { glyph: { ref: 'head', name: 'HEAD' }, label: 'Detached HEAD', meaning: 'Pointing straight at a commit, with no branch.' },
      { glyph: { ref: 'remote', name: 'origin/main' }, label: 'Remote-tracking', meaning: 'Your record of where the remote’s branch was.' },
    ],
  },
  {
    title: 'Files',
    entries: [
      { glyph: { file: 'untracked' }, label: 'Untracked', meaning: 'Git has never been told about it.' },
      { glyph: { file: 'modified' }, label: 'Modified', meaning: 'Changed on disk, not staged.' },
      { glyph: { file: 'staged' }, label: 'Staged', meaning: 'This version goes into the next commit.' },
      { glyph: { file: 'deleted' }, label: 'Deleted', meaning: 'Gone from this place: from disk, or staged to be removed.' },
      { glyph: { file: 'conflicted' }, label: 'Conflict', meaning: 'Both versions are in it, waiting for you.' },
    ],
  },
  {
    title: 'Places',
    entries: [
      { glyph: { panel: 'lit' }, label: 'Lit panel', meaning: 'Something just changed here.' },
      { glyph: { boundary: true }, label: 'Dashed line', meaning: 'The edge of your machine. The remote is past it.' },
    ],
  },
]
