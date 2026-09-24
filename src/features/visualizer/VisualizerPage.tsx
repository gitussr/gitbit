import { History, Pencil, Redo2, Repeat, RotateCcw, Undo2, Users } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { CommandConsole, type ConsoleEntry } from '@/components/ui/CommandConsole'
import { PageHeader } from '@/components/ui/PageHeader'
import { panelClassName } from '@/components/ui/StatePanel'
import { Text, TextWithCode } from '@/components/ui/Typography'
import type { GitStateId } from '@/content/states'
import { getScenarioSummary, type ScenarioSummary } from '@/content/visualizer/catalog'
import type { ScenarioAction } from '@/content/visualizer/scenarios'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useScrollPaddingBottom } from '@/hooks/useScrollPaddingBottom'
import { complete, currentBranch, suggest, type RepoState, type ResetLayer } from '@/services/git-sim'
import { announceTransition, announceUndo, discardedBy } from './announce'
import { ResetLayers } from './ResetLayers'
import { initialVisualizerState, visualizerReducer } from './visualizerReducer'
import { VisualizerLegend } from './VisualizerLegend'
import { VisualizerStage } from './VisualizerStage'

/** Opt-in, so it's its own chunk: the Visualizer's first load doesn't pay for it. */
const TimeMachine = lazy(() => import('./TimeMachine'))

/**
 * Its own chunk too: the scenarios' step-by-step text is the bulk of it,
 * and the stage is usable before it arrives (docs/VISUALIZER.md,
 * Performance budget).
 */
const ScenarioRail = lazy(() => import('./ScenarioRail'))

/** Aha and Quick Recall (Sections 25-26) — with the Aha and Quiz banks they read. */
const LearningMoment = lazy(() => import('./LearningMoment'))

/** How long a replay shows the "before" state before playing the step again. */
const REPLAY_MS = 500

/** How long a panel stays lit after something lands in it. Long enough to notice, short enough not to linger. */
const HIGHLIGHT_MS = 1400

/** The beat between one layer of a reset lighting and the next. */
const STEP_MS = 450

/** Which stage panel each of `git reset`'s layers is. */
const LAYER_PANEL: Record<ResetLayer, GitStateId> = {
  head: 'local-repository',
  index: 'staging-area',
  worktree: 'working-directory',
}

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
  const { scenarioSlug } = useParams()
  const scenario = scenarioSlug ? getScenarioSummary(scenarioSlug) : undefined
  if (scenarioSlug && !scenario) return <Navigate to="/visualizer" replace />

  // Keyed by scenario, so moving between scenarios (or back to free play)
  // starts a fresh workspace from that scenario's seed.
  return <Workspace key={scenario?.slug ?? 'free-play'} scenario={scenario} />
}

function Workspace({ scenario }: { scenario?: ScenarioSummary }) {
  const [state, dispatch] = useReducer(visualizerReducer, scenario?.seed, initialVisualizerState)
  const [seen, setSeen] = useState(0)
  const [highlighted, setHighlighted] = useState(false)
  const [step, setStep] = useState(1)
  const [replaying, setReplaying] = useState(false)
  const [timeMachineOpen, setTimeMachineOpen] = useState(false)
  const [inspected, setInspected] = useState<string | null>(null)

  // Tabbing to something under the docked console scrolls it clear of the dock.
  const dock = useRef<HTMLDivElement>(null)
  useScrollPaddingBottom(dock)

  // After an undo, the entry now at the end of history didn't just happen —
  // nothing did, except the undo. It gets no highlight and no description.
  const last = state.last === 'undo' ? undefined : state.history[state.history.length - 1]
  const undone = state.last === 'undo' ? state.future[0] : undefined

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
  if (seen !== state.version) {
    setSeen(state.version)
    setHighlighted(last !== undefined)
    setStep(1)
  }

  /**
   * A reset lights its layers one after another — HEAD, then the Staging
   * Area, then the disk — because *how far down it goes* is the whole
   * difference between its three modes (Section 18). Under reduced motion
   * they light together: same information, no sequence to watch.
   */
  const reset = last?.events.find((event) => event.type === 'RESET_PERFORMED')
  const sequence = useMemo(() => reset?.layers.map((layer) => LAYER_PANEL[layer]) ?? [], [reset])
  const reduced = useReducedMotion()
  const revealed = reduced ? sequence.length : step

  useEffect(() => {
    if (!highlighted || revealed >= sequence.length) return
    const timer = window.setTimeout(() => setStep((current) => current + 1), STEP_MS)
    return () => window.clearTimeout(timer)
  }, [highlighted, revealed, sequence.length])

  useEffect(() => {
    if (!highlighted) return
    const timer = window.setTimeout(() => setHighlighted(false), HIGHLIGHT_MS + Math.max(0, sequence.length - 1) * STEP_MS)
    return () => window.clearTimeout(timer)
  }, [highlighted, seen, sequence.length])

  const { active, entering } = useMemo(() => {
    const panels = new Set<GitStateId>()
    const nodes = new Set<string>()
    if (!last || !highlighted) return { active: panels, entering: nodes }

    for (const panel of sequence.slice(0, revealed)) panels.add(panel)

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
      // Unstaging hands the file back to the Working Directory, where it now shows as modified.
      if (event.type === 'FILE_UNSTAGED') panels.add('working-directory')
      if (event.type === 'FILE_RESTORED') {
        panels.add('working-directory')
        nodes.add(`working-directory:${event.path}`)
      }
      // Files a hard reset rewrote drop in once the Working Directory's turn comes.
      if (event.type === 'RESET_PERFORMED' && revealed >= event.layers.length) {
        for (const path of event.paths) nodes.add(`working-directory:${path}`)
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
      // Crossing the boundary: pushes (yours or a teammate's) land on the
      // remote; a fetch lands in your repository, as a moved origin/ label.
      if (event.type === 'REMOTE_ADDED') panels.add('remote-repository')
      if (event.type === 'REMOTE_UPDATED') {
        const here = event.direction === 'fetch'
        panels.add(here ? 'local-repository' : 'remote-repository')
        for (const id of event.commits) nodes.add(here ? id : `remote:${id}`)
      }
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
  }, [last, highlighted, sequence, revealed])

  /**
   * Replay (Section 27) is undo, a beat, then redo — so every animation
   * plays again for real, from the actual "before", rather than a canned
   * re-run of one highlight.
   */
  const replay = () => {
    setReplaying(true)
    dispatch({ type: 'undo' })
    window.setTimeout(() => {
      dispatch({ type: 'redo' })
      setReplaying(false)
    }, REPLAY_MS)
  }

  /** A scenario step's one-click action: the same dispatches the controls make. */
  const act = (action: ScenarioAction) => {
    if ('run' in action) dispatch({ type: 'run', input: action.run })
    else if ('edit' in action) dispatch({ type: 'edit', path: action.edit, content: nextEdit(state.repo) })
    else dispatch({ type: 'teammate' })
  }

  const lost = last ? discardedBy(last) : []
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
          note: entry.source !== 'command',
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

      <Suspense fallback={<div className="min-h-7" />}>
        <ScenarioRail slug={scenario?.slug} history={state.history} onAct={act} />
      </Suspense>

      {/* Section 31: present, unobtrusive — closed until someone asks what a mark means. */}
      <VisualizerLegend />

      {/* grid-cols-1, not the implicit column: an implicit track sizes to its
          widest item's min-content, which pushed the page past a phone's
          width. This one is the screen's width, and things inside wrap. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <VisualizerStage
          repo={state.repo}
          active={active}
          entering={entering}
          inspected={timeMachineOpen ? (inspected ?? null) : null}
        />

        <div className="flex flex-col gap-4">
          {/* Explanation first, at every width: below lg this column follows
              the stage, and what just happened is what someone who just ran a
              command is looking for. DOM order, not CSS order, so tab order
              and a screen reader agree with what's on screen. */}
          {/* The textual meaning of the last change (Section 40). Announced to
              screen readers, and shown to everyone — it is not a fallback. */}
          <div className={panelClassName(false, 'flex flex-col gap-1', lost.length > 0 ? 'caution' : 'default')}>
            <Text variant="caption" tone="secondary" className="font-bold uppercase">
              What just happened
            </Text>
            <Text variant="body-sm" aria-live="polite">
              {replaying && undone
                ? `Replaying ${undone.input}…`
                : last
                  ? <TextWithCode>{announceTransition(last)}</TextWithCode>
                  : undone
                    ? announceUndo(undone)
                    : 'Nothing yet. Run a command to begin.'}
            </Text>
            {last && last.outcome.kind !== 'ok' && (
              <Text variant="body-sm" tone="secondary">
                <TextWithCode>{last.outcome.why}</TextWithCode>
              </Text>
            )}
          </div>

          {reset && <ResetLayers event={reset} revealed={revealed} />}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<Pencil className="size-4" />}
              onClick={() => dispatch({ type: 'edit', path: EDIT_PATH, content: nextEdit(state.repo) })}
            >
              Edit {EDIT_PATH}
            </Button>
            {/* The world moving on without you — only once there's a remote
                branch for someone else to push to. */}
            {state.repo.remote && Object.keys(state.repo.remote.branches).length > 0 && (
              <Button variant="ghost" size="sm" leadingIcon={<Users className="size-4" />} onClick={() => dispatch({ type: 'teammate' })}>
                Teammate pushes
              </Button>
            )}
          </div>

          {/* Section 27: these act on the simulator, not on Git, and say so —
              real Git has no undo button, and nobody should leave thinking it does. */}
          <div className="flex flex-col gap-1.5" role="group" aria-labelledby="simulator-controls">
            <Text id="simulator-controls" variant="caption" tone="secondary">
              Simulator controls — these don&apos;t run Git
            </Text>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                leadingIcon={<Undo2 className="size-4" />}
                disabled={state.history.length === 0 || replaying}
                onClick={() => dispatch({ type: 'undo' })}
              >
                Undo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leadingIcon={<Redo2 className="size-4" />}
                disabled={state.future.length === 0 || replaying}
                onClick={() => dispatch({ type: 'redo' })}
              >
                Redo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leadingIcon={<Repeat className="size-4" />}
                disabled={state.history.length === 0 || replaying}
                onClick={replay}
              >
                Replay
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leadingIcon={<RotateCcw className="size-4" />}
                disabled={replaying}
                onClick={() => {
                  setInspected(null)
                  dispatch({ type: 'reset' })
                }}
              >
                Start over
              </Button>
            </div>
          </div>

          {/* Only for a change that just happened: after an undo, the entry
              now last didn't just happen, and it doesn't get to teach again. */}
          {last && !replaying && (
            <Suspense fallback={null}>
              <LearningMoment history={state.history} />
            </Suspense>
          )}

          <div className="flex flex-col gap-3">
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<History className="size-4" />}
              aria-expanded={timeMachineOpen}
              aria-controls="time-machine"
              onClick={() => setTimeMachineOpen((open) => !open)}
              className="self-start"
            >
              {timeMachineOpen ? 'Close the Time Machine' : 'Open the Time Machine'}
            </Button>
            {timeMachineOpen && (
              <div id="time-machine" className={panelClassName(false)}>
                <Suspense fallback={<LoadingState rows={1} />}>
                  <TimeMachine
                    repo={state.repo}
                    selected={inspected}
                    onSelect={setInspected}
                    onRun={(input) => dispatch({ type: 'run', input })}
                  />
                </Suspense>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Docked, not fixed: it sticks to the bottom of the viewport while the
          stage scrolls past, and stays in the page's flow at every width
          (docs/VISUALIZER.md, Layout). */}
      <div ref={dock} className="sticky bottom-[env(safe-area-inset-bottom)] z-10">
        <CommandConsole
          label="Git command"
          entries={entries}
          history={commands}
          suggestions={suggestions}
          complete={completeInput}
          onRun={(input) => dispatch({ type: 'run', input })}
          onClear={() => dispatch({ type: 'clear' })}
        />
      </div>
    </div>
  )
}
