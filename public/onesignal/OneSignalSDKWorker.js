importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Runs alongside OneSignal's own push handling above (multiple 'push'
// listeners all fire independently) — just pings open tabs so the header
// logo's unread dot can refresh without waiting for the next focus event.
self.addEventListener("push", (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: "gitbit-push-received" }));
    }),
  );
});
