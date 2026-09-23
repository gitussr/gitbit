import { describe, expect, it } from 'vitest'
import { executeCommand } from './execute'
import { historyGraph } from './graph'
import { headCommit, headCommitId, isClean, resolve, stagedChanges, unstagedChanges } from './repo'
import { folderWith } from './seed'
import { writeFile } from './workspace'
import type { GitEvent } from './events'
import type { Transition } from './result'
import type { RepoState } from './types'

function run(start: RepoState, ...inputs: string[]): { state: RepoState; last: Transition } {
  let state = start
  let last!: Transition
  for (const input of inputs) {
    last = executeCommand(state, input)
    state = last.after
  }
  return { state, last }
}

const edit = (state: RepoState, path: string, content: string) => writeFile(state, path, content).state
const types = (transition: Transition) => transition.events.map((event) => event.type)
const output = (transition: Transition) =>
  transition.outcome.kind === 'ok' ? transition.outcome.output.join('\n') : transition.outcome.message
const eventOf = <T extends GitEvent['type']>(transition: Transition, type: T) =>
  transition.events.find((event) => event.type === type) as Extract<GitEvent, { type: T }>

/** Three commits on main: A → B → C, each changing index.html. */
function history(): RepoState {
  let state = run(folderWith({ 'index.html': 'A\n', 'style.css': 'body {}\n' }), 'git init', 'git add .', 'git commit -m "A"').state
  for (const version of ['B', 'C']) {
    state = run(edit(state, 'index.html', `${version}\n`), 'git add .', `git commit -m "${version}"`).state
  }
  return state
}

describe('revision syntax', () => {
  it('walks back with ~ and ^', () => {
    const state = history()
    const [c, b, a] = historyGraph(state).nodes.map((node) => node.commit.id)
    expect(resolve(state, 'HEAD')).toBe(c)
    expect(resolve(state, 'HEAD~1')).toBe(b)
    expect(resolve(state, 'HEAD^')).toBe(b)
    expect(resolve(state, 'HEAD~2')).toBe(a)
    expect(resolve(state, 'main^^')).toBe(a)
    expect(resolve(state, 'HEAD~3')).toBeNull()
  })
})

describe('git restore', () => {
  it('puts a file on disk back to what is staged — and the edit is gone for good', () => {
    const dirty = edit(history(), 'index.html', 'unsaved\n')
    const { state, last } = run(dirty, 'git restore index.html')

    expect(state.workingTree['index.html']).toBe('C\n')
    expect(last.events).toEqual([{ type: 'FILE_RESTORED', path: 'index.html', discarded: true }])
  })

  it('--staged unstages without touching the disk', () => {
    const staged = run(edit(history(), 'index.html', 'D\n'), 'git add index.html').state
    const { state, last } = run(staged, 'git restore --staged index.html')

    expect(stagedChanges(state)).toEqual([])
    expect(state.workingTree['index.html']).toBe('D\n')
    expect(types(last)).toEqual(['FILE_UNSTAGED'])
  })

  it('restores from what is staged, not from the last commit', () => {
    const staged = run(edit(history(), 'index.html', 'staged\n'), 'git add index.html').state
    const { state, last } = run(edit(staged, 'index.html', 'later\n'), 'git restore index.html')
    expect(state.workingTree['index.html']).toBe('staged\n')
    // The staged version still exists, so nothing unrecoverable happened... except "later".
    expect(eventOf(last, 'FILE_RESTORED').discarded).toBe(true)
  })

  it('won’t restore a file Git has never had a copy of', () => {
    const { last } = run(edit(history(), 'notes.md', 'mine\n'), 'git restore notes.md')
    expect(output(last)).toContain("pathspec 'notes.md' did not match")
  })

  it('--source puts back an older version', () => {
    const { state } = run(history(), 'git restore --source=HEAD~2 index.html')
    expect(state.workingTree['index.html']).toBe('A\n')
    expect(state.index['index.html']).toBe('C\n')
  })
})

describe('git reset — the three layers', () => {
  it('--soft moves the branch only; the undone work is staged', () => {
    const start = history()
    const { state, last } = run(start, 'git reset --soft HEAD~1')

    expect(headCommit(state)?.message).toBe('B')
    expect(state.index).toEqual(start.index)
    expect(state.workingTree).toEqual(start.workingTree)
    expect(stagedChanges(state)).toEqual([{ path: 'index.html', kind: 'modified' }])
    expect(eventOf(last, 'RESET_PERFORMED')).toMatchObject({ mode: 'soft', layers: ['head'] })
  })

  it('--mixed (the default) moves the branch and the index; the work is unstaged', () => {
    const start = history()
    const { state, last } = run(start, 'git reset HEAD~1')

    expect(headCommit(state)?.message).toBe('B')
    expect(state.index['index.html']).toBe('B\n')
    expect(state.workingTree).toEqual(start.workingTree)
    expect(unstagedChanges(state)).toEqual([{ path: 'index.html', kind: 'modified' }])
    expect(output(last)).toBe('Unstaged changes after reset:\nM\tindex.html')
    expect(eventOf(last, 'RESET_PERFORMED')).toMatchObject({ mode: 'mixed', layers: ['head', 'index'] })
  })

  it('--hard moves all three, and says which uncommitted work it destroyed', () => {
    const dirty = edit(edit(history(), 'index.html', 'unsaved\n'), 'notes.md', 'untracked\n')
    const { state, last } = run(dirty, 'git reset --hard HEAD~1')

    expect(headCommit(state)?.message).toBe('B')
    expect(state.workingTree['index.html']).toBe('B\n')
    // Untracked files aren't Git's to touch.
    expect(state.workingTree['notes.md']).toBe('untracked\n')
    expect(output(last)).toBe('HEAD is now at ' + headCommitId(state) + ' B')
    expect(eventOf(last, 'RESET_PERFORMED')).toMatchObject({
      mode: 'hard',
      layers: ['head', 'index', 'worktree'],
      discarded: ['index.html'],
    })
  })

  it('--hard with no commit throws away uncommitted changes and stays put', () => {
    const { state, last } = run(edit(history(), 'index.html', 'oops\n'), 'git reset --hard')
    expect(isClean(state)).toBe(true)
    expect(types(last)).toEqual(['RESET_PERFORMED'])
    // HEAD didn't move, so it isn't reported as a changed layer.
    expect(eventOf(last, 'RESET_PERFORMED').layers).toEqual(['index', 'worktree'])
  })

  it('leaves the undone commits behind: they drop out of the graph', () => {
    const { state } = run(history(), 'git reset --hard HEAD~2')
    expect(historyGraph(state).nodes.map((node) => node.commit.message)).toEqual(['A'])
    // Still in the object store — the Time Machine can find them.
    expect(Object.keys(state.commits)).toHaveLength(3)
  })

  it('git reset <file> unstages, and refuses a mode with paths', () => {
    const staged = run(edit(history(), 'index.html', 'D\n'), 'git add .').state
    expect(stagedChanges(run(staged, 'git reset index.html').state)).toEqual([])
    expect(stagedChanges(run(staged, 'git reset HEAD index.html').state)).toEqual([])
    expect(output(run(staged, 'git reset --hard index.html').last)).toBe('fatal: Cannot do hard reset with paths.')
  })

  it('says nothing moved when nothing did', () => {
    expect(types(run(history(), 'git reset').last)).toEqual(['NOTHING_HAPPENED'])
  })

  it('names what it can’t find', () => {
    expect(output(run(history(), 'git reset HEAD~9').last)).toContain("ambiguous argument 'HEAD~9'")
  })
})

describe('git revert', () => {
  it('undoes a commit by adding one — history only grows', () => {
    const start = history()
    const { state, last } = run(start, 'git revert HEAD')

    expect(headCommit(state)?.message).toBe('Revert "C"')
    expect(headCommit(state)?.parents).toEqual([headCommitId(start)])
    expect(state.workingTree['index.html']).toBe('B\n')
    expect(eventOf(last, 'COMMIT_CREATED')).toMatchObject({ reverts: headCommitId(start) })
    expect(historyGraph(state).nodes).toHaveLength(4)
  })

  it('stops for conflicts like a merge when later work touched the same lines', () => {
    // Reverting B means turning "B" back into "A" — but C has since changed that line.
    const { state, last } = run(history(), 'git revert HEAD~1')

    expect(state.merging).toMatchObject({ kind: 'revert', conflicts: ['index.html'] })
    expect(eventOf(last, 'MERGE_CONFLICT')).toMatchObject({ operation: 'revert' })
    expect(output(run(state, 'git status').last)).toContain('You are currently reverting commit')

    const { state: settled } = run(state, 'git restore --theirs index.html', 'git add index.html', 'git revert --continue')
    expect(headCommit(settled)?.message).toBe('Revert "B"')
    expect(headCommit(settled)?.parents).toHaveLength(1)
    expect(settled.workingTree['index.html']).toBe('A\n')
  })

  it('--abort puts everything back', () => {
    const start = history()
    const { state } = run(start, 'git revert HEAD~1', 'git revert --abort')
    expect(state.merging).toBeNull()
    expect(state.workingTree).toEqual(start.workingTree)
  })

  it('asks which side for a merge commit', () => {
    const branched = run(history(), 'git switch -c side', 'git switch main').state
    const onSide = run(edit(run(branched, 'git switch side').state, 'style.css', 'body { margin: 0 }\n'), 'git add .', 'git commit -m "Side"').state
    const merged = run(onSide, 'git switch main', 'git merge --no-ff side').state

    expect(output(run(merged, 'git revert HEAD').last)).toContain('is a merge but no -m option was given')
    const { state } = run(merged, 'git revert -m 1 HEAD')
    expect(state.workingTree['style.css']).toBe('body {}\n')
  })
})

describe('restore during a conflict', () => {
  it('--ours / --theirs pick a side, and git add still does the resolving', () => {
    const base = run(folderWith({ 'index.html': 'Hello\n' }), 'git init', 'git add .', 'git commit -m "Start"', 'git switch -c feature').state
    const feature = run(edit(base, 'index.html', 'Feature\n'), 'git add .', 'git commit -m "F"', 'git switch main').state
    const conflicted = run(edit(feature, 'index.html', 'Main\n'), 'git add .', 'git commit -m "M"', 'git merge feature').state

    expect(output(run(conflicted, 'git restore index.html').last)).toBe("error: path 'index.html' is unmerged")

    const theirs = run(conflicted, 'git restore --theirs index.html').state
    expect(theirs.workingTree['index.html']).toBe('Feature\n')
    expect(theirs.merging?.conflicts).toEqual(['index.html'])

    expect(run(conflicted, 'git restore --ours index.html').state.workingTree['index.html']).toBe('Main\n')
  })

  it('git reset abandons the merge, as it does in Git', () => {
    const base = run(folderWith({ 'index.html': 'Hello\n' }), 'git init', 'git add .', 'git commit -m "Start"', 'git switch -c feature').state
    const feature = run(edit(base, 'index.html', 'Feature\n'), 'git add .', 'git commit -m "F"', 'git switch main').state
    const conflicted = run(edit(feature, 'index.html', 'Main\n'), 'git add .', 'git commit -m "M"', 'git merge feature').state

    expect(output(run(conflicted, 'git reset --soft').last)).toContain('Cannot do a soft reset in the middle of a merge')
    const { state } = run(conflicted, 'git reset --hard')
    expect(state.merging).toBeNull()
    expect(state.workingTree['index.html']).toBe('Main\n')
  })
})
