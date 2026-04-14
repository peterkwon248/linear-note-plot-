"use client"

import { lazy, Suspense, useState, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import { useSecondaryRoute, useSecondarySpace, setSecondarySpace, DEFAULT_ROUTES } from "@/lib/table-route"
import { NoteEditor } from "@/components/note-editor"
import { PaneProvider, useIsActivePane } from "./pane-context"
import { WikiLayoutToggle } from "@/components/wiki-editor/wiki-layout-toggle"
import { cn } from "@/lib/utils"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { TextAa } from "@phosphor-icons/react/dist/ssr/TextAa"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { House } from "@phosphor-icons/react/dist/ssr/House"
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil"
import { BookOpenText } from "@phosphor-icons/react/dist/ssr/BookOpenText"
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank"
import { Graph } from "@phosphor-icons/react/dist/ssr/Graph"
import { Books } from "@phosphor-icons/react/dist/ssr/Books"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ActivitySpace } from "@/lib/types"

// Lazy-load view components to avoid bloating the secondary panel bundle
const WikiArticleView = lazy(() => import("@/components/wiki-editor/wiki-article-view").then(m => ({ default: m.WikiArticleView })))
const WikiArticleEncyclopedia = lazy(() => import("@/components/wiki-editor/wiki-article-encyclopedia").then(m => ({ default: m.WikiArticleEncyclopedia })))
const NotesTableView = lazy(() => import("@/components/notes-table-view").then(m => ({ default: m.NotesTableView })))
const HomeView = lazy(() => import("@/components/views/home-view").then(m => ({ default: m.HomeView })))
const WikiView = lazy(() => import("@/components/views/wiki-view").then(m => ({ default: m.WikiView })))
const CalendarView = lazy(() => import("@/components/calendar-view").then(m => ({ default: m.CalendarView })))
const OntologyView = lazy(() => import("@/components/views/ontology-view").then(m => ({ default: m.OntologyView })))
const LibraryView = lazy(() => import("@/components/views/library-view").then(m => ({ default: m.LibraryView })))

const TABLE_VIEW_ROUTES = ["/notes", "/inbox", "/capture", "/permanent", "/pinned", "/trash"]

const SPACE_LABELS: Record<ActivitySpace, string> = {
  home: "Home",
  notes: "Notes",
  wiki: "Wiki",
  calendar: "Calendar",
  ontology: "Graph",
  library: "Library",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SPACE_ICONS: Record<ActivitySpace, any> = {
  home: House,
  notes: NotePencil,
  wiki: BookOpenText,
  calendar: CalendarBlank,
  ontology: Graph,
  library: Books,
}

const ALL_SPACES: ActivitySpace[] = ["home", "notes", "wiki", "calendar", "ontology", "library"]

function ViewFallback() {
  return <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
}

/**
 * Header bar for secondary panel in view mode (no note open).
 * Shows space dropdown + close button.
 */
function SecondaryViewHeader() {
  const secondarySpace = useSecondarySpace()
  const closeSecondary = usePlotStore((s) => s.closeSecondary)
  const currentSpace = secondarySpace ?? "notes"
  const isActivePane = useIsActivePane()

  return (
    <header className={cn(
      "flex h-(--header-height) shrink-0 items-center justify-between border-b border-border px-4 transition-colors duration-150",
      isActivePane && "bg-hover-bg"
    )}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-note font-medium text-foreground transition-colors hover:text-foreground/80 cursor-pointer"
          >
            {SPACE_LABELS[currentSpace]}
            <CaretDown size={12} weight="bold" className="text-muted-foreground/60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          {ALL_SPACES.map((space) => {
            const Icon = SPACE_ICONS[space]
            return (
              <DropdownMenuItem
                key={space}
                onClick={() => setSecondarySpace(space)}
                className={cn(currentSpace === space && "bg-accent/10 text-accent")}
              >
                <Icon size={16} weight="regular" />
                {SPACE_LABELS[space]}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        onClick={(e) => { e.stopPropagation(); closeSecondary() }}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-hover-bg"
        title="Close panel"
      >
        <PhX size={16} weight="regular" />
      </button>
    </header>
  )
}

/**
 * Wiki article rendered in the secondary panel with a breadcrumb header + controls.
 */
function SecondaryWikiArticle({ articleId }: { articleId: string }) {
  const closeSecondary = usePlotStore((s) => s.closeSecondary)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const updateWikiArticle = usePlotStore((s) => s.updateWikiArticle)
  const article = wikiArticles.find((a) => a.id === articleId)
  const secondarySpace = useSecondarySpace()
  const currentSpace = secondarySpace ?? "wiki"
  const [isEditing, setIsEditing] = useState(false)
  const [collapseAllCmd, setCollapseAllCmd] = useState<"collapse" | "expand" | null>(null)
  const [allSectionsCollapsed, setAllSectionsCollapsed] = useState(false)
  const hasSections = article?.blocks.some((b) => b.type === "section") ?? false
  const isActivePane = useIsActivePane()

  return (
    <div data-editor-scope="wiki" className="flex flex-col h-full">
      <header className={cn(
        "flex h-(--header-height) shrink-0 items-center justify-between border-b border-border px-4 transition-colors duration-150",
        isActivePane && "bg-hover-bg"
      )}>
        <nav className="flex items-center gap-1.5 min-w-0">
          {/* Space dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 flex items-center gap-1.5 text-note font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                {SPACE_LABELS[currentSpace]}
                <CaretDown size={12} weight="bold" className="text-muted-foreground/60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {ALL_SPACES.map((space) => {
                const Icon = SPACE_ICONS[space]
                return (
                  <DropdownMenuItem
                    key={space}
                    onClick={() => {
                      usePlotStore.getState().closeSecondary()
                      setSecondarySpace(space)
                    }}
                    className={cn(currentSpace === space && "bg-accent/10 text-accent")}
                  >
                    <Icon size={16} weight="regular" />
                    {SPACE_LABELS[space]}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-muted-foreground/40 mx-0.5">&gt;</span>
          <span className="min-w-0 truncate text-note font-medium text-foreground">
            {article?.title || "Wiki Article"}
          </span>
        </nav>
        <div className="flex items-center gap-1">
          {/* Aa font size / alignment popover */}
          {article && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-hover-bg hover:text-muted-foreground transition-all"
                  title="Font size"
                >
                  <TextAa size={18} weight="regular" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-2.5" sideOffset={4}>
                <div className="flex items-center gap-1.5">
                  {([
                    { label: "S", value: 0.85 },
                    { label: "M", value: 1 },
                    { label: "L", value: 1.15 },
                    { label: "XL", value: 1.3 },
                  ] as const).map((opt) => {
                    const active = (article.fontSize ?? 1) === opt.value
                    return (
                      <button
                        key={opt.label}
                        onClick={() => updateWikiArticle(articleId, { fontSize: opt.value === 1 ? undefined : opt.value })}
                        className={cn(
                          "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                          active ? "bg-accent/20 text-accent" : "text-foreground/60 hover:bg-hover-bg"
                        )}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
          {/* Collapse/Expand all */}
          {hasSections && (
            <button
              onClick={() => setCollapseAllCmd(allSectionsCollapsed ? "expand" : "collapse")}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-hover-bg hover:text-muted-foreground transition-all"
              title={allSectionsCollapsed ? "Expand all" : "Collapse all"}
            >
              <svg width={17} height={17} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {allSectionsCollapsed ? <path d="M4 6l4 4 4-4" /> : <path d="M12 10l-4-4-4 4" />}
              </svg>
            </button>
          )}
          {/* Layout toggle */}
          {article && (
            <WikiLayoutToggle articleId={articleId} layout={article.layout} showIcon={false} />
          )}
          {/* Edit/Done toggle */}
          {isEditing ? (
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Done
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Edit
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); closeSecondary() }}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-hover-bg"
            title="Close panel"
          >
            <PhX size={16} weight="regular" />
          </button>
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-auto">
        <Suspense fallback={<ViewFallback />}>
          {article?.layout === "encyclopedia" ? (
            <WikiArticleEncyclopedia
              article={article}
              isEditing={isEditing}
              onBack={() => closeSecondary()}
              collapseAllCmd={collapseAllCmd}
              onCollapseAllDone={() => setCollapseAllCmd(null)}
              onAllCollapsedChange={setAllSectionsCollapsed}
              fontSize={article.fontSize}
            />
          ) : (
            <WikiArticleView
              articleId={articleId}
              editable={isEditing}
              collapseAllCmd={collapseAllCmd}
              onCollapseAllDone={() => setCollapseAllCmd(null)}
            />
          )}
        </Suspense>
      </div>
    </div>
  )
}

/**
 * Renders the appropriate content for the secondary (right) panel.
 * - If secondaryNoteId is set → show NoteEditor (with its own header)
 * - If secondaryRoute is set → show header + the corresponding view
 * - Otherwise → show a placeholder
 */
export function SecondaryPanelContent() {
  const secondaryNoteId = usePlotStore((s) => s.secondaryNoteId)
  const activePane = usePlotStore((s) => s.activePane)
  const secondaryRoute = useSecondaryRoute()
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  // Sync sidePanelContext when secondary note changes (keeps sidebar in sync)
  useEffect(() => {
    if (!secondaryNoteId || activePane !== 'secondary') return
    const isNote = notes.some((n) => n.id === secondaryNoteId && !n.trashed)
    const isWiki = !isNote && wikiArticles.some((a) => a.id === secondaryNoteId)
    if (isNote) {
      usePlotStore.getState().setSidePanelContext({ type: "note", id: secondaryNoteId })
    } else if (isWiki) {
      usePlotStore.getState().setSidePanelContext({ type: "wiki", id: secondaryNoteId })
    }
  }, [secondaryNoteId, activePane, notes, wikiArticles])

  // Editor mode: a specific note/wiki is open
  if (secondaryNoteId) {
    const isNote = notes.some((n) => n.id === secondaryNoteId && !n.trashed)
    const isWiki = !isNote && wikiArticles.some((a) => a.id === secondaryNoteId)

    if (isWiki) {
      // Wiki article → show WikiView with the article selected
      return (
        <PaneProvider pane="secondary">
          <SecondaryWikiArticle articleId={secondaryNoteId} />
        </PaneProvider>
      )
    }

    return (
      <PaneProvider pane="secondary">
        <NoteEditor noteId={secondaryNoteId} pane="secondary" />
      </PaneProvider>
    )
  }

  // List/View mode: ViewHeader inside each view handles header (with space dropdown in secondary)
  if (secondaryRoute) {
    return (
      <PaneProvider pane="secondary">
        <div className="flex flex-col h-full">
          <div className="flex-1 min-h-0 overflow-auto">
            <Suspense fallback={<ViewFallback />}>
              <SecondaryViewRouter route={secondaryRoute} />
            </Suspense>
          </div>
        </div>
      </PaneProvider>
    )
  }

  // No content
  return null
}

// Views that don't use ViewHeader need a mini header for secondary pane (space dropdown + close)
// Calendar, Graph, Library all have their own ViewHeader — only Home needs this
const VIEWS_WITHOUT_HEADER = ["/home"]

function SecondaryViewRouter({ route }: { route: string }) {
  const needsMiniHeader = VIEWS_WITHOUT_HEADER.includes(route)

  const content = (() => {
    if (TABLE_VIEW_ROUTES.includes(route)) return <NotesTableView />
    switch (route) {
      case "/home": return <HomeView />
      case "/wiki": return <WikiView />
      case "/calendar": return <CalendarView title="Calendar" />
      case "/ontology":
      case "/graph-insights": return <OntologyView />
      case "/library":
      case "/library/references":
      case "/library/tags":
      case "/library/files": return <LibraryView />
      default: return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Select a space from the breadcrumb
        </div>
      )
    }
  })()

  if (needsMiniHeader) {
    return (
      <div className="flex flex-col h-full">
        <SecondaryViewHeader />
        <div className="flex-1 min-h-0 overflow-auto">{content}</div>
      </div>
    )
  }

  return content
}
