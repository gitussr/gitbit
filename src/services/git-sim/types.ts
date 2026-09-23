/**
 * GitBit Visualizer — the shape of the simulated repository
 * (see `docs/VISUALIZER.md`).
 *
 * This module is pure data. Nothing here imports React, and nothing here
 * imports `src/content/**`: the engine simulates Git, it does not teach it.
 * Turning a state change into an explanation is the Explainer's job.
 */

export type FilePath = string
export type CommitId = string
export type BranchName = string

/**
 * A complete snapshot of the project at one moment, path → contents.
 *
 * Git stores trees and blobs and shares them between commits; storing the
 * whole snapshot per commit costs a little memory and buys Section 24's
 * mental model literally — a commit *is* the state of the project, not a
 * patch against the one before it.
 */
export type Tree = Record<FilePath, string>

export interface Commit {
  id: CommitId
  message: string
  /** Empty for the first commit, two entries for a merge (Section 16). */
  parents: CommitId[]
  tree: Tree
  /**
   * Insertion order. The simulator has no clock, and `git log` orders by
   * commit date — this is what stands in for it, so log output and graph
   * layout stay stable instead of depending on object key order.
   */
  order: number
}

/**
 * Where you are. `detached` is a real Git state and one of Section 14's
 * Aha moments, so it is modelled from the start even though no Phase 1
 * command reaches it.
 */
export type HeadRef =
  | { type: 'branch'; branch: BranchName }
  | { type: 'detached'; commit: CommitId }

export interface StashEntry {
  id: string
  message: string
  workingTree: Tree
  index: Tree
}

/**
 * A merge in progress (Section 16).
 *
 * Git doesn't refuse a conflicting merge: it does every part it can, writes
 * both versions into the conflicted files, and waits. Until you resolve
 * each file (`git add`) and conclude (`git commit`) — or give up
 * (`git merge --abort`) — the repository is in this in-between state.
 */
export interface MergeState {
  /** The commit being merged in. It becomes the merge commit's second parent. */
  theirs: CommitId
  /** How to name it in conflict markers and the default message: the branch, or the commit id. */
  theirsName: string
  /** Paths still unresolved. `git add` removes a path from here. */
  conflicts: FilePath[]
  /** Every path the merge wrote to, so `--abort` knows what to put back. */
  touched: FilePath[]
  /** The message the merge commit gets if you don't give one. */
  message: string
}

export interface RepoState {
  /** False until `git init`. Files can still sit on disk — a folder is not a repository. */
  initialized: boolean

  /** The files on disk, as they are right now. */
  workingTree: Tree

  /**
   * The index, holding **every tracked file** — not only the ones with
   * pending changes.
   *
   * This is the detail most Git simulators get wrong, and getting it right
   * is what makes the rest honest. `git commit` does not empty the index;
   * it records it. The Staging Area *looks* empty afterwards because the
   * index and HEAD now agree, which is exactly what `stagedChanges()`
   * derives. It is also what makes `reset --soft/--mixed/--hard` fall out
   * as three different layers (Section 18) rather than three special cases.
   */
  index: Tree

  commits: Record<CommitId, Commit>
  branches: Record<BranchName, CommitId>
  HEAD: HeadRef

  /** Whether an `origin` remote is configured. A remote is a setting, not a place that always exists. */
  hasRemote: boolean
  /** Remote-tracking refs, e.g. `origin/main` → commit id. */
  remoteBranches: Record<string, CommitId>

  stash: StashEntry[]

  /**
   * A merge that stopped for conflicts and is waiting for you — Git's
   * `MERGE_HEAD`. Null the rest of the time.
   */
  merging: MergeState | null

  /** Monotonic, feeds `Commit.order`. */
  commitCounter: number

  /**
   * The branch `git init` will create on the first commit. Set by init and
   * never read again — a branch ref does not exist until something points
   * at a commit, which is why `git branch` prints nothing in a fresh repo.
   */
  defaultBranch: BranchName
}

/** How a path differs between two trees. */
export type ChangeKind = 'added' | 'modified' | 'deleted'

export interface FileChange {
  path: FilePath
  kind: ChangeKind
}
