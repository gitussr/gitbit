/**
 * A small line diff (Section 21).
 *
 * Structured, not text: the console renders it as unified-diff lines, and
 * the Visualizer's diff view will render the same objects as coloured rows
 * without re-parsing a string. Section 39 rules out a diff library for
 * something this size.
 */

import { treeDiff } from './repo'
import type { FilePath, Tree } from './types'

export interface DiffLine {
  kind: 'context' | 'add' | 'remove'
  text: string
  /** 1-based line numbers, absent on the side where the line doesn't exist. */
  oldNumber?: number
  newNumber?: number
}

export interface DiffHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: DiffLine[]
}

export interface FileDiff {
  path: FilePath
  status: 'added' | 'deleted' | 'modified'
  hunks: DiffHunk[]
}

const CONTEXT = 3

function splitLines(content: string): string[] {
  if (content === '') return []
  // A trailing newline ends the last line, it doesn't start an empty one.
  return content.replace(/\n$/, '').split('\n')
}

/** Longest common subsequence, walked forward into an ordered list of lines. */
function diffLines(before: string[], after: string[]): DiffLine[] {
  const rows = before.length
  const cols = after.length

  // lengths[i][j] = LCS length of before[i..] and after[j..].
  const lengths: number[][] = Array.from({ length: rows + 1 }, () => new Array<number>(cols + 1).fill(0))
  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = cols - 1; j >= 0; j -= 1) {
      lengths[i][j] =
        before[i] === after[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1])
    }
  }

  const lines: DiffLine[] = []
  let i = 0
  let j = 0

  while (i < rows && j < cols) {
    if (before[i] === after[j]) {
      lines.push({ kind: 'context', text: before[i], oldNumber: i + 1, newNumber: j + 1 })
      i += 1
      j += 1
    } else if (lengths[i + 1][j] >= lengths[i][j + 1]) {
      lines.push({ kind: 'remove', text: before[i], oldNumber: i + 1 })
      i += 1
    } else {
      lines.push({ kind: 'add', text: after[j], newNumber: j + 1 })
      j += 1
    }
  }

  while (i < rows) {
    lines.push({ kind: 'remove', text: before[i], oldNumber: i + 1 })
    i += 1
  }
  while (j < cols) {
    lines.push({ kind: 'add', text: after[j], newNumber: j + 1 })
    j += 1
  }

  return lines
}

/** Group changed lines into hunks, each carrying up to three lines of context either side. */
function toHunks(lines: DiffLine[]): DiffHunk[] {
  const changed = lines.map((line, index) => (line.kind === 'context' ? -1 : index)).filter((index) => index >= 0)
  if (changed.length === 0) return []

  const groups: number[][] = []
  for (const index of changed) {
    const last = groups[groups.length - 1]
    // Two runs closer than twice the context would print overlapping context — merge them.
    if (last && index - last[last.length - 1] <= CONTEXT * 2) last.push(index)
    else groups.push([index])
  }

  return groups.map((group) => {
    const from = Math.max(0, group[0] - CONTEXT)
    const to = Math.min(lines.length - 1, group[group.length - 1] + CONTEXT)
    const slice = lines.slice(from, to + 1)

    const oldLines = slice.filter((line) => line.kind !== 'add').length
    const newLines = slice.filter((line) => line.kind !== 'remove').length

    // A hunk that adds to an empty file has no old line to start at — Git writes `-0,0`.
    const firstOld = slice.find((line) => line.oldNumber !== undefined)?.oldNumber
    const firstNew = slice.find((line) => line.newNumber !== undefined)?.newNumber

    return {
      oldStart: firstOld ?? 0,
      oldLines,
      newStart: firstNew ?? 0,
      newLines,
      lines: slice,
    }
  })
}

export function fileDiff(path: FilePath, before: string, after: string, status: FileDiff['status']): FileDiff {
  return { path, status, hunks: toHunks(diffLines(splitLines(before), splitLines(after))) }
}

/** Every file that differs between two trees, as diffs. */
export function treeDiffDetailed(from: Tree, to: Tree): FileDiff[] {
  return treeDiff(from, to).map((change) =>
    fileDiff(
      change.path,
      from[change.path] ?? '',
      to[change.path] ?? '',
      change.kind === 'added' ? 'added' : change.kind === 'deleted' ? 'deleted' : 'modified',
    ),
  )
}

/** The unified-diff text Git itself would print. */
export function formatDiff(diffs: FileDiff[]): string[] {
  const out: string[] = []

  for (const diff of diffs) {
    out.push(`diff --git a/${diff.path} b/${diff.path}`)
    out.push(diff.status === 'added' ? '--- /dev/null' : `--- a/${diff.path}`)
    out.push(diff.status === 'deleted' ? '+++ /dev/null' : `+++ b/${diff.path}`)

    for (const hunk of diff.hunks) {
      out.push(`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`)
      for (const line of hunk.lines) {
        out.push(`${line.kind === 'add' ? '+' : line.kind === 'remove' ? '-' : ' '}${line.text}`)
      }
    }
  }

  return out
}
