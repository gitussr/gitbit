# GitBit Visualizer — Information Architecture & Interaction Model

The design reference for GitBit Visualizer, the flagship feature defined
in `GitBit Visualizer - Master Development Prompt.md`. Inline comments in
`src/services/git-sim/**` and `src/features/visualizer/**` cite this
document the way the rest of the codebase cites `PRODUCT_SPEC.md`.

This is Task 2 of the Visualizer brief's §47 sequence: what gets built
and how it behaves. Task 3 builds the engine described in
[Simulation engine](#simulation-engine).

Everything here sits inside the two rules the repo already enforces
(see [`ARCHITECTURE.md`](ARCHITECTURE.md)): **no Git knowledge inside
components**, and **no UI that isn't a Design System primitive first**.

## The one-sentence product

> Type a Git command, watch the repository state actually change, and
> read what moved in plain English.

Everything below is in service of that. Where a choice traded fidelity
of the picture against correctness of the idea, correctness won (§38).

## Routes

```
/visualizer                 The workspace, free play
/visualizer/:scenarioSlug   The same workspace, running a guided scenario
```

The flagship is the workspace itself, so `/visualizer` **is** the
workspace — not an index page the workspace hides behind. The scenario
rail is visible from the first frame, which is what §28 ("do not make
users start from an empty screen") actually asks for: not a menu, but a
first move already suggested. Deep links to a scenario still get the
module/detail URL shape every other GitBit module uses.

Both routes render one lazy component, `features/visualizer/VisualizerPage`.
A scenario slug only changes the seed state and turns the rail's guidance
on.

### Navigation changes

| Surface | Change |
|---------|--------|
| `primaryNav` (`app/Layout.tsx`) | **Visualizer replaces Terminal.** The bar holds seven items before it collapses at `md`; the flagship earns the slot. |
| Home module grid | Gains GitBit Visualizer in first position. Terminal keeps its row. |
| `/terminal` | Unchanged. It answers "what does this command do?" as a lookup; the Visualizer answers "what does it do *to my repository, right now*?" Each page links to the other. |
| Search | Unaffected — the Visualizer holds no indexable prose of its own (see [Content integration](#content-integration)). |

## Layout

Four regions, one arrangement, re-flowed rather than redesigned per
breakpoint (§32 — "do not simply shrink the desktop visualizer", but
also don't build two products).

```
┌─ Scenario rail ────────────────────────────────┐   collapsible
├─ Stage ────────────────────┬─ Explainer ───────┤
│                            │                   │
│  YOUR COMPUTER             │  What happened?   │
│  ┌ Working Directory ┐     │  Why?             │
│           ↓                │  Where did it go? │
│  ┌ Staging Area      ┐     │  Remember this    │
│           ↓                │                   │
│  ┌ Local Repository  ┐     │  › Technical      │
│    ● ─ ● ─ ●  graph        │                   │
│  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌      │  💡 Aha           │
│  REMOTE (origin)           │  ? Recall         │
│  ┌ Remote Repository ┐     │                   │
├────────────────────────────┴───────────────────┤
│ $ git add index.html                    [Run]  │   sticky
└────────────────────────────────────────────────┘
```

- **Stage is always vertical.** Working Directory → Staging Area → Local
  Repository top to bottom, at every width. `GitStateFlow` turns
  horizontal at `lg`; the Visualizer deliberately doesn't, because
  "down" must mean "further into Git" in every animation at every
  breakpoint. One direction, one set of transform geometry, no fork.
- **The dashed boundary is a teaching device, not decoration.** Local
  and remote are separated by a labelled divider that `push`/`fetch`
  animate *across*. It is the answer to §23: the remote is a different
  place, and it is labelled "Remote (origin)", never "GitHub".
- **The console is docked at the bottom at every width** (sticky within
  the workspace, not `position: fixed`). §33's mobile sketch puts it
  there, and a console that moves between breakpoints is a console
  people lose.
- Below `lg` the Explainer moves beneath the Stage and the scenario rail
  collapses to a single-line step indicator. The workspace grid is
  `grid-cols-1` there, not an implicit column: an implicit track sizes to
  its widest item's min-content, which once pushed the page to 421px on a
  375px phone.
- The Explainer column reads the same at every width: what just happened
  (and a reset's readout), then the edit and simulator controls, then Aha
  and Recall, then the Time Machine. Explanation first, because below
  `lg` this column follows the stage and it's what someone who just ran a
  command is looking for. It's DOM order, not CSS `order`, so tab order
  and a screen reader match the screen.
- The graph is the one element allowed a horizontal scroll container
  (`ScrollX`). A row never gets narrower than `MIN_ROW` (hash, a label, a
  few words); past that, many lanes on a phone scroll sideways, with the
  far edge fading as the cue, instead of crushing every message to a
  letter. The usual one- or two-lane graph fits at 320px and doesn't scroll.
- The console is a terminal window, and a fixed-size one. macOS chrome
  (traffic lights, a title bar), one scrollback where each command is
  followed by what Git printed and then a `#` comment saying what it
  meant (the "What just happened" sentence, or a refusal's *why*), and the
  prompt as the last line of it — so the result appears exactly where
  the reader typed. The prompt is git-aware, like `__git_ps1`
  (`features/visualizer/prompt.ts`): `project (main) $`, the commit when
  detached, `|MERGING`/`|REVERTING` mid-conflict, and each entry keeps
  the prompt it ran under. A long result is shown from its command line.
  The footer is one row: suggestions, or tappable completions while
  typing (a phone has no Tab key), and Run. Focus stays in the prompt
  after Run, so a phone keyboard stays up. Scrollback: 160px on phones,
  208px from `sm`, 96px on short landscape screens.
- Below `lg` a title-bar button (a real 32px target — the traffic lights
  stay decorative) expands the terminal to **full screen**. The window is
  portalled to `<body>`: inside the dock it would be trapped in the sticky
  wrapper's stacking context, under the site header, whatever its z-index.
  It's the same component, so the typed line and history carry over. While
  expanded it's an `aria-modal` dialog, everything else is `inert`, the page
  stops scrolling, and it's sized to the *visual* viewport — the part above
  an on-screen keyboard — staying anchored to its bottom as the keyboard
  comes up, so the prompt and Run are never hidden. Esc clears a typed line
  first, then exits. The dock holds its height meanwhile, so the page comes
  back exactly where it was (verified: same scroll position, zero
  unexpected layout shift).
- **Nothing moves when a command runs.** Measured with the browser's
  layout-shift API, the worst command went from 0.53 (phone) to 0.01.
  What it takes: the terminal never changes height; it scrolls its own
  scrollback by hand, never with `scrollIntoView()`, which on an element
  in a sticky dock scrolls the *page*; the dock cancels the page's bottom
  padding, so it sits at the same spot pinned or not; the Aha/Recall
  cards stay until a newer moment replaces them, with a "From `…`"
  caption that's always there, and sit last in their column so a new one
  pushes nothing; "What just happened" has a four-line minimum; and the
  column only grows during a session (`useHighWaterHeight`), because a
  shrink at the bottom of the page clamps the scroll and slides the stage.

The legend (§31) is a closed `<details>` directly above the stage — one
23px line until opened, never a permanent column. Its words are content
(`content/visualizer/legend.ts`); each entry names a glyph, and
`VisualizerLegend` draws it with the primitive that draws it on the stage
(`LaneNodeSwatch`/`LaneEdgeSwatch` share `LaneGraph`'s own node code,
`FileStatusSwatch` shares `FileNode`'s status table, refs are real
`BranchLabel`s), so the key can't drift from the picture. It lists only
marks the stage draws: §31's ahead/behind arrows aren't one — the
Visualizer reports those as `git status` text.

## Simulation engine

Pure, framework-agnostic, under `src/services/git-sim/` — the repo
already requires `services/` to hold no React imports, which is exactly
the separation §36 asks for.

```
src/services/git-sim/
  types.ts       RepoState, Commit, HeadRef, Tree, FileChange
  events.ts      The GitEvent union
  result.ts      Outcome, CommandResult, Transition
  repo.ts        Derived views: staged/unstaged/untracked, ancestry, refs
  hash.ts        Content-derived commit ids
  diff.ts        Line diff and hunks (Section 21)
  seed.ts        Named starting states
  workspace.ts   Editing files in the sandbox (not a Git command)
  parse.ts       string -> ParsedCommand | ParseError
  validate.ts    Can this command start? -> GitError | null
  commands/      One module per command: (state, parsed) -> CommandResult
  graph.ts       RepoState -> rows, lanes and edges for the history graph
  merge3.ts      Line-level three-way merge of one file
  timeline.ts    Every commit, snapshots, file history (Time Machine)
  progress.ts    Scenario steps judged by what happened
  suggest.ts     RepoState -> the commands that make sense next
  complete.ts    RepoState + partial input -> Tab completions
  execute.ts     The single entry point
  index.ts       The public surface feature code imports
```

### The index is the whole index

`RepoState.index` holds **every tracked file**, not only the ones with
pending changes, and the Staging Area panel is *derived* as the
difference between HEAD and the index.

This is the decision the rest of the engine's honesty rests on.
`git commit` does not empty the index — it records it. The panel looks
empty afterwards because index and HEAD now agree. Modelling it the
lazy way (a list of "staged files", cleared on commit) would animate
correctly today and then make `reset --soft/--mixed/--hard` three
special cases instead of three layers (Section 18), and would have no
way to show a file that is staged *and* edited again sitting in two
places at once — which real `git status` shows, and which is one of the
better Aha moments available.

```ts
executeCommand(state: RepoState, input: string): Transition

interface Transition {
  input: string
  before: RepoState
  after: RepoState        // === before when the command only reads
  events: GitEvent[]
  outcome: Ok | GitError | ParseError
}
```

`RepoState` is a plain immutable object: `workingTree`, `index`,
`commits`, `branches`, `HEAD`, `remoteBranches`, `stash`. State names
derive from the `GitStateId` union already in `src/content/states.ts`,
so the simulator cannot drift from the model Learn, Quick and Aha teach.

Three properties this buys, and the reasons they're worth the structure:

- **The UI cannot contain Git logic**, because the UI never gets a
  chance to decide anything — it receives a `Transition` and renders it.
- **Undo is free.** Every transition retains its `before`, so §27's undo
  is a pop, not an inverse-operation engine.
- **It is testable without a DOM**, which is what makes the Vitest
  decision cheap (see [Testing](#testing)).

The engine emits events; it does **not** emit prose. It has no import of
`src/content/**`. Teaching is the Explainer's job.

### Switching

`switch` and `checkout` share `commands/moveHead.ts`, which rewrites only
the paths that differ between the snapshot you leave and the one you
reach. Everything else on disk is left alone, so uncommitted work
*follows you* to the other branch, and Git refuses only when a path it
must rewrite has local changes (or an untracked file is in its way).
That falls out of the rule rather than being a special case, and it's
one of the better surprises available.

`checkout <commit>` detaches HEAD without being asked, the way people
actually end up there; `switch` refuses a bare commit unless given
`--detach`. `checkout <file>` says it isn't simulated yet rather than
guessing.

HEAD's visual treatment is ink with a lime core (node) and ink with lime
text (label), never a plain lime fill: the panel HEAD lives in turns lime
when it lights, which is exactly the moment HEAD has just moved.

### Merging

`git merge` has three outcomes, and telling them apart is the lesson
(§16): **already up to date**, **fast-forward** (the branch label slides
forward, no new commit — `FAST_FORWARD`, never `MERGE_CREATED`), and a
**merge commit** with two parents. `--no-ff` and `--ff-only` exist so the
difference can be produced on purpose.

Merging is line-level, not file-level (`merge3.ts`, a small diff3 against
the merge base). Two branches that change different lines of one file
merge cleanly, as in Git; a file-level simulator would report conflicts
Git never shows and teach that sharing a file is dangerous.

A conflict is not a refusal. Git merges what it can, writes both versions
between markers, keeps yours in the index, and waits: `RepoState.merging`
is `MERGE_HEAD`. `git add` resolves a path (without checking for leftover
markers — Git doesn't either), `git commit` concludes with the prepared
message and two parents, `git merge --abort` restores what the merge
wrote. Switching and merging again are refused meanwhile. `switch`,
`checkout` and `merge` share one rule for when rewriting files would
destroy local work (`rewriteFiles` in `commands/moveHead.ts`).

### Undoing

`restore`, `reset` and `revert` are three different undos, and the
Visualizer keeps them visibly different (§18):

- `git restore <file>` puts the **disk** back to the index;
  `--staged` puts the **index** back to HEAD (unstaging — nothing lost);
  `--source=<commit>` restores an older version; during a conflict
  `--ours`/`--theirs` pick a side without resolving it.
  `git checkout -- <file>` is the same operation under its older name.
- `git reset` moves the branch, and its mode says how far down the layers
  it reaches: `--soft` HEAD only, `--mixed` (default) HEAD + index,
  `--hard` all three. `RESET_PERFORMED.layers` lists the layers it
  *actually* changed — HEAD is omitted when it didn't move, so
  `git reset --hard` alone doesn't claim to have moved anything. The stage
  lights those panels one after another (`STEP_MS`), together under
  reduced motion, and a readout beside it says changed/kept per layer.
  Undone commits drop out of the graph but stay in the object store.
  `git reset <file>` is the older spelling of `restore --staged`.
- `git revert` adds a commit that applies another's opposite — a
  three-way merge with the commit as base and its parent as "theirs"
  (`combine` in `commands/merge.ts`). It can conflict, and shares
  `RepoState.merging` (`kind: 'revert'`), concluding with one parent via
  `git commit` or `git revert --continue`. Merge commits need `-m 1|2`.

`HEAD~n`, `^` and `^2` resolve in `repo.resolve`.

Anything that destroys uncommitted work says so in its event
(`FILE_RESTORED.discarded`, `RESET_PERFORMED.discarded`). That, and only
that, gives the "What just happened" panel the caution tone
(`panelClassName(…, 'caution')`) — calm, once, with the sentence that
names what Git kept no copy of.

### Events

```
REPO_INITIALIZED  FILE_MODIFIED  FILE_STAGED  FILE_UNSTAGED
FILE_RESTORED  COMMIT_CREATED  HEAD_MOVED  BRANCH_CREATED
BRANCH_DELETED  BRANCH_SWITCHED  HEAD_DETACHED  MERGE_CREATED
FAST_FORWARD  MERGE_CONFLICT  CONFLICT_RESOLVED  MERGE_ABORTED
REMOTE_UPDATED  RESET_PERFORMED  WORK_STASHED  NOTHING_HAPPENED
```

A **failed** command emits no events at all. Events describe change; a
refusal changed nothing and explains itself through its outcome. That
makes an empty array unambiguous — it only ever means failure, because
a *successful* command that changed nothing says so with
`NOTHING_HAPPENED`.

`NOTHING_HAPPENED` is load-bearing. `git status`, `git log` and `git
diff` change nothing, and the honest version of that is an explicit
event saying so — not an empty array the UI quietly renders as a
successful move (§38).

`FAST_FORWARD` is separate from `MERGE_CREATED` for the same reason:
§16 wants people to see that not every merge creates a commit, and that
distinction has to exist in the data before it can exist in the picture.

## The interaction loop

```
input → parse → validate → execute → reduce → animate → explain → (aha) → (recall)
```

1. **Input.** Type and press Enter, or click a suggested command chip.
2. **Parse failure** shows Git's own error text plus one GitBit line
   about what the shape of the command should be. State is untouched.
3. **Validation failure** shows why this command can't work *against
   this state right now* — which is the teachable moment most simulators
   throw away. Validation covers what can be checked before running
   (is this a repository, are the required arguments there, does that
   path exist); a refusal that needs the command's own work to discover,
   like "nothing staged to commit", comes back from the command itself.
4. **Execute** returns the `Transition`. The reducer appends it to
   `history`.
5. **Animate** by mapping events to motion (table below).
6. **Explain** fills the four beginner questions (§29).
7. **Aha** surfaces the first time a change matches a moment rule
   (see [Aha and Recall](#aha-and-recall)).
8. **Recall** offers that moment's Quiz question — never twice in a row
   (§26: "use selectively").

Commands that fail still enter the history and still get explained. A
rejected command is a lesson, not an error state.

### Events → motion

| Event | Motion | Reduced-motion equivalent |
|-------|--------|---------------------------|
| `FILE_MODIFIED` | File node picks up the modified marker | Marker appears |
| `FILE_STAGED` | Node travels Working Directory → Staging Area | Node appears in Staging, target panel highlights once |
| `FILE_UNSTAGED` / `FILE_RESTORED` | The same journey, reversed | As above |
| `COMMIT_CREATED` | Staged nodes converge into a new graph node; Staging empties | New node appears; Staging empties |
| `HEAD_MOVED` | HEAD's label travels to its new row (FLIP, `hooks/useFlip.ts`) | Label re-renders at the new node; panel highlights |
| `BRANCH_CREATED` | Label appears at the node it points to; HEAD stays put | Label appears |
| `BRANCH_SWITCHED` / `HEAD_DETACHED` | HEAD travels; the files the switch rewrote (`paths`) drop into the Working Directory | Both re-render; both panels highlight |
| `MERGE_CREATED` | New ◆ node draws with **two** parent edges | Node and both edges appear |
| `FAST_FORWARD` | HEAD's label travels along existing commits — **no new node** | Label re-renders, with the "no new commit" line |
| `MERGE_CONFLICT` | Conflicted files turn dashed/danger in the Working Directory; a banner says what's waiting | Same — nothing here is motion |
| `REMOTE_UPDATED` | Nodes mirror across the local/remote boundary | Nodes appear on the far side |
| `RESET_PERFORMED` | The layers it changed light in sequence — HEAD, Staging, Working Directory — with a changed/kept readout (§18) | Those layers light together |
| `WORK_STASHED` | Node moves to the stash drawer | Drawer opens with the node in it |

Motion uses `--duration-base` / `--ease-standard` from
`styles/tokens.css`, CSS transforms and SVG only. No animation library,
no canvas, no continuous loop (§39).

**Reduced motion is not "the same thing, faster."** The global rule in
`styles/base.css` collapses every transition to 0.001ms, which is right
for a hover state and wrong for a visualizer whose animation carries the
meaning. The Visualizer reads `useReducedMotion()` — a hook that exists
in the repo today and is imported by nothing — and renders the *end
state* plus a one-step highlight, so what moved is still legible (§12).

Every transition also writes a sentence into an `aria-live="polite"`
region: `index.html moved from Working Directory to Staging Area.` That
line is generated for everyone, animation or not — it's the textual
meaning §40 requires, not an accessibility afterthought.

## Explainer

Beginner by default (§29), four questions, always in the same order:

```
What happened?      One sentence, past tense, concrete.
Why?                The rule that made it happen.
Where did it move?  The state hop, drawn small.
Remember this       The misconception this corrects.
```

`› Technical details` is a collapsed disclosure holding hashes, parents,
refs and remote-tracking state (§30). The Beginner/Advanced preference
persists in `localStorage` through a hook, never read directly from a
component — the rule `ARCHITECTURE.md` already sets.

## Content integration

The Visualizer writes **no** Git prose inside components (§41, and the
repo's own content/UI rule). The Explainer resolves events to content:

| Needs | Comes from |
|-------|-----------|
| What a command means | `GitCommand.humanMeaning` / `whatHappens` / `mentalModel` |
| Where it moves things | `commandStateTransitions[slug]` in `content/states.ts` |
| The misconception | `GitCommand.commonMistake` |
| Aha moments | Existing `AhaCard`s, by slug, from `content/visualizer/moments.ts` |
| Recall questions | Existing `QuizQuestion`s, by slug, from the same rules |

`content/states.ts` already carries `{from, to, summary}` for 19
commands. That's most of "where did it move?" written and reviewed
before the Visualizer existed.

Genuinely new prose — per-variant `reset --soft/--mixed/--hard` notes,
fast-forward vs. merge-commit copy, validation-failure explanations —
goes in a new typed `src/content/visualizer/` module. Plain data, no
JSX, same as every other content folder.

## Aha and Recall

§25 and §26, built on the same two ideas as scenarios: judged by what
happened, derived from history.

`content/visualizer/moments.ts` is plain data. Each rule is an
`Expectation` — the type scenario steps use, judged by the same `meets()`
— pointing at an existing `AhaCard` slug and/or an existing
`QuizQuestion` slug. Rules carry no prose, so the Visualizer teaches in
the Aha and Quiz modules' own words (§41). The one question written for
it, §26's "where is it now?" (`where-staged-changes-wait`), went into the
Quiz bank, where /quiz asks it too.

`features/visualizer/moments.ts` walks the history. For each change the
first rule with something *new* to show wins, so rules run specific to
general: a conflicting pull is about the conflict, `switch -c` about the
branch it made. An Aha card appears the first time only, even when two
rules share it. A Recall is never asked straight after another; one
skipped for that reason is asked the next time its moment comes round.
Nothing is stored — undo takes a moment away and redo brings it back,
like scenario progress — and only a change that *just happened* gets
one, never the entry an undo exposed.

Both render in the Explainer column below "What just happened":
`AhaMoment` (the statement and explanation; the card's usual picture is
left out, since the stage beside it is the picture) and `RecallCard`
(`ChoiceList`, one try, the Quiz's explanation, no score). They load as
their own chunk. `moments.test.ts` checks every slug a rule names exists
and pins the selection rules.

## Scenarios

The five from §28 — First Commit, Push to a Remote, Branch, Merge, Undo —
live in `content/visualizer/scenarios.ts` as plain data:

```ts
interface ScenarioStep {
  instruction: string
  expect: Expectation      // judged by the engine: an event, a command, or both
  try: { run: string } | { edit: string } | { teammate: true }
  hint: string
}
```

Steps are met by **what happened**, not by exact text (`services/git-sim/
progress.ts`): `git add .` and `git add index.html` both stage the file.
Where the command is the point and nothing moves (`git status`), the step
names the command. Progress is *derived* by replaying history against the
steps, never stored, so the simulator's undo un-does progress too and the
two can't drift apart.

Each step's `try` is a one-click chip in the rail, and
`scenarios.test.ts` plays every scenario end to end by doing exactly what
the chips offer — a step can't ask for something the simulator can't do.
Seeds that need history (`one-commit`, `ready-to-merge`) are built by
running real commands, so they can't contain a state the engine couldn't
reach.

Guided, not gated. A command that doesn't meet the current step **still
executes**; the rail keeps the step and says "that works too — the next
step is still the one above". Blocking exploration inside a sandbox whose
entire point is safe exploration would be the wrong lesson.

`content/visualizer/catalog.ts` holds only slug, title, goal and seed —
what the page needs to route and build a first state. The step text loads
with the lazy `ScenarioRail` chunk.

## Remote

A minimal remote exists because Scenario 2 needs one (§22). `RepoState.
remote` is another repository with its own branches and object store;
`remoteBranches` (`origin/main`) is *your record* of where it was, which
is the distinction `fetch` exists to teach. `upstreams` is `push -u`.

`git remote add`, `push` (refuses non-fast-forward, with Git's hints),
`fetch` (moves `origin/*` only — never your branch or files), and `pull`
(fetch, then an ordinary merge). `git status` reports ahead/behind. A
sandbox control, "Teammate pushes", moves the remote without touching your
machine — the world moving on, which is what fetch and pull are for.

The stage draws it below a dashed boundary labelled "Remote (origin)",
never "GitHub" (§23). A refused `pull` changes nothing, even though real
Git would keep the fetch half: the engine keeps one rule — a failure has no
events and no state change — and the explanation says so.

## Safety framing

One pinned line in the workspace, not a per-command warning:

> This is a simulator. Nothing here touches a repository on your
> computer.

Destructive commands (`reset --hard`, `clean`, `push --force`) get the
Design System's `caution`/`danger` treatment and say what is
unrecoverable — calm, once, in the Explainer (§18).

## Accessibility

- Each state region is a `<section aria-labelledby>`; file lists are
  real lists with text labels (`index.html — modified`).
- The graph's drawing is `aria-hidden`; the commit rows beside it are a
  real, visible ordered list, and each row says in words what the lines
  show (`Built on 80303ad.`, `Merge of … and …`). A screen reader gets
  structure, not a description of a picture — without a second, hidden
  copy of the history to keep in sync.
- Console input is a labelled `<input>` in a `<form>`; ↑/↓ walks
  history, Tab accepts a completion, Esc clears. It draws no focus ring
  of its own — a ring round a line of text reads as a form field — and
  opts out with `data-focus-ring="container"` (`base.css`), the one
  sanctioned exception: the terminal window takes the ink outline while
  the prompt has focus, and the caret marks the spot. The scrollback is a
  `role="log"` wrapper around a real `<ol>` (the role on the list itself
  would strip the list semantics its items need), `aria-live="off"`: the
  "What just happened" line is the live region, so nothing is read twice.
- Inspecting a commit (§24's snapshot view) is the Time Machine's job,
  not the graph's: its timeline is a native range input (arrows, touch,
  screen readers with the commit as value text) and the graph rings the
  commit it's on. Graph rows themselves aren't focusable — they'd be tab
  stops that do nothing.
- Tab order follows the screen: scenario rail → stage → explainer column
  (what happened, controls, Aha/Recall, Time Machine) → console. It's DOM
  order, never CSS `order`.
- Nothing focused is ever hidden under the sticky header or the docked
  console (WCAG 2.4.11): `scroll-padding-top` in `base.css` clears the
  header, and `useScrollPaddingBottom` keeps `scroll-padding-bottom`
  equal to the dock's measured height.
- Recall and Quiz choices lock with `aria-disabled`, not `disabled`:
  disabling the button that has focus drops focus to `<body>`.
- Reduced motion lights a reset's layers together and plays no
  animation; the live region carries the same sentence either way.
- Focus is never trapped; every interactive element keeps the global
  `:focus-visible` ring.

Checked in Task 14 with axe-core (WCAG 2.2 AA + best practice) across
eight states at 375px and 1280px, a keyboard-only walkthrough at both
widths, and emulated reduced motion. The one standing axe finding is
`meta-viewport`: zoom is locked in `index.html` by request, which fails
WCAG 1.4.4.

## Components

New **primitives** (`components/ui`, added before use, per §34 and the
repo rule): `FileNode`, `CommitNode`, `BranchLabel`, `HeadPointer`,
`StatePanel`, `CommandConsole`, `LaneGraph` (+ `LaneNodeSwatch`,
`LaneEdgeSwatch`), `Legend`, `Timeline`, `ChoiceList`, `ScrollX`, and
`FileStatusSwatch` beside `FileNode`. `LaneGraph` draws nodes in lanes with lines between them and
knows nothing about Git; `CommitGraph` is what makes its rows commits.

New **composition** (`features/visualizer/`): `VisualizerStage`,
`CommitGraph`, `ExplainerPanel`, `ScenarioRail`, `VisualizerLegend`,
`WorkspaceToolbar`.

New **tokens** (`styles/tokens.css`): `--viz-node`, and the drop-in
animation. The graph's lane, row and edge sizes are SVG coordinates,
which can't read custom properties, so they live once as constants in
`LaneGraph` — the rows take their height from the same constant. Colour reuses ink/lime and the
existing pastel `caution`/`danger` fills — no new palette.

Anything with a custom size or shadow name must also be registered in
`utils/cn.ts`, or tailwind-merge drops it.

## State management

One `useReducer` in `VisualizerPage` — the first in the codebase, and
justified: the whole feature is a single state machine, and the
`useState`-per-feature convention can't express undo, replay or a
timeline.

```ts
{ repo: RepoState, history: HistoryEntry[], future: HistoryEntry[],
  clearedAt: number, last: 'run' | 'undo' | 'redo' | null, version: number }
```

§27's undo is a pop: every entry keeps its `before`, so undo restores it
and moves the entry to `future`; redo moves it back; anything new clears
`future`. Replay is undo, a beat (`REPLAY_MS`), then redo — every
animation plays again from the real "before" instead of a canned re-run.
All three are labelled as simulator controls: real Git has no undo
button, and nobody should leave thinking it does. `last` exists so the
page never describes the entry an undo exposed as if it had just
happened; `version` drives highlighting.

The Time Machine (§19) is **not** built on `history`. It walks commits,
not commands: `services/git-sim/timeline.ts` lists every commit ever
made — including ones a reset or deleted branch left unreachable, which
the graph stops drawing — with the snapshot at each (§24) and a file's
created/modified/deleted story (§20, skipping merges that took one side
as-is, like `git log -- <file>`). It is read-only: scrubbing rings the
commit in the graph and moves nothing. "Go here" runs the real
`git switch`, and "Keep it on a branch" runs `git branch` for an
unreachable commit — time travel in Git is a command, not a mode. The
panel is opt-in and lazy-loaded, so the Visualizer's first load doesn't
pay for it. Slices pass down as props; `CommitGraph` is `React.memo`'d
on commit count and HEAD, since it's the only component whose render
cost grows.

## Performance budget

The route is lazy, so the main chunk must not grow. Baseline at the time
of writing: main chunk 303.56 kB (96.60 kB gzip), 65 precached entries,
699.34 KiB. Zero new runtime dependencies. SVG and CSS only (§39).

The original target for the Visualizer chunk was **≤ 25 kB gzip**, set in
Task 2 when the engine had six commands. It has seventeen now, plus a
line-level merge, and the engine can't be deferred — every keystroke uses
it. What *can* wait is split out: the Time Machine and the scenario rail
(with the scenarios' text) are separate lazy chunks. See the task reports
for current sizes.

Being a pure client-side simulation with no fetch, the Visualizer
inherits full offline support from the existing Workbox precache.

Runtime, measured in Task 14 on the production build with the CPU
throttled 4× (Lighthouse's mobile profile): a command costs ~40 ms of
main thread at the start of a session and ~80 ms at 100 commits, the DOM
is ~1,100 nodes at 100 commits, there is no `requestAnimationFrame` or
infinite animation on an idle page, and the Time Machine scrubs at a
frame per step. `CommitGraph` compares only its own entrance keys
(`sameGraphProps`), so highlights lighting and dimming — two or three
renders per command — don't redraw the history; that cut long tasks over
a 100-commit session by a third.

Lighthouse mobile scores the Visualizer the same as other pages (~62-68,
run to run); the cost there is the site-wide main chunk, which bundles
every content module because search and other shell pieces import
`services/content`. That is a site-wide change, not a Visualizer one.

## Testing

Vitest, added as a dev dependency, `npm run test`. The engine —
`parse`, `validate`, each command reducer, emitted events, and
end-to-end command sequences asserting the final `RepoState` — plus the
Visualizer's pure feature logic (`features/visualizer/*.test.ts`: which
Aha and Recall a history earns).

No DOM or component tests: one package, not four, and the engine is
where a wrong answer would actually teach someone something false.

## Decisions taken, and what they cost

| Decision | Why | Cost |
|----------|-----|------|
| Keep `/terminal` | It answers a different question (lookup vs. simulation) and costs 45 lines | Two pages with a family resemblance; mitigated by cross-links |
| Visualizer takes Terminal's nav slot | Seven items is the ceiling before `md` collapse | Terminal is one click further away |
| Vitest, engine only | Pure functions, no DOM needed | One dev dependency |
| CSS/SVG, no animation library | §39, and a ~18 kB gzip library against a 96.6 kB baseline | FLIP-style transitions written by hand |
| Stage always vertical | One direction of travel at every width | Wide screens have unused horizontal room |
| Mono font stays Cascadia Code | §34 forbids a separate visual language; the repo replaced Ubuntu Mono deliberately | A knowing deviation from §9's letter, keeping its intent |
| HEAD's line always takes lane 0 | The branch you're on reads as the straight trunk; `git log --graph` lets it zig-zag whenever another tip is newer | The graph's columns differ from real `git log --graph` in that case |
| Failing commands still execute and explain | A rejected command is the teachable moment | History contains failures; the UI must style them as lessons |
