import { Check, Copy, CornerDownLeft, Eraser, Maximize2, Minimize2 } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { cn } from '@/utils/cn'
import { ScrollX } from './ScrollX'

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
  /** The prompt it ran under, e.g. `project (main) $` — a shell prints the prompt of its moment. */
  prompt?: string
  /** One plain-English line on what it did, printed under the output as a comment. */
  summary?: string
}

export interface CommandConsoleProps {
  entries: ConsoleEntry[]
  onRun: (input: string) => void
  /** Clears the scrollback. Typing `clear` does the same, because people will. */
  onClear?: () => void
  /** One-click commands, shown in the footer. */
  suggestions?: string[]
  /** Whole-input completions for what has been typed so far. Tab (or a tap) takes them. */
  complete?: (input: string) => string[]
  /**
   * What ↑/↓ walk through, oldest first. Defaults to the commands in
   * `entries`; pass it separately when the scrollback can be cleared but
   * what was typed should survive that, as it does in a real shell.
   */
  history?: string[]
  /** The live prompt, e.g. `project (main) $`. */
  prompt?: string
  /** The window's title bar. */
  title?: string
  /** Dim lines at the top of the scrollback, where a shell prints its login banner. */
  banner?: string[]
  /** Offers a button that expands the window to fill the screen (shown below `lg`). */
  expandable?: boolean
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

/**
 * A git-aware prompt, coloured the way shells colour one: the directory,
 * then the branch in parentheses, then `$`. Any string without that shape
 * prints as it is.
 */
function Prompt({ text, failed = false }: { text: string; failed?: boolean }) {
  const match = /^(.*?)(?: \((.+)\))? ?\$$/.exec(text)
  if (!match) return <span className="text-terminal-prompt">{text}</span>
  const [, path, branch] = match
  return (
    <span className="whitespace-nowrap" aria-hidden="true">
      <span className="text-terminal-accent">{path}</span>
      {branch && <span className="text-terminal-prompt"> ({branch})</span>}
      <span className={failed ? 'text-terminal-error' : 'text-terminal-text'}> $</span>
    </span>
  )
}

function Entry({ entry, latest }: { entry: ConsoleEntry; latest: boolean }) {
  const { copied, copy } = useCopyToClipboard()

  if (entry.note) {
    return (
      <li data-latest={latest || undefined} className="wrap-anywhere text-white/60">
        # {entry.input}
      </li>
    )
  }

  return (
    <li data-latest={latest || undefined} className="group flex flex-col gap-0.5">
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 wrap-anywhere text-terminal-text">
          <Prompt text={entry.prompt ?? '$'} failed={entry.failed} /> {entry.input}
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
        <pre className={cn('font-mono whitespace-pre-wrap wrap-anywhere', entry.failed ? 'text-terminal-error' : 'text-terminal-text/85')}>
          {entry.output.join('\n')}
        </pre>
      )}
      {entry.summary && <p className="wrap-anywhere text-terminal-accent"># {entry.summary}</p>}
    </li>
  )
}

/**
 * Makes everything on the page except `keep` (and its ancestors) inert —
 * unreachable by Tab, pointer or screen reader — and returns the undo.
 * Used while the terminal fills the screen: what's behind it can't be
 * seen, so it mustn't be reachable either.
 */
function inertEverythingBut(keep: HTMLElement): () => void {
  const changed: HTMLElement[] = []
  for (let node: HTMLElement | null = keep; node && node !== document.body; node = node.parentElement) {
    for (const sibling of Array.from(node.parentElement?.children ?? [])) {
      if (sibling !== node && sibling instanceof HTMLElement && !sibling.inert) {
        sibling.inert = true
        changed.push(sibling)
      }
    }
  }
  return () => {
    for (const element of changed) element.inert = false
  }
}

/**
 * A terminal window for running simulated commands (Visualizer Section 9).
 *
 * It looks and behaves like one, so it reads as one: macOS window chrome,
 * a single scrollback where each command is followed by what it printed,
 * and the prompt as the last line of it — type, press Enter, and the answer
 * appears right under what you typed. Each entry can carry a `summary`,
 * printed as a `#` comment, so what the command *meant* is where the eye
 * already is, not in a panel elsewhere on the page.
 *
 * Fixed size, always. It docks over whatever it's used with, and anything
 * it does to its own height moves the page under the reader — so running a
 * command scrolls the scrollback, never the window. The footer is one row
 * either way: suggestions, or completions while typing.
 *
 * It knows nothing about Git; prompts, completions, suggestions and
 * summaries are passed in. The scrollback is a `log`, but not a live one:
 * whatever runs the console announces what each command did, and reading
 * the raw output aloud as well would say everything twice.
 */
export function CommandConsole({
  entries,
  onRun,
  onClear,
  suggestions = [],
  complete,
  history,
  prompt = '$',
  title = 'Terminal',
  banner = [],
  label = 'Command',
  placeholder = 'type a command',
  expandable = false,
  className,
}: CommandConsoleProps) {
  const inputId = useId()
  const formId = useId()
  const hintId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  // The dock's height at the moment of expanding, measured before the window leaves it.
  const heldHeight = useRef(0)
  const toggleExpanded = () => {
    if (!expanded) heldHeight.current = rootRef.current?.getBoundingClientRect().height ?? 0
    setExpanded(!expanded)
  }
  const [value, setValue] = useState('')
  // Walking back through history: where we are, and what was being typed before we started.
  const [recall, setRecall] = useState<{ index: number; draft: string } | null>(null)

  const typed = history ?? entries.filter((entry) => !entry.note).map((entry) => entry.input)
  const candidates = value.trim() && complete ? complete(value) : []

  /*
   * After each new entry: show it from its command line if it's taller than
   * the window (a long `git log`), otherwise scroll to the bottom so the
   * prompt is in view too. Before paint, so there's no frame of the old
   * position.
   */
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const latest = el.querySelector<HTMLElement>('[data-latest]')
    const bottom = el.scrollHeight - el.clientHeight
    el.scrollTop = latest ? Math.min(bottom, latest.offsetTop - 8) : 0
  }, [entries.length])

  /*
   * Keep the prompt line in view while typing into a scrolled-up window.
   * By hand, not scrollIntoView(): that scrolls every ancestor, and for an
   * element in a sticky dock it scrolls the *page* toward the dock's in-flow
   * position — the whole page jumped each time Run cleared the line.
   */
  useEffect(() => {
    const el = scrollRef.current
    const line = inputRef.current?.closest('form')
    // Only while typing: when Run clears the line, the new entry's own scroll
    // (above) decides what's in view, and this mustn't undo it.
    if (!value || !el || !line || document.activeElement !== inputRef.current) return
    const bottom = line.offsetTop + line.offsetHeight + 8
    if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight
  }, [value])

  const focusInput = () => inputRef.current?.focus({ preventScroll: true })

  /*
   * Full screen. The window is portalled to <body>: inside the dock it would
   * be trapped in the sticky wrapper's stacking context, below the site
   * header, whatever its z-index. What's typed and the history live in this
   * component's state, so they carry over the move.
   *
   * - Sized to the *visual* viewport, which is the part above an on-screen
   *   keyboard: sized to the layout viewport, the prompt and Run would sit
   *   behind the keyboard on a phone.
   * - The page behind stops scrolling, and becomes inert.
   * - The dock keeps its height while the window is lifted out of it, so the
   *   page behind doesn't reflow (and isn't somewhere else on the way back).
   */
  useLayoutEffect(() => {
    const root = rootRef.current
    const win = windowRef.current
    if (!expanded || !root || !win) return

    root.style.height = `${heldHeight.current}px`
    const html = document.documentElement
    const overflow = html.style.overflow
    html.style.overflow = 'hidden'
    const restoreInert = inertEverythingBut(win)

    const viewport = window.visualViewport
    const fit = () => {
      if (!viewport) return
      // Anchored to the bottom, as a terminal is when its window shrinks: the
      // keyboard coming up must not push the prompt out of view.
      const el = scrollRef.current
      const fromBottom = el ? el.scrollHeight - el.scrollTop - el.clientHeight : 0
      win.style.top = `${viewport.offsetTop}px`
      win.style.height = `${viewport.height}px`
      if (el) el.scrollTop = el.scrollHeight - el.clientHeight - fromBottom
    }
    fit()
    viewport?.addEventListener('resize', fit)
    viewport?.addEventListener('scroll', fit)

    return () => {
      viewport?.removeEventListener('resize', fit)
      viewport?.removeEventListener('scroll', fit)
      win.style.top = ''
      win.style.height = ''
      root.style.height = ''
      html.style.overflow = overflow
      restoreInert()
    }
  }, [expanded])

  // Either way, the window just moved (into <body>, or back into the dock):
  // it's a fresh element, so put the newest lines in view and the caret back.
  const moved = useRef(false)
  useLayoutEffect(() => {
    if (!moved.current) {
      moved.current = true
      return
    }
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
    inputRef.current?.focus({ preventScroll: true })
  }, [expanded])

  const run = (input: string) => {
    const command = input.trim()
    setValue('')
    setRecall(null)
    // Whatever was clicked to get here, typing carries on at the prompt —
    // and on a phone, the keyboard stays up.
    focusInput()
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

  // 32px square at least: a real tap target, unlike the 12px traffic lights.
  const titleButton =
    'inline-flex h-8 min-w-8 items-center justify-center gap-1.5 px-1.5 text-xs text-white/60 transition-colors duration-150 hover:text-terminal-text'

  const chip =
    'inline-flex h-7 shrink-0 items-center border border-white/25 px-2 text-xs whitespace-nowrap text-terminal-text transition-colors duration-150 hover:border-terminal-prompt hover:text-terminal-prompt'

  const terminal = (
    <div
      ref={windowRef}
      role={expanded ? 'dialog' : undefined}
      aria-modal={expanded || undefined}
      aria-label={expanded ? title : undefined}
      onKeyDown={(event) => {
        // Esc on an empty line leaves full screen; with text on the line,
        // the input's own handler clears it first.
        if (event.key === 'Escape' && expanded && !event.defaultPrevented) {
          event.preventDefault()
          setExpanded(false)
        }
      }}
      className={cn(
        'flex flex-col bg-terminal-bg font-mono text-sm',
        expanded
          ? 'fixed inset-x-0 top-0 z-modal h-dvh pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]'
          : 'border-2 border-accent shadow-brutal-sm outline-offset-2 has-[input:focus]:outline-3 has-[input:focus]:outline-accent',
      )}
    >
      {/* Title bar. The traffic lights quote macOS so it reads as "terminal"
          at a glance; they're decorative and do nothing. */}
      <div
        className={cn(
          'grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-white/10 pr-1 pl-3',
          expanded ? 'h-11' : 'h-8',
        )}
      >
        <span className="flex items-center gap-2" aria-hidden="true">
          <span className="size-3 rounded-full bg-terminal-close" />
          <span className="size-3 rounded-full bg-terminal-minimize" />
          <span className="size-3 rounded-full bg-terminal-zoom" />
        </span>
        <p className="truncate px-2 text-center text-xs text-white/60">{title}</p>
        <span className="flex items-center justify-self-end">
          {onClear && (
            <button
              type="button"
              onClick={() => {
                onClear()
                focusInput()
              }}
              disabled={entries.length === 0}
              className={cn(titleButton, 'disabled:opacity-40')}
            >
              <Eraser className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Clear</span>
              <span className="sr-only sm:hidden">Clear</span>
            </button>
          )}
          {/* Full screen is for small screens, where the docked window is
              small; on a wide one there's no need. Always shown once
              expanded, so nobody is stranded in it by a resize. */}
          {expandable && (
            <button
              type="button"
              onClick={toggleExpanded}
              aria-pressed={expanded}
              aria-label={expanded ? 'Exit full screen' : 'Expand terminal to full screen'}
              className={cn(titleButton, !expanded && 'lg:hidden')}
            >
              {expanded ? <Minimize2 className="size-4" aria-hidden="true" /> : <Maximize2 className="size-4" aria-hidden="true" />}
            </button>
          )}
        </span>
      </div>

      {/* The window. Fixed height: running a command scrolls this, never the page.
          A click anywhere in it puts you at the prompt — unless you were selecting text. */}
      <div
        ref={scrollRef}
        onClick={() => {
          if (!window.getSelection()?.toString()) focusInput()
        }}
        className={cn(
          'relative cursor-text overflow-y-auto overscroll-contain px-3 py-2',
          expanded ? 'min-h-0 flex-1' : 'h-40 sm:h-52 [@media(max-height:32rem)]:h-24',
        )}
      >
        <div role="log" aria-live="off" aria-label="Command history" className="flex flex-col gap-2.5">
          {banner.length > 0 && (
            <div className="text-white/60">
              {banner.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}
          <ol className="flex flex-col gap-2.5">
            {entries.map((entry, index) => (
              <Entry key={entry.id} entry={entry} latest={index === entries.length - 1} />
            ))}
          </ol>
        </div>

        <form
          id={formId}
          className="mt-2.5 flex items-baseline gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            run(value)
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            {label}
          </label>
          <Prompt text={prompt} />
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
            // No box round a terminal line: the window takes the focus ring
            // (data-focus-ring, base.css) and the caret marks the spot.
            // 16px below `sm`: anything smaller and mobile Safari zooms on focus.
            className="min-w-0 flex-1 bg-transparent text-base text-terminal-text caret-terminal-prompt placeholder:text-white/35 sm:text-sm"
            data-focus-ring="container"
          />
        </form>
      </div>

      {/* Footer: always one row. Completions while typing (tap or Tab to take
          one), the commands that make sense next otherwise, and Run. */}
      <div id={hintId} className="flex h-11 shrink-0 items-center gap-2 border-t border-white/10 pr-1.5 pl-3">
        <ScrollX label={candidates.length > 0 ? 'Completions' : 'Suggested commands'} className="min-w-0 flex-1">
          <div className="flex w-max items-center gap-2 py-1" role="group" aria-label={candidates.length > 0 ? 'Completions' : 'Suggested commands'}>
            {candidates.length > 0 ? (
              <>
                <span className="text-xs text-white/60">Tab</span>
                {candidates.slice(0, 6).map((candidate) => (
                  <button
                    key={candidate}
                    type="button"
                    onClick={() => {
                      setValue(candidate)
                      focusInput()
                    }}
                    className={cn(chip, 'text-terminal-accent')}
                  >
                    {candidate.trim()}
                  </button>
                ))}
              </>
            ) : suggestions.length > 0 ? (
              <>
                <span className="text-xs text-white/60">Try</span>
                {suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => run(suggestion)} className={chip}>
                    {suggestion}
                  </button>
                ))}
              </>
            ) : (
              <span className="text-xs text-white/60">↑/↓ history · Tab completes · Esc clears the line</span>
            )}
          </div>
        </ScrollX>
        <button
          type="submit"
          form={formId}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 border-2 border-terminal-prompt bg-terminal-prompt px-3 text-xs font-bold text-terminal-bg transition-colors duration-150 hover:bg-transparent hover:text-terminal-prompt"
        >
          Run
          <CornerDownLeft className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )

  return (
    // The page-coloured band above the dock gives whatever scrolls behind it
    // a clean edge, instead of the stage running straight into the window.
    <div ref={rootRef} className={cn('z-10 bg-background pt-3', className)}>
      {/* While the prompt has focus the window takes the page's focus outline,
          since the input inside draws none of its own. Expanded, it's the
          whole screen, so neither border nor outline has anywhere to go. */}
      {expanded ? createPortal(terminal, document.body) : terminal}
    </div>
  )
}
