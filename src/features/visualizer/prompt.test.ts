import { describe, expect, it } from 'vitest'
import { executeCommand, seeds, writeFile, type RepoState } from '@/services/git-sim'
import { promptFor } from './prompt'

function run(state: RepoState, ...commands: string[]): RepoState {
  return commands.reduce((current, command) => executeCommand(current, command).after, state)
}

function edit(state: RepoState, content: string): RepoState {
  return writeFile(state, 'index.html', content).state
}

describe('the terminal prompt', () => {
  it('has no branch before git init, and one after', () => {
    const folder = seeds['project-folder']()
    expect(promptFor(folder)).toBe('project $')
    expect(promptFor(run(folder, 'git init'))).toBe('project (main) $')
  })

  it('follows a switch, and says when HEAD is detached', () => {
    const repo = seeds['one-commit']()
    expect(promptFor(run(repo, 'git switch -c feature'))).toBe('project (feature) $')
    expect(promptFor(run(repo, 'git switch --detach main'))).toMatch(/^project \(HEAD detached at [0-9a-f]{7}\) \$$/)
  })

  it('says MERGING while a merge is stopped on a conflict', () => {
    let repo = run(seeds['one-commit'](), 'git switch -c other')
    repo = run(edit(repo, '<h1>Theirs</h1>\n'), 'git commit -am "Other"', 'git switch main')
    repo = run(edit(repo, '<h1>Ours</h1>\n'), 'git commit -am "Main"', 'git merge other')
    expect(repo.merging).not.toBeNull()
    expect(promptFor(repo)).toBe('project (main|MERGING) $')
    expect(promptFor(run(repo, 'git merge --abort'))).toBe('project (main) $')
  })
})
