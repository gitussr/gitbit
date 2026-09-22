import type { AhaCard } from '@/content/types'

/** Short, highly visual conceptual explanations (Section 4). Five are named explicitly in the brief. */
export const ahaCards: AhaCard[] = [
  {
    slug: 'commit-not-save-button',
    statement: 'A commit is not a save button.',
    explanation:
      "Saving keeps a file on disk exactly as it is right now — there's only ever one current version. Committing records a whole snapshot of your project, on purpose, that you can always come back to. Every commit is a permanent point in history; a save just overwrites the last one.",
    relatedConcepts: ['commit', 'staging-area'],
    visual: {
      kind: 'state-flow',
      activeStates: ['staging-area', 'local-repository'],
      activeCommand: 'git commit',
      caption: 'Saving rewrites the file on your desk. Committing moves a snapshot into history, on purpose.',
    },
  },
  {
    slug: 'git-and-github-are-different',
    statement: 'Git and GitHub are not the same thing.',
    explanation:
      "Git is the version control tool that runs on your machine and tracks history — it needs no internet connection at all. GitHub is a website that hosts Git repositories and adds collaboration features like pull requests on top. You can use Git fully offline, forever, without ever touching GitHub.",
    relatedConcepts: ['git-vs-github'],
    visual: {
      kind: 'state-flow',
      activeStates: ['remote-repository'],
      caption: 'Only the lit box is GitHub. Everything before it is Git, running on your own machine.',
    },
  },
  {
    slug: 'git-add-does-not-commit',
    statement: 'git add does not create a commit.',
    explanation:
      'git add only moves changes into the staging area — a waiting room for your next snapshot. Nothing is permanently recorded in your project\'s history until you run git commit. You can stage and unstage as many times as you like before that happens.',
    relatedConcepts: ['staging-area', 'commit'],
    visual: {
      kind: 'state-flow',
      activeStates: ['working-directory', 'staging-area'],
      activeCommand: 'git add',
      caption: 'git add gets your work exactly this far. History does not begin until the next box.',
    },
  },
  {
    slug: 'git-without-github',
    statement: 'You can use Git without GitHub.',
    explanation:
      'Git tracks history entirely on your own computer. init, add, commit, branch, merge, log — every one of those works with zero network connection and zero account. GitHub only enters the picture the moment you want to back your work up online or collaborate with someone else.',
    relatedConcepts: ['git-vs-github', 'remote'],
    visual: {
      kind: 'state-flow',
      activeStates: ['working-directory', 'staging-area', 'local-repository'],
      caption: 'All three lit boxes work with no account and no network. Only the last one needs either.',
    },
  },
  {
    slug: 'branch-is-not-a-copy',
    statement: "A branch is not a copy of your entire project in the way beginners often imagine it.",
    explanation:
      "Creating a branch doesn't duplicate a single file. A branch is just a lightweight, movable pointer to a commit. That's why creating one is instant even in a huge repository — Git isn't copying anything, it's just adding a new bookmark.",
    relatedConcepts: ['branch', 'head'],
    visual: {
      kind: 'contrast',
      sounds: 'A second copy of every file in the project, sitting somewhere on disk.',
      actually: 'A pointer to one commit. A few bytes — which is why making one is instant in a huge repository.',
    },
  },
  {
    slug: 'deleting-a-branch-keeps-its-history',
    statement: "Deleting a branch doesn't erase its commits right away.",
    explanation:
      "A branch is just a pointer — deleting it removes the bookmark, not the commits it pointed to. If those commits were merged elsewhere, they're still very much part of your history. Even unmerged commits usually stick around for a while and can be found with git reflog.",
    relatedConcepts: ['branch', 'head'],
    visual: {
      kind: 'contrast',
      sounds: 'Deleting the branch deletes the commits that were on it.',
      actually: 'It removes the bookmark. Merged commits stay in history, and unmerged ones are usually still findable with git reflog.',
    },
  },
  {
    slug: 'head-is-a-pointer-not-a-place',
    statement: "HEAD isn't a place — it's a pointer.",
    explanation:
      '"HEAD" sounds like it should mean "the top of the project," but it really just means "wherever you currently are." Most of the time it points at a branch, which points at a commit. Move to a different branch, and HEAD moves with you.',
    relatedConcepts: ['head', 'detached-head'],
    visual: {
      kind: 'contrast',
      sounds: 'The top of the project — the newest commit that exists.',
      actually: 'Wherever you currently are. Switch branch and HEAD comes with you.',
    },
  },
  {
    slug: 'undoing-rarely-loses-work',
    statement: 'Undoing in Git rarely means losing work.',
    explanation:
      "Almost every 'undo' command in Git — restore --staged, reset, revert, even stash — is designed to be reversible. Even commits that seem to disappear after a reset usually still exist and can be found again with git reflog. The commands that can genuinely destroy work (--hard, --force, git clean) are the small, clearly-flagged exception, not the rule.",
    relatedConcepts: ['commit'],
    visual: {
      kind: 'contrast',
      sounds: 'Undoing something in Git means the work is gone.',
      actually: 'Almost every undo is reversible. Only --hard, --force and git clean genuinely destroy, and they say so.',
    },
  },
  {
    slug: 'commits-are-snapshots-not-diffs',
    statement: 'Git stores snapshots, not differences.',
    explanation:
      "It's natural to picture Git saving a list of changes for each commit. It doesn't — every commit records what the whole project looked like at that moment. Files that didn't change aren't duplicated; Git just points at the copy it already has. The diffs you read in git log are worked out on demand by comparing two snapshots.",
    visual: {
      kind: 'contrast',
      sounds: 'Each commit stores a list of the lines that changed.',
      actually: 'Each commit stores the whole project as it was. Diffs are calculated when you ask for them.',
    },
    relatedConcepts: ['commit', 'history'],
  },
  {
    slug: 'nothing-is-shared-until-you-push',
    statement: 'Committing does not back anything up.',
    explanation:
      'A commit is recorded in your local repository — a folder on your machine. Until you push, nobody else can see it, and nothing about it survives losing your laptop. Committing often is good practice, but it is not a backup and it is not sharing.',
    visual: {
      kind: 'state-flow',
      activeStates: ['local-repository'],
      activeCommand: 'git push',
      caption: 'Your commits stop here until you push. One machine, one copy.',
    },
    relatedConcepts: ['commit', 'remote'],
  },
  {
    slug: 'merge-conflict-is-not-an-error',
    statement: 'A merge conflict is not an error.',
    explanation:
      "Nothing is broken and nothing is lost when a conflict appears. Git is telling you that two people changed the same lines, and that choosing between them is a judgement call it isn't willing to make for you. The merge simply pauses until you decide.",
    visual: {
      kind: 'contrast',
      sounds: 'Something went wrong and the merge has failed.',
      actually: 'Git paused and asked a question, because only a person can decide which version is right.',
    },
    relatedConcepts: ['merge-conflict', 'branch'],
  },
  {
    slug: 'pull-is-fetch-plus-merge',
    statement: 'git pull is two commands in one.',
    explanation:
      'git pull runs git fetch and then git merge, back to back. That is why a pull can suddenly produce a merge conflict when all you wanted was the latest changes — the merge half is doing exactly what a merge does. Running git fetch on its own shows you what arrived without touching your files.',
    visual: {
      kind: 'contrast',
      sounds: 'Pull just downloads the latest changes.',
      actually: 'Pull downloads and then merges. The merge is the half that can stop and ask you something.',
    },
    relatedConcepts: ['remote', 'merge-conflict'],
  },
  {
    slug: 'untracked-files-are-invisible-to-undo',
    statement: "Git can't give back a file it was never told about.",
    explanation:
      "Every undo command works from a copy Git already holds. A file you have never git added has no such copy — Git has never seen a single version of it. That is the whole reason git clean is permanent while git restore is not, and it is worth knowing before you reach for either.",
    visual: {
      kind: 'contrast',
      sounds: 'Git is watching the folder, so anything in it can be recovered.',
      actually: 'Git only holds copies of files you have added. Untracked ones exist to it as names in a list, nothing more.',
    },
    relatedConcepts: ['tracked-vs-untracked', 'uncommitted-changes'],
  },
]
