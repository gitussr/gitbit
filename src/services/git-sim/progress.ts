/**
 * Guided scenarios, judged by what happened (Section 28).
 *
 * A step is met by an *outcome* — "a commit was created", "something was
 * staged" — not by typing an exact string. `git add .` and
 * `git add index.html` both stage the file; either should count. Where the
 * command itself is the point (`git status` changes nothing, so there is
 * no event to see), the step names the command instead.
 */

import type { GitEventType } from './events'
import { parse } from './parse'
import type { Transition } from './result'

export interface Expectation {
  /** The subcommand that was run, e.g. `status`. */
  command?: string
  /** An event the transition must contain, e.g. `COMMIT_CREATED`. */
  event?: GitEventType
  /** For events with a direction (`REMOTE_UPDATED`): which way. */
  direction?: 'push' | 'fetch' | 'elsewhere'
  /** A commit created by `git revert`, rather than an ordinary one. */
  reverting?: boolean
}

/** Whether one transition does what a step asks. A refused command never does. */
export function meets(transition: Transition, expect: Expectation): boolean {
  if (transition.outcome.kind !== 'ok') return false

  if (expect.command !== undefined) {
    const parsed = parse(transition.input)
    if ('kind' in parsed || parsed.name !== expect.command) return false
  }

  if (expect.event !== undefined) {
    const found = transition.events.some(
      (event) =>
        event.type === expect.event &&
        (expect.direction === undefined || ('direction' in event && event.direction === expect.direction)) &&
        (expect.reverting === undefined || ('reverts' in event && Boolean(event.reverts) === expect.reverting)),
    )
    if (!found) return false
  }

  return true
}

/**
 * How many steps are done, read off the whole history rather than kept
 * as a counter — so undoing a step un-does its progress too, and nothing
 * can drift out of step with what actually happened. Steps are met in
 * order: a later step's outcome happening early doesn't count yet.
 */
export function progress(history: Transition[], steps: Expectation[]): number {
  let done = 0
  for (const transition of history) {
    if (done < steps.length && meets(transition, steps[done])) done += 1
  }
  return done
}
