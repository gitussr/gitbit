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
      return event.discarded
        ? `${event.path} was put back in the Working Directory. The edits it had were never staged or committed, so they are gone.`
        : `${event.path} was put back in the Working Directory.`
    case 'COMMIT_CREATED': {
      const count = event.paths.length
      if (event.reverts) {
        return `Commit ${event.id} undoes ${event.reverts} by applying its opposite. ${event.reverts} is still in the history — nothing was removed.`
      }
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
    case 'FAST_FORWARD':
      return `Fast-forward: ${event.branch ?? 'HEAD'} slid ahead to ${event.to}. No new commit — the commits were already there. ${filesRewritten(event.paths)}`
    case 'MERGE_CREATED':
      return `Merge commit ${event.id} recorded, with two parents: ${event.parents.join(' and ')}.${event.paths.length > 0 ? ` ${filesRewritten(event.paths)}` : ''}`
    case 'MERGE_CONFLICT':
      return `The ${event.operation} stopped. ${event.conflicts.join(', ')} ${event.conflicts.length === 1 ? 'has' : 'have'} both versions in ${event.conflicts.length === 1 ? 'it' : 'them'}, waiting for you. No commit yet.`
    case 'CONFLICT_RESOLVED':
      return `${event.path} marked as resolved.`
    case 'MERGE_ABORTED':
      return `Abandoned. ${event.paths.length > 0 ? `Put back: ${event.paths.join(', ')}.` : ''}`.trim()
    case 'HEAD_DETACHED':
      return `HEAD now points straight at commit ${event.at}, with no branch in between. ${filesRewritten(event.paths)}`
    case 'RESET_PERFORMED': {
      const moved = event.from === event.to ? `HEAD stayed at ${event.to}` : `HEAD moved to ${event.to}`
      const kept = {
        soft: 'The Staging Area and the files on disk were left as they were.',
        mixed: 'The Staging Area now matches it too; the files on disk were left as they were.',
        hard: 'The Staging Area and the files on disk now match it too.',
      }[event.mode]
      const lost =
        event.discarded.length > 0
          ? ` Uncommitted changes to ${event.discarded.join(', ')} were discarded, and Git keeps no copy of them.`
          : ''
      return `${moved} with a ${event.mode} reset. ${kept}${lost}`
    }
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

  // A detached HEAD's or a reset's own sentence already names the commit;
  // saying it again reads as a second move.
  const named = transition.events.some((event) => event.type === 'HEAD_DETACHED' || event.type === 'RESET_PERFORMED')
  const sentences = transition.events
    .filter((event) => !(named && event.type === 'HEAD_MOVED'))
    .map(describeEvent)
    .filter((line): line is string => line !== null)
  return sentences.length > 0 ? sentences.join(' ') : `${transition.input} ran.`
}

/**
 * What the last change destroyed, if anything — uncommitted work Git kept
 * no copy of. Read from the events rather than decided here: the engine
 * knows what was lost, this only lists it.
 */
export function discardedBy(transition: Transition): string[] {
  const lost = new Set<string>()
  for (const event of transition.events) {
    if (event.type === 'FILE_RESTORED' && event.discarded) lost.add(event.path)
    if (event.type === 'RESET_PERFORMED') for (const path of event.discarded) lost.add(path)
  }
  return [...lost]
}
