import type { Comparison } from '@/content/types'

/** The commonly-confused command pairs named explicitly in Section 30. */
export const comparisons: Comparison[] = [
  {
    slug: 'clone-vs-pull',
    title: 'git clone vs. git pull',
    left: { command: 'git clone', plainEnglish: "I don't have the project yet." },
    right: { command: 'git pull', plainEnglish: 'I already have it — bring me the latest changes.' },
    explanation:
      'git clone is a one-time download of a whole repository, used exactly once to get started. git pull is what you run afterward, whenever you want your existing local copy to catch up with new commits on the remote.',
  },
  {
    slug: 'fetch-vs-pull',
    title: 'git fetch vs. git pull',
    left: { command: 'git fetch', plainEnglish: "Show me what's new — but don't touch my files." },
    right: { command: 'git pull', plainEnglish: "Show me what's new, and merge it into my work right now." },
    explanation:
      'git fetch downloads new commits and updates your knowledge of the remote branches, but leaves your current branch untouched — safe to run any time, purely informational. git pull does a fetch and then immediately merges the result into your current branch, which can trigger a merge conflict. In fact, git pull is really just git fetch followed by git merge.',
  },
  {
    slug: 'reset-vs-revert',
    title: 'git reset vs. git revert',
    left: { command: 'git reset', plainEnglish: 'Rewrite history to say this commit never happened.' },
    right: { command: 'git revert', plainEnglish: 'Add a new commit that cancels this one out.' },
    explanation:
      "git reset moves your branch backward and can discard commits and (with --hard) file changes — it changes history, which is risky on anything already shared. git revert leaves history intact and adds a new commit that undoes the old one — safe to use even on a branch others have already pulled.",
  },
  {
    slug: 'merge-vs-rebase',
    title: 'git merge vs. git rebase',
    left: { command: 'git merge', plainEnglish: 'Combine two branches, keeping both histories exactly as they happened.' },
    right: { command: 'git rebase', plainEnglish: "Replay my branch's commits on top of another, as if they happened after it." },
    explanation:
      'git merge creates a new commit that joins two branch histories together — nothing about either branch\'s existing commits changes. git rebase rewrites your branch\'s commits with new ones on top of a different base, producing a cleaner, linear history — but because it rewrites commits, it should be avoided on branches other people are already using.',
  },
  {
    slug: 'restore-vs-reset',
    title: 'git restore vs. git reset',
    left: { command: 'git restore', plainEnglish: 'Fix the files on my desk right now.' },
    right: { command: 'git reset', plainEnglish: 'Move which checkpoint my branch is standing on.' },
    explanation:
      "git restore operates on files — it discards working-directory or staged changes to bring specific files back to a previous version. git reset operates on your branch's position in history — it moves which commit the branch points to, and only optionally touches your working files too (with --hard). For undoing changes to one file, restore is usually what you want; for moving the whole branch back, reset is.",
  },
]
