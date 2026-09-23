import { useLayoutEffect, useRef, type RefObject } from 'react'

/** A motion token, read from the stylesheet so JS-driven motion keeps the same timing as CSS. */
function token(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

/**
 * Makes one element *travel* from where it was to where it is now, when
 * `key` changes — the FLIP technique (First, Last, Invert, Play), on the
 * native Web Animations API, with no library.
 *
 * Built for things that re-render somewhere else rather than move: a label
 * that unmounts on one row and mounts on another is, to React, two
 * elements. To a reader it's one thing going somewhere, and that journey
 * is the lesson (Visualizer Section 14: "visibly move HEAD").
 *
 * Positions are measured against `anchor`, not the viewport, so scrolling
 * between two renders can't read as movement. Pass `enabled: false` under
 * reduced motion: the element then simply appears in its new place.
 */
export function useFlip<T extends HTMLElement>(anchor: RefObject<HTMLElement | null>, key: string, enabled: boolean) {
  const ref = useRef<T>(null)
  const last = useRef<{ key: string; x: number; y: number } | null>(null)

  // No dependency list on purpose: position is re-measured after every
  // render, so a row shifting for some *other* reason (a new commit pushing
  // history down) is never mistaken for travel next time.
  useLayoutEffect(() => {
    const element = ref.current
    const container = anchor.current
    if (!element || !container) {
      last.current = null
      return
    }

    const box = element.getBoundingClientRect()
    const origin = container.getBoundingClientRect()
    const now = { key, x: box.left - origin.left, y: box.top - origin.top }
    const before = last.current
    last.current = now

    if (!enabled || !before || before.key === key) return
    const dx = before.x - now.x
    const dy = before.y - now.y
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return

    element.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
      duration: parseFloat(token('--duration-slow', '360ms')),
      easing: token('--ease-standard', 'ease'),
    })
  })

  return ref
}
