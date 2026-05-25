"use client"

import { useState, useMemo, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { useSearch } from "@/lib/search/use-search"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { shortRelative } from "@/lib/format-utils"
import { useT } from "@/lib/i18n"
import { setActiveRoute, setActiveFolderId, setActiveTagId, setActiveLabelId } from "@/lib/table-route"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import {
  FileText,
  Pin as PushPin,
  Tag as PhTag,
  Bookmark as BookmarkSimple,
  LayoutGrid as Layout,
  FolderOpen,
  BookOpen,
  AlertCircle as WarningCircle,
  Library as BooksIcon,
  Network as CategoryIcon,
  Sticker as StickerIcon,
  Quote as ReferenceIcon,
} from "lucide-react"
// ── Types ───────────────────────────────────────────────────────────────────

type TabKey =
  | "all"
  | "notes"
  | "wiki"
  | "books"
  | "categories"
  | "tags"
  | "labels"
  | "stickers"
  | "references"
  | "templates"
  | "folders"

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: "all", labelKey: "search.tab.all" },
  { key: "notes", labelKey: "search.tab.notes" },
  { key: "wiki", labelKey: "search.tab.wiki" },
  { key: "books", labelKey: "search.tab.books" },
  { key: "categories", labelKey: "search.tab.categories" },
  { key: "tags", labelKey: "search.tab.tags" },
  { key: "labels", labelKey: "search.tab.labels" },
  { key: "stickers", labelKey: "search.tab.stickers" },
  { key: "references", labelKey: "search.tab.references" },
  { key: "templates", labelKey: "search.tab.templates" },
  { key: "folders", labelKey: "search.tab.folders" },
]

const STATUS_LABEL_KEY: Record<string, string> = {
  stone: "status.stone",
  brick: "status.brick",
  keystone: "status.block",
}

// ── Highlight helper ─────────────────────────────────────────────────────────

function highlightQuery(text: string, q: string): ReactNode {
  if (!q.trim()) return text
  const lower = text.toLowerCase()
  const qLower = q.toLowerCase().trim()
  const idx = lower.indexOf(qLower)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/30 text-foreground rounded-sm">
        {text.slice(idx, idx + qLower.length)}
      </mark>
      {text.slice(idx + qLower.length)}
    </>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function SearchView() {
  const t = useT()
  // Store reads
  const notes = usePlotStore((s) => s.notes)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const templates = usePlotStore((s) => s.templates)
  const folders = usePlotStore((s) => s.folders)
  const books = usePlotStore((s) => s.books)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const stickers = usePlotStore((s) => s.stickers)
  const references = usePlotStore((s) => s.references)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const setSearchOpen = usePlotStore((s) => s.setSearchOpen)
  const setCommandPaletteMode = usePlotStore((s) => s.setCommandPaletteMode)
  const createWikiArticle = usePlotStore((s) => s.createWikiArticle)
  const query = usePlotStore((s) => s.globalSearchQuery)
  const setQuery = usePlotStore((s) => s.setGlobalSearchQuery)

  const router = useRouter()

  const [activeTab, setActiveTab] = useState<TabKey>("all")

  // Focus the global search input on mount — Path A (2026-05-25). The
  // in-page input has been removed; GlobalTopBar's <input id="global-search-input">
  // is the only entry. Focus it so the user can start typing immediately.
  useEffect(() => {
    const el = document.getElementById("global-search-input") as HTMLInputElement | null
    el?.focus()
  }, [])

  // Handle [[ prefix to switch to links mode in SearchDialog
  useEffect(() => {
    if (query === "[[") {
      setQuery("")
      setCommandPaletteMode("links")
      setSearchOpen(true)
    }
  }, [query, setQuery, setCommandPaletteMode, setSearchOpen])

  // FlexSearch worker for notes
  const { results: workerResults, isIndexing } = useSearch(query, 20)
  const backlinksMap = useBacklinksIndex()

  // Searchable notes (exclude archived / trashed)
  const searchableNotes = useMemo(
    () => notes.filter((n) => !n.trashed && n.triageStatus !== "trashed"),
    [notes],
  )

  // Synchronous title-based fallback (covers FlexSearch init delay + short queries)
  const titleMatchedNotes = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase().trim()
    return searchableNotes
      .filter((n) => (n.title || "Untitled").toLowerCase().includes(q))
      .slice(0, 20)
  }, [searchableNotes, query])

  // Merge: FlexSearch results + title fallback (deduplicated, FlexSearch first)
  const noteResults = useMemo(() => {
    if (workerResults.length > 0) {
      const ids = new Set(workerResults.map((n) => n.id))
      const extra = titleMatchedNotes.filter((n) => !ids.has(n.id))
      return [...workerResults, ...extra].slice(0, 20)
    }
    return titleMatchedNotes
  }, [workerResults, titleMatchedNotes])

  // Recent notes for empty-query state
  const recentNotes = useMemo(
    () =>
      [...searchableNotes]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 8),
    [searchableNotes],
  )

  const hasFuzzyQuery = query.trim().length > 0

  // Synchronous entity searches
  const matchedTags = useMemo(() => {
    if (!hasFuzzyQuery) return []
    const q = query.toLowerCase().trim()
    return tags.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 10)
  }, [tags, query, hasFuzzyQuery])

  const matchedLabels = useMemo(() => {
    if (!hasFuzzyQuery) return []
    const q = query.toLowerCase().trim()
    return labels.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 10)
  }, [labels, query, hasFuzzyQuery])

  const matchedTemplates = useMemo(() => {
    if (!hasFuzzyQuery) return []
    const q = query.toLowerCase().trim()
    // v102: per-template `icon` retired (generic Layout below).
    // v108: `description` retired — name is the only searchable text.
    return templates.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 10)
  }, [templates, query, hasFuzzyQuery])

  const matchedFolders = useMemo(() => {
    if (!hasFuzzyQuery) return []
    const q = query.toLowerCase().trim()
    return folders.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 10)
  }, [folders, query, hasFuzzyQuery])

  const matchedBooks = useMemo(() => {
    if (!hasFuzzyQuery) return []
    const q = query.toLowerCase().trim()
    return books
      .filter((b) => !b.trashed && (b.title.toLowerCase().includes(q) || (b.description ?? "").toLowerCase().includes(q)))
      .slice(0, 10)
  }, [books, query, hasFuzzyQuery])

  const matchedCategories = useMemo(() => {
    if (!hasFuzzyQuery) return []
    const q = query.toLowerCase().trim()
    return wikiCategories
      .filter((c) => c.name.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q))
      .slice(0, 10)
  }, [wikiCategories, query, hasFuzzyQuery])

  const matchedStickers = useMemo(() => {
    if (!hasFuzzyQuery) return []
    const q = query.toLowerCase().trim()
    return stickers
      .filter((s) => !s.trashed && s.name.toLowerCase().includes(q))
      .slice(0, 10)
  }, [stickers, query, hasFuzzyQuery])

  const matchedReferences = useMemo(() => {
    if (!hasFuzzyQuery) return []
    const q = query.toLowerCase().trim()
    return Object.values(references)
      .filter((r) => r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q))
      .slice(0, 10)
  }, [references, query, hasFuzzyQuery])

  // All non-trashed wiki notes
  const wikiNotes = useMemo(
    () => notes.filter((n) => !n.trashed && n.noteType === "wiki"),
    [notes],
  )

  // Red links: [[link]] targets that don't match any existing note title/alias
  const redLinks = useMemo(() => {
    const wikiTitleSet = new Set(wikiNotes.map((n) => n.title.toLowerCase()))
    wikiNotes.forEach((n) => {
      if (n.aliases) n.aliases.forEach((a: string) => wikiTitleSet.add(a.toLowerCase()))
    })
    const linkRefs = new Map<string, Set<string>>()
    for (const note of notes) {
      if (note.trashed) continue
      for (const link of note.linksOut ?? []) {
        const normalized = link.toLowerCase()
        if (!wikiTitleSet.has(normalized)) {
          if (!linkRefs.has(link)) linkRefs.set(link, new Set())
          linkRefs.get(link)!.add(note.id)
        }
      }
    }
    return Array.from(linkRefs.entries())
      .map(([title, refs]) => ({ title, refCount: refs.size }))
      .sort((a, b) => b.refCount - a.refCount || a.title.localeCompare(b.title))
  }, [notes, wikiNotes])

  // Filtered wiki notes and red links by search query
  const matchedWikiNotes = useMemo(() => {
    if (!hasFuzzyQuery) return wikiNotes.slice(0, 10)
    const q = query.toLowerCase().trim()
    return wikiNotes.filter((n) => (n.title || "Untitled").toLowerCase().includes(q)).slice(0, 10)
  }, [wikiNotes, query, hasFuzzyQuery])

  const matchedRedLinks = useMemo(() => {
    if (!hasFuzzyQuery) return redLinks.slice(0, 10)
    const q = query.toLowerCase().trim()
    return redLinks.filter((r) => r.title.toLowerCase().includes(q)).slice(0, 10)
  }, [redLinks, query, hasFuzzyQuery])

  // Note count per tag name (for display)
  const tagNoteCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const note of notes) {
      if (note.trashed) continue
      for (const tagName of note.tags ?? []) {
        counts.set(tagName, (counts.get(tagName) ?? 0) + 1)
      }
    }
    return counts
  }, [notes])

  // ── Navigation handlers ────────────────────────────────────────────────────

  function handleNoteSelect(noteId: string) {
    setSelectedNoteId(noteId)
    setActiveRoute("/notes")
    router.push("/notes")
  }

  function handleTagSelect(tagId: string) {
    setActiveTagId(tagId)
    setActiveRoute("/notes")
    router.push("/notes")
  }

  function handleLabelSelect(labelId: string) {
    setActiveLabelId(labelId)
    setActiveRoute("/notes")
    router.push("/notes")
  }

  function handleTemplateSelect() {
    setActiveRoute("/templates")
    router.push("/templates")
  }

  function handleFolderSelect(folderId: string) {
    setActiveFolderId(folderId)
    setActiveRoute("/notes")
    router.push("/notes")
  }

  function handleWikiSelect(noteId: string) {
    setSelectedNoteId(noteId)
    setActiveRoute("/wiki")
    router.push("/wiki")
  }

  function handleBookSelect(bookId: string) {
    setActiveRoute("/books")
    router.push(`/books/${bookId}`)
  }

  function handleCategorySelect() {
    setActiveRoute("/wiki")
    router.push("/wiki")
  }

  function handleStickerSelect() {
    setActiveRoute("/library")
    router.push("/library?tab=stickers")
  }

  function handleReferenceSelect() {
    setActiveRoute("/library")
    router.push("/library?tab=references")
  }

  function handleCreateWikiFromQuery(title: string) {
    const id = createWikiArticle({ title })
    if (id) {
      navigateToWikiArticle(id)
      setActiveRoute("/wiki")
      router.push("/wiki")
    }
  }

  // ── Sublabel for note rows ─────────────────────────────────────────────────

  function noteSublabel(note: {
    id: string
    status: string
    updatedAt: string
    createdAt: string
    folderIds?: string[]
  }): string {
    // Linear-style breadcrumb path: folder name first (when present),
    // then status pill name, then relative time. Backlink count tail
    // mirrors the original pattern.
    const folderName = note.folderIds?.[0]
      ? folders.find((f) => f.id === note.folderIds![0])?.name
      : null
    const stageLabel = t(STATUS_LABEL_KEY[note.status] ?? "status.stone")
    const relTime = shortRelative(note.updatedAt || note.createdAt)
    const bl = backlinksMap.get(note.id) ?? 0
    const parts: string[] = []
    if (folderName) parts.push(folderName)
    parts.push(stageLabel)
    parts.push(t("search.sublabel.updated").replace("{time}", relTime))
    if (bl > 0) {
      parts.push(t("search.sublabel.backlinks").replace("{count}", String(bl)))
    }
    return parts.join(" · ")
  }

  // ── No results check ───────────────────────────────────────────────────────

  const hasNoResults =
    hasFuzzyQuery &&
    noteResults.length === 0 &&
    matchedWikiNotes.length === 0 &&
    matchedRedLinks.length === 0 &&
    matchedTags.length === 0 &&
    matchedLabels.length === 0 &&
    matchedTemplates.length === 0 &&
    matchedFolders.length === 0 &&
    matchedBooks.length === 0 &&
    matchedCategories.length === 0 &&
    matchedStickers.length === 0 &&
    matchedReferences.length === 0

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Self-input removed — GlobalTopBar's <input id="global-search-input">
       *  is now the single source for the search query (Path A, 2026-05-25).
       *  SearchView reads `globalSearchQuery` from the store and renders
       *  results only — no redundant in-page input. */}

      {/* Filter tabs */}
      <div className="shrink-0 border-b border-border px-6">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2.5 text-note font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div>
          {/* Empty query: recent notes */}
          {!hasFuzzyQuery && (
            <div>
              <h3 className="mb-3 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("search.section.recent_notes")}
              </h3>
              <div className="space-y-0.5">
                {recentNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleNoteSelect(note.id)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-hover-bg"
                  >
                    {note.pinned ? (
                      <PushPin className="shrink-0 text-muted-foreground" size={16} strokeWidth={2} />
                    ) : (
                      <FileText className="shrink-0 text-muted-foreground" size={16} strokeWidth={2} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-foreground">
                        {note.title || t("common.untitled")}
                      </div>
                      <div className="truncate text-note text-muted-foreground">
                        {noteSublabel(note)}
                      </div>
                    </div>
                  </button>
                ))}
                {recentNotes.length === 0 && (
                  <p className="py-8 text-center text-note text-muted-foreground">
                    No notes yet
                  </p>
                )}
              </div>
            </div>
          )}

          {/* With query: filtered results */}
          {hasFuzzyQuery && (
            <div className="space-y-6">
              {/* Wiki Articles */}
              {(activeTab === "all" || activeTab === "wiki") &&
                matchedWikiNotes.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("search.section.wiki_articles")}
                    </h3>
                    <div className="space-y-0.5">
                      {matchedWikiNotes.map((note) => (
                        <button
                          key={note.id}
                          onClick={() => handleWikiSelect(note.id)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-hover-bg"
                        >
                          <BookOpen className="shrink-0 text-accent" size={16} strokeWidth={2} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-foreground">
                                {highlightQuery(note.title || t("common.untitled"), query)}
                              </span>
                              <span className="shrink-0 rounded-sm bg-accent/20 px-1.5 py-0.5 text-2xs font-medium text-accent">
                                Wiki
                              </span>
                            </div>
                            <div className="truncate text-note text-muted-foreground">
                              {noteSublabel(note)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

              {/* Unresolved Links */}
              {(activeTab === "all" || activeTab === "wiki") &&
                matchedRedLinks.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("search.section.unresolved_links")}
                    </h3>
                    <div className="space-y-0.5">
                      {matchedRedLinks.map((rl) => (
                        <div
                          key={rl.title}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-hover-bg"
                        >
                          <WarningCircle className="shrink-0 text-destructive" size={16} strokeWidth={2} />
                          <div className="min-w-0 flex-1">
                            <span className="truncate text-destructive">
                              {highlightQuery(rl.title, query)}
                            </span>
                            <div className="truncate text-note text-muted-foreground">
                              {rl.refCount} mention{rl.refCount !== 1 ? "s" : ""}
                            </div>
                          </div>
                          <button
                            onClick={() => handleCreateWikiFromQuery(rl.title)}
                            className="shrink-0 rounded-sm border border-border px-2 py-1 text-2xs text-muted-foreground transition-colors hover:border-accent hover:text-accent"
                          >
                            + Create
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

              {/* Notes */}
              {(activeTab === "all" || activeTab === "notes") &&
                noteResults.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("search.section.notes")}
                    </h3>
                    <div className="space-y-0.5">
                      {noteResults.map((note) => (
                        <button
                          key={note.id}
                          onClick={() => handleNoteSelect(note.id)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-hover-bg"
                        >
                          {note.pinned ? (
                            <PushPin className="shrink-0 text-muted-foreground" size={16} strokeWidth={2} />
                          ) : (
                            <FileText className="shrink-0 text-muted-foreground" size={16} strokeWidth={2} />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-foreground">
                              {highlightQuery(note.title || t("common.untitled"), query)}
                            </div>
                            <div className="truncate text-note text-muted-foreground">
                              {noteSublabel(note)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

              {/* Tags */}
              {(activeTab === "all" || activeTab === "tags") &&
                matchedTags.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("search.section.tags")}
                    </h3>
                    <div className="space-y-0.5">
                      {matchedTags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => handleTagSelect(tag.id)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-hover-bg"
                        >
                          <PhTag className="shrink-0 text-muted-foreground" size={16} strokeWidth={2} />
                          <div className="min-w-0 flex-1">
                            <span className="text-foreground">
                              {highlightQuery(`#${tag.name}`, query)}
                            </span>
                          </div>
                          <span className="text-2xs tabular-nums text-muted-foreground">
                            {t("search.tag.notes_count").replace("{count}", String(tagNoteCounts.get(tag.name) ?? 0))}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

              {/* Labels */}
              {(activeTab === "all" || activeTab === "labels") &&
                matchedLabels.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("search.section.labels")}
                    </h3>
                    <div className="space-y-0.5">
                      {matchedLabels.map((label) => (
                        <button
                          key={label.id}
                          onClick={() => handleLabelSelect(label.id)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-hover-bg"
                        >
                          <BookmarkSimple className="shrink-0 text-muted-foreground" size={16} strokeWidth={2} />
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: label.color || "#6b7280" }}
                            />
                            <span className="text-foreground">
                              {highlightQuery(label.name, query)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

              {/* Templates */}
              {(activeTab === "all" || activeTab === "templates") &&
                matchedTemplates.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("search.section.templates")}
                    </h3>
                    <div className="space-y-0.5">
                      {matchedTemplates.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          onClick={handleTemplateSelect}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-hover-bg"
                        >
                          {/* Generic Layout icon — templates no longer carry per-template emoji (v102). */}
                          <Layout className="shrink-0 text-muted-foreground" size={16} strokeWidth={2} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-foreground">
                              {highlightQuery(tmpl.name, query)}
                            </div>
                            {/* v108: NoteTemplate.description retired — name carries the row alone. */}
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

              {/* Folders */}
              {(activeTab === "all" || activeTab === "folders") &&
                matchedFolders.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("search.section.folders")}
                    </h3>
                    <div className="space-y-0.5">
                      {matchedFolders.map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => handleFolderSelect(folder.id)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-hover-bg"
                        >
                          <FolderOpen className="shrink-0 text-muted-foreground" size={16} strokeWidth={2} />
                          <span className="text-foreground">
                            {highlightQuery(folder.name, query)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

              {/* Books */}
              {(activeTab === "all" || activeTab === "books") &&
                matchedBooks.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("search.section.books")}
                    </h3>
                    <div className="space-y-0.5">
                      {matchedBooks.map((book) => (
                        <button
                          key={book.id}
                          onClick={() => handleBookSelect(book.id)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-hover-bg"
                        >
                          <BooksIcon className="shrink-0 text-muted-foreground" size={16} strokeWidth={2} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-foreground">
                              {highlightQuery(book.title, query)}
                            </div>
                            {book.description && (
                              <div className="truncate text-note text-muted-foreground">
                                {book.description}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

              {/* Wiki Categories */}
              {(activeTab === "all" || activeTab === "categories") &&
                matchedCategories.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("search.section.categories")}
                    </h3>
                    <div className="space-y-0.5">
                      {matchedCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={handleCategorySelect}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-hover-bg"
                        >
                          <CategoryIcon className="shrink-0 text-muted-foreground" size={16} strokeWidth={2} />
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="truncate text-foreground">
                              {highlightQuery(cat.name, query)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

              {/* Stickers */}
              {(activeTab === "all" || activeTab === "stickers") &&
                matchedStickers.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("search.section.stickers")}
                    </h3>
                    <div className="space-y-0.5">
                      {matchedStickers.map((sticker) => (
                        <button
                          key={sticker.id}
                          onClick={handleStickerSelect}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-hover-bg"
                        >
                          <StickerIcon className="shrink-0 text-muted-foreground" size={16} strokeWidth={2} />
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: sticker.color }}
                            />
                            <span className="truncate text-foreground">
                              {highlightQuery(sticker.name, query)}
                            </span>
                          </div>
                          <span className="text-2xs tabular-nums text-muted-foreground">
                            {sticker.members.length}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

              {/* References */}
              {(activeTab === "all" || activeTab === "references") &&
                matchedReferences.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("search.section.references")}
                    </h3>
                    <div className="space-y-0.5">
                      {matchedReferences.map((ref) => (
                        <button
                          key={ref.id}
                          onClick={handleReferenceSelect}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-hover-bg"
                        >
                          <ReferenceIcon className="shrink-0 text-muted-foreground" size={16} strokeWidth={2} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-foreground">
                              {highlightQuery(ref.title, query)}
                            </div>
                            {ref.content && (
                              <div className="truncate text-note text-muted-foreground">
                                {ref.content}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

              {/* No results */}
              {hasNoResults && (
                <div className="py-12 text-center text-note text-muted-foreground">
                  {isIndexing
                    ? t("search.indexing")
                    : t("search.no_results_for").replace("{query}", query)}
                </div>
              )}

              {/* Create as wiki article */}
              {hasFuzzyQuery &&
                !wikiNotes.some(
                  (n) => (n.title || "").toLowerCase() === query.toLowerCase().trim(),
                ) && (
                  <div className="border-t border-border pt-4">
                    <button
                      onClick={() => handleCreateWikiFromQuery(query.trim())}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-note text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
                    >
                      <BookOpen className="shrink-0" size={16} strokeWidth={2} />
                      {t("search.create_wiki_from_query").replace("{query}", query.trim())}
                    </button>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
