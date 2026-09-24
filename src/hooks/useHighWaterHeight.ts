import { useEffect, useRef } from 'react'

/**
 * A container that can grow but never shrink, until `resetKey` changes.
 * Returns two refs: `container` for the element that holds the minimum,
 * `content` for the element inside it whose natural height is measured.
 *
 * Content that comes and goes near the end of a page — a card replaced by
 * a shorter one — shrinks the document, and a reader scrolled to the
 * bottom then sees everything above slide down as the scroll position is
 * clamped. Holding the tallest height seen trades a little empty space for
 * a page that stays still.
 *
 * The minimum is written in the ResizeObserver callback itself, before the
 * browser paints. Routed through React state it landed a frame late, and
 * that one short frame was enough for scroll anchoring to move the page.
 */
export function useHighWaterHeight<T extends HTMLElement = HTMLDivElement>(resetKey: unknown) {
  const container = useRef<T>(null)
  const content = useRef<T>(null)
  const high = useRef(0)

  useEffect(() => {
    high.current = 0
    if (container.current) container.current.style.minHeight = ''
  }, [resetKey])

  useEffect(() => {
    const inner = content.current
    if (!inner) return
    const observer = new ResizeObserver(() => {
      const height = Math.ceil(inner.getBoundingClientRect().height)
      if (height <= high.current || !container.current) return
      high.current = height
      container.current.style.minHeight = `${height}px`
    })
    observer.observe(inner)
    return () => observer.disconnect()
  }, [])

  return { container, content }
}
