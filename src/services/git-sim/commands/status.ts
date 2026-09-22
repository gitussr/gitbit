import type { ParsedCommand } from '../parse'
import { currentBranch, headCommitId, stagedChanges, unstagedChanges, untrackedFiles } from '../repo'
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
  const staged = stagedChanges(state)
  const unstaged = unstagedChanges(state)
  const untracked = untrackedFiles(state)
  const branch = currentBranch(state)

  const out: string[] = [branch ? `On branch ${branch}` : `HEAD detached at ${headCommitId(state)}`]

  if (headCommitId(state) === null) out.push('', 'No commits yet')

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

  if (untracked.length > 0) {
    out.push('', 'Untracked files:', '  (use "git add <file>..." to include in what will be committed)')
    for (const path of untracked) out.push(`\t${path}`)
  }

  if (staged.length === 0) {
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
