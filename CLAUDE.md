# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start the dev server (Vite)
npm run build     # tsc -b (type-check, fails the build on type errors) then vite build
npm run lint      # oxlint
npm run preview   # preview the production build locally
npm run icons     # regenerate PWA/touch icons from public/icon*.svg
```

No test suite is configured. To type-check without a full build:
`npx tsc --noEmit -p tsconfig.app.json`

## Deployment

Production deploys are **automatic**: pushing to `main` triggers a Vercel
deployment via its GitHub integration (`gitussr/gitbit` → Vercel org
`team_2qxq0LkH4Z2MyDY0fBiBtWYe`, live at `https://gitbit-theta.vercel.app`).
Don't run `vercel --prod` manually — the Vercel CLI's logged-in account may
not be a member of that org even when authenticated. Check a push's deploy
status with:

```bash
gh api repos/gitussr/gitbit/commits/<sha>/status --jq '.state'
```

## Architecture

GitBit is a static, content-driven PWA — no database, auth, or paid API.
The one piece of server code is `api/daily-push.ts`, a Vercel cron
function that sends the daily push (see below); everything else is
client-side. Three docs are the canonical reference and should be read
before structural changes:

- `docs/ARCHITECTURE.md` — routing, codebase structure, the content/UI
  separation rule
- `docs/DESIGN_SYSTEM.md` — design tokens, theming, component primitives
- `docs/PRODUCT_SPEC.md` — the original product/design brief; inline
  comments throughout the codebase cite it by section number (e.g.
  `Section 14/27`) — check it when a comment references a section you
  can't find elsewhere

Two rules the codebase enforces everywhere, worth knowing before adding
anything new:

- **Content vs. UI separation**: `src/content/*` is plain typed data, no
  JSX. Components never hard-code Git explanations — they read from
  content. This is what lets Learn/Quiz/Daily reuse the same knowledge
  base.
- **Design System first**: new UI goes into `src/components/ui` (or
  composes existing primitives in `src/components/cards`) before it's used
  in a feature page — never a one-off styled element inside
  `src/features/*`. Never hard-code a color/radius/shadow; extend
  `src/styles/tokens.css`.

### Notification system

Spans several files under `src/services/notifications/`,
`src/hooks/`, `src/components/Notification*`, and
`public/onesignal/OneSignalSDKWorker.js` — the big-picture shape:

- `NotificationService` is the only entry point feature code should
  import — never a provider SDK or adapter directly. `oneSignalAdapter.ts`
  (wrapping `react-onesignal`) is the current, only
  `NotificationProviderAdapter`; swapping providers means changing one
  line in `NotificationService.ts`.
- `OneSignal.init()` rejects for several unrelated reasons that all look
  identical on the promise — origin/Site-URL mismatch (expected on
  localhost/Vercel previews), a wrong app ID, or an ad blocker/privacy
  extension blocking `cdn.onesignal.com` (seen in production). The adapter
  logs the real error via `console.error` instead of collapsing all of
  them into one silent `'unavailable'` state, so a real prod failure stays
  diagnosable.
- The five permission states (`unsupported`/`granted`/`denied`/
  `unavailable`/error/ask) are defined once in `NotificationStatus.tsx`
  and reused by three surfaces — the embedded `/daily` card
  (`NotificationOptIn`), the header bell (`NotificationBell`), and its
  auto-opening landing popup — so they can't drift out of sync.
- **Sending** is `api/daily-push.ts`, invoked once a day by the `crons`
  entry in `vercel.json`. Before it existed nothing in the repo ever
  called OneSignal, so pushes only went out when someone clicked Send in
  the OneSignal dashboard — the `/daily` page's rotating card is a
  client-side date calculation and was never evidence that delivery
  worked. It needs three server env vars in the Vercel project:
  `ONESIGNAL_REST_API_KEY`, `CRON_SECRET`, and optionally
  `ONESIGNAL_APP_ID` (falls back to `VITE_ONESIGNAL_APP_ID`). Never add a
  `VITE_` prefix to the REST key — that would inline it into the client
  bundle. Crons run on Production deployments only, and the route returns
  401 unless `CRON_SECRET` matches, so it can't be triggered by anyone
  who finds the URL.
- `src/services/dailySelection.ts` decides which bit is "today's" and is
  imported by *both* the `/daily` page and the cron function, so the push
  and the page can't disagree. Its day index is UTC-pinned deliberately.
  Every import in that file and in `src/content/daily` must stay
  type-only — Vercel bundles them with esbuild, which erases `import
  type` but cannot resolve the `@/*` alias.
- The OneSignal service worker is self-hosted at
  `public/onesignal/OneSignalSDKWorker.js`, registered at scope
  `/onesignal/` specifically so it coexists with the `vite-plugin-pwa`
  service worker at root scope `/` (offline app caching). Push delivery
  isn't scope-bound, so this only affects which pages each worker
  controls.
- Unread state (header logo red dot + home-screen icon badge,
  `useUnreadDailyNotification.ts`) is read directly from
  `ServiceWorkerRegistration.getNotifications()` on the `/onesignal/`
  scope rather than a separate store, so it can't drift from what's
  actually in the OS notification tray. The worker's own `push` listener
  (added alongside OneSignal's, in the same file — multiple `push`
  listeners on one worker all fire independently) pings open tabs via
  `postMessage` and calls `navigator.setAppBadge()` directly, since the
  badge call runs even while the app is fully closed.
