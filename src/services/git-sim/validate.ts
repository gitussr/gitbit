/**
 * Can this command run against this repository?
 *
 * The line between here and `commands/` is: validation answers whether a
 * command can start, using checks that don't require performing it (is
 * this a repository, are the required arguments present, does that path
 * exist). Anything that needs the command's own work to find out — "there
 * is nothing staged to commit" — is the command's own result, not a
 * precondition.
 *
 * A failure here is a teaching moment, not a dead end: Section 38's point
 * is that Git's refusals are informative once someone can see the state
 * they refer to.
 */

import type { ParsedCommand } from './parse'
import { gitError, type GitError } from './result'
import type { RepoState } from './types'

export function validate(parsed: ParsedCommand, state: RepoState): GitError | null {
  if (!state.initialized && parsed.name !== 'init') {
    return gitError(
      'fatal: not a git repository (or any of the parent directories): .git',
      'These files are sitting in an ordinary folder. Git only tracks a folder once `git init` has made it a repository.',
    )
  }

  if (parsed.name === 'add') {
    const wantsEverything = parsed.flags.A === true || parsed.flags.all === true
    if (parsed.args.length === 0 && !wantsEverything) {
      return gitError(
        "Nothing specified, nothing added.\nhint: Maybe you wanted to say 'git add .'?",
        '`git add` needs to know *what* to stage. Naming the file is the whole point of the command — it is how you choose what goes into the next commit.',
      )
    }

    for (const path of parsed.args) {
      if (path === '.') continue
      if (!(path in state.workingTree) && !(path in state.index)) {
        return gitError(
          `fatal: pathspec '${path}' did not match any files`,
          'There is no file by that name on disk. Check the spelling against the Working Directory.',
        )
      }
    }
  }

  if (parsed.name === 'commit') {
    const message = parsed.flags.m
    if (message === undefined) {
      return gitError(
        'Aborting commit due to empty commit message.',
        'Real Git opens an editor here. The simulator has no editor, so give the message inline: `git commit -m "what you changed"`.',
      )
    }
    if (message === true || String(message).trim() === '') {
      return gitError(
        'Aborting commit due to empty commit message.',
        'A commit with no message is a checkpoint nobody can read later, including you. Git refuses it.',
      )
    }
  }

  return null
}
