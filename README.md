# GitBit

> **Git, one bit at a time.**

GitBit is a beginner-friendly, mental-model-first Git learning and
reference PWA. It doesn't just list commands — it bridges Git
terminology → plain English → mental model → command → real-world
situation, so developers understand *what Git is doing* and *why*, not
just which command to paste.

## Product philosophy

Most developers can type `git add . && git commit -m "update" && git push`
without understanding what state their project is actually in, what each
command changes, or what to do when something goes wrong. GitBit exists
to close that gap through:

- **GitBit Quick** — a fast, searchable command cheat sheet.
- **GitBit Learn** — a structured learning path from Git basics to
  advanced topics.
- **GitBit Aha** — short, highly visual conceptual explanations.
- **GitBit Quiz** — knowledge checks that test understanding, not recall.
- **GitBit SOS** — calm, step-by-step recovery guides for "I messed up
  Git" moments.
- **GitBit Terminal** — a terminal-inspired interface that explains what
  commands do.
- **GitBit Daily** — daily micro-learning (future push notifications).

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full
information architecture, routing, and codebase structure, and
[`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) for the design tokens,
theming, and component primitives everything is built from — also
viewable live at the `/design-system` route.

## Technology

- React 19 + TypeScript
- Vite
- React Router (data router, lazy-loaded routes)
- Tailwind CSS v4
- Self-hosted fonts: Manrope (UI) and Ubuntu Mono (code/commands)
- `vite-plugin-pwa` for installability and offline support

No backend, database, authentication, or paid APIs — GitBit's MVP is a
fully static, content-driven app deployable on any static host (Vercel,
Netlify, GitHub Pages).

## Development

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check and produce a production build
npm run preview   # preview the production build locally
npm run lint      # lint the codebase
npm run icons     # regenerate PWA/touch icons from public/icon*.svg
```

## PWA

GitBit is a genuine installable PWA. A service worker (`vite-plugin-pwa`,
generated at build time) precaches the entire app — since there are no
API calls, everything including all Git content works fully offline
after the first visit, not just previously-viewed pages. The manifest,
icons (192/512/512-maskable + Apple touch icon), theme colors, and
safe-area handling are all wired up; see `docs/DESIGN_SYSTEM.md` for how
the icon set is generated and kept replaceable.

## Roadmap

**GitBit 2.0** — accounts, learning progress, bookmarks, streaks, spaced
repetition, real Web Push notifications, cloud sync.

**GitBit 3.0** — optional GitHub integration: repository inspection,
personalized suggestions, PR learning, commit history visualization.

These are future directions, not MVP requirements — the current
architecture is intentionally kept simple so they can be added later
without a rewrite.
