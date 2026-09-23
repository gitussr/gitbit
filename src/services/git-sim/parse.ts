/**
 * Turning what someone typed into something the engine can run.
 *
 * Parsing only asks "is this a git command, and what are its parts?" —
 * never "will it work?". That second question needs the repository state
 * and lives in `validate.ts`.
 */

import { parseError, type ParseError } from './result'

export interface ParsedCommand {
  input: string
  /** The subcommand, e.g. `add`. */
  name: string
  /** The content key, e.g. `git-add` — how the Explainer finds the existing GitBit entry for this command. */
  slug: string
  args: string[]
  /** `--oneline` → `true`; `-m "msg"` and `--key=value` → the value. */
  flags: Record<string, string | true>
}

/** Commands the engine runs today. */
export const IMPLEMENTED = new Set(['init', 'status', 'add', 'commit', 'log', 'diff', 'branch', 'switch', 'checkout', 'merge', 'restore', 'reset', 'revert', 'remote', 'push', 'fetch', 'pull'])

/**
 * Real Git commands the Visualizer will get to, mapped to the brief's
 * Section 7 phases. Knowing a command exists but isn't simulated yet is
 * worth the few lines: "not simulated yet" is a truthful answer, and
 * "not a git command" would be a wrong one.
 */
const PLANNED: Record<string, string> = {
  clone: 'remotes (the simulator starts local and adds one)',
  stash: 'setting work aside',
  clean: 'setting work aside',
  rebase: 'rewriting history',
  'cherry-pick': 'rewriting history',
  tag: 'rewriting history',
  reflog: 'rewriting history',
}

/** Short flags that swallow the next token as their value: `-m "msg"`, `switch -c name`, `checkout -b name`. */
const VALUE_FLAGS = new Set(['m', 'c', 'b'])

function tokenize(input: string): string[] | null {
  const tokens: string[] = []
  let current = ''
  let quote: '"' | "'" | null = null
  let started = false

  for (const char of input) {
    if (quote) {
      if (char === quote) quote = null
      else current += char
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      // An empty quoted string is still an argument — `git commit -m ""`.
      started = true
      continue
    }

    if (/\s/.test(char)) {
      if (started) tokens.push(current)
      current = ''
      started = false
      continue
    }

    current += char
    started = true
  }

  if (quote) return null
  if (started) tokens.push(current)
  return tokens
}

export function parse(input: string): ParsedCommand | ParseError {
  const tokens = tokenize(input)

  if (tokens === null) {
    return parseError(
      'Unmatched quote.',
      'A quoted message needs a closing quote — try `git commit -m "your message"`.',
    )
  }

  if (tokens.length === 0) {
    return parseError('Nothing to run.', 'Type a git command, or pick one of the suggestions.')
  }

  if (tokens[0] !== 'git') {
    return parseError(
      'GitBit Visualizer only runs git commands.',
      `This is a Git simulator, not a shell — \`${tokens[0]}\` won't do anything here. Try \`git status\`.`,
    )
  }

  const name = tokens[1]

  if (!name) {
    return parseError('usage: git <command> [<args>]', '`git` on its own needs something to do. Try `git status`.')
  }

  if (!IMPLEMENTED.has(name)) {
    const phase = PLANNED[name]
    if (phase) {
      return parseError(
        `\`git ${name}\` isn't simulated yet.`,
        `It's a real command, and it arrives with ${phase}. For now the simulator knows ${[...IMPLEMENTED].map((c) => `\`git ${c}\``).join(', ')}.`,
      )
    }

    return parseError(
      `git: '${name}' is not a git command. See 'git --help'.`,
      'Git says this when it doesn’t recognise the word after `git` — usually a typo.',
    )
  }

  const args: string[] = []
  const flags: Record<string, string | true> = {}
  const rest = tokens.slice(2)

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i]

    if (token.startsWith('--')) {
      const [key, ...value] = token.slice(2).split('=')
      flags[key] = value.length > 0 ? value.join('=') : true
      continue
    }

    // A bare `-` is a real Git argument (stdin); not a flag.
    if (token.startsWith('-') && token.length > 1) {
      for (const short of token.slice(1)) {
        if (VALUE_FLAGS.has(short)) {
          const value = rest[i + 1]
          flags[short] = value === undefined ? true : value
          if (value !== undefined) i += 1
        } else {
          flags[short] = true
        }
      }
      continue
    }

    args.push(token)
  }

  return { input, name, slug: `git-${name}`, args, flags }
}
