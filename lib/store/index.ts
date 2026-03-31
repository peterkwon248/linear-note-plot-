import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { NoteEvent, AutopilotLogEntry, Relation, Reflection } from "../types"
import type { Attachment, CoOccurrence, RelationSuggestion } from "../types"
import type { SRSState } from "@/lib/srs"
import { buildDefaultViewStates } from "../view-engine/defaults"
import { createIDBStorage } from "../idb-storage"
import { createAppendEvent } from "./helpers"
import { SEED_NOTES, SEED_FOLDERS, SEED_TAGS, SEED_LABELS, SEED_TEMPLATES, SEED_WIKI_ARTICLES, SEED_WIKI_CATEGORIES } from "./seeds"
import { persistBody, persistBlockBody } from "./helpers"
import { createNotesSlice } from "./slices/notes"
import { createWorkflowSlice } from "./slices/workflow"
import { createFoldersSlice } from "./slices/folders"
import { createTagsSlice } from "./slices/tags"
import { createLabelsSlice } from "./slices/labels"
import { createThreadSlice } from "./slices/thinking"
import { createMapsSlice } from "./slices/maps"
import { createUISlice } from "./slices/ui"
import { createAutopilotSlice } from "./slices/autopilot"
import { createTemplatesSlice } from "./slices/templates"
import { createRelationsSlice } from "./slices/relations"
import { createEditorSlice } from "./slices/editor"
import { createWorkspaceSlice } from "./slices/workspace"
import { createAttachmentsSlice } from "./slices/attachments"
import { createOntologySlice } from "./slices/ontology"
import { createReflectionsSlice } from "./slices/reflections"
import { createWikiCollectionsSlice } from "./slices/wiki-collections"
import { createSavedViewsSlice } from "./slices/saved-views"
import { createWikiArticlesSlice } from "./slices/wiki-articles"
import { createWikiCategoriesSlice } from "./slices/wiki-categories"
import { DEFAULT_AUTOPILOT_RULES } from "../autopilot/defaults"
import { migrate } from "./migrate"
import type { PlotState } from "./types"

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

        activeView: { type: "all" } as const,
        selectedNoteId: null,
        searchQuery: "",
        searchOpen: false,
        shortcutOverlayOpen: false,
        sidePanelOpen: true,
        sidePanelMode: 'detail' as import("./types").SidePanelMode,
        sidePanelPeekNoteId: null,
        previewNoteId: null,

        sidebarWidth: 220,
        sidebarLastWidth: 220,
        sidebarCollapsed: false,
        sidebarPeek: false,
        mergePickerOpen: false,
        mergePickerSourceId: null,
        linkPickerOpen: false,
        linkPickerSourceId: null,
        pendingWikiAssemblyIds: null,

        noteEvents: [] as NoteEvent[],
        threads: [],
        graphFocusDepth: 0,
        commandPaletteMode: "commands" as const,
        reflections: [] as Reflection[],
        relations: [] as Relation[],
        attachments: [] as Attachment[],
        coOccurrences: [] as CoOccurrence[],
        relationSuggestions: [] as RelationSuggestion[],
        clusterSuggestions: [] as import("../types").WikiClusterSuggestion[],
        ontologyPositions: {} as Record<string, { x: number; y: number }>,
        wikiCollections: {} as Record<string, import("../types").WikiCollectionItem[]>,
        savedViews: [] as import("../types").SavedView[],
        wikiCategories: SEED_WIKI_CATEGORIES,
        wikiArticles: SEED_WIKI_ARTICLES,
        listPaneWidth: 320,
        srsStateByNoteId: {} as Record<string, SRSState>,
        autopilotEnabled: true,
        autopilotRules: DEFAULT_AUTOPILOT_RULES,
        autopilotLog: [] as AutopilotLogEntry[],
        templates: SEED_TEMPLATES,

        viewStateByContext: buildDefaultViewStates(),
        _viewStateHydrated: false,
        navigationHistory: [] as string[],
        navigationIndex: -1,

        // ── Slices ──
        ...createNotesSlice(set, get, appendEvent),
        ...createWorkflowSlice(set, get, appendEvent),
        ...createFoldersSlice(set),
        ...createTagsSlice(set),
        ...createLabelsSlice(set),
        ...createThreadSlice(set, get, appendEvent),
        ...createMapsSlice(set),
        ...createRelationsSlice(set, get, appendEvent),
        ...createUISlice(set, get, appendEvent),
        ...createAutopilotSlice(set, get, appendEvent),
        ...createTemplatesSlice(set, get, appendEvent),
        ...createEditorSlice(set, get),
        ...createWorkspaceSlice(set, get),
        ...createAttachmentsSlice(set, get, appendEvent),
        ...createOntologySlice(set, get, appendEvent),
        ...createReflectionsSlice(set, get, appendEvent),
        ...createWikiCollectionsSlice(set, get),
        ...createSavedViewsSlice(set),
        ...createWikiCategoriesSlice(set, get),
        ...createWikiArticlesSlice(set, get),
      }
    },
    {
      name: "plot-store",
      version: 67,
      storage: createIDBStorage<PlotState>(),
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sidebarPeek, _viewStateHydrated, mergePickerOpen, mergePickerSourceId, linkPickerOpen, linkPickerSourceId, sidePanelPeekNoteId, previewNoteId, sidePanelOpen, ...rest } = state
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

          // Persist seed note bodies to IDB (content is stripped during partialize)
          // Only runs if seed notes exist and have empty content (just rehydrated)
          for (const note of state.notes) {
            const seed = SEED_NOTES.find((s) => s.id === note.id)
            if (seed && seed.content && !note.content) {
              note.content = seed.content
              persistBody({ id: seed.id, content: seed.content, contentJson: null })
            }
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

                // Now load text block bodies from wiki-block-body-store
                const textBlockIds = updatedArticles
                  .flatMap((a) => a.blocks)
                  .filter((b) => b.type === "text" && !b.content)
                  .map((b) => b.id)

                if (textBlockIds.length > 0) {
                  import("@/lib/wiki-block-body-store").then(({ getBlockBodies }) => {
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
                  })
                }
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
