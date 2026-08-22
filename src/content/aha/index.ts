import type { AhaCard } from '@/content/types'

/** Short, highly visual conceptual explanations (Section 4). Five are named explicitly in the brief. */
export const ahaCards: AhaCard[] = [
  {
    slug: 'commit-not-save-button',
    statement: 'A commit is not a save button.',
    explanation:
      "Saving keeps a file on disk exactly as it is right now — there's only ever one current version. Committing records a whole snapshot of your project, on purpose, that you can always come back to. Every commit is a permanent point in history; a save just overwrites the last one.",
    relatedConcepts: ['commit', 'staging-area'],
  },
  {
    slug: 'git-and-github-are-different',
    statement: 'Git and GitHub are not the same thing.',
    explanation:
      "Git is the version control tool that runs on your machine and tracks history — it needs no internet connection at all. GitHub is a website that hosts Git repositories and adds collaboration features like pull requests on top. You can use Git fully offline, forever, without ever touching GitHub.",
    relatedConcepts: ['git-vs-github'],
  },
  {
    slug: 'git-add-does-not-commit',
    statement: 'git add does not create a commit.',
    explanation:
      'git add only moves changes into the staging area — a waiting room for your next snapshot. Nothing is permanently recorded in your project\'s history until you run git commit. You can stage and unstage as many times as you like before that happens.',
    relatedConcepts: ['staging-area', 'commit'],
  },
  {
    slug: 'git-without-github',
    statement: 'You can use Git without GitHub.',
    explanation:
      'Git tracks history entirely on your own computer. init, add, commit, branch, merge, log — every one of those works with zero network connection and zero account. GitHub only enters the picture the moment you want to back your work up online or collaborate with someone else.',
    relatedConcepts: ['git-vs-github', 'remote'],
  },
  {
    slug: 'branch-is-not-a-copy',
    statement: "A branch is not a copy of your entire project in the way beginners often imagine it.",
    explanation:
      "Creating a branch doesn't duplicate a single file. A branch is just a lightweight, movable pointer to a commit. That's why creating one is instant even in a huge repository — Git isn't copying anything, it's just adding a new bookmark.",
    relatedConcepts: ['branch', 'head'],
  },
  {
    slug: 'deleting-a-branch-keeps-its-history',
    statement: "Deleting a branch doesn't erase its commits right away.",
    explanation:
      "A branch is just a pointer — deleting it removes the bookmark, not the commits it pointed to. If those commits were merged elsewhere, they're still very much part of your history. Even unmerged commits usually stick around for a while and can be found with git reflog.",
    relatedConcepts: ['branch', 'head'],
  },
  {
    slug: 'head-is-a-pointer-not-a-place',
    statement: "HEAD isn't a place — it's a pointer.",
    explanation:
      '"HEAD" sounds like it should mean "the top of the project," but it really just means "wherever you currently are." Most of the time it points at a branch, which points at a commit. Move to a different branch, and HEAD moves with you.',
    relatedConcepts: ['head', 'detached-head'],
  },
  {
    slug: 'undoing-rarely-loses-work',
    statement: 'Undoing in Git rarely means losing work.',
    explanation:
      "Almost every 'undo' command in Git — restore --staged, reset, revert, even stash — is designed to be reversible. Even commits that seem to disappear after a reset usually still exist and can be found again with git reflog. The commands that can genuinely destroy work (--hard, --force, git clean) are the small, clearly-flagged exception, not the rule.",
    relatedConcepts: ['commit'],
  },
]
