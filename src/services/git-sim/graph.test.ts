import { describe, expect, it } from 'vitest'
import { executeCommand } from './execute'
import { historyGraph } from './graph'
import { emptyState, projectFolder } from './seed'
import type { BranchName, Commit, CommitId, RepoState } from './types'

/**
 * Branch and merge commands arrive in later tasks, so these states are
 * built by hand: commit ids are letters, and `order` follows the order
 * they're listed, the way the engine assigns it.
 */
function repo(
  history: [id: CommitId, parents: CommitId[]][],
  branches: Record<BranchName, CommitId>,
  head: BranchName = 'main',
): RepoState {
  const commits: Record<CommitId, Commit> = {}
  history.forEach(([id, parents], order) => {
    commits[id] = { id, message: id, parents, tree: {}, order }
  })
  return {
    ...emptyState(),
    initialized: true,
    commits,
    branches,
    HEAD: { type: 'branch', branch: head },
    commitCounter: history.length,
  }
}

const place = (state: RepoState) =>
  Object.fromEntries(historyGraph(state).nodes.map((node) => [node.commit.id, [node.row, node.lane]]))

describe('historyGraph', () => {
  it('is empty before the first commit', () => {
    expect(historyGraph(emptyState())).toMatchObject({ nodes: [], edges: [], lanes: 0 })
  })

  it('draws straight history in one lane, newest first', () => {
    const state = repo(
      [
        ['A', []],
        ['B', ['A']],
        ['C', ['B']],
      ],
      { main: 'C' },
    )
    expect(place(state)).toEqual({ C: [0, 0], B: [1, 0], A: [2, 0] })
    expect(historyGraph(state).edges).toEqual([
      { from: 'C', to: 'B', lane: 0 },
      { from: 'B', to: 'A', lane: 0 },
    ])
    expect(historyGraph(state).lanes).toBe(1)
  })

  it('gives a branch its own lane, converging where it split off', () => {
    //  A ─ B ─ C          main (HEAD)
    //       \
    //        D ─ E        feature — newer, but HEAD's line keeps lane 0
    const state = repo(
      [
        ['A', []],
        ['B', ['A']],
        ['C', ['B']],
        ['D', ['B']],
        ['E', ['D']],
      ],
      { main: 'C', feature: 'E' },
    )
    const graph = historyGraph(state)
    expect(place(state)).toEqual({ E: [0, 1], D: [1, 1], C: [2, 0], B: [3, 0], A: [4, 0] })
    // D's line runs down its own lane and bends into B's.
    expect(graph.edges).toContainEqual({ from: 'D', to: 'B', lane: 1 })
    expect(graph.lanes).toBe(2)
  })

  it('opens a lane for a merge’s second parent', () => {
    //  A ─ B ─ C ─── F    main
    //       \       /
    //        D ─ E ─      feature
    const state = repo(
      [
        ['A', []],
        ['B', ['A']],
        ['C', ['B']],
        ['D', ['B']],
        ['E', ['D']],
        ['F', ['C', 'E']],
      ],
      { main: 'F', feature: 'E' },
    )
    const graph = historyGraph(state)
    expect(place(state)).toEqual({ F: [0, 0], E: [1, 1], D: [2, 1], C: [3, 0], B: [4, 0], A: [5, 0] })
    expect(graph.edges.filter((edge) => edge.from === 'F')).toEqual([
      { from: 'F', to: 'C', lane: 0 },
      { from: 'F', to: 'E', lane: 1 },
    ])
    expect(graph.lanes).toBe(2)
  })

  it('labels branches and HEAD where they point', () => {
    const state = repo(
      [
        ['A', []],
        ['B', ['A']],
      ],
      { main: 'B', old: 'A' },
    )
    state.remoteBranches = { 'origin/main': 'A' }
    const graph = historyGraph(state)

    expect(graph.headBranch).toBe('main')
    expect(graph.nodes[0]).toMatchObject({ branches: ['main'], remotes: [], isHead: true })
    expect(graph.nodes[1]).toMatchObject({ branches: ['old'], remotes: ['origin/main'], isHead: false })
  })

  it('leaves out commits nothing points at any more', () => {
    const state = repo(
      [
        ['A', []],
        ['B', ['A']],
      ],
      { main: 'A' },
    )
    expect(Object.keys(place(state))).toEqual(['A'])
  })

  it('follows a detached HEAD', () => {
    const state = repo(
      [
        ['A', []],
        ['B', ['A']],
      ],
      { main: 'A' },
    )
    state.HEAD = { type: 'detached', commit: 'B' }
    const graph = historyGraph(state)
    expect(graph.headBranch).toBeNull()
    expect(graph.nodes[0]).toMatchObject({ isHead: true, branches: [] })
  })

  it('matches what the engine actually builds', () => {
    const state = ['git init', 'git add .', 'git commit -m "First"'].reduce(
      (current, input) => executeCommand(current, input).after,
      projectFolder(),
    )
    const graph = historyGraph(state)
    expect(graph.nodes).toHaveLength(1)
    expect(graph.nodes[0]).toMatchObject({ row: 0, lane: 0, branches: ['main'], isHead: true })
    expect(graph.edges).toEqual([])
  })
})
