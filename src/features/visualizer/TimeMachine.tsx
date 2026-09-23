import { useState } from 'react'
import { BranchLabel } from '@/components/ui/BranchLabel'
import { Button } from '@/components/ui/Button'
import { FileNode, type FileNodeStatus } from '@/components/ui/FileNode'
import { Timeline } from '@/components/ui/Timeline'
import { InlineCode, Text } from '@/components/ui/Typography'
import {
  fileHistory,
  relationToHead,
  snapshot,
  timeline,
  type CommitId,
  type HeadRelation,
  type RepoState,
  type SnapshotStatus,
} from '@/services/git-sim'

export interface TimeMachineProps {
  repo: RepoState
  /** The commit being looked at. Null means "wherever HEAD is". */
  selected: CommitId | null
  onSelect: (id: CommitId) => void
  /** Runs a real command through the console — the Time Machine never moves anything itself. */
  onRun: (command: string) => void
}

const STATUS: Record<SnapshotStatus, FileNodeStatus> = {
  added: 'added',
  modified: 'modified',
  deleted: 'deleted',
  unchanged: 'unchanged',
}

const STORY = { added: 'Created in', modified: 'Modified in', deleted: 'Deleted in' } as const

function whereItIs(relation: HeadRelation, reachable: boolean): string {
  if (relation.kind === 'head') return 'HEAD is here. This is the snapshot your files come from right now.'
  if (relation.kind === 'behind') {
    return relation.steps === null
      ? 'In the history HEAD stands on, brought in by a merge.'
      : `HEAD~${relation.steps}: ${relation.steps} ${relation.steps === 1 ? 'commit' : 'commits'} back in the history HEAD stands on.`
  }
  return reachable
    ? 'On another line of work — not in the history HEAD can see.'
    : 'Nothing points here any more. It is still in the repository, and giving it a branch name keeps it.'
}

/**
 * The Time Machine (Sections 19, 20, 24): scrub through every commit and
 * see the whole project as it was recorded there.
 *
 * Looking is not going. Scrubbing changes what this panel shows and rings
 * the commit in the graph; it moves nothing. "Go here" is offered as the
 * real command that does it — so the lesson is that time travel in Git is
 * `git switch`, not a special mode.
 *
 * Commits a reset or a deleted branch left behind are on the timeline too,
 * drawn faded: the graph stops showing them because nothing reaches them,
 * but they aren't gone, and this is where you find them.
 */
export default function TimeMachine({ repo, selected, onSelect, onRun }: TimeMachineProps) {
  const [file, setFile] = useState<string | null>(null)
  const entries = timeline(repo)

  if (entries.length === 0) {
    return (
      <Text variant="body-sm" tone="secondary">
        No commits yet. The Time Machine travels through history, and there isn&apos;t any until the first commit.
      </Text>
    )
  }

  const headIndex = entries.findIndex((entry) => entry.isHead)
  const found = entries.findIndex((entry) => entry.commit.id === selected)
  const index = found !== -1 ? found : headIndex !== -1 ? headIndex : entries.length - 1
  const entry = entries[index]
  const { commit } = entry
  const relation = relationToHead(repo, commit.id)
  const files = snapshot(repo, commit.id)
  const story = file && files.some((f) => f.path === file) ? fileHistory(repo, file, commit.id) : []

  return (
    <div className="flex flex-col gap-4">
      <Timeline
        label="Commit"
        items={entries.map((item) => ({
          id: item.commit.id,
          label: `${item.commit.id}: ${item.commit.message}${item.reachable ? '' : ' (nothing points here)'}`,
          current: item.isHead,
          faded: !item.reachable,
        }))}
        value={index}
        onChange={(next) => onSelect(entries[next].commit.id)}
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <InlineCode>{commit.id}</InlineCode>
          {entry.branches.map((branch) => (
            <BranchLabel key={branch} name={branch} variant={entry.isHead ? 'current' : 'branch'} />
          ))}
          {entry.isHead && entry.branches.length === 0 && <BranchLabel name="HEAD" variant="head" />}
        </div>
        <Text variant="body-sm" className="font-bold">
          {commit.message}
        </Text>
        <Text variant="body-sm" tone="secondary">
          {whereItIs(relation, entry.reachable)}
        </Text>
        <Text variant="caption" tone="tertiary">
          {commit.parents.length === 0
            ? 'The first commit — no parent.'
            : `${commit.parents.length === 1 ? 'Parent' : 'Parents'}: ${commit.parents.join(', ')}`}
        </Text>
      </div>

      {relation.kind !== 'head' && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onRun(entry.branches[0] ? `git switch ${entry.branches[0]}` : `git switch --detach ${commit.id}`)}
          >
            Go here
          </Button>
          {!entry.reachable && (
            <Button variant="ghost" size="sm" onClick={() => onRun(`git branch rescued-${commit.id} ${commit.id}`)}>
              Keep it on a branch
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Text variant="caption" tone="secondary" className="font-bold uppercase">
          The project at this commit
        </Text>
        <ul className="flex flex-col gap-1.5">
          {files.map((item) => (
            <FileNode
              key={item.path}
              path={item.path}
              status={STATUS[item.status]}
              selected={item.path === file}
              onSelect={() => setFile(item.path === file ? null : item.path)}
            />
          ))}
        </ul>
        <Text variant="caption" tone="tertiary">
          Every file, not just the changed ones: a commit is a snapshot of the whole project. Pick one for its history.
        </Text>
      </div>

      {story.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Text variant="caption" tone="secondary" className="font-bold uppercase">
            {file} — its story so far
          </Text>
          <ol className="flex flex-col gap-1">
            {story.map(({ commit: step, change }) => (
              <li key={step.id} className="flex flex-wrap items-baseline gap-1.5">
                <Text variant="body-sm" as="span">
                  {STORY[change]}
                </Text>
                <InlineCode>{step.id}</InlineCode>
                <Text variant="body-sm" as="span" tone="secondary">
                  {step.message}
                </Text>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
