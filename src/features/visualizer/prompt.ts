import { currentBranch, headCommitId, type RepoState } from '@/services/git-sim'

/** The simulated project's folder, as a shell prompt shows it. */
const FOLDER = 'project'

/**
 * The shell prompt for a repository in this state, git-aware the way
 * `__git_ps1` makes a real one: `project (main) $`, the commit when HEAD is
 * detached, and `|MERGING` or `|REVERTING` while one is stopped on a
 * conflict. No parentheses until `git init` — outside a repository, a
 * git-aware prompt has nothing to say.
 *
 * It is a quiet lesson of its own: switch branch and the prompt changes,
 * start a merge and it says so, which is how people actually keep track.
 */
export function promptFor(repo: RepoState): string {
  if (!repo.initialized) return `${FOLDER} $`
  const branch = currentBranch(repo)
  const where = branch ?? `HEAD detached at ${(headCommitId(repo) ?? '').slice(0, 7)}`
  const state = repo.merging ? (repo.merging.kind === 'revert' ? '|REVERTING' : '|MERGING') : ''
  return `${FOLDER} (${where}${state}) $`
}
