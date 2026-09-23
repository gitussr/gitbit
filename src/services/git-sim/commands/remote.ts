import type { GitEvent } from '../events'
import type { ParsedCommand } from '../parse'
import { aheadBehind, contains, currentBranch, headCommitId } from '../repo'
import { gitError, ok, type CommandResult, type GitError } from '../result'
import type { BranchName, Commit, CommitId, RemoteState, RepoState } from '../types'
import { merge } from './merge'

const noRemote = (name: string): GitError =>
  gitError(
    `fatal: '${name}' does not appear to be a git repository\nfatal: Could not read from remote repository.`,
    'There is no remote yet — a repository starts with none. Connect one first: `git remote add origin <url>`.',
  )

/** Every commit reachable from `tip` in `from` that `into` doesn't have yet — what crosses the boundary. */
function missing(from: Record<CommitId, Commit>, into: Record<CommitId, Commit>, tip: CommitId): Commit[] {
  const found: Commit[] = []
  const seen = new Set<CommitId>()
  const stack = [tip]
  while (stack.length > 0) {
    const id = stack.pop() as CommitId
    // A commit the other side already has brings its whole history with it.
    if (seen.has(id) || id in into || !from[id]) continue
    seen.add(id)
    found.push(from[id])
    stack.push(...from[id].parents)
  }
  return found.sort((a, b) => b.order - a.order)
}

/**
 * `git remote` — naming another repository.
 *
 * `git remote add origin <url>` doesn't send or fetch anything. It writes
 * down a name and an address. "origin" is only a convention: the name of
 * the remote you started from.
 */
export function remote(state: RepoState, parsed: ParsedCommand): CommandResult {
  const [action, name, url] = parsed.args

  if (action === undefined) {
    const lines = state.remote
      ? parsed.flags.v === true || parsed.flags.verbose === true
        ? [`${state.remote.name}\t${state.remote.url} (fetch)`, `${state.remote.name}\t${state.remote.url} (push)`]
        : [state.remote.name]
      : []
    return {
      state,
      events: [{ type: 'NOTHING_HAPPENED', reason: lines.length > 0 ? '`git remote` only lists.' : 'There are no remotes yet. `git remote add origin <url>` connects one.' }],
      outcome: ok(lines),
    }
  }

  if (action !== 'add') {
    return {
      state,
      events: [],
      outcome: gitError(`error: unknown subcommand: \`${action}'`, 'The simulator knows `git remote`, `git remote -v`, and `git remote add <name> <url>`.'),
    }
  }

  if (!name || !url) {
    return {
      state,
      events: [],
      outcome: gitError('usage: git remote add <name> <url>', 'Give it a name and an address: `git remote add origin https://example.com/you/project.git`.'),
    }
  }

  if (state.remote) {
    return {
      state,
      events: [],
      outcome: gitError(
        `error: remote ${name} already exists.`,
        `This repository already has a remote called \`${state.remote.name}\`. The simulator connects one remote at a time.`,
      ),
    }
  }

  const connected: RemoteState = { name, url, branches: {}, commits: {} }
  return {
    state: { ...state, remote: connected },
    events: [{ type: 'REMOTE_ADDED', name, url }],
    outcome: ok([]),
  }
}

/**
 * `git push` — sending your commits to the remote (Section 22).
 *
 * Push copies the commits the remote doesn't have, then moves the
 * remote's branch to your commit. It only ever moves that branch
 * *forward*: if the remote has commits you don't, Git refuses rather than
 * throw them away, and the fix is to bring them in first (`git pull`).
 */
export function push(state: RepoState, parsed: ParsedCommand): CommandResult {
  const [remoteName = state.remote?.name ?? 'origin', named] = parsed.args
  if (!state.remote || state.remote.name !== remoteName) return { state, events: [], outcome: noRemote(remoteName) }
  const origin = state.remote

  const branch: BranchName | null = named ?? currentBranch(state)
  if (branch === null) {
    return {
      state,
      events: [],
      outcome: gitError('fatal: You are not currently on a branch.', 'HEAD is detached, so there is no branch to push. Name one: `git push origin main`.'),
    }
  }

  const setUpstream = parsed.flags.u === true || parsed.flags['set-upstream'] === true
  const tracked = state.upstreams[branch]
  if (!named && parsed.args.length === 0 && !tracked && !setUpstream) {
    return {
      state,
      events: [],
      outcome: gitError(
        `fatal: The current branch ${branch} has no upstream branch.\nTo push the current branch and set the remote as upstream, use\n\n    git push --set-upstream ${origin.name} ${branch}\n`,
        `Git doesn't yet know which branch on the remote \`${branch}\` goes to. \`-u\` tells it once, and from then on \`git push\` alone is enough.`,
      ),
    }
  }

  const local = state.branches[branch]
  if (local === undefined) {
    return {
      state,
      events: [],
      outcome: gitError(`error: src refspec ${branch} does not match any`, `There is no local branch \`${branch}\` with commits to send.`),
    }
  }

  const theirs = origin.branches[branch] ?? null
  if (theirs === local) {
    return {
      state,
      events: [{ type: 'NOTHING_HAPPENED', reason: `The remote's ${branch} already points where yours does.` }],
      outcome: ok(['Everything up-to-date']),
    }
  }

  if (theirs !== null && !contains(state, local, theirs)) {
    const unknown = !(theirs in state.commits)
    return {
      state,
      events: [],
      outcome: gitError(
        [
          `To ${origin.url}`,
          ` ! [rejected]        ${branch} -> ${branch} (${unknown ? 'fetch first' : 'non-fast-forward'})`,
          `error: failed to push some refs to '${origin.url}'`,
          unknown
            ? 'hint: Updates were rejected because the remote contains work that you do not\nhint: have locally. Integrate the remote changes (e.g. \'git pull ...\') before pushing again.'
            : 'hint: Updates were rejected because the tip of your current branch is behind\nhint: its remote counterpart. Integrate the remote changes (e.g. \'git pull ...\') before pushing again.',
        ].join('\n'),
        `The remote's ${branch} has commits yours doesn't. Pushing would move it past them and they'd be lost, so Git refuses. \`git pull\` brings them in; then push again.`,
      ),
    }
  }

  const sent = missing(state.commits, origin.commits, local)
  const commits = { ...origin.commits }
  for (const commit of sent) commits[commit.id] = commit

  const trackingRef = `${origin.name}/${branch}`
  const next: RepoState = {
    ...state,
    remote: { ...origin, commits, branches: { ...origin.branches, [branch]: local } },
    remoteBranches: { ...state.remoteBranches, [trackingRef]: local },
    upstreams: setUpstream ? { ...state.upstreams, [branch]: trackingRef } : state.upstreams,
  }

  return {
    state: next,
    events: [
      {
        type: 'REMOTE_UPDATED',
        direction: 'push',
        remote: origin.name,
        branch,
        from: theirs,
        to: local,
        commits: sent.map((commit) => commit.id).reverse(),
      },
    ],
    outcome: ok([
      `To ${origin.url}`,
      theirs === null ? ` * [new branch]      ${branch} -> ${branch}` : `   ${theirs}..${local}  ${branch} -> ${branch}`,
      ...(setUpstream ? [`branch '${branch}' set up to track '${trackingRef}'.`] : []),
    ]),
  }
}

/** The part of fetch that `pull` shares: bring every remote branch's commits here and move the tracking refs. */
function fetchAll(state: RepoState, origin: RemoteState): { state: RepoState; events: GitEvent[]; lines: string[] } {
  const commits = { ...state.commits }
  const remoteBranches = { ...state.remoteBranches }
  const events: GitEvent[] = []
  const lines: string[] = []

  for (const branch of Object.keys(origin.branches).sort()) {
    const tip = origin.branches[branch]
    const ref = `${origin.name}/${branch}`
    const before = remoteBranches[ref] ?? null
    if (before === tip) continue

    const arrived = missing(origin.commits, commits, tip)
    for (const commit of arrived) commits[commit.id] = commit
    remoteBranches[ref] = tip
    events.push({
      type: 'REMOTE_UPDATED',
      direction: 'fetch',
      remote: origin.name,
      branch,
      from: before,
      to: tip,
      commits: arrived.map((commit) => commit.id).reverse(),
    })
    lines.push(before === null ? ` * [new branch]      ${branch}       -> ${ref}` : `   ${before}..${tip}  ${branch}       -> ${ref}`)
  }

  return { state: { ...state, commits, remoteBranches }, events, lines: lines.length > 0 ? [`From ${origin.url}`, ...lines] : [] }
}

/**
 * `git fetch` — finding out what the remote has, without touching your work.
 *
 * It copies the remote's new commits into your repository and moves your
 * remote-tracking refs (`origin/main`) to match. Your branches, your
 * Staging Area and your files don't change at all. That's the whole
 * difference from `pull`: fetch is always safe.
 */
export function fetch(state: RepoState, parsed: ParsedCommand): CommandResult {
  const [remoteName = state.remote?.name ?? 'origin'] = parsed.args
  if (!state.remote || state.remote.name !== remoteName) return { state, events: [], outcome: noRemote(remoteName) }

  const fetched = fetchAll(state, state.remote)
  if (fetched.events.length === 0) {
    return {
      state,
      events: [{ type: 'NOTHING_HAPPENED', reason: `${state.remote.name} has nothing you haven't already fetched.` }],
      outcome: ok([]),
    }
  }
  return { state: fetched.state, events: fetched.events, outcome: ok(fetched.lines) }
}

/**
 * `git pull` — `git fetch`, then `git merge` of the branch you track.
 *
 * Two commands in one, and seeing them as two is the lesson: the fetch is
 * safe and always works; the merge is an ordinary merge, which can fast-
 * forward, make a merge commit, or stop for conflicts.
 */
export function pull(state: RepoState, parsed: ParsedCommand): CommandResult {
  const [remoteName = state.remote?.name ?? 'origin', named] = parsed.args
  if (!state.remote || state.remote.name !== remoteName) return { state, events: [], outcome: noRemote(remoteName) }

  const branch = currentBranch(state)
  const trackingRef = named ? `${remoteName}/${named}` : branch ? state.upstreams[branch] : undefined
  if (!trackingRef) {
    return {
      state,
      events: [],
      outcome: gitError(
        `There is no tracking information for the current branch.\nPlease specify which branch you want to merge with.\n\n    git pull ${remoteName} <branch>\n`,
        `\`git pull\` merges the remote branch yours follows, and ${branch ?? 'this'} doesn't follow one yet. \`git push -u\` sets that up, or name it: \`git pull ${remoteName} main\`.`,
      ),
    }
  }

  const fetched = fetchAll(state, state.remote)
  if (!(trackingRef in fetched.state.remoteBranches)) {
    return {
      state,
      events: [],
      outcome: gitError(`fatal: couldn't find remote ref ${trackingRef.split('/').slice(1).join('/')}`, `The remote has no branch \`${trackingRef}\` yet.`),
    }
  }

  const merged = merge(fetched.state, { ...parsed, name: 'merge', slug: 'git-merge', args: [trackingRef], flags: {} })
  if (merged.outcome.kind !== 'ok') {
    // Real Git would keep the fetch half. The simulator keeps one rule
    // everywhere — a refused command changes nothing — and says so.
    return {
      state,
      events: [],
      outcome: gitError(
        merged.outcome.message,
        `${merged.outcome.why} (Real Git would still have done the fetch half; here, a refused command changes nothing, so run \`git fetch\` on its own to see what arrived.)`,
      ),
    }
  }

  return {
    state: merged.state,
    events: [...fetched.events, ...merged.events],
    outcome: ok([...fetched.lines, ...merged.outcome.output]),
  }
}

/** Ahead/behind for `git status`, when the branch follows something. */
export function trackingLines(state: RepoState): string[] {
  const branch = currentBranch(state)
  const head = headCommitId(state)
  if (!branch || !head) return []
  const ref = state.upstreams[branch]
  const tracking = ref ? state.remoteBranches[ref] : undefined
  if (!ref || !tracking) return []

  const { ahead, behind } = aheadBehind(state, head, tracking)
  const commits = (n: number) => `${n} commit${n === 1 ? '' : 's'}`
  if (ahead === 0 && behind === 0) return [`Your branch is up to date with '${ref}'.`]
  if (behind === 0) return [`Your branch is ahead of '${ref}' by ${commits(ahead)}.`, '  (use "git push" to publish your local commits)']
  if (ahead === 0) return [`Your branch is behind '${ref}' by ${commits(behind)}, and can be fast-forwarded.`, '  (use "git pull" to update your local branch)']
  return [
    `Your branch and '${ref}' have diverged,`,
    `and have ${ahead} and ${behind} different commits each, respectively.`,
    '  (use "git pull" if you want to integrate the remote branch with yours)',
  ]
}
