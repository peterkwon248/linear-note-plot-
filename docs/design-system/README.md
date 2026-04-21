# Plot Design System

A design system distilled from **Plot** — a local-first, Linear-inspired knowledge-management app.
Plot is a single-surface desktop/web product (Next.js + React + shadcn/ui) for capturing, developing, and retaining ideas via a Zettelkasten-style workflow (Inbox → Capture → Permanent).

## Sources

| Source | Path / Link |
|---|---|
| Codebase | `peterkwon248/linear-note-plot-` @ `main` |
| Design skill | `.claude/skills/linear-design-mirror/` (SKILL.md, references/) |
| Tokens | `app/globals.css` — the canonical token truth |
| shadcn/ui primitives | `components/ui/*.tsx` |
| Custom icons | `components/plot-icons.tsx` |
| Linear mirroring research | `references/design-philosophy.md`, `color-system.md`, `interaction-patterns.md` |

All paths are relative to the repo root. The reader is not assumed to have access; this system extracts and restates everything that matters.

---

## Product context

Plot is **one product, one surface** — a browser/Electron app. All data lives in the user's IndexedDB (no backend, no account). The UI borrows Linear's density, opacity-hierarchy, and keyboard-first interaction vocabulary, but adapts it to a personal-knowledge workflow instead of team issue tracking.

**Core workflow:** Inbox (unstructured triage) → Capture (actively developed, scored for maturity) → Permanent (evergreen, enrolled in SRS for spaced repetition).

**Key surfaces:** Activity bar (left rail) · Sidebar (nav) · Note list / board / table · Editor (Tiptap) · Command palette (⌘K) · Inbox · Wiki · Settings.

---

## CONTENT FUNDAMENTALS

### Voice & tone

- **Quiet, instrumental, calm.** Plot sits next to your thinking, it doesn't narrate it. UI copy is terse. There are no marketing flourishes, no encouragements ("Great job!"), no emoji.
- **Second person, implied.** Most labels are imperative verbs or nouns. "Snooze", "Promote", "Pin". Full sentences appear only in empty states and tooltips.
- **Developer-adjacent register.** It sounds like a pro tool that respects your attention: `readyScore >= 5 triggers a promotion suggestion`, `Fixed-step intervals [1, 3, 7, 14, 30, 60, 120] days`.

### Casing

- **Labels / menu items: Title Case** — "New Note", "Go to Inbox", "Move to Trash".
- **Section headers / eyebrows: UPPERCASE + letter-spacing 0.08em** at 11px — "FAVORITES", "TEAMS".
- **Descriptions / body: Sentence case.**
- **Single-key shortcuts: uppercase letter** — `C` create, `L` label, `X` select.

### Word choices (concrete)

| Preferred | Avoid |
|---|---|
| Inbox · Capture · Permanent | Drafts · In progress · Done |
| Promote | Upgrade · Move up |
| Snooze | Remind me later |
| Triage | Review (ambiguous) |
| Review Queue | Today · For you |
| Thinking Chain | Chain of notes · Sequence |

### Vibe examples (from the repo)

- Product tagline: *"A local-first knowledge management app inspired by Linear's design quality."*
- Quality principle: *"Don't compete for attention you haven't earned."*
- Design principle: *"Structure should be felt, not seen."*
- Settings philosophy: *"Settings are not a design failure."*
- Feature names: **Floating TOC**, **Arrange Mode**, **Quality Wednesdays**, **Zero Bugs Policy**, **Quicklook (Peek)**, **Autopilot Rules**.

### Emoji

**Never** in product chrome. Never in buttons, menu items, empty states, or settings. The *only* place emoji appear is inside user-authored note content (via the `:` trigger in the editor, the same way GitHub offers them). Treat emoji as user data, not UI.

### Punctuation details

- No trailing periods on buttons or short labels.
- Single em-dash (—) for parenthetical clauses, not double hyphens.
- Inline `code` uses backticks in docs; in the UI it gets the monospace + muted-bg chip treatment.
- Ellipsis is the `…` character (U+2026), never three dots.

---

## VISUAL FOUNDATIONS

### Palette (named)
Two themes, same structure. Linear's 2026.03 "calmer interface" refresh is the reference.

- **Light** — warm white (`#ffffff`) main, near-white card (`#f7f8fa`), deep indigo-black text (`#1a1a2e`). Sidebar is a *slightly* cooler off-white (`#f5f5f7`) to step back from the content plane.
- **Dark** — charcoal (`#141417`) main, NOT pure black. Cards sit at `#1c1c20`. Sidebar shares the card surface so it reads as secondary.
- **Accent** — Linear indigo, `#5e6ad2` light / `#6366f1` dark. Used sparingly: focus ring, primary action, active-chrome flash. Not a brand color to sprinkle everywhere.
- **Semantics** — `destructive` red, `success` green, `warning` amber, `info` cyan. Priority-medium amber (`#d97706` / `#f59e0b`) is its own token because status ≠ priority.
- **Magazine palette** — 16 pastel column backgrounds (`slate · sage · blush · sand · sky · lavender · peach · ash · mint · coral · ocean · wine · lime · iris · cream · charcoal`) used only inside Wiki articles for column theming.

### Type
- **Geist** for everything (UI + body + headings). `Inter`-class geometric sans, generous x-height, works across Latin + Hangul.
- **Geist Mono** for code.
- **Merriweather** for long-form *serif-body* wiki mode. **Playfair Display** for *editorial* (magazine) wiki mode with drop caps.
- Scale is frozen: 11 · 12 · 13 · 14 · 14.5 · 15 · 16 · 19 · 23 · 28. Never add sizes outside this set.
- Letter-spacing trends slightly negative for headings (`-0.01` to `-0.02em`), slightly positive for all-caps eyebrow labels (`0.08em`).
- Editor body is 15px / 1.75 line-height / -0.01em — this is the single most important type rule.

### Spacing & rhythm
- 4px base. Use `4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48`.
- **Three density modes** (`[data-density]`): `compact` (4px row py), `default` (10px), `comfortable` (14px). Same on sidebar nav rows (2 / 4 / 6).
- Header strip is 52px tall, activity bar is 44px wide, sidebar default is 220px wide, editor column caps at 720px.
- *Use spacing, not borders, for separation.* This is the #1 rule.

### Corners
- `radius-sm` 4px — tiny chips, kbd keys.
- `radius-md` 6px — buttons, inputs, menu items.
- `radius-lg` 8px — cards, popovers, modals.
- `radius-xl` 12px — only the command palette modal and panels.
- Corners are intentionally softer than Tailwind defaults (2026.03 refresh softened everything a notch).

### Shadows
- Light mode: soft, low-contrast — `0 1px 2px rgba(0,0,0,0.06)` for resting; `0 12px 32px rgba(0,0,0,0.08)` for popovers.
- Dark mode: almost no shadow by itself — **elevation is communicated with brightness, not shadow.** Popovers add a faint edge-light (`0 0 0 1px rgba(255,255,255,0.06)`) to signal a new z-layer.
- Never use a colored shadow. Never use drop-shadow as decoration.

### Borders
- Mostly avoided. When present: `--border-subtle` (`rgba(0,0,0,0.08)` / `rgba(255,255,255,0.08)`).
- A 1px bottom border on the top chrome. A 1px right border on the sidebar in light mode only (dark mode collapses it into opacity).

### Backgrounds & imagery
- Flat. **No** gradients in product chrome, **no** hero illustrations, **no** repeating patterns.
- Imagery appears only inside user notes and the Wiki infobox — user-supplied photos in their original color. We don't tint user content.
- Column palette is the one place a flat color block appears — used as a tint for a Wiki column (e.g. all boxes in that column share `sky` or `peach`).

### Opacity hierarchy (the backbone)
This is *the* design primitive. In dark mode, on white:
- `0.93` active text
- `0.85` hover text
- `0.65` resting text (nav, secondary body)
- `0.55` resting icon
- `0.45` count / meta
- `0.35` hint / placeholder
- `0.08` active row bg
- `0.05` hover row bg

Light mode mirrors the same stops on black. *Never invent an in-between value.*

### Animation
- Durations: `120ms` (fast hover feedback) · `160ms` (default) · `200ms` (slow — mode toggles, panel reveals). Never slower than 250ms except for the command palette backdrop fade.
- Easing: `ease` (CSS keyword). No bounce, no spring, no overshoot.
- Elements **don't move** when you hover them. No scale, no translate, no glow. Background/opacity change only.
- Transitions are applied per-property — `transition: background var(--transition-default), color var(--transition-default)` — not `transition: all`.

### Interaction states
- **Hover** — raise bg by one opacity stop (`rgba(0,0,0,0.03)` in light). Text hits the next opacity stop (`.65 → .85`). Never darken with a color.
- **Active / pressed** — no squish, no scale. Bg jumps to `active-bg-strong` for the duration of the click (~120ms).
- **Focus** — 3px `ring-ring/50` ring outside the element, no border change. Only keyboard-visible (`:focus-visible`).
- **Selected** — persistent bg (`--sidebar-active`), plus text at `.93` / `var(--sidebar-active-text)`. Optional 2px accent bar on the leading edge for list rows.
- **Disabled** — 50% opacity, `pointer-events: none`.

### Hover-reveal
Secondary controls (checkboxes on list rows, `…` menus, reorder handles) are **invisible at rest** and only fade in on row hover. This is Linear's signature "don't compete for attention" applied to chrome.

### Cards
A Plot card is a flat surface: `bg-card`, `rounded-lg`, no border in dark mode (surface color alone separates it), a 1px `border-subtle` in light. Internal padding is 12 or 16px. Cards never stack shadows; they separate via gap or a rule.

### Transparency & blur
- Overlay/backdrop on modals: `rgba(0,0,0,0.4)` light, `rgba(0,0,0,0.6)` dark, no backdrop-filter blur (Linear avoids it for perf + clarity).
- Popovers are fully opaque — the elevation difference does the work.

### Scrollbars
Thin (6px). Transparent at rest. Track appears at `rgba(0,0,0,0.08)` only while hovering *inside* the scroll container. Never on desktop-always.

### Layout rules
- Inverted-L chrome: activity bar (44px) + sidebar (220px, resizable) on the left, top utility strip (52px) on top. Everything else is content.
- The content plane uses a generous gutter (`px-6`) and caps at `720px` for prose; full-width for lists/boards.
- No centered hero sections. No "fold" thinking. Scroll is cheap.

---

## ICONOGRAPHY

See the full treatment in `ICONOGRAPHY.md` (below, merged inline for convenience).

- **Primary icon system**: custom stroked SVGs in `components/plot-icons.tsx` — a small, intentional set of ~30 glyphs (`IconInbox`, `IconWiki`, `IconCapture`, `IconPermanent`, etc). Each one uses:
  - `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `strokeWidth="1.5"`, `strokeLinecap/Linejoin="round"`
  - Three size tiers: **20px** for the activity bar, **16px** for sidebar/nav, **14px** for inline meta (pin, clock).
- **Secondary**: `lucide-react`, same stroke weight (1.5). We prefer Lucide for anything Plot doesn't define (`Calendar`, `Trash`, `PanelRight`, etc).
- **Color**: icons inherit `currentColor`. Resting state rides the opacity hierarchy — `.55` dark / `.45` light (as `--sidebar-icon`). Never fill an icon with a brand hue.
- **Emoji / unicode**: never used as icons. Strict rule.
- **Product logo**: the `P`/`J` mark (`assets/plot-icon.svg`). Auto-flips colors based on `prefers-color-scheme`. Reserved corner-of-the-app usage only.
- **Status progression**: some domain objects have two-state icon pairs (e.g. `IconWikiStub` = dashed outline, `IconWikiArticle` = solid + ribbon). Use the pair, don't invent a third.
- When a needed icon is missing: first check if Plot defines it; otherwise pull from `lucide-react` (CDN: `https://unpkg.com/lucide-static`). Never hand-roll inline SVG in a new component.

---

## VISUAL MOTIFS TO AVOID

Because it's easy to slip into stock-AI territory:

- No blue→purple gradients.
- No rounded card with a colored left-border accent.
- No emoji avatars, no emoji in chrome.
- No glassmorphism / backdrop blur.
- No scale-on-hover buttons, no bouncy animations.
- No "pill" buttons unless specifically badges.
- No drop shadows on flat icons.

---

## INDEX

Root files:
- `README.md` — this file (single source of truth)
- `colors_and_type.css` — all CSS variables, type utilities, semantic element styles
- `SKILL.md` — agent entry point (cross-compatible with Claude Code Skills)

Folders:
- `assets/` — logos, brand marks (`plot-icon.svg`, placeholders). Drop imagery here.
- `preview/` — small HTML cards for the Design System preview tab (colors, type, spacing, components)
- `ui_kits/plot-app/` — the Plot app UI kit (interactive React recreation)

UI kits:
- **`ui_kits/plot-app/`** — desktop/web knowledge app. Activity bar, sidebar, note list, editor, command palette, inbox triage.

---

## CAVEATS & SUBSTITUTIONS

- **Fonts**: Geist, Geist Mono, Merriweather, Playfair Display are loaded from **Google Fonts CDN** rather than shipped as .ttf in `fonts/`. If you need the offline bundle, export from [vercel/geist-font](https://github.com/vercel/geist-font) and drop them in `fonts/`.
- **Icons**: only the Plot-custom icons are shipped in this system (recreated in `ui_kits/plot-app/plot-icons.jsx`). For other glyphs we use `lucide-static` via CDN. If the user wants offline icons, bundle `lucide-static`.
- The source repo is Korean-language in its internal docs (AGENTS.md, skill files). This system translates the relevant design intent to English. No localization logic is included.
