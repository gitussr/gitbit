import { describe, expect, it } from 'vitest'
import { hasConflictMarkers, mergeFile } from './merge3'

const labels = { ours: 'HEAD', theirs: 'feature' }
const text = (...lines: string[]) => `${lines.join('\n')}\n`

describe('mergeFile', () => {
  const base = text('<h1>Hello</h1>', '<p>Intro</p>', '<footer>2024</footer>')

  it('takes whichever side changed when only one did', () => {
    const theirs = text('<h1>Hello</h1>', '<p>Intro</p>', '<footer>2026</footer>')
    expect(mergeFile(base, base, theirs, labels)).toEqual({ content: theirs, conflict: false })
    expect(mergeFile(base, theirs, base, labels)).toEqual({ content: theirs, conflict: false })
  })

  it('merges changes to different lines of the same file cleanly', () => {
    const ours = text('<h1>Welcome</h1>', '<p>Intro</p>', '<footer>2024</footer>')
    const theirs = text('<h1>Hello</h1>', '<p>Intro</p>', '<footer>2026</footer>')
    expect(mergeFile(base, ours, theirs, labels)).toEqual({
      content: text('<h1>Welcome</h1>', '<p>Intro</p>', '<footer>2026</footer>'),
      conflict: false,
    })
  })

  it('takes an identical change once', () => {
    const both = text('<h1>Hi</h1>', '<p>Intro</p>', '<footer>2024</footer>')
    expect(mergeFile(base, both, both, labels)).toEqual({ content: both, conflict: false })
  })

  it('conflicts on the same line changed two ways, keeping both versions', () => {
    const ours = text('<h1>Welcome</h1>', '<p>Intro</p>', '<footer>2024</footer>')
    const theirs = text('<h1>Howdy</h1>', '<p>Intro</p>', '<footer>2024</footer>')
    const merged = mergeFile(base, ours, theirs, labels)

    expect(merged.conflict).toBe(true)
    expect(merged.content).toBe(
      text(
        '<<<<<<< HEAD',
        '<h1>Welcome</h1>',
        '=======',
        '<h1>Howdy</h1>',
        '>>>>>>> feature',
        '<p>Intro</p>',
        '<footer>2024</footer>',
      ),
    )
    expect(hasConflictMarkers(merged.content)).toBe(true)
  })

  it('keeps lines each side added in different places', () => {
    const ours = text('<h1>Hello</h1>', '<nav/>', '<p>Intro</p>', '<footer>2024</footer>')
    const theirs = text('<h1>Hello</h1>', '<p>Intro</p>', '<footer>2024</footer>', '<script/>')
    expect(mergeFile(base, ours, theirs, labels).content).toBe(
      text('<h1>Hello</h1>', '<nav/>', '<p>Intro</p>', '<footer>2024</footer>', '<script/>'),
    )
  })

  it('handles files that exist on only some sides', () => {
    expect(mergeFile(undefined, undefined, 'new\n', labels)).toEqual({ content: 'new\n', conflict: false })
    expect(mergeFile('old\n', 'old\n', undefined, labels)).toEqual({ content: undefined, conflict: false })
    // Changed on one side, deleted on the other: a conflict, with the changed version kept.
    expect(mergeFile('old\n', 'changed\n', undefined, labels)).toEqual({ content: 'changed\n', conflict: true })
  })

  it('conflicts when both sides add the same file differently', () => {
    const merged = mergeFile(undefined, 'a\n', 'b\n', labels)
    expect(merged.conflict).toBe(true)
    expect(merged.content).toBe(text('<<<<<<< HEAD', 'a', '=======', 'b', '>>>>>>> feature'))
  })
})
