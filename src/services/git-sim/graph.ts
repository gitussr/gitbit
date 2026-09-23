/**
 * The shape of history, for the graph (Section 13).
 *
 * This is topology, not pixels: which row each commit sits on, which lane
 * (column) it occupies, and which lane each parent edge travels down. The
 * drawing is someone else's job. It lives in the engine because the hard
 * part — keeping lines of work in stable columns across branches and
 * merges — is a question about the commit graph, and because a pure
 * function is one the tests can hold to account.
 *
 * The algorithm is the one `git log --graph` uses, simplified. Walk
 * commits newest first, keeping a list of lanes, each "expecting" the next
 * commit it will meet. A commit lands in the leftmost lane expecting it;
 * any other lanes expecting it converge into it (that's a branch point,
 * read bottom-up). Its first parent inherits its lane — so a line of work
 * stays in one column — and every further parent (a merge) opens a lane
 * of its own unless something is already heading there.
 *
 * One departure from Git: lane 0 is reserved for HEAD before the walk
 * starts. `git log --graph` gives the leftmost lane to whichever tip is
 * newest, so the branch you're on zig-zags whenever another branch has a
 * later commit. Here the line you're standing on is always the straight
 * one down the left edge — the trunk everything else is drawn against.
 */

import { currentBranch, headCommitId } from './repo'
import type { BranchName, Commit, CommitId, RepoState } from './types'

export interface GraphNode {
  commit: Commit
  row: number
  lane: number
  /** Branches pointing here, local first. */
  branches: BranchName[]
  /** Remote-tracking refs pointing here, e.g. `origin/main`. */
  remotes: string[]
  /** HEAD resolves to this commit. */
  isHead: boolean
}

export interface GraphEdge {
  /** The child. Edges run from a commit down to what it was built on. */
  from: CommitId
  to: CommitId
  /** The lane the line travels in between the two rows. */
  lane: number
}

export interface HistoryGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  /** How many lanes wide the graph is at its widest. */
  lanes: number
  /** The branch HEAD is on, or null when detached. The graph labels it `HEAD → main`. */
  headBranch: BranchName | null
}

/**
 * Every commit something can still reach: a branch, a remote-tracking
 * ref, or HEAD.
 *
 * Commits nothing points at any more — what `reset` leaves behind — are
 * left out. They still exist in the object store, and showing that is the
 * Time Machine's lesson (Section 19); drawing them here, unlabelled, would
 * make it look as if they were still part of the history.
 */
function reachable(state: RepoState): Commit[] {
  const starts = [
    ...Object.values(state.branches),
    ...Object.values(state.remoteBranches),
    headCommitId(state),
  ].filter((id): id is CommitId => id !== null)

  const seen = new Set<CommitId>()
  const stack = [...starts]
  while (stack.length > 0) {
    const id = stack.pop() as CommitId
    if (seen.has(id) || !state.commits[id]) continue
    seen.add(id)
    stack.push(...state.commits[id].parents)
  }

  // Newest first. A parent is always created before its children, so this is
  // also a valid topological order — no edge ever points up the graph.
  return [...seen].map((id) => state.commits[id]).sort((a, b) => b.order - a.order)
}

export function historyGraph(state: RepoState): HistoryGraph {
  const commits = reachable(state)
  const head = headCommitId(state)

  // lanes[i] is the commit lane i is heading towards, or null when free.
  const lanes: (CommitId | null)[] = head ? [head] : []
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  let widest = 0

  const claim = (id: CommitId): number => {
    const free = lanes.indexOf(null)
    if (free !== -1) {
      lanes[free] = id
      return free
    }
    lanes.push(id)
    return lanes.length - 1
  }

  commits.forEach((commit, row) => {
    // The leftmost lane already heading here, or a fresh one for a branch tip.
    const waiting = lanes.flatMap((expected, i) => (expected === commit.id ? [i] : []))
    const lane = waiting.length > 0 ? waiting[0] : claim(commit.id)
    // The others converge here and are free from this row down.
    for (const other of waiting.slice(1)) lanes[other] = null

    commit.parents.forEach((parent, i) => {
      if (i === 0) {
        lanes[lane] = parent
        edges.push({ from: commit.id, to: parent, lane })
        return
      }
      const existing = lanes.indexOf(parent)
      edges.push({ from: commit.id, to: parent, lane: existing !== -1 ? existing : claim(parent) })
    })
    if (commit.parents.length === 0) lanes[lane] = null

    widest = Math.max(widest, lanes.length)
    while (lanes.length > 0 && lanes[lanes.length - 1] === null) lanes.pop()

    nodes.push({
      commit,
      row,
      lane,
      branches: Object.keys(state.branches)
        .filter((branch) => state.branches[branch] === commit.id)
        .sort(),
      remotes: Object.keys(state.remoteBranches)
        .filter((ref) => state.remoteBranches[ref] === commit.id)
        .sort(),
      isHead: commit.id === head,
    })
  })

  return { nodes, edges, lanes: Math.max(widest, nodes.length > 0 ? 1 : 0), headBranch: currentBranch(state) }
}
