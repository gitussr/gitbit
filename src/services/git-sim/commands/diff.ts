import { formatDiff, treeDiffDetailed } from '../diff'
import type { ParsedCommand } from '../parse'
import { headTree } from '../repo'
import { ok, type CommandResult } from '../result'
import type { RepoState } from '../types'

/**
 * `git diff` — and the question people don't realise it's answering
 * (Section 21).
 *
 * Bare, it compares the **index against the working directory**: "what
 * have I changed that isn't staged?" With `--staged` it compares **HEAD
 * against the index**: "what would I commit right now?" Neither one is
 * "what changed in my project", which is why a beginner who has just run
 * `git add` sees an empty diff and assumes their work vanished.
 *
 * Untracked files never appear. Git has no earlier version to compare
 * them against, so there is nothing to diff.
 */
export function diff(state: RepoState, parsed: ParsedCommand): CommandResult {
  const staged = parsed.flags.staged === true || parsed.flags.cached === true

  const diffs = staged
    ? treeDiffDetailed(headTree(state), state.index)
    : treeDiffDetailed(state.index, state.workingTree).filter((entry) => entry.status !== 'added')

  const reason = staged
    ? 'Comparing the last commit with the Staging Area — what `git commit` would record.'
    : 'Comparing the Staging Area with the Working Directory — what you have changed but not staged.'

  return {
    state,
    events: [{ type: 'NOTHING_HAPPENED', reason }],
    outcome: ok(formatDiff(diffs)),
  }
}
