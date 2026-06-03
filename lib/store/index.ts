import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { EntityEvent, AutopilotLogEntry, Relation, WikiStatus } from "../types"
import type { Attachment, CoOccurrence, RelationSuggestion } from "../types"
import { buildDefaultViewStates } from "../view-engine/defaults"
import { createIDBStorage } from "../idb-storage"
import { createAppendEvent } from "./helpers"
import { SEED_NOTES, SEED_FOLDERS, SEED_TAGS, SEED_LABELS, SEED_TEMPLATES, SEED_WIKI_ARTICLES, SEED_WIKI_CATEGORIES, SEED_WIKI_TEMPLATES, SEED_BOOKS, SEED_SMART_BOOK_PRESETS, WELCOME_NOTE } from "./seeds"
import { persistBody, persistBlockBody } from "./helpers"
import { isWikiStub } from "../wiki-utils"
import { createNotesSlice } from "./slices/notes"
import { createWorkflowSlice } from "./slices/workflow"
import { createFoldersSlice } from "./slices/folders"
import { createTagsSlice } from "./slices/tags"
import { createLabelsSlice } from "./slices/labels"
import { createStickersSlice } from "./slices/stickers"
import { createThreadSlice } from "./slices/thinking"
import { createMapsSlice } from "./slices/maps"
import { createUISlice } from "./slices/ui"
import { createAutopilotSlice } from "./slices/autopilot"
import { createTemplatesSlice } from "./slices/templates"
import { createRelationsSlice } from "./slices/relations"
import { createEditorSlice } from "./slices/editor"
import { createWorkspaceSlice } from "./slices/workspace"
import { createAttachmentsSlice } from "./slices/attachments"
import { createHooksSlice } from "./slices/hooks"
import { createOntologySlice } from "./slices/ontology"
import { createWikiCollectionsSlice } from "./slices/wiki-collections"
import { createSavedViewsSlice } from "./slices/saved-views"
import { createCustomQuickFiltersSlice } from "./slices/custom-quick-filters"
import { createWikiArticlesSlice } from "./slices/wiki-articles"
import { createWikiCategoriesSlice } from "./slices/wiki-categories"
import { createWikiTemplatesSlice } from "./slices/wiki-templates"
import { createWikiInfoboxPresetsSlice } from "./slices/wiki-infobox-presets"
import { createReferencesSlice } from "./slices/references"
import { createGlobalBookmarksSlice } from "./slices/global-bookmarks"
import { createCommentsSlice } from "./slices/comments"
import { createInboxSlice } from "./slices/inbox"
import { createBooksSlice } from "./slices/books"
import { createSmartBookPresetsSlice } from "./slices/smart-book-presets"
import { DEFAULT_AUTOPILOT_RULES } from "../autopilot/defaults"
import { migrate } from "./migrate"
import type { PlotState } from "./types"
import { todoIndex } from "@/lib/todo-index"
import { getAllBodies, getBody, saveBody } from "@/lib/note-body-store"

export const usePlotStore = create<PlotState>()(
  persist(
    (set, get) => {
      const appendEvent = createAppendEvent(set as any)

      return {
        // ── Initial State ──
        notes: SEED_NOTES,
        folders: SEED_FOLDERS,
        tags: SEED_TAGS,
        labels: SEED_LABELS,
        stickers: [],

        activeView: { type: "all" } as const,
        selectedNoteId: null,
        searchQuery: "",
        globalSearchQuery: "",
        searchOpen: false,
        shortcutOverlayOpen: false,
        sidePanelOpen: true,
        sidePanelMode: 'detail' as import("./types").SidePanelMode,
        previewNoteId: null,
        sidePanelContext: null,
        _savedPrimaryContext: null,

        sidebarWidth: 220,
        sidebarLastWidth: 220,
        sidebarCollapsed: false,
        activitybarCollapsed: false,
        mergePickerOpen: false,
        mergePickerSourceId: null,
        linkPickerOpen: false,
        linkPickerSourceId: null,
        pendingWikiAssemblyIds: null,

        entityEvents: [] as EntityEvent[],
        threads: [],
        graphFocusDepth: 0,
        commandPaletteMode: "commands" as const,
        relations: [] as Relation[],
        attachments: [] as Attachment[],
        // temporal-hooks-prd v0.2 Phase 1 — unified Hook store.
        hooks: [] as import("../types").Hook[],
        coOccurrences: [] as CoOccurrence[],
        relationSuggestions: [] as RelationSuggestion[],
        clusterSuggestions: [] as import("../types").WikiClusterSuggestion[],
        ontologyPositions: {} as Record<string, { x: number; y: number }>,
        wikiCollections: {} as Record<string, import("../types").WikiCollectionItem[]>,
        savedViews: [] as import("../types").SavedView[],
        customQuickFilters: [] as import("../types").CustomQuickFilter[],
        wikiCategories: SEED_WIKI_CATEGORIES,
        wikiArticles: SEED_WIKI_ARTICLES,
        references: {} as Record<string, import("../types").Reference>,
        globalBookmarks: {} as Record<string, import("../types").GlobalBookmark>,
        comments: {} as Record<string, import("../types").Comment>,
        books: SEED_BOOKS,
        smartBookPresets: SEED_SMART_BOOK_PRESETS,
        bookContext: { primary: null, secondary: null } as { primary: import("./types").BookContextState | null; secondary: import("./types").BookContextState | null },
        listNavContext: { primary: null, secondary: null } as { primary: import("./types").ListNavContext | null; secondary: import("./types").ListNavContext | null },
        // Dual mode (split-mode-prd) — list+editor split-of-main, distinct from NoteSplitOverlay
        dualSelection: null as import("./types").DualSelection | null,
        dualRatio: 0.4,
        listPaneWidth: 320,
        autopilotEnabled: true,
        autopilotRules: DEFAULT_AUTOPILOT_RULES,
        autopilotLog: [] as AutopilotLogEntry[],
        templates: SEED_TEMPLATES,
        wikiTemplates: SEED_WIKI_TEMPLATES,
        // PR-D — user infobox presets pool (empty until user saves first preset).
        userInfoboxPresets: [] as import("../types").UserInfoboxPreset[],

        // Seed bookkeeping — false until the one-time seed runs in onRehydrate.
        // Gates re-seeding so deleted data never resurrects (출시: 부활 0).
        hasSeeded: false,

        viewStateByContext: buildDefaultViewStates(),
        _viewStateHydrated: false,
        navigationHistory: [] as string[],
        navigationIndex: -1,
        todoTasks: [],
        dismissedInboxItems: [] as import("./slices/inbox").InboxDismissed[],
        snoozedInboxItems: [] as import("./slices/inbox").InboxSnoozed[],

        // ── Slices ──
        ...createNotesSlice(set, get, appendEvent),
        ...createWorkflowSlice(set, get, appendEvent),
        ...createFoldersSlice(set),
        ...createTagsSlice(set, appendEvent),
        ...createLabelsSlice(set, appendEvent),
        ...createStickersSlice(set, get, appendEvent),
        ...createThreadSlice(set, get, appendEvent),
        ...createMapsSlice(set),
        ...createRelationsSlice(set, get, appendEvent),
        ...createUISlice(set, get, appendEvent),
        ...createAutopilotSlice(set, get, appendEvent),
        ...createTemplatesSlice(set, get, appendEvent),
        ...createEditorSlice(set, get),
        ...createWorkspaceSlice(set, get),
        ...createAttachmentsSlice(set, get, appendEvent),
        ...createHooksSlice(set, get, appendEvent),
        ...createOntologySlice(set, get, appendEvent),
        ...createWikiCollectionsSlice(set, get),
        ...createSavedViewsSlice(set),
        ...createCustomQuickFiltersSlice(set),
        ...createWikiCategoriesSlice(set, get),
        ...createWikiArticlesSlice(set, get, appendEvent),
        ...createWikiTemplatesSlice(set, get, appendEvent),
        ...createWikiInfoboxPresetsSlice(set, get),
        ...createReferencesSlice(set, appendEvent),
        ...createGlobalBookmarksSlice(set),
        ...createCommentsSlice(set),
        ...createInboxSlice(set),
        ...createBooksSlice(set, get, appendEvent),
        ...createSmartBookPresetsSlice(set, get),

        // ── Todo Index ──
        rebuildTodoIndex: async () => {
          const state = get()
          // Phase α-2: wiki article blocks도 함께 인덱싱 (text block의 contentJson).
          const tasks = await todoIndex.buildFromScratch(state.notes, state.wikiArticles, getAllBodies)
          set({ todoTasks: tasks })
        },

        toggleTaskChecked: async (noteId: string, position: number) => {
          const body = await getBody(noteId)
          if (!body?.contentJson) return

          // Walk contentJson to find the nth taskItem and toggle checked
          let taskPos = 0
          function toggleInTree(node: any): any {
            if (node.type === "taskItem") {
              if (taskPos === position) {
                taskPos++
                return { ...node, attrs: { ...node.attrs, checked: !node.attrs?.checked } }
              }
              taskPos++
              return node
            }
            if (node.content) {
              return { ...node, content: node.content.map(toggleInTree) }
            }
            return node
          }

          const newJson = toggleInTree(body.contentJson)
          await saveBody({ ...body, contentJson: newJson })

          // Update the note's updatedAt to trigger re-render
          const state = get()
          const note = state.notes.find((n: any) => n.id === noteId)
          if (note) {
            state.updateNote(noteId, { updatedAt: new Date().toISOString() })
          }

          // Rebuild todo index for this note
          todoIndex.upsertNote(noteId, note?.title ?? "", newJson)
          set({ todoTasks: todoIndex.getAllTasks() })
        },

        addQuickTask: async (text: string) => {
          const state = get()
          // Find or create "Quick Tasks" note
          let quickNote = state.notes.find((n: any) => n.title === "Quick Tasks" && !n.trashed)
          let noteId: string

          if (!quickNote) {
            // Create new Quick Tasks note
            noteId = state.createNote({ title: "Quick Tasks", status: "backlog" as const })
            // Build initial contentJson with the task
            const contentJson = {
              type: "doc",
              content: [
                { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Quick Tasks" }] },
                {
                  type: "taskList",
                  content: [
                    {
                      type: "taskItem",
                      attrs: { checked: false },
                      content: [{ type: "paragraph", content: [{ type: "text", text }] }],
                    },
                  ],
                },
              ],
            }
            const content = `## Quick Tasks\n- [ ] ${text}`
            await saveBody({ id: noteId, content, contentJson })
            state.updateNote(noteId, { content, contentJson: null })
          } else {
            noteId = quickNote.id
            // Append task to existing Quick Tasks note
            const body = await getBody(noteId)
            const contentJson = (body?.contentJson ?? { type: "doc", content: [] }) as any

            const newTaskItem = {
              type: "taskItem",
              attrs: { checked: false },
              content: [{ type: "paragraph", content: [{ type: "text", text }] }],
            }

            // Find the last taskList and append, or create one
            let appended = false
            if (contentJson.content) {
              for (let i = contentJson.content.length - 1; i >= 0; i--) {
                if (contentJson.content[i].type === "taskList") {
                  contentJson.content[i].content.push(newTaskItem)
                  appended = true
                  break
                }
              }
              if (!appended) {
                contentJson.content.push({
                  type: "taskList",
                  content: [newTaskItem],
                })
              }
            }

            const content = (body?.content ?? "") + `\n- [ ] ${text}`
            await saveBody({ id: noteId, content, contentJson })
            state.updateNote(noteId, { updatedAt: new Date().toISOString() })
          }

          // Rebuild todo index
          const updatedBody = await getBody(noteId)
          const note = get().notes.find((n: any) => n.id === noteId)
          todoIndex.upsertNote(noteId, note?.title ?? "Quick Tasks", updatedBody?.contentJson as any)
          set({ todoTasks: todoIndex.getAllTasks() })
        },
      }
    },
    {
      name: "plot-store",
      version: 154,
      storage: createIDBStorage<PlotState>(),
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _viewStateHydrated, mergePickerOpen, mergePickerSourceId, linkPickerOpen, linkPickerSourceId, previewNoteId, sidePanelOpen, sidePanelContext, _savedPrimaryContext, todoTasks, secondaryHistory, secondaryHistoryIndex, secondaryEntityContext, bookContext, listNavContext, dualSelection, globalSearchQuery, ...rest } = state
        return {
          ...rest,
          notes: state.notes.map((n) => ({ ...n, content: "", contentJson: null })),
          // Strip blocks from wiki articles — block metadata is persisted in IDB (plot-wiki-block-meta)
          wikiArticles: state.wikiArticles.map((a) => ({
            ...a,
            blocks: [],  // blocks are persisted separately in IDB
          })),
        } as unknown as PlotState
      },
      migrate,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._viewStateHydrated = true
          // Side panel should always start closed (not persisted)
          state.sidePanelOpen = false
          // Secondary panel navigation is session-only
          state.secondaryHistory = []
          state.secondaryHistoryIndex = -1
          state.secondaryEntityContext = null
          state._savedPrimaryContext = null
          // Phase 4: in-book navigation context is session-only — reload
          // returns to plain note/wiki view (mirrors Linear's "1/5" UX).
          state.bookContext = { primary: null, secondary: null }
          // List-nav context is session-only too — a frozen list snapshot
          // doesn't survive reload (same rationale as bookContext).
          state.listNavContext = { primary: null, secondary: null }
          // Dual mode (split-mode-prd LOCKED #5/#9) — selection is session-only,
          // dualRatio persists. Reset selection to null on reload so editor pane
          // shows DefaultEmptyState until user selects.
          state.dualSelection = null
          // Defensive: clamp dualRatio in case persisted value drifted out of range.
          if (typeof state.dualRatio !== "number" || isNaN(state.dualRatio)) {
            state.dualRatio = 0.4
          } else {
            state.dualRatio = Math.max(0.25, Math.min(0.65, state.dualRatio))
          }

          // One-time seed (hasSeeded gate). 출시: 데이터 부활 0 — 사용자가
          // 데이터를 모두 지우면 빈 앱이 유지되고 데모가 되살아나지 않는다.
          // (기존 "notes 비면 재시드" + books/presets "비면 backfill" 버그 제거.)
          if (!state.hasSeeded) {
            if (process.env.NODE_ENV === "development") {
              // Dev: rich demo set for QA / screenshots.
              state.notes = SEED_NOTES
              state.wikiArticles = SEED_WIKI_ARTICLES
              state.wikiCategories = SEED_WIKI_CATEGORIES
              state.folders = SEED_FOLDERS
              state.tags = SEED_TAGS
              state.labels = SEED_LABELS
              state.templates = SEED_TEMPLATES
              state.books = SEED_BOOKS
              state.smartBookPresets = SEED_SMART_BOOK_PRESETS
            } else {
              // Prod new user: ship the full PKM starter set. Plot is a
              // knowledge GRAPH — a rich, interconnected seed (notes ↔ wiki ↔
              // books: ~9 notes / ~22 wiki articles / 8 books / 13 templates +
              // categories/tags/labels) is the first impression that an empty
              // app can't deliver. WELCOME_NOTE leads as a friendly pinned
              // intro. The hasSeeded gate (above) means a user who clears it
              // out never sees the demo resurrect (출시: 부활 0).
              state.notes = [{ ...WELCOME_NOTE }, ...SEED_NOTES]
              state.wikiArticles = SEED_WIKI_ARTICLES
              state.wikiCategories = SEED_WIKI_CATEGORIES
              state.folders = SEED_FOLDERS
              state.tags = SEED_TAGS
              state.labels = SEED_LABELS
              state.templates = SEED_TEMPLATES
              state.wikiTemplates = SEED_WIKI_TEMPLATES
              state.books = SEED_BOOKS
              state.smartBookPresets = SEED_SMART_BOOK_PRESETS
            }
            state.hasSeeded = true
          }

          // Array-shape defense only — a serialize round-trip can turn [] into
          // {}. This is NOT a re-seed: empty arrays are preserved so user
          // deletions stick (no demo resurrection).
          if (!Array.isArray(state.books)) state.books = []
          if (!Array.isArray(state.smartBookPresets)) state.smartBookPresets = []
          if (!Array.isArray(state.wikiTemplates)) state.wikiTemplates = []
          if (!Array.isArray(state.userInfoboxPresets)) state.userInfoboxPresets = []
          state.previewNoteId = null

          // v65: Migrate IDB note bodies — convert title nodes to heading level 2
          if (typeof indexedDB !== "undefined" && !localStorage.getItem("plot-title-migrated")) {
            const openReq = indexedDB.open("plot-note-bodies", 1)
            openReq.onsuccess = () => {
              const db = openReq.result
              try {
                const tx = db.transaction("bodies", "readwrite")
                const store = tx.objectStore("bodies")
                const cursorReq = store.openCursor()
                cursorReq.onsuccess = () => {
                  const cursor = cursorReq.result
                  if (!cursor) {
                    localStorage.setItem("plot-title-migrated", "1")
                    return
                  }
                  const body = cursor.value
                  if (body?.content && Array.isArray(body.content)) {
                    const firstNode = body.content[0]
                    if (firstNode?.type === "title") {
                      firstNode.type = "heading"
                      firstNode.attrs = { ...firstNode.attrs, level: 2 }
                      cursor.update(body)
                    }
                  }
                  cursor.continue()
                }
              } catch { /* IDB store might not exist yet */ }
            }
          }

          // Persist seed note bodies to IDB (content is stripped during partialize).
          // Pool = dev demo (SEED_NOTES) or the prod welcome note, matching the
          // seed branch above so the welcome note's body shows in the editor.
          {
            const seededPool = process.env.NODE_ENV === "development" ? SEED_NOTES : [WELCOME_NOTE]
            for (const note of state.notes) {
              const seed = seededPool.find((s) => s.id === note.id)
              if (seed && seed.content && !note.content) {
                note.content = seed.content
                persistBody({ id: seed.id, content: seed.content, contentJson: null })
              }
            }
          }

          // Backfill "Memo" label for notes without a label
          {
            let memoLabel = state.labels.find((l: any) => l.name === "Memo" && !l.trashed)
            if (!memoLabel) {
              memoLabel = { id: "label-memo", name: "Memo", color: "#f5a623" }
              state.labels = [...state.labels, memoLabel]
            }
            let changed = false
            for (const note of state.notes) {
              if (!note.labelId && !note.trashed) {
                note.labelId = memoLabel.id
                changed = true
              }
            }
          }

          // Build todo index from note bodies + wiki article blocks (Phase α-2)
          if (typeof indexedDB !== "undefined") {
            todoIndex.buildFromScratch(state.notes, state.wikiArticles, getAllBodies).then((tasks) => {
              usePlotStore.setState({ todoTasks: tasks })
            })
          }

          // Load wiki article blocks from IDB (block metadata + text bodies)
          if (typeof indexedDB !== "undefined" && state.wikiArticles?.length > 0) {
            import("@/lib/wiki-block-meta-store").then(({ getArticleBlocks }) => {
              Promise.all(
                state.wikiArticles.map(async (a: any) => {
                  const blocks = await getArticleBlocks(a.id)
                  return { id: a.id, blocks }
                })
              ).then((results) => {
                const store = usePlotStore.getState()
                const updatedArticles = store.wikiArticles.map((a) => {
                  const result = results.find((r) => r.id === a.id)
                  if (result?.blocks && result.blocks.length > 0) {
                    return { ...a, blocks: result.blocks }
                  }
                  // Fallback: seed articles on first load (no IDB data yet)
                  const seedArticle = SEED_WIKI_ARTICLES.find((s) => s.id === a.id)
                  if (seedArticle && a.blocks.length === 0) {
                    // Persist seed blocks to IDB for future loads
                    import("@/lib/wiki-block-meta-store").then(({ saveArticleBlocks }) => {
                      saveArticleBlocks(a.id, seedArticle.blocks).catch(() => {})
                    })
                    // Persist seed text block bodies to IDB
                    for (const b of seedArticle.blocks) {
                      if (b.type === "text" && b.content) {
                        persistBlockBody({ id: b.id, content: b.content })
                      }
                    }
                    return { ...a, blocks: seedArticle.blocks }
                  }
                  return a
                })
                usePlotStore.setState({ wikiArticles: updatedArticles })

                // Now load text block bodies from wiki-block-body-store, THEN
                // seed wiki status (v151) — seeding must run AFTER blocks + text
                // content are loaded because isWikiStub() inspects text content.
                const textBlockIds = updatedArticles
                  .flatMap((a) => a.blocks)
                  .filter((b) => b.type === "text" && !b.content)
                  .map((b) => b.id)

                const loadBodies =
                  textBlockIds.length > 0
                    ? import("@/lib/wiki-block-body-store").then(({ getBlockBodies }) =>
                        getBlockBodies(textBlockIds).then((bodies) => {
                          if (bodies.size === 0) return
                          usePlotStore.setState((s) => ({
                            wikiArticles: s.wikiArticles.map((a) => ({
                              ...a,
                              blocks: a.blocks.map((b) => {
                                const content = bodies.get(b.id)
                                return content !== undefined ? { ...b, content } : b
                              }),
                            })),
                          }))
                        })
                      )
                    : Promise.resolve()

                // v151: seed WikiStatus once blocks + content are fully loaded.
                // migrate() CANNOT do this — partialize strips wiki blocks from
                // the persisted snapshot, so isWikiStub() is only meaningful here
                // (post-rehydration). Idempotent backfill: only articles still
                // missing a status (new articles get one at creation).
                // stub→backlog, article→done. Persists automatically (`status`
                // is not stripped by partialize), so this is a one-time seed.
                loadBodies.then(() => {
                  usePlotStore.setState((s) => {
                    let seeded = 0
                    const seededArticles = s.wikiArticles.map((a) => {
                      if (a.status) return a
                      seeded++
                      const isStub = a.blocks.length === 0 ? true : isWikiStub(a)
                      const newStatus: WikiStatus = isStub ? "backlog" : "done"
                      return { ...a, status: newStatus }
                    })
                    if (seeded > 0) {
                      console.log(`[rehydrate] v151: seeded WikiStatus on ${seeded} articles (stub→backlog, article→done)`)
                    }
                    return seeded > 0 ? { wikiArticles: seededArticles } : {}
                  })
                })
              })
            })
          }
        }
      },
    }
  )
)

// Re-export types and selectors
export type { PlotState } from "./types"
export { getFilteredNotes, filterNotesByRoute, getFilterTitle, getViewTitle } from "./selectors"

// Dev-only: expose the store to window for PoC testing (Y.Doc split-view sync etc.)
// Does not ship to production; only enabled when NODE_ENV !== "production".
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  ;(window as unknown as { __plotStore?: typeof usePlotStore }).__plotStore = usePlotStore
}
