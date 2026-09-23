import type { GitEvent, ResetLayer } from '../events'
import type { ParsedCommand } from '../parse'
import { currentBranch, headCommitId, headTree, resolve, treeDiff } from '../repo'
import { gitError, ok, type CommandResult } from '../result'
import type { CommitId, FilePath, RepoState, Tree } from '../types'

type Mode = 'soft' | 'mixed' | 'hard'

const LAYERS: Record<Mode, ResetLayer[]> = {
  soft: ['head'],
  mixed: ['head', 'index'],
  hard: ['head', 'index', 'worktree'],
}

/** `M\tindex.html` — the list `--mixed` prints of what's now unstaged. */
function unstagedList(index: Tree, workingTree: Tree): string[] {
  const changes = treeDiff(index, workingTree).filter((change) => change.kind !== 'added')
  if (changes.length === 0) return []
  return ['Unstaged changes after reset:', ...changes.map((change) => `${change.kind === 'deleted' ? 'D' : 'M'}\t${change.path}`)]
}

/** `git reset <path>`: unstage, leaving HEAD and the disk alone. The old spelling of `git restore --staged`. */
function resetPaths(state: RepoState, paths: FilePath[], mode: Mode | null): CommandResult {
  if (mode === 'soft' || mode === 'hard') {
    return {
      state,
      events: [],
      outcome: gitError(
        `fatal: Cannot do ${mode} reset with paths.`,
        `\`--${mode}\` is about moving HEAD, which is all-or-nothing. With a file name, \`git reset\` only unstages — so it only takes the default mode.`,
      ),
    }
  }

  const head = headTree(state)
  const index = { ...state.index }
  const events: GitEvent[] = []
  for (const path of paths) {
    if (index[path] === head[path]) continue
    if (path in head) index[path] = head[path]
    else delete index[path]
    events.push({ type: 'FILE_UNSTAGED', path })
  }

  if (events.length === 0) {
    return { state, events: [{ type: 'NOTHING_HAPPENED', reason: 'Nothing named there was staged.' }], outcome: ok([]) }
  }
  return { state: { ...state, index }, events, outcome: ok(unstagedList(index, state.workingTree)) }
}

/**
 * `git reset` — moving the branch you're on to another commit, and
 * deciding how much of the rest comes with it (Section 18).
 *
 * The three modes are three layers, and each one goes one layer further:
 *
 * - `--soft` moves the branch. The index and the disk stay as they were,
 *   so the work of the undone commits shows up as staged.
 * - `--mixed` (the default) moves the branch and resets the index to match.
 *   That work is now unstaged — still on disk, untouched.
 * - `--hard` moves the branch and makes the index *and the disk* match.
 *   Uncommitted changes to tracked files are destroyed, and Git keeps no
 *   copy of them. Untracked files are left alone.
 *
 * The commits you moved away from aren't deleted. Nothing points at them
 * any more, so the graph stops drawing them — the Time Machine can still
 * find them.
 */
export function reset(state: RepoState, parsed: ParsedCommand): CommandResult {
  const chosen = (['soft', 'mixed', 'hard'] as const).filter((mode) => parsed.flags[mode] === true)
  if (chosen.length > 1) {
    return {
      state,
      events: [],
      outcome: gitError('fatal: options --soft, --mixed and --hard cannot be used together', 'Pick one mode — each goes a layer further than the last.'),
    }
  }
  const explicit: Mode | null = chosen[0] ?? null
  const mode: Mode = explicit ?? 'mixed'

  // `git reset HEAD index.html`, `git reset -- index.html`, `git reset index.html`.
  const args = parsed.args
  const first = args[0]
  const firstIsCommit = first !== undefined && resolve(state, first) !== null
  const paths = firstIsCommit ? args.slice(1) : args
  if (paths.length > 0 || '' in parsed.flags) {
    const known = new Set([...Object.keys(state.index), ...Object.keys(headTree(state)), ...Object.keys(state.workingTree)])
    const unknown = paths.find((path) => !known.has(path))
    if (unknown) {
      return {
        state,
        events: [],
        outcome: gitError(
          `fatal: ambiguous argument '${unknown}': unknown revision or path not in the working tree.`,
          `\`${unknown}\` isn't a branch, a commit, or a file. For commits, \`HEAD~1\` means "one before HEAD".`,
        ),
      }
    }
    return resetPaths(state, paths, explicit)
  }

  const from = headCommitId(state)
  const to: CommitId | null = first === undefined ? from : resolve(state, first)

  // Before the first commit there is no HEAD to move — `git reset` just empties the index.
  if (to === null) {
    if (first !== undefined) {
      return {
        state,
        events: [],
        outcome: gitError(
          `fatal: ambiguous argument '${first}': unknown revision or path not in the working tree.`,
          `There's no commit or branch called \`${first}\`. \`HEAD~1\` means "the commit before HEAD".`,
        ),
      }
    }
    return resetPaths(state, Object.keys(state.index), explicit)
  }

  if (state.merging && mode === 'soft') {
    return {
      state,
      events: [],
      outcome: gitError(
        'fatal: Cannot do a soft reset in the middle of a merge.',
        'A soft reset would keep the half-finished merge staged. `--mixed`, `--hard` or `git merge --abort` back out of it.',
      ),
    }
  }

  const target = state.commits[to].tree
  const before = headTree(state)
  const branch = currentBranch(state)

  const index = mode === 'soft' ? state.index : { ...target }
  let workingTree = state.workingTree
  const rewritten: FilePath[] = []
  const discarded: FilePath[] = []

  if (mode === 'hard') {
    workingTree = { ...state.workingTree }
    // Every tracked path, before or after. Untracked files aren't Git's to touch.
    const tracked = new Set([...Object.keys(state.index), ...Object.keys(target)])
    for (const path of [...tracked].sort()) {
      const next = target[path]
      const onDisk = state.workingTree[path]
      if (onDisk === next) continue

      // Uncommitted work — on disk or staged — that the reset is about to throw away.
      if ((onDisk !== undefined && onDisk !== before[path]) || state.index[path] !== before[path]) discarded.push(path)
      rewritten.push(path)
      if (next === undefined) delete workingTree[path]
      else workingTree[path] = next
    }
  }

  const next: RepoState = {
    ...state,
    branches: branch ? { ...state.branches, [branch]: to } : state.branches,
    HEAD: branch ? state.HEAD : { type: 'detached', commit: to },
    index,
    workingTree,
    // Any reset but --soft abandons a merge in progress, as it does in Git.
    merging: null,
  }

  const events: GitEvent[] = [
    {
      type: 'RESET_PERFORMED',
      mode,
      from,
      to,
      // The mode says how far down a reset *reaches*; HEAD only counts as
      // changed if it actually moved. `git reset --hard` on its own is the
      // everyday way to throw away edits, and HEAD stays put.
      layers: LAYERS[mode].filter((layer) => layer !== 'head' || to !== from),
      paths: rewritten,
      discarded,
    },
  ]
  if (to !== from) events.push({ type: 'HEAD_MOVED', from, to })

  const output =
    mode === 'hard'
      ? [`HEAD is now at ${to} ${state.commits[to].message}`]
      : mode === 'mixed'
        ? unstagedList(index, workingTree)
        : []

  // A reset to where you already are, that changes nothing, still happened —
  // but the honest description is "nothing moved".
  const changed = to !== from || treeDiff(state.index, index).length > 0 || rewritten.length > 0 || state.merging !== null
  if (!changed) {
    return {
      state,
      events: [{ type: 'NOTHING_HAPPENED', reason: `HEAD, the Staging Area and the disk already match ${to}.` }],
      outcome: ok(output),
    }
  }

  return { state: next, events, outcome: ok(output) }
}
