# GitBit — Master Product & Development Prompt

## 0. ROLE

You are the lead product designer, UX architect, frontend engineer, PWA engineer, content architect, and technical lead for **GitBit**.

You are not merely generating a demo.

You are building a **production-quality, enterprise-grade educational PWA** that is intended to be genuinely useful to developers learning and using Git every day.

Repository:

`https://github.com/gitussr/gitbit.git`

The repository currently exists and is empty. Use it as the canonical source repository.

Your work must be committed and pushed to this repository throughout development.

---

# 1. PRODUCT

## Product Name

**GitBit**

## Product Philosophy

> **Git, one bit at a time.**

GitBit is a beginner-friendly Git learning and reference PWA.

The problem it solves:

Many developers can memorize:

```bash
git add .
git commit -m "update"
git push
```

but do not actually understand:

- what Git is doing,
- why the command exists,
- what state the project is currently in,
- what changes when the command runs,
- how Git terminology maps to everyday thinking,
- what to do when something goes wrong.

GitBit must solve that problem.

Do not build a conventional documentation website.

Do not simply list Git commands.

Build a **mental-model-first Git learning experience**.

---

# 2. CORE LEARNING PHILOSOPHY

Every Git concept should bridge:

**Git terminology → plain English → mental model → command → real-world situation**

Example:

### Commit

**Technical meaning:**

A recorded snapshot of the repository's state.

**GitBit meaning:**

> Think of a commit as a checkpoint in your project.

**Command:**

```bash
git commit -m "Add login page"
```

**Human interpretation:**

> "I have reached a meaningful point in my work and want Git to remember it."

Never remove the actual Git terminology.

The goal is not to replace Git vocabulary with simplified language.

The goal is to make the terminology understandable.

---

# 3. GIT STATE MUST BE A CENTRAL CONCEPT

Teach Git through state transitions.

The core mental model should include:

```text
Working Directory
       ↓
   git add
       ↓
Staging Area
       ↓
  git commit
       ↓
Local Repository
       ↓
   git push
       ↓
Remote Repository
```

Users should understand what each command changes.

For example:

```text
git add
```

must not simply be described as:

> "Adds files."

Instead:

> "Chooses changes for your next snapshot."

And visually:

```text
Working Directory
       ↓
   git add
       ↓
Staging Area
```

This visual state model should be reused throughout the application.

---

# 4. PRODUCT MODULES

The GitBit product family should use this naming pattern.

## GitBit Daily

Daily micro-learning experience.

Eventually supports push notifications.

Content can include:

- daily Git tips
- command use cases
- aha moments
- common mistakes
- vocabulary
- comparisons
- mini challenges
- recall questions

Tone must be friendly and useful, never annoying.

---

## GitBit Quick

Fast searchable Git cheat sheet.

Users should be able to quickly answer:

> "What command do I need?"

Each command should provide:

- command
- plain-English meaning
- when to use it
- example
- what happens internally
- related commands
- common mistake
- danger level where appropriate

---

## GitBit Learn

Structured learning path.

Suggested progression:

### Level 0 — Git Basics

- Git
- repository
- working directory
- working tree
- `.git`
- commit
- history

### Level 1 — Everyday Git

- git init
- git status
- git add
- git commit
- git log
- git diff

### Level 2 — Git + GitHub

- remote
- origin
- clone
- push
- pull
- fetch

### Level 3 — Branching

- branch
- switch
- merge

### Level 4 — Collaboration

- pull requests
- merge conflicts
- fetch
- merge
- rebase

### Level 5 — Undoing Things

- restore
- reset
- revert
- stash

### Level 6 — Advanced Git

- HEAD
- detached HEAD
- reflog
- cherry-pick
- interactive rebase
- tags
- bisect
- worktree

Do not overwhelm beginners.

Introduce complexity progressively.

---

## GitBit Quiz

Provide objective knowledge checks.

Questions should test understanding rather than memorization.

Example:

> You edited `index.html` and want Git to tell you what changed. Which command should you use?

Answer:

```bash
git diff
```

Quiz content should be generated from the same underlying knowledge base as Learn and Daily.

---

## GitBit Aha

Short conceptual explanations.

Examples:

> **A commit is not a save button.**

> **Git and GitHub are not the same thing.**

> **`git add` does not create a commit.**

> **You can use Git without GitHub.**

> **A branch is not a copy of your entire project in the way beginners often imagine it.**

These should be highly visual where useful.

---

## GitBit SOS

"I messed up Git."

This section is extremely important.

Provide calm, beginner-friendly recovery guides for situations such as:

- accidentally staged a file
- accidentally committed something
- want to undo local changes
- deleted something
- committed to the wrong branch
- need to undo a commit
- merge conflict
- detached HEAD
- accidentally used the wrong command
- need to recover previous work

Never present dangerous Git commands without explaining their consequences.

Use danger levels where appropriate.

---

## GitBit Terminal

A terminal-inspired educational interface.

It does NOT need to become a complete Git client in the MVP.

The terminal UI can initially simulate/explain commands.

Example:

```text
$ git status

Git says:

You have changed 2 files.

Human translation:

"Something changed after your last checkpoint."
```

The purpose is education, not replacing the user's actual terminal.

---

# 5. GITBIT LANGUAGE & VOCABULARY SYSTEM

Before generating large amounts of UI content, create a structured **GitBit Vocabulary / Knowledge Base**.

Do not manually scatter Git explanations throughout React components.

Every concept should have structured data.

At minimum, support:

```text
technicalTerm
category
plainEnglish
mentalModel
technicalExplanation
example
whenToUse
whatHappens
commonMistake
relatedCommands
relatedConcepts
difficulty
dangerLevel
ahaPotential
notificationEligible
```

Example conceptual structure:

```js
{
  term: "Staging Area",
  category: "core-concept",
  plainEnglish: "The changes you've chosen for your next snapshot.",
  mentalModel: "A waiting room for your next snapshot.",
  technicalExplanation: "...",
  relatedCommands: ["git add", "git commit", "git status"],
  difficulty: "beginner"
}
```

The exact implementation is up to you, but the content must remain separate from presentation.

---

# 6. NOTIFICATION CONTENT ENGINE

This is a major future feature and must be architected correctly.

Do not simply create a collection of random notification strings.

Build a reusable notification content system.

Notification categories should include:

### GitBit Aha

> A commit is a checkpoint, not a save button.

### GitBit Vocabulary

> **HEAD**  
> Think: "Where am I currently standing in Git history?"

### GitBit Command

> `git status` is basically Git answering:  
> **"What's going on right now?"**

### GitBit Common Mistake

> `git add` does not permanently save your work.  
> It prepares changes for your next commit.

### GitBit Compare

> `git clone` → "I need the project."  
> `git pull` → "I already have it. Give me the latest changes."

### GitBit Did You Know

> You can use Git without GitHub.

### GitBit Recall

Ask the learner to remember a concept they encountered earlier.

The notification engine should eventually support content rotation, categories, difficulty, and learning history.

---

# 7. NOTIFICATION TONE

GitBit must sound:

- friendly
- intelligent
- informal
- concise
- approachable
- slightly playful
- useful
- confident

Think polished consumer-product communication.

The tone should feel closer to a product like Zomato than a corporate technical manual.

However:

### Never use:

- slang
- profanity
- developer bro language
- excessive memes
- childish language
- forced jokes
- sarcasm that could confuse beginners
- corporate jargon
- unnecessary technical terminology

Do not use phrases such as:

> "Yo bro"

> "WTF"

> "Git is crazy"

> "You totally messed up"

Keep the personality without becoming casual to the point of losing credibility.

---

# 8. NOTIFICATION CONTENT RULES

Every notification should teach something useful.

Do not send empty engagement messages.

Avoid:

> "Time to learn Git!"

Prefer:

> **Today's GitBit 💡**  
> `git status` is Git asking:  
> **"What's changed since my last checkpoint?"**

Notifications should vary in format.

Do not make every notification look identical.

The system should eventually support:

- Aha
- Vocabulary
- Command
- Comparison
- Common mistake
- Real-world scenario
- Did You Know
- Recall
- Mini challenge

---

# 9. IMPORTANT NOTIFICATION ARCHITECTURE

The MVP must NOT require:

- paid services
- a database
- authentication
- a custom backend
- paid APIs

The initial application must work without them.

However, design the content architecture so that future Web Push notifications can be added without restructuring the application.

Separate:

```text
Content
Notification generation
Notification scheduling
Notification delivery
```

Do not tightly couple them.

The future architecture may look like:

```text
GitBit Knowledge Base
        ↓
Notification Engine
        ↓
Notification Scheduler
        ↓
Web Push
        ↓
User Device
```

For the MVP, focus on the first two layers.

Do not overengineer push infrastructure yet.

---

# 10. MVP TECHNOLOGY

Use a modern React-based architecture.

Preferred:

- React
- Vite
- PWA support
- modern CSS or Tailwind if it genuinely improves maintainability
- static structured content initially

Do not introduce a backend unless absolutely necessary.

Do not introduce a database unless absolutely necessary.

Do not introduce authentication.

Do not introduce paid APIs.

The MVP must be deployable using free-tier infrastructure.

The code should be compatible with deployment through platforms such as Vercel, Netlify, or GitHub Pages where appropriate.

---

# 11. DESIGN SYSTEM — MANDATORY FIRST STEP

## DO NOT START BUILDING THE UI DIRECTLY.

Before implementing application screens, establish a complete GitBit Design System.

This is a hard requirement.

The Design System must be production-grade and documented.

The application must be built from the Design System.

Do not create random page-specific styles.

Do not create one-off UI solutions when a reusable component should exist.

If a required component does not exist:

> Extend the Design System first.

Then use it.

---

# 12. DESIGN PHILOSOPHY

The visual target is:

> **Enterprise-grade engineering + consumer-grade UX.**

GitBit must feel polished enough to be considered a real production product.

The UI/UX must NOT be compromised for implementation convenience.

Take inspiration from premium consumer applications such as Cred in terms of:

- visual polish
- spacing
- hierarchy
- card treatment
- interaction quality
- restraint
- premium feel

Do NOT copy Cred's design.

Create a distinct GitBit visual identity.

---

# 13. TYPOGRAPHY

## Primary font

**Manrope**

Use it consistently for:

- UI
- headings
- body text
- navigation
- labels
- metadata

## Command / code font

**Ubuntu Mono**

Use it for:

- Git commands
- terminal output
- code examples
- command explanations where appropriate

Typography must be part of the Design System.

Do not randomly change font sizes throughout the application.

---

# 14. THEME SYSTEM

Support:

- Light
- Dark
- System

System mode should respect the user's OS preference.

Theme values must come from design tokens.

Do not hard-code theme colors into individual components.

Ensure:

- readable contrast
- clear focus states
- appropriate borders
- appropriate surfaces
- appropriate code blocks
- consistent semantic colors

---

# 15. VISUAL LANGUAGE

GitBit should use:

### Subtle grid background

A restrained grid/pattern background may be used as a visual signature.

It must remain subtle.

It must never interfere with readability.

### Hero radial gradient

Use a subtle animated radial gradient inspired by modern premium product websites.

Important:

- one muted color at a time
- slow movement
- subtle transitions
- no loud rainbow gradients
- no excessive glow
- no distracting animation

Support:

```css
prefers-reduced-motion
```

Users who prefer reduced motion must receive an appropriate static experience.

---

# 16. FROSTED GLASS

Use frosted-glass styling selectively.

Particularly suitable for:

- pagination
- floating controls
- contextual navigation
- overlays
- selected controls

Do not turn the entire interface into glass.

Glass effects must remain readable and performant.

---

# 17. MICRO-ANIMATION

Use restrained micro-interactions.

Examples:

- button feedback
- copy command feedback
- search interaction
- card hover
- focus states
- navigation transitions
- progress changes
- pagination transitions
- notification feedback

Animations should communicate state.

Never animate simply because animation is possible.

Use consistent duration and easing tokens.

---

# 18. RESPONSIVE DESIGN

Mobile-first is mandatory.

The UI must work starting at:

**320px width.**

Test at minimum:

```text
320px
375px
390px
768px
1024px
1280px+
```

Do not design desktop first and shrink it down.

Build from mobile upward.

Pay special attention to:

- command blocks
- tables
- cards
- search
- navigation
- pagination
- terminal UI
- code examples
- long Git commands

Nothing should cause accidental horizontal scrolling.

---

# 19. SCROLLBAR

Use a thin, subtle scrollbar where browser customization is appropriate.

It must remain usable and accessible.

Do not make the scrollbar so thin that it becomes difficult to interact with.

---

# 20. SEARCH

Search is a core GitBit feature.

Users should be able to search for:

```text
git add
commit
undo commit
staging
branch
merge conflict
push
pull
```

Search should return relevant:

- commands
- concepts
- Learn lessons
- Aha explanations
- SOS guides

Search should be keyboard-friendly.

Eventually support keyboard shortcuts.

---

# 21. READING PROGRESS

Long-form learning pages should include reading progress.

Use a **circular progress marker**, particularly around pagination/navigation where appropriate.

The indicator should communicate:

> How far am I through this lesson?

It should remain subtle and not become visual noise.

---

# 22. BASIC LOGO

Start with a simple GitBit logo/wordmark.

Do not overinvest in the logo during the MVP.

However, make the logo system replaceable.

The future product may provide separate logo/icon variants for:

- application header
- favicon
- PWA icon
- manifest
- Apple touch icon
- Android icon
- social sharing
- splash screen

Do not hard-code the initial logo into the application in a way that makes replacement difficult.

---

# 23. PWA REQUIREMENTS

GitBit must be a genuine PWA.

Include appropriate:

- manifest
- service worker
- installability
- offline support
- app metadata
- theme colors
- icons
- mobile viewport behavior
- safe-area support

The application should remain useful when offline for its core learning content.

Design the architecture so that future push notification support can be added.

---

# 24. ACCESSIBILITY

Treat accessibility as a production requirement.

Include:

- semantic HTML
- keyboard navigation
- visible focus states
- accessible labels
- correct heading hierarchy
- adequate contrast
- reduced-motion support
- touch-friendly controls
- accessible dialogs
- accessible navigation
- screen-reader-friendly structure

Do not sacrifice accessibility for visual effects.

---

# 25. PERFORMANCE

The app must feel fast.

Avoid:

- unnecessary JavaScript
- oversized dependencies
- excessive animation
- unnecessary network requests
- heavy UI libraries when a small reusable component is sufficient
- unnecessarily large images

The PWA should feel lightweight even on modest mobile devices.

---

# 26. CONTENT ACCURACY

Git is a technical subject.

Never simplify a concept so aggressively that the explanation becomes technically wrong.

Analogy:

> "A commit is a snapshot."

is useful.

But do not imply:

> "A commit copies every file every time."

when that is not an accurate explanation of Git's internals.

Use simple language without teaching incorrect mental models.

When simplifying:

**Simple ≠ inaccurate.**

---

# 27. GIT VS GITHUB

Explicitly teach the distinction.

Git:

> A version control system.

GitHub:

> A platform/service for hosting and collaborating around Git repositories.

Make sure beginners understand:

> You can use Git without GitHub.

This should become one of GitBit's foundational concepts.

---

# 28. COMMAND INFORMATION MODEL

Every command should eventually follow a consistent structure:

```text
Command
Human meaning
Technical meaning
When to use
Syntax
Example
What happens
Mental model
Common mistake
Related commands
Danger level
```

Example:

```text
git status

Human:
"What is going on right now?"

Technical:
Shows the state of the working tree and staging area.

When:
When you are unsure what changed.

Example:
git status

Mental model:
"Ask Git for a status report."
```

---

# 29. COMMAND ANATOMY

Where useful, explain commands piece by piece.

Example:

```bash
git commit -m "Add login page"
```

Explain:

```text
git
→ the Git program

commit
→ create a commit/checkpoint

-m
→ provide a commit message

"Add login page"
→ describe what the checkpoint represents
```

This should be visually elegant and reusable.

---

# 30. COMMAND COMPARISONS

Create comparison content for commonly confused commands.

Examples:

```text
git clone vs git pull
git fetch vs git pull
git reset vs git revert
git merge vs git rebase
git restore vs git reset
```

Use plain English first.

Example:

```text
clone
"I don't have the project yet."

pull
"I already have the project.
Bring me the latest remote changes."
```

---

# 31. DANGER LEVELS

Introduce appropriate safety indicators.

Example:

### Safe / everyday

```text
git status
git diff
git log
```

### Understand before using

```text
git reset
git revert
git rebase
git stash
```

### High caution

```text
git reset --hard
git push --force
git clean
```

Never use fear-based language.

Explain the consequence.

---

# 32. ERROR / RECOVERY UX

When users encounter a Git problem, the UI should feel calming.

Never say:

> "You broke Git."

Prefer:

> "Don't worry. Git usually keeps more history than you think."

Then guide the user step by step.

GitBit SOS should be especially beginner-friendly.

---

# 33. CONTENT-FIRST ARCHITECTURE

Do not put Git knowledge directly into large React components.

Separate:

```text
content
UI
logic
data
```

Suggested conceptual structure:

```text
src/
  components/
  features/
  content/
    commands/
    concepts/
    aha/
    quiz/
    sos/
    daily/
    comparisons/
  data/
  hooks/
  services/
  styles/
  utils/
```

You may change the exact structure if you have a better production-grade architecture.

The principle is what matters:

> Git knowledge must be reusable independently of the UI.

---

# 34. DESIGN SYSTEM STRUCTURE

Create reusable primitives/components for at least:

- typography
- buttons
- icon buttons
- cards
- badges
- tags
- inputs
- search
- command blocks
- code blocks
- terminal blocks
- alerts
- tooltips
- tabs
- navigation
- breadcrumbs
- pagination
- progress indicators
- modal/dialog
- toast
- empty state
- loading state
- error state
- lesson cards
- command cards
- aha cards
- quiz cards
- SOS cards

Avoid creating multiple visually different versions of the same component unless there is a genuine semantic reason.

---

# 35. DESIGN TOKENS

Create centralized tokens for:

- colors
- typography
- spacing
- border radius
- borders
- shadows
- elevation
- opacity
- z-index
- motion duration
- easing
- breakpoints

Do not scatter arbitrary values throughout the application.

The Design System should make future visual changes easy.

---

# 36. UI QUALITY BAR

Before considering a screen complete, inspect it as a professional product designer would.

Ask:

- Does the hierarchy make sense?
- Is anything visually noisy?
- Is spacing consistent?
- Are controls obvious?
- Is the primary action clear?
- Does it work at 320px?
- Does dark mode look intentionally designed?
- Are hover/focus/active states complete?
- Does the page feel premium?
- Does the animation improve the experience?
- Is anything unnecessarily decorative?
- Is the content easy to scan?
- Does the UI feel like GitBit rather than a generic AI-generated dashboard?

If the answer is no, improve it.

---

# 37. DO NOT GENERATE A GENERIC AI DASHBOARD

Avoid:

- excessive rounded cards
- random gradients
- huge hero text
- unnecessary glass everywhere
- meaningless statistics
- fake analytics
- excessive badges
- generic SaaS layouts
- unnecessary sidebars
- excessive icons
- visual clutter
- "AI-generated" looking UI

GitBit should feel intentional.

---

# 38. DEVELOPMENT WORKFLOW

Follow this order.

## Phase 1 — Repository inspection

Inspect the GitHub repository and local project state.

Repository:

`https://github.com/gitussr/gitbit.git`

Initialize the project if necessary.

---

## Phase 2 — Product architecture

Define:

- information architecture
- navigation
- feature boundaries
- content architecture
- route structure
- component architecture

Do not overengineer.

---

## Phase 3 — Design System

Build and document the Design System BEFORE building application screens.

Create:

- design tokens
- typography system
- colors
- themes
- spacing
- components
- motion system
- responsive rules
- accessibility rules

Create a dedicated Design System / UI showcase route if useful.

---

## Phase 4 — Content model

Build the GitBit knowledge model.

Start with high-quality foundational content.

Do not attempt to write every Git command in the world before validating the application.

Prioritize:

- Git fundamentals
- everyday commands
- Git/GitHub distinction
- staging
- commits
- branches
- remote repositories
- common mistakes
- common comparisons

---

## Phase 5 — Core UI

Build:

1. GitBit Quick
2. GitBit Learn
3. GitBit Aha
4. GitBit Quiz
5. GitBit SOS
6. GitBit Terminal
7. GitBit Daily

Use the Design System.

---

## Phase 6 — PWA

Implement:

- manifest
- service worker
- offline content
- installability
- icons/placeholders
- safe areas
- theme behavior

---

## Phase 7 — Responsive QA

Test at:

```text
320px
375px
390px
768px
1024px
1280px+
```

Fix real issues rather than hiding overflow.

---

## Phase 8 — Accessibility QA

Keyboard test.

Focus test.

Screen reader semantics where appropriate.

Reduced-motion test.

Light/dark/system test.

---

## Phase 9 — Performance QA

Check:

- bundle size
- unnecessary dependencies
- image sizes
- animation performance
- loading experience
- offline behavior

---

## Phase 10 — Git workflow

Use GitBit itself as an opportunity to demonstrate proper Git workflow.

Use meaningful commits.

Do not create one giant meaningless commit after everything is complete.

Use commits such as:

```text
feat: establish GitBit design system
feat: add GitBit Quick
feat: add GitBit Learn content model
feat: add GitBit Aha
feat: add GitBit Quiz
feat: add GitBit SOS
feat: add PWA support
fix: improve mobile layout at 320px
```

Keep commits understandable.

---

## TASK COMPLETION & APPROVAL GATE

Work in clearly defined tasks/phases.

After completing each task:

1. Stop.
2. Summarize exactly what was completed.
3. Mention files/components/routes that were created or modified.
4. Report any tests, builds, or QA performed.
5. Mention any known issues or decisions that need attention.
6. Ask for my explicit permission before proceeding to the next task.

Do NOT automatically continue to the next task after completing the current one.

Wait for my approval.

Use a concise completion format:

TASK COMPLETED
---------------
Task: [task name]

Completed:
- ...
- ...
- ...

Files changed:
- ...

Validation:
- ...

Issues / Decisions:
- ...

NEXT TASK
---------
[Describe the next planned task in 1–2 sentences.]

APPROVAL REQUIRED
-----------------
The current task is complete. Please confirm before I proceed with the next task. Even if the next task is obvious, do not start it until I explicitly approve it.

---

# 39. GITHUB REQUIREMENT

The final source code must be pushed to:

`https://github.com/gitussr/gitbit.git`

Before pushing:

- ensure no secrets exist
- ensure `.env` files are ignored
- ensure dependencies are properly declared
- ensure README exists
- ensure project runs from a clean install
- ensure production build succeeds
- ensure no obvious console errors
- ensure no broken routes
- ensure no placeholder text remains where production content is expected

Create a useful README covering:

- what GitBit is
- product philosophy
- features
- technology
- development setup
- build commands
- PWA information
- future roadmap

Do not expose secrets or credentials.

---

# 40. IMPORTANT: DO NOT OVERBUILD

This is an MVP.

Do NOT implement unless required:

- authentication
- user accounts
- database
- social login
- paid APIs
- complex backend
- advanced analytics
- subscription system
- unnecessary GitHub API integration
- real Git execution
- real-time collaboration

Design for future expansion without implementing unnecessary infrastructure now.

---

# 41. FUTURE ROADMAP

Architect cleanly so these can be added later:

### GitBit 2.0

- user accounts
- learning progress
- bookmarks
- streaks
- personalized learning
- spaced repetition
- real Web Push notifications
- notification preferences
- cloud synchronization

### GitBit 3.0

Potential GitHub integration:

- repository inspection
- personalized Git learning
- repository-specific suggestions
- pull request learning
- commit history visualization

These are future ideas, not MVP requirements.

---

# 42. NOTIFICATION FUTURE ARCHITECTURE

When push notifications are eventually implemented, the architecture should support:

```text
User
 ↓
Notification permission
 ↓
Push subscription
 ↓
Notification service
 ↓
Scheduler
 ↓
GitBit content engine
 ↓
Web Push
 ↓
Browser / Device
```

Users who explicitly opt into notifications should be targeted reliably, while respecting browser/device limitations and user preferences.

Never spam users.

Provide notification preferences in the future.

---

# 43. FINAL PRODUCT TEST

Before declaring the MVP complete, pretend you are a developer who knows HTML/CSS/JS but finds Git confusing.

Ask:

> "Can I understand what Git is doing without already knowing Git?"

If not, improve the experience.

Then ask:

> "Can I quickly find the command I need?"

If not, improve GitBit Quick.

Then:

> "Can I understand why the command works?"

If not, improve Learn/Aha.

Then:

> "If I make a Git mistake, do I know what to do?"

If not, improve SOS.

Then:

> "Would I actually install this PWA and keep it?"

If not, improve the product experience.

---

# 44. FINAL INSTRUCTION

Do not rush into coding.

First establish the product architecture and Design System.

Then build the application systematically.

Prioritize:

**Understanding > Features**

**UX > Technical novelty**

**Content quality > Content quantity**

**Consistency > One-off visual tricks**

**Production quality > Demo quality**

**Simple architecture > unnecessary infrastructure**

GitBit should ultimately make a learner think:

> **"I finally understand what Git is doing."**

That is the product's success metric.

Start by inspecting the repository, establishing the project foundation, creating the Design System, and then proceed phase by phase.

Commit meaningful progress and push the work to:

`https://github.com/gitussr/gitbit.git`

Do not wait until the entire project is finished before committing.



