import { Check, Lightbulb } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { chipClassName, ChipLink } from '@/components/ui/ChipLink'
import { panelClassName } from '@/components/ui/StatePanel'
import { Text, TextWithCode } from '@/components/ui/Typography'
import { getScenario, scenarios, type ScenarioAction } from '@/content/visualizer/scenarios'
import { meets, progress, type Transition } from '@/services/git-sim'
import { cn } from '@/utils/cn'

export interface ScenarioRailProps {
  /** The scenario being run, or undefined in free play. */
  slug?: string
  history: Transition[]
  onAct: (action: ScenarioAction) => void
}

/** What a step's one-click chip says. */
function actionLabel(action: ScenarioAction): string {
  if ('run' in action) return action.run
  if ('edit' in action) return `Edit ${action.edit}`
  return 'Teammate pushes'
}

/**
 * The scenario rail (Section 28; docs/VISUALIZER.md, Scenarios).
 *
 * In free play it's a row of scenarios to start — a first move already
 * suggested, not an empty screen. In a scenario it shows the step you're
 * on, with its command one click away, and the steps around it.
 *
 * Guided, not gated: anything typed still runs. When it doesn't meet the
 * step, the rail says so quietly and keeps the step. Progress is read off
 * the history, so undoing a step un-does its progress too.
 */
export default function ScenarioRail({ slug, history, onAct }: ScenarioRailProps) {
  const scenario = slug ? getScenario(slug) : undefined
  if (!scenario) {
    return (
      <nav aria-label="Guided scenarios" className="flex flex-wrap items-center gap-2">
        <Text variant="body-sm" className="font-bold">
          Try a guided scenario:
        </Text>
        {scenarios.map((item) => (
          <ChipLink key={item.slug} to={`/visualizer/${item.slug}`}>
            {item.title}
          </ChipLink>
        ))}
      </nav>
    )
  }

  const expectations = scenario.steps.map((step) => step.expect)
  const done = progress(history, expectations)
  const step = scenario.steps[done]
  const last = history[history.length - 1]
  // The last thing that happened didn't move the scenario on: say so, calmly.
  const offScript = step && last !== undefined && progress(history.slice(0, -1), expectations) === done && !meets(last, step.expect)
  const next = scenarios[scenarios.indexOf(scenario) + 1]

  return (
    <section aria-labelledby="scenario-title" className={panelClassName(false, 'flex flex-col gap-3')}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Text as="h2" id="scenario-title" variant="body-sm" className="font-bold">
          {scenario.title}
        </Text>
        <Badge variant={step ? 'neutral' : 'safe'}>
          {step ? `Step ${done + 1} of ${scenario.steps.length}` : 'Done'}
        </Badge>
        <ChipLink to="/visualizer" className="ml-auto">
          Leave scenario
        </ChipLink>
      </div>

      <Text variant="body-sm" tone="secondary">
        {scenario.goal}
      </Text>

      {/* Every step at a glance, on screens with room for it; below lg only
          the current one shows (docs/VISUALIZER.md, Layout). */}
      <ol className="hidden flex-wrap gap-x-4 gap-y-1 lg:flex">
        {scenario.steps.map((item, index) => (
          <li
            key={item.instruction}
            aria-current={index === done ? 'step' : undefined}
            className={cn(
              'flex items-center gap-1.5 text-xs',
              index < done && 'text-foreground-secondary',
              index === done && 'font-bold',
              index > done && 'text-foreground-tertiary',
            )}
          >
            {index < done ? (
              <Check className="size-3.5" aria-label="done" />
            ) : (
              <span className="inline-flex size-4 items-center justify-center rounded-full border-2 border-accent text-[10px]" aria-hidden="true">
                {index + 1}
              </span>
            )}
            <span>
              <TextWithCode>{item.instruction}</TextWithCode>
            </span>
          </li>
        ))}
      </ol>

      {step ? (
        <div className="flex flex-col gap-2 border-t-2 border-accent pt-3">
          <Text variant="body" className="font-bold">
            <TextWithCode>{step.instruction}</TextWithCode>
          </Text>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onAct(step.try)}
              className={chipClassName({ code: 'run' in step.try })}
            >
              {actionLabel(step.try)}
            </button>
            <Text variant="caption" tone="secondary">
              or type it in the console
            </Text>
          </div>
          {offScript && (
            <Text variant="body-sm" tone="secondary" role="status">
              {last.outcome.kind === 'ok' ? 'That works too' : 'Git said no to that'} — the next step is still the one above.
            </Text>
          )}
          <details className="text-body-sm">
            <summary className="inline-flex cursor-pointer items-center gap-1.5 font-semibold">
              <Lightbulb className="size-4" aria-hidden="true" />
              Hint
            </summary>
            <Text variant="body-sm" tone="secondary" className="mt-1">
              <TextWithCode>{step.hint}</TextWithCode>
            </Text>
          </details>
        </div>
      ) : (
        <Alert variant="success" title={scenario.completion.title}>
          <span className="flex flex-col gap-2">
            <span>
              <TextWithCode>{scenario.completion.body}</TextWithCode>
            </span>
            <span className="flex flex-wrap gap-2">
              {next && <ChipLink to={`/visualizer/${next.slug}`}>Next: {next.title}</ChipLink>}
              <ChipLink to="/visualizer">Free play</ChipLink>
            </span>
          </span>
        </Alert>
      )}
    </section>
  )
}

