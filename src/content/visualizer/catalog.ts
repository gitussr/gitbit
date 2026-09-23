/**
 * The scenarios' names and starting points — just enough for the
 * Visualizer to route to one and build its first state.
 *
 * Split from `scenarios.ts` so the step-by-step text (the bulk of it)
 * loads with the scenario rail rather than with the Visualizer itself.
 */

import type { SeedName } from '@/services/git-sim'

export interface ScenarioSummary {
  slug: string
  title: string
  /** One line: what you'll understand by the end. */
  goal: string
  seed: SeedName
}

export const scenarioCatalog: ScenarioSummary[] = [
  {
    slug: 'first-commit',
    title: 'Your first commit',
    goal: 'Turn a folder into a repository and record your first snapshot.',
    seed: 'project-folder',
  },
  {
    slug: 'push-to-a-remote',
    title: 'Push to a remote',
    goal: 'Send your commits to another repository — and see that it’s a separate place.',
    seed: 'one-commit',
  },
  {
    slug: 'branch',
    title: 'Make a branch',
    goal: 'See that a branch is a label pointing at a commit — not a copy of your project.',
    seed: 'one-commit',
  },
  {
    slug: 'merge',
    title: 'Merge',
    goal: 'Bring two lines of work together — and see that not every merge makes a commit.',
    seed: 'ready-to-merge',
  },
  {
    slug: 'undo',
    title: 'Undo things',
    goal: 'Three different undos — and which one to reach for.',
    seed: 'one-commit',
  },
]

export function getScenarioSummary(slug: string): ScenarioSummary | undefined {
  return scenarioCatalog.find((summary) => summary.slug === slug)
}
