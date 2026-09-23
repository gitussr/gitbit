import { memo } from 'react'
import { BranchLabel } from '@/components/ui/BranchLabel'
import { CommitNode } from '@/components/ui/CommitNode'
import { LaneGraph, type LaneGraphRow } from '@/components/ui/LaneGraph'
import { historyGraph, type GraphNode, type RepoState } from '@/services/git-sim'

export interface CommitGraphProps {
  repo: RepoState
  /** Commit ids that have just been created, and should play their entrance. */
  entering: Set<string>
}

/** What the lines say, in words — the graph is decorative to a screen reader, this isn't. */
function lineage({ commit }: GraphNode): string {
  const [first, ...rest] = commit.parents
  if (!first) return 'The first commit — built on nothing.'
  if (rest.length === 0) return `Built on ${first}.`
  return `Merge of ${[first, ...rest].join(' and ')}.`
}

function Refs({ node, headBranch }: { node: GraphNode; headBranch: string | null }) {
  const detached = node.isHead && headBranch === null
  if (!detached && node.branches.length === 0 && node.remotes.length === 0) return null

  return (
    <span className="flex shrink-0 items-center gap-1">
      {detached && <BranchLabel name="HEAD" variant="head" />}
      {node.branches.map((branch) => (
        <BranchLabel key={branch} name={branch} variant={branch === headBranch ? 'current' : 'branch'} />
      ))}
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
export const CommitGraph = memo(function CommitGraph({ repo, entering }: CommitGraphProps) {
  const graph = historyGraph(repo)

  const rows: LaneGraphRow[] = graph.nodes.map((node) => ({
    id: node.commit.id,
    lane: node.lane,
    shape: node.commit.parents.length > 1 ? 'diamond' : 'dot',
    emphasis: node.isHead,
    entering: entering.has(node.commit.id),
    content: (
      <CommitNode
        id={node.commit.id}
        message={node.commit.message}
        isRoot={node.commit.parents.length === 0}
        refs={<Refs node={node} headBranch={graph.headBranch} />}
        lineage={lineage(node)}
      />
    ),
  }))

  return <LaneGraph rows={rows} edges={graph.edges} lanes={graph.lanes} label="Commits, newest first" />
})
