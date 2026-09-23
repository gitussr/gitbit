import { changeSummary } from '../diff'
import type { ParsedCommand } from '../parse'
import { currentBranch, headCommitId, resolve } from '../repo'
import { gitError, ok, type CommandResult } from '../result'
import type { Commit, RepoState, Tree } from '../types'
import { commitId } from '../hash'
import { concludeInProgress } from './commit'
import { abort, combine } from './merge'
import { rewriteFiles } from './moveHead'

/**
 * `git revert` — undoing a commit by adding one.
 *
 * It doesn't remove anything. It works out the *opposite* of what a commit
 * changed, applies that on top of where you are, and records it as a new
 * commit. History only grows, which is why this is the undo to use on work
 * other people already have: nothing they built on disappears (Section 18).
 *
 * The opposite is a three-way merge with the roles swapped: the commit is
 * the base, its parent is "theirs". So it can conflict — when later work
 * changed the same lines — and stops exactly the way a merge does.
 */
export function revert(state: RepoState, parsed: ParsedCommand): CommandResult {
  if (parsed.flags.abort === true) return abort(state, 'revert')
  if (parsed.flags.continue === true) {
    if (state.merging?.kind !== 'revert') {
      return { state, events: [], outcome: gitError('error: no cherry-pick or revert in progress\nfatal: revert failed', 'There is no revert waiting to be finished.') }
    }
    return concludeInProgress(state, parsed)
  }

  if (state.merging) {
    return {
      state,
      events: [],
      outcome: gitError(
        `error: ${state.merging.kind === 'merge' ? 'Merging' : 'Reverting'} is not possible because you have unmerged files.`,
        `Something is already in progress. Finish it with \`git commit\`, or back out with \`git ${state.merging.kind} --abort\`.`,
      ),
    }
  }

  const [target] = parsed.args
  if (target === undefined) {
    return { state, events: [], outcome: gitError('fatal: empty commit set passed', 'Say which commit to undo: `git revert HEAD` undoes the last one.') }
  }

  const id = resolve(state, target)
  const head = headCommitId(state)
  if (id === null || head === null) {
    return {
      state,
      events: [],
      outcome: gitError(`fatal: bad revision '${target}'`, `There's no commit called \`${target}\`. \`HEAD\` is the one you're on; \`HEAD~1\` the one before.`),
    }
  }

  const commit = state.commits[id]
  let parentIndex = 0
  if (commit.parents.length > 1) {
    // For a merge, `-m 1` / `-m 2` says which parent's side to go back to.
    const mainline = Number(parsed.flags.m)
    if (!(mainline >= 1 && mainline <= commit.parents.length)) {
      return {
        state,
        events: [],
        outcome: gitError(
          `error: commit ${id} is a merge but no -m option was given.\nfatal: revert failed`,
          'A merge commit has two parents, so "the opposite" has two meanings. `-m 1` undoes what the merge brought in and keeps your side.',
        ),
      }
    }
    parentIndex = mainline - 1
  }

  const parent = commit.parents[parentIndex]
  const parentTree: Tree = parent ? state.commits[parent].tree : {}
  const ourTree = state.commits[head].tree
  const label = `parent of ${id} (${commit.message})`
  const { toIndex, toDisk, conflicts } = combine(commit.tree, ourTree, parentTree, { ours: 'HEAD', theirs: label })

  const rewrite = rewriteFiles(state, toIndex, toDisk, 'merge')
  if ('kind' in rewrite) return { state, events: [], outcome: rewrite }

  const message = `Revert "${commit.message}"`

  if (conflicts.length > 0) {
    return {
      state: {
        ...state,
        index: rewrite.index,
        workingTree: rewrite.workingTree,
        merging: { kind: 'revert', theirs: id, theirsName: id, conflicts, touched: rewrite.paths, message },
      },
      events: [{ type: 'MERGE_CONFLICT', operation: 'revert', conflicts, paths: rewrite.paths }],
      outcome: ok([
        ...conflicts.map((path) => `CONFLICT (content): Merge conflict in ${path}`),
        `error: could not revert ${id}... ${commit.message}`,
        'hint: After resolving the conflicts, mark them with',
        'hint: "git add/rm <pathspec>", then run',
        'hint: "git revert --continue".',
      ]),
    }
  }

  if (rewrite.paths.length === 0) {
    return {
      state,
      events: [{ type: 'NOTHING_HAPPENED', reason: `What ${id} changed has already been undone — there is nothing left to reverse.` }],
      outcome: ok(['On branch ' + (currentBranch(state) ?? 'HEAD'), 'nothing to commit, working tree clean']),
    }
  }

  const tree = toIndex
  const newId = commitId([head], message, tree, state.commitCounter)
  const newCommit: Commit = { id: newId, message, parents: [head], tree, order: state.commitCounter }
  const branch = currentBranch(state)

  return {
    state: {
      ...state,
      commits: { ...state.commits, [newId]: newCommit },
      branches: branch ? { ...state.branches, [branch]: newId } : state.branches,
      HEAD: branch ? state.HEAD : { type: 'detached', commit: newId },
      commitCounter: state.commitCounter + 1,
      index: rewrite.index,
      workingTree: rewrite.workingTree,
    },
    events: [
      { type: 'COMMIT_CREATED', id: newId, message, paths: rewrite.paths, reverts: id },
      { type: 'HEAD_MOVED', from: head, to: newId },
    ],
    outcome: ok([`[${branch ?? 'detached HEAD'} ${newId}] ${message}`, changeSummary(ourTree, tree)]),
  }
}
