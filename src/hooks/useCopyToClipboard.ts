import { useCallback, useState } from 'react'

/** Copies text to the clipboard and reports a short-lived "copied" state for UI feedback. */
export function useCopyToClipboard(resetAfterMs = 1500) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        window.setTimeout(() => setCopied(false), resetAfterMs)
      } catch {
        setCopied(false)
      }
    },
    [resetAfterMs],
  )

  return { copied, copy }
}
