import type { ParsedCommand } from '../parse'
import { ancestry, currentBranch, headCommitId, refsAt } from '../repo'
import { gitError, ok, type CommandResult } from '../result'
import type { CommitId, RepoState } from '../types'

/** `(HEAD -> main, origin/main)` — HEAD first, the way Git prints it. */
function decorate(state: RepoState, id: CommitId): string {
  const refs = refsAt(state, id)
  if (refs.length === 0) return ''

  const branch = currentBranch(state)
  const head = branch && state.branches[branch] === id ? `HEAD -> ${branch}` : null
  const rest = refs.filter((ref) => ref !== branch)
  const all = head ? [head, ...rest] : refs

  return ` (${all.join(', ')})`
}

/**
 * `git log` — walking backwards from HEAD through the parents.
 *
 * That it walks *from HEAD* is the lesson: commits on branches you aren't
 * on don't appear, and that isn't them being missing (Section 14).
 *
 * No `Author` or `Date` line. The simulator has no clock and no identity,
 * and inventing a plausible-looking timestamp would be putting fake data
 * on screen in a tool whose whole promise is that what you see is the real
 * state.
 */
export function log(state: RepoState, parsed: ParsedCommand): CommandResult {
  const head = headCommitId(state)

  if (head === null) {
    const branch = currentBranch(state) ?? state.defaultBranch
    return {
      state,
      events: [],
      outcome: gitError(
        `fatal: your current branch '${branch}' does not have any commits yet`,
        'History is made of commits, and this repository has none. The branch itself does not exist yet either — it appears with the first commit.',
      ),
    }
  }

  const commits = ancestry(state, head)
  const oneline = parsed.flags.oneline === true
  const out: string[] = []

  for (const entry of commits) {
    if (oneline) {
      out.push(`${entry.id}${decorate(state, entry.id)} ${entry.message}`)
      continue
    }

    const merge = entry.parents.length > 1 ? [`Merge: ${entry.parents.join(' ')}`] : []
    out.push(`commit ${entry.id}${decorate(state, entry.id)}`, ...merge, '', `    ${entry.message}`, '')
  }

  return {
    state,
    events: [{ type: 'NOTHING_HAPPENED', reason: '`git log` only reads history. It never changes it.' }],
    outcome: ok(out),
  }
}
