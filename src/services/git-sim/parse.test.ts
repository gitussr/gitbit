import { describe, expect, it } from 'vitest'
import { parse } from './parse'
import type { ParsedCommand } from './parse'

/** Parsing succeeded — narrows the union and fails loudly if it didn't. */
function parsed(input: string): ParsedCommand {
  const result = parse(input)
  if ('kind' in result) throw new Error(`expected \`${input}\` to parse, got: ${result.message}`)
  return result
}

describe('parse', () => {
  it('splits a command into name, args and slug', () => {
    expect(parsed('git add index.html')).toMatchObject({
      name: 'add',
      slug: 'git-add',
      args: ['index.html'],
    })
  })

  it('keeps a quoted commit message in one piece', () => {
    expect(parsed('git commit -m "Add the homepage"').flags.m).toBe('Add the homepage')
  })

  it('accepts single quotes too', () => {
    expect(parsed("git commit -m 'Add the homepage'").flags.m).toBe('Add the homepage')
  })

  it('reads an empty quoted message as empty, not missing', () => {
    expect(parsed('git commit -m ""').flags.m).toBe('')
  })

  it('reports an unclosed quote instead of guessing', () => {
    expect(parse('git commit -m "oops')).toMatchObject({ kind: 'parse-error' })
  })

  it('treats long flags as switches, or as values with =', () => {
    expect(parsed('git log --oneline').flags.oneline).toBe(true)
    expect(parsed('git diff --staged').flags.staged).toBe(true)
  })

  it('refuses input that is not a git command', () => {
    const result = parse('ls -la')
    expect(result).toMatchObject({ kind: 'parse-error' })
    expect((result as { why: string }).why).toContain('not a shell')
  })

  it('says a real-but-unsimulated command is coming, not that it is unknown', () => {
    const result = parse('git rebase main')
    expect(result).toMatchObject({ kind: 'parse-error' })
    expect((result as { message: string }).message).toContain("isn't simulated yet")
  })

  it("uses Git's own wording for a command that does not exist", () => {
    expect(parse('git comit')).toMatchObject({
      kind: 'parse-error',
      message: "git: 'comit' is not a git command. See 'git --help'.",
    })
  })
})
