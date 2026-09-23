import { describe, expect, it } from 'vitest'
import { executeCommand } from './execute'
import { folderWith } from './seed'
import { fileHistory, relationToHead, snapshot, timeline } from './timeline'
import { deleteFile, writeFile } from './workspace'
import type { RepoState } from './types'

const run = (start: RepoState, ...inputs: string[]) =>
  inputs.reduce((state, input) => executeCommand(state, input).after, start)
const edit = (state: RepoState, path: string, content: string) => writeFile(state, path, content).state

/** A: index.html + style.css. B: edits index.html. C: adds app.js, deletes style.css. */
function abc(): RepoState {
  let state = run(folderWith({ 'index.html': 'A\n', 'style.css': 'body {}\n' }), 'git init', 'git add .', 'git commit -m "A"')
  state = run(edit(state, 'index.html', 'B\n'), 'git add .', 'git commit -m "B"')
  state = deleteFile(writeFile(state, 'app.js', 'go()\n').state, 'style.css').state
  return run(state, 'git add .', 'git commit -m "C"')
}

const ids = (state: RepoState) => Object.fromEntries(timeline(state).map((entry) => [entry.commit.message, entry.commit.id]))

describe('timeline', () => {
  it('lists every commit oldest first, and marks HEAD', () => {
    const entries = timeline(abc())
    expect(entries.map((entry) => entry.commit.message)).toEqual(['A', 'B', 'C'])
    expect(entries.map((entry) => entry.isHead)).toEqual([false, false, true])
    expect(entries.every((entry) => entry.reachable)).toBe(true)
  })

  it('keeps commits a reset left behind, marked unreachable', () => {
    const state = run(abc(), 'git reset --hard HEAD~2')
    expect(timeline(state).map((entry) => [entry.commit.message, entry.reachable])).toEqual([
      ['A', true],
      ['B', false],
      ['C', false],
    ])
  })
})

describe('snapshot', () => {
  it('shows the whole project at a commit, marked with what that commit did', () => {
    const state = abc()
    const { A, B, C } = ids(state)
    expect(snapshot(state, A)).toEqual([
      { path: 'index.html', status: 'added' },
      { path: 'style.css', status: 'added' },
    ])
    expect(snapshot(state, B)).toEqual([
      { path: 'index.html', status: 'modified' },
      { path: 'style.css', status: 'unchanged' },
    ])
    expect(snapshot(state, C)).toEqual([
      { path: 'app.js', status: 'added' },
      { path: 'index.html', status: 'unchanged' },
      { path: 'style.css', status: 'deleted' },
    ])
  })
})

describe('fileHistory', () => {
  it('tells a file’s story, oldest first', () => {
    const state = abc()
    expect(fileHistory(state, 'index.html').map((entry) => [entry.commit.message, entry.change])).toEqual([
      ['A', 'added'],
      ['B', 'modified'],
    ])
    expect(fileHistory(state, 'style.css').map((entry) => [entry.commit.message, entry.change])).toEqual([
      ['A', 'added'],
      ['C', 'deleted'],
    ])
  })

  it('credits a merged change to the commit that made it, not the merge', () => {
    let state = run(folderWith({ 'index.html': 'one\n', 'style.css': 'a\n' }), 'git init', 'git add .', 'git commit -m "Start"', 'git switch -c side')
    state = run(edit(state, 'index.html', 'two\n'), 'git add .', 'git commit -m "Side edit"', 'git switch main')
    state = run(edit(state, 'style.css', 'b\n'), 'git add .', 'git commit -m "Main edit"', 'git merge side')

    expect(fileHistory(state, 'index.html').map((entry) => entry.commit.message)).toEqual(['Start', 'Side edit'])
  })
})

describe('relationToHead', () => {
  it('counts back the way HEAD~n does', () => {
    const state = abc()
    const { A, B, C } = ids(state)
    expect(relationToHead(state, C)).toEqual({ kind: 'head' })
    expect(relationToHead(state, B)).toEqual({ kind: 'behind', steps: 1 })
    expect(relationToHead(state, A)).toEqual({ kind: 'behind', steps: 2 })
  })

  it('places a commit off HEAD’s history elsewhere', () => {
    const state = run(abc(), 'git reset --hard HEAD~1')
    expect(relationToHead(state, ids(state).C)).toEqual({ kind: 'elsewhere' })
  })
})
