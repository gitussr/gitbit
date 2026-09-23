/**
 * What a command *did*, as data (Section 37).
 *
 * Events are the engine's only output besides the new state. They drive
 * animation, explanation, Aha and Recall — one vocabulary, so a new
 * command gets all four by emitting the right events rather than by
 * touching four subsystems.
 *
 * Deliberately a small, flat union. Section 37 warns against an elaborate
 * event architecture, and nothing here needs one.
 */

import type { BranchName, CommitId, FilePath } from './types'

export type GitEvent =
  | { type: 'REPO_INITIALIZED'; branch: BranchName }
  | { type: 'FILE_MODIFIED'; path: FilePath }
  | { type: 'FILE_STAGED'; path: FilePath }
  | { type: 'FILE_UNSTAGED'; path: FilePath }
  /**
   * A file's contents were put back from the index or a commit.
   * `discarded` is true when that destroyed uncommitted work on disk —
   * Git keeps no copy, so this is the event the caution treatment hangs on.
   */
  | { type: 'FILE_RESTORED'; path: FilePath; discarded: boolean }
  /** `reverts` is set when the commit is `git revert` undoing an earlier one. */
  | { type: 'COMMIT_CREATED'; id: CommitId; message: string; paths: FilePath[]; reverts?: CommitId }
  | { type: 'HEAD_MOVED'; from: CommitId | null; to: CommitId }
  | { type: 'BRANCH_CREATED'; name: BranchName; at: CommitId }
  | { type: 'BRANCH_DELETED'; name: BranchName; at: CommitId }
  /**
   * HEAD now names a different branch. `paths` are the files the switch
   * rewrote on disk — empty when both branches point at the same snapshot,
   * which is itself worth seeing: switching moved a pointer and nothing
   * else.
   */
  | { type: 'BRANCH_SWITCHED'; from: BranchName | null; to: BranchName; paths: FilePath[] }
  /** HEAD now names a commit directly, with no branch in between (Section 14). */
  | { type: 'HEAD_DETACHED'; at: CommitId; paths: FilePath[] }
  /** A commit with two parents: histories combined (Section 16). `paths` were rewritten on disk. */
  | { type: 'MERGE_CREATED'; id: CommitId; parents: CommitId[]; paths: FilePath[] }
  /**
   * The branch label slid forward along commits that already existed.
   * No new commit — kept apart from MERGE_CREATED because showing that not
   * every merge makes a commit is the point (Section 16). `branch` is null
   * when HEAD was detached.
   */
  | { type: 'FAST_FORWARD'; branch: BranchName | null; from: CommitId | null; to: CommitId; paths: FilePath[] }
  /** The merge did everything it could and stopped: these paths need you. */
  | { type: 'MERGE_CONFLICT'; operation: 'merge' | 'revert'; conflicts: FilePath[]; paths: FilePath[] }
  /** `git add` on a conflicted path: you've told Git this file is settled. */
  | { type: 'CONFLICT_RESOLVED'; path: FilePath }
  /** `git merge --abort` / `git revert --abort`: everything it wrote is put back. */
  | { type: 'MERGE_ABORTED'; paths: FilePath[] }
  | { type: 'REMOTE_ADDED'; name: string; url: string }
  /**
   * Commits crossed the boundary between your repository and the remote
   * (Section 22). `push` sends yours there; `fetch` brings theirs here and
   * moves your remote-tracking ref; `elsewhere` is someone else pushing to
   * the remote — nothing on your machine changes until you fetch.
   * `commits` are the ones that crossed.
   */
  | {
      type: 'REMOTE_UPDATED'
      direction: 'push' | 'fetch' | 'elsewhere'
      remote: string
      branch: BranchName
      from: CommitId | null
      to: CommitId
      commits: CommitId[]
    }
  /**
   * `git reset` (Section 18). `layers` are the places it changed, in the
   * order they change: the branch HEAD is on, then the index, then the
   * disk — which is the whole difference between the three modes.
   * `discarded` are paths whose uncommitted changes `--hard` destroyed.
   */
  | {
      type: 'RESET_PERFORMED'
      mode: 'soft' | 'mixed' | 'hard'
      from: CommitId | null
      to: CommitId
      layers: ResetLayer[]
      paths: FilePath[]
      discarded: FilePath[]
    }
  | { type: 'WORK_STASHED'; paths: FilePath[] }
  /**
   * Nothing changed, and that is the point.
   *
   * `git status`, `git log` and `git diff` only look. Without this event a
   * read-only command would return an empty array, and an empty array is
   * indistinguishable from "we forgot to emit anything" — the UI would
   * happily animate a successful move that never happened (Section 38).
   */
  | { type: 'NOTHING_HAPPENED'; reason: string }

export type GitEventType = GitEvent['type']

/** The three places `git reset` can change, named the way Section 18 draws them. */
export type ResetLayer = 'head' | 'index' | 'worktree'
