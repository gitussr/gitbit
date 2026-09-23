import { executeCommand, seeds, teammatePush, writeFile, type RepoState, type SeedName, type Transition } from '@/services/git-sim'

/**
 * The Visualizer's store (see `docs/VISUALIZER.md`).
 *
 * The first `useReducer` in the codebase, and the reason is that the whole
 * feature is one state machine: the repository, plus the ordered list of
 * everything that has happened to it. `useState` per concern could hold
 * the first part but not the second, and the second is what undo, replay
 * and the Time Machine are all made of.
 *
 * The reducer contains no Git logic. It calls the engine and stores what
 * comes back.
 */

/**
 * A transition, and where it came from: the console, the sandbox's edit
 * control, or the world outside your machine (a teammate pushing).
 */
export interface HistoryEntry extends Transition {
  source: 'command' | 'edit' | 'elsewhere'
}

export interface VisualizerState {
  /** Where this workspace starts, and where Start over returns to. */
  seed: SeedName
  repo: RepoState
  /** Every transition, oldest first. Each one keeps its own `before`, so nothing needs recomputing to go back. */
  history: HistoryEntry[]
  /**
   * Where the console's scrollback starts. Clearing the console hides
   * history rather than deleting it — the record undo and the Time Machine
   * read from isn't the console's to throw away.
   */
  clearedAt: number
  /** Transitions undone and not yet redone, next-to-redo first. Anything new clears it, as in an editor. */
  future: HistoryEntry[]
  /**
   * What the last action was. An undo shortens `history` exactly the way
   * nothing else does, and the page must not describe the entry that's now
   * last as if it had just happened.
   */
  last: 'run' | 'undo' | 'redo' | null
  /** Bumped by every action, so the page can tell "something happened" even when history's length didn't change. */
  version: number
}

export type VisualizerAction =
  | { type: 'run'; input: string }
  | { type: 'edit'; path: string; content: string }
  | { type: 'teammate' }
  | { type: 'clear' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset' }

export function initialVisualizerState(seed: SeedName = 'project-folder'): VisualizerState {
  return { seed, repo: seeds[seed](), history: [], clearedAt: 0, future: [], last: null, version: 0 }
}

function append(state: VisualizerState, entry: HistoryEntry): VisualizerState {
  return { ...state, repo: entry.after, history: [...state.history, entry], future: [], last: 'run', version: state.version + 1 }
}

/**
 * Undo, redo and reset act on the *simulator*, not on Git (Section 27).
 * Undo isn't `git reset` or `git revert` — it puts the whole simulated
 * repository back to exactly how it was before the last step, which is
 * something real Git can't do. The page labels it that way.
 */
export function visualizerReducer(state: VisualizerState, action: VisualizerAction): VisualizerState {
  switch (action.type) {
    case 'run': {
      return append(state, { ...executeCommand(state.repo, action.input), source: 'command' })
    }

    case 'edit': {
      const result = writeFile(state.repo, action.path, action.content)
      // Editing a file isn't a Git command, but it changes the same state and
      // belongs in the same history — otherwise the record of "what happened"
      // has holes in it exactly where the interesting changes are.
      const transition: HistoryEntry = {
        source: 'edit',
        input: `edited ${action.path}`,
        before: state.repo,
        after: result.state,
        events: result.events,
        outcome: { kind: 'ok', output: [] },
      }
      return append(state, transition)
    }

    case 'clear':
      return { ...state, clearedAt: state.history.length }

    case 'undo': {
      const undone = state.history[state.history.length - 1]
      if (!undone) return state
      const history = state.history.slice(0, -1)
      return {
        ...state,
        repo: undone.before,
        history,
        clearedAt: Math.min(state.clearedAt, history.length),
        future: [undone, ...state.future],
        last: 'undo',
        version: state.version + 1,
      }
    }

    case 'redo': {
      const [redone, ...future] = state.future
      if (!redone) return state
      return { ...state, repo: redone.after, history: [...state.history, redone], future, last: 'redo', version: state.version + 1 }
    }

    case 'teammate': {
      const result = teammatePush(state.repo)
      return append(state, {
        source: 'elsewhere',
        input: `a teammate pushed to ${state.repo.remote?.name ?? 'the remote'}`,
        before: state.repo,
        after: result.state,
        events: result.events,
        outcome: { kind: 'ok', output: [] },
      })
    }

    case 'reset':
      return initialVisualizerState(state.seed)
  }
}
