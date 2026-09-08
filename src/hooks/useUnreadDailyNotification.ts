import { useCallback, useEffect, useState } from 'react'

const SW_SCOPE = '/onesignal/'

async function getSwRegistration() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null
  return (await navigator.serviceWorker.getRegistration(SW_SCOPE)) ?? null
}

/**
 * Every mounted instance mirrors the same external state (the OneSignal
 * worker's notification list), so a clear from one has to reach the others —
 * /daily marking the day's bit read must drop the header bell's dot too, not
 * leave it until the next focus event.
 *
 * The listeners set state directly rather than re-reading
 * `getNotifications()`: `Notification.close()` isn't guaranteed to be
 * reflected there immediately, so a re-read could race and flip the dot back
 * on. A module-level set keeps the instances in step without lifting this
 * into a provider.
 */
const clearedListeners = new Set<() => void>()

/** Home-screen icon badge (Android/desktop installed PWAs). No-op where unsupported (iOS Safari, Firefox). */
function setBadge(unread: boolean) {
  if (typeof navigator === 'undefined' || !('setAppBadge' in navigator)) return
  const result = unread ? navigator.setAppBadge(1) : navigator.clearAppBadge()
  result.catch(() => {})
}

/**
 * Whether GitBit Daily has a push notification still sitting undismissed
 * in the OS notification tray — the header bell's red dot and the
 * home-screen icon badge. Cleared by opening the bell panel or by visiting
 * /daily, which is the point the day's bit has actually been read. Backed by
 * `ServiceWorkerRegistration.getNotifications()` — the browser's own record
 * of what it displayed via the OneSignal worker at scope '/onesignal/' —
 * so it can't drift from what the user actually sees. `OneSignalSDKWorker.js`
 * posts a message on every push so an open tab refreshes immediately;
 * focus/visibility also refresh it for the common case of a push arriving
 * while the site wasn't open.
 */
export function useUnreadDailyNotification() {
  const [unread, setUnread] = useState(false)

  const refresh = useCallback(async () => {
    const registration = await getSwRegistration()
    if (!registration) return
    const notifications = await registration.getNotifications()
    const hasUnread = notifications.length > 0
    setUnread(hasUnread)
    setBadge(hasUnread)
  }, [])

  useEffect(() => {
    refresh()

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'gitbit-push-received') return
      // showNotification() from the push handler may not have resolved yet.
      setTimeout(refresh, 500)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    const onCleared = () => setUnread(false)

    navigator.serviceWorker?.addEventListener('message', onMessage)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', refresh)
    clearedListeners.add(onCleared)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', onMessage)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', refresh)
      clearedListeners.delete(onCleared)
    }
  }, [refresh])

  const markRead = useCallback(async () => {
    setBadge(false)
    // Fires on this instance too, so no separate local setUnread is needed.
    clearedListeners.forEach((listener) => listener())

    const registration = await getSwRegistration()
    if (!registration) return
    const notifications = await registration.getNotifications()
    notifications.forEach((notification) => notification.close())
  }, [])

  return { unread, markRead }
}
