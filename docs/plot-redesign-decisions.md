# Plot Redesign — Brainstorming Decisions

## Agreed Changes (vs Original Spec)

| # | Topic | Original Spec | Decision |
|---|-------|--------------|----------|
| 1 | Maps | Remove entirely | Remove route. Detail panel graph click → modal/fullscreen expand |
| 2 | Board → Calendar | Replace Board with Calendar | Agreed. Table `groupBy:status` inherits Board's role |
| 3 | Inbox | 3 tabs (Triage/Review/Alerts) | Single page with sections (scroll). Collapsible sections |
| 4 | Recent | 5 recent notes | Agreed as-is. Context restoration tool |
| 5 | SRS | Dedicated review card mode | Engine kept, UI minimized. Card mode deferred |
| 6 | Status Icons | □ → ▤ → ☑ | □ → ▣ → ☑ (area difference for 14px clarity) |
| 7 | Detail Panel | Merge 2 components, remove clutter | Agreed. Major reduction |
| 8 | Workflow Actions | Buttons in detail panel | Remove. Status dropdown + Inbox inline + context menu/shortcuts |

## Design System Priorities (Impact Order)

1. Border removal + whitespace separation (CSS-level, 1 day)
2. Icon unification (strokeWidth 1.4, opacity 0.6) (CSS-level, 1 day)
3. Color diet (status colors → gray shapes □▣☑) (component work)
4. Brightness-based hierarchy (zinc-100 vs zinc-500) (CSS-level)
5. Empty states (illustration + helpful copy)
6. Hover/selected unification

## Typography (4 levels)

- 12px — meta (dates, counts, badges)
- 13px — body (sidebar, lists, content)
- 16px — section titles (Inbox, Notes headers)
- 20px — page/editor titles

## Execution Order

- Week 1: Sidebar Surgery + Design System foundation
- Week 2: NoteRow Redesign
- Week 3: Editor Typography + Wiki-Link Polish
- Week 4: Search + Detail Panel Cleanup
