import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { NoteEvent, KnowledgeMap } from "../types"
import type { SRSState } from "@/lib/srs"
import { buildDefaultViewStates } from "../view-engine/defaults"
import { createIDBStorage } from "../idb-storage"
import { createAppendEvent } from "./helpers"
import { SEED_NOTES, SEED_FOLDERS, SEED_TAGS, SEED_CATEGORIES } from "./seeds"
import { createNotesSlice } from "./slices/notes"
import { createWorkflowSlice } from "./slices/workflow"
import { createFoldersSlice } from "./slices/folders"
import { createTagsSlice } from "./slices/tags"
import { createCategoriesSlice } from "./slices/categories"
import { createThinkingSlice } from "./slices/thinking"
import { createMapsSlice } from "./slices/maps"
import { createUISlice } from "./slices/ui"
import { createAlertsSlice } from "./slices/alerts"
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
        categories: SEED_CATEGORIES,

        activeView: { type: "all" } as const,
        selectedNoteId: null,
        searchQuery: "",
        searchOpen: false,
        shortcutOverlayOpen: false,
        detailsOpen: true,

        sidebarWidth: 240,
        sidebarLastWidth: 240,
        sidebarCollapsed: false,
        sidebarPeek: false,

        noteEvents: [] as NoteEvent[],
        thinkingChains: [],
        graphFocusDepth: 0,
        commandPaletteMode: "search" as const,
        knowledgeMaps: [] as KnowledgeMap[],
        srsStateByNoteId: {} as Record<string, SRSState>,

        viewStateByContext: buildDefaultViewStates(),
        _viewStateHydrated: false,

        // ── Slices ──
        ...createNotesSlice(set, get, appendEvent),
        ...createWorkflowSlice(set, get, appendEvent),
        ...createFoldersSlice(set),
        ...createTagsSlice(set),
        ...createCategoriesSlice(set),
        ...createThinkingSlice(set, get, appendEvent),
        ...createMapsSlice(set, appendEvent),
        ...createUISlice(set, appendEvent),
        ...createAlertsSlice(set),
      }
    },
    {
      name: "plot-store",
      version: 19,
      storage: createIDBStorage<PlotState>(),
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sidebarPeek, _viewStateHydrated, ...rest } = state
        return {
          ...rest,
          notes: state.notes.map((n) => ({ ...n, content: "", contentJson: null })),
        } as unknown as PlotState
      },
      migrate,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._viewStateHydrated = true
        }
      },
    }
  )
)

// Re-export types and selectors
export type { PlotState } from "./types"
export { getFilteredNotes, filterNotesByRoute, getFilterTitle, getViewTitle } from "./selectors"
