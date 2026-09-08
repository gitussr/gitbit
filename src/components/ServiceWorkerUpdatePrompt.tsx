import { useEffect } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { useToast } from '@/components/ui/Toast'

/**
 * The PWA service worker precaches the whole build, so without this a
 * returning visitor keeps being served the *previous* deploy. vite-plugin-pwa's
 * default injected registration only calls `navigator.serviceWorker.register` —
 * it never re-checks and never surfaces a new worker — so shipped changes could
 * sit unseen behind the cache indefinitely.
 *
 * `registerType: 'prompt'` (vite.config.ts) leaves the new worker waiting and
 * calls `onNeedRefresh`, so the reload is the reader's choice: reloading out
 * from under someone mid-quiz would lose their answers. The toast stays until
 * acted on or dismissed, since the default four seconds is not long enough to
 * notice and act on.
 *
 * Rendered inside ToastProvider rather than registering from main.tsx, because
 * the prompt needs the toast context.
 */
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000

export function ServiceWorkerUpdatePrompt() {
  const showToast = useToast()

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        showToast({
          title: 'New version available',
          description: 'Reload to get the latest GitBit.',
          duration: null,
          action: {
            label: 'Reload',
            // `true` activates the waiting worker; the page reloads once it
            // takes control.
            onClick: () => void updateSW(true),
          },
        })
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return
        // The installed PWA can stay open for days without a navigation to
        // trigger the browser's own update check.
        setInterval(() => {
          registration.update().catch(() => {
            // Offline, or raced a navigation — the next tick retries.
          })
        }, UPDATE_CHECK_INTERVAL)
      },
    })
  }, [showToast])

  return null
}
