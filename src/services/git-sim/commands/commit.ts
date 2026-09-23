import { changeSummary } from '../diff'
import type { GitEvent } from '../events'
import { commitId } from '../hash'
import type { ParsedCommand } from '../parse'
import { currentBranch, headCommitId, headTree, stagedChanges, treeDiff, unstagedChanges, untrackedFiles } from '../repo'
import { gitError, ok, type CommandResult } from '../result'
import type { Commit, RepoState } from '../types'

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
  if (state.merging) return concludeInProgress(state, parsed)

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
    outcome: ok([`[${prefix}${root} ${id}] ${message}`, changeSummary(headTree(state), state.index)]),
  }
}

/**
 * `git commit` during a stopped merge or revert: records the commit the
 * conflicts interrupted, with the index as you've resolved it.
 *
 * A merge concludes with two parents — where you were, and what you
 * merged in — even if you kept your side everywhere, because the history
 * *was* combined. A revert concludes with one: it's an ordinary commit
 * that happens to undo another.
 */
export function concludeInProgress(state: RepoState, parsed: ParsedCommand): CommandResult {
  const merging = state.merging as NonNullable<RepoState['merging']>

  if (merging.conflicts.length > 0) {
    return {
      state,
      events: [],
      outcome: gitError(
        "error: Committing is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use 'git add/rm <file>'\nhint: as appropriate to mark resolution and make a commit.\nfatal: Exiting because of an unresolved conflict.",
        `Still unresolved: ${merging.conflicts.join(', ')}. Edit each one to what it should say, then \`git add\` it to tell Git it's settled.`,
      ),
    }
  }

  const message = typeof parsed.flags.m === 'string' ? parsed.flags.m : merging.message
  const ours = headCommitId(state) as string
  const parents = merging.kind === 'merge' ? [ours, merging.theirs] : [ours]
  const tree = { ...state.index }
  const id = commitId(parents, message, tree, state.commitCounter)
  const branch = currentBranch(state)

  const next: RepoState = {
    ...state,
    commits: { ...state.commits, [id]: { id, message, parents, tree, order: state.commitCounter } },
    branches: branch ? { ...state.branches, [branch]: id } : state.branches,
    HEAD: branch ? state.HEAD : { type: 'detached', commit: id },
    commitCounter: state.commitCounter + 1,
    merging: null,
  }

  return {
    state: next,
    events: [
      merging.kind === 'merge'
        ? { type: 'MERGE_CREATED', id, parents, paths: [] }
        : { type: 'COMMIT_CREATED', id, message, paths: treeDiff(headTree(state), tree).map((change) => change.path), reverts: merging.theirs },
      { type: 'HEAD_MOVED', from: ours, to: id },
    ],
    outcome: ok([`[${branch ?? 'detached HEAD'} ${id}] ${message}`]),
  }
}
