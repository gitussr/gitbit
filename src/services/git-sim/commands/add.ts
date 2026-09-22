import type { GitEvent } from '../events'
import type { ParsedCommand } from '../parse'
import { ok, type CommandResult } from '../result'
import type { FilePath, RepoState, Tree } from '../types'

/** `.` and `-A` mean "every path Git can see" — on disk now, or tracked and since deleted. */
function expand(state: RepoState, parsed: ParsedCommand): FilePath[] {
  const everything = parsed.flags.A === true || parsed.flags.all === true || parsed.args.includes('.')
  if (everything) {
    return [...new Set([...Object.keys(state.workingTree), ...Object.keys(state.index)])].sort()
  }
  return parsed.args
}

/**
 * `git add` — choosing what goes into the next commit.
 *
 * It copies the file *as it looks right now* into the index. Edit the file
 * afterwards and the index still holds the older contents, which is why
 * the same file can sit in both the Staging Area and the Working
 * Directory. That is the misconception this command exists to correct: it
 * saves nothing permanently and creates no commit (Section 38).
 */
export function add(state: RepoState, parsed: ParsedCommand): CommandResult {
  const index: Tree = { ...state.index }
  const events: GitEvent[] = []

  for (const path of expand(state, parsed)) {
    const onDisk = state.workingTree[path]

    if (onDisk === undefined) {
      // Staging a file that's gone from disk stages the deletion.
      if (path in index) {
        delete index[path]
        events.push({ type: 'FILE_STAGED', path })
      }
      continue
    }

    if (index[path] === onDisk) continue
    index[path] = onDisk
    events.push({ type: 'FILE_STAGED', path })
  }

  if (events.length === 0) {
    return {
      state,
      events: [{ type: 'NOTHING_HAPPENED', reason: 'Those files are already staged exactly as they are on disk.' }],
      outcome: ok(),
    }
  }

  // Git says nothing when `add` works. The Visualizer's job is to make what happened visible instead.
  return { state: { ...state, index }, events, outcome: ok() }
}
