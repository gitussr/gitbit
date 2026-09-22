/**
 * What comes back from running something.
 *
 * Every outcome carries `why` alongside Git's own wording. Git's messages
 * are accurate and famously unhelpful to a beginner; `why` is the line
 * that explains them *against the state the repository is actually in*,
 * which is the part a static cheat sheet can't give you.
 */

import type { GitEvent } from './events'
import type { RepoState } from './types'

export interface GitOk {
  kind: 'ok'
  /** The lines Git itself would print. Empty for commands that say nothing. */
  output: string[]
}

export interface GitError {
  kind: 'git-error'
  /** Git's own wording, verbatim where it exists. */
  message: string
  why: string
}

export interface ParseError {
  kind: 'parse-error'
  message: string
  why: string
}

export type Outcome = GitOk | GitError | ParseError

export interface CommandResult {
  state: RepoState
  events: GitEvent[]
  outcome: Outcome
}

/**
 * One run of one command: what the repository looked like before, what it
 * looks like now, what moved, and what Git said.
 *
 * `before` is kept rather than recomputed, which is what makes Section
 * 27's undo a pop off a list instead of an inverse-operation engine.
 */
export interface Transition {
  input: string
  before: RepoState
  after: RepoState
  events: GitEvent[]
  outcome: Outcome
}

export function ok(output: string[] = []): GitOk {
  return { kind: 'ok', output }
}

export function gitError(message: string, why: string): GitError {
  return { kind: 'git-error', message, why }
}

export function parseError(message: string, why: string): ParseError {
  return { kind: 'parse-error', message, why }
}

export function isFailure(outcome: Outcome): boolean {
  return outcome.kind !== 'ok'
}
