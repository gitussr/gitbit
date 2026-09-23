/**
 * What would make sense to run next.
 *
 * Drives the console's suggestion chips (Section 9) and gives the
 * scenario rail something to fall back on when someone wanders off the
 * script. Derived from state, never from a fixed lesson order — the
 * suggestion after `git add` is `git commit` because something is staged,
 * not because a tutorial says step four comes after step three.
 */

import { contains, currentBranch, isClean, stagedChanges, unstagedChanges, untrackedFiles, headCommitId } from './repo'
import type { RepoState } from './types'

export function suggest(state: RepoState): string[] {
  if (!state.initialized) return ['git init']

  // Mid-merge (or mid-revert), the only sensible moves are finishing it or backing out.
  if (state.merging) {
    const { kind, conflicts } = state.merging
    const [unresolved] = conflicts
    if (unresolved) return [`git add ${unresolved}`, `git restore --theirs ${unresolved}`, `git ${kind} --abort`]
    return [kind === 'merge' ? 'git commit' : 'git revert --continue', 'git status', `git ${kind} --abort`]
  }

  // Every forward step comes with the way to take it back.
  const [staged] = stagedChanges(state)
  if (staged) {
    return ['git commit -m "Add homepage"', 'git diff --staged', `git restore --staged ${staged.path}`]
  }

  const [modified] = unstagedChanges(state)
  if (modified || untrackedFiles(state).length > 0) {
    return modified ? ['git add .', 'git diff', `git restore ${modified.path}`] : ['git status', 'git add .', 'git diff']
  }

  if (isClean(state) && headCommitId(state) === null) return ['git status']

  const branch = currentBranch(state)
  const others = Object.keys(state.branches)
    .filter((name) => name !== branch)
    .sort()

  // Standing on a bare commit: the two ways out are "go back" and "keep this".
  if (branch === null) return [`git switch ${others[0] ?? state.defaultBranch}`, 'git switch -c experiment', 'git log --oneline']

  // Clean, with history: the natural next thing is a line of work of its own.
  if (others.length === 0) return ['git switch -c feature', 'git branch', 'git log --oneline']

  // A branch with work this one doesn't have yet is waiting to be merged in.
  const head = headCommitId(state)
  const behind = others.find((name) => head !== null && !contains(state, head, state.branches[name]))
  if (behind) return [`git merge ${behind}`, `git switch ${others[0]}`, 'git log --oneline']
  return [`git switch ${others[0]}`, 'git branch', 'git log --oneline']
}
