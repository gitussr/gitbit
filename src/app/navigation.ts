import type { LucideIcon } from 'lucide-react'
import { Bell, BookOpen, GitCommitVertical, GitCompareArrows, HelpCircle, LifeBuoy, Lightbulb, Terminal, TerminalSquare } from 'lucide-react'

/**
 * Every GitBit module, once — the home page's "Everything GitBit" grid, the
 * desktop header and the mobile menu all read from here, so a new module
 * can't show up in one and be missing from another.
 */
export interface NavModule {
  to: string
  /** Short name: header link and menu tile. Home shows it as "GitBit <label>". */
  label: string
  icon: LucideIcon
  /** One sentence, for the home page card. */
  description: string
  /** Two or three words, for a menu tile where a sentence won't fit. */
  tagline: string
}

export const navModules: NavModule[] = [
  {
    to: '/visualizer',
    label: 'Visualizer',
    icon: GitCommitVertical,
    description: 'Run a command, watch the repository change.',
    tagline: 'Watch Git work',
  },
  { to: '/quick', label: 'Quick', icon: Terminal, description: 'Fast, searchable command cheat sheet.', tagline: 'Cheat sheet' },
  {
    to: '/compare',
    label: 'Compare',
    icon: GitCompareArrows,
    description: 'Two commands that sound alike, side by side.',
    tagline: 'Side by side',
  },
  { to: '/learn', label: 'Learn', icon: BookOpen, description: 'A structured path from basics to branching.', tagline: 'Step by step' },
  { to: '/aha', label: 'Aha', icon: Lightbulb, description: 'Short ideas that fix a wrong mental model.', tagline: 'Big ideas' },
  { to: '/quiz', label: 'Quiz', icon: HelpCircle, description: 'Knowledge checks that test understanding.', tagline: 'Test yourself' },
  { to: '/sos', label: 'SOS', icon: LifeBuoy, description: '"I messed up Git." Calm, step-by-step fixes.', tagline: 'Fix a mistake' },
  {
    to: '/terminal',
    label: 'Terminal',
    icon: TerminalSquare,
    description: 'See what a command actually does.',
    tagline: 'Read the output',
  },
  { to: '/daily', label: 'Daily', icon: Bell, description: 'One small, useful thing about Git — daily.', tagline: 'One a day' },
]

/**
 * The desktop header's link row has room for seven, in its established
 * order; Compare and Terminal are reached from home, search and the menu.
 */
export const headerNav = ['/quick', '/learn', '/aha', '/quiz', '/sos', '/visualizer', '/daily']
  .map((to) => navModules.find((module) => module.to === to))
  .filter((module): module is NavModule => module !== undefined)
