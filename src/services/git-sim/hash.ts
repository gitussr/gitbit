/**
 * Commit ids.
 *
 * Real Git hashes the commit's contents — its tree, its parents, its
 * message — so two commits with different parents are different commits
 * even when they carry identical changes. That is the whole reason
 * `git rebase` produces `D'` rather than moving `D` (Section 17), so the
 * simulator derives ids the same way instead of handing out counters.
 *
 * FNV-1a, not SHA-1: seven hex characters that look like the short hashes
 * people see in `git log --oneline`, with no dependency and no async
 * crypto API. The guarantee that matters here is determinism, not
 * cryptographic strength — nothing is verifying these.
 */

import type { CommitId, FilePath, Tree } from './types'

function fnv1a(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    // The classic 16777619 multiply, in 32-bit-safe pieces.
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

function serializeTree(tree: Tree): string {
  return Object.keys(tree)
    .sort()
    .map((path: FilePath) => `${path}\u0000${tree[path]}`)
    .join('\u0001')
}

/**
 * `nonce` separates commits that really are identical in content, parents
 * and message — the same file committed twice on two branches, say. Real
 * Git separates those by timestamp; this is the same idea with the
 * simulator's commit counter standing in for the clock.
 */
export function commitId(parents: CommitId[], message: string, tree: Tree, nonce: number): CommitId {
  const payload = [parents.join(','), message, serializeTree(tree), String(nonce)].join('\u0002')
  return fnv1a(payload).toString(16).padStart(8, '0').slice(0, 7)
}
