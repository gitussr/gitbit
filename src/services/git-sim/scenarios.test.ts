import { describe, expect, it } from 'vitest'
import { scenarios, type ScenarioAction } from '@/content/visualizer/scenarios'
import { executeCommand } from './execute'
import { meets, progress } from './progress'
import { seeds } from './seed'
import { teammatePush, writeFile } from './workspace'
import type { Transition } from './result'
import type { RepoState } from './types'

/**
 * Plays every guided scenario end to end, doing exactly what each step's
 * `try` offers. If a step asks for something the simulator can't do — or
 * its `try` doesn't actually meet its own `expect` — this fails, not a
 * learner halfway through a lesson.
 */

let edits = 0

function act(state: RepoState, action: ScenarioAction): Transition {
  if ('run' in action) return executeCommand(state, action.run)

  const result =
    'edit' in action
      ? // Each edit writes something new, the way the page's edit control does.
        writeFile(state, action.edit, `<h1>Edit ${(edits += 1)}</h1>\n`)
      : teammatePush(state)
  return { input: 'sandbox', before: state, after: result.state, events: result.events, outcome: { kind: 'ok', output: [] } }
}

describe('guided scenarios', () => {
  for (const scenario of scenarios) {
    it(`${scenario.slug} can be completed by following its own steps`, () => {
      let state = seeds[scenario.seed]()
      const history: Transition[] = []

      scenario.steps.forEach((step, index) => {
        const transition = act(state, step.try)
        expect(meets(transition, step.expect), `step ${index + 1}: ${step.instruction}`).toBe(true)
        history.push(transition)
        state = transition.after
      })

      expect(progress(history, scenario.steps.map((step) => step.expect))).toBe(scenario.steps.length)
    })
  }

  it('have unique slugs', () => {
    expect(new Set(scenarios.map((scenario) => scenario.slug)).size).toBe(scenarios.length)
  })
})

describe('progress', () => {
  const steps = scenarios[0].steps.map((step) => step.expect)

  it('counts steps in order, so doing a later one early doesn’t count yet', () => {
    const start = seeds['project-folder']()
    const status = executeCommand(start, 'git status') // refused: not a repository yet
    const init = executeCommand(start, 'git init')
    expect(progress([status, init], steps)).toBe(1)
  })

  it('doesn’t count a refused command', () => {
    expect(meets(executeCommand(seeds['project-folder'](), 'git status'), { command: 'status' })).toBe(false)
  })
})
