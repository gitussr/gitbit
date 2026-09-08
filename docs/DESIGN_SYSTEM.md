# GitBit Design System

Production-grade UI is built from this system, not invented per screen
(Section 11). View it live at `/design-system` while running the app —
every primitive below is rendered there in both themes.

## Tokens

All tokens live in `src/styles/tokens.css` as CSS custom properties,
mapped into Tailwind's `@theme` so ordinary utility classes
(`bg-accent`, `text-foreground-secondary`, `rounded-lg`, `shadow-md`,
`ease-standard`) resolve back to a token. Never hard-code a raw color,
radius, or shadow value in a component — extend `tokens.css` instead.

| Category   | Where |
|------------|-------|
| Color      | Semantic tokens: `background`, `background-subtle`, `surface`, `surface-hover`, `border`, `border-strong`, `foreground` (+`-secondary`/`-tertiary`/`-inverse`), `accent` (+`-strong`/`-subtle`/`-border`), `info` (+`-subtle`/`-border`), `safe`/`caution`/`danger` (+`-subtle`/`-border` each), `code-bg`/`code-text`, `brand`/`brand-mark` (fixed in both themes), `terminal-bg`/`terminal-text`/`terminal-prompt`. |
| Typography | `--font-sans` (Manrope), `--font-mono` (Ubuntu Mono). Type scale lives in `components/ui/Typography.tsx` (`Heading` levels 1-4, `Text` variants `body-lg`/`body`/`body-sm`/`caption`) — never set a raw `text-*` size on a heading/paragraph outside that file. `Heading`'s `level` prop picks the semantic tag (h1-h4) and must stay sequential in a page's reading order; its `size` prop picks the visual size when it needs to differ (e.g. a real h2 subsection that should look smaller) — never fake a size by adding a conflicting `text-*` className, since Tailwind's responsive variants (`md:text-*`) won't get cancelled that way. Card/grid item titles reused at different depths (e.g. `CommandCard`) are rendered `as="p"` — not a heading at all — since they can't have one correct semantic level across every page that embeds them. |
| Spacing    | Tailwind's default spacing scale (0.25rem increments) is used as-is — it's already a centralized token system; no need to reinvent one. |
| Radius     | `--radius-sm/md/lg/xl` → `rounded-sm/md/lg/xl`. |
| Shadow     | `--shadow-xs/sm/md/lg` → `shadow-xs/sm/md/lg` (elevation). |
| Motion     | Duration by convention: `duration-150` (micro, e.g. tag/tab hover), `duration-200` (default — most transitions), `duration-300` (larger surfaces — dialogs, progress). Easing: `--ease-standard`, `--ease-out-soft`, `--ease-in-soft` → `ease-standard` etc. |
| Z-index    | Semantic, not numeric: `--z-header/dropdown/overlay/modal/toast/tooltip`, applied via the `z-header`/`z-dropdown`/… utilities defined in `styles/base.css`. |
| Opacity    | Tailwind's default opacity scale, used by convention: `disabled:opacity-45` for disabled controls. |
| Breakpoints| Tailwind defaults (`sm`640 / `md`768 / `lg`1024 / `xl`1280) — chosen because they line up exactly with the brief's required test widths; 320/375/390 are the unprefixed mobile-first base. |

## Palette

Source: Color Hunt `362f4f-5b23ff-008bff-e4ff30`. Four colours, each with
one job:

| Colour | Role |
|--------|------|
| `#5b23ff` violet | `accent` — brand: buttons, links, focus ring, `.bg-grid`, selection |
| `#008bff` azure  | `info` — informational messaging (`Alert variant="info"`), deliberately separate from the brand accent so "this is GitBit" and "this is a note" don't look identical |
| `#362f4f` indigo | the dark theme's whole neutral ramp (bg/surface/border are tints and shades of it), used at full strength as its `border` |
| `#e4ff30` lime   | `brand-mark` (the logo glyph) and `terminal-prompt` — a high-energy accent that only reads well on a dark ground, so it's used only where the ground is always dark |

Each colour appears at full strength where contrast allows, and is
darkened or lightened per theme where it doesn't: `--gb-accent` is
literally `#5b23ff` in light mode but a lighter tint in dark mode, and
`--gb-info` is a darkened azure in light mode so it clears AA as text.

`safe`/`caution`/`danger` keep conventional green/amber/red. They are
semantic signals rather than brand colour, and a four-colour palette has
no distinguishable "success" and "error" pair — recolouring them would
cost more in comprehension than it wins in cohesion.

Every foreground/background pair in both themes meets WCAG AA (verified
numerically, not by eye).

### The mark

`brand` (`#5b23ff`) and `brand-mark` (`#e4ff30`) are fixed in both themes,
unlike `accent`. The header logo (`components/GitBitLogo.tsx`) and the
installed app icon (`public/icon.svg`, `icon-maskable.svg`, `favicon.svg`)
use the same two colours in the same arrangement, so they read as one
identity — **edit them together.** Deriving the chip from `accent` instead
would recolour it in dark mode, where the lighter violet leaves too little
contrast under the lime glyph. After editing any icon SVG, run
`npm run icons` to regenerate the PNGs.

The glyph is the GitHub Octocat. It is GitHub's registered trademark, and
GitHub's usage terms do not cover third-party products using it as their
own identity — worth revisiting before this goes anywhere beyond a
personal project.

## Theming

Light/dark/system (Section 14) via `ThemeProvider` (`src/hooks/useTheme.tsx`):

- `system` (default): no `data-theme` attribute is set; `tokens.css`'s
  `prefers-color-scheme` block drives the palette.
- `light` / `dark`: sets `data-theme` on `<html>`, which always wins over
  the OS preference.

Preference persists to `localStorage` (`gitbit-theme`). Use `useTheme()`
to read `theme` / `resolvedTheme` or call `setTheme()`.

## Visual language (Section 15-19)

- `.bg-grid` — the subtle signature grid background.
- `.hero-gradient` — slow single-color radial drift; frozen to a static
  position under `prefers-reduced-motion: reduce` (see `styles/base.css`).
- `.glass` — frosted glass (`backdrop-filter: blur`) for the header,
  `Pagination`, and `Toast` — never applied to full-page surfaces.
- Thin scrollbar styling is global (`styles/base.css`), both
  `scrollbar-width: thin` (Firefox) and `::-webkit-scrollbar` (Chromium).

## Components (`src/components/ui`)

Button, IconButton, Badge (+`DangerBadge` for `DangerLevel`), Tag, Card,
Input, SearchInput, CodeBlock, CommandBlock (Git commands, with optional
anatomy breakdown per Section 29), TerminalBlock (always-dark simulated
terminal, Section 4), Alert, Tooltip, Tabs/TabPanel, Breadcrumbs,
Pagination (+`ProgressRing`), Dialog (built on native `<dialog>`),
Toast/`ToastProvider`/`useToast`, EmptyState, LoadingState/`Skeleton`,
ErrorState, Typography (`Heading`/`Text`).

Content-bound cards (`src/components/cards`) compose those primitives
against the typed content shapes in `src/content/types.ts`: `CommandCard`,
`LessonCard`, `AhaTile` (named to avoid colliding with the `AhaCard`
content type), `QuizCard`, `SosCard`.

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
