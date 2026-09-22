import type { ParsedCommand } from '../parse'
import { ok, type CommandResult } from '../result'
import type { RepoState } from '../types'

/**
 * `git init` — the moment a folder becomes a repository.
 *
 * Note what it does *not* do: it doesn't record any of the files already
 * sitting there. A fresh repository's first `git status` shows everything
 * as untracked, which is the point Scenario 1 opens on.
 */
export function init(state: RepoState, _parsed: ParsedCommand): CommandResult {
  if (state.initialized) {
    return {
      state,
      events: [{ type: 'NOTHING_HAPPENED', reason: 'This folder is already a repository.' }],
      outcome: ok(['Reinitialized existing Git repository in /project/.git/']),
    }
  }

  return {
    state: { ...state, initialized: true },
    events: [{ type: 'REPO_INITIALIZED', branch: state.defaultBranch }],
    outcome: ok([
      'Initialized empty Git repository in /project/.git/',
      '',
      `On branch ${state.defaultBranch} — which doesn't exist yet. A branch is a pointer, and there is no commit to point at.`,
    ]),
  }
}
