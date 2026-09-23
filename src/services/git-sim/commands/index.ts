/**
 * The command table.
 *
 * One module per command, each a pure `(state, parsed) => CommandResult`.
 * Adding a command means adding a file and a line here — the UI never
 * learns its name, because the UI only ever renders events.
 */

import type { ParsedCommand } from '../parse'
import type { CommandResult } from '../result'
import type { RepoState } from '../types'
import { add } from './add'
import { branch } from './branch'
import { checkout } from './checkout'
import { commit } from './commit'
import { diff } from './diff'
import { init } from './init'
import { log } from './log'
import { merge } from './merge'
import { fetch, pull, push, remote } from './remote'
import { reset } from './reset'
import { restore } from './restore'
import { revert } from './revert'
import { status } from './status'
import { switchCommand } from './switch'

export type CommandHandler = (state: RepoState, parsed: ParsedCommand) => CommandResult

export const handlers: Record<string, CommandHandler> = {
  init,
  status,
  add,
  commit,
  log,
  diff,
  branch,
  // `switch` is a reserved word.
  switch: switchCommand,
  checkout,
  merge,
  restore,
  reset,
  revert,
  remote,
  push,
  fetch,
  pull,
}
