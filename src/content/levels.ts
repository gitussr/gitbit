export interface LearnLevel {
  slug: string
  order: number
  title: string
  description: string
  conceptSlugs: string[]
  commandSlugs: string[]
}

/**
 * The GitBit Learn progression (Section 4). Levels are a curation layer
 * on top of concepts/commands, not a property of the content itself —
 * that keeps each concept/command reusable in Quick, Daily, and Quiz
 * without being tied to a single learning path.
 */
export const learnLevels: LearnLevel[] = [
  {
    slug: 'level-0-git-basics',
    order: 0,
    title: 'Git Basics',
    description: 'The words everything else is built on — Git, repositories, commits, and history.',
    conceptSlugs: ['git', 'repository', 'working-directory', 'working-tree', 'dot-git-folder', 'commit', 'history'],
    commandSlugs: [],
  },
  {
    slug: 'level-1-everyday-git',
    order: 1,
    title: 'Everyday Git',
    description: 'The handful of commands you\'ll actually run every single day.',
    conceptSlugs: ['staging-area'],
    commandSlugs: ['git-init', 'git-status', 'git-add', 'git-commit', 'git-log', 'git-diff'],
  },
  {
    slug: 'level-2-git-and-github',
    order: 2,
    title: 'Git + GitHub',
    description: 'How your local repository connects to a shared one online.',
    conceptSlugs: ['git-vs-github', 'remote', 'origin'],
    commandSlugs: ['git-clone', 'git-remote', 'git-push', 'git-pull', 'git-fetch'],
  },
  {
    slug: 'level-3-branching',
    order: 3,
    title: 'Branching',
    description: 'Working on something new without disturbing everyone else\'s work.',
    conceptSlugs: ['branch'],
    commandSlugs: ['git-branch', 'git-switch', 'git-merge'],
  },
  {
    slug: 'level-4-collaboration',
    order: 4,
    title: 'Collaboration',
    description: 'What happens when two people change the same project at once.',
    conceptSlugs: ['merge-conflict'],
    commandSlugs: ['git-rebase'],
  },
  {
    slug: 'level-5-undoing-things',
    order: 5,
    title: 'Undoing Things',
    description: 'Four different ways to take something back — and when to reach for each.',
    conceptSlugs: [],
    commandSlugs: ['git-restore', 'git-reset', 'git-reset-hard', 'git-revert', 'git-stash'],
  },
  {
    slug: 'level-6-advanced-git',
    order: 6,
    title: 'Advanced Git',
    description: 'For when you\'re comfortable with the everyday flow and want to go deeper.',
    conceptSlugs: ['head', 'detached-head'],
    commandSlugs: ['git-reflog'],
  },
]
