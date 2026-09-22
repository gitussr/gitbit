/**
 * Starting states (Section 28 — nobody should face an empty screen).
 *
 * A seed is a plain function so every scenario gets its own fresh state
 * and no two runs can share a mutated object.
 */

import type { RepoState, Tree } from './types'

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
    hasRemote: false,
    remoteBranches: {},
    stash: [],
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

export const seeds = {
  empty: emptyState,
  'project-folder': projectFolder,
} as const

export type SeedName = keyof typeof seeds
