import { ArrowDown } from 'lucide-react'
import { CommitNode } from '@/components/ui/CommitNode'
import { FileNode, type FileNodeStatus } from '@/components/ui/FileNode'
import { StatePanel } from '@/components/ui/StatePanel'
import { Text } from '@/components/ui/Typography'
import { gitStates } from '@/services/content'
import type { GitStateId } from '@/content/states'
import {
  ancestry,
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
  /** Paths and commit ids that have just arrived, and should play their entrance. */
  entering: Set<string>
}

/** The arrow between two panels, carrying the command that moves work along it. */
function Hop({ command }: { command: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1.5" aria-hidden="true">
      <ArrowDown className="size-4" />
      <code className="bg-code-bg px-1.5 py-0.5 font-mono text-xs text-code-text">{command}</code>
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
 * The Remote Repository panel arrives with the remote commands; drawing an
 * empty one now would be a picture of something the simulator can't yet do.
 */
export function VisualizerStage({ repo, active, entering }: VisualizerStageProps) {
  const staged = stagedChanges(repo)
  const unstaged = new Map(unstagedChanges(repo).map((change) => [change.path, change.kind]))
  const untracked = new Set(untrackedFiles(repo))

  const onDisk = Object.keys(repo.workingTree).sort()
  // A tracked file deleted from disk is still the Working Directory's business —
  // it is a change Git hasn't been told about yet.
  const deleted = unstagedChanges(repo)
    .filter((change) => change.kind === 'deleted')
    .map((change) => change.path)

  const workingFiles: { path: string; status: FileNodeStatus }[] = [
    ...onDisk.map((path): { path: string; status: FileNodeStatus } => ({
      path,
      status: untracked.has(path) ? 'untracked' : unstaged.has(path) ? 'modified' : 'unchanged',
    })),
    ...deleted.map((path) => ({ path, status: 'deleted' as const })),
  ]

  const commits = ancestry(repo, headCommitId(repo))
  const head = headCommitId(repo)

  return (
    <div className="flex flex-col">
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
                entering={entering.has(file.path) && file.status === 'modified'}
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
                entering={entering.has(change.path)}
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
        {commits.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {commits.map((commit) => (
              <CommitNode
                key={commit.id}
                id={commit.id}
                message={commit.message}
                isHead={commit.id === head}
                isRoot={commit.parents.length === 0}
                entering={entering.has(commit.id)}
              />
            ))}
          </ul>
        )}
      </StatePanel>
    </div>
  )
}
