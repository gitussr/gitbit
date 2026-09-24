import { useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type HistoryState = Record<string, unknown> | null

/**
 * A boolean that lives in a browser history entry, so the back button
 * turns it off — how a full-screen view or a sheet behaves in a native app
 * (Android's back button, a browser's, a swipe-back gesture).
 *
 * Turning it on pushes an entry for the same URL, marked `key` in its
 * state; back pops that entry and the flag reads false. Turning it off from
 * the UI steps back over the entry this session pushed, so it never lingers
 * for a later back press to land on. If there's no such entry (the page was
 * reloaded with the flag on), it's cleared in place instead, so turning it
 * off can never take anyone to the previous page.
 *
 * Goes through React Router rather than `history.pushState`: the router
 * owns the history stack, and an entry it didn't make would put its idea of
 * the current entry out of step.
 */
export function useHistoryFlag(key: string): [boolean, (on: boolean) => void] {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as HistoryState
  const on = state?.[key] === true
  const pushed = useRef(false)

  const without = useCallback(() => {
    const rest = { ...(state ?? {}) }
    delete rest[key]
    return rest
  }, [state, key])

  // A reload keeps history state, but opening straight into the flag's view
  // would be a surprise; start from off.
  useEffect(() => {
    if (on && !pushed.current) navigate(location, { replace: true, state: without() })
    // Mount only: after that, `on` changing is the back button doing its job.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = useCallback(
    (next: boolean) => {
      if (next === on) return
      if (next) {
        pushed.current = true
        navigate(location, { state: { ...(state ?? {}), [key]: true } })
      } else if (pushed.current) {
        pushed.current = false
        navigate(-1)
      } else {
        navigate(location, { replace: true, state: without() })
      }
    },
    [on, navigate, location, state, key, without],
  )

  return [on, set]
}
