import { useEffect, useState } from 'react'

/**
 * Below this much scrollable height the indicator is noise, not information:
 * it would sit at 0, jump to 100 on one flick of the wheel, and say nothing
 * the reader can't already see. Half a viewport of overflow is roughly where
 * "there is more below" stops being obvious at a glance.
 */
const MIN_SCROLLABLE_RATIO = 0.5

function measure(): number | null {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight
  if (scrollable < window.innerHeight * MIN_SCROLLABLE_RATIO) return null
  return Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100))
}

/**
 * How far the reader has scrolled through the page, 0-100 (Section 21), or
 * `null` on a page short enough that the question doesn't arise — the caller
 * then shows whatever it would have shown anyway.
 *
 * `resetKey` re-measures when it changes: moving between lessons keeps the
 * same route component mounted, so without it the value would stay wherever
 * the previous lesson left it.
 */
export function useReadingProgress(resetKey?: string): number | null {
  const [progress, setProgress] = useState<number | null>(null)

  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = 0
      setProgress(measure())
    })

    const onChange = () => {
      // rAF-throttled: scroll fires far more often than we can usefully paint.
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0
          setProgress(measure())
        })
      }
    }

    window.addEventListener('scroll', onChange, { passive: true })
    window.addEventListener('resize', onChange, { passive: true })

    // The page can get taller after the first measure — a swapped-in font
    // reflows the text — and that changes the answer without either event
    // above firing.
    const observer = new ResizeObserver(onChange)
    observer.observe(document.body)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', onChange)
      window.removeEventListener('resize', onChange)
    }
  }, [resetKey])

  return progress
}
