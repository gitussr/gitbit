import { memo, useRef, type Ref } from 'react'
import { BranchLabel } from '@/components/ui/BranchLabel'
import { CommitNode } from '@/components/ui/CommitNode'
import { LaneGraph, type LaneGraphRow } from '@/components/ui/LaneGraph'
import { ScrollX } from '@/components/ui/ScrollX'
import { useFlip } from '@/hooks/useFlip'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { historyGraph, remoteGraph, type GraphNode, type RepoState } from '@/services/git-sim'

export interface CommitGraphProps {
  repo: RepoState
  /** Commit ids that have just been created, and should play their entrance. */
  entering: Set<string>
  /** The commit the Time Machine is looking at, ringed in the graph. */
  inspected?: string | null
  /** Draw the remote's history instead of yours (Section 22). */
  source?: 'local' | 'remote'
}

/** The `entering` keys this graph draws: commit ids, or `remote:`-prefixed ones for the remote's. */
function ownKeys(entering: Set<string>, source: CommitGraphProps['source']): string[] {
  const remote = source === 'remote'
  return [...entering].filter((key) => (remote ? key.startsWith('remote:') : !key.includes(':')))
}

/**
 * `entering` is rebuilt every time a panel lights or dims — two or three
 * times per command — and mostly holds keys for other panels
 * (`working-directory:index.html`). Comparing only this graph's own keys
 * means an edit or a `git status` doesn't redraw every row of the history.
 */
function sameGraphProps(before: CommitGraphProps, after: CommitGraphProps): boolean {
  if (before.repo !== after.repo || before.inspected !== after.inspected || before.source !== after.source) return false
  if (before.entering === after.entering) return true
  const a = ownKeys(before.entering, before.source)
  const b = ownKeys(after.entering, after.source)
  return a.length === b.length && a.every((key) => after.entering.has(key))
}

/** A row's narrowest: short hash, one branch label and a few words of the message. */
const MIN_ROW = 200

/** What the lines say, in words — the graph is decorative to a screen reader, this isn't. */
function lineage({ commit }: GraphNode): string {
  const [first, ...rest] = commit.parents
  if (!first) return 'The first commit — built on nothing.'
  if (rest.length === 0) return `Built on ${first}.`
  return `Merge of ${[first, ...rest].join(' and ')}.`
}

function Refs({
  node,
  headBranch,
  headRef,
}: {
  node: GraphNode
  headBranch: string | null
  headRef: Ref<HTMLSpanElement>
}) {
  const detached = node.isHead && headBranch === null
  if (!detached && node.branches.length === 0 && node.remotes.length === 0) return null

  return (
    <span className="flex shrink-0 items-center gap-1">
      {detached && <BranchLabel ref={headRef} name="HEAD" variant="head" />}
      {node.branches.map((branch) =>
        branch === headBranch ? (
          <BranchLabel key={branch} ref={headRef} name={branch} variant="current" />
        ) : (
          <BranchLabel key={branch} name={branch} variant="branch" />
        ),
      )}
      {node.remotes.map((ref) => (
        <BranchLabel key={ref} name={ref} variant="remote" />
      ))}
    </span>
  )
}

/**
 * The Local Repository's history, as a graph (Section 13).
 *
 * The engine decides the shape (`historyGraph`); `LaneGraph` draws it.
 * This only says what each row means. Memoised because the graph is the
 * one part of the stage whose cost grows with every commit, and the page
 * re-renders whenever a panel lights up or goes dark (`sameGraphProps`).
 */
export const CommitGraph = memo(function CommitGraph({ repo, entering, inspected = null, source = 'local' }: CommitGraphProps) {
  const graph = source === 'remote' ? remoteGraph(repo) : historyGraph(repo)
  const head = graph.nodes.find((node) => node.isHead)

  // HEAD's label is re-rendered on whichever row HEAD reaches; this makes
  // it travel there instead of blinking out and in (Section 14).
  const anchor = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const headRef = useFlip<HTMLSpanElement>(anchor, `${graph.headBranch}@${head?.commit.id}`, !reduced)

  const label = source === 'remote' ? 'Commits on the remote, newest first' : 'Commits, newest first'
  const rows: LaneGraphRow[] = graph.nodes.map((node) => ({
    id: node.commit.id,
    lane: node.lane,
    shape: node.commit.parents.length > 1 ? 'diamond' : 'dot',
    emphasis: node.isHead,
    selected: node.commit.id === inspected,
    // Remote rows are keyed apart: the same commit can arrive there without
    // your copy replaying its entrance.
    entering: entering.has(source === 'remote' ? `remote:${node.commit.id}` : node.commit.id),
    content: (
      <CommitNode
        id={node.commit.id}
        message={node.commit.message}
        isRoot={node.commit.parents.length === 0}
        refs={<Refs node={node} headBranch={graph.headBranch} headRef={headRef} />}
        lineage={lineage(node)}
      />
    ),
  }))

  return (
    // The one part of the stage allowed to scroll sideways (docs/VISUALIZER.md,
    // Layout): on a phone, many lanes would otherwise crush every message
    // to a letter. MIN_ROW keeps the hash, a label and a few words readable.
    <ScrollX label={label}>
      <div ref={anchor}>
        <LaneGraph rows={rows} edges={graph.edges} lanes={graph.lanes} label={label} minRowWidth={MIN_ROW} />
      </div>
    </ScrollX>
  )
}, sameGraphProps)
