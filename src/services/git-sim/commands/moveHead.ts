/**
 * Moving HEAD somewhere else — what `git switch` and `git checkout` share.
 *
 * The part worth being exact about is what happens to the files. Git
 * rewrites only the paths that differ between the snapshot you're leaving
 * and the one you're going to. Everything else on disk is left alone —
 * including uncommitted work, which is why an edit you haven't committed
 * *follows you* to the other branch. That surprises nearly everyone, and
 * it falls straight out of the rule: the edit isn't on any branch yet.
 *
 * The one case Git refuses is when a path it needs to rewrite has local
 * changes, because rewriting it would destroy them.
 */

import type { GitEvent } from '../events'
import { currentBranch, headCommitId, headTree, treeDiff } from '../repo'
import { gitError, ok, type CommandResult, type GitError } from '../result'
import type { BranchName, CommitId, FilePath, HeadRef, RepoState, Tree } from '../types'

export type Destination = { type: 'branch'; branch: BranchName } | { type: 'detached'; commit: CommitId }

function without(tree: Tree, path: FilePath): Tree {
  const next = { ...tree }
  delete next[path]
  return next
}

export interface Rewrite {
  index: Tree
  workingTree: Tree
  /** Every path that was written or removed. */
  paths: FilePath[]
}

/**
 * Bring the index and working tree from HEAD's snapshot to new contents,
 * touching only the paths that differ — or refuse, if that would destroy
 * something. Shared by everything that moves you onto another snapshot:
 * switching, and merging.
 *
 * The index and the disk can be given different targets because a merge
 * that stops for conflicts needs exactly that: the conflicted file's
 * markers on disk, and your own version still in the index.
 */
export function rewriteFiles(
  state: RepoState,
  toIndex: Tree,
  toDisk: Tree,
  operation: 'checkout' | 'merge',
): Rewrite | GitError {
  const leaving = headTree(state)
  const paths = [
    ...new Set([...treeDiff(leaving, toIndex), ...treeDiff(leaving, toDisk)].map((change) => change.path)),
  ].sort()

  const blocked = paths.filter((path) => {
    const settled = state.index[path] === leaving[path] && state.workingTree[path] === leaving[path]
    const alreadyThere = state.index[path] === toIndex[path] && state.workingTree[path] === toDisk[path]
    return !settled && !alreadyThere
  })
  // An untracked file sitting where the other snapshot keeps a file of the same name.
  const untrackedInTheWay = paths.filter(
    (path) =>
      !(path in state.index) &&
      path in state.workingTree &&
      path in toDisk &&
      state.workingTree[path] !== toDisk[path],
  )

  if (blocked.length > 0 || untrackedInTheWay.length > 0) {
    const tracked = blocked.filter((path) => !untrackedInTheWay.includes(path))
    const leave = operation === 'checkout' ? 'switch branches' : 'merge'
    const message =
      tracked.length > 0
        ? [
            `error: Your local changes to the following files would be overwritten by ${operation}:`,
            ...tracked.map((path) => `\t${path}`),
            `Please commit your changes or stash them before you ${leave}.`,
            'Aborting',
          ]
        : [
            `error: The following untracked working tree files would be overwritten by ${operation}:`,
            ...untrackedInTheWay.map((path) => `\t${path}`),
            `Please move or remove them before you ${leave}.`,
            'Aborting',
          ]
    const doing = operation === 'checkout' ? 'Switching' : 'Merging'
    return gitError(
      message.join('\n'),
      tracked.length > 0
        ? `${doing} would rewrite ${tracked.join(', ')}, and you have changes there that aren't committed. Git won't destroy work you haven't saved — commit it first.`
        : `The other side has its own ${untrackedInTheWay.join(', ')}, and an untracked file of that name is in the way. Git never overwrites a file it isn't tracking.`,
    )
  }

  let index = state.index
  let workingTree = state.workingTree
  for (const path of paths) {
    index = path in toIndex ? { ...index, [path]: toIndex[path] } : without(index, path)
    workingTree = path in toDisk ? { ...workingTree, [path]: toDisk[path] } : without(workingTree, path)
  }
  return { index, workingTree, paths }
}

/**
 * Point HEAD at `destination` and bring the index and working tree along.
 * `created` names a branch this same command just made, so the result
 * reads as one step rather than two.
 */
export function moveHead(
  state: RepoState,
  destination: Destination,
  options: { created?: BranchName } = {},
): CommandResult {
  const fromBranch = currentBranch(state)
  const fromCommit = headCommitId(state)
  const target = destination.type === 'branch' ? (state.branches[destination.branch] ?? null) : destination.commit

  // An unborn branch (`switch -c` before the first commit) has no snapshot to bring.
  const arriving = target ? state.commits[target].tree : headTree(state)
  const rewrite = rewriteFiles(state, arriving, arriving, 'checkout')
  if ('kind' in rewrite) return { state, events: [], outcome: rewrite }
  const { index, workingTree, paths: changing } = rewrite

  const HEAD: HeadRef =
    destination.type === 'branch' ? { type: 'branch', branch: destination.branch } : { type: 'detached', commit: destination.commit }

  const next: RepoState = { ...state, HEAD, index, workingTree }

  const events: GitEvent[] = []
  if (options.created && target) events.push({ type: 'BRANCH_CREATED', name: options.created, at: target })
  events.push(
    destination.type === 'branch'
      ? { type: 'BRANCH_SWITCHED', from: fromBranch, to: destination.branch, paths: changing }
      : { type: 'HEAD_DETACHED', at: destination.commit, paths: changing },
  )
  if (target && target !== fromCommit) events.push({ type: 'HEAD_MOVED', from: fromCommit, to: target })

  const output =
    destination.type === 'branch'
      ? [options.created ? `Switched to a new branch '${destination.branch}'` : `Switched to branch '${destination.branch}'`]
      : // Git's own advice, less the lines about config and `git switch -`,
        // which the simulator doesn't have.
        [
          `Note: switching to '${destination.commit}'.`,
          '',
          "You are in 'detached HEAD' state. You can look around, make experimental",
          'changes and commit them, and you can discard any commits you make in this',
          'state without impacting any branches by switching back to a branch.',
          '',
          'If you want to create a new branch to retain commits you create, you may',
          'do so (now or later) by using -c with the switch command. Example:',
          '',
          '  git switch -c <new-branch-name>',
          '',
          `HEAD is now at ${destination.commit} ${state.commits[destination.commit].message}`,
        ]

  return { state: next, events, outcome: ok(output) }
}
