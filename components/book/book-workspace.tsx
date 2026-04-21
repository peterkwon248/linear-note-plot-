"use client"

// Phase 2B-1 — BookWorkspace connects the new Book UI to real wikiArticles data.
//
// Layout: left rail (article list) + right pane (BookEditor with selected book).
// No persistence yet (Phase 2B-2). Click a title → BookEditor loads its blocks.

import { useState, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { wikiArticleToBook } from "@/lib/book/adapter"
import type { Book } from "@/lib/book/types"
import { BookEditor } from "./book-editor"

export function BookWorkspace() {
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

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

  return (
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

      {/* Right pane — BookEditor with edit toggle */}
      <div style={{ flex: 1, minWidth: 0, overflow: "auto", position: "relative" }}>
        {selected && (
          <button
            onClick={() => setEditing((v) => !v)}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              zIndex: 41,
              padding: "6px 14px",
              height: 30,
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: editing ? "var(--foreground)" : "var(--background)",
              color: editing ? "var(--background)" : "var(--foreground)",
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            {editing ? "Done" : "Edit"}
          </button>
        )}
        <BookEditor book={selected ?? undefined} editing={editing} />
      </div>
    </div>
  )
}
