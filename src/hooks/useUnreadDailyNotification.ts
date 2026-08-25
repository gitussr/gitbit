import { useCallback, useEffect, useState } from 'react'

const SW_SCOPE = '/onesignal/'

async function getSwRegistration() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null
  return (await navigator.serviceWorker.getRegistration(SW_SCOPE)) ?? null
}

/**
 * Whether GitBit Daily has a push notification still sitting undismissed
 * in the OS notification tray, for the header logo's red dot. Backed by
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
    setUnread(notifications.length > 0)
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

    navigator.serviceWorker?.addEventListener('message', onMessage)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', refresh)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', onMessage)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', refresh)
    }
  }, [refresh])

  const markRead = useCallback(async () => {
    const registration = await getSwRegistration()
    if (!registration) return
    const notifications = await registration.getNotifications()
    notifications.forEach((notification) => notification.close())
    setUnread(false)
  }, [])

  return { unread, markRead }
}
