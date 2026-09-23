/**
 * Starting states (Section 28 — nobody should face an empty screen).
 *
 * A seed is a plain function so every scenario gets its own fresh state
 * and no two runs can share a mutated object.
 */

import { executeCommand } from './execute'
import type { RepoState, Tree } from './types'
import { writeFile } from './workspace'

const DEFAULT_BRANCH = 'main'

/** Nothing on disk, no repository. The honest zero. */
export function emptyState(): RepoState {
  return {
    initialized: false,
    workingTree: {},
    index: {},
    commits: {},
    branches: {},
    HEAD: { type: 'branch', branch: DEFAULT_BRANCH },
    remote: null,
    remoteBranches: {},
    upstreams: {},
    stash: [],
    merging: null,
    commitCounter: 0,
    defaultBranch: DEFAULT_BRANCH,
  }
}

/**
 * A folder with work already in it, and no repository yet.
 *
 * This is the free-play seed and the one Scenario 1 starts from. Starting
 * *before* `git init` is deliberate: it puts the first Aha — that a folder
 * of files is not a repository until you make it one — in the first ten
 * seconds.
 */
export function projectFolder(): RepoState {
  return {
    ...emptyState(),
    workingTree: {
      'index.html': '<h1>Hello</h1>\n',
      'style.css': 'body {\n  margin: 0;\n}\n',
    },
  }
}

/** A state with files already on disk, for scenarios that begin further along. */
export function folderWith(files: Tree): RepoState {
  return { ...emptyState(), workingTree: { ...files } }
}

/** Run commands from a starting state — how the richer seeds are built, so they can't contain a state the engine couldn't reach. */
function after(start: RepoState, ...steps: (string | [path: string, content: string])[]): RepoState {
  return steps.reduce(
    (state, step) => (typeof step === 'string' ? executeCommand(state, step).after : writeFile(state, step[0], step[1]).state),
    start,
  )
}

/** The project folder as a repository with one commit, everything clean. */
export function oneCommit(): RepoState {
  return after(projectFolder(), 'git init', 'git add .', 'git commit -m "Add the homepage"')
}

/**
 * Two branches waiting to be merged into main, chosen to show both of
 * Section 16's outcomes in a row: `hotfix` is only *ahead* of main, so it
 * fast-forwards; `feature` has diverged, so it needs a merge commit. They
 * change different files, so neither conflicts.
 */
export function readyToMerge(): RepoState {
  return after(
    oneCommit(),
    'git switch -c feature',
    ['index.html', '<h1>Hello</h1>\n<p>Welcome to the project.</p>\n'],
    'git add index.html',
    'git commit -m "Add a welcome line"',
    'git switch main',
    'git switch -c hotfix',
    ['style.css', 'body {\n  margin: 1rem;\n}\n'],
    'git add style.css',
    'git commit -m "Fix the margin"',
    'git switch main',
  )
}

export const seeds = {
  empty: emptyState,
  'project-folder': projectFolder,
  'one-commit': oneCommit,
  'ready-to-merge': readyToMerge,
} as const

export type SeedName = keyof typeof seeds
