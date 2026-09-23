/**
 * Tab completion for the console (Section 9: "command autocomplete where
 * useful").
 *
 * Completion needs the same knowledge the engine already has — which
 * commands are simulated, which flags they read, which files exist — so it
 * lives here rather than in the console, which stays a generic input that
 * knows nothing about Git.
 *
 * Returns whole replacement inputs, not suffixes: the console swaps the
 * text rather than doing string arithmetic on it.
 */

import { IMPLEMENTED } from './parse'
import { currentBranch, stagedChanges, unstagedChanges, untrackedFiles } from './repo'
import type { RepoState } from './types'

/** The flags each simulated command actually reads. Offering one it ignores would teach a flag that does nothing. */
const FLAGS: Record<string, string[]> = {
  add: ['-A', '--all'],
  commit: ['-m', '-a'],
  diff: ['--staged', '--cached'],
  log: ['--oneline'],
  branch: ['-d', '-D'],
  switch: ['-c', '--detach'],
  checkout: ['-b'],
  merge: ['--no-ff', '--ff-only', '--abort'],
  restore: ['--staged', '--worktree', '--ours', '--theirs'],
  reset: ['--soft', '--mixed', '--hard'],
  revert: ['--abort', '--continue'],
  push: ['-u', '--set-upstream'],
}

/**
 * Arguments worth offering: the things the command would act on. `git add`
 * completes to files with changes to stage, not every file on disk, and
 * `git switch` to branches you aren't already on — the same things a real
 * shell's git completion offers.
 */
function argsFor(state: RepoState, name: string, flags: string[]): string[] {
  if (name === 'add') {
    return [...unstagedChanges(state).map((change) => change.path), ...untrackedFiles(state)]
  }
  if (name === 'diff') {
    return [...unstagedChanges(state), ...stagedChanges(state)].map((change) => change.path)
  }

  const others = Object.keys(state.branches).filter((branch) => branch !== currentBranch(state))
  // A new branch's name is yours to invent; there's nothing to complete.
  if (name === 'merge') return flags.includes('--abort') ? [] : others
  // What restore can put back: files Git has a copy of that differ from it.
  if (name === 'restore') {
    const changed = flags.includes('--staged') ? stagedChanges(state) : unstagedChanges(state)
    return [...changed.map((change) => change.path), ...(state.merging?.conflicts ?? [])]
  }
  // `git push origin main`: the remote's name, then a branch.
  if (name === 'push' || name === 'pull' || name === 'fetch') {
    return state.remote ? [state.remote.name, ...Object.keys(state.branches)] : []
  }
  // Where to move HEAD: back along history, or to another branch.
  if (name === 'reset' || name === 'revert') return ['HEAD', 'HEAD~1', 'HEAD~2', ...others]
  if (name === 'switch' || name === 'checkout') return flags.some((flag) => ['-c', '-b'].includes(flag)) ? [] : others
  if (name === 'branch') return flags.some((flag) => ['-d', '-D'].includes(flag)) ? others : []
  return []
}

export function complete(state: RepoState, input: string): string[] {
  // Completion only ever extends the last word, so anything after trailing
  // whitespace is a fresh, empty word.
  const words = input.trimStart().split(/\s+/)
  const current = words[words.length - 1]
  const before = words.slice(0, -1)
  const head = before.length > 0 ? `${before.join(' ')} ` : ''

  const matching = (candidates: string[], suffix = ' ') =>
    [...new Set(candidates)]
      .filter((candidate) => candidate.startsWith(current) && candidate !== current)
      .sort()
      .map((candidate) => `${head}${candidate}${suffix}`)

  if (before.length === 0) return matching(['git'])
  if (before[0] !== 'git') return []
  if (before.length === 1) return matching([...IMPLEMENTED])

  const name = before[1]
  if (!IMPLEMENTED.has(name)) return []

  // `-m ` is followed by a message, so it completes to an open quote.
  if (current.startsWith('-')) {
    return (FLAGS[name] ?? [])
      .filter((flag) => flag.startsWith(current) && flag !== current)
      .map((flag) => `${head}${flag}${flag === '-m' ? ' "' : ' '}`)
  }

  // Don't offer anything that's already been typed earlier in the command.
  const typed = new Set(before.slice(2))
  const flags = before.slice(2).filter((word) => word.startsWith('-'))
  // `-c`/`-b` are waiting for a name you invent.
  if (['-c', '-b'].includes(before[before.length - 1])) return []
  return matching(argsFor(state, name, flags).filter((arg) => !typed.has(arg)))
}

