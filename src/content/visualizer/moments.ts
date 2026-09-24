/**
 * When the Visualizer stops to teach (Sections 25-26; docs/VISUALIZER.md,
 * Aha and Recall).
 *
 * Each rule says what has to *happen* — an `Expectation`, judged by the
 * engine exactly the way scenario steps are — and which existing Aha card
 * and Quiz question belong to that moment. Rules point at content by slug;
 * they never carry prose of their own, so the Visualizer teaches with the
 * same words as Aha and Quiz (Section 41).
 *
 * Order matters: for each change, the first rule that still has something
 * new to show wins. Specific rules therefore come before general ones — a
 * pull that conflicts is about the conflict, and a `git switch -c` is about
 * the branch it created. Two rules may share a card; it still appears once.
 */

import type { Expectation } from '@/services/git-sim'

export interface VisualizerMoment {
  when: Expectation
  /** An `AhaCard` slug, shown the first time this moment happens. */
  aha?: string
  /** A `QuizQuestion` slug, offered as a Quick Recall — selectively (Section 26). */
  recall?: string
}

export const visualizerMoments: VisualizerMoment[] = [
  { when: { event: 'MERGE_CONFLICT' }, aha: 'merge-conflict-is-not-an-error', recall: 'merge-conflict-meaning' },
  { when: { command: 'pull' }, aha: 'pull-is-fetch-plus-merge' },
  { when: { event: 'REMOTE_UPDATED', direction: 'fetch' }, aha: 'pull-is-fetch-plus-merge', recall: 'fetch-does-not-change-files' },
  { when: { event: 'REMOTE_UPDATED', direction: 'push' }, aha: 'nothing-is-shared-until-you-push', recall: 'push-vs-commit' },
  { when: { event: 'REMOTE_ADDED' }, aha: 'git-and-github-are-different' },
  { when: { event: 'COMMIT_CREATED', reverting: true }, aha: 'undoing-rarely-loses-work', recall: 'undo-shared-commit' },
  { when: { event: 'RESET_PERFORMED' }, aha: 'undoing-rarely-loses-work' },
  { when: { event: 'FILE_UNSTAGED' }, recall: 'restore-staged-vs-plain' },
  { when: { event: 'FILE_STAGED' }, aha: 'git-add-does-not-commit', recall: 'where-staged-changes-wait' },
  // The first commit is about what a commit is; the next, about what it stores.
  { when: { event: 'COMMIT_CREATED' }, aha: 'commit-not-save-button' },
  { when: { event: 'COMMIT_CREATED' }, aha: 'commits-are-snapshots-not-diffs' },
  { when: { event: 'BRANCH_CREATED' }, aha: 'branch-is-not-a-copy', recall: 'branch-creation-cost' },
  { when: { event: 'HEAD_DETACHED' }, aha: 'head-is-a-pointer-not-a-place', recall: 'detached-head-quiz' },
  { when: { event: 'BRANCH_SWITCHED' }, aha: 'head-is-a-pointer-not-a-place' },
  { when: { event: 'BRANCH_DELETED' }, aha: 'deleting-a-branch-keeps-its-history' },
  { when: { command: 'init' }, aha: 'git-without-github' },
]
