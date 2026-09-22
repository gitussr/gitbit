/**
 * Editing files in the sandbox.
 *
 * Not Git commands — this is the user doing what an editor does, which
 * Scenario 1 needs before `git status` has anything to report. Kept beside
 * the commands because it changes the same state and emits the same
 * events, so the Visualizer animates a file being edited exactly the way
 * it animates one being staged.
 */

import type { GitEvent } from './events'
import type { FilePath, RepoState } from './types'

export interface WorkspaceResult {
  state: RepoState
  events: GitEvent[]
}

/** Create a file, or overwrite one that exists. Mirrors saving in an editor. */
export function writeFile(state: RepoState, path: FilePath, content: string): WorkspaceResult {
  if (state.workingTree[path] === content) {
    return { state, events: [{ type: 'NOTHING_HAPPENED', reason: 'The file already has exactly these contents.' }] }
  }

  return {
    state: { ...state, workingTree: { ...state.workingTree, [path]: content } },
    events: [{ type: 'FILE_MODIFIED', path }],
  }
}

/**
 * Delete a file from disk.
 *
 * The index is untouched on purpose. A tracked file deleted on disk is a
 * *deletion Git hasn't been told about yet* — `git status` shows it as an
 * unstaged change, and that is the correct, teachable behaviour.
 */
export function deleteFile(state: RepoState, path: FilePath): WorkspaceResult {
  if (!(path in state.workingTree)) {
    return { state, events: [{ type: 'NOTHING_HAPPENED', reason: `There is no ${path} on disk.` }] }
  }

  const workingTree = { ...state.workingTree }
  delete workingTree[path]

  return { state: { ...state, workingTree }, events: [{ type: 'FILE_MODIFIED', path }] }
}
