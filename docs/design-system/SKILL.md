---
name: plot-design
description: Use this skill to generate well-branded interfaces and assets for Plot (a local-first, Linear-inspired knowledge management app), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

Quick orientation:
- **`README.md`** — tokens, voice, visual foundations, iconography, substitutions
- **`colors_and_type.css`** — every CSS variable + semantic element styles. Import this first.
- **`assets/`** — brand marks (`plot-icon.svg`)
- **`preview/`** — token specimens (not for shipping, for reference)
- **`ui_kits/plot-app/`** — interactive React components (`ActivityBar`, `Sidebar`, `NoteList`, `Editor`, `CommandPalette`, `InboxTriage`) and `index.html` showing them composed

When creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy `colors_and_type.css` + needed assets into the target and build static HTML. For production code, read this skill to become an expert in Plot's visual language and lift tokens/components as reference — the repo itself is `peterkwon248/linear-note-plot-`.

If the user invokes this skill without any other guidance, ask what they want to build or design, ask a few focused questions (surface? density? light/dark? which workflow stage — inbox/capture/permanent?), then act as an expert designer and output HTML artifacts *or* production-shaped code.

Non-negotiables when designing with Plot:
1. Opacity hierarchy, not color, for text/icon importance.
2. Spacing, not borders, for separation.
3. No gradients, no emoji in chrome, no scale-on-hover.
4. Stick to the frozen type scale (11·12·13·14·14.5·15·16·19·23·28).
5. Transitions are 120/160/200ms `ease` — bg/opacity only, elements never move.
