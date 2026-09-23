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
import { stagedChanges, unstagedChanges, untrackedFiles } from './repo'
import type { RepoState } from './types'

/** The flags each simulated command actually reads. Offering one it ignores would teach a flag that does nothing. */
const FLAGS: Record<string, string[]> = {
  add: ['-A', '--all'],
  commit: ['-m'],
  diff: ['--staged', '--cached'],
  log: ['--oneline'],
}

/**
 * Paths worth offering for a command: the ones it would do something to.
 * `git add` completes to files with changes to stage, not every file on
 * disk — the same thing a real shell's git completion does.
 */
function pathsFor(state: RepoState, name: string): string[] {
  if (name === 'add') {
    return [...unstagedChanges(state).map((change) => change.path), ...untrackedFiles(state)]
  }
  if (name === 'diff') {
    return [...unstagedChanges(state), ...stagedChanges(state)].map((change) => change.path)
  }
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

  // Don't offer a path that's already been typed earlier in the command.
  const typed = new Set(before.slice(2))
  return matching(pathsFor(state, name).filter((path) => !typed.has(path)))
}

