import { ArrowDown } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { LabelledDivider } from '@/components/ui/LabelledDivider'
import { FileNode, type FileNodeStatus } from '@/components/ui/FileNode'
import { StatePanel } from '@/components/ui/StatePanel'
import { InlineCode, Text } from '@/components/ui/Typography'
import { gitStates } from '@/services/content'
import { CommitGraph } from './CommitGraph'
import type { GitStateId } from '@/content/states'
import {
  currentBranch,
  headCommitId,
  stagedChanges,
  unstagedChanges,
  untrackedFiles,
  type RepoState,
} from '@/services/git-sim'

const hintFor = (id: GitStateId) => gitStates.find((state) => state.id === id)?.plainEnglish

export interface VisualizerStageProps {
  repo: RepoState
  /** Panels to light because something just landed in them. */
  active: Set<GitStateId>
  /** What has just arrived and should play its entrance: `<panel>:<path>` for files, the id for commits. */
  entering: Set<string>
  /** The commit the Time Machine is looking at, if it's open. */
  inspected?: string | null
}

/** The arrow between two panels, carrying the command that moves work along it. */
function Hop({ command }: { command: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1.5" aria-hidden="true">
      <ArrowDown className="size-4" />
      <InlineCode className="text-xs">{command}</InlineCode>
    </div>
  )
}

function Empty({ children }: { children: string }) {
  return (
    <Text variant="body-sm" tone="tertiary" className="py-1">
      {children}
    </Text>
  )
}

/**
 * The stage: where the work is, right now (Section 10).
 *
 * Always vertical, at every width, so "down" means "further into Git" in
 * every animation — see `docs/VISUALIZER.md`. The panel contents are
 * *derived* from the engine's two trees and HEAD, never stored, which is
 * why a file that was staged and then edited again correctly appears in
 * two panels at once.
 *
 * The Remote Repository appears once `git remote add` has named one, below
 * a dashed boundary: it's a different place, not a fourth box on your
 * machine, and pushes and fetches visibly cross that line (Section 22). It
 * is labelled with the remote's name, never "GitHub" (Section 23).
 */
export function VisualizerStage({ repo, active, entering, inspected = null }: VisualizerStageProps) {
  const staged = stagedChanges(repo)
  const unstaged = new Map(unstagedChanges(repo).map((change) => [change.path, change.kind]))
  const untracked = new Set(untrackedFiles(repo))
  const conflicted = new Set(repo.merging?.conflicts ?? [])

  const onDisk = Object.keys(repo.workingTree).sort()
  // A tracked file deleted from disk is still the Working Directory's business —
  // it is a change Git hasn't been told about yet.
  const deleted = unstagedChanges(repo)
    .filter((change) => change.kind === 'deleted')
    .map((change) => change.path)

  const workingFiles: { path: string; status: FileNodeStatus }[] = [
    ...onDisk.map((path): { path: string; status: FileNodeStatus } => ({
      path,
      status: conflicted.has(path)
        ? 'conflicted'
        : untracked.has(path)
          ? 'untracked'
          : unstaged.has(path)
            ? 'modified'
            : 'unchanged',
    })),
    ...deleted.map((path) => ({ path, status: 'deleted' as const })),
  ]

  const hasCommits = headCommitId(repo) !== null

  return (
    <div className="flex flex-col">
      {repo.merging && (
        <Alert
          variant={conflicted.size > 0 ? 'warning' : 'info'}
          title={
            repo.merging.kind === 'merge'
              ? `Merging ${repo.merging.theirsName} into ${currentBranch(repo) ?? 'HEAD'}`
              : `Reverting ${repo.merging.theirsName}`
          }
          className="mb-3"
        >
          {conflicted.size > 0 ? (
            <>
              Waiting on you: {[...conflicted].join(', ')}. Edit each one, then <InlineCode>git add</InlineCode> it —
              or back out with <InlineCode>git {repo.merging.kind} --abort</InlineCode>.
            </>
          ) : (
            <>
              Every conflict is resolved.{' '}
              <InlineCode>{repo.merging.kind === 'merge' ? 'git commit' : 'git revert --continue'}</InlineCode> finishes
              the {repo.merging.kind}.
            </>
          )}
        </Alert>
      )}

      <StatePanel
        label="Working Directory"
        hint={hintFor('working-directory')}
        count={workingFiles.length}
        active={active.has('working-directory')}
        empty={<Empty>No files here.</Empty>}
      >
        {workingFiles.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {workingFiles.map((file) => (
              <FileNode
                key={file.path}
                path={file.path}
                status={file.status}
                entering={entering.has(`working-directory:${file.path}`)}
              />
            ))}
          </ul>
        )}
      </StatePanel>

      <Hop command="git add" />

      <StatePanel
        label="Staging Area"
        hint={hintFor('staging-area')}
        count={staged.length}
        active={active.has('staging-area')}
        empty={<Empty>{repo.initialized ? 'Nothing staged.' : 'Not a repository yet.'}</Empty>}
      >
        {staged.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {staged.map((change) => (
              <FileNode
                key={change.path}
                path={change.path}
                status={change.kind === 'deleted' ? 'deleted' : 'staged'}
                entering={entering.has(`staging-area:${change.path}`)}
              />
            ))}
          </ul>
        )}
      </StatePanel>

      <Hop command="git commit" />

      <StatePanel
        label="Local Repository"
        hint={hintFor('local-repository')}
        active={active.has('local-repository')}
        empty={<Empty>{repo.initialized ? 'No commits yet.' : 'Not a repository yet.'}</Empty>}
      >
        {hasCommits && <CommitGraph repo={repo} entering={entering} inspected={inspected} />}
      </StatePanel>

      {repo.remote && (
        <>
          <LabelledDivider dashed className="my-4">
            Remote ({repo.remote.name})
          </LabelledDivider>
          <StatePanel
            label="Remote Repository"
            hint={hintFor('remote-repository')}
            active={active.has('remote-repository')}
            empty={<Empty>Nothing here yet. It only gets commits when you push them.</Empty>}
          >
            {Object.keys(repo.remote.branches).length > 0 && (
              <CommitGraph repo={repo} entering={entering} source="remote" />
            )}
          </StatePanel>
        </>
      )}
    </div>
  )
}
