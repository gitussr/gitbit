/**
 * The Time Machine's view of history (Sections 19, 20, 24).
 *
 * Read-only: nothing here moves HEAD or touches a file. Looking at an old
 * commit is not the same as going there, and conflating the two would
 * teach that browsing history changes your project. Going there is a real
 * command (`git switch --detach`), and the UI offers it as one.
 */

import { ancestry, headCommitId, treeDiff } from './repo'
import type { BranchName, ChangeKind, Commit, CommitId, FilePath, RepoState, Tree } from './types'

export interface TimelineEntry {
  commit: Commit
  /** Branches pointing here. */
  branches: BranchName[]
  isHead: boolean
  /**
   * Whether any branch, remote-tracking ref or HEAD still leads here.
   * `git reset` and deleting a branch leave commits that nothing reaches:
   * they're still in the repository — this is how you find them again,
   * the way `git reflog` does.
   */
  reachable: boolean
}

/** Every commit ever made, oldest first — reachable or not. */
export function timeline(state: RepoState): TimelineEntry[] {
  const reachable = new Set<CommitId>()
  const tips = [...Object.values(state.branches), ...Object.values(state.remoteBranches), headCommitId(state)]
  for (const tip of tips) {
    if (tip) for (const commit of ancestry(state, tip)) reachable.add(commit.id)
  }

  const head = headCommitId(state)
  return Object.values(state.commits)
    .sort((a, b) => a.order - b.order)
    .map((commit) => ({
      commit,
      branches: Object.keys(state.branches)
        .filter((branch) => state.branches[branch] === commit.id)
        .sort(),
      isHead: commit.id === head,
      reachable: reachable.has(commit.id),
    }))
}

export type SnapshotStatus = ChangeKind | 'unchanged'

export interface SnapshotFile {
  path: FilePath
  /** Compared with the commit's first parent — what *this* commit did to the file. */
  status: SnapshotStatus
}

/**
 * The whole project as a commit recorded it (Section 24: a commit is a
 * snapshot, not a patch) — every file, marked with what this commit did to
 * it. Files the commit deleted are listed too, so the snapshot and the
 * change are both visible.
 */
export function snapshot(state: RepoState, id: CommitId): SnapshotFile[] {
  const commit = state.commits[id]
  const parent: Tree = commit.parents[0] ? state.commits[commit.parents[0]].tree : {}
  const changes = new Map(treeDiff(parent, commit.tree).map((change) => [change.path, change.kind]))
  const paths = [...new Set([...Object.keys(commit.tree), ...changes.keys()])].sort()
  return paths.map((path) => ({ path, status: changes.get(path) ?? 'unchanged' }))
}

export interface FileHistoryEntry {
  commit: Commit
  change: ChangeKind
}

/**
 * Where a file's story happened (Section 20): the commits, along the
 * history HEAD can reach, that created, modified or deleted it. Oldest
 * first, the way a story is told.
 */
export function fileHistory(state: RepoState, path: FilePath, from: CommitId | null = headCommitId(state)): FileHistoryEntry[] {
  if (from === null) return []
  const entries: FileHistoryEntry[] = []
  for (const commit of ancestry(state, from)) {
    const parent: Tree = commit.parents[0] ? state.commits[commit.parents[0]].tree : {}
    if (parent[path] === commit.tree[path]) continue
    // A merge that took one side's version as-is didn't change the file —
    // the commit on that side did, and it's already in this list. That's
    // how `git log -- <file>` treats merges too.
    if (commit.parents.slice(1).some((id) => state.commits[id].tree[path] === commit.tree[path])) continue
    const change: ChangeKind = !(path in parent) ? 'added' : !(path in commit.tree) ? 'deleted' : 'modified'
    entries.push({ commit, change })
  }
  return entries.reverse()
}

/**
 * Where a commit sits relative to HEAD, in words the Time Machine can
 * show. `steps` is the `HEAD~n` that names it, or null when it's in
 * HEAD's history only through a merge's second parent (no `~n` reaches
 * it). `elsewhere` is on another line of work, or nowhere at all.
 */
export type HeadRelation = { kind: 'head' } | { kind: 'behind'; steps: number | null } | { kind: 'elsewhere' }

export function relationToHead(state: RepoState, id: CommitId): HeadRelation {
  const head = headCommitId(state)
  if (id === head) return { kind: 'head' }
  if (!head) return { kind: 'elsewhere' }

  let cursor: CommitId | undefined = head
  for (let steps = 0; cursor; steps += 1) {
    if (cursor === id) return { kind: 'behind', steps }
    cursor = state.commits[cursor].parents[0]
  }
  return ancestry(state, head).some((commit) => commit.id === id) ? { kind: 'behind', steps: null } : { kind: 'elsewhere' }
}
