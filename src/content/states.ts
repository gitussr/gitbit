/**
 * The Git state model (Section 3) — the mental model the rest of GitBit
 * hangs off: content lives in a handful of places, and every command is
 * really a way of moving it between them.
 *
 * The four canonical states form one line (Working Directory → Staging Area
 * → Local Repository → Remote Repository). `stash` and `discarded` sit off
 * that line: they're real destinations, but drawing them inline would imply
 * they're a normal step in the flow.
 *
 * Transitions live here rather than on each GitCommand so the whole model —
 * the states and the moves between them — stays one body of knowledge that
 * Quick, Learn, and the Design System all read from.
 */

export type GitStateId =
  | 'working-directory'
  | 'staging-area'
  | 'local-repository'
  | 'remote-repository'
  | 'stash'
  | 'discarded'

export interface GitStateDefinition {
  id: GitStateId
  label: string
  plainEnglish: string
  mentalModel: string
  /** Position on the canonical flow. Absent for the states that sit off it. */
  flowOrder?: number
}

export const gitStates: GitStateDefinition[] = [
  {
    id: 'working-directory',
    label: 'Working Directory',
    plainEnglish: 'The files on your computer right now.',
    mentalModel: 'Your desk — whatever you are working on sits here.',
    flowOrder: 0,
  },
  {
    id: 'staging-area',
    label: 'Staging Area',
    plainEnglish: 'The changes you have picked for your next commit.',
    mentalModel: 'A box you load up before sealing it.',
    flowOrder: 1,
  },
  {
    id: 'local-repository',
    label: 'Local Repository',
    plainEnglish: 'Every commit you have made, stored on your machine.',
    mentalModel: "Your project's memory — private until you push it.",
    flowOrder: 2,
  },
  {
    id: 'remote-repository',
    label: 'Remote Repository',
    plainEnglish: 'The shared copy everyone else can see, usually on GitHub.',
    mentalModel: 'The shelf the whole team works from.',
    flowOrder: 3,
  },
  {
    id: 'stash',
    label: 'Stash',
    plainEnglish: 'A side drawer for changes you want out of the way for a moment.',
    mentalModel: 'A drawer — easy to put things in, easy to forget they are there.',
  },
  {
    id: 'discarded',
    label: 'Gone',
    plainEnglish: 'Not a place. The change stops existing anywhere Git can reach.',
    mentalModel: 'The bin, with no undo.',
  },
]

/** The command that carries your work along each step of the canonical flow. */
export const flowCommands: { from: GitStateId; to: GitStateId; command: string }[] = [
  { from: 'working-directory', to: 'staging-area', command: 'git add' },
  { from: 'staging-area', to: 'local-repository', command: 'git commit' },
  { from: 'local-repository', to: 'remote-repository', command: 'git push' },
]

export interface GitStateTransition {
  from: GitStateId
  to: GitStateId
  /** What actually moves — the difference between "adds files" and "chooses changes for your next snapshot" (Section 3). */
  summary: string
}

/**
 * What each command moves, keyed by command slug. Commands that only read
 * (git status, git log, git diff, git reflog, git bisect) or only change
 * configuration (git init, git remote add, git branch, git tag) are absent:
 * that they move nothing is worth showing as an absence rather than as a
 * made-up arrow.
 */
export const commandStateTransitions: Record<string, GitStateTransition> = {
  'git-add': {
    from: 'working-directory',
    to: 'staging-area',
    summary: 'Copies the file as it looks right now into the staging area. The file on your disk is not changed.',
  },
  'git-commit': {
    from: 'staging-area',
    to: 'local-repository',
    summary: 'Records everything staged as a new commit, then empties the staging area. Your files stay exactly as they are.',
  },
  'git-clone': {
    from: 'remote-repository',
    to: 'working-directory',
    summary: 'Downloads the entire repository and checks its latest commit out onto your disk.',
  },
  'git-push': {
    from: 'local-repository',
    to: 'remote-repository',
    summary: 'Sends commits that so far exist only on your machine up to the shared copy.',
  },
  'git-pull': {
    from: 'remote-repository',
    to: 'working-directory',
    summary: 'Fetches new commits and merges them straight in, so the files on your disk end up matching.',
  },
  'git-fetch': {
    from: 'remote-repository',
    to: 'local-repository',
    summary: 'Downloads new commits into your local repository and stops there. Your files on disk are untouched.',
  },
  'git-switch': {
    from: 'local-repository',
    to: 'working-directory',
    summary: 'Replaces the files on your disk with the ones recorded on the branch you are switching to.',
  },
  'git-merge': {
    from: 'local-repository',
    to: 'working-directory',
    summary: "Combines another branch's commits into yours and updates the files on disk to match the result.",
  },
  'git-rebase': {
    from: 'local-repository',
    to: 'local-repository',
    summary: "Replaces your branch's commits with new ones built on a different base — all of it inside your local repository.",
  },
  'git-rebase-interactive': {
    from: 'local-repository',
    to: 'local-repository',
    summary: 'Rewrites a stretch of your own commits — reordering, squashing, or reworking them into new ones.',
  },
  'git-cherry-pick': {
    from: 'local-repository',
    to: 'local-repository',
    summary: 'Copies one commit from another branch onto yours as a brand-new commit.',
  },
  'git-revert': {
    from: 'local-repository',
    to: 'local-repository',
    summary: 'Adds a new commit applying the opposite of an old one. Nothing already recorded is removed.',
  },
  'git-restore': {
    from: 'local-repository',
    to: 'working-directory',
    summary: 'Overwrites the file on your disk with its last committed version. The edits you had are not kept anywhere.',
  },
  'git-reset': {
    from: 'local-repository',
    to: 'working-directory',
    summary: 'The commits stop being part of your branch, and their changes are left on disk as uncommitted work.',
  },
  'git-reset-hard': {
    from: 'working-directory',
    to: 'discarded',
    summary: 'Rewinds the branch and overwrites your files to match it. Uncommitted work is not moved anywhere — it is destroyed.',
  },
  'git-clean': {
    from: 'working-directory',
    to: 'discarded',
    summary: 'Deletes untracked files. Git never recorded them, so there is no copy to recover them from.',
  },
  'git-stash': {
    from: 'working-directory',
    to: 'stash',
    summary: 'Moves your uncommitted changes onto the stash stack and leaves you with a clean working directory.',
  },
  'git-push-force': {
    from: 'local-repository',
    to: 'remote-repository',
    summary: "Replaces the remote branch's history with yours. Commits that were only on the remote become unreachable.",
  },
  'git-worktree': {
    from: 'local-repository',
    to: 'working-directory',
    summary: 'Checks a second branch out into its own folder, so two branches sit on disk at the same time.',
  },
}

/** Concepts that *are* one of the states — their Learn page shows the model with that state lit up. */
export const conceptStates: Record<string, GitStateId> = {
  'working-directory': 'working-directory',
  'working-tree': 'working-directory',
  'staging-area': 'staging-area',
  repository: 'local-repository',
  'dot-git-folder': 'local-repository',
  remote: 'remote-repository',
  origin: 'remote-repository',
}
