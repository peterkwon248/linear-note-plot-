"use client"

// Phase 2C — BookWorkspace now mounts a ViewHeader (Notes pattern) and owns
// the controlled display state (shell / renderMode / theme / decor) so the
// Display popover can drive BookEditor from the header.

import { useState, useMemo, useEffect } from "react"
import { Books } from "@phosphor-icons/react/dist/ssr/Books"
import { usePlotStore } from "@/lib/store"
import { usePane } from "@/components/workspace/pane-context"
import { wikiArticleToBook } from "@/lib/book/adapter"
import type { Book, ShellId, ThemeConfig, DecorationConfig } from "@/lib/book/types"
import { BookEditor, type BookDisplayState } from "./book-editor"
import { BookDisplayPanel } from "./book-display-panel"
import { ViewHeader } from "@/components/view-header"

const defaultTheme: ThemeConfig = {
  bgColor: "",
  texture: "none",
  cardBorder: "",
  fontPair: "default",
  accentColor: "",
  textColor: "",
  quoteColor: "",
  cols: 0,
  margins: "standard",
  chapterStyle: "default",
}

const defaultDecor: DecorationConfig = {
  ribbon: false,
  ribbonColor: "#9b1c1c",
  bookmark: false,
  ornament: false,
  flipbook: false,
}

const defaultDisplayState: BookDisplayState = {
  shell: "magazine",
  renderMode: "scroll",
  theme: defaultTheme,
  decor: defaultDecor,
}

export function BookWorkspace() {
  const pane = usePane()
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)

  const books: Book[] = useMemo(
    () =>
      Object.values(wikiArticles)
        .map(wikiArticleToBook)
        .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")),
    [wikiArticles]
  )

  const [selectedId, setSelectedId] = useState<string | null>(books[0]?.id ?? null)
  const selected = selectedId ? books.find((b) => b.id === selectedId) ?? null : null
  const [editing, setEditing] = useState(false)

  // Sync SidePanel context to the selected book so SmartSidePanel shows its metadata.
  useEffect(() => {
    if (pane !== "primary") return
    if (!selected) return
    usePlotStore.getState().setSidePanelContext({ type: "wiki", id: selected.id })
  }, [selected, pane])

  const [displayState, setDisplayState] = useState<BookDisplayState>(defaultDisplayState)

  // Persist display state to localStorage (same keys as the previous in-editor state)
  useEffect(() => {
    const savedTheme = localStorage.getItem("plot.book.theme")
    const savedShell = localStorage.getItem("plot.book.shell") as ShellId | null
    const savedRenderMode = localStorage.getItem("plot.book.renderMode") as
      | "scroll"
      | "flipbook"
      | null
    const savedDecor = localStorage.getItem("plot.book.decor")
    setDisplayState((prev) => ({
      ...prev,
      theme: savedTheme ? JSON.parse(savedTheme) : prev.theme,
      shell: savedShell ?? prev.shell,
      renderMode: savedRenderMode ?? prev.renderMode,
      decor: savedDecor ? JSON.parse(savedDecor) : prev.decor,
    }))
  }, [])

  const patchDisplay = (patch: Partial<BookDisplayState>) => {
    setDisplayState((prev) => {
      const next = { ...prev, ...patch }
      if (patch.theme) localStorage.setItem("plot.book.theme", JSON.stringify(next.theme))
      if (patch.shell) localStorage.setItem("plot.book.shell", next.shell)
      if (patch.renderMode) localStorage.setItem("plot.book.renderMode", next.renderMode)
      if (patch.decor) localStorage.setItem("plot.book.decor", JSON.stringify(next.decor))
      return next
    })
  }

  const displayContent = <BookDisplayPanel state={displayState} onChange={patchDisplay} />

  const editToggleButton = selected ? (
    <button
      onClick={() => setEditing((v) => !v)}
      className={`h-7 rounded-md px-2.5 text-xs font-medium transition-colors duration-100 ${
        editing
          ? "bg-foreground text-background"
          : "border border-border text-foreground hover:bg-hover-bg"
      }`}
    >
      {editing ? "Done" : "Edit"}
    </button>
  ) : null

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<Books size={18} weight="regular" />}
        title={selected?.title || "Books"}
        count={books.length}
        showDisplay
        displayContent={displayContent}
        showDetailPanel
        detailPanelOpen={sidePanelOpen}
        onDetailPanelToggle={() => {
          const store = usePlotStore.getState()
          if (!store.sidePanelOpen) {
            store.setSidePanelOpen(true)
            usePlotStore.setState({ sidePanelMode: "detail" })
          } else if (store.sidePanelMode === "detail") {
            store.setSidePanelOpen(false)
          } else {
            usePlotStore.setState({ sidePanelMode: "detail" })
          }
        }}
        extraToolbarButtons={editToggleButton}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left rail — article list */}
        <aside
          style={{
            width: 260,
            minWidth: 260,
            borderRight: "1px solid var(--border-subtle)",
            overflowY: "auto",
            background: "var(--background)",
          }}
        >
          <div
            style={{
              padding: "16px 16px 8px",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted-foreground)",
            }}
          >
            Books · {books.length}
          </div>
          {books.length === 0 && (
            <div
              style={{
                padding: "24px 16px",
                fontSize: 13,
                color: "var(--muted-foreground)",
              }}
            >
              No books yet. Create a wiki document and it'll appear here.
            </div>
          )}
          <ul style={{ listStyle: "none", margin: 0, padding: "4px 8px" }}>
            {books.map((book) => {
              const active = book.id === selectedId
              return (
                <li key={book.id}>
                  <button
                    onClick={() => setSelectedId(book.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "none",
                      background: active ? "var(--sidebar-active, rgba(0,0,0,0.06))" : "transparent",
                      color: "var(--foreground)",
                      fontSize: 13,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        fontWeight: active ? 500 : 400,
                      }}
                    >
                      {book.title || "Untitled"}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--muted-foreground)",
                      }}
                    >
                      {book.blocks.length} block{book.blocks.length === 1 ? "" : "s"} · {book.shell}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        {/* Right pane — BookEditor driven by controlled display state */}
        <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
          <BookEditor
            book={selected ?? undefined}
            editing={editing}
            displayState={displayState}
            onDisplayStateChange={patchDisplay}
          />
        </div>
      </div>
    </div>
  )
}
