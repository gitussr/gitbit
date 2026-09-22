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
  | { type: 'FILE_RESTORED'; path: FilePath }
  | { type: 'COMMIT_CREATED'; id: CommitId; message: string; paths: FilePath[] }
  | { type: 'HEAD_MOVED'; from: CommitId | null; to: CommitId }
  | { type: 'BRANCH_CREATED'; name: BranchName; at: CommitId }
  | { type: 'BRANCH_SWITCHED'; from: BranchName | null; to: BranchName }
  | { type: 'MERGE_CREATED'; id: CommitId; parents: CommitId[] }
  | { type: 'FAST_FORWARD'; branch: BranchName; from: CommitId; to: CommitId }
  | { type: 'REMOTE_UPDATED'; ref: string; to: CommitId }
  | { type: 'RESET_PERFORMED'; mode: 'soft' | 'mixed' | 'hard'; to: CommitId }
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
