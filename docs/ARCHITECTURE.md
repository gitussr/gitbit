# GitBit — Product & Technical Architecture

This document defines the information architecture, routing, and codebase
boundaries GitBit is built from. It is the reference for Phase 3 (Design
System) and Phase 4+ (content and feature work) so that decisions stay
consistent instead of ad hoc.

## Tech stack

| Concern     | Choice                                        | Why |
|-------------|------------------------------------------------|-----|
| Framework   | React 19 + TypeScript                          | Typed content model (Section 5) needs a typed UI layer. |
| Build tool  | Vite                                            | Required by the brief; fast dev/build, first-class PWA plugin. |
| Routing     | react-router-dom (data router, lazy routes)     | Standard, code-split per route out of the box. |
| Styling     | Tailwind CSS v4 (`@tailwindcss/vite`)           | CSS-first `@theme` config maps directly onto the design-token requirement (Section 35) without a separate config file. |
| Fonts       | `@fontsource/manrope`, `@fontsource/ubuntu-mono`| Self-hosted → works offline in the PWA, no third-party network dependency. |
| PWA         | `vite-plugin-pwa`                               | Installed now, wired up in Phase 6 per the brief's phase order. |
| Content     | Plain typed TS modules under `src/content`      | No CMS/database needed for an MVP; fully static, tree-shakeable, typed. |

No backend, database, auth, or paid API is used anywhere (Section 40).

## Information architecture / routes

```
/                          Home
/quick                     GitBit Quick — searchable command cheat sheet
/quick/:commandSlug        Command detail
/learn                     GitBit Learn — level index
/learn/:levelSlug          Level detail (e.g. level-1-everyday-git)
/learn/:levelSlug/:conceptSlug   Concept lesson within a level
/aha                       GitBit Aha — list
/aha/:slug                 Aha detail
/quiz                      GitBit Quiz — index
/quiz/:slug                Single question / quiz session
/sos                       GitBit SOS — situation index
/sos/:slug                 Recovery guide
/terminal                  GitBit Terminal — simulated command explainer
/daily                     GitBit Daily — micro-learning feed
/search                    Cross-content search results
/design-system             Internal component/token showcase (Phase 3)
*                          Not found
```

Route ownership: each product module (Quick, Learn, Aha, Quiz, SOS,
Terminal, Daily, Search) is a **feature boundary** — its routes, page
components, and any feature-only UI live together under
`src/features/<name>/`. Route components are lazy-loaded so no feature's
code ships on another feature's page.

## Codebase structure

```
src/
  app/                 Router config, root layout/shell, app-level providers
  components/          Design System primitives (Phase 3) — shared, presentational, content-agnostic
  features/            One folder per product module; owns its routes + feature-specific UI
    home/
    quick/
    learn/
    aha/
    quiz/
    sos/
    terminal/
    daily/
    search/
    design-system/
    not-found/
  content/             Typed Git knowledge base (Section 5/33) — no JSX, no UI
    types.ts           Shared content interfaces (GitCommand, GitConcept, AhaCard, QuizQuestion, SosGuide, DailyContentItem, Comparison)
    commands/
    concepts/
    aha/
    quiz/
    sos/
    daily/
    comparisons/
  data/                Derived/aggregated views over content (e.g. search index) — built in Phase 4/5
  hooks/               Shared React hooks (theme, reduced-motion, search, etc.)
  services/            Framework-agnostic logic (search matching, daily selection, notifications) — no React imports
  styles/              Design tokens / global CSS (Phase 3)
  utils/               Small pure helpers
```

**Rule:** UI components never hard-code Git explanations. They read from
`content/`. Content authors never touch component code. This is what
lets Learn, Quiz, and Daily all reuse the same underlying knowledge base
(Section 5, Section 6).

## Component architecture (established fully in Phase 3)

- `components/` holds only generic, reusable, content-agnostic primitives
  (Button, Card, Badge, CommandBlock, Tabs, Modal, etc. — the list in
  Section 34).
- `features/<name>/` may compose those primitives into feature-specific
  layouts (e.g. a `CommandCard` that renders a `GitCommand` using generic
  `Card`/`Badge`/`CommandBlock` primitives), but must not redefine visual
  primitives that already exist.
- If a screen needs something the Design System doesn't have yet, the
  primitive is added to `components/` first, then used — never a one-off
  page-local style (Section 11).

## State & data flow

No global client state library. Per-feature local state (`useState`) plus
a few small hooks (`useTheme`, `useReducedMotion`, `useSearchIndex`) are
sufficient — there is no server data to synchronize. Theme preference and
any future local progress data (Section 41, GitBit 2.0) will live in
`localStorage`, read through a hook, never reached into directly from
components.

## Notification pipeline (Section 9)

Section 9's four boxes — content, generation, scheduling, delivery — are
now all present and kept decoupled:

| Box | Where it lives |
| --- | --- |
| Content | `content/daily/` — plain typed `DailyContentItem`s |
| Generation | `services/dailySelection.ts` — picks today's item |
| Scheduling | the `crons` entry in `vercel.json` |
| Delivery | `api/daily-push.ts` → OneSignal → Web Push |

`services/dailySelection.ts` is the single source of truth for "which bit
is today's", imported by both the `/daily` page and the cron function, so
a push can never name a different bit than the page shows. Its day index
is **UTC-pinned**: the cron function has no local timezone, and a
local-time index would hand users east or west of the server a different
item than the one that was pushed.

Only items with `notificationEligible: true` enter the rotation — the
flag's purpose is to keep items too long for a push banner out of the
headline slot. Those items still render in the feed below "Today's
GitBit", so nothing is hidden from the app.

`api/daily-push.ts` is the one server-side file in the project. It exists
because delivery cannot be done from a static client — something has to
call OneSignal once a day. It still honours Section 9's MVP constraints:
no database, no auth, no paid service (Vercel cron and the OneSignal free
tier both cover it). Two consequences worth knowing:

- **Crons only run on Production deployments.** Preview deploys never
  fire the push, which is intended — one push a day, not one per branch.
- **Imports into the function obey Vercel's compiler, not Vite's.**
  Vercel transpiles `api/` and every `src/` file it reaches per-file with
  `tsc` (`moduleResolution: node16`), without bundling, into an ESM
  lambda. Relative imports therefore need explicit `.js` extensions and
  `@/*` aliases don't resolve — both fail only at runtime, as
  `FUNCTION_INVOCATION_FAILED`.
- **The route is guarded by `CRON_SECRET`.** Vercel sends it as
  `Authorization: Bearer <secret>` on cron runs. If the env var is unset
  the route refuses to send rather than sitting there as an open
  "push to every subscriber" endpoint.

The SPA rewrite in `vercel.json` excludes `/api/` (`/((?!api/).*)`), and
the Workbox `navigateFallbackDenylist` excludes it too, so neither the
static fallback nor the offline service worker can swallow the route.

## Current status

All ten phases from the development brief are complete: Design System
(Phase 3, see [`docs/DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)), the content
model (Phase 4), every product module's UI (Phase 5), PWA support
(Phase 6), and responsive/accessibility/performance QA (Phases 7-9) —
each with real findings fixed, not just reviewed. See the README's
roadmap section for what's intentionally deferred to GitBit 2.0/3.0.

One known content gap: Learn's Level 4 (Collaboration) and Level 6
(Advanced Git) are thin — one concept and one command each — since
Phase 4 deliberately prioritized breadth across fundamentals over full
depth on every level. Worth a follow-up content pass before the levels
feel as complete as Levels 0-3.
