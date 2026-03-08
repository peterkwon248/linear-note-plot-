import type { NoteBody } from "../types"
import { extractPreview, extractLinksOut } from "../body-helpers"
import { buildDefaultViewStates, normalizeViewStatesMap } from "../view-engine/defaults"
import type { PlotState } from "./types"

export function migrate(persistedState: unknown): PlotState {
  const state = persistedState as Record<string, unknown>

  if (state.notes && Array.isArray(state.notes)) {
    state.notes = (state.notes as Record<string, unknown>[]).map((n) => {
      // v11: Separate project from status
      if (n.status === "project") {
        n.status = "capture"
        n.project = "Migrated"
      } else {
        n.project = n.project ?? null
      }

      // v12: Merge stage into status, remove stage & isInbox
      const oldStage = n.stage ?? (n.isInbox ? "inbox" : (n.status === "permanent" ? "permanent" : "capture"));
      const mergedStatus = oldStage === "inbox" ? "inbox"
        : oldStage === "permanent" ? "permanent"
        : (n.status ?? "capture");

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { stage: _stage, isInbox: _isInbox, ...rest } = n;

      // v13: Precompute preview and linksOut from content
      const content = typeof rest.content === "string" ? rest.content as string : ""

      return {
        ...rest,
        status: mergedStatus,
        priority: n.priority ?? "none",
        reads: n.reads ?? 0,
        triageStatus: n.triageStatus ?? (n.isInbox ? "untriaged" : "kept"),
        reviewAt: n.reviewAt ?? null,
        inboxRank: n.inboxRank ?? 0,
        summary: n.summary ?? null,
        source: n.source ?? "manual",
        promotedAt: n.promotedAt ?? null,
        lastTouchedAt: n.lastTouchedAt ?? n.updatedAt ?? new Date().toISOString(),
        snoozeCount: n.snoozeCount ?? 0,
        archivedAt: n.archivedAt ?? null,
        parentNoteId: n.parentNoteId ?? null,
        contentJson: n.contentJson ?? null,
        projectLevel: n.projectLevel ?? null,
        // v13: Precomputed fields
        preview: n.preview ?? extractPreview(content),
        linksOut: n.linksOut ?? extractLinksOut(content),
      }
    })
  }

  // v14: Extract bodies for IDB migration (handled async by BodyProvider)
  if (typeof window !== "undefined" && state.notes && Array.isArray(state.notes)) {
    const noteArr = state.notes as Array<Record<string, unknown>>
    const hasContent = noteArr.some(
      (n) => typeof n.content === "string" && (n.content as string).length > 0
    )
    if (hasContent) {
      const bodies: NoteBody[] = noteArr
        .filter((n) => typeof n.content === "string" && (n.content as string).length > 0)
        .map((n) => ({
          id: n.id as string,
          content: n.content as string,
          contentJson: (n.contentJson as Record<string, unknown>) ?? null,
        }))
      ;(window as any).__plotMigrationBodies = bodies
    }
  }

  // v6: Phase 2 defaults
  if (!state.noteEvents) state.noteEvents = []
  if (!state.thinkingChains) state.thinkingChains = []
  if (state.graphFocusDepth === undefined) state.graphFocusDepth = 0
  if (state.commandPaletteMode === undefined) state.commandPaletteMode = "search"
  // v7: Knowledge Maps
  if (!state.knowledgeMaps) state.knowledgeMaps = []
  // v9: Details panel toggle
  if (state.detailsOpen === undefined) state.detailsOpen = true
  // v10: Sidebar resize / collapse
  if (state.sidebarWidth === undefined) state.sidebarWidth = 260
  if (state.sidebarLastWidth === undefined) state.sidebarLastWidth = 260
  if (state.sidebarCollapsed === undefined) state.sidebarCollapsed = false
  state.sidebarPeek = false // always reset transient state
  // v16: ViewState per context
  if (state.viewStateByContext) {
    state.viewStateByContext = normalizeViewStatesMap(
      state.viewStateByContext as Record<string, unknown>
    )
  } else {
    state.viewStateByContext = buildDefaultViewStates()
  }
  // v17: SRS state map
  if (!state.srsStateByNoteId) state.srsStateByNoteId = {}
  // v18: Ensure createdAt column is visible
  if (state.viewStateByContext && typeof state.viewStateByContext === "object") {
    const vsMap = state.viewStateByContext as Record<string, Record<string, unknown>>
    for (const key of Object.keys(vsMap)) {
      const vs = vsMap[key]
      if (Array.isArray(vs.visibleColumns) && !vs.visibleColumns.includes("createdAt")) {
        const updIdx = vs.visibleColumns.indexOf("updatedAt")
        if (updIdx !== -1) {
          vs.visibleColumns.splice(updIdx + 1, 0, "createdAt")
        } else {
          vs.visibleColumns.push("createdAt")
        }
      }
    }
  }
  // v19: Alerts — dismissed alert IDs
  if (!state.dismissedAlertIds) state.dismissedAlertIds = []
  // v20: Project as independent entity — migrate note.project to projects array
  if (!state.projects) state.projects = []
  if (state.notes && Array.isArray(state.notes)) {
    const noteArr = state.notes as Array<Record<string, unknown>>
    const projectNames = new Set<string>()
    for (const n of noteArr) {
      if (typeof n.project === "string" && n.project !== "") {
        projectNames.add(n.project)
      }
    }
    // Create Project entities from unique project names
    const projectMap = new Map<string, string>() // name -> id
    const projects = state.projects as Array<Record<string, unknown>>
    for (const name of projectNames) {
      const id = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      projectMap.set(name, id)
      projects.push({
        id,
        name,
        status: "planning",
        focus: null,
        description: "",
        targetDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    // Migrate notes: project string -> projectId
    for (const n of noteArr) {
      if (typeof n.project === "string" && n.project !== "") {
        n.projectId = projectMap.get(n.project) ?? null
      } else {
        n.projectId = n.projectId ?? null
      }
      delete n.project
      delete n.projectLevel
    }
  }
  // v21: Rename project.health → project.focus (now/soon/later)
  if (state.projects && Array.isArray(state.projects)) {
    for (const p of state.projects as Array<Record<string, unknown>>) {
      if ("health" in p) {
        p.focus = null // reset old health values — they don't map to new semantics
        delete p.health
      }
      if (!("focus" in p)) {
        p.focus = null
      }
    }
  }
  // v22: Navigation history
  if (!state.navigationHistory) {
    state.navigationHistory = []
    state.navigationIndex = -1
  }
  state._viewStateHydrated = false // always reset transient flag

  return state as unknown as PlotState
}
