import { memo, useRef, type Ref } from 'react'
import { BranchLabel } from '@/components/ui/BranchLabel'
import { CommitNode } from '@/components/ui/CommitNode'
import { LaneGraph, type LaneGraphRow } from '@/components/ui/LaneGraph'
import { useFlip } from '@/hooks/useFlip'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { historyGraph, type GraphNode, type RepoState } from '@/services/git-sim'

export interface CommitGraphProps {
  repo: RepoState
  /** Commit ids that have just been created, and should play their entrance. */
  entering: Set<string>
  /** The commit the Time Machine is looking at, ringed in the graph. */
  inspected?: string | null
}

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
 * This only says what each row means. Memoised on `repo` because the
 * graph is the one part of the stage whose cost grows with every commit,
 * and the page re-renders on every keystroke in the console.
 */
export const CommitGraph = memo(function CommitGraph({ repo, entering, inspected = null }: CommitGraphProps) {
  const graph = historyGraph(repo)
  const head = graph.nodes.find((node) => node.isHead)

  // HEAD's label is re-rendered on whichever row HEAD reaches; this makes
  // it travel there instead of blinking out and in (Section 14).
  const anchor = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const headRef = useFlip<HTMLSpanElement>(anchor, `${graph.headBranch}@${head?.commit.id}`, !reduced)

  const rows: LaneGraphRow[] = graph.nodes.map((node) => ({
    id: node.commit.id,
    lane: node.lane,
    shape: node.commit.parents.length > 1 ? 'diamond' : 'dot',
    emphasis: node.isHead,
    selected: node.commit.id === inspected,
    entering: entering.has(node.commit.id),
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
    <div ref={anchor}>
      <LaneGraph rows={rows} edges={graph.edges} lanes={graph.lanes} label="Commits, newest first" />
    </div>
  )
})
