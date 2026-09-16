# GitBit Design System

Production-grade UI is built from this system, not invented per screen
(Section 11). View it live at `/design-system` while running the app —
every primitive below is rendered there.

## Tokens

All tokens live in `src/styles/tokens.css` as CSS custom properties,
mapped into Tailwind's `@theme` so ordinary utility classes
(`bg-accent`, `text-foreground-secondary`, `rounded-lg`, `shadow-md`,
`ease-standard`) resolve back to a token. Never hard-code a raw color,
radius, or shadow value in a component — extend `tokens.css` instead.

| Category   | Where |
|------------|-------|
| Color      | Semantic tokens: `background`, `background-subtle`, `surface`, `surface-hover`, `border`, `border-strong`, `foreground` (+`-secondary`/`-tertiary`/`-inverse`), `accent` (+`-strong`/`-subtle`/`-border`), `card` (+`-hover`), `info`/`safe`/`caution`/`danger` (+`-subtle`/`-border`), `highlight` (+`-hover`/`-ink`), `feature` (+`-hover`/`-border`/`-text`/`-text-secondary`), `code-bg`/`code-text`/`code-muted`, `terminal-*`, `palette-ink`/`palette-lime`. |
| Typography | `--font-sans` (Manrope), `--font-mono` (Cascadia Code, via `@fontsource/cascadia-code`). Type scale lives in `components/ui/Typography.tsx` (`Heading` levels 1-4, `Text` variants `body-lg`/`body`/`body-sm`/`caption`). The scale is deliberately compact: body is 14px, `body-sm` 13px and `body-lg` 15px (`--text-body-sm`/`--text-body-lg` in `tokens.css`, **also registered in `utils/cn.ts`** — tailwind-merge drops unknown sizes), h1 tops out at 30px. Every page title goes through `PageHeader` — never set a raw `text-*` size on a heading/paragraph outside Typography. `Heading`'s `level` prop picks the semantic tag (h1-h4) and must stay sequential in a page's reading order; its `size` prop picks the visual size when it needs to differ. Card/grid item titles reused at different depths are rendered `as="p"`. |
| Spacing    | Tailwind's default spacing scale (0.25rem increments) is used as-is — it's already a centralized token system; no need to reinvent one. |
| Radius     | `--radius-sm/md/lg/xl` are all `0` — square corners are the look. `rounded-full` is kept only for true circles (unread dot, progress ring). |
| Shadow     | Hard, unblurred ink offsets down-left: `shadow-brutal` (`-7.778px 7.778px 0 0 #1f2015`, cards/dialogs/toasts/terminal), `shadow-brutal-sm` (`-3px 3px`, buttons/alerts/controls), and a `-pressed` step of each for hover. `shadow-xs/sm/md/lg` alias onto them. **Custom shadow names are also registered in `utils/cn.ts`.** |
| Motion     | Duration by convention: `duration-150` (micro, e.g. tag/tab hover), `duration-200` (default — most transitions), `duration-300` (larger surfaces — dialogs, progress). Easing: `--ease-standard`, `--ease-out-soft`, `--ease-in-soft` → `ease-standard` etc. |
| Z-index    | Semantic, not numeric: `--z-header/dropdown/overlay/modal/toast/tooltip`, applied via the `z-header`/`z-dropdown`/… utilities defined in `styles/base.css`. |
| Opacity    | Tailwind's default opacity scale, used by convention: `disabled:opacity-45` for disabled controls. |
| Breakpoints| Tailwind defaults (`sm`640 / `md`768 / `lg`1024 / `xl`1280) — chosen because they line up exactly with the brief's required test widths; 320/375/390 are the unprefixed mobile-first base. |

## Palette

Neo-brutalist, two colours on a white page:

| Colour | Role |
|--------|------|
| `#1f2015` ink  | Text, every border (2px), every shadow, code chips/blocks, the terminal, `primary` buttons, selected tags/tabs, the home hero band. Token names kept from the old system: `accent`, `border`, `foreground`, `feature` and `code-bg` all resolve to ink. |
| `#e4ff30` lime | **Every card** (`card`), `highlight` buttons, active nav, badges on ink, `<mark>`, step numbers, and text on the ink hero. On lime, secondary text is `#45473a` (8.4:1) and tertiary `#5f6152` (5.6:1). Lime is ~1.1:1 on white, so it is never text on a light ground. `::selection` is ink-on-lime rather than lime, since most text already sits on lime. |

`info`/`safe`/`caution`/`danger` are pastel fills (`-subtle`) carrying
**ink** text inside an ink border — never coloured text on a pastel,
which doesn't reach AA at 14px. The saturated `info`/`safe`/`caution`/
`danger` values are for icons only. They keep conventional
blue/green/amber/red meaning; recolouring them to lime/ink would cost more
in comprehension than it wins in cohesion.

Every text/background pair meets WCAG AA — verified numerically across
every route (645 text elements), not by eye.

## Service worker updates

The build is fully precached, so a shipped change does not reach a
returning visitor on its own. `registerType: 'prompt'` leaves a new
worker waiting and `ServiceWorkerUpdatePrompt` surfaces it as a toast
with a Reload action — deliberately not `autoUpdate`, which would reload
the page out from under someone mid-quiz. Toasts carrying an `action`
can pass `duration: null` to stay until acted on or dismissed.

### The mark

The logo is one raster file, `src/assets/gitbit-logo.png` (512×512): a
lime GitHub-mark circle on a near-black square. The header
(`components/GitBitLogo.tsx`) imports it directly, and `npm run icons`
(`scripts/generate-icons.mjs`) generates every other copy from it —
`public/favicon.png`, `apple-touch-icon.png`, and the PWA's
`icons/icon-192/512.png` and `icon-maskable-512.png`. **To change the
logo, replace that one file and run `npm run icons`.** The maskable icon
reuses the same art because the circle stays inside Android's 80% safe
zone (197px of 205px from centre) — re-check that if the artwork changes.

The glyph is the GitHub Octocat. It is GitHub's registered trademark, and
GitHub's usage terms do not cover third-party products using it as their
own identity — worth revisiting before this goes anywhere beyond a
personal project.

## Theming

There is one theme. The design is defined light (white page, ink and
lime), and dark mode was removed along with `ThemeProvider`,
`ThemeToggle` and `useTheme`. `tokens.css` has no
`prefers-color-scheme` or `data-theme` blocks, so an OS dark preference
renders the same page. The PWA `theme_color`/`background_color` and the
`theme-color` meta are white.

## Visual language (Section 15-19)

- `.bg-grid` — the subtle signature grid background.
- `.hero-gradient` — slow single-color radial drift; frozen to a static
  position under `prefers-reduced-motion: reduce` (see `styles/base.css`).
- `.glass` — now a solid white panel with the 2px ink border, for the
  header, `Pagination`, and `Toast` (the name predates the redesign).
- `.bg-grid` + `.bg-grid-feature` — the grid, in faint lime on the ink hero.
- Thin scrollbar styling is global (`styles/base.css`), both
  `scrollbar-width: thin` (Firefox) and `::-webkit-scrollbar` (Chromium).

## Components (`src/components/ui`)

Button/ButtonLink, IconButton, Badge (+`DangerBadge` for `DangerLevel`), Tag, Card, PageHeader, ChipLink,
Input, SearchInput, CodeBlock, CommandBlock (Git commands, with optional
anatomy breakdown per Section 29), TerminalBlock (ink simulated
terminal, Section 4), Alert, Tooltip, Tabs/TabPanel, Breadcrumbs,
Pagination (+`ProgressRing`), Dialog (built on native `<dialog>`),
Toast/`ToastProvider`/`useToast`, EmptyState, LoadingState/`Skeleton`,
ErrorState, Typography (`Heading`/`Text`).

Content-bound cards (`src/components/cards`) compose those primitives
against the typed content shapes in `src/content/types.ts`: `CommandCard`,
`LessonCard`, `AhaTile` (named to avoid colliding with the `AhaCard`
content type), `QuizCard`, `SosCard`, `ModuleCard`.

### Buttons

`Button` (actions) and `ButtonLink` (navigation — a real `<a>`) share
`buttonClassName`, so they are identical visually. Never wrap a `Button`
in a `Link`, and never navigate from a Button's `onClick` when a
`ButtonLink` would do. Every button is square with a 2px ink border and
bold label, at 32/36/40px (`sm`/`md`/`lg`); `IconButton` uses the same
heights. Raised variants carry `shadow-brutal-sm` and press toward it on
hover/active — they translate by exactly the shadow they lose, so the
shadow's outer corner stays put. Variants: `primary` (ink, lime text —
the default), `secondary` (white), `danger` (pastel red), `highlight`
(lime — one headline action per view), `ghost` (no border until hover)
and `inverse` (outline, on the ink hero). Icon-only links use
`iconButtonClassName`.

### Cards

Every card is the reference card: lime fill, 2px ink border, square
corners, `shadow-brutal`, `p-4`. Interactive cards press in on hover the
same way buttons do. `cardClassName` includes `min-w-0` so a truncated
line inside a grid item can't widen the page. Grids of cards use `gap-4`
(16px) — the shadow hangs ~8px below each card and needs the room.
Variants: `default` and `accent` (an alias — both lime) and `feature`
(ink ground, for non-card bands like the hero). Code inside a card is an
ink chip with white text (`bg-code-bg text-code-text`), like the
reference's `git init`. Content cards lead with a body-size title and
clamp supporting copy to two lines. Other shared primitives:
`PageHeader` (every page title), `ChipLink` (square related-link chips)
and `ModuleCard` (home module rows, with an ink icon block).

**Rule:** if a screen needs UI that isn't here, add it to
`components/ui` (or compose existing primitives in `components/cards`)
first — never style a one-off element inside a feature page.

## Accessibility baked into the primitives

- Every interactive primitive has visible `:focus-visible` styling
  (global, `styles/base.css`) — never suppressed.
- `IconButton` requires a `label` prop (used as both `aria-label` and
  `title`).
- `Tabs` implements the WAI-ARIA tabs pattern: roving tabindex,
  Arrow/Home/End navigation, `aria-selected`/`aria-controls`.
- `Dialog` uses the native `<dialog>` element for a free, correct focus
  trap and Escape-to-close.
- `Alert` uses `role="status"` (info/success/warning) or `role="alert"`
  (danger) so screen readers announce it appropriately.
- `Toast` renders into an `aria-live="polite"` region.
- `prefers-reduced-motion: reduce` is handled globally — see
  `styles/base.css`.

## Known gap

The `/design-system` route itself was checked at 500px, 768px, 1024px,
and 1280px+ in a real browser. The devtools resize tool used for this
session floors at 500px width, so 320/375/390 could not be captured as
literal screenshots — the layout is mobile-first (fluid grids, wrapping
flex, contained `overflow-x-auto` only where intentional, no fixed pixel
widths), so it should hold, but worth a real spot-check on an actual
narrow device/emulator before shipping.
