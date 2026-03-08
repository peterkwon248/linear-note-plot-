import type { Note, NoteBody, Folder, Tag, Category, ActiveView, NoteEvent, ThinkingChainSession, KnowledgeMap, Project } from "../types"
import type { SRSState, SRSRating } from "@/lib/srs"
import type { ViewState, ViewContextKey } from "../view-engine/types"

export interface PlotState {
  // ── Data ──
  notes: Note[]
  projects: Project[]
  folders: Folder[]
  tags: Tag[]
  categories: Category[]

  // ── UI State ──
  activeView: ActiveView
  selectedNoteId: string | null
  searchQuery: string
  searchOpen: boolean
  shortcutOverlayOpen: boolean
  detailsOpen: boolean

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
  thinkingChains: ThinkingChainSession[]
  graphFocusDepth: number
  commandPaletteMode: "search" | "commands" | "links"

  // Phase 3: Knowledge Maps
  knowledgeMaps: KnowledgeMap[]

  // SRS
  srsStateByNoteId: Record<string, SRSState>

  // Alerts
  dismissedAlertIds: string[]

  // ── Note Actions ──
  createNote: (partial?: Partial<Note>) => string
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  duplicateNote: (id: string) => void
  togglePin: (id: string) => void
  toggleArchive: (id: string) => void
  toggleTrash: (id: string) => void
  touchNote: (id: string) => void
  createChainNote: (parentId: string) => string

  // ── Workflow / Triage ──
  triageKeep: (id: string) => void
  triageSnooze: (id: string, reviewAt: string) => void
  triageTrash: (id: string) => void
  promoteToPermament: (id: string) => void
  undoPromote: (id: string) => void
  moveBackToInbox: (id: string) => void

  // ── SRS ──
  reviewSRS: (noteId: string, rating: SRSRating) => void
  enrollSRS: (noteId: string) => void
  unenrollSRS: (noteId: string) => void
  enrollAllPermanentSRS: () => number

  // ── Folders ──
  createFolder: (name: string, color: string) => void
  updateFolder: (id: string, updates: Partial<Folder>) => void
  deleteFolder: (id: string) => void

  // ── Tags ──
  createTag: (name: string, color: string) => void
  updateTag: (id: string, updates: Partial<Tag>) => void
  deleteTag: (id: string) => void
  addTagToNote: (noteId: string, tagId: string) => void
  removeTagFromNote: (noteId: string, tagId: string) => void

  // ── Categories ──
  createCategory: (name: string, color: string) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void

  // ── UI Actions ──
  setActiveView: (view: ActiveView) => void
  setSelectedNoteId: (id: string | null) => void
  openNote: (id: string) => void
  setSearchQuery: (query: string) => void
  setSearchOpen: (open: boolean) => void
  setShortcutOverlayOpen: (open: boolean) => void
  setDetailsOpen: (open: boolean) => void
  toggleDetailsOpen: () => void
  setSidebarWidth: (width: number) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarPeek: (peek: boolean) => void
  restoreSidebar: () => void
  setViewState: (ctx: ViewContextKey, patch: Partial<ViewState>) => void

  // ── Thinking Chain ──
  startThinkingChain: (noteId: string) => string
  addThinkingStep: (chainId: string, text: string, relatedNoteIds?: string[]) => void
  endThinkingChain: (chainId: string) => void
  addWikiLink: (noteId: string, targetTitle: string) => void
  setGraphFocusDepth: (depth: number) => void
  setCommandPaletteMode: (mode: "search" | "commands" | "links") => void

  // ── Knowledge Maps ──
  createKnowledgeMap: (title: string, description?: string, color?: string) => string
  updateKnowledgeMap: (id: string, updates: Partial<KnowledgeMap>) => void
  deleteKnowledgeMap: (id: string) => void
  addNoteToMap: (mapId: string, noteId: string) => void
  removeNoteFromMap: (mapId: string, noteId: string) => void

  // ── Alerts ──
  dismissAlert: (id: string) => void
  clearDismissedAlerts: () => void

  // ── Projects ──
  createProject: (name: string) => string
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void

  // ── Internal ──
  _hydrateNoteBodies: (bodies: NoteBody[]) => void
}
