import type { SosGuide } from '@/content/types'

/**
 * "I messed up Git." Calm, step-by-step recovery guides (Section 32).
 * Never blame the user — reassure first, then walk through the fix.
 */
export const sosGuides: SosGuide[] = [
  {
    slug: 'accidentally-staged-a-file',
    situation: 'I accidentally staged a file',
    reassurance: "Don't worry — unstaging never loses any work. Your edits stay exactly where they are.",
    dangerLevel: 'safe',
    steps: [
      {
        instruction: 'Remove the file from the staging area, keeping your edits in place.',
        command: 'git restore --staged <file>',
        explanation: 'This only undoes the git add — it does not touch the actual contents of the file.',
      },
      {
        instruction: 'Confirm it worked.',
        command: 'git status',
        explanation: 'The file should now show up as an unstaged change instead of a staged one.',
      },
    ],
    relatedConcepts: ['staging-area'],
  },
  {
    slug: 'accidentally-committed-too-early',
    situation: 'I committed too early and want to keep working before it\'s "official"',
    reassurance: "Don't worry — you can undo a commit and keep every bit of the work. Nothing is thrown away.",
    dangerLevel: 'safe',
    steps: [
      {
        instruction: 'Undo the commit, but keep the changes staged.',
        command: 'git reset --soft HEAD~1',
        explanation: 'This moves your branch back one commit. Your files are untouched, and the changes stay staged, ready to edit further or re-commit.',
      },
      {
        instruction: "Prefer your changes unstaged instead? Use --mixed (the default).",
        command: 'git reset HEAD~1',
        explanation: 'Same idea, but the changes land back in your working directory instead of staged.',
      },
    ],
    relatedConcepts: ['commit', 'staging-area'],
  },
  {
    slug: 'undo-local-changes',
    situation: "I want to undo changes I haven't committed yet",
    reassurance: "Don't worry — this is exactly what Git is for. As long as it isn't committed, you can always ask for a clean copy back.",
    dangerLevel: 'caution',
    steps: [
      {
        instruction: 'Discard changes in a specific file, going back to the last commit.',
        command: 'git restore <file>',
        explanation: 'This overwrites the file with the last committed version. Only do this if you\'re sure — the current edits are not recoverable afterward.',
      },
      {
        instruction: 'Not sure yet? Check what would change first.',
        command: 'git diff <file>',
        explanation: 'Review exactly what you\'d be discarding before you commit to discarding it.',
      },
    ],
    relatedConcepts: ['working-directory'],
  },
  {
    slug: 'deleted-a-file-by-accident',
    situation: 'I deleted a file by accident',
    reassurance: "Don't worry — if the file was ever committed, Git still has a copy of it.",
    dangerLevel: 'safe',
    steps: [
      {
        instruction: 'If the deletion isn\'t committed yet, just restore it.',
        command: 'git restore <file>',
        explanation: 'Brings the file back exactly as it was in the last commit.',
      },
      {
        instruction: 'Already committed the deletion? Bring the file back from an earlier commit.',
        command: 'git restore --source HEAD~1 <file>',
        explanation: 'Pulls that file\'s contents from one commit back in time, before it was deleted.',
      },
    ],
    relatedConcepts: ['commit', 'working-directory'],
  },
  {
    slug: 'committed-to-wrong-branch',
    situation: 'I committed to the wrong branch',
    reassurance: "Don't worry — the commit isn't stuck. You can move it to where it should be.",
    dangerLevel: 'caution',
    steps: [
      {
        instruction: 'Create the branch you meant to commit to, right where you are now.',
        command: 'git branch correct-branch',
        explanation: 'This puts a new branch pointer at your current commit — including the misplaced work.',
      },
      {
        instruction: 'Move the current (wrong) branch back before the accidental commit.',
        command: 'git reset --hard HEAD~1',
        explanation: 'Only safe here because you just made a new branch that still points to that commit — the work isn\'t lost, it lives on correct-branch now.',
      },
      {
        instruction: 'Switch to the branch that now has your work.',
        command: 'git switch correct-branch',
      },
    ],
    relatedConcepts: ['branch', 'head'],
  },
  {
    slug: 'undo-a-past-commit',
    situation: 'I need to undo a commit that\'s already a few commits back',
    reassurance: "Don't worry — Git has two clean ways to do this, and neither one throws your history away by accident.",
    dangerLevel: 'caution',
    steps: [
      {
        instruction: "If you haven't pushed this commit anywhere yet, you can rewrite history freely.",
        command: 'git reset <commit-before-the-one-you-want-gone>',
        explanation: 'Moves your branch back to before that commit. Use --hard only if you also want to discard the file changes.',
      },
      {
        instruction: 'Already pushed it, or shared the branch with someone? Undo it without rewriting history instead.',
        command: 'git revert <commit>',
        explanation: 'Creates a new commit that cancels out the old one. Safe on shared branches, because nothing already-pushed gets rewritten.',
      },
    ],
    relatedConcepts: ['commit'],
  },
  {
    slug: 'merge-conflict',
    situation: 'I hit a merge conflict',
    reassurance: "Don't worry — a merge conflict just means Git needs your judgment call on two competing changes. Nothing is broken, and nothing is lost.",
    dangerLevel: 'caution',
    steps: [
      {
        instruction: 'See which files have conflicts.',
        command: 'git status',
        explanation: 'Git marks conflicted files clearly, separate from files it merged automatically.',
      },
      {
        instruction: 'Open each conflicted file and look for the conflict markers.',
        explanation: 'Git wraps the competing versions in <<<<<<<, =======, and >>>>>>> — edit the file down to what it should actually say, then remove the markers.',
      },
      {
        instruction: 'Stage the resolved file once it looks right.',
        command: 'git add <file>',
      },
      {
        instruction: 'Finish the merge.',
        command: 'git commit',
        explanation: 'Git already prepares a merge commit message for you — you can usually just accept it.',
      },
      {
        instruction: 'Changed your mind entirely? Back out of the merge and try again later.',
        command: 'git merge --abort',
      },
    ],
    relatedConcepts: ['merge-conflict', 'branch'],
  },
  {
    slug: 'detached-head',
    situation: "I'm in 'detached HEAD' state and don't know what that means",
    reassurance: "Don't worry — you haven't broken anything. You're just looking at an old point in history instead of standing on a branch.",
    dangerLevel: 'caution',
    steps: [
      {
        instruction: "If you haven't made any new commits here, just go back to a branch.",
        command: 'git switch main',
        explanation: 'This safely leaves detached HEAD — you were only looking around, so there\'s nothing to lose.',
      },
      {
        instruction: 'Did you make commits you want to keep while detached? Save them to a real branch first.',
        command: 'git switch -c new-branch-name',
        explanation: 'Run this before switching away — it turns your detached commits into a proper branch so they stay easy to find.',
      },
    ],
    relatedConcepts: ['detached-head', 'head'],
  },
  {
    slug: 'lost-work-recovery',
    situation: "I think I lost some work and don't know what happened",
    reassurance: "Don't worry — Git usually keeps more history than you think, even after a reset, a bad rebase, or a deleted branch.",
    dangerLevel: 'caution',
    steps: [
      {
        instruction: 'Check the reflog — Git\'s record of everywhere HEAD has recently pointed.',
        command: 'git reflog',
        explanation: 'This often shows commits that no longer appear in git log, including ones from before a hard reset.',
      },
      {
        instruction: 'Found the commit you\'re looking for? Bring it back onto a branch.',
        command: 'git switch -c recovered-work <hash-from-reflog>',
        explanation: 'This creates a new branch right at that commit, so nothing about it is guessing or destructive.',
      },
      {
        instruction: "Can't find it in the reflog either? Check for a stash.",
        command: 'git stash list',
        explanation: 'Uncommitted work sometimes ends up stashed rather than committed — this shows anything sitting there.',
      },
    ],
    relatedConcepts: ['commit', 'head'],
  },
]
