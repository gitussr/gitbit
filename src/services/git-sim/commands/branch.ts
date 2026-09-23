import type { ParsedCommand } from '../parse'
import { contains, currentBranch, headCommitId, resolve } from '../repo'
import { gitError, ok, type CommandResult, type GitError } from '../result'
import type { BranchName, RepoState } from '../types'

/**
 * Git's ref-name rules, the parts someone could plausibly type: no `..`,
 * no leading `-` or `/`, no trailing `/` or `.lock`, none of `~^:?*[\`.
 * Spaces never get this far — they split the name into two arguments.
 */
export function invalidBranchName(name: string): GitError | null {
  const bad =
    name === 'HEAD' ||
    name.startsWith('-') ||
    name.startsWith('/') ||
    name.endsWith('/') ||
    name.endsWith('.') ||
    name.endsWith('.lock') ||
    name.includes('..') ||
    name.includes('//') ||
    /[~^:?*[\\\s]/.test(name)

  if (!bad) return null
  return gitError(
    `fatal: '${name}' is not a valid branch name`,
    'Branch names can use letters, numbers, `-`, `_`, `.` and `/` (as in `feature/login`), but not spaces, `..`, or `~^:?*[\\`.',
  )
}

/** A branch can be made where HEAD is only once HEAD is somewhere. */
export function unbornError(state: RepoState): GitError {
  const branch = currentBranch(state) ?? state.defaultBranch
  return gitError(
    `fatal: not a valid object name: '${branch}'`,
    `A branch points at a commit, and there isn't one yet — even \`${branch}\` doesn't exist until the first commit. Commit something, then branch from it.`,
  )
}

function list(state: RepoState): CommandResult {
  const current = currentBranch(state)
  const lines = Object.keys(state.branches)
    .sort()
    .map((branch) => `${branch === current ? '*' : ' '} ${branch}`)
  if (state.HEAD.type === 'detached') lines.unshift(`* (HEAD detached at ${state.HEAD.commit})`)

  return {
    state,
    events: [
      {
        type: 'NOTHING_HAPPENED',
        reason:
          lines.length === 0
            ? '`git branch` lists branches, and there are none yet — a branch appears with the first commit.'
            : '`git branch` with no name only lists. The `*` marks the one HEAD is on.',
      },
    ],
    outcome: ok(lines),
  }
}

function remove(state: RepoState, names: string[], force: boolean): CommandResult {
  if (names.length === 0) {
    return { state, events: [], outcome: gitError('fatal: branch name required', 'Say which branch to delete: `git branch -d <name>`.') }
  }

  const head = headCommitId(state)
  let branches = state.branches
  const events: CommandResult['events'] = []
  const out: string[] = []

  for (const name of names) {
    const at = branches[name]
    if (at === undefined) {
      return {
        state,
        events: [],
        outcome: gitError(`error: branch '${name}' not found`, 'There is no branch by that name. `git branch` lists the ones there are.'),
      }
    }
    if (name === currentBranch(state)) {
      return {
        state,
        events: [],
        outcome: gitError(
          `error: cannot delete branch '${name}' used by worktree at '/project'`,
          `HEAD is on \`${name}\`. Deleting it would leave you standing on nothing — switch to another branch first.`,
        ),
      }
    }
    if (!force && head && !contains(state, head, at)) {
      return {
        state,
        events: [],
        outcome: gitError(
          `error: the branch '${name}' is not fully merged.\nIf you are sure you want to delete it, run 'git branch -D ${name}'.`,
          `\`${name}\` has commits that no other branch you're on reaches. Deleting the name would leave them with nothing pointing at them. \`-D\` does it anyway.`,
        ),
      }
    }

    branches = { ...branches }
    delete branches[name]
    events.push({ type: 'BRANCH_DELETED', name, at })
    out.push(`Deleted branch ${name} (was ${at}).`)
  }

  return { state: { ...state, branches }, events, outcome: ok(out) }
}

/**
 * `git branch` — list, create, or delete branches.
 *
 * Creating one is the cheapest thing Git does: a new name pointing at the
 * commit you're on. Nothing is copied, HEAD doesn't move, and the working
 * directory doesn't change (Section 15 — "a branch is a movable reference
 * pointing to a commit", not a copy of the project). That `git branch x`
 * leaves you *on the old branch* is one of the most common surprises in
 * Git, and here it's visible: a label appears, and HEAD stays put.
 */
export function branch(state: RepoState, parsed: ParsedCommand): CommandResult {
  if (parsed.flags.d === true || parsed.flags.D === true || parsed.flags.delete === true) {
    return remove(state, parsed.args, parsed.flags.D === true)
  }

  const [name, startPoint] = parsed.args as [BranchName | undefined, string | undefined]
  if (name === undefined) return list(state)

  const invalid = invalidBranchName(name)
  if (invalid) return { state, events: [], outcome: invalid }

  if (name in state.branches) {
    return {
      state,
      events: [],
      outcome: gitError(
        `fatal: a branch named '${name}' already exists`,
        `Branch names are unique. \`git switch ${name}\` goes to the existing one.`,
      ),
    }
  }

  const at = startPoint === undefined ? headCommitId(state) : resolve(state, startPoint)
  if (at === null) {
    if (startPoint === undefined) return { state, events: [], outcome: unbornError(state) }
    return {
      state,
      events: [],
      outcome: gitError(
        `fatal: not a valid object name: '${startPoint}'`,
        `There is no branch or commit called \`${startPoint}\`. A new branch has to point at something that exists.`,
      ),
    }
  }

  return {
    state: { ...state, branches: { ...state.branches, [name]: at } },
    events: [{ type: 'BRANCH_CREATED', name, at }],
    // Real `git branch <name>` prints nothing — silence is the success message.
    outcome: ok([]),
  }
}
