import { changeSummary } from '../diff'
import type { GitEvent } from '../events'
import { commitId } from '../hash'
import { mergeFile } from '../merge3'
import type { ParsedCommand } from '../parse'
import { contains, currentBranch, headCommitId, headTree, mergeBase, resolve } from '../repo'
import { gitError, ok, type CommandResult } from '../result'
import type { Commit, CommitId, FilePath, RepoState, Tree } from '../types'
import { rewriteFiles } from './moveHead'

/** Point whatever HEAD names — the branch, or HEAD itself when detached — at `id`. */
function advance(state: RepoState, id: CommitId): Pick<RepoState, 'branches' | 'HEAD'> {
  const branch = currentBranch(state)
  return branch
    ? { branches: { ...state.branches, [branch]: id }, HEAD: state.HEAD }
    : { branches: state.branches, HEAD: { type: 'detached', commit: id } }
}

function abort(state: RepoState): CommandResult {
  if (!state.merging) {
    return {
      state,
      events: [],
      outcome: gitError(
        'fatal: There is no merge to abort (MERGE_HEAD missing).',
        'Nothing is being merged right now, so there is nothing to back out of.',
      ),
    }
  }

  // Put back exactly what the merge wrote; anything else on disk was yours and stays.
  const head = headTree(state)
  const index = { ...state.index }
  const workingTree = { ...state.workingTree }
  for (const path of state.merging.touched) {
    if (path in head) {
      index[path] = head[path]
      workingTree[path] = head[path]
    } else {
      delete index[path]
      delete workingTree[path]
    }
  }

  return {
    state: { ...state, index, workingTree, merging: null },
    events: [{ type: 'MERGE_ABORTED', paths: state.merging.touched }],
    outcome: ok([]),
  }
}

/**
 * `git merge` — bringing another line of work into this one (Section 16).
 *
 * Three different things can happen, and seeing which is the lesson:
 *
 * - **Already up to date.** Their work is already in your history.
 * - **Fast-forward.** Your branch has nothing they don't. Git just slides
 *   your branch label forward to their commit — no new commit at all.
 * - **A merge commit.** Both sides have work the other lacks. Git combines
 *   them line by line against the commit they share, and records the
 *   result as a commit with *two* parents.
 *
 * When both sides changed the same lines differently, Git doesn't refuse:
 * it merges everything else, writes both versions into the file between
 * conflict markers, and waits for you to decide (`MergeState`).
 */
export function merge(state: RepoState, parsed: ParsedCommand): CommandResult {
  if (parsed.flags.abort === true) return abort(state)

  if (state.merging) {
    return {
      state,
      events: [],
      outcome:
        state.merging.conflicts.length > 0
          ? gitError(
              'error: Merging is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use \'git add/rm <file>\'\nhint: as appropriate to mark resolution and make a commit.\nfatal: Exiting because of an unresolved conflict.',
              `A merge is already waiting on you. Resolve ${state.merging.conflicts.join(', ')}, then \`git add\` and \`git commit\` — or \`git merge --abort\` to back out.`,
            )
          : gitError(
              'fatal: You have not concluded your merge (MERGE_HEAD exists).\nPlease, commit your changes before you merge.',
              'Every conflict is resolved, but the merge commit hasn’t been made yet. `git commit` finishes it.',
            ),
    }
  }

  const [target] = parsed.args
  if (target === undefined) {
    return {
      state,
      events: [],
      outcome: gitError('fatal: No remote for the current branch.', 'Say what to merge in: `git merge feature` brings `feature` into the branch you’re on.'),
    }
  }

  const theirs = resolve(state, target)
  if (theirs === null) {
    return {
      state,
      events: [],
      outcome: gitError(`merge: ${target} - not something we can merge`, `There is no branch or commit called \`${target}\`. \`git branch\` lists the branches there are.`),
    }
  }

  const ours = headCommitId(state)
  const branch = currentBranch(state)
  const into = branch ?? 'HEAD'

  if (ours !== null && contains(state, ours, theirs)) {
    return {
      state,
      events: [{ type: 'NOTHING_HAPPENED', reason: `Everything on ${target} is already part of ${into}'s history.` }],
      outcome: ok(['Already up to date.']),
    }
  }

  const canFastForward = ours === null || contains(state, theirs, ours)
  const noFastForward = parsed.flags['no-ff'] === true
  const onlyFastForward = parsed.flags['ff-only'] === true

  if (canFastForward && !noFastForward) {
    const arriving = state.commits[theirs].tree
    const rewrite = rewriteFiles(state, arriving, arriving, 'merge')
    if ('kind' in rewrite) return { state, events: [], outcome: rewrite }

    return {
      state: { ...state, ...advance(state, theirs), index: rewrite.index, workingTree: rewrite.workingTree },
      events: [
        { type: 'FAST_FORWARD', branch, from: ours, to: theirs, paths: rewrite.paths },
        { type: 'HEAD_MOVED', from: ours, to: theirs },
      ],
      outcome: ok([`Updating ${ours ?? '0000000'}..${theirs}`, 'Fast-forward', changeSummary(headTree(state), arriving)]),
    }
  }

  if (onlyFastForward) {
    return {
      state,
      events: [],
      outcome: gitError(
        'fatal: Not possible to fast-forward, aborting.',
        `Both ${into} and ${target} have commits the other doesn't, so the only way to combine them is a merge commit — which \`--ff-only\` rules out.`,
      ),
    }
  }

  // --no-ff on an unborn branch has nothing to be a first parent.
  if (ours === null) {
    return {
      state,
      events: [],
      outcome: gitError('fatal: Non-fast-forward commit does not make sense into an empty head', 'There is no commit here yet to merge into.'),
    }
  }

  // A real merge: every path, three ways, against the commit both sides share.
  const base = mergeBase(state, ours, theirs)
  const baseTree: Tree = base ? state.commits[base].tree : {}
  const ourTree = state.commits[ours].tree
  const theirTree = state.commits[theirs].tree
  const labels = { ours: 'HEAD', theirs: target }

  const toIndex: Tree = {}
  const toDisk: Tree = {}
  const conflicts: FilePath[] = []
  const paths = [...new Set([...Object.keys(baseTree), ...Object.keys(ourTree), ...Object.keys(theirTree)])].sort()

  for (const path of paths) {
    const merged = mergeFile(baseTree[path], ourTree[path], theirTree[path], labels)
    if (merged.conflict) {
      conflicts.push(path)
      // Your version stays in the index; both versions, marked, go on disk.
      if (path in ourTree) toIndex[path] = ourTree[path]
    } else if (merged.content !== undefined) {
      toIndex[path] = merged.content
    }
    if (merged.content !== undefined) toDisk[path] = merged.content
  }

  const rewrite = rewriteFiles(state, toIndex, toDisk, 'merge')
  if ('kind' in rewrite) return { state, events: [], outcome: rewrite }

  const message = typeof parsed.flags.m === 'string' ? parsed.flags.m : `Merge ${target in state.branches ? 'branch' : 'commit'} '${target}'`
  const auto = rewrite.paths.filter((path) => path in ourTree && path in theirTree).map((path) => `Auto-merging ${path}`)

  if (conflicts.length > 0) {
    return {
      state: {
        ...state,
        index: rewrite.index,
        workingTree: rewrite.workingTree,
        merging: { theirs, theirsName: target, conflicts, touched: rewrite.paths, message },
      },
      events: [{ type: 'MERGE_CONFLICT', conflicts, paths: rewrite.paths }],
      // Real Git exits non-zero here, but the repository *did* change —
      // it's mid-merge now — so this is an outcome with events, not a refusal.
      outcome: ok([
        ...auto,
        ...conflicts.map((path) =>
          path in ourTree && path in theirTree
            ? `CONFLICT (content): Merge conflict in ${path}`
            : `CONFLICT (modify/delete): ${path} deleted in ${path in ourTree ? target : 'HEAD'} and modified in ${path in ourTree ? 'HEAD' : target}.`,
        ),
        'Automatic merge failed; fix conflicts and then commit the result.',
      ]),
    }
  }

  const tree = toIndex
  const parents = [ours, theirs]
  const id = commitId(parents, message, tree, state.commitCounter)
  const mergeCommit: Commit = { id, message, parents, tree, order: state.commitCounter }

  const events: GitEvent[] = [
    { type: 'MERGE_CREATED', id, parents, paths: rewrite.paths },
    { type: 'HEAD_MOVED', from: ours, to: id },
  ]

  return {
    state: {
      ...state,
      ...advance(state, id),
      commits: { ...state.commits, [id]: mergeCommit },
      commitCounter: state.commitCounter + 1,
      index: rewrite.index,
      workingTree: rewrite.workingTree,
    },
    events,
    outcome: ok([...auto, "Merge made by the 'ort' strategy.", changeSummary(ourTree, tree)]),
  }
}
