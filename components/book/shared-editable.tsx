"use client"

// Phase 2B-3 shared editable primitives — reused by all 5 shells (wiki/magazine/newspaper/book/blank).
// Extracted from wiki-shell.tsx so every shell offers the same edit UX without copy-paste.
//
// Exports:
//   - EditableParagraph           — TipTap wiki-tier editor (with FixedToolbar) for a text block
//   - EditableSectionHeading      — click-to-edit h2 with section number prefix
//   - EmptyBookCTA                — "+ Add first block" with 8-type picker for a new Book
//   - useBlockEditHelpers(book)   — hooks returning insertBelow / blockActions builders for a shell

import { useEffect, useRef, useState } from "react"
import type { Block, Book } from "@/lib/book/types"
import { useWikiBlockContentJson } from "@/hooks/use-wiki-block-content"
import { saveBlockBody } from "@/lib/wiki-block-body-store"
import { usePlotStore } from "@/lib/store"
import { WikiTextEditor } from "@/components/wiki-editor/wiki-block-renderer"
import { getInitialContentJson } from "@/lib/wiki-block-utils"
import type { WikiBlock, WikiBlockType } from "@/lib/types"

/* ── EditableParagraph ─────────────────────────────────────────────── */

export function EditableParagraph({
  block,
  articleId,
  style,
}: {
  block: Block
  articleId: string
  style?: React.CSSProperties
}) {
  const inMemoryJson = block.props?.contentJson as Record<string, unknown> | undefined
  const inMemoryContent = block.text && block.text.length > 0 ? block.text : undefined
  const { content, contentJson, loading } = useWikiBlockContentJson(block.id, inMemoryContent, inMemoryJson)
  const updateWikiBlock = usePlotStore((s) => s.updateWikiBlock)

  if (loading) {
    return <p style={{ marginBottom: 14, opacity: 0.4, ...style }}>Loading…</p>
  }

  const editorContent: Record<string, unknown> =
    contentJson ?? {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: content || block.text ? [{ type: "text", text: content || block.text }] : [],
        },
      ],
    }

  return (
    <WikiTextEditor
      content={editorContent}
      style={{ marginBottom: 14, ...style }}
      onChange={(json, plainText) => {
        saveBlockBody({ id: block.id, content: plainText, contentJson: json })
        updateWikiBlock(articleId, block.id, { content: plainText, contentJson: json })
      }}
    />
  )
}

/* ── EditableSectionHeading ────────────────────────────────────────── */

export function EditableSectionHeading({
  block,
  articleId,
  sectionNumber,
  fallbackText,
  style,
}: {
  block: Block
  articleId: string
  sectionNumber?: string
  fallbackText: string
  style: React.CSSProperties
}) {
  const updateWikiBlock = usePlotStore((s) => s.updateWikiBlock)
  const wikiBlock = usePlotStore((s) =>
    s.wikiArticles.find((a) => a.id === articleId)?.blocks.find((b) => b.id === block.id),
  )
  const currentTitle = wikiBlock?.title ?? fallbackText
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(currentTitle)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setDraft(currentTitle)
  }, [currentTitle, editing])

  const startEdit = () => {
    setDraft(currentTitle || "")
    setEditing(true)
    setTimeout(() => {
      const el = inputRef.current
      if (el) {
        el.focus()
        el.setSelectionRange(el.value.length, el.value.length)
      }
    }, 0)
  }

  const finishEdit = () => {
    setEditing(false)
    const next = draft.trim()
    if (next !== (currentTitle || "")) {
      updateWikiBlock(articleId, block.id, { title: next || "Untitled section" })
    }
  }

  const cancelEdit = () => {
    setDraft(currentTitle || "")
    setEditing(false)
  }

  return (
    <h2 style={style}>
      {sectionNumber && (
        <span style={{ color: "var(--muted-foreground)", marginRight: 8, fontWeight: 400 }}>
          {sectionNumber}
        </span>
      )}
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={finishEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              finishEdit()
            } else if (e.key === "Escape") {
              e.preventDefault()
              cancelEdit()
            }
          }}
          style={{
            font: "inherit",
            color: "inherit",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--accent, #3b82f6)",
            outline: "none",
            padding: 0,
            margin: 0,
            minWidth: 120,
            width: "60%",
          }}
        />
      ) : (
        <span onClick={startEdit} style={{ cursor: "text" }} title="Click to edit">
          {currentTitle || <span style={{ color: "var(--muted-foreground)" }}>Untitled section</span>}
        </span>
      )}
    </h2>
  )
}

/* ── EmptyBookCTA ──────────────────────────────────────────────────── */

const BLOCK_TYPE_DEFAULTS: Record<WikiBlockType, () => Partial<WikiBlock>> = {
  section: () => ({ title: "New section", level: 2 }),
  text: () => ({ content: "", contentJson: undefined }),
  "pull-quote": () => ({ quoteText: "" }),
  image: () => ({ caption: "" }),
  url: () => ({ url: "", urlTitle: "" }),
  table: () => ({ tableHeaders: ["Col 1", "Col 2"], tableRows: [["", ""]] }),
  infobox: () => ({ fields: [] }),
  toc: () => ({ tocCollapsed: false }),
  "note-ref": () => ({}),
  "column-group": () => ({ columnChildren: [] }),
}

const EMPTY_PICKER_OPTIONS: Array<{ type: WikiBlockType; label: string }> = [
  { type: "text", label: "Text" },
  { type: "section", label: "Section" },
  { type: "pull-quote", label: "Pull Quote" },
  { type: "image", label: "Image" },
  { type: "url", label: "URL" },
  { type: "table", label: "Table" },
  { type: "infobox", label: "Infobox" },
  { type: "toc", label: "TOC" },
]

export function EmptyBookCTA({ bookId }: { bookId: string }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const insert = (type: WikiBlockType) => {
    const defaults = (BLOCK_TYPE_DEFAULTS[type] ?? (() => ({})))()
    usePlotStore.getState().addWikiBlock(bookId, { type, ...defaults })
    setPickerOpen(false)
  }
  return (
    <div style={{ position: "relative", padding: "32px 0", textAlign: "center" }}>
      <button
        onClick={() => setPickerOpen((v) => !v)}
        style={{
          padding: "10px 20px",
          border: "1px dashed var(--border)",
          borderRadius: 8,
          background: "transparent",
          color: "var(--muted-foreground)",
          fontSize: 13,
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        + Add first block
      </button>
      {pickerOpen && (
        <div
          role="menu"
          style={{
            position: "absolute",
            left: "50%",
            top: "calc(100% + 4px)",
            transform: "translateX(-50%)",
            zIndex: 20,
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            boxShadow: "var(--shadow-lg)",
            padding: 4,
            minWidth: 200,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {EMPTY_PICKER_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              role="menuitem"
              onClick={() => insert(opt.type)}
              style={{
                textAlign: "left",
                padding: "8px 12px",
                border: "none",
                background: "transparent",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "inherit",
                color: "var(--foreground)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg, rgba(0,0,0,0.04))")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── useBlockEditHelpers ───────────────────────────────────────────── */

/**
 * Returns helpers to wire BookBlockSlot props in any shell.
 * - buildInsertBelow(afterBlockId) — callback for AddBlockButton's `onAdd(type, level?)`,
 *   mirrors hooks/use-wiki-block-actions.ts handleAddBlock type-dispatch logic
 * - buildBlockActions(block, wikiBlocks) — { onDelete, onDuplicate, onTurnInto }
 *
 * `editing` and `book` are captured so shells can pass undefined actions in read mode.
 */
export function useBlockEditHelpers(book: Book | undefined, editing: boolean) {
  const buildInsertBelow = (afterBlockId: string | undefined) => {
    if (!editing || !book) return undefined
    return (type: string, level?: number) => {
      const articleId = book.id
      const store = usePlotStore.getState()

      // text:callout / text:blockquote / text:toggle / text:spacer → pre-filled Text block
      if (type.startsWith("text:")) {
        const subtype = type.split(":")[1]
        const contentJson = getInitialContentJson(subtype)
        store.addWikiBlock(articleId, { type: "text", content: "", contentJson }, afterBlockId)
        return
      }

      if (type === "table") {
        store.addWikiBlock(
          articleId,
          {
            type: "table",
            tableCaption: "",
            tableHeaders: ["Header 1", "Header 2", "Header 3"],
            tableRows: [["", "", ""]],
            tableColumnAligns: ["center", "center", "center"],
          },
          afterBlockId,
        )
        return
      }

      const wikiType = type as WikiBlockType
      const block: Omit<WikiBlock, "id"> = { type: wikiType }
      if (type === "section") {
        block.title = ""
        block.level = level ?? 2
      }
      if (type === "text") block.content = ""
      if (type === "infobox") {
        block.fields = []
        block.headerColor = null
      }
      if (type === "toc") block.tocCollapsed = false
      if (type === "url") {
        block.url = ""
        block.urlTitle = ""
      }
      if (type === "pull-quote") block.quoteText = ""
      if (type === "image") block.caption = ""

      store.addWikiBlock(articleId, block, afterBlockId)
    }
  }

  const buildBlockActions = (block: Block | undefined, wikiBlocks: WikiBlock[] | undefined) => {
    if (!editing || !book || !block) return undefined
    return {
      onDelete: () => usePlotStore.getState().removeWikiBlock(book.id, block.id),
      onDuplicate: () => {
        const wb = wikiBlocks?.find((w) => w.id === block.id)
        if (!wb) return
        const { id: _id, ...rest } = wb
        void _id
        usePlotStore.getState().addWikiBlock(book.id, rest, block.id)
      },
      onTurnInto: (type: WikiBlockType) => {
        usePlotStore.getState().updateWikiBlock(book.id, block.id, { type })
      },
    }
  }

  return { buildInsertBelow, buildBlockActions }
}
