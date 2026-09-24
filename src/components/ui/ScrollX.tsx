import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

/** How far the fade reaches in from an edge with more content past it. */
const FADE = '24px'

export interface ScrollXProps {
  children: ReactNode
  /** Names the region for a screen reader, which is told it can be scrolled. */
  label: string
  className?: string
}

/**
 * A contained horizontal scroll, for the rare content that genuinely can't
 * wrap (Section 18 / Visualizer Section 32: "avoid uncontrolled horizontal
 * overflow" — this is the controlled kind).
 *
 * The cue is the content itself fading out at whichever edge has more past
 * it, so the scroll is discoverable without a scrollbar or an arrow. It is
 * a mask, not an overlay, so it works on any background. While it actually
 * scrolls it takes keyboard focus (arrow keys scroll it), and not otherwise
 * — an extra tab stop that does nothing would just be in the way.
 */
export function ScrollX({ children, label, className }: ScrollXProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    // No tolerance: this must agree with the browser (and axe) about whether
    // the region scrolls, or it can scroll without being reachable by keyboard.
    const start = el.scrollLeft > 0
    const end = Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth
    setEdges((current) => (current.start === start && current.end === end ? current : { start, end }))
  }, [])

  // After every render: content can outgrow the region without any box
  // changing size (a second branch label landing on a row), which a
  // ResizeObserver never reports. It only renders when its content does.
  useEffect(update)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [update])

  const scrollable = edges.start || edges.end
  const mask = scrollable
    ? `linear-gradient(to right, ${edges.start ? 'transparent' : 'black'}, black ${FADE}, black calc(100% - ${FADE}), ${edges.end ? 'transparent' : 'black'})`
    : undefined

  return (
    <div
      ref={ref}
      role={scrollable ? 'region' : undefined}
      aria-label={scrollable ? `${label} (scrolls sideways)` : undefined}
      tabIndex={scrollable ? 0 : undefined}
      className={cn('overflow-x-auto overscroll-x-contain', className)}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      {children}
    </div>
  )
}
