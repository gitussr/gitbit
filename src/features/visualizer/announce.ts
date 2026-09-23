import type { GitEvent, Transition } from '@/services/git-sim'

/**
 * Every state change, in a sentence (Section 40).
 *
 * This is the textual meaning that has to exist whether or not anything
 * animated — read by screen readers from a live region, and shown under
 * the stage for everyone. Without it the Visualizer would be a picture
 * that only works if you can see it move.
 *
 * These are *descriptions of what moved*, not explanations of Git. The
 * explanations come from the content model (`content/commands`,
 * `content/states.ts`) when the Explainer lands — nothing here should
 * grow into a second, parallel set of Git teaching.
 */
function filesRewritten(paths: string[]): string {
  if (paths.length === 0) return 'No files changed on disk.'
  return `Rewritten on disk: ${paths.join(', ')}.`
}

export function describeEvent(event: GitEvent): string | null {
  switch (event.type) {
    case 'REPO_INITIALIZED':
      return `Repository created. The current branch will be ${event.branch}.`
    case 'FILE_MODIFIED':
      return `${event.path} changed in the Working Directory.`
    case 'FILE_STAGED':
      return `${event.path} moved from Working Directory to Staging Area.`
    case 'FILE_UNSTAGED':
      return `${event.path} moved back from Staging Area to Working Directory.`
    case 'FILE_RESTORED':
      return `${event.path} was restored in the Working Directory.`
    case 'COMMIT_CREATED': {
      const count = event.paths.length
      return `Commit ${event.id} recorded ${count} ${count === 1 ? 'file' : 'files'} in the Local Repository: "${event.message}".`
    }
    case 'HEAD_MOVED':
      return `HEAD now points at ${event.to}.`
    case 'BRANCH_CREATED':
      return `New branch ${event.name} points at ${event.at}.`
    case 'BRANCH_DELETED':
      return `Branch ${event.name} was deleted. It pointed at ${event.at}.`
    case 'BRANCH_SWITCHED':
      return `HEAD moved${event.from ? ` from ${event.from}` : ''} to ${event.to}. ${filesRewritten(event.paths)}`
    case 'HEAD_DETACHED':
      return `HEAD now points straight at commit ${event.at}, with no branch in between. ${filesRewritten(event.paths)}`
    case 'NOTHING_HAPPENED':
      return event.reason
    default:
      // Events for commands that aren't simulated yet. Adding a sentence
      // before the command exists would be guessing at what it will do.
      return null
  }
}

/** One line summarising a whole transition, for the live region. */
export function announceTransition(transition: Transition): string {
  if (transition.outcome.kind !== 'ok') return `${transition.input} was refused. ${transition.outcome.message}`

  // A detached HEAD's own sentence already names the commit; saying it again reads as a second move.
  const detached = transition.events.some((event) => event.type === 'HEAD_DETACHED')
  const sentences = transition.events
    .filter((event) => !(detached && event.type === 'HEAD_MOVED'))
    .map(describeEvent)
    .filter((line): line is string => line !== null)
  return sentences.length > 0 ? sentences.join(' ') : `${transition.input} ran.`
}
