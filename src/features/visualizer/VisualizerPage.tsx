import { Pencil, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { CommandConsole, type ConsoleEntry } from '@/components/ui/CommandConsole'
import { PageHeader } from '@/components/ui/PageHeader'
import { panelClassName } from '@/components/ui/StatePanel'
import { Text } from '@/components/ui/Typography'
import type { GitStateId } from '@/content/states'
import { complete, currentBranch, suggest, type RepoState } from '@/services/git-sim'
import { announceTransition } from './announce'
import { initialVisualizerState, visualizerReducer } from './visualizerReducer'
import { VisualizerStage } from './VisualizerStage'

/** How long a panel stays lit after something lands in it. Long enough to notice, short enough not to linger. */
const HIGHLIGHT_MS = 1400

/**
 * The file the edit control rewrites — a stand-in for an editor, so there
 * is something to stage.
 *
 * What it writes depends on the branch, so two branches that each edit it
 * genuinely disagree about the same line, and merging them conflicts the
 * way it would for real. Editing twice on one branch alternates, so the
 * second edit is still a change. Over a conflicted file, it's the
 * resolution: one clean version, markers gone.
 */
const EDIT_PATH = 'index.html'
function nextEdit(repo: RepoState): string {
  const where = currentBranch(repo) ?? 'a detached HEAD'
  const first = `<h1>Hello from ${where}</h1>\n`
  return repo.workingTree[EDIT_PATH] === first ? `<h1>Hello again from ${where}</h1>\n` : first
}

/**
 * GitBit Visualizer — the workspace (Section 2).
 *
 * The stage draws Working Directory → Staging Area → Local Repository
 * from the simulation engine, animated by the events it emits; the
 * console docked beneath it (Section 9) is how commands get in. The
 * console shows what Git *said*; the panel beside the stage says what it
 * *meant* — the same split as the Terminal page's "Git says" / "Human
 * translation".
 */
export default function VisualizerPage() {
  const [state, dispatch] = useReducer(visualizerReducer, undefined, initialVisualizerState)
  const [seen, setSeen] = useState(0)
  const [highlighted, setHighlighted] = useState(false)

  const last = state.history[state.history.length - 1]

  /**
   * Lighting the panels is React state rather than a CSS animation on
   * purpose: the global `prefers-reduced-motion` rule collapses every
   * animation to 0.001ms, which would make a flash imperceptible for
   * exactly the readers who most need the state change to be obvious.
   * A class held for a beat works either way.
   *
   * Set during render rather than in an effect (the pattern `Layout.tsx`
   * uses for closing the menu on navigation) so the highlight is on in the
   * same paint as the state it describes, with no flash of an unlit panel.
   */
  if (seen !== state.history.length) {
    setSeen(state.history.length)
    setHighlighted(state.history.length > 0)
  }

  useEffect(() => {
    if (!highlighted) return
    const timer = window.setTimeout(() => setHighlighted(false), HIGHLIGHT_MS)
    return () => window.clearTimeout(timer)
  }, [highlighted, seen])

  const { active, entering } = useMemo(() => {
    const panels = new Set<GitStateId>()
    const nodes = new Set<string>()
    if (!last || !highlighted) return { active: panels, entering: nodes }

    for (const event of last.events) {
      // File entrances are keyed by panel: the same path can arrive in one
      // place without the copy in another replaying its entrance.
      if (event.type === 'FILE_MODIFIED') {
        panels.add('working-directory')
        nodes.add(`working-directory:${event.path}`)
      }
      if (event.type === 'FILE_STAGED' || event.type === 'FILE_UNSTAGED') {
        panels.add('staging-area')
        nodes.add(`staging-area:${event.path}`)
      }
      if (event.type === 'COMMIT_CREATED') {
        panels.add('local-repository')
        nodes.add(event.id)
      }
      if (event.type === 'REPO_INITIALIZED') panels.add('local-repository')
      if (
        event.type === 'BRANCH_CREATED' ||
        event.type === 'BRANCH_DELETED' ||
        event.type === 'BRANCH_SWITCHED' ||
        event.type === 'HEAD_DETACHED' ||
        event.type === 'FAST_FORWARD' ||
        event.type === 'MERGE_CREATED'
      ) {
        panels.add('local-repository')
      }
      if (event.type === 'MERGE_CREATED') nodes.add(event.id)
      // Anything that moves you onto another snapshot rewrites whichever files differ.
      if (
        (event.type === 'BRANCH_SWITCHED' ||
          event.type === 'HEAD_DETACHED' ||
          event.type === 'FAST_FORWARD' ||
          event.type === 'MERGE_CREATED' ||
          event.type === 'MERGE_CONFLICT' ||
          event.type === 'MERGE_ABORTED') &&
        event.paths.length > 0
      ) {
        panels.add('working-directory')
        for (const path of event.paths) nodes.add(`working-directory:${path}`)
      }
    }

    return { active: panels, entering: nodes }
  }, [last, highlighted])

  const suggestions = suggest(state.repo)
  const repo = state.repo
  const completeInput = useCallback((input: string) => complete(repo, input), [repo])

  const commands = useMemo(
    () => state.history.filter((entry) => entry.source === 'command').map((entry) => entry.input),
    [state.history],
  )

  const entries = useMemo(
    () =>
      state.history.slice(state.clearedAt).map(
        (entry, i): ConsoleEntry => ({
          id: state.clearedAt + i,
          input: entry.input,
          note: entry.source === 'edit',
          failed: entry.outcome.kind !== 'ok',
          // A refusal prints Git's own message; why it happened is the explainer's line.
          output: entry.outcome.kind === 'ok' ? entry.outcome.output : [entry.outcome.message],
        }),
      ),
    [state.history, state.clearedAt],
  )

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="GitBit Visualizer"
        description="Run a Git command and watch what actually moves. Nothing here is a picture of Git — it is a working simulation of it."
      />

      <Alert variant="info" title="This is a simulator">
        Nothing here touches a repository on your computer. Break whatever you like.
      </Alert>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <VisualizerStage repo={state.repo} active={active} entering={entering} />

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<Pencil className="size-4" />}
              onClick={() => dispatch({ type: 'edit', path: EDIT_PATH, content: nextEdit(state.repo) })}
            >
              Edit {EDIT_PATH}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<RotateCcw className="size-4" />}
              onClick={() => dispatch({ type: 'reset' })}
            >
              Start over
            </Button>
          </div>

          {/* The textual meaning of the last change (Section 40). Announced to
              screen readers, and shown to everyone — it is not a fallback. */}
          <div className={panelClassName(false, 'flex flex-col gap-1')}>
            <Text variant="caption" tone="secondary" className="font-bold uppercase">
              What just happened
            </Text>
            <Text variant="body-sm" aria-live="polite">
              {last ? announceTransition(last) : 'Nothing yet. Run a command to begin.'}
            </Text>
            {last && last.outcome.kind !== 'ok' && (
              <Text variant="body-sm" tone="secondary">
                {last.outcome.why}
              </Text>
            )}
          </div>
        </div>
      </div>

      {/* Docked, not fixed: it sticks to the bottom of the viewport while the
          stage scrolls past, and stays in the page's flow at every width
          (docs/VISUALIZER.md, Layout). */}
      <CommandConsole
        className="sticky bottom-[env(safe-area-inset-bottom)]"
        label="Git command"
        entries={entries}
        history={commands}
        suggestions={suggestions}
        complete={completeInput}
        onRun={(input) => dispatch({ type: 'run', input })}
        onClear={() => dispatch({ type: 'clear' })}
      />
    </div>
  )
}
