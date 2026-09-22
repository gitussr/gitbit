import { describe, expect, it } from 'vitest'
import { executeCommand } from './execute'
import { headCommit, headCommitId, stagedChanges } from './repo'
import { emptyState, projectFolder } from './seed'
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

function output(transition: Transition): string {
  return transition.outcome.kind === 'ok' ? transition.outcome.output.join('\n') : ''
}

describe('git init', () => {
  it('makes a folder into a repository without recording anything in it', () => {
    const { state, last } = run(projectFolder(), 'git init')

    expect(state.initialized).toBe(true)
    expect(state.index).toEqual({})
    expect(state.branches).toEqual({})
    expect(last.events[0]).toMatchObject({ type: 'REPO_INITIALIZED', branch: 'main' })
  })

  it('reinitializes without complaint, and changes nothing', () => {
    const { state, last } = run(projectFolder(), 'git init', 'git init')

    expect(output(last)).toContain('Reinitialized')
    expect(last.events).toEqual([{ type: 'NOTHING_HAPPENED', reason: 'This folder is already a repository.' }])
    expect(state.initialized).toBe(true)
  })
})

describe('running commands outside a repository', () => {
  it('refuses, in the words Git uses', () => {
    const { last } = run(projectFolder(), 'git status')

    expect(last.outcome).toMatchObject({
      kind: 'git-error',
      message: 'fatal: not a git repository (or any of the parent directories): .git',
    })
    expect(last.after).toBe(last.before)
  })
})

describe('git status', () => {
  it('leads with the branch and says when there are no commits yet', () => {
    const { last } = run(projectFolder(), 'git init', 'git status')
    const text = output(last)

    expect(text).toContain('On branch main')
    expect(text).toContain('No commits yet')
    expect(text).toContain('Untracked files:')
    expect(text).toContain('nothing added to commit but untracked files present')
  })

  it('changes nothing', () => {
    const { last } = run(projectFolder(), 'git init', 'git status')

    expect(last.after).toBe(last.before)
    expect(last.events).toEqual([
      { type: 'NOTHING_HAPPENED', reason: '`git status` only looks. It never changes anything.' },
    ])
  })
})

describe('git add', () => {
  it('stages the file as it is on disk right now', () => {
    const { state, last } = run(projectFolder(), 'git init', 'git add index.html')

    expect(state.index).toEqual({ 'index.html': '<h1>Hello</h1>\n' })
    expect(last.events).toEqual([{ type: 'FILE_STAGED', path: 'index.html' }])
  })

  it('stages everything for `.`', () => {
    const { state } = run(projectFolder(), 'git init', 'git add .')

    expect(Object.keys(state.index).sort()).toEqual(['index.html', 'style.css'])
  })

  it('refuses a path that is not there', () => {
    const { last } = run(projectFolder(), 'git init', 'git add missing.html')

    expect(last.outcome).toMatchObject({
      kind: 'git-error',
      message: "fatal: pathspec 'missing.html' did not match any files",
    })
  })

  it('asks what to add when given nothing', () => {
    const { last } = run(projectFolder(), 'git init', 'git add')

    expect(last.outcome.kind).toBe('git-error')
  })

  it('reports doing nothing when the file is already staged unchanged', () => {
    const { last } = run(projectFolder(), 'git init', 'git add index.html', 'git add index.html')

    expect(last.events).toEqual([
      { type: 'NOTHING_HAPPENED', reason: 'Those files are already staged exactly as they are on disk.' },
    ])
  })
})

describe('git commit', () => {
  it('records the staged snapshot and moves the branch onto it', () => {
    const { state, last } = run(projectFolder(), 'git init', 'git add .', 'git commit -m "Add the site"')

    const head = headCommit(state)
    expect(head?.message).toBe('Add the site')
    expect(head?.parents).toEqual([])
    expect(head?.tree).toEqual(state.index)
    expect(state.branches.main).toBe(head?.id)

    expect(last.events.map((event) => event.type)).toEqual(['COMMIT_CREATED', 'BRANCH_CREATED', 'HEAD_MOVED'])
    expect(output(last)).toContain('(root-commit)')
  })

  it('does not empty the index — the Staging Area only looks empty because it matches HEAD', () => {
    const { state } = run(projectFolder(), 'git init', 'git add .', 'git commit -m "First"')

    expect(Object.keys(state.index).sort()).toEqual(['index.html', 'style.css'])
    expect(stagedChanges(state)).toEqual([])
  })

  it('records only what was staged, not what is on disk', () => {
    let { state } = run(projectFolder(), 'git init', 'git add index.html')
    state = writeFile(state, 'index.html', '<h1>Edited after staging</h1>\n').state
    state = run(state, 'git commit -m "Only the staged version"').state

    expect(headCommit(state)?.tree['index.html']).toBe('<h1>Hello</h1>\n')
    expect(state.workingTree['index.html']).toBe('<h1>Edited after staging</h1>\n')
  })

  it('refuses when nothing is staged, and says which case it is', () => {
    const { last } = run(projectFolder(), 'git init', 'git commit -m "Nothing"')

    expect(last.outcome).toMatchObject({
      kind: 'git-error',
      message: 'no changes added to commit (use "git add" and/or "git commit -a")',
    })
  })

  it('refuses without a message', () => {
    const { last } = run(projectFolder(), 'git init', 'git add .', 'git commit')

    expect(last.outcome.kind).toBe('git-error')
  })

  it('counts the lines it recorded', () => {
    const { last } = run(emptyState(), 'git init')
    const seeded = writeFile(last.after, 'a.txt', 'one\ntwo\n').state
    const { last: committed } = run(seeded, 'git add .', 'git commit -m "Two lines"')

    expect(output(committed)).toContain('1 file changed, 2 insertions(+)')
  })
})

describe('git log', () => {
  it('explains that there is no history rather than printing nothing', () => {
    const { last } = run(projectFolder(), 'git init', 'git log')

    expect(last.outcome).toMatchObject({
      kind: 'git-error',
      message: "fatal: your current branch 'main' does not have any commits yet",
    })
  })

  it('lists commits newest first, and marks where HEAD is', () => {
    const { state } = run(projectFolder(), 'git init', 'git add .', 'git commit -m "First"')
    const second = writeFile(state, 'index.html', '<h1>Second</h1>\n').state
    const { last } = run(second, 'git add .', 'git commit -m "Second"', 'git log --oneline')

    const lines = output(last).split('\n')
    expect(lines[0]).toContain('Second')
    expect(lines[0]).toContain('(HEAD -> main)')
    expect(lines[1]).toContain('First')
  })
})

describe('git diff', () => {
  it('compares the Staging Area with the Working Directory by default', () => {
    let { state } = run(projectFolder(), 'git init', 'git add index.html')
    state = writeFile(state, 'index.html', '<h1>Welcome to GitBit</h1>\n').state
    const { last } = run(state, 'git diff')

    const text = output(last)
    expect(text).toContain('-<h1>Hello</h1>')
    expect(text).toContain('+<h1>Welcome to GitBit</h1>')
  })

  it('compares HEAD with the Staging Area under --staged', () => {
    const { state } = run(projectFolder(), 'git init', 'git add index.html')
    const { last } = run(state, 'git diff --staged')

    expect(output(last)).toContain('+<h1>Hello</h1>')
  })

  it('says nothing about untracked files, because there is nothing to compare', () => {
    const { last } = run(projectFolder(), 'git init', 'git diff')

    expect(output(last)).toBe('')
  })

  it('shows an empty diff once everything is staged — the moment beginners think their work vanished', () => {
    const { state } = run(projectFolder(), 'git init', 'git add .')
    const { last } = run(state, 'git diff')

    expect(output(last)).toBe('')
    expect(headCommitId(state)).toBeNull()
  })
})
