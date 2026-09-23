import { Check, Copy, Eraser } from 'lucide-react'
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
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLOListElement>(null)
  const [value, setValue] = useState('')
  // Walking back through history: where we are, and what was being typed before we started.
  const [recall, setRecall] = useState<{ index: number; draft: string } | null>(null)

  const typed = history ?? entries.filter((entry) => !entry.note).map((entry) => entry.input)
  const candidates = value.trim() && complete ? complete(value) : []

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [entries.length])

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

  return (
    <div className={cn('flex flex-col border-2 border-accent bg-terminal-bg font-mono text-sm', className)}>
      <div className="flex items-center justify-between gap-2 border-b border-white/10 py-1 pr-1 pl-3">
        <p className="text-xs tracking-wide text-white/55 uppercase">Console</p>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            disabled={entries.length === 0}
            className="inline-flex h-7 items-center gap-1.5 px-2 text-xs text-white/55 transition-colors duration-150 hover:text-terminal-text disabled:opacity-40"
          >
            <Eraser className="size-3.5" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      {entries.length > 0 && (
        <ol
          ref={logRef}
          role="log"
          aria-live="off"
          aria-label="Command history"
          className="flex max-h-28 flex-col gap-2 overflow-y-auto px-3 py-2.5 sm:max-h-40"
        >
          {entries.map((entry) => (
            <Entry key={entry.id} entry={entry} />
          ))}
        </ol>
      )}

      <form
        className="flex items-center gap-2 border-t border-white/10 px-3 py-2"
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
          className="h-8 min-w-0 flex-1 bg-transparent text-terminal-text placeholder:text-white/35"
        />
        <button
          type="submit"
          className="h-8 shrink-0 border-2 border-terminal-prompt px-3 text-xs font-bold text-terminal-prompt transition-colors duration-150 hover:bg-terminal-prompt hover:text-terminal-bg"
        >
          Run
        </button>
      </form>

      <div
        id={hintId}
        // Below `sm` the key legend is hidden (no hardware keyboard to use it
        // with), so the row only takes space when there's a completion to show.
        className={cn(
          'min-h-7 flex-wrap items-center gap-x-3 gap-y-1 px-3 pb-2 text-xs text-white/55',
          candidates.length > 0 ? 'flex' : 'hidden sm:flex',
        )}
      >
        {candidates.length > 0 ? (
          <>
            <span className="inline-flex items-center gap-1.5">
              <Kbd className="border-white/30 bg-transparent text-white/70">Tab</Kbd>
              {candidates.length === 1 ? 'completes' : 'fills in; options:'}
            </span>
            {candidates.slice(0, 4).map((candidate) => (
              <span key={candidate} className="text-terminal-accent">
                {candidate.trim()}
              </span>
            ))}
          </>
        ) : (
          <span>
            <Kbd className="border-white/30 bg-transparent text-white/70">↑</Kbd>{' '}
            <Kbd className="border-white/30 bg-transparent text-white/70">↓</Kbd> history ·{' '}
            <Kbd className="border-white/30 bg-transparent text-white/70">Tab</Kbd> complete ·{' '}
            <Kbd className="border-white/30 bg-transparent text-white/70">Esc</Kbd> clear line
          </span>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-white/10 px-3 py-2.5" role="group" aria-label="Suggested commands">
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
              className="border border-white/25 px-2 py-1 text-xs text-terminal-text transition-colors duration-150 hover:border-terminal-prompt hover:text-terminal-prompt"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
