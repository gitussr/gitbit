import type { GitEvent } from '../events'
import type { ParsedCommand } from '../parse'
import { headTree, resolve } from '../repo'
import { gitError, ok, type CommandResult } from '../result'
import type { FilePath, RepoState, Tree } from '../types'

/** The side of a stopped merge (or revert) that `--theirs` means. */
function theirSide(state: RepoState): Tree {
  const merging = state.merging as NonNullable<RepoState['merging']>
  const commit = state.commits[merging.theirs]
  if (merging.kind === 'merge') return commit.tree
  // Reverting applies the commit's inverse, so "theirs" is the commit's parent.
  const parent = commit.parents[0]
  return parent ? state.commits[parent].tree : {}
}

/**
 * Whether overwriting this path on disk destroys work that exists nowhere
 * else — not staged, not committed. Git keeps no copy of it, so this is
 * the one thing the caution treatment is for.
 */
export function isUnsavedWork(state: RepoState, path: FilePath, replacement: string | undefined): boolean {
  const onDisk = state.workingTree[path]
  return (
    onDisk !== undefined && onDisk !== replacement && onDisk !== state.index[path] && onDisk !== headTree(state)[path]
  )
}

/**
 * `git restore` — putting a file back.
 *
 * Two different undos behind one command, and the flag decides which:
 *
 * - `git restore <file>` puts the file **on disk** back to what's staged
 *   (or committed, if nothing is). Edits you hadn't staged are gone, and
 *   Git keeps no copy of them.
 * - `git restore --staged <file>` puts the **Staging Area's** copy back to
 *   HEAD's — unstaging it. The file on disk is untouched, so nothing is
 *   lost. This is the safe one.
 *
 * During a conflict, `--ours` / `--theirs` put one side's version on disk.
 * That picks a version; it doesn't resolve anything — `git add` still does.
 */
export function restore(state: RepoState, parsed: ParsedCommand): CommandResult {
  const staged = parsed.flags.staged === true || parsed.flags.S === true
  // The disk is the default target; with --staged it's only touched if also asked for.
  const worktree = !staged || parsed.flags.worktree === true || parsed.flags.W === true
  const side = parsed.flags.ours === true ? 'ours' : parsed.flags.theirs === true ? 'theirs' : null

  if (parsed.args.length === 0) {
    return {
      state,
      events: [],
      outcome: gitError('fatal: you must specify path(s) to restore', 'Name the file to put back: `git restore index.html`, or `.` for everything.'),
    }
  }

  let source: Tree
  if (typeof parsed.flags.source === 'string') {
    const commit = resolve(state, parsed.flags.source)
    if (commit === null) {
      return {
        state,
        events: [],
        outcome: gitError(`fatal: could not resolve ${parsed.flags.source}`, `There is no branch or commit called \`${parsed.flags.source}\`.`),
      }
    }
    source = state.commits[commit].tree
  } else if (side) {
    if (!state.merging) {
      return {
        state,
        events: [],
        outcome: gitError(`error: --${side} only makes sense during a merge`, `\`--${side}\` picks one side of a conflict, and there isn't one right now.`),
      }
    }
    source = side === 'ours' ? headTree(state) : theirSide(state)
  } else {
    // Unstaging restores from HEAD; restoring the disk restores from the index.
    source = staged ? headTree(state) : state.index
  }

  const everything = parsed.args.includes('.')
  const known = new Set([...Object.keys(state.index), ...Object.keys(source)])
  const paths = everything ? [...known].sort() : parsed.args

  for (const path of paths) {
    if (!known.has(path) && !(path in state.workingTree)) {
      return {
        state,
        events: [],
        outcome: gitError(
          `error: pathspec '${path}' did not match any file(s) known to git`,
          'There is no file by that name that Git knows about. `git status` lists the ones it does.',
        ),
      }
    }
    if (!known.has(path)) {
      return {
        state,
        events: [],
        outcome: gitError(
          `error: pathspec '${path}' did not match any file(s) known to git`,
          `\`${path}\` is untracked: Git has never had a copy of it, so there is nothing to restore it *to*.`,
        ),
      }
    }
    if (state.merging?.conflicts.includes(path) && worktree && !side) {
      return {
        state,
        events: [],
        outcome: gitError(
          `error: path '${path}' is unmerged`,
          `\`${path}\` is mid-conflict. Pick a side with \`git restore --ours ${path}\` or \`--theirs\`, or edit it yourself — then \`git add\` it.`,
        ),
      }
    }
  }

  const index = { ...state.index }
  const workingTree = { ...state.workingTree }
  const events: GitEvent[] = []

  for (const path of paths) {
    const next = source[path]

    if (staged && index[path] !== next) {
      if (next === undefined) delete index[path]
      else index[path] = next
      events.push({ type: 'FILE_UNSTAGED', path })
    }

    if (worktree && workingTree[path] !== next) {
      events.push({ type: 'FILE_RESTORED', path, discarded: isUnsavedWork(state, path, next) })
      if (next === undefined) delete workingTree[path]
      else workingTree[path] = next
    }
  }

  if (events.length === 0) {
    return {
      state,
      events: [{ type: 'NOTHING_HAPPENED', reason: 'Those files already match what they would be restored to.' }],
      outcome: ok([]),
    }
  }

  return { state: { ...state, index, workingTree }, events, outcome: ok([]) }
}
