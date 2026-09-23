import type { ParsedCommand } from '../parse'
import { currentBranch, resolve } from '../repo'
import { gitError, ok, parseError, type CommandResult } from '../result'
import type { RepoState } from '../types'
import { moveHead } from './moveHead'
import { alreadyOn, createAndSwitch } from './switch'

/**
 * `git checkout` — the older command that does what `switch` does, and
 * more.
 *
 * Simulated for branches and commits because it's still what most
 * tutorials and answers online use. Unlike `switch` it detaches HEAD at a
 * commit without being asked, which is exactly how people end up in
 * "detached HEAD" without knowing what it means — so here they can see it
 * happen. Its other job, discarding changes to a file, belongs with the
 * undo commands.
 */
export function checkout(state: RepoState, parsed: ParsedCommand): CommandResult {
  const create = parsed.flags.b
  if (create === true) {
    return { state, events: [], outcome: gitError("error: switch `b' requires a value", 'Name the new branch: `git checkout -b feature`.') }
  }
  if (typeof create === 'string') return createAndSwitch(state, create, '-b')

  const [target] = parsed.args

  // A branch or commit wins over a file of the same name, as in Git. A bare
  // `--` (which the parser reads as an empty flag) always means files.
  const isRef = target !== undefined && (target in state.branches || resolve(state, target) !== null)
  const isFile = target !== undefined && (target in state.workingTree || target in state.index)
  if ('' in parsed.flags || (isFile && !isRef)) {
    return {
      state,
      events: [],
      outcome: parseError(
        '`git checkout <file>` isn’t simulated yet.',
        'Discarding changes to a file arrives with undoing things. For now `git checkout` goes to branches and commits.',
      ),
    }
  }

  if (target === undefined) {
    // Bare `git checkout` is a silent no-op in real Git.
    return {
      state,
      events: [{ type: 'NOTHING_HAPPENED', reason: 'On its own, `git checkout` has nowhere to go. Name a branch: `git checkout main`.' }],
      outcome: ok([]),
    }
  }

  if (target in state.branches) {
    if (target === currentBranch(state)) return alreadyOn(state, target)
    return moveHead(state, { type: 'branch', branch: target })
  }

  const commit = resolve(state, target)
  if (commit !== null) return moveHead(state, { type: 'detached', commit })

  return {
    state,
    events: [],
    outcome: gitError(
      `error: pathspec '${target}' did not match any file(s) known to git`,
      `There's no branch, commit or file called \`${target}\`. \`checkout\` tries all three, which is why the error talks about files. To make a branch: \`git checkout -b ${target}\`.`,
    ),
  }
}
