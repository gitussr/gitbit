/**
 * GitBit Visualizer simulation engine — public surface.
 *
 * Feature code imports from here, never from the modules underneath, so
 * the engine's internals stay free to change. Nothing in here imports
 * React or `src/content/**`: this module simulates Git, and explaining it
 * is a separate job (see `docs/VISUALIZER.md`).
 */

export { executeCommand } from './execute'
export { suggest } from './suggest'
export { complete } from './complete'
export {
  fileHistory,
  relationToHead,
  snapshot,
  timeline,
  type FileHistoryEntry,
  type HeadRelation,
  type SnapshotFile,
  type SnapshotStatus,
  type TimelineEntry,
} from './timeline'
export { historyGraph, remoteGraph, type GraphEdge, type GraphNode, type HistoryGraph } from './graph'
export { writeFile, deleteFile, teammatePush, type WorkspaceResult } from './workspace'
export { emptyState, projectFolder, folderWith, oneCommit, readyToMerge, seeds, type SeedName } from './seed'

export {
  aheadBehind,
  ancestry,
  currentBranch,
  headCommit,
  headCommitId,
  headTree,
  isClean,
  isTracked,
  refsAt,
  stagedChanges,
  treeDiff,
  unstagedChanges,
  untrackedFiles,
} from './repo'

export { fileDiff, formatDiff, treeDiffDetailed, type DiffHunk, type DiffLine, type FileDiff } from './diff'
export { isFailure, type CommandResult, type GitError, type GitOk, type Outcome, type ParseError, type Transition } from './result'
export { parse, IMPLEMENTED, type ParsedCommand } from './parse'
export type { GitEvent, GitEventType, ResetLayer } from './events'
export type {
  BranchName,
  ChangeKind,
  Commit,
  CommitId,
  FileChange,
  FilePath,
  HeadRef,
  RepoState,
  StashEntry,
  Tree,
} from './types'
export { meets, progress, type Expectation } from './progress'
