/**
 * Three-way merge of one file (Section 16).
 *
 * Git merges line by line, not file by file: two branches that changed
 * *different lines* of the same file merge cleanly, and only changes to
 * the *same* lines conflict. A file-level simulator would report conflicts
 * that real Git never shows, and teach that editing the same file on two
 * branches is dangerous — which is false (Section 38). So this is a real,
 * small diff3.
 *
 * The method: find the lines of the common ancestor ("base") that both
 * sides kept unchanged. Those are stable. Between two stable lines is a
 * chunk that one side, the other, or both changed. One side changed it →
 * take that side. Both changed it identically → take it once. Both
 * changed it differently → conflict.
 */

export interface MergedFile {
  /** What goes on disk. Undefined when the result is that the file doesn't exist. */
  content: string | undefined
  conflict: boolean
}

export interface Labels {
  ours: string
  theirs: string
}

function lines(content: string): string[] {
  if (content === '') return []
  return content.replace(/\n$/, '').split('\n')
}

function join(parts: string[]): string {
  return parts.length === 0 ? '' : `${parts.join('\n')}\n`
}

/** For each line of `a` kept in `b`, where it ended up — the longest common subsequence as a map. */
function matches(a: string[], b: string[]): Map<number, number> {
  const lengths: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      lengths[i][j] = a[i] === b[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1])
    }
  }

  const map = new Map<number, number>()
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      map.set(i, j)
      i += 1
      j += 1
    } else if (lengths[i + 1][j] >= lengths[i][j + 1]) i += 1
    else j += 1
  }
  return map
}

const same = (a: string[], b: string[]) => a.length === b.length && a.every((line, i) => line === b[i])

/** Merge three versions of a text. Returns the lines, with conflict markers where the sides disagree. */
function mergeLines(base: string[], ours: string[], theirs: string[], labels: Labels): { lines: string[]; conflict: boolean } {
  const toOurs = matches(base, ours)
  const toTheirs = matches(base, theirs)
  const out: string[] = []
  let conflict = false

  let b = 0
  let o = 0
  let t = 0

  const resolve = (baseEnd: number, oursEnd: number, theirsEnd: number) => {
    const baseChunk = base.slice(b, baseEnd)
    const oursChunk = ours.slice(o, oursEnd)
    const theirsChunk = theirs.slice(t, theirsEnd)

    if (same(oursChunk, baseChunk)) out.push(...theirsChunk)
    else if (same(theirsChunk, baseChunk) || same(oursChunk, theirsChunk)) out.push(...oursChunk)
    else {
      conflict = true
      out.push(`<<<<<<< ${labels.ours}`, ...oursChunk, '=======', ...theirsChunk, `>>>>>>> ${labels.theirs}`)
    }
  }

  while (b < base.length) {
    // The next base line both sides kept, at or after where we are.
    let stable = b
    while (stable < base.length && !(toOurs.has(stable) && toTheirs.has(stable))) stable += 1
    if (stable === base.length) break

    const oursAt = toOurs.get(stable) as number
    const theirsAt = toTheirs.get(stable) as number
    if (stable > b || oursAt > o || theirsAt > t) resolve(stable, oursAt, theirsAt)

    out.push(base[stable])
    b = stable + 1
    o = oursAt + 1
    t = theirsAt + 1
  }

  // Whatever is left after the last stable line.
  if (b < base.length || o < ours.length || t < theirs.length) resolve(base.length, ours.length, theirs.length)

  return { lines: out, conflict }
}

/**
 * Merge one path. `undefined` means the file doesn't exist on that side,
 * so additions and deletions go through the same rules: a side that left
 * the file as the base had it defers to the other.
 */
export function mergeFile(
  base: string | undefined,
  ours: string | undefined,
  theirs: string | undefined,
  labels: Labels,
): MergedFile {
  if (ours === theirs) return { content: ours, conflict: false }
  if (ours === base) return { content: theirs, conflict: false }
  if (theirs === base) return { content: ours, conflict: false }

  // One side changed the file, the other deleted it. Git keeps the changed
  // version on disk and leaves the decision to you.
  if (ours === undefined || theirs === undefined) {
    return { content: ours ?? theirs, conflict: true }
  }

  // Both changed it (or both added it, from nothing): merge the lines.
  const merged = mergeLines(lines(base ?? ''), lines(ours), lines(theirs), labels)
  return { content: join(merged.lines), conflict: merged.conflict }
}

/** Whether a file still has conflict markers in it. Git doesn't check this before `git add` — which is worth knowing. */
export function hasConflictMarkers(content: string | undefined): boolean {
  return content !== undefined && /^<<<<<<< /m.test(content) && /^>>>>>>> /m.test(content)
}
