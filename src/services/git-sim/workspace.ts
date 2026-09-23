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
import { commitId } from './hash'
import type { Commit, FilePath, RepoState } from './types'

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

/**
 * Someone else pushes to the remote. Not a Git command you run — it's the
 * world moving on without you, which is what `fetch` and `pull` exist to
 * deal with (Section 22). Only the remote changes: your repository,
 * including `origin/main`, has no idea until you fetch.
 */
export function teammatePush(state: RepoState): WorkspaceResult {
  const remote = state.remote
  const branch = remote && (remote.branches[state.defaultBranch] ? state.defaultBranch : Object.keys(remote.branches)[0])
  if (!remote || !branch) {
    return { state, events: [{ type: 'NOTHING_HAPPENED', reason: 'There is no remote branch for anyone else to push to yet.' }] }
  }

  const parent = remote.branches[branch]
  const tree = remote.commits[parent].tree
  const count = Object.values(remote.commits).filter((commit) => commit.message.startsWith('Teammate:')).length + 1
  const next = { ...tree, 'NOTES.md': `${tree['NOTES.md'] ?? ''}Note ${count} from a teammate\n` }
  const message = `Teammate: add note ${count}`
  const id = commitId([parent], message, next, state.commitCounter)
  const commit: Commit = { id, message, parents: [parent], tree: next, order: state.commitCounter }

  return {
    state: {
      ...state,
      commitCounter: state.commitCounter + 1,
      remote: { ...remote, commits: { ...remote.commits, [id]: commit }, branches: { ...remote.branches, [branch]: id } },
    },
    events: [{ type: 'REMOTE_UPDATED', direction: 'elsewhere', remote: remote.name, branch, from: parent, to: id, commits: [id] }],
  }
}
