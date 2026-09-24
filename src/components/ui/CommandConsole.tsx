import { Check, ChevronUp, Copy, CornerDownLeft, Eraser } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { cn } from '@/utils/cn'
import { Kbd } from './Kbd'

export interface ConsoleEntry {
  id: string | number
  /** What was typed — or, for a note, what happened outside the console. */
  input: string
  /** The lines the command printed. */
  output?: string[]
  /** The command was refused. Styled as a lesson, not an alarm. */
  failed?: boolean
  /** Not a command: something that changed the same state from elsewhere (e.g. editing a file). */
  note?: boolean
}

export interface CommandConsoleProps {
  entries: ConsoleEntry[]
  onRun: (input: string) => void
  /** Clears the scrollback. Typing `clear` does the same, because people will. */
  onClear?: () => void
  /** One-click commands, shown as chips under the input. */
  suggestions?: string[]
  /** Whole-input completions for what has been typed so far. Tab takes them. */
  complete?: (input: string) => string[]
  /**
   * What ↑/↓ walk through, oldest first. Defaults to the commands in
   * `entries`; pass it separately when the scrollback can be cleared but
   * what was typed should survive that, as it does in a real shell.
   */
  history?: string[]
  label?: string
  placeholder?: string
  className?: string
}

/** How far Tab can fill when the candidates disagree — the way a shell does it. */
function commonPrefix(input: string, candidates: string[]): string {
  let prefix = candidates[0] ?? input
  for (const candidate of candidates.slice(1)) {
    let i = 0
    while (i < prefix.length && prefix[i] === candidate[i]) i += 1
    prefix = prefix.slice(0, i)
  }
  return prefix.length > input.length ? prefix : input
}

function Entry({ entry }: { entry: ConsoleEntry }) {
  const { copied, copy } = useCopyToClipboard()

  if (entry.note) {
    return <li className="text-white/55 wrap-anywhere"># {entry.input}</li>
  }

  return (
    <li className="group flex flex-col gap-0.5">
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 wrap-anywhere text-terminal-text">
          <span className={entry.failed ? 'text-terminal-error' : 'text-terminal-prompt'} aria-hidden="true">
            $
          </span>{' '}
          {entry.input}
          {entry.failed && <span className="sr-only"> (refused)</span>}
        </p>
        {/* Always visible below `sm`, where there's no hover to reveal it. */}
        <button
          type="button"
          onClick={() => copy(entry.input)}
          aria-label={copied ? 'Copied' : `Copy ${entry.input}`}
          className="inline-flex size-6 shrink-0 items-center justify-center text-white/55 transition-opacity duration-150 hover:text-terminal-text focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        </button>
      </div>
      {entry.output && entry.output.length > 0 && (
        <pre
          className={cn(
            'font-mono whitespace-pre-wrap wrap-anywhere',
            entry.failed ? 'text-terminal-error' : 'text-terminal-text/80',
          )}
        >
          {entry.output.join('\n')}
        </pre>
      )}
    </li>
  )
}

/**
 * A console for running simulated commands (Visualizer Section 9).
 *
 * Terminal-inspired, not a terminal: it keeps the parts of a shell that
 * help someone learn — Enter to run, ↑/↓ through what you've typed, Tab to
 * complete, a scrollback of what Git said — and drops the rest. It knows
 * nothing about Git; what counts as a completion or a suggestion is passed
 * in.
 *
 * The scrollback is a `log`, but not a live one: whatever runs the console
 * already announces what each command *did*, and reading Git's raw output
 * aloud on top of that would say everything twice.
 *
 * It docks over whatever it's used with, so it stays small: collapsed, the
 * scrollback shows only the last command and what it printed, and the whole
 * history opens on request. A console that grows with every command ends up
 * covering the thing the commands are changing.
 */
export function CommandConsole({
  entries,
  onRun,
  onClear,
  suggestions = [],
  complete,
  history,
  label = 'Command',
  placeholder = 'git status',
  className,
}: CommandConsoleProps) {
  const inputId = useId()
  const hintId = useId()
  const logId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLOListElement>(null)
  const [value, setValue] = useState('')
  // Walking back through history: where we are, and what was being typed before we started.
  const [recall, setRecall] = useState<{ index: number; draft: string } | null>(null)
  const [expanded, setExpanded] = useState(false)

  const typed = history ?? entries.filter((entry) => !entry.note).map((entry) => entry.input)
  const candidates = value.trim() && complete ? complete(value) : []
  const visible = expanded ? entries : entries.slice(-1)
  const commandCount = entries.filter((entry) => !entry.note).length

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [entries.length, expanded])

  const run = (input: string) => {
    const command = input.trim()
    setValue('')
    setRecall(null)
    if (!command) return
    if (command === 'clear' && onClear) onClear()
    else onRun(command)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp' && typed.length > 0) {
      event.preventDefault()
      const index = recall ? Math.max(0, recall.index - 1) : typed.length - 1
      setRecall({ index, draft: recall?.draft ?? value })
      setValue(typed[index])
    } else if (event.key === 'ArrowDown' && recall) {
      event.preventDefault()
      const index = recall.index + 1
      if (index < typed.length) {
        setRecall({ ...recall, index })
        setValue(typed[index])
      } else {
        setRecall(null)
        setValue(recall.draft)
      }
    } else if (event.key === 'Tab' && !event.shiftKey && candidates.length > 0) {
      // Only take Tab when it will change something — otherwise it moves focus
      // as usual, so the console can never hold keyboard focus hostage.
      const next = candidates.length === 1 ? candidates[0] : commonPrefix(value, candidates)
      if (next !== value) {
        event.preventDefault()
        setValue(next)
      }
    } else if (event.key === 'Escape' && value) {
      event.preventDefault()
      setValue('')
      setRecall(null)
    }
  }

  const legendKey = 'border-white/30 bg-transparent text-white/70'

  return (
    // The page-coloured band above the dock gives whatever scrolls behind it
    // a clean edge, instead of the stage running straight into the console.
    <div className={cn('z-10 bg-background pt-3', className)}>
      <div className="flex flex-col border-2 border-accent bg-terminal-bg font-mono text-sm shadow-brutal-sm">
        <div className="flex items-center gap-2 border-b border-white/10 py-1 pr-1 pl-1.5">
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            disabled={entries.length < 2}
            aria-expanded={expanded}
            aria-controls={logId}
            className="inline-flex h-7 min-w-0 items-center gap-1.5 px-1.5 text-xs text-white/70 transition-colors duration-150 hover:text-terminal-text disabled:cursor-default disabled:hover:text-white/70"
          >
            <ChevronUp
              className={cn(
                'size-3.5 shrink-0 transition-transform duration-150',
                expanded && 'rotate-180',
                entries.length < 2 && 'opacity-0',
              )}
              aria-hidden="true"
            />
            <span className="truncate">
              {commandCount === 0
                ? 'Console'
                : expanded
                  ? 'Hide history'
                  : `History · ${commandCount} ${commandCount === 1 ? 'command' : 'commands'}`}
            </span>
          </button>

          <span className="ml-auto hidden items-center gap-1 text-xs whitespace-nowrap text-white/45 lg:inline-flex">
            <Kbd className={legendKey}>↑</Kbd>
            <Kbd className={legendKey}>↓</Kbd> history · <Kbd className={legendKey}>Tab</Kbd> complete ·{' '}
            <Kbd className={legendKey}>Esc</Kbd> clear line
          </span>

          {onClear && (
            <button
              type="button"
              onClick={() => {
                onClear()
                setExpanded(false)
              }}
              disabled={entries.length === 0}
              className="ml-auto inline-flex h-7 shrink-0 items-center gap-1.5 px-2 text-xs text-white/55 transition-colors duration-150 hover:text-terminal-text disabled:opacity-40 lg:ml-0"
            >
              <Eraser className="size-3.5" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>

        {entries.length > 0 && (
          <ol
            ref={logRef}
            id={logId}
            role="log"
            aria-live="off"
            aria-label={expanded ? 'Command history' : 'Last command'}
            className={cn(
              'flex flex-col gap-2 overflow-y-auto overscroll-contain px-3 py-2',
              expanded ? 'max-h-[45vh]' : 'max-h-16 sm:max-h-24',
            )}
          >
            {visible.map((entry) => (
              <Entry key={entry.id} entry={entry} />
            ))}
          </ol>
        )}

        <form
          className="flex items-center gap-2 border-t border-white/10 px-3 py-1.5"
          onSubmit={(event) => {
            event.preventDefault()
            run(value)
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            {label}
          </label>
          <span className="select-none text-terminal-prompt" aria-hidden="true">
            $
          </span>
          <input
            ref={inputRef}
            id={inputId}
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              setRecall(null)
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-describedby={hintId}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            // 16px below `sm`: anything smaller and mobile Safari zooms the page on focus.
            className="h-11 min-w-0 flex-1 bg-transparent text-base text-terminal-text placeholder:text-white/35 sm:text-sm"
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 border-2 border-terminal-prompt bg-terminal-prompt px-3 text-xs font-bold text-terminal-bg transition-colors duration-150 hover:bg-transparent hover:text-terminal-prompt disabled:border-white/25 disabled:bg-transparent disabled:text-white/40"
          >
            Run
            <CornerDownLeft className="size-3.5" aria-hidden="true" />
          </button>
        </form>

        {/* One row, two jobs: while typing it offers completions (Tab takes
            them); otherwise it offers the commands that make sense next. */}
        <div id={hintId} className="border-t border-white/10 px-3 py-2">
          {candidates.length > 0 ? (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/55">
              <span className="inline-flex items-center gap-1.5">
                <Kbd className={legendKey}>Tab</Kbd>
                {candidates.length === 1 ? 'completes' : 'fills in; options:'}
              </span>
              {candidates.slice(0, 4).map((candidate) => (
                <span key={candidate} className="text-terminal-accent">
                  {candidate.trim()}
                </span>
              ))}
            </p>
          ) : suggestions.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Suggested commands">
              <span className="text-xs text-white/45">Try</span>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    run(suggestion)
                    // The chip that was clicked is usually replaced by the next set
                    // of suggestions; without this, focus falls to <body>.
                    inputRef.current?.focus()
                  }}
                  className="min-h-8 border border-white/25 px-2 py-1 text-left text-xs text-terminal-text transition-colors duration-150 hover:border-terminal-prompt hover:text-terminal-prompt"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/45">Type a Git command and press Enter.</p>
          )}
        </div>
      </div>
    </div>
  )
}
