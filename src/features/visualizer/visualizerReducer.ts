import { executeCommand, projectFolder, writeFile, type RepoState, type Transition } from '@/services/git-sim'

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

/** A transition, and whether it came from the console or from editing a file. */
export interface HistoryEntry extends Transition {
  source: 'command' | 'edit'
}

export interface VisualizerState {
  repo: RepoState
  /** Every transition, oldest first. Each one keeps its own `before`, so nothing needs recomputing to go back. */
  history: HistoryEntry[]
  /**
   * Where the console's scrollback starts. Clearing the console hides
   * history rather than deleting it — the record undo and the Time Machine
   * read from isn't the console's to throw away.
   */
  clearedAt: number
}

export type VisualizerAction =
  | { type: 'run'; input: string }
  | { type: 'edit'; path: string; content: string }
  | { type: 'clear' }
  | { type: 'reset' }

export function initialVisualizerState(): VisualizerState {
  return { repo: projectFolder(), history: [], clearedAt: 0 }
}

export function visualizerReducer(state: VisualizerState, action: VisualizerAction): VisualizerState {
  switch (action.type) {
    case 'run': {
      const transition = executeCommand(state.repo, action.input)
      return { ...state, repo: transition.after, history: [...state.history, { ...transition, source: 'command' }] }
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
      return { ...state, repo: result.state, history: [...state.history, transition] }
    }

    case 'clear':
      return { ...state, clearedAt: state.history.length }

    case 'reset':
      return initialVisualizerState()
  }
}
