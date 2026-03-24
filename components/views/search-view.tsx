"use client"

import { useState, useMemo, useEffect, useRef, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { useSearch } from "@/lib/search/use-search"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { shortRelative } from "@/lib/format-utils"
import { setActiveRoute, setActiveFolderId, setActiveTagId, setActiveLabelId } from "@/lib/table-route"
import { Search, FileText, Pin, Tag, Bookmark, LayoutTemplate, FolderOpen, X, BookOpen, CircleAlert } from "lucide-react"

// ── Types ───────────────────────────────────────────────────────────────────

type TabKey = "all" | "notes" | "wiki" | "tags" | "labels" | "templates" | "folders"

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "notes", label: "Notes" },
  { key: "wiki", label: "Wiki" },
  { key: "tags", label: "Tags" },
  { key: "labels", label: "Labels" },
  { key: "templates", label: "Templates" },
  { key: "folders", label: "Folders" },
]

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
  // Store reads
  const notes = usePlotStore((s) => s.notes)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const templates = usePlotStore((s) => s.templates)
  const folders = usePlotStore((s) => s.folders)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const setSearchOpen = usePlotStore((s) => s.setSearchOpen)
  const setCommandPaletteMode = usePlotStore((s) => s.setCommandPaletteMode)
  const createWikiStub = usePlotStore((s) => s.createWikiStub)

  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState<TabKey>("all")

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Handle [[ prefix to switch to links mode in SearchDialog
  useEffect(() => {
    if (query === "[[") {
      setQuery("")
      setCommandPaletteMode("links")
      setSearchOpen(true)
    }
  }, [query, setCommandPaletteMode, setSearchOpen])

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
    return (templates as { id: string; name: string; description: string; icon: string }[])
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      )
      .slice(0, 10)
  }, [templates, query, hasFuzzyQuery])

  const matchedFolders = useMemo(() => {
    if (!hasFuzzyQuery) return []
    const q = query.toLowerCase().trim()
    return folders.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 10)
  }, [folders, query, hasFuzzyQuery])

  // All non-trashed wiki notes
  const wikiNotes = useMemo(
    () => notes.filter((n) => !n.trashed && n.isWiki),
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

  function handleCreateWikiFromQuery(title: string) {
    const id = createWikiStub(title)
    setSelectedNoteId(id)
    setActiveRoute("/wiki")
    router.push("/wiki")
  }

  // ── Sublabel for note rows ─────────────────────────────────────────────────

  function noteSublabel(note: {
    id: string
    status: string
    updatedAt: string
    createdAt: string
  }): string {
    const stageLabel = note.status.charAt(0).toUpperCase() + note.status.slice(1)
    const relTime = shortRelative(note.updatedAt || note.createdAt)
    const bl = backlinksMap.get(note.id) ?? 0
    const blSuffix = bl > 0 ? ` · ${bl} backlink${bl !== 1 ? "s" : ""}` : ""
    return `${stageLabel} · Updated ${relTime}${blSuffix}`
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
    matchedFolders.length === 0

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Search header */}
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, tags, and more..."
            className="h-12 w-full rounded-lg border border-border bg-background pl-12 pr-12 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="shrink-0 border-b border-border px-6">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
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
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Recent Notes
              </h3>
              <div className="space-y-0.5">
                {recentNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleNoteSelect(note.id)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                  >
                    {note.pinned ? (
                      <Pin className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-foreground">
                        {note.title || "Untitled"}
                      </div>
                      <div className="truncate text-sm text-muted-foreground">
                        {noteSublabel(note)}
                      </div>
                    </div>
                  </button>
                ))}
                {recentNotes.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
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
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Wiki Articles
                    </h3>
                    <div className="space-y-0.5">
                      {matchedWikiNotes.map((note) => (
                        <button
                          key={note.id}
                          onClick={() => handleWikiSelect(note.id)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                        >
                          <BookOpen className="h-4 w-4 shrink-0 text-accent" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-foreground">
                                {highlightQuery(note.title || "Untitled", query)}
                              </span>
                              <span className="shrink-0 rounded-sm bg-accent/20 px-1.5 py-0.5 text-2xs font-medium text-accent">
                                Wiki
                              </span>
                            </div>
                            <div className="truncate text-sm text-muted-foreground">
                              {noteSublabel(note)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

              {/* Red Links */}
              {(activeTab === "all" || activeTab === "wiki") &&
                matchedRedLinks.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Red Links
                    </h3>
                    <div className="space-y-0.5">
                      {matchedRedLinks.map((rl) => (
                        <div
                          key={rl.title}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-secondary"
                        >
                          <CircleAlert className="h-4 w-4 shrink-0 text-destructive" />
                          <div className="min-w-0 flex-1">
                            <span className="truncate text-destructive">
                              {highlightQuery(rl.title, query)}
                            </span>
                            <div className="truncate text-sm text-muted-foreground">
                              {rl.refCount} mention{rl.refCount !== 1 ? "s" : ""}
                            </div>
                          </div>
                          <button
                            onClick={() => handleCreateWikiFromQuery(rl.title)}
                            className="shrink-0 rounded-sm border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-accent"
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
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Notes
                    </h3>
                    <div className="space-y-0.5">
                      {noteResults.map((note) => (
                        <button
                          key={note.id}
                          onClick={() => handleNoteSelect(note.id)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                        >
                          {note.pinned ? (
                            <Pin className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-foreground">
                              {highlightQuery(note.title || "Untitled", query)}
                            </div>
                            <div className="truncate text-sm text-muted-foreground">
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
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Tags
                    </h3>
                    <div className="space-y-0.5">
                      {matchedTags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => handleTagSelect(tag.id)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                        >
                          <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <span className="text-foreground">
                              {highlightQuery(`#${tag.name}`, query)}
                            </span>
                          </div>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {tagNoteCounts.get(tag.name) ?? 0} notes
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
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Labels
                    </h3>
                    <div className="space-y-0.5">
                      {matchedLabels.map((label) => (
                        <button
                          key={label.id}
                          onClick={() => handleLabelSelect(label.id)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                        >
                          <Bookmark className="h-4 w-4 shrink-0 text-muted-foreground" />
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
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Templates
                    </h3>
                    <div className="space-y-0.5">
                      {matchedTemplates.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          onClick={handleTemplateSelect}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                        >
                          {tmpl.icon ? (
                            <span className="shrink-0 text-sm leading-none">{tmpl.icon}</span>
                          ) : (
                            <LayoutTemplate className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-foreground">
                              {highlightQuery(tmpl.name, query)}
                            </div>
                            {tmpl.description && (
                              <div className="truncate text-sm text-muted-foreground">
                                {tmpl.description}
                              </div>
                            )}
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
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Folders
                    </h3>
                    <div className="space-y-0.5">
                      {matchedFolders.map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => handleFolderSelect(folder.id)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                        >
                          <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="text-foreground">
                            {highlightQuery(folder.name, query)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

              {/* No results */}
              {hasNoResults && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {isIndexing
                    ? "Building search index..."
                    : `No results for "${query}"`}
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
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <BookOpen className="h-4 w-4 shrink-0" />
                      Create &apos;{query.trim()}&apos; as wiki article
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
