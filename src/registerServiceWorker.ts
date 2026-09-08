import { registerSW } from 'virtual:pwa-register'

/**
 * The PWA service worker precaches the whole build, so a returning visitor is
 * served the *previous* deploy until a new worker installs and the page
 * reloads. vite-plugin-pwa's default injected registration only calls
 * `navigator.serviceWorker.register` — it never re-checks and never reloads,
 * so a shipped change could sit unseen behind the cache indefinitely (this is
 * why a palette change appeared not to deploy at all).
 *
 * `registerSW` from the virtual module is the version that honours
 * `registerType: 'autoUpdate'`: it activates a waiting worker and reloads once
 * it takes control. The hourly re-check matters for the installed PWA, which
 * can stay open for days without a fresh navigation to trigger one.
 *
 * The reload only fires after an actual new deploy, and only once the new
 * worker is ready — but it *is* a reload, so in-page state (a quiz in
 * progress) is lost. That's the trade for never serving stale content.
 */
const HOUR = 60 * 60 * 1000

export function registerServiceWorker() {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      setInterval(() => {
        registration.update().catch(() => {
          // Offline, or the check raced a navigation — the next tick retries.
        })
      }, HOUR)
    },
  })
}
