import { useEffect, type RefObject } from 'react'

/**
 * Keeps the page's `scroll-padding-bottom` equal to the height of something
 * docked over the bottom of the viewport.
 *
 * A sticky dock covers whatever scrolls beneath it, and without this,
 * tabbing to a control under it focuses something nobody can see (WCAG
 * 2.4.11, Focus Not Obscured). Browsers honour scroll padding when they
 * scroll a focused element into view, so it lands clear of the dock. It is
 * measured rather than fixed because the dock changes height as it opens.
 */
export function useScrollPaddingBottom(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const root = document.documentElement
    const observer = new ResizeObserver(() => {
      root.style.scrollPaddingBottom = `${el.getBoundingClientRect().height}px`
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
      root.style.scrollPaddingBottom = ''
    }
  }, [ref])
}
