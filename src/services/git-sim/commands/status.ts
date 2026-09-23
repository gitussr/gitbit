import type { ParsedCommand } from '../parse'
import { currentBranch, headCommitId, headTree, stagedChanges, unstagedChanges, untrackedFiles } from '../repo'
import { ok, type CommandResult } from '../result'
import type { ChangeKind, RepoState } from '../types'

/** Git pads the label to twelve columns: `new file:   `, `modified:   `, `deleted:    `. */
function label(kind: ChangeKind, staged: boolean): string {
  const word = kind === 'added' ? (staged ? 'new file' : 'modified') : kind
  return `${word}:`.padEnd(12)
}

/**
 * `git status` — the command that answers "where is my work right now?".
 *
 * The three sections are the three panels the Visualizer draws, which is
 * not a coincidence: both read the same derived views in `repo.ts`. A file
 * that was staged and then edited again appears in two sections, because
 * in Git it genuinely is in two places at once.
 */
export function status(state: RepoState, _parsed: ParsedCommand): CommandResult {
  // A conflicted path is reported once, as unmerged — not also as a staged
  // or unstaged change, which is what its index and disk copies would say.
  const unmerged = new Set(state.merging?.conflicts ?? [])
  const staged = stagedChanges(state).filter((change) => !unmerged.has(change.path))
  const unstaged = unstagedChanges(state).filter((change) => !unmerged.has(change.path))
  const untracked = untrackedFiles(state).filter((path) => !unmerged.has(path))
  const branch = currentBranch(state)

  const out: string[] = [branch ? `On branch ${branch}` : `HEAD detached at ${headCommitId(state)}`]

  if (headCommitId(state) === null) out.push('', 'No commits yet')

  if (state.merging?.kind === 'merge') {
    out.push(
      ...(unmerged.size > 0
        ? ['You have unmerged paths.', '  (fix conflicts and run "git commit")', '  (use "git merge --abort" to abort the merge)']
        : ['All conflicts fixed but you are still merging.', '  (use "git commit" to conclude merge)']),
    )
  }
  if (state.merging?.kind === 'revert') {
    out.push(
      `You are currently reverting commit ${state.merging.theirs}.`,
      ...(unmerged.size > 0
        ? ['  (fix conflicts and run "git revert --continue")', '  (use "git revert --abort" to cancel the revert operation)']
        : ['  (all conflicts fixed: run "git revert --continue")']),
    )
  }

  if (staged.length > 0) {
    out.push('', 'Changes to be committed:', '  (use "git restore --staged <file>..." to unstage)')
    for (const change of staged) out.push(`\t${label(change.kind, true)}${change.path}`)
  }

  if (unstaged.length > 0) {
    out.push(
      '',
      'Changes not staged for commit:',
      '  (use "git add <file>..." to update what will be committed)',
      '  (use "git restore <file>..." to discard changes in working directory)',
    )
    for (const change of unstaged) out.push(`\t${label(change.kind, false)}${change.path}`)
  }

  if (state.merging && unmerged.size > 0) {
    const ours = headTree(state)
    // A revert's "their" side is the reverted commit's parent.
    const reverted = state.commits[state.merging.theirs]
    const theirs =
      state.merging.kind === 'merge'
        ? reverted.tree
        : reverted.parents[0]
          ? state.commits[reverted.parents[0]].tree
          : {}
    out.push('', 'Unmerged paths:', '  (use "git add <file>..." to mark resolution)')
    for (const path of unmerged) {
      const how = !(path in theirs) ? 'deleted by them:' : !(path in ours) ? 'deleted by us:' : 'both modified:'
      out.push(`\t${how.padEnd(17)}${path}`)
    }
  }

  if (untracked.length > 0) {
    out.push('', 'Untracked files:', '  (use "git add <file>..." to include in what will be committed)')
    for (const path of untracked) out.push(`\t${path}`)
  }

  if (staged.length === 0 && !state.merging) {
    out.push('')
    if (unstaged.length > 0) out.push('no changes added to commit (use "git add" and/or "git commit -a")')
    else if (untracked.length > 0) out.push('nothing added to commit but untracked files present (use "git add" to track)')
    else if (headCommitId(state) === null) out.push('nothing to commit (create/copy files and use "git add" to track)')
    else out.push('nothing to commit, working tree clean')
  }

  return {
    state,
    events: [{ type: 'NOTHING_HAPPENED', reason: '`git status` only looks. It never changes anything.' }],
    outcome: ok(out),
  }
}
