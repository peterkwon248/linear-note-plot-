import type { NoteBody } from "../types"
import { nanoid } from "nanoid"
import { extractPreview, extractLinksOut } from "../body-helpers"
import { buildDefaultViewStates, normalizeViewStatesMap } from "../view-engine/defaults"
import type { WorkspaceTab } from "../workspace/types"
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

      // v41: wikiStatus + stubSource (legacy — v67 will delete these fields)
      const isWiki = n.isWiki ?? false

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
        noteType: isWiki ? "wiki" : "note",
        aliases: (n as any).aliases ?? [],
        wikiInfobox: (n as any).wikiInfobox ?? [],
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
  if (state.commandPaletteMode === undefined || state.commandPaletteMode === "search") state.commandPaletteMode = "commands"
  // v9: Details panel toggle
  if (state.detailsOpen === undefined) state.detailsOpen = true
  // v10: Sidebar resize / collapse
  if (state.sidebarWidth === undefined) state.sidebarWidth = 220
  if (state.sidebarLastWidth === undefined) state.sidebarLastWidth = 220
  if (state.sidebarCollapsed === undefined) state.sidebarCollapsed = false
  delete state.sidebarPeek // removed in Split-First migration
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

  // v38: Template contentJson
  if (state.templates && Array.isArray(state.templates)) {
    state.templates = (state.templates as Record<string, unknown>[]).map((t) => ({
      ...t,
      contentJson: t.contentJson ?? null,
    }))
  }

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
  state._preZenWorkspaceMode = null // transient, always reset
  // Add panelRatios to editorState
  if (state.editorState && typeof state.editorState === "object") {
    const es = state.editorState as Record<string, unknown>
    if (!es.panelRatios) es.panelRatios = [0.5, 0.5]
  }

  // v36: Ontology Engine data layer
  if (!(state as any).attachments) (state as any).attachments = []
  if (!(state as any).coOccurrences) (state as any).coOccurrences = []
  if (!(state as any).relationSuggestions) (state as any).relationSuggestions = []

  // v37: Ontology graph position persistence
  if (!state.ontologyPositions) state.ontologyPositions = {}

  // v39: Reflections (time-axis review, append-only)
  if (!(state as any).reflections) (state as any).reflections = []

  // v40: Research sub-preset
  if (!state.researchPreset) state.researchPreset = "left-right2"

  // v41: wikiStatus + stubSource (handled in note-level migration above)

  // v42: workspaceMode (coexists with layoutMode until Phase 2 removes it)
  if (!state.workspaceMode) {
    const old = state.layoutMode as string | undefined
    state.workspaceMode = old === "focus" ? "zen" : old === "split" ? "research" : "default"
  }

  // v43: wikiCollections (wiki article staging area)
  if (!state.wikiCollections) state.wikiCollections = {}

  // v44: Remove deprecated LayoutMode + Research mode + WorkspaceMode (zen)
  // Remove deprecated fields
  delete state.researchPreset
  delete state._preFocusLayoutMode
  delete state.layoutMode
  delete state.workspaceMode
  delete state._preZenWorkspaceMode

  // v45: savedViews (custom views system)
  if (!state.savedViews) state.savedViews = []

  // v46: Replace old English seed data with tutorial + Zettelkasten seeds
  {
    const notes = state.notes as any[]
    const oldSeedNote = notes?.find((n: any) => n.id === "note-1")
    if (oldSeedNote && oldSeedNote.title === "Welcome to Plot" && !notes.some((n: any) => n.id === "note-wiki-1")) {
      const { SEED_NOTES, SEED_TAGS } = require("./seeds")
      const oldSeedIds = new Set(["note-1", "note-2", "note-3", "note-4", "note-5", "note-6"])
      state.notes = [
        ...notes.filter((n: any) => !oldSeedIds.has(n.id)),
        ...SEED_NOTES,
      ] as any
      state.tags = SEED_TAGS as any
    }
  }

  // v47: wikiArticles (Assembly Model — wiki as separate entity from notes)
  if (!state.wikiArticles) {
    state.wikiArticles = [] as any
  }
  // v48: Inject seed WikiArticles if none of the seed IDs exist
  {
    const articles = state.wikiArticles as any[]
    if (!articles.some((a: any) => a.id === "wiki-article-1")) {
      const { SEED_WIKI_ARTICLES } = require("./seeds")
      state.wikiArticles = [...articles, ...SEED_WIKI_ARTICLES] as any
    }
  }

  // v49+v50: Remove ALL isWiki flags — WikiArticle is now the only wiki entity
  {
    const notes = state.notes as any[]
    if (notes.some((n: any) => n.isWiki)) {
      state.notes = notes.map((n: any) =>
        n.isWiki ? { ...n, isWiki: false, wikiStatus: null, stubSource: null } : n
      ) as any
    }
  }

  // v51: Unified Side Panel — detailsOpen → sidePanelOpen, sidePeekNoteId → sidePanelPeekContext
  if (state.detailsOpen !== undefined) {
    state.sidePanelOpen = state.detailsOpen
    delete state.detailsOpen
  }
  if (state.sidePanelOpen === undefined) state.sidePanelOpen = true
  if (!state.sidePanelMode) state.sidePanelMode = 'detail'
  // sidePanelPeekContext is transient (not persisted), no migration needed
  delete state.sidePeekNoteId // clean up old transient field if present
  delete state.sidePanelPeekNoteId // v72: renamed to sidePanelPeekContext (also transient, just in case)

  // v52: Simplify workspace — binary tree → dual pane
  if (state.workspaceRoot) {
    // Extract tabs from the old tree's active editor leaf
    const extractTabsFromTree = (node: any): WorkspaceTab[] => {
      if (!node) return []
      if (node.kind === 'leaf' && node.content?.type === 'editor' && node.tabs?.length > 0) {
        return node.tabs
      }
      if (node.kind === 'branch' && node.children) {
        for (const child of node.children) {
          const tabs = extractTabsFromTree(child)
          if (tabs.length > 0) return tabs
        }
      }
      return []
    }
    state.editorTabs = extractTabsFromTree(state.workspaceRoot)
    state.activeTabId = (state.editorTabs as WorkspaceTab[]).length > 0 ? (state.editorTabs as WorkspaceTab[])[0].id : null
    delete state.workspaceRoot
    delete state.activeLeafId
  }
  if (!state.editorTabs) state.editorTabs = []
  if (!state.activeTabId) state.activeTabId = null
  if (!state.secondaryNoteId) state.secondaryNoteId = null
  if (!state.activePane) state.activePane = 'primary'

  // v53: WikiArticle sectionIndex — build from existing blocks, persist blocks to IDB
  if (state.wikiArticles && Array.isArray(state.wikiArticles)) {
    for (const a of state.wikiArticles as any[]) {
      if (!a.sectionIndex) {
        // Build section index from blocks
        const sectionIndex: any[] = []
        let current: any = null
        let count = 0
        for (const b of (a.blocks ?? [])) {
          if (b.type === "section") {
            if (current) { current.blockCount = count; sectionIndex.push(current) }
            current = { id: b.id, title: b.title ?? "", level: b.level ?? 2, blockCount: 0, collapsed: b.collapsed }
            count = 1
          } else { count++ }
        }
        if (current) { current.blockCount = count; sectionIndex.push(current) }
        a.sectionIndex = sectionIndex
      }
      // Persist blocks to IDB on first migration (blocks will be stripped from persist after this)
      if (typeof window !== "undefined" && a.blocks?.length > 0) {
        import("@/lib/wiki-block-meta-store").then(({ saveArticleBlocks }) => {
          saveArticleBlocks(a.id, a.blocks).catch(() => {})
        })
        // Also persist text block bodies
        for (const b of a.blocks) {
          if (b.type === "text" && b.content) {
            import("@/lib/wiki-block-body-store").then(({ saveBlockBody }) => {
              saveBlockBody({ id: b.id, content: b.content }).catch(() => {})
            })
          }
        }
      }
    }
  }

  // v54: cluster suggestions
  if (!state.clusterSuggestions) {
    state.clusterSuggestions = []
  }

  // v55: ThreadStep.parentId — nested replies support
  if (state.threads && Array.isArray(state.threads)) {
    for (const t of state.threads as any[]) {
      if (t.steps && Array.isArray(t.steps)) {
        for (const step of t.steps as any[]) {
          if (step.parentId === undefined) {
            step.parentId = null
          }
        }
      }
    }
  }

  // v56: ViewState.groupOrder — custom group ordering
  if (state.viewStateByContext && typeof state.viewStateByContext === "object") {
    const vsMap = state.viewStateByContext as Record<string, Record<string, unknown>>
    for (const key of Object.keys(vsMap)) {
      if (vsMap[key].groupOrder === undefined) {
        vsMap[key].groupOrder = null
      }
    }
  }

  // v57: ViewState.subGroupOrder — custom sub-group ordering
  if (state.viewStateByContext && typeof state.viewStateByContext === "object") {
    const vsMap = state.viewStateByContext as Record<string, Record<string, unknown>>
    for (const key of Object.keys(vsMap)) {
      if (vsMap[key].subGroupOrder === undefined) {
        vsMap[key].subGroupOrder = null
      }
    }
  }

  // v58: ViewState.subGroupSortBy — sub-group sort criterion
  if (state.viewStateByContext && typeof state.viewStateByContext === "object") {
    const vsMap = state.viewStateByContext as Record<string, Record<string, unknown>>
    for (const key of Object.keys(vsMap)) {
      if (vsMap[key].subGroupSortBy === undefined) {
        vsMap[key].subGroupSortBy = "default"
      }
    }
  }

  // v59: Reset isWiki flag + trash empty wiki stubs — wiki rendering moved to WikiArticle system
  if (Array.isArray(state.notes)) {
    for (const note of state.notes as Record<string, unknown>[]) {
      if (note.isWiki) note.isWiki = false
      // Trash auto-generated wiki stubs with only template headings and no real content
      if (note.wikiStatus && !note.trashed) {
        const preview = (note.preview as string) ?? ""
        const isEmptyStub = !preview.trim() || /^(#{1,3}\s*(Overview|Details|See Also)\s*)+$/i.test(preview.trim())
        if (isEmptyStub) {
          note.trashed = true
          note.trashedAt = new Date().toISOString()
        }
      }
      // Clear wikiStatus on all notes — wiki is now WikiArticle only
      if (note.wikiStatus) note.wikiStatus = null
    }
  }

  // v60: WikiStatus simplification — draft→stub, complete→article
  if (Array.isArray(state.wikiArticles)) {
    for (const article of state.wikiArticles as Record<string, unknown>[]) {
      if (article.wikiStatus === "draft") article.wikiStatus = "stub"
      if (article.wikiStatus === "complete") article.wikiStatus = "article"
    }
  }

  // v61: WikiCategories (DAG) — convert existing article tags to WikiCategory entities
  if (!state.wikiCategories) {
    const articles = (state.wikiArticles ?? []) as any[]
    const tagMap = new Map<string, string>() // tagId -> categoryId
    const categories: any[] = []

    // Collect unique tags across all wiki articles
    for (const a of articles) {
      if (!a.tags || !Array.isArray(a.tags)) continue
      for (const tagId of a.tags) {
        if (!tagMap.has(tagId)) {
          const catId = `wcat-${nanoid(10)}`
          tagMap.set(tagId, catId)
          // Find tag name from state.tags
          const allTags = (state.tags ?? []) as Array<{ id: string; name: string }>
          const tag = allTags.find((t) => t.id === tagId)
          categories.push({
            id: catId,
            name: tag?.name ?? tagId,
            parentIds: [],
            createdAt: new Date().toISOString(),
          })
        }
      }
    }

    // Set article categoryIds based on their tags
    for (const a of articles) {
      if (!a.tags || !Array.isArray(a.tags)) continue
      a.categoryIds = a.tags
        .map((tagId: string) => tagMap.get(tagId))
        .filter(Boolean)
    }

    state.wikiCategories = categories
    if (categories.length > 0) {
      console.log(`[migrate] v60→v61: created ${categories.length} WikiCategories from article tags`)
    }
  }

  // v61b: Inject seed WikiCategories if none of the seed IDs exist
  {
    const cats = (state.wikiCategories ?? []) as any[]
    if (!cats.some((c: any) => c.id === "wcat-seed-1")) {
      try {
        const { SEED_WIKI_CATEGORIES } = require("./seeds")
        state.wikiCategories = [...cats, ...SEED_WIKI_CATEGORIES] as any
        // Also assign seed articles their categoryIds if not already set
        const articles = (state.wikiArticles ?? []) as any[]
        for (const a of articles) {
          if (a.id === "wiki-article-1" && (!a.categoryIds || a.categoryIds.length === 0)) {
            a.categoryIds = ["wcat-seed-1", "wcat-seed-2"]
          }
          if (a.id === "wiki-article-2" && (!a.categoryIds || a.categoryIds.length === 0)) {
            a.categoryIds = ["wcat-seed-1"]
          }
          if (a.id === "wiki-article-3" && (!a.categoryIds || a.categoryIds.length === 0)) {
            a.categoryIds = ["wcat-seed-1"]
          }
        }
      } catch {
        // seeds not available
      }
    }
  }

  // v61c: Add layout field to wiki articles
  if (Array.isArray(state.wikiArticles)) {
    state.wikiArticles = (state.wikiArticles as any[]).map((a: any) => ({
      ...a,
      layout: a.layout ?? "default",
    }))
  }

  // v62: Rename sidePanelMode 'context' → 'detail', add 'discover' mode
  if (state.sidePanelMode === 'context') {
    state.sidePanelMode = 'detail'
  }

  // v62: Add updatedAt to WikiCategory
  if (Array.isArray(state.wikiCategories)) {
    state.wikiCategories = (state.wikiCategories as any[]).map((c: any) => ({
      ...c,
      updatedAt: c.updatedAt ?? c.createdAt ?? new Date().toISOString(),
    }))
  }

  // v64: Rename sidePanelMode 'discover' → 'connections'
  if (state.sidePanelMode === 'discover') {
    state.sidePanelMode = 'connections'
  }

  // v65: Title node removal — no Zustand state changes needed
  // (IDB body migration handled in onRehydrateStorage)

  // v66: Replace isWiki boolean with noteType discriminator
  if (Array.isArray(state.notes)) {
    for (const note of state.notes as Record<string, unknown>[]) {
      if (!note.noteType) {
        note.noteType = note.isWiki ? "wiki" : "note"
      }
      delete note.isWiki
    }
  }

  // v66: Rewrite persisted isWiki filter rules to noteType
  if (state.viewStateByContext && typeof state.viewStateByContext === "object") {
    const vsMap = state.viewStateByContext as Record<string, Record<string, unknown>>
    for (const key of Object.keys(vsMap)) {
      const vs = vsMap[key]
      if (Array.isArray(vs.filters)) {
        vs.filters = (vs.filters as any[]).map((f: any) => {
          if (f.field === "isWiki") {
            return { field: "noteType", operator: f.operator, value: f.value === "true" ? "wiki" : "note" }
          }
          return f
        })
      }
    }
  }

  // v67: Remove WikiStatus/StubSource — stub/article distinction eliminated
  if (Array.isArray(state.notes)) {
    for (const note of state.notes as Record<string, unknown>[]) {
      delete note.wikiStatus
      delete note.stubSource
    }
  }
  if (Array.isArray(state.wikiArticles)) {
    for (const article of state.wikiArticles as Record<string, unknown>[]) {
      delete article.wikiStatus
      delete article.stubSource
    }
  }

  // v68: Add more seed wiki categories if only the original 3 exist
  if (Array.isArray(state.wikiCategories)) {
    const cats = state.wikiCategories as { id: string; name: string; parentIds: string[] }[]
    const existingIds = new Set(cats.map((c) => c.id))
    const newCats = [
      { id: "wcat-seed-4", name: "Computer Science", parentIds: [], description: "Fundamentals of computing and programming" },
      { id: "wcat-seed-5", name: "Algorithms", parentIds: ["wcat-seed-4"], description: "Algorithm design and analysis" },
      { id: "wcat-seed-6", name: "Data Structures", parentIds: ["wcat-seed-4"], description: "Organizing and storing data efficiently" },
      { id: "wcat-seed-7", name: "Philosophy", parentIds: [], description: "Fundamental questions about existence, knowledge, and ethics" },
      { id: "wcat-seed-8", name: "Epistemology", parentIds: ["wcat-seed-7"], description: "Theory of knowledge" },
      { id: "wcat-seed-9", name: "Productivity", parentIds: [], description: "Methods and tools for personal effectiveness" },
      { id: "wcat-seed-10", name: "Note-taking", parentIds: ["wcat-seed-9", "wcat-seed-1"], description: "Strategies for effective note-taking" },
    ]
    const now = new Date().toISOString()
    for (const nc of newCats) {
      if (!existingIds.has(nc.id)) {
        cats.push({ ...nc, createdAt: now, updatedAt: now } as any)
      }
    }
  }

  // v69: Restore "Overview" section to Zettelkasten article if it was accidentally split out
  if (Array.isArray(state.wikiArticles)) {
    const articles = state.wikiArticles as any[]
    const overviewIdx = articles.findIndex((a) => a.title === "Overview" && a.id !== "wiki-article-1")
    const zettelIdx = articles.findIndex((a) => a.id === "wiki-article-1")
    if (overviewIdx !== -1 && zettelIdx !== -1) {
      const overviewArticle = articles[overviewIdx]
      const zettel = articles[zettelIdx]
      // Merge overview blocks back to front of Zettelkasten
      const hasOverviewSection = zettel.blocks?.some((b: any) => b.type === "section" && b.title === "Overview")
      if (!hasOverviewSection && overviewArticle.blocks?.length > 0) {
        zettel.blocks = [...overviewArticle.blocks, ...(zettel.blocks ?? [])]
        zettel.updatedAt = new Date().toISOString()
      }
      // Remove the standalone Overview article
      articles.splice(overviewIdx, 1)
    }
  }

  // v70: References — bibliography/citation store
  if (!state.references) state.references = {}

  // v71: Soft delete for references and attachments
  if (state.references) {
    for (const id of Object.keys(state.references as Record<string, unknown>)) {
      const ref = (state.references as Record<string, any>)[id]
      if (ref.trashed === undefined) {
        ref.trashed = false
        ref.trashedAt = null
      }
    }
  }
  if (state.attachments && Array.isArray(state.attachments)) {
    state.attachments = (state.attachments as any[]).map((a: any) => ({
      ...a,
      trashed: a.trashed ?? false,
      trashedAt: a.trashedAt ?? null,
    }))
  }

  // v72: Global Bookmarks — cross-note anchor store
  if (!state.globalBookmarks) state.globalBookmarks = {}

  // v76: Comments — block/node-anchored annotations
  if (!state.comments) state.comments = {}

  // v72: Split-First migration — remove all Peek infrastructure
  delete (state as any).sidePanelPeekContext
  delete (state as any).peekHistory
  delete (state as any).peekPins
  delete (state as any).peekSize
  delete (state as any).peekNavStack
  delete (state as any).peekNavIndex
  delete (state as any).sidebarPeek
  delete (state as any).secondarySidePanelOpen
  delete (state as any).secondarySidePanelMode
  delete (state as any).secondarySidePanelContext
  // Reset sidePanelMode if it was 'peek' (no longer a valid mode)
  if (state.sidePanelMode === 'peek') state.sidePanelMode = 'detail'

  // v75: WikiBlock.editorWidth/editorHeight — optional, no backfill needed

  // v74: Add referenceIds to notes
  if (Array.isArray(state.notes)) {
    for (const note of state.notes as any[]) {
      if (!note.referenceIds) note.referenceIds = []
    }
  }

  // v73: Add history to references
  if (state.references) {
    for (const key of Object.keys(state.references as Record<string, any>)) {
      const ref = (state.references as Record<string, any>)[key]
      if (!ref.history) {
        ref.history = [
          { timestamp: ref.createdAt, action: "created" }
        ]
      }
    }
  }

  return state as unknown as PlotState
}
