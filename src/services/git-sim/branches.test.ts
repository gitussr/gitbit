import { describe, expect, it } from 'vitest'
import { executeCommand } from './execute'
import { historyGraph } from './graph'
import { currentBranch, headCommitId, isClean, unstagedChanges } from './repo'
import { projectFolder } from './seed'
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
const failed = (transition: Transition) => transition.outcome.kind !== 'ok'
const output = (transition: Transition) => (transition.outcome.kind === 'ok' ? transition.outcome.output.join('\n') : '')

/** One commit on main, clean. */
function committed(): RepoState {
  return run(projectFolder(), 'git init', 'git add .', 'git commit -m "First"').state
}

/** main and feature diverged: feature changed index.html in its own commit. */
function diverged(): RepoState {
  const onFeature = run(committed(), 'git switch -c feature').state
  return run(edit(onFeature, 'index.html', '<h1>Feature</h1>\n'), 'git add .', 'git commit -m "Feature work"').state
}

describe('git branch', () => {
  it('creates a name pointing at HEAD’s commit — and leaves you where you were', () => {
    const start = committed()
    const { state, last } = run(start, 'git branch feature')

    expect(state.branches.feature).toBe(headCommitId(start))
    expect(currentBranch(state)).toBe('main')
    expect(state.workingTree).toEqual(start.workingTree)
    expect(last.events).toEqual([{ type: 'BRANCH_CREATED', name: 'feature', at: headCommitId(start) }])
    // Real `git branch <name>` prints nothing.
    expect(output(last)).toBe('')
  })

  it('can point a new branch at another commit', () => {
    const first = headCommitId(committed()) as string
    const { state } = run(diverged(), `git branch old ${first}`)
    expect(state.branches.old).toBe(first)
  })

  it('refuses before the first commit — there is nothing to point at', () => {
    const { last } = run(projectFolder(), 'git init', 'git branch feature')
    expect(last.outcome).toMatchObject({ kind: 'git-error', message: "fatal: not a valid object name: 'main'" })
  })

  it('refuses a name that exists, and a name Git would reject', () => {
    expect(failed(run(committed(), 'git branch main').last)).toBe(true)
    expect(run(committed(), 'git branch feature..x').last.outcome).toMatchObject({
      message: "fatal: 'feature..x' is not a valid branch name",
    })
  })

  it('lists branches with a * on the one HEAD is on', () => {
    const { last } = run(committed(), 'git branch zeta', 'git branch alpha', 'git branch')
    expect(output(last)).toBe('  alpha\n* main\n  zeta')
    expect(types(last)).toEqual(['NOTHING_HAPPENED'])
  })

  it('won’t delete unmerged work without -D, or the branch you are on', () => {
    const state = run(diverged(), 'git switch main').state

    expect(run(state, 'git branch -d feature').last.outcome).toMatchObject({ kind: 'git-error' })
    expect(run(state, 'git branch -d main').last.outcome).toMatchObject({ kind: 'git-error' })

    const { state: after, last } = run(state, 'git branch -D feature')
    expect(after.branches.feature).toBeUndefined()
    expect(types(last)).toEqual(['BRANCH_DELETED'])
    // The commit still exists, but nothing reaches it, so the graph no longer draws it.
    expect(historyGraph(after).nodes.map((node) => node.commit.message)).toEqual(['First'])
  })

  it('deletes a merged branch with -d', () => {
    const { state } = run(committed(), 'git branch done', 'git branch -d done')
    expect(state.branches.done).toBeUndefined()
  })
})

describe('git switch', () => {
  it('-c makes a branch and moves HEAD onto it, without touching a file', () => {
    const start = committed()
    const { state, last } = run(start, 'git switch -c feature')

    expect(currentBranch(state)).toBe('feature')
    expect(state.branches.feature).toBe(headCommitId(start))
    expect(state.workingTree).toEqual(start.workingTree)
    // Same commit: HEAD changed which branch it names, not where it points.
    expect(types(last)).toEqual(['BRANCH_CREATED', 'BRANCH_SWITCHED'])
    expect(last.events[1]).toMatchObject({ paths: [] })
    expect(output(last)).toBe("Switched to a new branch 'feature'")
  })

  it('a commit moves only the branch HEAD is on', () => {
    const base = headCommitId(committed())
    const state = diverged()

    expect(state.branches.main).toBe(base)
    expect(state.branches.feature).not.toBe(base)
    expect(state.commits[state.branches.feature].parents).toEqual([base])
  })

  it('rewrites the files that differ between the two snapshots', () => {
    const { state, last } = run(diverged(), 'git switch main')

    expect(currentBranch(state)).toBe('main')
    expect(state.workingTree['index.html']).toBe('<h1>Hello</h1>\n')
    expect(isClean(state)).toBe(true)
    expect(types(last)).toEqual(['BRANCH_SWITCHED', 'HEAD_MOVED'])
    expect(last.events[0]).toMatchObject({ from: 'feature', to: 'main', paths: ['index.html'] })
  })

  it('carries uncommitted work along when it doesn’t collide', () => {
    // style.css is the same on both branches, so an edit to it follows you.
    const dirty = edit(diverged(), 'style.css', 'body { margin: 1rem; }\n')
    const { state, last } = run(dirty, 'git switch main')

    expect(failed(last)).toBe(false)
    expect(state.workingTree['style.css']).toBe('body { margin: 1rem; }\n')
    expect(unstagedChanges(state)).toEqual([{ path: 'style.css', kind: 'modified' }])
  })

  it('refuses when switching would overwrite uncommitted changes', () => {
    // index.html differs between the branches, and it has local edits.
    const dirty = edit(diverged(), 'index.html', '<h1>Unsaved</h1>\n')
    const { last } = run(dirty, 'git switch main')

    expect(last.outcome).toMatchObject({ kind: 'git-error' })
    expect(last.outcome.kind !== 'ok' && last.outcome.message).toContain('would be overwritten by checkout')
    expect(last.after).toBe(dirty)
    expect(last.events).toEqual([])
  })

  it('refuses when an untracked file is in the way', () => {
    // feature tracks notes.md; main doesn't, and has an untracked one on disk.
    const withNotes = run(edit(diverged(), 'notes.md', 'feature notes\n'), 'git add notes.md', 'git commit -m "Notes"').state
    const onMain = run(withNotes, 'git switch main').state
    const { last } = run(edit(onMain, 'notes.md', 'my own notes\n'), 'git switch feature')

    expect(last.outcome.kind !== 'ok' && last.outcome.message).toContain('untracked working tree files would be overwritten')
  })

  it('says so when you are already there', () => {
    const { last } = run(committed(), 'git switch main')
    expect(output(last)).toBe("Already on 'main'")
    expect(types(last)).toEqual(['NOTHING_HAPPENED'])
  })

  it('won’t stand on a bare commit unless asked with --detach', () => {
    const state = diverged()
    const first = state.branches.main

    const refused = run(state, `git switch ${first}`).last
    expect(refused.outcome.kind !== 'ok' && refused.outcome.message).toContain('a branch is expected')

    const { state: detached, last } = run(state, `git switch --detach ${first}`)
    expect(detached.HEAD).toEqual({ type: 'detached', commit: first })
    expect(types(last)).toEqual(['HEAD_DETACHED', 'HEAD_MOVED'])
  })

  it('points at the -c fix for a branch that doesn’t exist', () => {
    const { last } = run(committed(), 'git switch nope')
    expect(last.outcome).toMatchObject({ kind: 'git-error', message: 'fatal: invalid reference: nope' })
  })

  it('-c before the first commit renames the branch-to-be', () => {
    const { state } = run(projectFolder(), 'git init', 'git switch -c trunk', 'git add .', 'git commit -m "First"')
    expect(Object.keys(state.branches)).toEqual(['trunk'])
  })
})

describe('git checkout', () => {
  it('goes to a branch like switch does', () => {
    const { state } = run(diverged(), 'git checkout main')
    expect(currentBranch(state)).toBe('main')
  })

  it('-b makes a branch and moves onto it', () => {
    const { state, last } = run(committed(), 'git checkout -b fix')
    expect(currentBranch(state)).toBe('fix')
    expect(types(last)).toEqual(['BRANCH_CREATED', 'BRANCH_SWITCHED'])
  })

  it('detaches HEAD at a commit without being asked — and commits there belong to no branch', () => {
    const state = diverged()
    const first = state.branches.main.slice(0, 4)

    const { state: detached, last } = run(state, `git checkout ${first}`)
    expect(detached.HEAD.type).toBe('detached')
    expect(output(last)).toContain("You are in 'detached HEAD' state")

    const { state: experimented } = run(edit(detached, 'index.html', 'experiment\n'), 'git add .', 'git commit -m "Try"')
    expect(experimented.branches).toEqual(state.branches)

    // Leave, and nothing points at the experiment any more.
    const { state: back } = run(experimented, 'git switch main')
    expect(historyGraph(back).nodes.map((node) => node.commit.message)).not.toContain('Try')
  })

  it('treats checkout <file> as the older spelling of restore', () => {
    const dirty = edit(committed(), 'index.html', 'oops\n')
    for (const input of ['git checkout -- index.html', 'git checkout index.html']) {
      const { state, last } = run(dirty, input)
      expect(state.workingTree['index.html']).toBe(committed().workingTree['index.html'])
      expect(types(last)).toEqual(['FILE_RESTORED'])
    }
  })
})
