importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Runs alongside OneSignal's own push handling above (multiple 'push'
// listeners all fire independently) — pings open tabs so the header logo's
// unread dot can refresh without waiting for the next focus event, and
// badges the home-screen icon directly from here, since this runs even
// while the app is fully closed (unlike the postMessage ping, which only
// reaches tabs that are already open).
self.addEventListener("push", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "gitbit-push-received" }));
      }),
      "setAppBadge" in self.navigator ? self.navigator.setAppBadge(1).catch(() => {}) : Promise.resolve(),
    ]),
  );
});
