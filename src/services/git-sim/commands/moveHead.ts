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
import { gitError, ok, type CommandResult } from '../result'
import type { BranchName, CommitId, FilePath, HeadRef, RepoState, Tree } from '../types'

export type Destination = { type: 'branch'; branch: BranchName } | { type: 'detached'; commit: CommitId }

function without(tree: Tree, path: FilePath): Tree {
  const next = { ...tree }
  delete next[path]
  return next
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

  const leaving = headTree(state)
  // An unborn branch (`switch -c` before the first commit) has no snapshot to bring.
  const arriving = target ? state.commits[target].tree : leaving
  const changing = treeDiff(leaving, arriving).map((change) => change.path)

  const blocked = changing.filter((path) => {
    const settled = state.index[path] === leaving[path] && state.workingTree[path] === leaving[path]
    const alreadyThere = state.index[path] === arriving[path] && state.workingTree[path] === arriving[path]
    return !settled && !alreadyThere
  })
  // An untracked file sitting where the other branch keeps a file of the same name.
  const untrackedInTheWay = changing.filter(
    (path) =>
      !(path in state.index) &&
      path in state.workingTree &&
      path in arriving &&
      state.workingTree[path] !== arriving[path],
  )

  if (blocked.length > 0 || untrackedInTheWay.length > 0) {
    const tracked = blocked.filter((path) => !untrackedInTheWay.includes(path))
    const message =
      tracked.length > 0
        ? [
            'error: Your local changes to the following files would be overwritten by checkout:',
            ...tracked.map((path) => `\t${path}`),
            'Please commit your changes or stash them before you switch branches.',
            'Aborting',
          ]
        : [
            'error: The following untracked working tree files would be overwritten by checkout:',
            ...untrackedInTheWay.map((path) => `\t${path}`),
            'Please move or remove them before you switch branches.',
            'Aborting',
          ]
    return {
      state,
      events: [],
      outcome: gitError(
        message.join('\n'),
        tracked.length > 0
          ? `Switching would rewrite ${tracked.join(', ')} with the other branch's version, and you have changes there that aren't committed. Git won't destroy work you haven't saved — commit it first.`
          : `The other branch has its own ${untrackedInTheWay.join(', ')}, and an untracked file of that name is in the way. Git never overwrites a file it isn't tracking.`,
      ),
    }
  }

  let index = state.index
  let workingTree = state.workingTree
  for (const path of changing) {
    index = path in arriving ? { ...index, [path]: arriving[path] } : without(index, path)
    workingTree = path in arriving ? { ...workingTree, [path]: arriving[path] } : without(workingTree, path)
  }

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
