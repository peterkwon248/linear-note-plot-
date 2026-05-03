# Template PR b — Editing UI Unification (NoteEditor reuse + side-panel properties)

**Status**: PLAN ONLY — no code changes
**Branch**: `claude/template-b-edit-ui-unification`
**Series position**: b of {a✅, b, c, d}
**Prereq**: PR `a` (meta slimming) merged. PR #246 merged into main.

---

## 1. Executive recommendation

Pick **Option A.iii (synthesize a Note from the Template)** with a thin
adapter that intercepts saves. Reasons (in order of weight):

1. NoteEditorAdapter is **deeply load-bearing**: it owns Y.Doc lifecycle,
   IDB body persistence, hashtag bidirectional sync, footnote scoping,
   wiki-embed picker plumbing, link suggestions, the hydration race fix,
   and the empty-content-guard data-loss prevention. Forking it (option
   A.ii) duplicates ~460 lines of subtle correctness. Genericizing it
   (option A.i) is a 3-week refactor we don't need.
2. Templates and notes share **>90% of the editing surface** the user
   touches: TipTap content, title-as-first-block, footnotes, slash
   commands. The only divergences are (a) destination of save and (b)
   metadata. (a) is a single function swap; (b) belongs in the side
   panel anyway per user direction.
3. Future PR for **wiki-template editing** will benefit from the same
   adapter shim — it's the right shape.

Concrete shape:
- Build a `useTemplateAsNote(template)` hook that returns a `Note`-shaped
  object (id stable, derived from template), plus a save interceptor.
- Wrap NoteEditor in a `TemplateEditPage` that wires the synthesized
  Note + a `TemplateDetailPanel` into the right slots. The synthesized
  Note never enters the `notes` array — it lives only in the editor's
  prop closure, and its updateNote hook is intercepted to write to the
  template slice instead.
- Drop the standalone `TemplateEditor` component and the "Editing
  template" header.

For B (title field): pick **β (stack two title rows)** in a controlled,
minimal way. NoteEditor's title (TipTap first heading) maps to template
**`name`** (display + sortable). Add a single thin "Title pattern" input
ABOVE the editor (one row, monospace, with the placeholder chip strip)
that maps to template **`title`** — keeping the placeholder vocabulary
visible. This is the lowest-friction surface for power users without
hiding the pattern in a drawer.

For C (side panel): **(i) reuse SmartSidePanel infrastructure** by
extending `SidePanelContext` with a new `{type: "template"; id}` variant
and a new `TemplateDetailPanel` rendered by `SidePanelDetail`. Same
tabs (Detail / Connections / Activity / Bookmarks) — Connections shows
"Used by N notes" (notes created from this template), Activity shows
template create/update events, Bookmarks shows nothing for now.

For D (auto-save semantics): keep the **300ms debounce in the
synthesized adapter** that writes to `updateTemplate` instead of
`updateNote`. **Do NOT** introduce IDB body store for templates yet —
templates remain in main Zustand persist (defer to PR series end if
size becomes a concern). Keep both `content` (markdown for previews)
and `contentJson`.

For E (routing): **stay inline** within TemplatesView. The "list +
editor" mode replaces the right-pane TemplateEditor with the new
`TemplateEditPage` (same NoteEditor surface, scoped to template). No
new route. Focus mode = same surface, no left list.

For F (view modes): **drop "Focus" mode**. With NoteEditor reuse, the
list-editor-with-side-panel layout IS the focus experience. Keep List+Editor
and Grid. (User had pre-decided "Editing template 페이지 폐기" — this
preserves intent.)

For H (PR partition): **single PR** with one optional pre-PR refactor.
Estimated 350-500 LOC net (after deletes). Risk: medium (touches side
panel context union — well-isolated). Single PR keeps the unification
story coherent; splitting fragments review.

---

## 2. Phase breakdown

This PR is **one PR** with three sequential tasks (b1 → b2 → b3) on
the same branch. Each task is committed separately for clean review,
all squash-merged together.

| Task | Scope | LOC est. | Risk |
|------|-------|---------:|------|
| **b1** | Side panel: extend `SidePanelContext` with `template` variant + `TemplateDetailPanel` + `useSidePanelEntity` + `SidePanelDetail` routing | +220 / -0 | Low |
| **b2** | New `TemplateEditPage` component using NoteEditor surface; synthesize Note + intercept save | +280 / -0 | Medium |
| **b3** | Wire b2 into TemplatesView; delete old `TemplateEditor` + "Focus" mode + dialog content fields no longer needed | +60 / -350 | Low |

Net: **~+560 / -350 = +210 LOC**, 3 commits, single PR.

---

## 3. Per-task detail

### Task b1 — Side panel extension

**Goal**: Make SmartSidePanel render a Notion-style properties panel for
templates, mirroring how it does for notes and wiki articles.

**Files touched**:

| File | Change |
|------|--------|
| `lib/store/types.ts` | Extend `SidePanelContext` union with `\| { type: "template"; id: string }` |
| `components/side-panel/use-side-panel-entity.ts` | Add `template` branch to `SidePanelEntityResult` union; resolve template by id |
| `components/side-panel/side-panel-detail.tsx` | Add `entity.type === "template"` branch → render `TemplateDetailPanel` |
| `components/side-panel/template-detail-panel.tsx` | **NEW**. Properties panel (see structure below) |
| `lib/store/slices/workspace.ts` | (Optional) accept `template` in setSecondaryEntityContext path |

**`TemplateDetailPanel` structure** (mirrors note-detail/wiki-article-detail visual style):

```
┌─ Header badges ────────────────────────────┐
│ [Template] [Pinned] · Pin/Unpin button     │
├─ Properties section ───────────────────────┤
│ Status     [StatusDropdown]  ← default for generated notes
│ Priority   [PriorityDropdown]
│ Label      [LabelDropdown]
│ Folder     [FolderPicker]
│ Tags       [TagPicker]
├─ Title pattern (read-only echo) ───────────┤
│ "Meeting - {date}" → "Meeting - 2026-05-03"
├─ Dates ────────────────────────────────────┤
│ Created / Updated
├─ Properties ───────────────────────────────┤
│ Words / Characters / Headings / Description
├─ Used by ──────────────────────────────────┤
│ N notes created from this template (placeholder for c)
├─ Actions ──────────────────────────────────┤
│ [Use template] [Duplicate] [Delete]
└────────────────────────────────────────────┘
```

Reuse: `InspectorSection`, `StatusDropdown`, `LabelDropdown` (already
exist). Tags/folder pickers — copy the popover patterns from
`side-panel-context.tsx` (lines 332-451) but call `updateTemplate`
instead of `updateNote`/`addTagToNote` etc.

**Pseudocode for the resolver branch in `useSidePanelEntity`**:

```ts
// Add to discriminated union
| { type: "template"; noteId: null; ...; templateId: string; template: NoteTemplate | null }

// In resolver
if (sidePanelContext?.type === 'template') {
  const tmpl = templates.find((t) => t.id === sidePanelContext.id) ?? null
  if (tmpl) return { type: "template", templateId: sidePanelContext.id, template: tmpl, ... }
}
```

**Test plan (b1)**:
- [ ] Add unit test (or skip — Plot doesn't have heavy unit coverage):
      manually open templates view, set `sidePanelContext` to template,
      verify panel renders with all fields populated.
- [ ] Type-check passes: `npx tsc --noEmit`
- [ ] Build passes: `npm run build`
- [ ] Existing note/wiki side-panel paths still work (regression).

**Risk**: Low. Extending a discriminated union is a localized change;
TypeScript will surface every consumer that needs an updated branch.
The 23 files touching `sidePanelContext` from earlier grep will mostly
pattern-match safely (most read `.type === 'note'` and don't need to
care about templates).

### Task b2 — `TemplateEditPage` component

**Goal**: Reuse NoteEditor's editing surface for templates by
synthesizing a Note from a Template.

**New file**: `components/views/template-edit-page.tsx` (~280 LOC)

**Structure**:

```tsx
export function TemplateEditPage({ template }: { template: NoteTemplate }) {
  const updateTemplate = usePlotStore(s => s.updateTemplate)
  const setSidePanelContext = usePlotStore(s => s.setSidePanelContext)

  // Sync side panel context to this template on mount + on template id change
  useEffect(() => {
    setSidePanelContext({ type: "template", id: template.id })
    return () => setSidePanelContext(null) // optional: restore on unmount
  }, [template.id])

  // 1. Title pattern bar (above editor) — single thin row
  // 2. NoteEditor surface, fed by synthesized Note
  // 3. Side panel renders via existing SmartSidePanel (b1 wires it)

  // Synthesize a Note shape from the template
  const syntheticNote = useMemo(() => templateToNote(template), [template])

  // Override `updateNote` for this subtree by mounting a context provider,
  // OR — simpler — fork NoteEditorAdapter into TemplateEditorAdapter that
  // calls updateTemplate directly. (Justification below.)

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-col flex-1">
        {/* Title pattern bar — replaces the "Editing template" header */}
        <TitlePatternBar
          value={template.title}
          onChange={(v) => updateTemplate(template.id, { title: v })}
        />
        {/* Editor surface */}
        <TemplateEditorAdapter template={template} />
      </div>
      {/* SmartSidePanel is mounted globally — it picks up the context we just set */}
    </div>
  )
}
```

**Adapter strategy decision (revisit of A.iii vs A.ii)**:

After the dive: NoteEditorAdapter's saves go through `usePlotStore(s =>
s.updateNote)`. Hot-swapping that store action via React Context is
**fragile** — the hook is called inside the adapter at render time, so
intercepting requires monkey-patching at the store level, which breaks
encapsulation.

**Pragmatic refinement**: write a **TemplateEditorAdapter** as a
deliberately-thin fork (~140 LOC, vs NoteEditorAdapter's 460) that
strips:
- Y.Doc multi-pane sync (not relevant for templates — single editor)
- IDB body store (templates persist via Zustand)
- Hashtag bidirectional sync (templates don't have hashtag association)
- LinkSuggestion (suggesting wikilinks inside template content is YAGNI;
  user can still type `[[...]]` manually)

What it KEEPS:
- TipTap mount with full extension set (slash commands, footnotes,
  wiki embeds, all formatting)
- 300ms debounced save
- Title-from-first-block extraction
- FootnotesFooter mount
- The `key={template.id}` remount on switch

This is option A.iii **executed via a thin adapter** — closest to A.ii
but justified-thin (we measured what 460→140 buys us). The synthesized
`Note`-like object is fed into TipTapEditor directly, bypassing
NoteEditorAdapter entirely.

```ts
// templateToNote: synthesize a Note shape so TipTapEditor + helpers
// can use the existing initialContent builder pattern.
function templateToNote(t: NoteTemplate): Pick<Note, 'id'|'title'|'content'|'contentJson'|'tags'> {
  return {
    id: t.id,           // stable
    title: t.name,      // template name → editor's title node
    content: t.content,
    contentJson: t.contentJson,
    tags: t.tags,
  }
}
```

**`TemplateEditorAdapter` skeleton**:

```tsx
function TemplateEditorAdapter({ template }: { template: NoteTemplate }) {
  const updateTemplate = usePlotStore(s => s.updateTemplate)
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<{ content: string; contentJson: any; name: string } | null>(null)

  // Initial content: same builder as NoteEditorAdapter
  const initialContent = buildInitialContent({
    title: template.name,
    content: template.content,
    contentJson: template.contentJson,
  })

  const handleChange = useCallback((json, plainText) => {
    // Extract first-block text → template.name
    const name = extractFirstBlockText(json) || template.name
    const bodyText = name ? plainText.slice(name.length).trimStart() : plainText
    pendingRef.current = { name, content: bodyText, contentJson: json }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      if (pendingRef.current) {
        updateTemplate(template.id, {
          name: pendingRef.current.name,
          content: pendingRef.current.content,
          contentJson: pendingRef.current.contentJson,
        })
      }
    }, 300)
  }, [template.id, template.name, updateTemplate])

  // flush on unmount/switch
  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (pendingRef.current) {
      updateTemplate(template.id, pendingRef.current as any)
    }
  }, [template.id, updateTemplate])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
        <TipTapEditor
          key={template.id}
          content={initialContent}
          onChange={handleChange}
          placeholder="Press / for menu, or start writing your template..."
          onEditorReady={(e) => setEditorInstance(e as Editor)}
        />
        <FootnotesFooter editor={editorInstance} editable={true} />
        {/* No noteId prop — references/anchors not used for templates yet */}
      </div>
      <FixedToolbar editor={editorInstance} />
    </div>
  )
}
```

**`TitlePatternBar`** (small, ~30 LOC):

```tsx
function TitlePatternBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-6 py-2.5 bg-secondary/10">
      <Layout size={14} className="text-muted-foreground shrink-0" />
      <span className="text-2xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">
        Title pattern
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Meeting - {date}"
        className="flex-1 bg-transparent text-note text-foreground placeholder:text-muted-foreground/70 focus:outline-none font-mono"
      />
      {/* Placeholder chip strip — same as old PLACEHOLDER_VARS */}
      <div className="flex items-center gap-1 shrink-0">
        {PLACEHOLDER_VARS.map(v => (
          <button key={v.key} title={v.desc}
            onClick={() => onChange(value + v.key)}
            className="px-1.5 py-0.5 rounded text-2xs font-mono bg-secondary/60 text-muted-foreground hover:bg-accent/20 hover:text-accent transition-colors"
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

**Test plan (b2)**:
- [ ] Open template, edit name in editor — verify save to `template.name`
- [ ] Edit body — verify save to `template.content` + `template.contentJson`
- [ ] Edit title pattern — verify save to `template.title`
- [ ] Switch templates — verify pending save flushed (no data loss)
- [ ] Slash commands work (`/heading`, `/quote`, etc.)
- [ ] Footnote insert + edit works
- [ ] Wiki embed picker works inside template content
- [ ] No console errors about missing noteId in FootnotesFooter (it accepts `noteId?:`)

**Risk**: Medium. Three potential pitfalls:
1. **TipTap title-extraction logic** — copying NoteEditorAdapter's
   first-block extraction. Careful: the editor `title` node is the
   FIRST block of any type, not specifically a heading. The
   NoteEditorAdapter handles this at lines 286-293; mirror exactly.
2. **`key` remount on template switch** — must be `key={template.id}`
   to fully reset editor state, otherwise content from prev template
   leaks into next.
3. **TipTap extension assumptions** — some extensions look for
   `noteId` (e.g., comment marker layer, mention index updates).
   Templates without noteId may emit warnings. **Mitigation**: pass
   `noteId={undefined}` explicitly; TipTapEditor already accepts
   optional noteId. Verify no extension throws on undefined.

### Task b3 — Wire-up in TemplatesView, delete old code

**Goal**: Replace right-pane `TemplateEditor` with `TemplateEditPage`,
remove "Focus" view mode, simplify create dialog.

**Files touched**:

| File | Change |
|------|--------|
| `components/views/templates-view.tsx` | -350 LOC: drop `TemplateEditor`, drop `Focus` mode branch, simplify `VIEW_MODES`, simplify `TemplateFormDialog`, swap right-pane render for `<TemplateEditPage template={selectedTemplate} />` |

**Specific changes**:

1. **Drop `TemplateEditor` function** (lines 253-435 in current
   templates-view.tsx — ~180 LOC)
2. **Drop `Focus` mode**:
   - Remove `"focus"` from `TemplateViewMode` union (line 53)
   - Remove from `VIEW_MODES` array (line 56)
   - Remove the entire `if (viewMode === "focus")` branch (lines 802-850)
   - Remove "back to list" / view switcher slot from focus
3. **Simplify `TemplateFormDialog`**:
   - Drop `status`, `priority`, `content`, `title` from create flow
   - Keep ONLY `name` (required) + `description` (optional)
   - Rationale: post-PR, all metadata is editable in the side panel
     once the template is created. Pre-fill defaults: `status: "inbox"`,
     `priority: "none"`, `title: ""`, `content: ""`, `contentJson: null`
4. **Replace right-pane render**:

   ```tsx
   // Was:
   <TemplateEditor template={selectedTemplate} onUpdate={updateTemplate} onUse={handleUseTemplate} />

   // Becomes:
   <TemplateEditPage template={selectedTemplate} />
   ```

5. **Auto-open side panel on template select** (UX nicety): when
   `selectedTemplateId` changes to a non-null value, set sidePanelOpen
   = true if not already. This mirrors how note selection works.
6. **Move "Use Template" button** from old TemplateEditor's top-right
   (since we deleted that header) to either: (a) the side panel
   Actions section (recommended, consistent with note Actions), or
   (b) a small action in the editor's top-right via NoteEditor's
   header slot (but NoteEditor doesn't take a slot, so (a) it is).

**TemplatesView refactor — final shape**:

```tsx
export function TemplatesView() {
  // ... existing state ...
  const [viewMode, setViewMode] = useState<TemplateViewMode>("grid") // only grid | list-editor

  // On select, sync side panel context to this template
  useEffect(() => {
    if (selectedTemplateId) {
      usePlotStore.getState().setSidePanelContext({ type: "template", id: selectedTemplateId })
    }
  }, [selectedTemplateId])

  if (viewMode === "grid") {
    return <GridLayout ... /> // unchanged
  }

  // List + Editor
  return (
    <div className="flex flex-1 flex-row overflow-hidden">
      <LeftListPanel ... /> {/* unchanged */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {selectedTemplate ? (
          <TemplateEditPage template={selectedTemplate} />
        ) : (
          <EmptyState ... />
        )}
      </div>
    </div>
  )
}
```

**Test plan (b3)**:
- [ ] Open `/templates` → grid renders, no console errors
- [ ] Click template card → switches to list-editor, template selected
- [ ] Right pane shows new `TemplateEditPage` (NoteEditor surface)
- [ ] Side panel auto-opens with `TemplateDetailPanel`
- [ ] All properties editable from side panel: status, priority,
      label, folder, tags
- [ ] "Use Template" button in side panel creates note from template,
      navigates to it
- [ ] "New" dialog: simplified form (name + description only) creates
      template successfully
- [ ] Created template opens in list-editor with empty content
- [ ] Sort, search, pin, delete still work
- [ ] No broken imports / type errors
- [ ] Build passes
- [ ] No Focus view button visible in switcher

**Risk**: Low. Mostly deletion + wiring. The only subtle bit is the
side-panel auto-open behavior — make sure it doesn't fight with user
explicitly closing the panel (mirror note-selection pattern: only set
context, don't force open).

---

## 4. Open questions for user

These need your input before b3 commits — but b1 and b2 can proceed
without:

| # | Question | Default if no answer |
|---|----------|----------------------|
| Q1 | When user creates a new template via the simplified dialog, should we (a) drop them straight into list-editor with the new empty template focused, or (b) keep current behavior (focus mode, which we're removing)? | (a) — drop into list-editor, select the new template |
| Q2 | Should `Use Template` live in (a) side panel Actions section only, or (b) ALSO as a prominent button in the editor area (top-right of TitlePatternBar)? | (a) only — keeps editor surface clean and identical to NoteEditor |
| Q3 | Auto-open side panel on template select? Yes / no / respect user's last-set preference? | Yes auto-open on first select per session, then respect user toggles |
| Q4 | Title pattern bar position — above editor (recommended), or hide in the side panel as a "Title pattern" property field? | Above editor (β), since pattern is user-facing & frequently edited |
| Q5 | Do we want the editor toolbar (`FixedToolbar`) at the bottom (current TemplateEditor) or at the top (current NoteEditor uses `FixedToolbar` outside the surface)? | Match NoteEditor exactly — bottom-of-surface FixedToolbar (NoteEditor lines 627-628) |

---

## 5. Migration concerns

**Data shape**: `NoteTemplate` shape is unchanged. No store migration
needed. v75 → v75 (no bump).

**Existing templates**: Will continue to work. Templates that have
`title` (pattern) like `"Meeting - {date}"` will appear in the new
TitlePatternBar; templates with empty `title` will show the
placeholder. Templates that have `contentJson` will load directly into
TipTap (same as before via NoteEditor's initialContent builder).
Templates with only `content` (markdown) but no `contentJson` will
trigger the fallback path that builds `{ heading, paragraph }`.

**Side panel context union**: Adding a 4th variant (`"template"`) is
backward-compatible. All existing consumers do `if (ctx?.type ===
'note' || ctx?.type === 'wiki')`-style checks; they will simply not
match the new variant. **Type-check will catch any exhaustiveness
switch** that needs a new case (none exist currently per grep — switches
on `type` are absent).

**Side panel preserve-on-pane-switch**: PR #246-era code saves
`_savedPrimaryContext` when switching to secondary. Templates as
context may not have a "secondary pane" use case (templates don't
open in a tab system). **Recommendation**: don't open templates in
the secondary pane in this PR. Defer to PR c (template-only views)
if needed.

**Y.Doc**: Not used for templates (not in TemplateEditorAdapter).
Future multi-device sync of templates would need separate plumbing
— defer to sync PR series.

**Footnotes/References for templates**: FootnotesFooter renders
without `noteId` (it's optional). The NoteReferencesFooter section
will short-circuit when `noteId` is undefined (it already does — see
`if (!noteId) return [] as string[]` at line 299 of footnotes-footer
.tsx). Footnotes inside template content WILL persist (they're stored
inline in `contentJson` as TipTap node attrs). Deferring template-level
"References" (separate from footnotes) to a future PR is fine.

**Hashtag sync for templates**: Templates do NOT auto-extract
hashtags from content (we strip that from the adapter). Users must
explicitly set `tags` via the side panel. Rationale: a template's
`tags` are defaults for generated notes, not the template's own
classification. (This is a semantic intent change — call it out in
PR description.)

**Risk to other features**:
- Wiki view: no impact (different code path)
- Notes view: no impact (NoteEditorAdapter untouched)
- Side panel for wiki: no impact (separate `WikiArticleDetailPanel`)
- Reference panel: no impact

---

## 6. Total estimate

| Metric | Value |
|--------|------:|
| Files created | 2 (`template-edit-page.tsx`, `template-detail-panel.tsx`) |
| Files modified | 4 (`templates-view.tsx`, `types.ts`, `use-side-panel-entity.ts`, `side-panel-detail.tsx`) |
| Files deleted | 0 (TemplateEditor lives inside templates-view.tsx — deleted by edit, not file removal) |
| Net LOC | +560 / -350 = **+210** |
| Commits | 3 (b1, b2, b3) |
| Time estimate | ~3-4 focused hours of implementation + 1 hour testing |
| Risk level | **Medium-Low** — concentrated in TemplateEditorAdapter correctness; b1 and b3 are mechanical |
| Blocker likelihood | Low — no external deps, no migration, no schema change |

**Verification gates** (before squash-merge):
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run build` clean
- [ ] Manual test: all checkboxes from b1/b2/b3 test plans pass
- [ ] Visual regression: open existing templates, verify content
      renders identically to pre-PR

---

## Plan Summary

**Plan saved to:** `.omc/plans/template-b-edit-ui-unification.md`

**Scope:**
- 3 sequential tasks (b1, b2, b3) on one branch, single PR
- 2 new files, 4 modified files, ~+210 net LOC
- Estimated complexity: **MEDIUM-LOW**

**Key Deliverables:**
1. SmartSidePanel learns to render template properties (b1)
2. Template editing uses NoteEditor surface via thin TemplateEditorAdapter (b2)
3. Old standalone "Editing template" UI deleted; Focus mode dropped; create dialog simplified (b3)

---

**Does this plan capture your intent?**

Options:
- "proceed" or "start work" — Begin implementation via /oh-my-claudecode:start-work
- "adjust [X]" — Return to interview to modify specific aspect
- "restart" — Discard plan and start fresh interview

Most likely things you'd want to adjust:
- The 5 open questions in Section 4 (defaults are noted; tell me if any are wrong)
- The adapter strategy (A.iii via thin fork) if you'd rather invest in genericizing NoteEditorAdapter
- The "drop Focus mode" decision if you want to keep it
- Whether to split into multiple PRs (current plan: single PR)
