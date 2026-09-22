/**
 * The engine's front door.
 *
 * Everything the Visualizer does to a repository goes through this one
 * function, which is what keeps Git logic out of the UI (Section 36). The
 * UI hands over a string and receives a `Transition`; it never decides
 * what a command means.
 *
 * A failed command still returns a `Transition` and still belongs in the
 * history. Git refusing to do something is one of the better lessons
 * available, and throwing it away would waste it.
 */

import { handlers } from './commands'
import { parse } from './parse'
import type { Transition } from './result'
import type { RepoState } from './types'
import { validate } from './validate'

export function executeCommand(state: RepoState, input: string): Transition {
  // `events: []` appears only alongside a failing outcome. A *successful*
  // command that changed nothing says so with NOTHING_HAPPENED, so the two
  // cases can never be confused for one another.
  const unchanged = { input, before: state, after: state, events: [] }

  const parsed = parse(input)
  if ('kind' in parsed) return { ...unchanged, outcome: parsed }

  const invalid = validate(parsed, state)
  if (invalid) return { ...unchanged, outcome: invalid }

  const handler = handlers[parsed.name]
  const result = handler(state, parsed)

  return { input, before: state, after: result.state, events: result.events, outcome: result.outcome }
}
