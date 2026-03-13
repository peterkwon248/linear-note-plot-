import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { NoteEvent, KnowledgeMap, SavedView, AutopilotLogEntry } from "../types"
import type { SRSState } from "@/lib/srs"
import { buildDefaultViewStates } from "../view-engine/defaults"
import { createIDBStorage } from "../idb-storage"
import { createAppendEvent } from "./helpers"
import { SEED_NOTES, SEED_FOLDERS, SEED_TAGS, SEED_LABELS, SEED_TEMPLATES } from "./seeds"
import { createNotesSlice } from "./slices/notes"
import { createWorkflowSlice } from "./slices/workflow"
import { createFoldersSlice } from "./slices/folders"
import { createTagsSlice } from "./slices/tags"
import { createLabelsSlice } from "./slices/labels"
import { createThreadSlice } from "./slices/thinking"
import { createMapsSlice } from "./slices/maps"
import { createUISlice } from "./slices/ui"
import { createViewsSlice } from "./slices/views"
import { createAutopilotSlice } from "./slices/autopilot"
import { createTemplatesSlice } from "./slices/templates"
import { createEditorSlice } from "./slices/editor"
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
        detailsOpen: true,

        sidebarWidth: 260,
        sidebarLastWidth: 260,
        sidebarCollapsed: false,
        sidebarPeek: false,
        mergePickerOpen: false,
        mergePickerSourceId: null,
        linkPickerOpen: false,
        linkPickerSourceId: null,

        noteEvents: [] as NoteEvent[],
        threads: [],
        graphFocusDepth: 0,
        commandPaletteMode: "search" as const,
        knowledgeMaps: [] as KnowledgeMap[],
        savedViews: [] as SavedView[],
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
        ...createMapsSlice(set, appendEvent),
        ...createUISlice(set, get, appendEvent),
        ...createViewsSlice(set),
        ...createAutopilotSlice(set, get, appendEvent),
        ...createTemplatesSlice(set, get, appendEvent),
        ...createEditorSlice(set, get),
      }
    },
    {
      name: "plot-store",
      version: 31,
      storage: createIDBStorage<PlotState>(),
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sidebarPeek, _viewStateHydrated, mergePickerOpen, mergePickerSourceId, linkPickerOpen, linkPickerSourceId, ...rest } = state
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
