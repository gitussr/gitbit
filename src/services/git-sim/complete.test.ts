import { describe, expect, it } from 'vitest'
import { complete } from './complete'
import { executeCommand } from './execute'
import { projectFolder } from './seed'
import type { RepoState } from './types'

function after(...inputs: string[]): RepoState {
  return inputs.reduce((state, input) => executeCommand(state, input).after, projectFolder())
}

describe('complete', () => {
  it('starts every command with git', () => {
    expect(complete(projectFolder(), '')).toEqual(['git '])
    expect(complete(projectFolder(), 'g')).toEqual(['git '])
  })

  it('offers only the subcommands the engine simulates', () => {
    expect(complete(projectFolder(), 'git ')).toEqual([
      'git add ',
      'git commit ',
      'git diff ',
      'git init ',
      'git log ',
      'git status ',
    ])
    expect(complete(projectFolder(), 'git s')).toEqual(['git status '])
    // A real command that isn't simulated yet is not offered.
    expect(complete(projectFolder(), 'git pu')).toEqual([])
  })

  it('completes git add to files with something to stage', () => {
    const state = after('git init', 'git add style.css')
    expect(complete(state, 'git add ')).toEqual(['git add index.html '])
    expect(complete(state, 'git add s')).toEqual([])
  })

  it('does not offer a path twice in one command', () => {
    expect(complete(after('git init'), 'git add index.html ')).toEqual(['git add index.html style.css '])
  })

  it('completes the flags a command actually reads', () => {
    expect(complete(projectFolder(), 'git log --o')).toEqual(['git log --oneline '])
    expect(complete(projectFolder(), 'git commit -')).toEqual(['git commit -m "'])
    expect(complete(projectFolder(), 'git status -')).toEqual([])
  })

  it('leaves shell commands alone', () => {
    expect(complete(projectFolder(), 'ls ')).toEqual([])
  })
})

