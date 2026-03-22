import type { Note, NoteBody, Folder, Tag, Label, NoteTemplate, ActiveView, NoteEvent, Thread, AutopilotRule, AutopilotLogEntry, Relation, RelationType, Attachment, CoOccurrence, RelationSuggestion, WikiInfoboxEntry, Reflection, StubSource, WikiStatus, WikiCollectionItem, SavedView, WikiArticle, WikiBlock } from "../types"
import type { SRSState, SRSRating } from "@/lib/srs"
import type { ViewState, ViewContextKey } from "../view-engine/types"
import type { WorkspaceNode, WorkspacePreset, PanelContent, SplitDirection, DropZone } from "../workspace/types"

export interface EditorTab {
  id: string           // nanoid
  noteId: string
  isPinned?: boolean
}

export interface EditorPanel {
  id: string           // "panel-left" | "panel-right"
  tabs: EditorTab[]
  activeTabId: string | null
}

export interface EditorState {
  panels: EditorPanel[]
  activePanelId: string
  splitMode: boolean
  splitRatio: number   // 0.2~0.8, default 0.5
  panelRatios: number[]  // for 3-panel mode, e.g. [0.33, 0.33, 0.34]
}

export interface PlotState {
  // ── Data ──
  notes: Note[]
  folders: Folder[]
  tags: Tag[]
  labels: Label[]
  editorState: EditorState

  // ── UI State ──
  activeView: ActiveView
  selectedNoteId: string | null
  searchQuery: string
  searchOpen: boolean
  shortcutOverlayOpen: boolean
  detailsOpen: boolean

  // Merge
  mergePickerOpen: boolean
  mergePickerSourceId: string | null

  // Link
  linkPickerOpen: boolean
  linkPickerSourceId: string | null

  // Side Peek
  sidePeekNoteId: string | null

  // Navigation History
  navigationHistory: string[]  // stack of note IDs
  navigationIndex: number      // current position (-1 = empty)

  // Sidebar
  sidebarWidth: number
  sidebarLastWidth: number
  sidebarCollapsed: boolean
  sidebarPeek: boolean

  // View Engine
  viewStateByContext: Record<ViewContextKey, ViewState>
  _viewStateHydrated: boolean

  // Phase 2 state
  noteEvents: NoteEvent[]
  threads: Thread[]
  graphFocusDepth: number
  commandPaletteMode: "commands" | "links"

  // Reflections
  reflections: Reflection[]

  // Relations
  relations: Relation[]
  attachments: Attachment[]
  coOccurrences: CoOccurrence[]
  relationSuggestions: RelationSuggestion[]

  // Layout
  listPaneWidth: number  // 200~500

  // SRS
  srsStateByNoteId: Record<string, SRSState>

  // ── Autopilot ──
  autopilotEnabled: boolean
  autopilotRules: AutopilotRule[]
  autopilotLog: AutopilotLogEntry[]

  // ── Templates ──
  templates: NoteTemplate[]

  // ── Wiki Collections ──
  wikiCollections: Record<string, WikiCollectionItem[]>  // key = wikiNoteId

  // ── Saved Views ──
  savedViews: SavedView[]

  // ── Wiki Articles (Assembly Model) ──
  wikiArticles: WikiArticle[]

  // ── Note Actions ──
  createNote: (partial?: Partial<Note>) => string
  updateNote: (id: string, updates: Partial<Note>) => void
  batchUpdateNotes: (ids: string[], updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  duplicateNote: (id: string) => void
  mergeNotes: (targetId: string, sourceIds: string[]) => void
  togglePin: (id: string) => void
  toggleArchive: (id: string) => void
  toggleTrash: (id: string) => void
  touchNote: (id: string) => void
  createChainNote: (parentId: string) => string

  // ── Workflow / Triage ──
  triageKeep: (id: string) => void
  triageSnooze: (id: string, reviewAt: string) => void
  triageTrash: (id: string) => void
  promoteToPermanent: (id: string) => void
  undoPromote: (id: string) => void
  moveBackToInbox: (id: string) => void
  setReminder: (id: string, reviewAt: string) => void
  clearReminder: (id: string) => void
  batchSetReminder: (ids: string[], reviewAt: string) => void

  // ── SRS ──
  reviewSRS: (noteId: string, rating: SRSRating) => void
  enrollSRS: (noteId: string) => void
  unenrollSRS: (noteId: string) => void
  enrollAllPermanentSRS: () => number

  // ── Autopilot ──
  createAutopilotRule: (rule: Omit<AutopilotRule, "id" | "createdAt" | "updatedAt">) => string
  updateAutopilotRule: (id: string, updates: Partial<AutopilotRule>) => void
  deleteAutopilotRule: (id: string) => void
  toggleAutopilotRule: (id: string) => void
  setAutopilotEnabled: (enabled: boolean) => void
  runAutopilotOnNote: (noteId: string) => AutopilotLogEntry | null
  undoAutopilotAction: (logEntryId: string) => boolean
  clearAutopilotLog: () => void

  // ── Templates ──
  createTemplate: (template: Omit<NoteTemplate, "id" | "createdAt" | "updatedAt">) => string
  updateTemplate: (id: string, updates: Partial<NoteTemplate>) => void
  deleteTemplate: (id: string) => void
  restoreTemplate: (id: string) => void
  permanentlyDeleteTemplate: (id: string) => void
  toggleTemplatePin: (id: string) => void
  createNoteFromTemplate: (templateId: string) => string

  // ── Folders ──
  createFolder: (name: string, color: string, opts?: Partial<Folder>) => void
  updateFolder: (id: string, updates: Partial<Folder>) => void
  deleteFolder: (id: string) => void
  accessFolder: (id: string) => void
  toggleFolderPin: (id: string) => void

  // ── Tags ──
  createTag: (name: string, color: string) => void
  updateTag: (id: string, updates: Partial<Tag>) => void
  deleteTag: (id: string) => void
  restoreTag: (id: string) => void
  permanentlyDeleteTag: (id: string) => void
  addTagToNote: (noteId: string, tagId: string) => void
  removeTagFromNote: (noteId: string, tagId: string) => void

  // ── Labels ──
  createLabel: (name: string, color: string) => void
  updateLabel: (id: string, updates: Partial<Label>) => void
  deleteLabel: (id: string) => void
  restoreLabel: (id: string) => void
  permanentlyDeleteLabel: (id: string) => void
  setNoteLabel: (noteId: string, labelId: string | null) => void

  // ── UI Actions ──
  setActiveView: (view: ActiveView) => void
  setSelectedNoteId: (id: string | null) => void
  openNote: (id: string, opts?: { forceNewTab?: boolean }) => void
  setSearchQuery: (query: string) => void
  setSearchOpen: (open: boolean) => void
  setShortcutOverlayOpen: (open: boolean) => void
  setDetailsOpen: (open: boolean) => void
  toggleDetailsOpen: () => void
  setSidebarWidth: (width: number) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarPeek: (peek: boolean) => void
  restoreSidebar: () => void
  goBack: () => boolean
  goForward: () => boolean
  setViewState: (ctx: ViewContextKey, patch: Partial<ViewState>) => void
  setListPaneWidth: (width: number) => void
  setSidePeekNoteId: (id: string | null) => void
  setMergePickerOpen: (open: boolean, sourceId?: string | null) => void
  setLinkPickerOpen: (open: boolean, sourceId?: string | null) => void

  // ── Reflections ──
  addReflection: (noteId: string, text: string) => string

  // ── Thread ──
  startThread: (noteId: string) => string
  addThreadStep: (threadId: string, text: string) => void
  endThread: (threadId: string) => void
  deleteThread: (threadId: string) => void
  addWikiLink: (noteId: string, targetTitle: string) => void
  setGraphFocusDepth: (depth: number) => void
  setCommandPaletteMode: (mode: "commands" | "links") => void

  // ── Relations ──
  addRelation: (sourceNoteId: string, targetNoteId: string, type: RelationType) => string | null
  removeRelation: (relationId: string) => void
  updateRelationType: (relationId: string, newType: RelationType) => void

  // Attachments
  addAttachment: (partial: Omit<Attachment, "id" | "createdAt">) => string
  removeAttachment: (attachmentId: string) => void

  // Wiki
  setNoteAliases: (noteId: string, aliases: string[]) => void
  setWikiInfobox: (noteId: string, infobox: WikiInfoboxEntry[]) => void
  createWikiStub: (title: string, aliases?: string[], stubSource?: StubSource) => string
  convertToWiki: (noteId: string, stubSource?: StubSource) => void
  revertFromWiki: (noteId: string) => void
  setWikiStatus: (noteId: string, wikiStatus: WikiStatus) => void

  // Wiki Collections
  addToCollection: (wikiNoteId: string, item: Omit<WikiCollectionItem, 'id' | 'addedAt'>) => void
  removeFromCollection: (wikiNoteId: string, itemId: string) => void
  reorderCollection: (wikiNoteId: string, itemIds: string[]) => void
  clearCollection: (wikiNoteId: string) => void

  // ── Saved Views ──
  createSavedView: (name: string, viewState?: Partial<SavedView['viewState']>, space?: SavedView['space']) => string
  updateSavedView: (id: string, updates: Partial<SavedView>) => void
  deleteSavedView: (id: string) => void

  // ── Wiki Articles (Assembly Model) ──
  createWikiArticle: (partial: { title: string; aliases?: string[]; wikiStatus?: WikiStatus; stubSource?: StubSource; tags?: string[]; blocks?: WikiBlock[] }) => string
  updateWikiArticle: (articleId: string, patch: Partial<Omit<WikiArticle, "id" | "createdAt">>) => void
  deleteWikiArticle: (articleId: string) => void
  setWikiArticleStatus: (articleId: string, wikiStatus: WikiStatus) => void
  setWikiArticleInfobox: (articleId: string, infobox: WikiArticle["infobox"]) => void
  addWikiBlock: (articleId: string, block: Omit<WikiBlock, "id">, afterBlockId?: string) => string
  removeWikiBlock: (articleId: string, blockId: string) => void
  updateWikiBlock: (articleId: string, blockId: string, patch: Partial<Omit<WikiBlock, "id">>) => void
  moveWikiBlock: (articleId: string, blockId: string, targetIndex: number) => void
  reorderWikiBlocks: (articleId: string, blockIds: string[]) => void

  // Ontology
  ontologyPositions: Record<string, { x: number; y: number }>
  updateOntologyPositions: (positions: Record<string, { x: number; y: number }>) => void
  updateCoOccurrences: (items: CoOccurrence[]) => void
  addRelationSuggestion: (partial: Omit<RelationSuggestion, "id" | "createdAt" | "status">) => string
  acceptRelationSuggestion: (id: string, typeOverride?: RelationType) => void
  dismissRelationSuggestion: (id: string) => void

  // ── Editor Tabs ──
  openNoteInTab: (noteId: string, panelId?: string) => void
  closeTab: (tabId: string, panelId: string) => void
  closeOtherTabs: (tabId: string, panelId: string) => void
  setActiveTab: (tabId: string, panelId: string) => void
  setActivePanel: (panelId: string) => void
  toggleSplit: () => void
  moveTabToPanel: (tabId: string, fromPanelId: string, toPanelId: string) => void
  togglePinTab: (tabId: string, panelId: string) => void
  setSplitRatio: (ratio: number) => void
  addPanel: () => void
  removePanel: (panelId: string) => void
  setPanelRatios: (ratios: number[]) => void

  // ── Workspace ──
  workspaceRoot: WorkspaceNode
  activeLeafId: string | null
  setWorkspaceRoot: (root: WorkspaceNode) => void
  setActiveLeaf: (leafId: string) => void
  setLeafContent: (leafId: string, content: PanelContent) => void
  splitLeaf: (leafId: string, direction: SplitDirection, content: PanelContent, position?: "before" | "after") => void
  closeLeaf: (leafId: string) => void
  setBranchRatio: (branchId: string, ratio: number) => void
  openNoteInLeaf: (noteId: string, leafId?: string, forceNewTab?: boolean) => void
  closeTabInLeaf: (tabId: string, leafId: string) => void
  setActiveTabInLeaf: (tabId: string, leafId: string) => void
  moveTabToLeaf: (tabId: string, fromLeafId: string, toLeafId: string) => void
  splitTabToNewLeaf: (tabId: string, fromLeafId: string, targetLeafId: string, direction: SplitDirection, position: "before" | "after") => void
  moveLeaf: (leafId: string, targetLeafId: string, zone: DropZone) => void
  applyPreset: (preset: WorkspacePreset) => void

  // ── Internal ──
  _hydrateNoteBodies: (bodies: NoteBody[]) => void
}
