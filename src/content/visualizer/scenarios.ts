/**
 * The Visualizer's guided scenarios (Section 28).
 *
 * Plain data, like every content folder. Each step says what to do in
 * words, how to know it happened (`expect`, judged by the engine on what
 * moved — not on exact spelling), what to try (`try`, offered as a
 * one-click chip), and a hint for when someone's stuck.
 *
 * Guided, not gated: a command that isn't the current step still runs, and
 * the rail says "that works too; the next step is still …". A sandbox that
 * blocks exploration would be teaching the wrong lesson.
 *
 * Every scenario is played end to end in `services/git-sim/scenarios.test.ts`,
 * by running each step's `try` — so a step can't ask for something the
 * simulator can't do.
 */

import type { Expectation } from '@/services/git-sim'
import { getScenarioSummary, type ScenarioSummary } from './catalog'

/** Either a command to run, or a file to edit with the sandbox's edit control. */
export type ScenarioAction = { run: string } | { edit: string } | { teammate: true }

export interface ScenarioStep {
  instruction: string
  expect: Expectation
  try: ScenarioAction
  hint: string
}

export interface VisualizerScenario extends ScenarioSummary {
  steps: ScenarioStep[]
  completion: { title: string; body: string }
}

/** A scenario's name, goal and seed, from the catalog the Visualizer loads up front. */
function summary(slug: string): ScenarioSummary {
  const found = getScenarioSummary(slug)
  if (!found) throw new Error(`No catalog entry for scenario "${slug}"`)
  return found
}

export const scenarios: VisualizerScenario[] = [
  {
    ...summary('first-commit'),
    steps: [
      {
        instruction: 'This folder has files in it, but Git isn’t watching it yet. Make it a repository.',
        expect: { command: 'init' },
        try: { run: 'git init' },
        hint: '`git init` creates the repository. Notice that it records nothing — the files are all still untracked.',
      },
      {
        instruction: 'Change a file, the way you would in an editor.',
        expect: { event: 'FILE_MODIFIED' },
        try: { edit: 'index.html' },
        hint: 'Use “Edit index.html”. Editing happens in the Working Directory — Git hasn’t been told anything yet.',
      },
      {
        instruction: 'Ask Git what it sees.',
        expect: { command: 'status' },
        try: { run: 'git status' },
        hint: '`git status` only looks. It lists what’s staged, what’s changed, and what Git isn’t tracking.',
      },
      {
        instruction: 'Choose what goes into your first commit.',
        expect: { event: 'FILE_STAGED' },
        try: { run: 'git add .' },
        hint: '`git add` copies files into the Staging Area. `.` means everything here; you can also name one file.',
      },
      {
        instruction: 'Record the snapshot.',
        expect: { event: 'COMMIT_CREATED' },
        try: { run: 'git commit -m "Add the homepage"' },
        hint: '`git commit -m "…"` saves what’s staged as a commit. Watch the Staging Area empty — because it now matches the commit.',
      },
    ],
    completion: {
      title: 'That’s a commit.',
      body: 'A snapshot of everything you staged, with a name Git gave it. The Staging Area looks empty now not because it was cleared, but because it matches your last commit exactly.',
    },
  },
  {
    ...summary('push-to-a-remote'),
    steps: [
      {
        instruction: 'Your repository only exists on your machine. Connect a remote.',
        expect: { event: 'REMOTE_ADDED' },
        try: { run: 'git remote add origin https://example.com/you/project.git' },
        hint: '`git remote add` names an address. Nothing is sent yet — watch the Remote panel appear, empty.',
      },
      {
        instruction: 'Send your commit there, and remember where it went.',
        expect: { event: 'REMOTE_UPDATED', direction: 'push' },
        try: { run: 'git push -u origin main' },
        hint: '`-u` links your `main` to the remote’s, so later a plain `git push` knows where to go.',
      },
      {
        instruction: 'Make another change.',
        expect: { event: 'FILE_MODIFIED' },
        try: { edit: 'index.html' },
        hint: 'Use “Edit index.html”.',
      },
      {
        instruction: 'Commit it.',
        expect: { event: 'COMMIT_CREATED' },
        try: { run: 'git commit -am "Update the homepage"' },
        hint: '`-a` stages every change to a file Git already tracks, then commits. The new commit exists only on your machine.',
      },
      {
        instruction: 'Check how far ahead you are.',
        expect: { command: 'status' },
        try: { run: 'git status' },
        hint: '`git status` compares your branch with `origin/main` — your record of where the remote was.',
      },
      {
        instruction: 'Push again.',
        expect: { event: 'REMOTE_UPDATED', direction: 'push' },
        try: { run: 'git push' },
        hint: 'Plain `git push` works now. Only the commit the remote didn’t have crosses over.',
      },
      {
        instruction: 'Meanwhile, a teammate pushes to the same remote.',
        expect: { event: 'REMOTE_UPDATED', direction: 'elsewhere' },
        try: { teammate: true },
        hint: 'Use “Teammate pushes”. Watch the Remote panel change — and notice that nothing on your side does. Your `origin/main` still says where the remote was.',
      },
      {
        instruction: 'Find out what changed, without touching your work.',
        expect: { event: 'REMOTE_UPDATED', direction: 'fetch' },
        try: { run: 'git fetch' },
        hint: '`git fetch` brings their commit over and moves `origin/main`. Your `main` and your files stay exactly as they were.',
      },
      {
        instruction: 'Bring it into your branch.',
        expect: { command: 'pull' },
        try: { run: 'git pull' },
        hint: '`git pull` is `git fetch` then `git merge`. Here the merge is a fast-forward: you had nothing they didn’t.',
      },
    ],
    completion: {
      title: 'Your work is in two places.',
      body: 'The remote is another repository with its own copy of your commits — not a backup that updates itself. Nothing crosses between them unless you push, fetch or pull. GitHub is one place a remote can live; the idea is the same anywhere.',
    },
  },
  {
    ...summary('branch'),
    steps: [
      {
        instruction: 'Start a new line of work, and move onto it.',
        expect: { event: 'BRANCH_CREATED' },
        try: { run: 'git switch -c feature' },
        hint: '`git switch -c` makes a branch and moves HEAD onto it. Nothing was copied — a new label appeared on the same commit.',
      },
      {
        instruction: 'Change a file.',
        expect: { event: 'FILE_MODIFIED' },
        try: { edit: 'index.html' },
        hint: 'Use “Edit index.html”.',
      },
      {
        instruction: 'Stage it.',
        expect: { event: 'FILE_STAGED' },
        try: { run: 'git add index.html' },
        hint: '`git add index.html`.',
      },
      {
        instruction: 'Commit it on this branch.',
        expect: { event: 'COMMIT_CREATED' },
        try: { run: 'git commit -m "Try a new title"' },
        hint: 'Watch which label moves: only `feature`. `main` stays where it was.',
      },
      {
        instruction: 'Go back to main.',
        expect: { event: 'BRANCH_SWITCHED' },
        try: { run: 'git switch main' },
        hint: '`git switch main`. HEAD moves, and index.html goes back to main’s version — your change is safe on `feature`.',
      },
    ],
    completion: {
      title: 'Two lines of work, one repository.',
      body: 'A branch is a movable name for a commit. Committing moves the branch HEAD is on — and only that one. Switching rewrites your files to match whichever snapshot you move to.',
    },
  },
  {
    ...summary('merge'),
    steps: [
      {
        instruction: '`hotfix` is one commit ahead of main, and main has nothing new. Merge it.',
        expect: { event: 'FAST_FORWARD' },
        try: { run: 'git merge hotfix' },
        hint: 'Main has nothing hotfix lacks, so Git just slides main forward. A fast-forward: no new commit at all.',
      },
      {
        instruction: '`feature` went a different way. Merge that too.',
        expect: { event: 'MERGE_CREATED' },
        try: { run: 'git merge feature' },
        hint: 'Now both sides have work the other lacks. Git combines them and records a commit with two parents — the ◆ in the graph.',
      },
      {
        instruction: 'Look at the history.',
        expect: { command: 'log' },
        try: { run: 'git log --oneline' },
        hint: '`git log --oneline` walks back from HEAD — through both parents of the merge.',
      },
    ],
    completion: {
      title: 'Histories combined.',
      body: 'The first merge made no commit: main simply caught up. The second needed one, because both lines had moved. Same command, two outcomes — which one you get depends on the history, not on the command.',
    },
  },
  {
    ...summary('undo'),
    steps: [
      {
        instruction: 'Change a file.',
        expect: { event: 'FILE_MODIFIED' },
        try: { edit: 'index.html' },
        hint: 'Use “Edit index.html”.',
      },
      {
        instruction: 'Throw that change away.',
        expect: { event: 'FILE_RESTORED' },
        try: { run: 'git restore index.html' },
        hint: '`git restore` puts the file back to the last staged version. The edit is gone for good — it was never saved anywhere.',
      },
      {
        instruction: 'Change it again.',
        expect: { event: 'FILE_MODIFIED' },
        try: { edit: 'index.html' },
        hint: 'Use “Edit index.html”.',
      },
      {
        instruction: 'This time, stage it.',
        expect: { event: 'FILE_STAGED' },
        try: { run: 'git add index.html' },
        hint: '`git add index.html`.',
      },
      {
        instruction: 'Changed your mind — unstage it, but keep the change.',
        expect: { event: 'FILE_UNSTAGED' },
        try: { run: 'git restore --staged index.html' },
        hint: '`--staged` only touches the Staging Area. The file on disk keeps your edit: nothing is lost.',
      },
      {
        instruction: 'Stage it and commit it after all.',
        expect: { event: 'COMMIT_CREATED' },
        try: { run: 'git commit -am "Change the title"' },
        hint: '`git commit -a` stages the change to index.html and commits it in one go.',
      },
      {
        instruction: 'Undo that commit the safe way — by adding one.',
        expect: { event: 'COMMIT_CREATED', reverting: true },
        try: { run: 'git revert HEAD' },
        hint: '`git revert HEAD` adds a commit that does the opposite. History only grows, so it’s safe on work others have.',
      },
      {
        instruction: 'Now take the last commit back out of history, keeping its work staged.',
        expect: { event: 'RESET_PERFORMED' },
        try: { run: 'git reset --soft HEAD~1' },
        hint: '`git reset --soft HEAD~1` moves main back one commit. Watch which layers change — only HEAD.',
      },
    ],
    completion: {
      title: 'Three undos, three layers.',
      body: '`restore` puts files back. `revert` undoes a commit by adding one — safe on shared history. `reset` moves the branch itself, and its mode decides how far down the layers it reaches.',
    },
  },
]

export function getScenario(slug: string): VisualizerScenario | undefined {
  return scenarios.find((scenario) => scenario.slug === slug)
}
