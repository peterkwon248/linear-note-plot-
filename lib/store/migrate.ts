import type { NoteBody } from "../types"
import { nanoid } from "nanoid"
import { extractPreview, extractLinksOut } from "../body-helpers"
import { buildDefaultViewStates, normalizeViewStatesMap } from "../view-engine/defaults"
import { buildPreset, layoutModeToPreset } from "../workspace/presets"
import { createLeaf, createBranch, updateLeafTabs, findFirstEditorLeaf } from "../workspace/tree-utils"
import type { WorkspaceNode, WorkspaceTab } from "../workspace/types"
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
        isWiki: n.isWiki ?? false,
        contentJson: n.contentJson ?? null,
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
  // v31: Rename thinkingChains → threads
  if (!state.threads) state.threads = (state.thinkingChains as unknown[]) ?? []
  delete state.thinkingChains
  if (state.graphFocusDepth === undefined) state.graphFocusDepth = 0
  if (state.commandPaletteMode === undefined) state.commandPaletteMode = "search"
  // v7: Knowledge Maps
  if (!state.knowledgeMaps) state.knowledgeMaps = []
  // v9: Details panel toggle
  if (state.detailsOpen === undefined) state.detailsOpen = true
  // v10: Sidebar resize / collapse
  if (state.sidebarWidth === undefined) state.sidebarWidth = 220
  if (state.sidebarLastWidth === undefined) state.sidebarLastWidth = 220
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
  // v23: Saved Views
  if (!state.savedViews) state.savedViews = []
  state._viewStateHydrated = false // always reset transient flag

  // v24: Sidebar Surgery — Projects → Folders, Categories → Tags
  // 1. Expand existing folders with new fields
  if (state.folders && Array.isArray(state.folders)) {
    state.folders = (state.folders as Array<Record<string, unknown>>).map(f => ({
      ...f,
      parentId: f.parentId ?? null,
      lastAccessedAt: f.lastAccessedAt ?? null,
      pinned: f.pinned ?? false,
      pinnedOrder: f.pinnedOrder ?? 0,
      createdAt: f.createdAt ?? new Date().toISOString(),
    }))
  }

  // 2. Convert Projects → Folders
  if (state.projects && Array.isArray(state.projects) && (state.projects as unknown[]).length > 0) {
    const projects = state.projects as Array<Record<string, unknown>>
    const folders = (state.folders ?? []) as Array<Record<string, unknown>>
    const existingFolderNames = new Set(folders.map(f => (f.name as string).toLowerCase()))

    for (const proj of projects) {
      const projName = proj.name as string
      // Skip if a folder with the same name already exists
      if (existingFolderNames.has(projName.toLowerCase())) {
        // Map notes from this project to the existing folder
        const existingFolder = folders.find(f => (f.name as string).toLowerCase() === projName.toLowerCase())
        if (existingFolder && state.notes && Array.isArray(state.notes)) {
          for (const n of state.notes as Array<Record<string, unknown>>) {
            if (n.projectId === proj.id && !n.folderId) {
              n.folderId = existingFolder.id
            }
          }
        }
      } else {
        // Create new folder from project
        const folderId = `folder-from-proj-${proj.id}`
        folders.push({
          id: folderId,
          name: projName,
          color: "#5e6ad2",
          parentId: null,
          lastAccessedAt: proj.updatedAt ?? null,
          pinned: false,
          pinnedOrder: 0,
          createdAt: (proj.createdAt as string) ?? new Date().toISOString(),
        })
        existingFolderNames.add(projName.toLowerCase())

        // Map notes from this project to new folder
        if (state.notes && Array.isArray(state.notes)) {
          for (const n of state.notes as Array<Record<string, unknown>>) {
            if (n.projectId === proj.id && !n.folderId) {
              n.folderId = folderId
            }
          }
        }
      }
    }
    state.folders = folders
    state.projects = [] // Clear projects
  }

  // 3. Convert Categories → Tags
  if (state.categories && Array.isArray(state.categories) && (state.categories as unknown[]).length > 0) {
    const categories = state.categories as Array<Record<string, unknown>>
    const tags = (state.tags ?? []) as Array<Record<string, unknown>>
    const existingTagNames = new Set(tags.map(t => (t.name as string).toLowerCase()))
    const categoryToTagId = new Map<string, string>()

    for (const cat of categories) {
      const catName = (cat.name as string).toLowerCase()
      const existingTag = tags.find(t => (t.name as string).toLowerCase() === catName)
      if (existingTag) {
        categoryToTagId.set(cat.id as string, existingTag.id as string)
      } else {
        const tagId = `tag-from-cat-${cat.id}`
        categoryToTagId.set(cat.id as string, tagId)
        tags.push({
          id: tagId,
          name: cat.name,
          color: cat.color,
        })
      }
    }
    state.tags = tags

    // Migrate note.category → note.tags
    if (state.notes && Array.isArray(state.notes)) {
      for (const n of state.notes as Array<Record<string, unknown>>) {
        if (n.category && typeof n.category === "string" && n.category !== "") {
          const mappedTagId = categoryToTagId.get(n.category)
          if (mappedTagId) {
            const noteTags = (n.tags ?? []) as string[]
            if (!noteTags.includes(mappedTagId)) {
              n.tags = [...noteTags, mappedTagId]
            }
          }
        }
      }
    }
    state.categories = [] // Clear categories
  }

  // 4. Clean up note fields: remove category and projectId
  if (state.notes && Array.isArray(state.notes)) {
    for (const n of state.notes as Array<Record<string, unknown>>) {
      delete n.category
      delete n.projectId
    }
  }

  // 5. Normalize persisted ViewState: "project" → "folder"
  if (state.viewStateByContext && typeof state.viewStateByContext === "object") {
    const vsMap = state.viewStateByContext as Record<string, Record<string, unknown>>
    for (const key of Object.keys(vsMap)) {
      const vs = vsMap[key]
      if (vs.sortField === "project") vs.sortField = "folder"
      if (vs.groupBy === "project") vs.groupBy = "folder"
      if (Array.isArray(vs.visibleColumns)) {
        vs.visibleColumns = (vs.visibleColumns as string[]).map(c => c === "project" ? "folder" : c)
      }
      if (Array.isArray(vs.filters)) {
        vs.filters = (vs.filters as Array<Record<string, unknown>>).map(f =>
          f.field === "project" ? { ...f, field: "folder" } : f
        )
      }
    }
    // Remove deprecated context keys
    delete (vsMap as Record<string, unknown>)["category"]
    delete (vsMap as Record<string, unknown>)["projects"]
  }

  // v25: Remove dismissedAlertIds from persisted state
  if ("dismissedAlertIds" in state) {
    delete state.dismissedAlertIds
    console.log("[migrate] v24→v25: removed dismissedAlertIds")
  }

  // v26: Remove "reference" status — merge into "permanent"
  if (state.notes && Array.isArray(state.notes)) {
    let migrated = 0
    for (const n of state.notes as Array<Record<string, unknown>>) {
      if (n.status === "reference") {
        n.status = "permanent"
        migrated++
      }
    }
    if (migrated > 0) {
      console.log(`[migrate] v25→v26: migrated ${migrated} reference→permanent notes`)
    }
  }
  // Remove "reference" view context
  if (state.viewStateByContext && typeof state.viewStateByContext === "object") {
    delete (state.viewStateByContext as Record<string, unknown>)["reference"]
  }

  // v27: Labels — add labelId to notes and labels array to state
  if (!state.labels) state.labels = []
  if (state.notes && Array.isArray(state.notes)) {
    for (const n of state.notes as Array<Record<string, unknown>>) {
      if (n.labelId === undefined) n.labelId = null
    }
  }

  // v28: Autopilot rules
  if (!state.autopilotRules) state.autopilotRules = []
  if (state.autopilotEnabled === undefined) state.autopilotEnabled = true
  if (!state.autopilotLog) state.autopilotLog = []

  // v29: Templates
  if (!state.templates) state.templates = []

  // v30: Editor tabs/panels
  if (!state.editorState) {
    state.editorState = {
      panels: [{ id: "panel-left", tabs: [], activeTabId: null }],
      activePanelId: "panel-left",
      splitMode: false,
      splitRatio: 0.5,
    }
  }

  // v31: Rename thinkingChains → threads (handled above in v6 block)

  // v33: Relations
  if (!state.relations) state.relations = []

  // v34: Layout 5 Modes
  if (!state.layoutMode) state.layoutMode = "tabs"
  if (!state.listPaneWidth) state.listPaneWidth = 320
  state._preFocusLayoutMode = null // transient, always reset
  // Add panelRatios to editorState
  if (state.editorState && typeof state.editorState === "object") {
    const es = state.editorState as Record<string, unknown>
    if (!es.panelRatios) es.panelRatios = [0.5, 0.5]
  }

  // v35: Workspace — convert EditorState + LayoutMode → workspace tree
  if (!state.workspaceRoot) {
    const layoutMode = (state.layoutMode as string) ?? "tabs"
    const preset = layoutModeToPreset(layoutMode)
    let root: WorkspaceNode = buildPreset(preset)

    // Transfer existing editor tabs into the workspace tree
    if (state.editorState && typeof state.editorState === "object") {
      const es = state.editorState as Record<string, unknown>
      const panels = (es.panels ?? []) as Array<Record<string, unknown>>
      if (panels.length > 0) {
        const firstPanel = panels[0]
        const tabs = (firstPanel.tabs ?? []) as WorkspaceTab[]
        const activeTabId = (firstPanel.activeTabId as string) ?? null
        if (tabs.length > 0) {
          const editorLeaf = findFirstEditorLeaf(root)
          if (editorLeaf) {
            root = updateLeafTabs(root, editorLeaf.id, tabs, activeTabId)
          }
        }
      }
    }

    state.workspaceRoot = root
    state.activeLeafId = findFirstEditorLeaf(root as WorkspaceNode)?.id ?? null
    // Keep original layoutMode — workspace tree is used within editor area, not as a layout mode
  }

  // v35b: Ensure activeLeafId is set when workspaceRoot exists
  if (state.workspaceRoot && !state.activeLeafId) {
    const leaf = findFirstEditorLeaf(state.workspaceRoot as WorkspaceNode)
    if (leaf) state.activeLeafId = leaf.id
  }

  // v35c: "workspace" is no longer a valid layoutMode — revert to "tabs"
  if (state.layoutMode === "workspace") {
    state.layoutMode = "tabs"
  }

  return state as unknown as PlotState
}
