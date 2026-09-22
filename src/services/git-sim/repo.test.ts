import { describe, expect, it } from 'vitest'
import { executeCommand } from './execute'
import { stagedChanges, unstagedChanges, untrackedFiles } from './repo'
import { projectFolder } from './seed'
import { writeFile } from './workspace'
import type { RepoState } from './types'

function run(start: RepoState, ...inputs: string[]): RepoState {
  return inputs.reduce((state, input) => executeCommand(state, input).after, start)
}

describe('derived views', () => {
  it('reports files Git has never seen as untracked, not as changes', () => {
    const state = run(projectFolder(), 'git init')

    expect(untrackedFiles(state)).toEqual(['index.html', 'style.css'])
    expect(stagedChanges(state)).toEqual([])
    expect(unstagedChanges(state)).toEqual([])
  })

  it('shows a file that was staged and then edited again in both places at once', () => {
    let state = run(projectFolder(), 'git init', 'git add index.html')
    state = writeFile(state, 'index.html', '<h1>Welcome to GitBit</h1>\n').state

    // Staged: the contents as they were when `git add` ran.
    expect(stagedChanges(state)).toEqual([{ path: 'index.html', kind: 'added' }])
    // Unstaged: the edit made since. Both are true, which is the lesson.
    expect(unstagedChanges(state)).toEqual([{ path: 'index.html', kind: 'modified' }])
  })

  it('treats a deleted tracked file as an unstaged deletion', () => {
    let state = run(projectFolder(), 'git init', 'git add .', 'git commit -m "First"')
    const workingTree = { ...state.workingTree }
    delete workingTree['style.css']
    state = { ...state, workingTree }

    expect(unstagedChanges(state)).toEqual([{ path: 'style.css', kind: 'deleted' }])
  })
})
