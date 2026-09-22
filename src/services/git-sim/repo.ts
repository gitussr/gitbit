/**
 * Derived views over `RepoState`.
 *
 * Nothing here changes anything. The four panels the Visualizer draws are
 * *derived* from two trees and a commit, not stored as three separate
 * lists — which is why a file edited after being staged correctly shows up
 * in both the Staging Area and the Working Directory, exactly as it does
 * in real `git status`.
 */

import type { BranchName, Commit, CommitId, FileChange, FilePath, RepoState, Tree } from './types'

export function currentBranch(state: RepoState): BranchName | null {
  return state.HEAD.type === 'branch' ? state.HEAD.branch : null
}

/** The commit HEAD resolves to, or null in a repository with no commits yet. */
export function headCommitId(state: RepoState): CommitId | null {
  if (state.HEAD.type === 'detached') return state.HEAD.commit
  return state.branches[state.HEAD.branch] ?? null
}

export function headCommit(state: RepoState): Commit | null {
  const id = headCommitId(state)
  return id ? (state.commits[id] ?? null) : null
}

/** The snapshot HEAD points at. An empty tree before the first commit — there is genuinely nothing recorded yet. */
export function headTree(state: RepoState): Tree {
  return headCommit(state)?.tree ?? {}
}

/** How `to` differs from `from`, sorted by path so output is stable. */
export function treeDiff(from: Tree, to: Tree): FileChange[] {
  const paths = new Set([...Object.keys(from), ...Object.keys(to)])
  const changes: FileChange[] = []

  for (const path of [...paths].sort()) {
    const before = from[path]
    const after = to[path]
    if (before === after) continue
    if (before === undefined) changes.push({ path, kind: 'added' })
    else if (after === undefined) changes.push({ path, kind: 'deleted' })
    else changes.push({ path, kind: 'modified' })
  }

  return changes
}

/**
 * What `git commit` would record: how the index differs from HEAD.
 *
 * This is the Staging Area panel. It empties after a commit not because
 * the index was cleared — it wasn't — but because the index and HEAD now
 * match.
 */
export function stagedChanges(state: RepoState): FileChange[] {
  return treeDiff(headTree(state), state.index)
}

/**
 * Tracked files whose contents on disk differ from the index.
 *
 * `added` is filtered out on purpose: a path the index has never heard of
 * isn't an unstaged addition, it's untracked, and Git reports those
 * separately because the distinction is the entire point of `git add`.
 */
export function unstagedChanges(state: RepoState): FileChange[] {
  return treeDiff(state.index, state.workingTree).filter((change) => change.kind !== 'added')
}

export function untrackedFiles(state: RepoState): FilePath[] {
  return Object.keys(state.workingTree)
    .filter((path) => !(path in state.index))
    .sort()
}

export function isTracked(state: RepoState, path: FilePath): boolean {
  return path in state.index
}

export function isClean(state: RepoState): boolean {
  return (
    stagedChanges(state).length === 0 &&
    unstagedChanges(state).length === 0 &&
    untrackedFiles(state).length === 0
  )
}

/** A commit and every commit it is built on, nearest first. Handles merges without visiting a commit twice. */
export function ancestry(state: RepoState, from: CommitId | null): Commit[] {
  if (!from) return []

  const seen = new Set<CommitId>()
  const queue: CommitId[] = [from]
  const found: Commit[] = []

  while (queue.length > 0) {
    const id = queue.shift() as CommitId
    if (seen.has(id)) continue
    seen.add(id)

    const commit = state.commits[id]
    if (!commit) continue
    found.push(commit)
    queue.push(...commit.parents)
  }

  // Newest first, matching `git log`. Insertion order stands in for commit date.
  return found.sort((a, b) => b.order - a.order)
}

/** Every branch (and remote-tracking ref) pointing at a commit — the labels the graph draws. */
export function refsAt(state: RepoState, id: CommitId): string[] {
  const refs = Object.keys(state.branches)
    .filter((branch) => state.branches[branch] === id)
    .sort()
  const remotes = Object.keys(state.remoteBranches)
    .filter((ref) => state.remoteBranches[ref] === id)
    .sort()
  return [...refs, ...remotes]
}
