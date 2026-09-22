/**
 * What would make sense to run next.
 *
 * Drives the console's suggestion chips (Section 9) and gives the
 * scenario rail something to fall back on when someone wanders off the
 * script. Derived from state, never from a fixed lesson order — the
 * suggestion after `git add` is `git commit` because something is staged,
 * not because a tutorial says step four comes after step three.
 */

import { isClean, stagedChanges, unstagedChanges, untrackedFiles, headCommitId } from './repo'
import type { RepoState } from './types'

export function suggest(state: RepoState): string[] {
  if (!state.initialized) return ['git init']

  if (stagedChanges(state).length > 0) {
    return ['git commit -m "Add homepage"', 'git diff --staged', 'git status']
  }

  if (unstagedChanges(state).length > 0 || untrackedFiles(state).length > 0) {
    return ['git status', 'git add .', 'git diff']
  }

  if (isClean(state) && headCommitId(state) === null) return ['git status']

  return ['git log --oneline', 'git status']
}
