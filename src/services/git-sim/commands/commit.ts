import { treeDiffDetailed } from '../diff'
import type { GitEvent } from '../events'
import { commitId } from '../hash'
import type { ParsedCommand } from '../parse'
import { currentBranch, headCommitId, headTree, stagedChanges, unstagedChanges, untrackedFiles } from '../repo'
import { gitError, ok, type CommandResult } from '../result'
import type { Commit, RepoState } from '../types'

/** `N files changed, N insertions(+), N deletions(-)` — counted from the real diff, not estimated. */
function summarize(state: RepoState): string {
  const diffs = treeDiffDetailed(headTree(state), state.index)
  let insertions = 0
  let deletions = 0

  for (const diff of diffs) {
    for (const hunk of diff.hunks) {
      for (const line of hunk.lines) {
        if (line.kind === 'add') insertions += 1
        if (line.kind === 'remove') deletions += 1
      }
    }
  }

  const parts = [`${diffs.length} file${diffs.length === 1 ? '' : 's'} changed`]
  if (insertions > 0) parts.push(`${insertions} insertion${insertions === 1 ? '' : 's'}(+)`)
  if (deletions > 0) parts.push(`${deletions} deletion${deletions === 1 ? '' : 's'}(-)`)
  return ` ${parts.join(', ')}`
}

/**
 * `git commit` — recording the index as a permanent snapshot.
 *
 * Two things worth being exact about, because both are commonly taught
 * wrong. It records the **index**, not the working directory: edits you
 * haven't staged are not in this commit. And it does **not** empty the
 * index — the Staging Area looks empty afterwards because the index and
 * the new HEAD now hold the same thing (Section 38).
 */
export function commit(state: RepoState, parsed: ParsedCommand): CommandResult {
  const staged = stagedChanges(state)

  if (staged.length === 0) {
    const hasWork = unstagedChanges(state).length > 0 || untrackedFiles(state).length > 0
    return {
      state,
      // A failure changed nothing, and the outcome already says why. Events
      // describe change; an empty list here is what `execute.ts` relies on.
      events: [],
      outcome: gitError(
        hasWork
          ? 'no changes added to commit (use "git add" and/or "git commit -a")'
          : 'nothing to commit, working tree clean',
        hasWork
          ? 'You have changes, but none of them are staged. `git commit` records the Staging Area, and yours is empty — `git add` first.'
          : 'Everything on disk already matches the last commit. There is no difference left to record.',
      ),
    }
  }

  const message = String(parsed.flags.m)
  const parentId = headCommitId(state)
  const parents = parentId ? [parentId] : []
  const tree = { ...state.index }
  const id = commitId(parents, message, tree, state.commitCounter)

  const newCommit: Commit = { id, message, parents, tree, order: state.commitCounter }
  const branch = currentBranch(state)
  const branchIsNew = branch !== null && !(branch in state.branches)

  const next: RepoState = {
    ...state,
    commits: { ...state.commits, [id]: newCommit },
    branches: branch ? { ...state.branches, [branch]: id } : state.branches,
    HEAD: branch ? state.HEAD : { type: 'detached', commit: id },
    commitCounter: state.commitCounter + 1,
  }

  const events: GitEvent[] = [{ type: 'COMMIT_CREATED', id, message, paths: staged.map((change) => change.path) }]
  if (branchIsNew && branch) events.push({ type: 'BRANCH_CREATED', name: branch, at: id })
  events.push({ type: 'HEAD_MOVED', from: parentId, to: id })

  const prefix = branch ?? 'detached HEAD'
  const root = parents.length === 0 ? ' (root-commit)' : ''

  return {
    state: next,
    events,
    outcome: ok([`[${prefix}${root} ${id}] ${message}`, summarize(state)]),
  }
}
