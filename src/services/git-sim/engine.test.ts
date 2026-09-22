import { describe, expect, it } from 'vitest'
import { executeCommand } from './execute'
import { commitId } from './hash'
import { isClean, stagedChanges, untrackedFiles } from './repo'
import { projectFolder } from './seed'
import { suggest } from './suggest'
import { writeFile } from './workspace'
import type { Transition } from './result'
import type { RepoState } from './types'

function run(start: RepoState, ...inputs: string[]): { state: RepoState; transitions: Transition[] } {
  let state = start
  const transitions: Transition[] = []
  for (const input of inputs) {
    const transition = executeCommand(state, input)
    transitions.push(transition)
    state = transition.after
  }
  return { state, transitions }
}

describe('Scenario 1 — first commit', () => {
  it('walks a folder of files all the way to a recorded snapshot', () => {
    const start = projectFolder()
    expect(start.initialized).toBe(false)

    const edited = writeFile(start, 'index.html', '<h1>Welcome to GitBit</h1>\n').state
    const { state, transitions } = run(
      edited,
      'git init',
      'git status',
      'git add index.html',
      'git commit -m "Add the homepage"',
    )

    expect(transitions.every((transition) => transition.outcome.kind === 'ok')).toBe(true)

    // index.html is recorded; style.css was never staged, so it is still untracked.
    expect(state.commits[state.branches.main].tree).toEqual({ 'index.html': '<h1>Welcome to GitBit</h1>\n' })
    expect(untrackedFiles(state)).toEqual(['style.css'])
    expect(stagedChanges(state)).toEqual([])
    expect(isClean(state)).toBe(false)
  })

  it('emits the events the Visualizer animates, in order', () => {
    const { transitions } = run(projectFolder(), 'git init', 'git add .', 'git commit -m "First"')

    expect(transitions.flatMap((transition) => transition.events.map((event) => event.type))).toEqual([
      'REPO_INITIALIZED',
      'FILE_STAGED',
      'FILE_STAGED',
      'COMMIT_CREATED',
      'BRANCH_CREATED',
      'HEAD_MOVED',
    ])
  })
})

describe('failed commands', () => {
  it('leave the repository untouched but still produce a transition to explain', () => {
    const { state, transitions } = run(projectFolder(), 'git init', 'git commit -m "Too early"')
    const failed = transitions[1]

    expect(failed.outcome.kind).toBe('git-error')
    expect(failed.after).toBe(failed.before)
    expect(failed.events).toEqual([])
    expect(state.commits).toEqual({})
  })

  it('carry a reason that refers to the state, not just the error', () => {
    const { transitions } = run(projectFolder(), 'git status')
    const outcome = transitions[0].outcome

    expect(outcome.kind).toBe('git-error')
    expect(outcome.kind !== 'ok' && outcome.why).toContain('ordinary folder')
  })
})

describe('history', () => {
  it('keeps every before-state, which is all undo needs', () => {
    const { transitions } = run(projectFolder(), 'git init', 'git add .', 'git commit -m "First"')

    // Undoing the commit is going back to the state the commit started from.
    const beforeCommit = transitions[2].before
    expect(beforeCommit.commits).toEqual({})
    expect(stagedChanges(beforeCommit)).toHaveLength(2)
  })
})

describe('commit identity', () => {
  it('is derived from contents, parents and message', () => {
    const tree = { 'a.txt': 'hello\n' }

    expect(commitId([], 'First', tree, 0)).toBe(commitId([], 'First', tree, 0))
    expect(commitId([], 'First', tree, 0)).not.toBe(commitId([], 'Second', tree, 0))
    expect(commitId([], 'First', tree, 0)).not.toBe(commitId([], 'First', { 'a.txt': 'goodbye\n' }, 0))
  })

  it('changes when the parent changes — why rebase produces new commits, not moved ones', () => {
    const tree = { 'a.txt': 'hello\n' }

    expect(commitId(['aaaaaaa'], 'Same change', tree, 1)).not.toBe(commitId(['bbbbbbb'], 'Same change', tree, 1))
  })
})

describe('suggestions', () => {
  it('follow the state rather than a fixed lesson order', () => {
    const start = projectFolder()
    expect(suggest(start)).toEqual(['git init'])

    const initialized = run(start, 'git init').state
    expect(suggest(initialized)).toContain('git add .')

    const staged = run(initialized, 'git add .').state
    expect(suggest(staged)[0]).toContain('git commit')

    const committed = run(staged, 'git commit -m "First"').state
    expect(suggest(committed)).toContain('git log --oneline')
  })
})
