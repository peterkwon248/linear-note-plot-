import type { NoteBody } from "../types"
import { nanoid } from "nanoid"
import { extractPreview, extractLinksOut } from "../body-helpers"
import { buildDefaultViewStates, normalizeViewStatesMap, buildViewStateForContext } from "../view-engine/defaults"
import type { WorkspaceTab } from "../workspace/types"
import type { PlotState } from "./types"
import { SEED_TEMPLATES, SEED_BOOKS } from "./seeds"

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
  // v116 (early-bird): rename viewStateByContext keys BEFORE normalizeViewStatesMap.
  // normalizeViewStatesMap iterates only VALID_VIEW_CONTEXT_KEYS (now stone/brick/keystone),
  // so without this early rename a v115 user's persisted inbox/capture/permanent customization
  // would be silently discarded. Idempotent (only renames when target is undefined).
  if (state.viewStateByContext) {
    const vsc = state.viewStateByContext as Record<string, unknown>
    const earlyStatusRenames: Record<string, string> = {
      inbox: "stone",
      capture: "brick",
      permanent: "keystone",
    }
    for (const [oldKey, newKey] of Object.entries(earlyStatusRenames)) {
      if (vsc[oldKey] !== undefined && vsc[newKey] === undefined) {
        vsc[newKey] = vsc[oldKey]
        delete vsc[oldKey]
      }
    }
  }
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

  // v77: Comment.status (Linear-style) + parentId (1-level threaded reply)
  if (state.comments) {
    for (const id of Object.keys(state.comments as Record<string, any>)) {
      const c = (state.comments as Record<string, any>)[id]
      if (!c.status) c.status = c.resolved ? "done" : "backlog"
      if (c.parentId === undefined) c.parentId = undefined
    }
  }

  // v79: Rename status "note" → "backlog" (Linear-style consistency)
  if (state.comments) {
    for (const id of Object.keys(state.comments as Record<string, any>)) {
      const c = (state.comments as Record<string, any>)[id]
      if (c.status === "note") c.status = "backlog"
    }
  }

  // v80: GlobalBookmark.targetKind — backfill existing as "note" (cross-note bookmarks were note-only)
  if (state.globalBookmarks) {
    for (const id of Object.keys(state.globalBookmarks as Record<string, any>)) {
      const b = (state.globalBookmarks as Record<string, any>)[id]
      if (!b.targetKind) b.targetKind = "note"
    }
  }

  // v78: Migrate legacy Reflection + Thread → Comment (entity-anchored)
  // Reflections become kind:"note" comments. Threads become kind:"note" comments with parentId for nested replies.
  if (!state.comments) state.comments = {}
  const commentsMap = state.comments as Record<string, any>

  // Reflections → Comments
  if (Array.isArray(state.reflections)) {
    for (const r of state.reflections as any[]) {
      if (!r?.id || !r?.noteId) continue
      const cid = `cmt-mig-${r.id}`
      if (commentsMap[cid]) continue // already migrated
      commentsMap[cid] = {
        id: cid,
        anchor: { kind: "note", noteId: r.noteId },
        body: r.text || "",
        createdAt: r.createdAt || new Date().toISOString(),
        updatedAt: r.createdAt || new Date().toISOString(),
        status: "backlog",
        parentId: undefined,
        resolved: false,
      }
    }
    state.reflections = []
  }

  // Threads → Comments (each step becomes a comment; step.parentId stays as parentId)
  if (Array.isArray(state.threads)) {
    for (const t of state.threads as any[]) {
      if (!t?.noteId || !Array.isArray(t.steps)) continue
      // Map old stepId → new commentId
      const stepIdMap = new Map<string, string>()
      for (const step of t.steps as any[]) {
        const newId = `cmt-mig-${step.id}`
        stepIdMap.set(step.id, newId)
      }
      for (const step of t.steps as any[]) {
        const cid = stepIdMap.get(step.id)!
        if (commentsMap[cid]) continue
        const parentNew = step.parentId ? stepIdMap.get(step.parentId) : undefined
        commentsMap[cid] = {
          id: cid,
          anchor: { kind: "note", noteId: t.noteId },
          body: step.text || "",
          createdAt: step.at || t.startedAt || new Date().toISOString(),
          updatedAt: step.at || t.startedAt || new Date().toISOString(),
          status: t.status === "done" ? "done" : "backlog",
          parentId: parentNew,
          resolved: t.status === "done",
        }
      }
    }
    state.threads = []
  }

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

  // v81: Reference.imageUrl — optional field, backfill null for existing entries
  if (state.references) {
    for (const key of Object.keys(state.references as Record<string, any>)) {
      const ref = (state.references as Record<string, any>)[key]
      if (ref.imageUrl === undefined) {
        ref.imageUrl = null
      }
    }
  }

  // v82: WikiArticle.parentArticleId — parent-child hierarchy (single-parent tree)
  if (Array.isArray(state.wikiArticles)) {
    state.wikiArticles = (state.wikiArticles as any[]).map((a: any) => ({
      ...a,
      parentArticleId: a.parentArticleId ?? null,
    }))
  }

  // v84: Navbox PR2 — schema additions.
  //      Block data lives in IDB (plot-wiki-block-meta). This migration only
  //      sets a localStorage marker so the post-load IDB sweep runs once.
  //      The component layer (`navboxBlockMigrate`) gracefully reads either
  //      legacy (`navboxArticleIds`) or new (`navboxGroups`) shape, so first
  //      paint is safe even before the IDB sweep finishes.
  if (typeof window !== "undefined") {
    try {
      const FLAG = "plot.navbox-pr2-migrated"
      if (!window.localStorage.getItem(FLAG)) {
        window.localStorage.setItem(FLAG, "pending")
      }
    } catch {
      // ignore quota / privacy mode
    }
  }

  // v83: WikiArticle.infoboxPreset — domain preset selector (default "custom").
  //      Also backfill `type: "field"` on infobox entries that predate the discriminator.
  if (Array.isArray(state.wikiArticles)) {
    state.wikiArticles = (state.wikiArticles as any[]).map((a: any) => {
      const infobox = Array.isArray(a.infobox)
        ? (a.infobox as any[]).map((e: any) => {
            if (!e || typeof e !== "object") return e
            const t = e.type
            if (t === "field" || t === "section" || t === "group-header") return e
            return { ...e, type: "field" as const }
          })
        : []  // v83 hotfix: backfill empty array when undefined/null
      return {
        ...a,
        infobox,
        infoboxPreset: a.infoboxPreset ?? "custom",
      }
    })
  }
  // Same backfill for note.wikiInfobox — notes also use WikiInfoboxEntry.
  if (Array.isArray(state.notes)) {
    for (const note of state.notes as any[]) {
      if (Array.isArray(note.wikiInfobox)) {
        note.wikiInfobox = note.wikiInfobox.map((e: any) => {
          if (!e || typeof e !== "object") return e
          const t = e.type
          if (t === "field" || t === "section" || t === "group-header") return e
          return { ...e, type: "field" as const }
        })
      }
    }
  }

  // v75: WikiBlock.editorWidth/editorHeight — optional, no backfill needed

  // v74: Add referenceIds to notes
  if (Array.isArray(state.notes)) {
    for (const note of state.notes as any[]) {
      if (!note.referenceIds) note.referenceIds = []
    }
  }

  // v85: Banner block PR3 — adds bannerBgColorEnd / bannerIcon / bannerSize /
  //      bannerBgStyle to wiki banner blocks AND to TipTap bannerBlock nodes.
  //      Block data lives in IDB (plot-wiki-block-meta) for wiki, and in note
  //      bodies for TipTap. Both surfaces lazily default missing fields via
  //      `?? "default-value"`, so this migration is a no-op in Zustand state
  //      and just sets a localStorage marker for future analytics / debugging.
  if (typeof window !== "undefined") {
    try {
      const FLAG = "plot.banner-pr3-migrated"
      if (!window.localStorage.getItem(FLAG)) {
        window.localStorage.setItem(FLAG, "pending")
      }
    } catch {
      // ignore quota / privacy mode
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

  // v86: hotfix — wikiArticle.infobox sometimes undefined on legacy data even
  // after v83 migration. Always backfill to empty array.
  if (Array.isArray(state.wikiArticles)) {
    state.wikiArticles = (state.wikiArticles as any[]).map((a: any) => {
      if (Array.isArray(a.infobox)) return a
      return { ...a, infobox: [] }
    })
  }

  // v87: WikiArticle.pinned — whole-article pin (mirrors Note.pinned).
  if (Array.isArray(state.wikiArticles)) {
    state.wikiArticles = (state.wikiArticles as any[]).map((a: any) => ({
      ...a,
      pinned: typeof a.pinned === "boolean" ? a.pinned : false,
    }))
  }

  // v88: hotfix — clear all wiki article pins. Earlier seed/auto-promotion code
  // accidentally set pinned=true on bulk-created articles. Reset everyone to
  // false; users can re-pin intentionally via the Detail panel.
  if (Array.isArray(state.wikiArticles)) {
    state.wikiArticles = (state.wikiArticles as any[]).map((a: any) => ({
      ...a,
      pinned: false,
    }))
  }

  // v89: dedupe wiki notes (noteType === "wiki") that share the same title.
  // Earlier `createWikiStub` had no dedupe guard, so auto-enrollment spawned
  // N copies of the same red-link target. Keep the oldest one per title;
  // trash the rest (recoverable from /trash).
  if (Array.isArray(state.notes)) {
    const groups = new Map<string, any[]>()
    for (const n of state.notes as any[]) {
      if (n.noteType !== "wiki" || n.trashed) continue
      const key = (n.title || "").trim().toLowerCase()
      if (!key) continue
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(n)
    }
    const toTrash = new Set<string>()
    const trashTime = new Date().toISOString()
    for (const [, arr] of groups) {
      if (arr.length <= 1) continue
      // Keep the oldest (smallest createdAt), trash the rest.
      arr.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))
      for (let i = 1; i < arr.length; i++) {
        toTrash.add(arr[i].id)
      }
    }
    if (toTrash.size > 0) {
      state.notes = (state.notes as any[]).map((n: any) =>
        toTrash.has(n.id)
          ? { ...n, trashed: true, trashedAt: trashTime }
          : n,
      )
    }
  }

  // v90: dedupe wikiArticles (separate entity since v47) by title.
  // Same root cause as v89, different array. Keep oldest, trash the rest.
  if (Array.isArray(state.wikiArticles)) {
    const groups = new Map<string, any[]>()
    for (const a of state.wikiArticles as any[]) {
      if ((a as { trashed?: boolean }).trashed) continue
      const key = (a.title || "").trim().toLowerCase()
      if (!key) continue
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(a)
    }
    const toTrash = new Set<string>()
    const trashTime = new Date().toISOString()
    for (const [, arr] of groups) {
      if (arr.length <= 1) continue
      arr.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))
      for (let i = 1; i < arr.length; i++) {
        toTrash.add(arr[i].id)
      }
    }
    if (toTrash.size > 0) {
      state.wikiArticles = (state.wikiArticles as any[]).map((a: any) =>
        toTrash.has(a.id)
          ? { ...a, trashed: true, trashedAt: trashTime }
          : a,
      )
    }
  }

  // v91: idempotent re-run of v89/v90 dedupe in case earlier passes didn't apply
  // (e.g. seed re-hydration, persist version skip). Same algorithm, runs again.
  if (Array.isArray(state.wikiArticles)) {
    const groups = new Map<string, any[]>()
    for (const a of state.wikiArticles as any[]) {
      if ((a as { trashed?: boolean }).trashed) continue
      const key = (a.title || "").trim().toLowerCase()
      if (!key) continue
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(a)
    }
    const toTrash = new Set<string>()
    const trashTime = new Date().toISOString()
    for (const [, arr] of groups) {
      if (arr.length <= 1) continue
      arr.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))
      for (let i = 1; i < arr.length; i++) toTrash.add(arr[i].id)
    }
    if (toTrash.size > 0) {
      state.wikiArticles = (state.wikiArticles as any[]).map((a: any) =>
        toTrash.has(a.id) ? { ...a, trashed: true, trashedAt: trashTime } : a,
      )
    }
  }
  if (Array.isArray(state.notes)) {
    const groups = new Map<string, any[]>()
    for (const n of state.notes as any[]) {
      if (n.noteType !== "wiki" || n.trashed) continue
      const key = (n.title || "").trim().toLowerCase()
      if (!key) continue
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(n)
    }
    const toTrash = new Set<string>()
    const trashTime = new Date().toISOString()
    for (const [, arr] of groups) {
      if (arr.length <= 1) continue
      arr.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))
      for (let i = 1; i < arr.length; i++) toTrash.add(arr[i].id)
    }
    if (toTrash.size > 0) {
      state.notes = (state.notes as any[]).map((n: any) =>
        toTrash.has(n.id) ? { ...n, trashed: true, trashedAt: trashTime } : n,
      )
    }
  }

  // v92: Migrate toggles.compact + toggles.showCardPreview → rowDensity on each ViewState
  if (state.viewStateByContext && typeof state.viewStateByContext === "object") {
    const vsMap = state.viewStateByContext as Record<string, Record<string, unknown>>
    for (const ctx of Object.keys(vsMap)) {
      const vs = vsMap[ctx]
      if (!vs || typeof vs !== "object") continue
      const toggles = (vs.toggles ?? {}) as Record<string, boolean>
      if (!("rowDensity" in vs)) {
        // Convert legacy toggles to rowDensity
        if (toggles.compact) {
          vs.rowDensity = "compact"
        } else if (toggles.showCardPreview) {
          vs.rowDensity = "comfortable"
        } else {
          vs.rowDensity = "standard"
        }
      }
      // Remove legacy keys from toggles
      const { compact: _c, showCardPreview: _sp, ...restToggles } = toggles
      vs.toggles = restToggles
    }
  }

  // v93: Remove rowDensity field from all ViewStates (Linear style — no density toggle)
  if (state.viewStateByContext && typeof state.viewStateByContext === "object") {
    const vsMap = state.viewStateByContext as Record<string, Record<string, unknown>>
    for (const ctx of Object.keys(vsMap)) {
      const vs = vsMap[ctx]
      if (!vs || typeof vs !== "object") continue
      delete vs.rowDensity
    }
  }

  // v94: Multi-sort — sortField/sortDirection → sortFields[]
  // Build a length-1 chain from existing single-sort fields. Keep the legacy
  // fields in sync with sortFields[0] (mirror) for backward compat with code
  // still reading viewState.sortField / viewState.sortDirection.
  if (state.viewStateByContext && typeof state.viewStateByContext === "object") {
    const vsMap = state.viewStateByContext as Record<string, Record<string, unknown>>
    for (const ctx of Object.keys(vsMap)) {
      const vs = vsMap[ctx]
      if (!vs || typeof vs !== "object") continue
      const existing = vs.sortFields as Array<{ field: string; direction: string }> | undefined
      if (!Array.isArray(existing) || existing.length === 0) {
        const field = (typeof vs.sortField === "string" && vs.sortField) ? vs.sortField : "updatedAt"
        const direction = (vs.sortDirection === "asc" || vs.sortDirection === "desc") ? vs.sortDirection : "desc"
        vs.sortFields = [{ field, direction }]
        // Keep legacy fields in sync (mirror)
        vs.sortField = field
        vs.sortDirection = direction
      } else {
        // Already has sortFields — sync legacy mirror to head
        const head = existing[0]
        if (head) {
          vs.sortField = head.field
          vs.sortDirection = head.direction
        }
      }
    }
  }

  // v95: WikiArticle.reads — view count field. Backfill 0 for all existing articles.
  if (Array.isArray(state.wikiArticles)) {
    state.wikiArticles = (state.wikiArticles as any[]).map((a: any) => ({
      ...a,
      reads: a.reads ?? 0,
    }))
  }

  // v96: dedupe wikiCategories by id. Earlier seed/hydrate paths could append
  // the same SEED_WIKI_CATEGORIES set twice, leading to duplicate ids in the
  // store. Keep first occurrence per id.
  if (Array.isArray(state.wikiCategories)) {
    const seen = new Set<string>()
    const before = (state.wikiCategories as any[]).length
    state.wikiCategories = (state.wikiCategories as any[]).filter((c: any) => {
      if (!c || typeof c.id !== "string") return false
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
    const removed = before - (state.wikiCategories as any[]).length
    if (removed > 0) {
      console.log(`[migrate] v95→v96: removed ${removed} duplicate wikiCategories`)
    }
  }

  // v97: Translate Korean infobox field/group keys → English. Existing data
  // from preset-cloned entries used Korean labels; presets file is now English.
  // Keep the user's `value` content untouched — only the `key` (label) is
  // translated. Custom-typed keys (not in the map) are left as-is.
  const INFOBOX_KEY_KO_TO_EN: Record<string, string> = {
    // Person
    "본명": "Full name", "출생": "Born", "국적": "Nationality",
    "직업": "Occupation", "주요 업적": "Notable work", "학력": "Education",
    "활동 기간": "Active period", "웹사이트": "Website",
    // Character
    "이름": "Name", "종/분류": "Species/Type", "소속": "Affiliation",
    "성별": "Gender", "첫 등장": "First appearance", "성우": "Voice actor",
    "능력/특기": "Abilities",
    // Place
    "공식 명칭": "Official name", "국가": "Country", "행정구역": "Region",
    "면적": "Area", "인구": "Population", "설립/건설": "Founded/Built",
    "수장": "Head", "좌표": "Coordinates",
    // Organization
    "설립일": "Founded", "설립자": "Founder", "본사": "Headquarters",
    "대표": "Director", "업종": "Industry", "임직원 수": "Employees",
    "법적 형태": "Legal form",
    // Film
    "감독": "Director", "출연진": "Cast", "장르": "Genre",
    "개봉일": "Release", "상영시간": "Runtime", "제작사": "Studio",
    "배급사": "Distributor", "제작 국가": "Country",
    // Book
    "저자": "Author", "출판사": "Publisher", "출판일": "Published",
    "페이지 수": "Pages", "언어": "Language", "시리즈": "Series",
    // Music
    "아티스트": "Artist", "레이블": "Label", "발매일": "Released",
    "트랙 수": "Tracks", "러닝타임": "Runtime", "프로듀서": "Producer",
    // Game
    "개발사": "Developer", "퍼블리셔": "Publisher", "플랫폼": "Platform",
    "출시일": "Released", "등급": "Rating", "게임 엔진": "Engine",
    "플레이 모드": "Mode",
    // Event
    "발생일": "Date", "발생지": "Location", "원인": "Cause",
    "결과": "Outcome", "참여자": "Participants", "피해 규모": "Damage",
    "기간": "Duration",
    // Concept
    "분야": "Field", "기원/등장 시기": "Origin", "제안자": "Proposed by",
    "관련 개념": "Related concepts", "적용 사례": "Applications",
    "참고 문헌": "References",
    // Group headers
    "추가 정보": "Additional info", "제작 정보": "Production info",
  }
  const translateKey = (k: unknown): unknown =>
    typeof k === "string" && INFOBOX_KEY_KO_TO_EN[k] ? INFOBOX_KEY_KO_TO_EN[k] : k

  if (Array.isArray(state.wikiArticles)) {
    state.wikiArticles = (state.wikiArticles as any[]).map((a: any) => {
      if (!Array.isArray(a.infobox)) return a
      return {
        ...a,
        infobox: a.infobox.map((e: any) => ({ ...e, key: translateKey(e.key) })),
      }
    })
  }
  if (Array.isArray(state.notes)) {
    for (const note of state.notes as any[]) {
      if (Array.isArray(note.wikiInfobox)) {
        note.wikiInfobox = note.wikiInfobox.map((e: any) => ({
          ...e,
          key: translateKey(e.key),
        }))
      }
    }
  }

  // v98: strict dedup wikiArticles by id. Prior dedup passes (v90/v91) only
  // trash-marked duplicates without removing them from the array, and a
  // separate seed/hydrate path was re-pushing the same seeds on each load —
  // resulting in 20+ copies of `wiki-1`, `wiki-2`, `wiki-3` in some users'
  // stores, which broke React rendering with duplicate-key errors and an
  // empty ontology canvas.
  //
  // Strategy: keep the FIRST occurrence per id and drop the rest.
  if (Array.isArray(state.wikiArticles)) {
    const seen = new Set<string>()
    const before = (state.wikiArticles as any[]).length
    state.wikiArticles = (state.wikiArticles as any[]).filter((a: any) => {
      if (!a || typeof a.id !== "string") return false
      if (seen.has(a.id)) return false
      seen.add(a.id)
      return true
    })
    const removed = before - (state.wikiArticles as any[]).length
    if (removed > 0) {
      console.log(`[migrate] v97→v98: removed ${removed} duplicate wikiArticles by id`)
    }
  }

  // v99: Graph grouping redesign — assign default colors to existing wiki
  // categories (didn't have a color field before; needed for hull color in
  // the ontology graph when grouping by category). Also normalize
  // wikiArticles.folderId to null so unified note+wiki grouping by folder
  // works correctly.
  //
  // Color palette cycles so categories without explicit color still render
  // distinct hulls in the graph.
  const CATEGORY_DEFAULT_PALETTE_V99 = [
    "#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#fb7185",
    "#f472b6", "#22d3ee", "#fb923c", "#84cc16", "#c084fc",
  ]

  if (Array.isArray(state.wikiCategories)) {
    state.wikiCategories = (state.wikiCategories as any[]).map((cat: any, i: number) => ({
      ...cat,
      color: typeof cat.color === "string" && cat.color.length > 0
        ? cat.color
        : CATEGORY_DEFAULT_PALETTE_V99[i % CATEGORY_DEFAULT_PALETTE_V99.length],
    }))
  }

  if (Array.isArray(state.wikiArticles)) {
    state.wikiArticles = (state.wikiArticles as any[]).map((a: any) => ({
      ...a,
      folderId: typeof a.folderId === "string" ? a.folderId : null,
    }))
  }

  // v100: Sticker entity introduction.
  // Cross-entity grouping marker (notes + wikis) — the third grouping
  // dimension after Label (note-only) and WikiCategory (wiki-only).
  // Migration is purely additive: ensure `stickers` array exists, and
  // ensure `stickerIds` defaults to undefined (left optional in types
  // so empty arrays aren't forced).
  if (!Array.isArray((state as any).stickers)) {
    (state as any).stickers = []
  }

  // v101: Sticker v2 — cross-everything membership model (옵션 D2).
  // Move `stickerIds[]` from each Note/WikiArticle onto the matching
  // Sticker as `members: EntityRef[]`. Single forward reference so future
  // entity types (Tag/Label/Category/File/Reference, Book) can join
  // without touching note/wiki schemas again.
  //
  // Backward fallback: if a stickerId on a note/wiki points at a sticker
  // that no longer exists, the reference is silently dropped. The reverse
  // direction (sticker membership pointing at a note that doesn't exist)
  // is handled at read time by the useStickerMembers hook.
  if (Array.isArray((state as any).stickers)) {
    const stickersArr = (state as any).stickers as Array<{ id: string; members?: any }>
    // Index stickers by id for O(1) lookup during the cascade.
    const stickerById = new Map<string, { id: string; members: any[] }>()
    for (const s of stickersArr) {
      const initial = Array.isArray(s.members) ? s.members : []
      stickerById.set(s.id, { ...s, members: initial } as any)
    }

    const ensureRef = (sticker: { members: any[] }, kind: string, id: string) => {
      // Dedup: skip if (kind, id) already present.
      for (const m of sticker.members) {
        if (m && m.kind === kind && m.id === id) return
      }
      sticker.members.push({ kind, id })
    }

    if (Array.isArray(state.notes)) {
      for (const n of state.notes as any[]) {
        if (!n || !Array.isArray(n.stickerIds)) continue
        for (const sid of n.stickerIds) {
          const sticker = stickerById.get(sid)
          if (sticker) ensureRef(sticker, "note", n.id)
        }
        // Strip the legacy field after migration.
        delete n.stickerIds
      }
    }

    if (Array.isArray(state.wikiArticles)) {
      for (const w of state.wikiArticles as any[]) {
        if (!w || !Array.isArray(w.stickerIds)) continue
        for (const sid of w.stickerIds) {
          const sticker = stickerById.get(sid)
          if (sticker) ensureRef(sticker, "wiki", w.id)
        }
        delete w.stickerIds
      }
    }

    // Write the rebuilt sticker array back (preserves order).
    ;(state as any).stickers = stickersArr.map((s) => stickerById.get(s.id) ?? { ...s, members: [] })
  }

  // v102: Template meta slimming — strip legacy `icon` (emoji) and
  // `color` (hex) fields from NoteTemplate. Templates now derive their
  // visual cues from the linked `labelId` (single source of truth,
  // matching how notes themselves work). UI cleanup:
  // - Templates list/grid no longer renders the per-template icon/color
  // - TemplateFormDialog no longer prompts for icon/color
  // - createNoteFromTemplate no longer copies these fields onto the new note
  //
  // Idempotent: subsequent runs find no `icon`/`color` keys and no-op.
  if (Array.isArray((state as any).templates)) {
    for (const t of (state as any).templates as any[]) {
      if (!t) continue
      delete t.icon
      delete t.color
    }
  }

  // v103: Templates view-engine adoption (PR template-c).
  // Ensure viewStateByContext has an entry for the new "templates" context.
  // Purely additive: leaves existing keys untouched, only injects when missing.
  // Idempotent: subsequent runs find the key already populated and no-op.
  if (state.viewStateByContext && typeof state.viewStateByContext === "object") {
    const vsMap = state.viewStateByContext as Record<string, unknown>
    if (!vsMap.templates) {
      vsMap.templates = buildViewStateForContext("templates")
    }
  }

  // v104: Templates display property simplification (PR template-c fix batch).
  // Remove status/priority/label/folder/tags from templates visibleColumns —
  // these properties are not meaningful for blueprint items.
  // New default: ["title", "description", "updatedAt", "createdAt"].
  // Idempotent: columns not present are silently skipped; if the result is
  // empty (only removed cols existed), reset to the new default set.
  const REMOVED_TEMPLATE_COLUMNS = ["status", "priority", "label", "folder", "tags"]
  const NEW_TEMPLATE_DEFAULT_COLUMNS = ["title", "description", "updatedAt", "createdAt"]
  if (state.viewStateByContext && typeof state.viewStateByContext === "object") {
    const vsMap = state.viewStateByContext as Record<string, unknown>
    if (vsMap.templates && typeof vsMap.templates === "object") {
      const tmplVs = vsMap.templates as Record<string, unknown>
      if (Array.isArray(tmplVs.visibleColumns)) {
        const filtered = (tmplVs.visibleColumns as string[]).filter(
          (c) => !REMOVED_TEMPLATE_COLUMNS.includes(c),
        )
        // If stripping leaves nothing meaningful (or only the always-present "title"),
        // reset to the full new default.
        tmplVs.visibleColumns = filtered.length > 1 ? filtered : NEW_TEMPLATE_DEFAULT_COLUMNS
      }
    }
  }

  // v105: Remove "description" from templates visibleColumns — the description
  // column is retired from the list view and grid card (PR template-c fix batch).
  // New default after removal: ["title", "updatedAt", "createdAt"].
  // Idempotent: if "description" is already absent, the filter is a no-op.
  if (state.viewStateByContext && typeof state.viewStateByContext === "object") {
    const vsMap = state.viewStateByContext as Record<string, unknown>
    if (vsMap.templates && typeof vsMap.templates === "object") {
      const tmplVs = vsMap.templates as Record<string, unknown>
      if (Array.isArray(tmplVs.visibleColumns)) {
        const withoutDesc = (tmplVs.visibleColumns as string[]).filter((c) => c !== "description")
        // If nothing meaningful remains (empty or only updatedAt/createdAt tail),
        // reset to the new default ["title", "updatedAt", "createdAt"].
        const hasMeaningful = withoutDesc.some((c) => !["updatedAt", "createdAt"].includes(c))
        tmplVs.visibleColumns = hasMeaningful ? withoutDesc : ["title", "updatedAt", "createdAt"]
      }
    }
  }

  // v106: Inject new seed templates added in PR d (4 → 13).
  // Existing users (pre-PR d) only have the original 4 seeds (tmpl-meeting,
  // tmpl-daily, tmpl-idea, tmpl-research). This block adds the 9 new seeds
  // idempotently — if a template with the same id already exists, skip.
  // New users get all 13 from SEED_TEMPLATES at store creation, so this is
  // a no-op for them.
  if (!Array.isArray(state.templates)) {
    state.templates = []
  }
  const existingTemplateIds = new Set((state.templates as Array<{ id: string }>).map((t) => t.id))
  for (const seed of SEED_TEMPLATES) {
    if (!existingTemplateIds.has(seed.id)) {
      (state.templates as Array<unknown>).push(seed)
    }
  }

  // v107: Folder type-strict + N:M membership migration.
  //
  // Three structural changes — all idempotent (re-running is a no-op):
  //   1. `Folder.kind: "note" | "wiki"` introduced (data-driven inference)
  //   2. `Note.folderId` (single) → `Note.folderIds[]` (array)
  //   3. `WikiArticle.folderId` (PR #236, single) → `WikiArticle.folderIds[]`
  //   4. Mixed folders (PR #236 cross-everything era — note+wiki together)
  //      auto-split: original folder keeps notes as `kind="note"`, a clone
  //      `{name} (Wiki)` with id `{id}-wiki` collects the wikis as
  //      `kind="wiki"`. Wiki memberships are rewritten to the clone.
  //
  // `kind` inference per folder:
  //   - W (wiki count) === 0 → kind = "note"  (covers pure-note + empty)
  //   - N (note count) === 0 → kind = "wiki"  (pure-wiki, including PR #236)
  //   - both N>0 and W>0     → kind = "note" + clone for wikis (split)
  //
  // Idempotent guards:
  //   - Folder already has `kind` → skip
  //   - Note already has `folderIds[]` array → skip
  //   - WikiArticle already has `folderIds[]` array → skip
  //
  // Templates (NoteTemplate.folderId) intentionally untouched — see
  // `.omc/plans/folder-nm-migration.md` §"Templates 변경 X". Their folder
  // means "default folder for new notes from this template" (single-target
  // semantics).
  if (Array.isArray(state.folders)) {
    const folders = state.folders as any[]
    const notes = (state.notes ?? []) as any[]
    const wikis = (state.wikiArticles ?? []) as any[]

    // 1. Note.folderId → folderIds (idempotent)
    for (const n of notes) {
      if (Array.isArray(n.folderIds)) continue  // already migrated
      const legacy = n.folderId
      n.folderIds = (typeof legacy === "string" && legacy.length > 0) ? [legacy] : []
      delete n.folderId
    }

    // 2. WikiArticle.folderId → folderIds (idempotent)
    for (const w of wikis) {
      if (Array.isArray(w.folderIds)) continue
      const legacy = w.folderId
      w.folderIds = (typeof legacy === "string" && legacy.length > 0) ? [legacy] : []
      delete w.folderId
    }

    // 3. Folder.kind inference + mixed-folder split.
    //    Index counts the live (non-trashed) members per folder id.
    const noteFoldersIndex = new Map<string, number>()
    const wikiFoldersIndex = new Map<string, number>()
    for (const n of notes) {
      if (n.trashed) continue
      for (const fid of (n.folderIds ?? [])) {
        noteFoldersIndex.set(fid, (noteFoldersIndex.get(fid) ?? 0) + 1)
      }
    }
    for (const w of wikis) {
      // WikiArticle has no `trashed` boolean (deleted articles are removed
      // from the array). Count all members.
      for (const fid of (w.folderIds ?? [])) {
        wikiFoldersIndex.set(fid, (wikiFoldersIndex.get(fid) ?? 0) + 1)
      }
    }

    const newFolders: any[] = []
    const wikiFolderClones = new Map<string, string>()  // original id → cloned wiki id
    let kindInferredCount = 0
    let mixedSplitCount = 0

    for (const f of folders) {
      if (typeof f.kind === "string") {
        // Already migrated — preserve as-is.
        newFolders.push(f)
        continue
      }
      const N = noteFoldersIndex.get(f.id) ?? 0
      const W = wikiFoldersIndex.get(f.id) ?? 0

      if (W === 0) {
        // Pure note folder, or empty (default to note).
        newFolders.push({ ...f, kind: "note" as const })
        kindInferredCount++
      } else if (N === 0) {
        // Pure wiki folder (e.g. PR #236 user who only added wikis).
        newFolders.push({ ...f, kind: "wiki" as const })
        kindInferredCount++
      } else {
        // Mixed: keep the original as a "note" folder, clone for wikis.
        // Clone id = `{id}-wiki` (deterministic, idempotent across runs in
        // the unlikely event the user already had such a collision — guarded
        // by the `Array.isArray` checks above + folder already-has-kind).
        const cloneId = `${f.id}-wiki`
        newFolders.push({ ...f, kind: "note" as const })
        newFolders.push({
          ...f,
          id: cloneId,
          name: `${f.name} (Wiki)`,
          kind: "wiki" as const,
          createdAt: typeof f.createdAt === "string" ? f.createdAt : new Date().toISOString(),
        })
        wikiFolderClones.set(f.id, cloneId)
        mixedSplitCount++
      }
    }
    state.folders = newFolders

    // 4. Rewrite wiki memberships from any mixed-original to its clone.
    if (wikiFolderClones.size > 0) {
      for (const w of wikis) {
        const ids = w.folderIds as string[]
        if (!Array.isArray(ids) || ids.length === 0) continue
        let mutated = false
        const next = ids.map((fid) => {
          const cloneId = wikiFolderClones.get(fid)
          if (cloneId !== undefined) { mutated = true; return cloneId }
          return fid
        })
        if (mutated) w.folderIds = next
      }
    }

    if (kindInferredCount > 0 || mixedSplitCount > 0) {
      console.log(
        `[migrate] v106→v107: folder kind inferred for ${kindInferredCount} folders, ${mixedSplitCount} mixed folders auto-split`,
      )
    }
  }

  // v108: Strip retired NoteTemplate fields (`description`, `status`, `priority`).
  // Card display already retired in PR template-c/e — v108 follows up by deleting
  // them from persisted templates so the data model matches the type.
  // Idempotent: `delete` on missing keys is a no-op.
  if (Array.isArray(state.templates)) {
    let strippedCount = 0
    for (const t of state.templates as Record<string, unknown>[]) {
      let mutated = false
      if ("description" in t) { delete t.description; mutated = true }
      if ("status" in t) { delete t.status; mutated = true }
      if ("priority" in t) { delete t.priority; mutated = true }
      if (mutated) strippedCount++
    }
    if (strippedCount > 0) {
      console.log(`[migrate] v107→v108: stripped retired fields from ${strippedCount} templates`)
    }
  }

  // v109: Folder/Tag color opt-in policy.
  //
  // No data transformation needed — existing folders and tags keep whatever
  // colors they already have (auto-assigned by palette cycle / pickColor in
  // earlier versions). The schema simply widens to `string | null` so new
  // folders/tags can start uncolored. The version bump is for forward-compat
  // bookkeeping; this block is intentionally a no-op.
  //
  // Rationale: stripping existing colors would be invasive and surprise users
  // who already organized their workspace by color. Opt-in applies to *new*
  // entities; existing data keeps its expression.

  // v110: Tags entity index view-engine integration (PR group-c-d-1).
  //
  // Inject viewStateByContext["tags-list"] default if not already present.
  // Idempotent (option A) — existing users who already have the key keep
  // their persisted viewState. New key only injected for users upgrading
  // from v109 who don't have the key yet.
  {
    const vsc = state.viewStateByContext as Record<string, unknown> | undefined
    if (vsc && !("tags-list" in vsc)) {
      const defaultState = buildViewStateForContext("tags-list")
      vsc["tags-list"] = defaultState
      console.log("[migrate] v109→v110: injected tags-list viewState default")
    }
  }

  // v111: Labels entity index view-engine integration (PR group-c-d-2).
  //
  // Inject viewStateByContext["labels-list"] default if not already present.
  // Idempotent — existing users who already have the key keep their persisted
  // viewState. New key only injected for users upgrading from v110.
  {
    const vsc = state.viewStateByContext as Record<string, unknown> | undefined
    if (vsc && !("labels-list" in vsc)) {
      const defaultState = buildViewStateForContext("labels-list")
      vsc["labels-list"] = defaultState
      console.log("[migrate] v110→v111: injected labels-list viewState default")
    }
  }

  // v112: SavedView.viewMode legacy "table" → "list"
  // Critic finding C2: align SavedView with view-engine ViewMode
  if (state.savedViews && Array.isArray(state.savedViews)) {
    state.savedViews = (state.savedViews as Record<string, unknown>[]).map((v) => {
      const viewState = v.viewState as Record<string, unknown> | undefined
      if (viewState && (viewState.viewMode as string) === "table") {
        return {
          ...v,
          viewState: { ...viewState, viewMode: "list" },
          updatedAt: v.updatedAt ?? new Date().toISOString(),
        }
      }
      return v
    })
  }

  // v113: Stickers entity index view-engine integration (PR group-c-d-3).
  //
  // Inject viewStateByContext["stickers"] default if not already present.
  // Idempotent — existing users who already have the key keep their persisted
  // viewState. New key only injected for users upgrading from v112.
  {
    const vsc = state.viewStateByContext as Record<string, unknown> | undefined
    if (vsc && !("stickers" in vsc)) {
      const defaultState = buildViewStateForContext("stickers")
      vsc["stickers"] = defaultState
      console.log("[migrate] v112→v113: injected stickers viewState default")
    }
  }

  // v114: References entity index view-engine integration (PR group-c-d-4).
  //
  // Inject viewStateByContext["references"] default if not already present.
  // Idempotent — existing users who already have the key keep their persisted
  // viewState. New key only injected for users upgrading from v113.
  {
    const vsc = state.viewStateByContext as Record<string, unknown> | undefined
    if (vsc && !("references" in vsc)) {
      const defaultState = buildViewStateForContext("references")
      vsc["references"] = defaultState
      console.log("[migrate] v113→v114: injected references viewState default")
    }
  }

  // v115: Files entity index view-engine integration (PR group-c-d-5).
  //
  // Inject viewStateByContext["files"] default if not already present.
  // Idempotent — existing users who already have the key keep their persisted
  // viewState. New key only injected for users upgrading from v114.
  {
    const vsc = state.viewStateByContext as Record<string, unknown> | undefined
    if (vsc && !("files" in vsc)) {
      const defaultState = buildViewStateForContext("files")
      vsc["files"] = defaultState
      console.log("[migrate] v114→v115: injected files viewState default")
    }
  }

  // v116: NoteStatus rename — inbox→stone, capture→brick, permanent→keystone.
  //
  // Phase A atomic rename. Renames the persisted `status` field on every
  // note plus the keys in `viewStateByContext` so existing users keep
  // their per-route view configuration after upgrading. Idempotent —
  // notes that already carry the new values pass through untouched, and
  // viewStateByContext entries are only renamed when the new key does
  // not already exist (avoids clobbering a user-edited target slot).
  if (state.notes && Array.isArray(state.notes)) {
    let renamedCount = 0
    state.notes = (state.notes as Record<string, unknown>[]).map((n) => {
      const oldStatus = n.status as string
      let newStatus = oldStatus
      if (oldStatus === "inbox") newStatus = "stone"
      else if (oldStatus === "capture") newStatus = "brick"
      else if (oldStatus === "permanent") newStatus = "keystone"
      if (newStatus !== oldStatus) renamedCount++
      return { ...n, status: newStatus }
    })
    if (renamedCount > 0) {
      console.log(`[migrate] v115→v116: renamed NoteStatus on ${renamedCount} notes`)
    }
  }
  // (viewStateByContext key rename happens early — see "v116 (early-bird)" block above —
  // because normalizeViewStatesMap iterates only VALID_VIEW_CONTEXT_KEYS.)

  // v117: Inbox layer slice (Phase B PR inbox-1).
  // Initialize empty inbox tracking arrays for users upgrading from v116.
  // Idempotent — existing arrays preserved.
  if (!Array.isArray(state.dismissedInboxItems)) {
    state.dismissedInboxItems = []
  }
  if (!Array.isArray(state.snoozedInboxItems)) {
    state.snoozedInboxItems = []
  }

  // v118: Activity bar collapse (mockup spec — `data-actbar="open|collapsed"`).
  // Initialize false (open) for users upgrading from v117. Idempotent.
  if (typeof state.activitybarCollapsed !== "boolean") {
    state.activitybarCollapsed = false
  }

  // v119: Remove Studio + Editorial view modes (영구 규칙 #1 cleanup).
  // Convert viewMode "studio" / "editorial" → "list" in savedViews + viewStateByContext.
  // Idempotent — re-running is safe.
  {
    // savedViews fallback
    if (state.savedViews && Array.isArray(state.savedViews)) {
      state.savedViews = (state.savedViews as Record<string, unknown>[]).map((v) => {
        const viewState = v.viewState as Record<string, unknown> | undefined
        if (viewState && (viewState.viewMode === "studio" || viewState.viewMode === "editorial")) {
          return { ...v, viewState: { ...viewState, viewMode: "list" } }
        }
        return v
      })
    }
    // viewStateByContext fallback
    if (state.viewStateByContext && typeof state.viewStateByContext === "object") {
      const vsMap = state.viewStateByContext as Record<string, Record<string, unknown>>
      let resetCount = 0
      for (const key of Object.keys(vsMap)) {
        const vs = vsMap[key]
        if (vs && (vs.viewMode === "studio" || vs.viewMode === "editorial")) {
          vs.viewMode = "list"
          resetCount++
        }
      }
      if (resetCount > 0) {
        console.log(`[migrate] v118→v119: reset ${resetCount} contexts from studio/editorial → list`)
      }
    }
  }

  // v120: Book entity infrastructure (Phase 1).
  // Initialize empty books array for users upgrading from v119. Idempotent —
  // existing array preserved, only seeds when missing/wrong-type.
  if (!Array.isArray(state.books)) {
    state.books = []
  }

  // v121: Smart Book — initialize smartSources/excludeIds defaults.
  // Idempotent: only seeds when missing. Existing arrays preserved.
  // Spec: `.omc/plans/smart-book-prd.md` §3 LOCKED #7.
  if (Array.isArray(state.books)) {
    state.books = state.books.map((book: any) => ({
      ...book,
      smartSources: Array.isArray(book.smartSources) ? book.smartSources : [],
      excludeIds: Array.isArray(book.excludeIds) ? book.excludeIds : [],
    }))
  }

  // v122: Dual mode polished off. viewMode === "dual" → "list".
  // Idempotent: only mutates state when a stale "dual" value is found.
  if (state.viewStateByContext && typeof state.viewStateByContext === "object") {
    const ctx = state.viewStateByContext as Record<string, { viewMode?: string } | undefined>
    for (const key of Object.keys(ctx)) {
      const entry = ctx[key]
      if (entry && entry.viewMode === "dual") {
        entry.viewMode = "list"
      }
    }
  }
  if (Array.isArray(state.savedViews)) {
    state.savedViews = (state.savedViews as Array<Record<string, unknown>>).map((v) => {
      const vs = v.viewState as { viewMode?: string } | undefined
      if (vs && vs.viewMode === "dual") {
        return { ...v, viewState: { ...vs, viewMode: "list" } }
      }
      return v
    })
  }

  // v123: Books view-engine integration (PR books-view-engine-1).
  // Adding "books" to VALID_VIEW_CONTEXT_KEYS causes normalizeViewStatesMap
  // (called above at v16 step) to auto-seed viewStateByContext.books with
  // the CONTEXT_DEFAULTS entry on the next rehydration — no explicit data
  // migration needed here. Version bump documents the boundary.
  // Spec: `.omc/plans/books-view-engine-integration.md` §8 (PR 1).

  // v124: Books list mode + sort/group/filter UI (PR books-view-engine-2).
  // Adds SortField "itemCount", FilterField "kind"/"sourceType", expanded
  // visibleColumns for books context. All type union extensions — no data
  // migration needed. Existing user viewState.books preserved through
  // normalizeViewState (filters out unknown values gracefully). PR 2 also
  // introduces pinned-first sort in useBooksView, which only affects display
  // order; persisted state untouched.
  // Spec: `.omc/plans/books-view-engine-integration.md` §8 (PR 2).

  // v125: Books board mode + kind/pinned grouping (PR books-view-engine-3).
  // Adds GroupBy "kind"/"pinned" + view-config supportedModes "board".
  // No data migration — type union extensions only. groupOrder persistence
  // continues to round-trip through normalizeViewState. Card drag/drop in
  // groupBy=pinned toggles book.pinned (immediate); groupBy=kind requires
  // confirmation for smart→manual conversion (clears smartSources only).
  // Spec: `.omc/plans/books-view-engine-integration.md` §8 (PR 3).

  // v126: Books gallery mode (PR books-view-engine-4).
  // Adds view-config supportedModes "gallery". BooksGalleryAdapter maps
  // Book + BookGroup into the entity-agnostic GalleryView (2026-05-11
  // 영구 결정 — Notes/Wiki/References 패턴). Click = full editor (Plot
  // standard). No data migration.
  // Spec: `.omc/plans/books-view-engine-integration.md` §8 (PR 4).

  // v127: SEED_BOOKS one-time backfill for existing users (idempotent
  // id-dedup append). Manual-verify demo set ships now that the
  // view-engine series is merged, but existing users with at least one
  // book (e.g. the "1234" they created during testing) miss the
  // onRehydrateStorage backfill which only triggers on empty arrays.
  // This appends missing seed books while preserving everything the user
  // created. Runs once per user — `migrate` is gated by persisted version.
  if (!Array.isArray(state.books)) state.books = []
  {
    const books = state.books as any[]
    const existingBookIds = new Set(books.map((b: any) => b?.id))
    for (const seed of SEED_BOOKS) {
      if (!existingBookIds.has(seed.id)) {
        books.push(seed)
      }
    }
  }

  // v128: Books DisplayPanel polish (PR books-view-engine-6).
  // normalizeViewStatesMap (called above at v16 step) now rejects context-
  // invalid GroupBy values — e.g. stale "status" on books context. Version
  // bump re-triggers the normalize pass; no explicit migration code needed.
  // Spec: `.omc/plans/books-view-engine-integration.md` §8 (PR 6 polish).

  // v129: Books emoji 영구 폐기 (2026-05-12 사용자 결정).
  // Plot 미니멀리즘 정합 — Apple/Unicode emoji 시스템 vs Phosphor outline
  // icon 시스템 mismatch. BookKindIcon이 cover 책임. 모든 사용자 books
  // coverEmoji 필드 wipe — IDB 잔존 emoji 표시 제거. Book.coverEmoji 타입
  // 필드는 보존 (round-trip 호환), 단 UI 코드 어디서도 읽지 않음.
  // 미래 Phosphor icon picker 도입 시 Book.coverIcon 신규 필드.
  if (Array.isArray(state.books)) {
    for (const b of state.books as any[]) {
      if (b && "coverEmoji" in b) {
        b.coverEmoji = null
      }
    }
  }

  // v130: SEED_WIKI_ARTICLES backfill — Wiki UX verify (2026-05-12 cherry-pick
  // 42c6e59 follow-up). 기존 사용자가 wiki seed 3개만 있어서 Wiki UX 3 이슈 fix
  // (우클릭/플로팅바/갤러리) 시각 verify가 어려웠음. id-dedup append 패턴 (Books
  // v127 정합) — 사용자 기존 articles 보존 + 누락 seed만 push.
  if (Array.isArray(state.wikiArticles)) {
    const { SEED_WIKI_ARTICLES } = require("./seeds")
    const existingIds = new Set((state.wikiArticles as any[]).map((a: any) => a.id))
    for (const seed of SEED_WIKI_ARTICLES) {
      if (!existingIds.has(seed.id)) {
        ;(state.wikiArticles as any[]).push(seed)
      }
    }
  }

  // v131: NoteStatus garbage cleanup — 2026-05-12 board-drag salvage.
  //
  // notes-board.tsx bound `useSortable("col-${key}")` AND `useDroppable("${key}")`
  // to the same DOM node (column outer container). dnd-kit's collision
  // detection sometimes reported the sortable id, so the card-drop handler
  // wrote strings like "col-stone" into `note.status`. At render time
  // StatusShapeIcon fell into its else-branch (Cuboid/Block) while
  // StatusBadge's `STATUS_CONFIG[status] ?? STATUS_CONFIG.brick` fallback
  // rendered the chip as "Brick" — producing the icon/chip mismatch the
  // user reported (SESSION-LOG #2 "Status icon stale").
  //
  // notes-board now strips the "col-" prefix before status update. This
  // migration repairs already-corrupted IDB entries: anything outside the
  // valid stone/brick/keystone enum is restored. Legacy v116 enums are
  // re-mapped as a belt-and-suspenders pass; "col-stone" style garbage is
  // stripped back to the bare key; everything else falls back to "stone"
  // (the safe inbox-equivalent). Idempotent — valid notes pass through.
  if (Array.isArray(state.notes)) {
    const VALID_STATUSES = new Set(["stone", "brick", "keystone"])
    let repairedCount = 0
    state.notes = (state.notes as Record<string, unknown>[]).map((n) => {
      const s = n.status as string
      if (typeof s === "string" && VALID_STATUSES.has(s)) return n
      let recovered = "stone"
      if (s === "inbox") recovered = "stone"
      else if (s === "capture") recovered = "brick"
      else if (s === "permanent") recovered = "keystone"
      else if (typeof s === "string" && s.startsWith("col-")) {
        const stripped = s.slice(4)
        if (VALID_STATUSES.has(stripped)) recovered = stripped
      }
      repairedCount++
      return { ...n, status: recovered }
    })
    if (repairedCount > 0) {
      console.log(`[migrate] v130→v131: repaired NoteStatus on ${repairedCount} notes`)
    }
  }

  // v132: folderIds garbage cleanup — same dnd-kit root cause as v131.
  //
  // notes-board's card-on-folder-column drop wrote strings like
  // "col-folder-1" or "col-_no_folder" into `note.folderIds`. The board
  // handler now strips the "col-" prefix, but already-corrupted memberships
  // need explicit repair: drop any folderIds that don't resolve to a real
  // folder. The `_no_folder` sentinel never appears in `folderIds` (it's
  // the "clear membership" branch in getFieldUpdate), so any folderId not
  // present in `state.folders` is garbage. Idempotent — clean folderIds
  // pass through untouched.
  if (Array.isArray(state.notes) && Array.isArray(state.folders)) {
    const validFolderIds = new Set(
      (state.folders as Array<{ id: string }>).map((f) => f.id)
    )
    let cleanedCount = 0
    state.notes = (state.notes as Record<string, unknown>[]).map((n) => {
      const ids = n.folderIds
      if (!Array.isArray(ids)) return n
      const filtered = (ids as string[]).filter((fid) => validFolderIds.has(fid))
      if (filtered.length === ids.length) return n
      cleanedCount++
      return { ...n, folderIds: filtered }
    })
    if (cleanedCount > 0) {
      console.log(`[migrate] v131→v132: cleaned garbage folderIds on ${cleanedCount} notes`)
    }
  }

  // Same garbage pattern can land in wikiArticles.folderIds — repair both.
  if (Array.isArray(state.wikiArticles) && Array.isArray(state.folders)) {
    const validFolderIds = new Set(
      (state.folders as Array<{ id: string }>).map((f) => f.id)
    )
    let cleanedCount = 0
    state.wikiArticles = (state.wikiArticles as Record<string, unknown>[]).map((w) => {
      const ids = w.folderIds
      if (!Array.isArray(ids)) return w
      const filtered = (ids as string[]).filter((fid) => validFolderIds.has(fid))
      if (filtered.length === ids.length) return w
      cleanedCount++
      return { ...w, folderIds: filtered }
    })
    if (cleanedCount > 0) {
      console.log(`[migrate] v131→v132: cleaned garbage folderIds on ${cleanedCount} wiki articles`)
    }
  }

  // v133: entity-unification — noteEvents → entityEvents. NoteEvent { noteId }
  // → EntityEvent { entity: { kind: "note", id: noteId } }. Idempotent (재실행
  // 안전 — noteEvents 없으면 skip). 데이터 손실 없음 (1:1 매핑).
  // Detail: .omc/plans/activity-unification-prd.md §4
  {
    const old = (state as { noteEvents?: unknown }).noteEvents
    if (Array.isArray(old)) {
      const migrated = (old as Array<{ id?: string; noteId?: string; type?: string; at?: string; meta?: unknown }>).reduce<
        Array<{ id: string; entity: { kind: "note"; id: string }; type: string; at: string; meta?: unknown }>
      >((acc, e) => {
        if (!e?.id || !e?.noteId || !e?.type || !e?.at) return acc
        acc.push({
          id: e.id,
          entity: { kind: "note", id: e.noteId },
          type: e.type,
          at: e.at,
          meta: e.meta,
        })
        return acc
      }, [])
      ;(state as Record<string, unknown>).entityEvents = migrated
      delete (state as Record<string, unknown>).noteEvents
      if (migrated.length > 0) {
        console.log(`[migrate] v132→v133: noteEvents → entityEvents (${migrated.length} events; entity.kind="note")`)
      }
    } else if (!(state as { entityEvents?: unknown }).entityEvents) {
      // Fresh state without either field — initialize.
      ;(state as Record<string, unknown>).entityEvents = []
    }
  }

  // v134: SEED_WIKI_ARTICLES + SEED_WIKI_CATEGORIES backfill — 2026-05-16.
  // PR #347 bumped the wiki seed from ~7 to 17 articles + 10 categories
  // (Wiki entity-uniformity testing). The v130 backfill only fires for
  // users still on v129 or earlier, so users already on v130-v133 stayed
  // on the older, sparser seed. v134 re-applies the same id-dedup append
  // pattern: existing user content is preserved, only missing seed ids
  // are pushed. Idempotent.
  if (Array.isArray(state.wikiArticles)) {
    const { SEED_WIKI_ARTICLES, SEED_WIKI_CATEGORIES } = require("./seeds")
    const existingArticleIds = new Set((state.wikiArticles as any[]).map((a: any) => a.id))
    let addedArticles = 0
    for (const seed of SEED_WIKI_ARTICLES) {
      if (!existingArticleIds.has(seed.id)) {
        ;(state.wikiArticles as any[]).push(seed)
        addedArticles += 1
      }
    }
    if (Array.isArray((state as Record<string, unknown>).wikiCategories)) {
      const cats = (state as Record<string, unknown>).wikiCategories as any[]
      const existingCatIds = new Set(cats.map((c: any) => c.id))
      let addedCats = 0
      for (const seed of SEED_WIKI_CATEGORIES) {
        if (!existingCatIds.has(seed.id)) {
          cats.push(seed)
          addedCats += 1
        }
      }
      if (addedArticles > 0 || addedCats > 0) {
        console.log(`[migrate] v133→v134: re-seeded wiki (${addedArticles} articles, ${addedCats} categories)`)
      }
    }
  }

  // v135: wiki seed tag backfill — v134 backfill로 push된 wiki-8~17이 빈
  // tags로 들어가서 Tag sub-page에서 보이지 않던 문제 fix (2026-05-16).
  // 명시적으로 사용자가 비운 tags가 아닌 시드 부족 케이스만 보강:
  //   - 조건: 해당 wiki id에 SEED_WIKI_ARTICLES 일치 항목이 있고
  //   - 현재 article.tags가 빈 배열이고
  //   - seed.tags가 비어있지 않음
  // 사용자가 명시적으로 tag를 모두 지운 wiki도 영향받지만, 시드는 비어있던
  // tag만 보강하므로 그 경우는 보강 안 됨 (idempotent + 데이터 보존).
  if (Array.isArray(state.wikiArticles)) {
    const { SEED_WIKI_ARTICLES } = require("./seeds")
    let filledCount = 0
    for (const article of state.wikiArticles as any[]) {
      if (!Array.isArray(article.tags) || article.tags.length > 0) continue
      const seed = SEED_WIKI_ARTICLES.find((s: any) => s.id === article.id)
      if (seed && Array.isArray(seed.tags) && seed.tags.length > 0) {
        article.tags = [...seed.tags]
        filledCount += 1
      }
    }
    if (filledCount > 0) {
      console.log(`[migrate] v134→v135: filled tags on ${filledCount} wiki articles from seed`)
    }
  }

  // v136: SEED_NOTES backfill — Tag sub-page cross-entity 검증 시 사용자 IDB에
  // demo 노트가 없어서 Notes 섹션이 비어 보이던 문제 (2026-05-16). wiki와 동일한
  // id-dedup append 패턴 (v130/v134 정합). 기존 사용자 노트는 그대로 보존, 누락
  // 시드 id만 push. 사용자가 명시적으로 삭제한 노트가 있어도 trashed:false로
  // 다시 들어오지 않음 (id가 이미 store에 있으면 skip).
  if (Array.isArray(state.notes)) {
    const { SEED_NOTES } = require("./seeds")
    const existingIds = new Set((state.notes as any[]).map((n: any) => n.id))
    let addedNotes = 0
    for (const seed of SEED_NOTES) {
      if (!existingIds.has(seed.id)) {
        ;(state.notes as any[]).push(seed)
        addedNotes += 1
      }
    }
    if (addedNotes > 0) {
      console.log(`[migrate] v135→v136: re-seeded notes (${addedNotes} added)`)
    }
  }

  // v137: Label/Category cross-entity 확장 — 2026-05-17.
  // 사용자 결정 (영구 LOCKED): Label/Category/Tag는 모두 orthogonal 독립
  // 메커니즘. 각 entity에 자유 부여 가능 (없어도 OK). Note/Wiki/Book
  // 공통 패턴.
  // 새 필드:
  //   - WikiArticle.labelId   (단일, color marker)
  //   - Book.labelId          (단일)
  //   - Book.categoryIds      (다중, WikiCategory 풀 공유)
  //   - Book.tags             (다중 — manual tag 부여)
  //   - Note.categoryIds      (다중, WikiCategory 풀 공유)
  // 모두 optional → 기본 default 안 채워도 작동, 단 안전 위해 명시 채움.
  // 사용자 데이터 보존: 기존 field가 있으면 보존, 없을 때만 default.
  if (Array.isArray(state.wikiArticles)) {
    for (const w of state.wikiArticles as any[]) {
      if (!("labelId" in w)) w.labelId = null
    }
  }
  if (Array.isArray(state.books)) {
    for (const b of state.books as any[]) {
      if (!("labelId" in b)) b.labelId = null
      if (!Array.isArray(b.categoryIds)) b.categoryIds = []
      if (!Array.isArray(b.tags)) b.tags = []
    }
  }
  if (Array.isArray(state.notes)) {
    let touched = 0
    for (const n of state.notes as any[]) {
      if (!Array.isArray(n.categoryIds)) {
        n.categoryIds = []
        touched += 1
      }
    }
    if (touched > 0) {
      console.log(`[migrate] v136→v137: initialized categoryIds on ${touched} notes (cross-entity Category 확장)`)
    }
  }

  // v138: WikiArticle.trashedAt default null — 2026-05-18.
  // Wiki Delete를 Note 패턴 (Trash 거쳐 hard delete 2단)으로 정합한 따라
  // 기존 wikiArticles에 trashedAt 필드가 없으면 null로 채움. trashed=true는
  // 사용자 데이터 그대로 보존. optional 필드라 strict 필수는 아니지만
  // 명시적 default가 display/sort 안정성 보장.
  if (Array.isArray(state.wikiArticles)) {
    let touched = 0
    for (const w of state.wikiArticles as any[]) {
      if (!("trashedAt" in w)) {
        // 사용자가 이미 trashed:true인 경우 (사전 IDB) trashedAt 추정 안 함 — null 유지.
        // 새로운 trashWikiArticle() 호출만 정확한 timestamp 기록.
        w.trashedAt = null
        touched += 1
      }
    }
    if (touched > 0) {
      console.log(`[migrate] v137→v138: initialized trashedAt on ${touched} wiki articles (soft delete 정합)`)
    }
  }

  // v139: WikiTemplate 시스템 신설 — 2026-05-18.
  // state.wikiTemplates 신규 슬라이스 + SEED_WIKI_TEMPLATES 8개 inject.
  // 기존 사용자 데이터 보존 — id-dedup append (Note seed migration v130 정합).
  // 사용자가 시드를 삭제했더라도 v139 첫 진입 시 다시 들어옴 (idempotent 후속
  // 동작이 사용자 데이터를 보존하면서 fresh start 보장).
  {
    const { SEED_WIKI_TEMPLATES } = require("./seeds")
    if (!Array.isArray((state as Record<string, unknown>).wikiTemplates)) {
      ;(state as Record<string, unknown>).wikiTemplates = [...SEED_WIKI_TEMPLATES]
      console.log(`[migrate] v138→v139: initialized wikiTemplates (${SEED_WIKI_TEMPLATES.length} seeds)`)
    } else {
      const wts = (state as Record<string, unknown>).wikiTemplates as any[]
      const existingIds = new Set(wts.map((t: any) => t.id))
      let added = 0
      for (const seed of SEED_WIKI_TEMPLATES) {
        if (!existingIds.has(seed.id)) {
          wts.push(seed)
          added += 1
        }
      }
      if (added > 0) {
        console.log(`[migrate] v138→v139: re-seeded wikiTemplates (${added} added)`)
      }
    }
  }

  // v139 → v140: PR-D. Initialize `userInfoboxPresets` empty array.
  // No seed (builtin presets remain hardcoded in lib/wiki-infobox-presets.ts);
  // this slice only holds *user-saved* presets, which start empty.
  if (!Array.isArray((state as Record<string, unknown>).userInfoboxPresets)) {
    ;(state as Record<string, unknown>).userInfoboxPresets = []
    console.log(`[migrate] v139→v140: initialized userInfoboxPresets ([])`)
  }

  // v140 → v141: PR-C. Infobox hero image (Tier 1-3) — optional field on
  // WikiArticle (`infoboxHero`), Note (`wikiInfoboxHero`), and WikiTemplate
  // (`infoboxHero`). Field defaults to undefined; no existing-data migration
  // needed. Version bump alone is the migration (sentinel for cache safety).
  console.log(`[migrate] v140→v141: infoboxHero field opt-in (no data change)`)

  // v141 → v142: PR-E1. Hatnotes field opt-in (no data change).
  // WikiArticle.hatnotes is optional and defaults to undefined; no existing-data
  // migration needed. Version bump alone is the migration (sentinel for cache safety).
  console.log(`[migrate] v141→v142: hatnotes field opt-in (no data change)`)

  // v142 → v143: PR-E2. Theme color field opt-in (no data change).
  // WikiArticle.themeColor is optional and defaults to undefined; no existing-data
  // migration needed. Version bump alone is the migration (sentinel for cache safety).
  console.log(`[migrate] v142→v143: themeColor field opt-in (no data change)`)

  // v143 → v144: Plan A++ Phase 2. Library Views section 제거 + Categories own
  // view. PR #385에서 추가된 SavedView.space "library"는 실제로는 wiki-view 안
  // categoryOverview UI 위에서 저장됐으므로 Categories own view space로 re-tag.
  // Library hub 자체는 cross-entity 분류 hub로 own view 없음 (#386 brainstorming).
  if (Array.isArray(state.savedViews)) {
    let touched = 0
    state.savedViews = (state.savedViews as Record<string, unknown>[]).map((v) => {
      if (v.space === "library") {
        touched += 1
        return { ...v, space: "library-categories" }
      }
      return v
    })
    if (touched > 0) {
      console.log(`[migrate] v143→v144: re-tagged ${touched} SavedView(s) "library" → "library-categories"`)
    }
  }

  return state as unknown as PlotState
}
