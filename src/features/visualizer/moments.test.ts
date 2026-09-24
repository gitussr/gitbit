import { describe, expect, it } from 'vitest'
import { visualizerMoments } from '@/content/visualizer/moments'
import { getAhaBySlug, getQuizBySlug } from '@/services/content'
import { executeCommand, seeds, writeFile, type RepoState, type Transition } from '@/services/git-sim'
import { momentsFor } from './moments'

/** Runs commands (and `edit`s) in order, returning every transition — the page's history, minus the page. */
function play(steps: string[], state: RepoState = seeds['project-folder']()): Transition[] {
  const history: Transition[] = []
  let edits = 0
  for (const step of steps) {
    const transition: Transition =
      step === 'edit'
        ? (() => {
            const result = writeFile(state, 'index.html', `<h1>Edit ${(edits += 1)}</h1>\n`)
            return { input: 'edited index.html', before: state, after: result.state, events: result.events, outcome: { kind: 'ok', output: [] } }
          })()
        : executeCommand(state, step)
    history.push(transition)
    state = transition.after
  }
  return history
}

describe('visualizer moments', () => {
  it('only point at Aha cards and Quiz questions that exist', () => {
    for (const rule of visualizerMoments) {
      if (rule.aha) expect(getAhaBySlug(rule.aha), rule.aha).toBeDefined()
      if (rule.recall) expect(getQuizBySlug(rule.recall), rule.recall).toBeDefined()
      expect(rule.aha ?? rule.recall, 'a rule must teach something').toBeDefined()
    }
  })

  it('shows each Aha the first time only', () => {
    const picks = momentsFor(play(['git init', 'git add .', 'git commit -m "One"', 'edit', 'git add .', 'git commit -m "Two"', 'edit', 'git add .', 'git commit -m "Three"']))
    expect(picks.map((pick) => pick?.aha ?? null)).toEqual([
      'git-without-github',
      'git-add-does-not-commit',
      'commit-not-save-button',
      null,
      null,
      // The second commit gets the next thing worth knowing about commits.
      'commits-are-snapshots-not-diffs',
      null,
      null,
      null,
    ])
  })

  it('asks the Section 26 question after the first git add', () => {
    const picks = momentsFor(play(['git init', 'git add index.html']))
    expect(picks[1]).toEqual({ aha: 'git-add-does-not-commit', recall: 'where-staged-changes-wait' })
  })

  it('never asks twice in a row, and keeps a skipped question for later', () => {
    const history = play(
      ['git branch feature', 'git switch --detach main', 'git status', 'git switch main', 'git switch --detach feature'],
      seeds['one-commit'](),
    )
    expect(history.every((transition) => transition.outcome.kind === 'ok')).toBe(true)

    const picks = momentsFor(history)
    expect(picks[0]).toEqual({ aha: 'branch-is-not-a-copy', recall: 'branch-creation-cost' })
    // Detaching straight after a Recall: the Aha still shows, the question waits…
    expect(picks[1]).toEqual({ aha: 'head-is-a-pointer-not-a-place', recall: undefined })
    // …and is asked the next time HEAD detaches, once something else came between.
    expect(picks[4]).toEqual({ aha: undefined, recall: 'detached-head-quiz' })
  })

  it('prefers the specific moment: switch -c is about the branch it made', () => {
    const picks = momentsFor(play(['git switch -c feature'], seeds['one-commit']()))
    expect(picks[0]?.aha).toBe('branch-is-not-a-copy')
  })

  it('gives a refused command no moment', () => {
    const picks = momentsFor(play(['git commit -m "Nothing staged"']))
    expect(picks[0]).toBeNull()
  })
})
