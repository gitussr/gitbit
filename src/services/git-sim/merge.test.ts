import { describe, expect, it } from 'vitest'
import { executeCommand } from './execute'
import { currentBranch, headCommit, isClean } from './repo'
import { folderWith } from './seed'
import { writeFile } from './workspace'
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

const PAGE = '<h1>Hello</h1>\n<p>Intro</p>\n<footer>2024</footer>\n'

/** main has one commit; HEAD is on `feature`, branched from it. */
function branched(): RepoState {
  return run(
    folderWith({ 'index.html': PAGE, 'style.css': 'body {}\n' }),
    'git init',
    'git add .',
    'git commit -m "Start"',
    'git switch -c feature',
  ).state
}

/** Commit an edit on whatever branch HEAD is on. */
function commitEdit(state: RepoState, path: string, content: string, message: string): RepoState {
  return run(edit(state, path, content), `git add ${path}`, `git commit -m "${message}"`).state
}

/** feature changed the title; main, meanwhile, changed the footer — different lines of the same file. */
function diverged(mainPage = PAGE.replace('2024', '2026')): RepoState {
  const feature = commitEdit(branched(), 'index.html', PAGE.replace('Hello', 'Welcome'), 'New title')
  const onMain = run(feature, 'git switch main').state
  return commitEdit(onMain, 'index.html', mainPage, 'Main change')
}

describe('git merge — fast-forward', () => {
  it('slides the branch forward and makes no new commit', () => {
    const feature = commitEdit(branched(), 'index.html', PAGE.replace('Hello', 'Welcome'), 'New title')
    const onMain = run(feature, 'git switch main').state
    const commitsBefore = Object.keys(onMain.commits).length

    const { state, last } = run(onMain, 'git merge feature')

    expect(state.branches.main).toBe(state.branches.feature)
    expect(Object.keys(state.commits)).toHaveLength(commitsBefore)
    expect(state.workingTree['index.html']).toContain('Welcome')
    expect(isClean(state)).toBe(true)
    expect(types(last)).toEqual(['FAST_FORWARD', 'HEAD_MOVED'])
    expect(output(last)).toContain('Fast-forward')
  })

  it('--no-ff makes a merge commit even when it could fast-forward', () => {
    const feature = commitEdit(branched(), 'index.html', PAGE.replace('Hello', 'Welcome'), 'New title')
    const onMain = run(feature, 'git switch main').state
    const { state, last } = run(onMain, 'git merge --no-ff feature')

    expect(headCommit(state)?.parents).toEqual([onMain.branches.main, onMain.branches.feature])
    expect(types(last)).toEqual(['MERGE_CREATED', 'HEAD_MOVED'])
  })

  it('says so when there is nothing new to bring in', () => {
    const { last } = run(branched(), 'git merge main')
    expect(output(last)).toBe('Already up to date.')
    expect(types(last)).toEqual(['NOTHING_HAPPENED'])
  })
})

describe('git merge — merge commit', () => {
  it('combines two histories into a commit with two parents', () => {
    const start = diverged()
    const { state, last } = run(start, 'git merge feature')
    const merged = headCommit(state)

    expect(merged?.parents).toEqual([start.branches.main, start.branches.feature])
    expect(merged?.message).toBe("Merge branch 'feature'")
    expect(types(last)).toEqual(['MERGE_CREATED', 'HEAD_MOVED'])
    expect(output(last)).toContain("Merge made by the 'ort' strategy.")
    // feature itself didn't move — merging brings their work to you, not yours to them.
    expect(state.branches.feature).toBe(start.branches.feature)
  })

  it('merges different lines of the same file without a conflict', () => {
    const { state } = run(diverged(), 'git merge feature')
    expect(state.workingTree['index.html']).toBe('<h1>Welcome</h1>\n<p>Intro</p>\n<footer>2026</footer>\n')
    expect(isClean(state)).toBe(true)
    expect(state.merging).toBeNull()
  })

  it('--ff-only refuses when a merge commit would be needed', () => {
    const { last } = run(diverged(), 'git merge --ff-only feature')
    expect(last.outcome).toMatchObject({ kind: 'git-error', message: 'fatal: Not possible to fast-forward, aborting.' })
  })

  it('refuses to overwrite uncommitted changes to a file it needs to merge', () => {
    const dirty = edit(diverged(), 'index.html', 'unsaved\n')
    const { last } = run(dirty, 'git merge feature')
    expect(output(last)).toContain('would be overwritten by merge')
    expect(last.after).toBe(dirty)
  })

  it('names something that doesn’t exist', () => {
    expect(output(run(diverged(), 'git merge nope').last)).toBe('merge: nope - not something we can merge')
  })
})

describe('git merge — conflicts', () => {
  /** Both sides rewrote the title, differently. */
  const conflicted = () => run(diverged(PAGE.replace('Hello', 'Howdy')), 'git merge feature')

  it('stops mid-merge with both versions in the file, and yours still in the index', () => {
    const { state, last } = conflicted()

    expect(state.merging).toMatchObject({ theirsName: 'feature', conflicts: ['index.html'] })
    expect(state.workingTree['index.html']).toBe(
      '<<<<<<< HEAD\n<h1>Howdy</h1>\n=======\n<h1>Welcome</h1>\n>>>>>>> feature\n<p>Intro</p>\n<footer>2024</footer>\n',
    )
    expect(state.index['index.html']).toContain('Howdy')
    expect(types(last)).toEqual(['MERGE_CONFLICT'])
    expect(output(last)).toContain('CONFLICT (content): Merge conflict in index.html')
    // No commit yet — the merge is waiting on you.
    expect(state.branches.main).toBe(last.before.branches.main)
  })

  it('reports the conflict in git status, once', () => {
    const { last } = run(conflicted().state, 'git status')
    const text = output(last)
    expect(text).toContain('You have unmerged paths.')
    expect(text).toMatch(/both modified:\s+index\.html/)
    expect(text).not.toContain('Changes not staged')
  })

  it('won’t commit, switch, or start another merge until it’s resolved', () => {
    const { state } = conflicted()
    expect(output(run(state, 'git commit -m "x"').last)).toContain('Committing is not possible because you have unmerged files')
    expect(output(run(state, 'git switch feature').last)).toContain('you need to resolve your current index first')
    expect(output(run(state, 'git merge feature').last)).toContain('Merging is not possible')
  })

  it('resolves with edit + add, and concludes with a two-parent commit', () => {
    const { state: stopped } = conflicted()
    const resolved = edit(stopped, 'index.html', '<h1>Welcome, howdy</h1>\n<p>Intro</p>\n<footer>2024</footer>\n')

    const added = run(resolved, 'git add index.html')
    expect(types(added.last)).toEqual(['CONFLICT_RESOLVED', 'FILE_STAGED'])
    expect(added.state.merging?.conflicts).toEqual([])
    expect(output(run(added.state, 'git status').last)).toContain('All conflicts fixed but you are still merging.')

    // No -m needed: the merge message is already written.
    const { state, last } = run(added.state, 'git commit')
    expect(headCommit(state)?.parents).toEqual([stopped.branches.main, stopped.branches.feature])
    expect(headCommit(state)?.message).toBe("Merge branch 'feature'")
    expect(state.merging).toBeNull()
    expect(types(last)).toEqual(['MERGE_CREATED', 'HEAD_MOVED'])
  })

  it('--abort puts everything back the way it was', () => {
    const { state: stopped, last: merge } = conflicted()
    const { state, last } = run(stopped, 'git merge --abort')

    expect(state.merging).toBeNull()
    expect(state.workingTree).toEqual(merge.before.workingTree)
    expect(state.index).toEqual(merge.before.index)
    expect(currentBranch(state)).toBe('main')
    expect(types(last)).toEqual(['MERGE_ABORTED'])
  })

  it('--abort with no merge in progress says so', () => {
    expect(output(run(diverged(), 'git merge --abort').last)).toContain('There is no merge to abort')
  })
})
