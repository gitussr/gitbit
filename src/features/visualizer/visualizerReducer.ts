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

export interface VisualizerState {
  repo: RepoState
  /** Every transition, oldest first. Each one keeps its own `before`, so nothing needs recomputing to go back. */
  history: Transition[]
}

export type VisualizerAction =
  | { type: 'run'; input: string }
  | { type: 'edit'; path: string; content: string }
  | { type: 'reset' }

export function initialVisualizerState(): VisualizerState {
  return { repo: projectFolder(), history: [] }
}

export function visualizerReducer(state: VisualizerState, action: VisualizerAction): VisualizerState {
  switch (action.type) {
    case 'run': {
      const transition = executeCommand(state.repo, action.input)
      return { repo: transition.after, history: [...state.history, transition] }
    }

    case 'edit': {
      const result = writeFile(state.repo, action.path, action.content)
      // Editing a file isn't a Git command, but it changes the same state and
      // belongs in the same history — otherwise the record of "what happened"
      // has holes in it exactly where the interesting changes are.
      const transition: Transition = {
        input: `(edited ${action.path})`,
        before: state.repo,
        after: result.state,
        events: result.events,
        outcome: { kind: 'ok', output: [] },
      }
      return { repo: result.state, history: [...state.history, transition] }
    }

    case 'reset':
      return initialVisualizerState()
  }
}
