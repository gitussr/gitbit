import type { ParsedCommand } from '../parse'
import { currentBranch, headCommitId, resolve } from '../repo'
import { gitError, ok, type CommandResult } from '../result'
import type { BranchName, RepoState } from '../types'
import { invalidBranchName } from './branch'
import { moveHead } from './moveHead'

/**
 * Make `name` where HEAD is and move onto it — `switch -c` and
 * `checkout -b`. Before the first commit there's nothing to point it at,
 * so it renames the branch-to-be instead, which is what Git does too.
 */
export function createAndSwitch(state: RepoState, name: BranchName, flag: string): CommandResult {
  const invalid = invalidBranchName(name)
  if (invalid) return { state, events: [], outcome: invalid }

  if (name in state.branches) {
    return {
      state,
      events: [],
      outcome: gitError(
        `fatal: a branch named '${name}' already exists`,
        `\`${flag}\` makes a new branch, and \`${name}\` is taken. Drop the \`${flag}\` to go to the one that exists.`,
      ),
    }
  }

  const at = headCommitId(state)
  if (at === null) {
    return {
      state: { ...state, HEAD: { type: 'branch', branch: name } },
      events: [{ type: 'BRANCH_SWITCHED', from: currentBranch(state), to: name, paths: [] }],
      outcome: ok([`Switched to a new branch '${name}'`]),
    }
  }

  return moveHead({ ...state, branches: { ...state.branches, [name]: at } }, { type: 'branch', branch: name }, { created: name })
}

/** Already on it: Git says so and changes nothing. */
export function alreadyOn(state: RepoState, name: BranchName): CommandResult {
  return {
    state,
    events: [{ type: 'NOTHING_HAPPENED', reason: `HEAD is already on ${name}.` }],
    outcome: ok([`Already on '${name}'`]),
  }
}

/**
 * `git switch` — moving HEAD to another branch.
 *
 * Switching doesn't copy anything or move any commits. HEAD starts naming
 * a different branch, and the files on disk are rewritten to match the
 * snapshot that branch points at (Section 14: "HEAD tells Git where you
 * are currently positioned").
 *
 * `switch` only takes branches. Giving it a commit is refused unless you
 * say `--detach`, which is the safety `switch` was added to Git for.
 */
export function switchCommand(state: RepoState, parsed: ParsedCommand): CommandResult {
  const create = parsed.flags.c ?? parsed.flags.create
  if (create === true) {
    return { state, events: [], outcome: gitError("error: switch `c' requires a value", 'Name the new branch: `git switch -c feature`.') }
  }
  if (typeof create === 'string') return createAndSwitch(state, create, '-c')

  const [target] = parsed.args

  if (parsed.flags.detach === true) {
    const commit = resolve(state, target ?? 'HEAD')
    if (commit === null) {
      return {
        state,
        events: [],
        outcome: gitError(`fatal: invalid reference: ${target ?? 'HEAD'}`, 'There is no branch or commit by that name to stand on.'),
      }
    }
    return moveHead(state, { type: 'detached', commit })
  }

  if (target === undefined) {
    return {
      state,
      events: [],
      outcome: gitError('fatal: missing branch or commit argument', 'Say where to go: `git switch main`, or `git switch -c new-branch` to make one.'),
    }
  }

  if (target in state.branches) {
    if (target === currentBranch(state)) return alreadyOn(state, target)
    return moveHead(state, { type: 'branch', branch: target })
  }

  if (resolve(state, target) !== null) {
    return {
      state,
      events: [],
      outcome: gitError(
        `fatal: a branch is expected, got commit '${target}'\nhint: If you want to detach HEAD at the commit, try again with the --detach option.`,
        '`git switch` goes to branches. Standing on a bare commit is "detached HEAD" — allowed, but new commits there belong to no branch, so Git makes you ask for it.',
      ),
    }
  }

  return {
    state,
    events: [],
    outcome: gitError(
      `fatal: invalid reference: ${target}`,
      `There is no branch called \`${target}\`. To make one and move onto it: \`git switch -c ${target}\`.`,
    ),
  }
}
