import { describe, expect, it } from 'vitest'
import { executeCommand } from './execute'
import { headCommit, headCommitId } from './repo'
import { folderWith } from './seed'
import { teammatePush, writeFile } from './workspace'
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
const output = (transition: Transition) =>
  transition.outcome.kind === 'ok' ? transition.outcome.output.join('\n') : transition.outcome.message
const pushed = (transition: Transition) =>
  transition.events.find((event) => event.type === 'REMOTE_UPDATED') as Extract<GitEvent, { type: 'REMOTE_UPDATED' }>

const URL = 'https://example.com/you/project.git'

/** One commit on main, and a remote called origin that has nothing yet. */
function connected(): RepoState {
  return run(
    folderWith({ 'index.html': 'Hello\n' }),
    'git init',
    'git add .',
    'git commit -m "Start"',
    `git remote add origin ${URL}`,
  ).state
}

/** connected(), pushed with -u, so main tracks origin/main. */
function published(): RepoState {
  return run(connected(), 'git push -u origin main').state
}

describe('git remote', () => {
  it('names a remote without sending anything', () => {
    const { state, last } = run(connected(), 'git remote -v')
    expect(state.remote).toMatchObject({ name: 'origin', url: URL, branches: {}, commits: {} })
    expect(output(last)).toBe(`origin\t${URL} (fetch)\norigin\t${URL} (push)`)
  })

  it('refuses push, fetch and pull with no remote', () => {
    const local = run(folderWith({ 'a.txt': 'a\n' }), 'git init', 'git add .', 'git commit -m "A"').state
    for (const input of ['git push', 'git fetch', 'git pull']) {
      expect(output(run(local, input).last)).toContain("'origin' does not appear to be a git repository")
    }
  })
})

describe('git push', () => {
  it('asks for -u the first time, with Git’s own suggestion', () => {
    expect(output(run(connected(), 'git push').last)).toContain('git push --set-upstream origin main')
  })

  it('sends the commits the remote lacks and records where it put them', () => {
    const start = connected()
    const { state, last } = run(start, 'git push -u origin main')

    expect(state.remote?.branches.main).toBe(headCommitId(start))
    expect(Object.keys(state.remote?.commits ?? {})).toEqual([headCommitId(start)])
    expect(state.remoteBranches['origin/main']).toBe(headCommitId(start))
    expect(state.upstreams.main).toBe('origin/main')
    expect(output(last)).toContain(' * [new branch]      main -> main')
    expect(pushed(last)).toMatchObject({ direction: 'push', branch: 'main', from: null, commits: [headCommitId(start)] })
  })

  it('tracks ahead and behind in git status', () => {
    const state = published()
    expect(output(run(state, 'git status').last)).toContain("Your branch is up to date with 'origin/main'.")

    const ahead = run(edit(state, 'index.html', 'Hi\n'), 'git add .', 'git commit -m "Hi"').state
    expect(output(run(ahead, 'git status').last)).toContain("Your branch is ahead of 'origin/main' by 1 commit.")

    const { state: after, last } = run(ahead, 'git push')
    expect(pushed(last).commits).toEqual([headCommitId(ahead)])
    expect(after.remote?.branches.main).toBe(headCommitId(ahead))
  })

  it('says so when there is nothing to send', () => {
    expect(output(run(published(), 'git push').last)).toBe('Everything up-to-date')
  })

  it('refuses to overwrite work the remote has that you don’t', () => {
    const state = teammatePush(published()).state
    const { last } = run(edit(state, 'index.html', 'Mine\n'), 'git add .', 'git commit -m "Mine"', 'git push')
    expect(output(last)).toContain('! [rejected]        main -> main (fetch first)')
    expect(last.after).toBe(last.before)
  })
})

describe('someone else pushing', () => {
  it('changes only the remote — not origin/main, not your branch', () => {
    const before = published()
    const { state, events } = teammatePush(before)
    expect(state.remote?.branches.main).not.toBe(before.remote?.branches.main)
    expect(state.remoteBranches).toEqual(before.remoteBranches)
    expect(state.branches).toEqual(before.branches)
    expect(events[0]).toMatchObject({ type: 'REMOTE_UPDATED', direction: 'elsewhere' })
  })
})

describe('git fetch', () => {
  it('brings commits and moves origin/main, without touching your branch or files', () => {
    const before = teammatePush(published()).state
    const { state, last } = run(before, 'git fetch')

    expect(state.remoteBranches['origin/main']).toBe(before.remote?.branches.main)
    expect(state.branches.main).toBe(before.branches.main)
    expect(state.workingTree).toEqual(before.workingTree)
    expect(pushed(last)).toMatchObject({ direction: 'fetch', branch: 'main', commits: [before.remote?.branches.main] })
    expect(output(run(state, 'git status').last)).toContain('behind \'origin/main\' by 1 commit, and can be fast-forwarded')
  })

  it('says so when there is nothing new', () => {
    expect(run(published(), 'git fetch').last.events.map((event) => event.type)).toEqual(['NOTHING_HAPPENED'])
  })
})

describe('git pull', () => {
  it('is fetch then merge — here, a fast-forward', () => {
    const before = teammatePush(published()).state
    const { state, last } = run(before, 'git pull')

    expect(headCommitId(state)).toBe(before.remote?.branches.main)
    expect(state.workingTree['NOTES.md']).toBe('Note 1 from a teammate\n')
    expect(last.events.map((event) => event.type)).toEqual(['REMOTE_UPDATED', 'FAST_FORWARD', 'HEAD_MOVED'])
  })

  it('makes a merge commit when both sides moved, and then push works', () => {
    const shared = teammatePush(published()).state
    const mine = run(edit(shared, 'index.html', 'Mine\n'), 'git add .', 'git commit -m "Mine"').state
    const { state } = run(mine, 'git pull')

    expect(headCommit(state)?.parents).toEqual([headCommitId(mine), shared.remote?.branches.main])
    expect(run(state, 'git push').last.outcome.kind).toBe('ok')
  })

  it('needs to know which branch to merge', () => {
    expect(output(run(connected(), 'git pull').last)).toContain('There is no tracking information for the current branch.')
  })
})
