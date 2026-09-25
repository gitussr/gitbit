import { Fragment } from 'react'
import { ArrowRight } from 'lucide-react'
import { flowCommands, gitStates, type GitStateId, type GitStateTransition } from '@/content/states'
import { cn } from '@/utils/cn'
import { Text } from './Typography'

const stateById = new Map(gitStates.map((state) => [state.id, state]))

/** The four canonical states, in order — the side states (stash, gone) are drawn by `GitStateHop`. */
const mainFlow = gitStates
  .filter((state) => state.flowOrder !== undefined)
  .sort((a, b) => a.flowOrder! - b.flowOrder!)

export interface GitStateFlowProps {
  /** States to light up — both ends of a command's move, or the single state a concept is about. */
  activeStates?: GitStateId[]
  /** Lights up the labelled arrow for this command (e.g. `git add`). */
  activeCommand?: string
  className?: string
}

/**
 * The Git state model (Section 3), drawn once and reused wherever it helps:
 * unhighlighted on Learn as the model everything else sits on, and with one
 * hop lit up on a command or concept page.
 *
 * Stacks vertically below `lg` — four boxes and three arrows across don't
 * survive a tablet, let alone 320px, and the spec's own diagram is vertical.
 */
export function GitStateFlow({ activeStates, activeCommand, className }: GitStateFlowProps) {
  const active = new Set(activeStates ?? [])
  // Only dim when something on this flow is actually lit — an active state that
  // sits off it (the stash) would otherwise grey out all four and light none.
  const dimmed = mainFlow.some((state) => active.has(state.id))

  return (
    <ol className={cn('flex flex-col items-stretch gap-0 lg:flex-row', className)}>
      {mainFlow.map((state, index) => {
        const step = flowCommands[index]
        const isActive = active.has(state.id)

        return (
          <Fragment key={state.id}>
            <li className="lg:flex-1">
              <div
                className={cn(
                  'flex h-full flex-col gap-1 border-2 border-accent p-3 transition-colors duration-150 ease-standard',
                  // Lime fill only, no brutal shadow: the columns sit ~6px apart, and the
                  // shadow falls left, over the arrow label of the step before it.
                  isActive ? 'bg-card' : 'bg-surface',
                  dimmed && !isActive && 'text-foreground-secondary',
                )}
              >
                <Text as="p" variant="body-sm" className={cn('font-bold', dimmed && !isActive && 'text-foreground-secondary')}>
                  {state.label}
                </Text>
                <Text variant="caption" tone="secondary">
                  {state.plainEnglish}
                </Text>
              </div>
            </li>

            {step && <FlowArrow command={step.command} active={step.command === activeCommand} />}
          </Fragment>
        )
      })}
    </ol>
  )
}

/** The labelled hop between two states — turns a quarter-turn at `lg`, where the flow goes horizontal. */
function FlowArrow({ command, active }: { command: string; active: boolean }) {
  return (
    <li
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center gap-1.5 py-1.5 lg:flex-col lg:gap-1 lg:px-1.5 lg:py-0"
    >
      <span
        className={cn(
          'font-mono text-xs font-bold whitespace-nowrap',
          active ? 'bg-accent px-1.5 py-0.5 text-on-accent' : 'text-foreground-tertiary',
        )}
      >
        {command}
      </span>
      {/* One arrow, turned a quarter-turn for the stacked layout: base.css sets an
          unlayered `svg { display: block }`, which outranks Tailwind's `hidden`
          utility, so swapping two icons by display would leave both on screen. */}
      <ArrowRight
        className={cn('size-4 shrink-0 rotate-90 lg:rotate-0', active ? 'text-accent' : 'text-foreground-tertiary')}
      />
    </li>
  )
}

export interface GitStateChangeProps {
  transition: GitStateTransition
  /** The command doing the moving — labels the hop. */
  command: string
  className?: string
}

/**
 * A single command's move, shown against whichever form tells the truth about
 * it. Feature pages render this and don't choose between the forms.
 *
 * The flow's arrows only ever point forward, so it can only host a move that
 * goes that way: `git add`, `git commit`, `git push`. Lighting up both ends
 * for `git pull` would sit it on three forward arrows and say the opposite of
 * what it does — those get their own hop, with the arrow pointing where the
 * work actually goes. A command that stays put (`git rebase`, `git revert`)
 * lights its one state and highlights no arrow at all.
 */
export function GitStateChange({ transition, command, className }: GitStateChangeProps) {
  const onMainFlow = (id: GitStateId) => stateById.get(id)?.flowOrder !== undefined

  if (transition.from === transition.to && onMainFlow(transition.from)) {
    return <GitStateFlow activeStates={[transition.from]} className={className} />
  }

  const step = flowCommands.find((item) => item.from === transition.from && item.to === transition.to)

  if (step) {
    return (
      <GitStateFlow
        activeStates={[transition.from, transition.to]}
        activeCommand={step.command}
        className={className}
      />
    )
  }

  return (
    <GitStateHop
      from={transition.from}
      to={transition.to}
      command={command}
      destructive={transition.to === 'discarded'}
      className={className}
    />
  )
}

export interface GitStateHopProps {
  from: GitStateId
  to: GitStateId
  command: string
  /** Marks the destination as a place work does not come back from (git clean, git reset --hard). */
  destructive?: boolean
  className?: string
}

/**
 * One move, on its own — for the hops that leave the canonical line
 * (`git stash` into the stash, `git clean` into nothing), where lighting up
 * the main flow would have to invent a box for a state that isn't on it.
 */
export function GitStateHop({ from, to, command, destructive = false, className }: GitStateHopProps) {
  const fromState = stateById.get(from)
  const toState = stateById.get(to)
  if (!fromState || !toState) return null

  return (
    <div className={cn('flex flex-col items-stretch gap-0 sm:flex-row sm:items-center', className)}>
      <div className="flex flex-1 flex-col gap-1 border-2 border-accent bg-surface p-3">
        <Text as="p" variant="body-sm" className="font-bold">
          {fromState.label}
        </Text>
        <Text variant="caption" tone="secondary">
          {fromState.plainEnglish}
        </Text>
      </div>

      <div aria-hidden="true" className="flex shrink-0 items-center justify-center gap-1.5 py-1.5 sm:flex-col sm:gap-1 sm:px-2">
        <span className="bg-accent px-1.5 py-0.5 font-mono text-xs font-bold whitespace-nowrap text-on-accent">{command}</span>
        <ArrowRight className="size-4 shrink-0 rotate-90 text-accent sm:rotate-0" />
      </div>

      <div
        className={cn(
          'flex flex-1 flex-col gap-1 border-2 p-3',
          destructive ? 'border-danger bg-danger-subtle' : 'border-accent bg-card shadow-brutal',
        )}
      >
        <Text as="p" variant="body-sm" className="font-bold">
          {toState.label}
        </Text>
        <Text variant="caption" tone="secondary">
          {toState.plainEnglish}
        </Text>
      </div>
    </div>
  )
}
