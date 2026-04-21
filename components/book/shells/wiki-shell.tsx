"use client"

import { useState } from "react"
import type { Shell, ThemeConfig, Book, Block } from "@/lib/book/types"
import { SAMPLE_CONTENT } from "@/lib/book/shells"
import { ChapterDivider } from "./chapter-divider"
import { BookInlineEditor } from "../book-inline-editor"
import { BookBlockSlot } from "../book-block-slot"
import { useWikiBlockContentJson } from "@/hooks/use-wiki-block-content"
import { saveBlockBody } from "@/lib/wiki-block-body-store"
import { usePlotStore } from "@/lib/store"
import { computeSectionNumbers } from "@/lib/wiki-block-utils"
import type { WikiBlock } from "@/lib/types"

interface WikiShellProps {
  shell: Shell
  theme: ThemeConfig
  /** When provided, title + body render from the real book. Infobox/TOC/footnotes still use sample until Phase 6. */
  book?: Book
  /** Edit mode — show inline editors + block chrome (add/delete/menu). Default false = read-only render. */
  editing?: boolean
}

/**
 * EditableParagraph — loads contentJson from IDB (lazy), renders BookInlineEditor.
 * Saves on debounced change back to wikiArticles slice + IDB.
 */
function EditableParagraph({ block, articleId }: { block: Block; articleId: string }) {
  const inMemoryJson = block.props?.contentJson as Record<string, unknown> | undefined
  const { contentJson, loading } = useWikiBlockContentJson(block.id, block.text, inMemoryJson)
  const updateWikiBlock = usePlotStore((s) => s.updateWikiBlock)

  if (loading) {
    return (
      <p style={{ marginBottom: 14, opacity: 0.4 }}>Loading…</p>
    )
  }

  return (
    <BookInlineEditor
      initialContent={contentJson ?? undefined}
      initialText={block.text}
      placeholder="Write something…"
      style={{ marginBottom: 14 }}
      onChange={(json, plainText) => {
        // Persist to IDB (body store)
        saveBlockBody({ id: block.id, content: plainText, contentJson: json })
        // Persist in-memory wiki block metadata
        updateWikiBlock(articleId, block.id, { content: plainText, contentJson: json })
      }}
    />
  )
}

/**
 * EmptyBookCTA — shown when a real Book has 0 blocks. Provides a picker
 * to insert the first block (Text / Section / etc).
 */
function EmptyBookCTA({ bookId }: { bookId: string }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const OPTIONS: Array<{ type: WikiBlock["type"]; label: string }> = [
    { type: "text", label: "Text" },
    { type: "section", label: "Section" },
    { type: "pull-quote", label: "Pull Quote" },
    { type: "image", label: "Image" },
    { type: "url", label: "URL" },
    { type: "table", label: "Table" },
    { type: "infobox", label: "Infobox" },
    { type: "toc", label: "TOC" },
  ]
  const insert = (type: WikiBlock["type"]) => {
    const defaults: Partial<WikiBlock> =
      type === "section"
        ? { title: "New section", level: 2 }
        : type === "pull-quote"
          ? { quoteText: "" }
          : type === "image"
            ? { caption: "" }
            : type === "url"
              ? { url: "", urlTitle: "" }
              : type === "table"
                ? { tableHeaders: ["Col 1", "Col 2"], tableRows: [["", ""]] }
                : type === "infobox"
                  ? { fields: [] }
                  : type === "toc"
                    ? { tocCollapsed: false }
                    : { content: "", contentJson: undefined }
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
          {OPTIONS.map((opt) => (
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

export function WikiShell({ shell, theme, book, editing = false }: WikiShellProps) {
  const c = SAMPLE_CONTENT.wiki
  // Pull real WikiBlocks (for section numbering + auto TOC) when a book is loaded.
  const wikiBlocks = usePlotStore((s) =>
    book ? s.wikiArticles.find((a) => a.id === book.id)?.blocks : undefined,
  )
  const sectionNumbers = wikiBlocks ? computeSectionNumbers(wikiBlocks) : null
  const realTitle = book?.title ?? c.title
  const realBody =
    book?.blocks.map((b) => ({
      type: b.type === "heading" ? "h2" : b.type === "paragraph" ? "p" : "p",
      text: b.text ?? "",
      block: b,
    })) ?? c.body.map((b) => ({ ...b, block: undefined as Block | undefined }))

  // Auto-derived TOC from section blocks (replaces hardcoded c.toc when a book is loaded).
  const realToc: Array<{ n: string; t: string }> = wikiBlocks
    ? wikiBlocks
        .filter((b: WikiBlock) => b.type === "section")
        .map((b: WikiBlock) => ({ n: sectionNumbers?.get(b.id) ?? "", t: b.title ?? "" }))
        .filter((r: { t: string }) => r.t.length > 0)
    : c.toc
  const marginScale = theme.margins === "narrow" ? 0.65 : theme.margins === "wide" ? 1.5 : 1
  const pad = `${40 * marginScale}px ${48 * marginScale}px`

  return (
    <div
      style={{
        maxWidth: shell.maxWidth,
        margin: "0 auto",
        padding: pad,
        fontFamily: shell.bodyFont,
        color: shell.fg,
      }}
    >
      <h1
        style={{
          fontSize: 36,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          marginTop: 0,
          marginBottom: 6,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 10,
        }}
      >
        {realTitle}
      </h1>
      {!book && (
        <p
          style={{
            fontStyle: "italic",
            color: "var(--muted-foreground)",
            fontSize: 14,
            marginTop: 6,
            marginBottom: 24,
          }}
        >
          {c.hatnote}
        </p>
      )}

      {/* Infobox floats right on wide screens — sample only (Phase 6 for real) */}
      {!book && (
      <aside
        style={{
          float: "right",
          width: 280,
          marginLeft: 24,
          marginBottom: 16,
          border: theme.cardBorder || shell.cardBorder,
          borderRadius: shell.cardRadius,
          background: "var(--card)",
          padding: 14,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
            textAlign: "center",
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: 8,
          }}
        >
          {c.infobox.title}
        </div>
        <div
          style={{
            width: "100%",
            aspectRatio: "4/3",
            background: "linear-gradient(135deg, #e8d5b7 0%, #c9a878 50%, #8b6f47 100%)",
            borderRadius: 4,
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.8)",
            fontSize: 11,
            fontStyle: "italic",
          }}
        >
          Ebbinghaus forgetting curve
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <tbody>
            {c.infobox.fields.map(([k, v]) => (
              <tr key={k} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td
                  style={{
                    padding: "6px 0",
                    fontWeight: 600,
                    color: "var(--muted-foreground)",
                    width: "40%",
                    verticalAlign: "top",
                  }}
                >
                  {k}
                </td>
                <td style={{ padding: "6px 0" }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </aside>
      )}

      {/* ToC */}
      <div
        style={{
          border: "1px solid var(--border-subtle)",
          background: "var(--card)",
          padding: "12px 16px",
          margin: "0 0 20px",
          display: "inline-block",
          minWidth: 260,
          borderRadius: shell.cardRadius,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--muted-foreground)",
            marginBottom: 8,
          }}
        >
          Contents
        </div>
        {realToc.length === 0 && book ? (
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic" }}>
            No sections yet. Add a Section block to populate the TOC.
          </div>
        ) : (
          realToc.map((r, idx) => (
            <div
              key={`${r.n}-${idx}`}
              style={{
                fontSize: 13,
                padding: "2px 0",
                paddingLeft: r.n ? (r.n.split(".").length - 1) * 14 : 0,
                color: "var(--foreground)",
              }}
            >
              {r.n && (
                <span style={{ color: "var(--muted-foreground)", marginRight: 6 }}>{r.n}</span>
              )}
              {r.t}
            </div>
          ))
        )}
      </div>

      {/* Body (cols override) */}
      <div
        style={{
          fontSize: 15.5,
          lineHeight: 1.7,
          columnCount: shell.cols > 1 ? shell.cols : 1,
          columnGap: 28,
        }}
      >
        {editing && book && book.blocks.length === 0 && <EmptyBookCTA bookId={book.id} />}
        {(() => {
          let hc = 0
          return realBody.map((b, i) => {
            const afterId = b.block?.id
            const insertBelow =
              editing && book && afterId
                ? (type: import("@/lib/types").WikiBlockType) => {
                    // Insert block of the user-chosen type after this one.
                    const defaults: Partial<import("@/lib/types").WikiBlock> =
                      type === "section"
                        ? { title: "New section", level: 2 }
                        : type === "pull-quote"
                          ? { quoteText: "" }
                          : type === "image"
                            ? { caption: "" }
                            : type === "url"
                              ? { url: "", urlTitle: "" }
                              : type === "table"
                                ? { tableHeaders: ["Col 1", "Col 2"], tableRows: [["", ""]] }
                                : type === "infobox"
                                  ? { fields: [] }
                                  : type === "toc"
                                    ? { tocCollapsed: false }
                                    : { content: "", contentJson: undefined }
                    usePlotStore.getState().addWikiBlock(
                      book.id,
                      { type, ...defaults },
                      afterId,
                    )
                  }
                : undefined

            // Block-menu actions (Delete / Duplicate / Turn Into) — only when editing.
            const blockActions =
              editing && book && b.block
                ? {
                    onDelete: () => usePlotStore.getState().removeWikiBlock(book.id, b.block!.id),
                    onDuplicate: () => {
                      const wb = wikiBlocks?.find((w) => w.id === b.block!.id)
                      if (!wb) return
                      const { id: _id, ...rest } = wb
                      usePlotStore.getState().addWikiBlock(book.id, rest, b.block!.id)
                    },
                    onTurnInto: (type: import("@/lib/types").WikiBlockType) => {
                      usePlotStore.getState().updateWikiBlock(book.id, b.block!.id, { type })
                    },
                  }
                : undefined

            if (b.type === "lead")
              return (
                <BookBlockSlot
                  key={b.block?.id ?? i}
                  onInsertBelow={insertBelow}
                  onDelete={blockActions?.onDelete}
                  onDuplicate={blockActions?.onDuplicate}
                  onTurnInto={blockActions?.onTurnInto}
                >
                  <p style={{ marginBottom: 16 }}>{b.text}</p>
                </BookBlockSlot>
              )
            if (b.type === "h2") {
              hc += 1
              return (
                <BookBlockSlot
                  key={b.block?.id ?? i}
                  onInsertBelow={insertBelow}
                  onDelete={blockActions?.onDelete}
                  onDuplicate={blockActions?.onDuplicate}
                  onTurnInto={blockActions?.onTurnInto}
                >
                  {theme.chapterStyle !== "default" && hc > 1 && (
                    <div style={{ color: shell.fg }}>
                      <ChapterDivider
                        style={theme.chapterStyle}
                        displayFont={shell.displayFont}
                        idx={hc}
                        label={b.text}
                      />
                    </div>
                  )}
                  <h2
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      borderBottom: "1px solid var(--border-subtle)",
                      paddingBottom: 6,
                      marginTop: 28,
                      marginBottom: 12,
                      breakInside: "avoid",
                    }}
                  >
                    {b.block && sectionNumbers?.get(b.block.id) && (
                      <span style={{ color: "var(--muted-foreground)", marginRight: 8, fontWeight: 400 }}>
                        {sectionNumbers.get(b.block.id)}
                      </span>
                    )}
                    {b.text}
                  </h2>
                </BookBlockSlot>
              )
            }
            if (b.type === "p") {
              if (book && b.block) {
                return (
                  <BookBlockSlot
                    key={b.block.id}
                    onInsertBelow={insertBelow}
                    onDelete={blockActions?.onDelete}
                    onDuplicate={blockActions?.onDuplicate}
                    onTurnInto={blockActions?.onTurnInto}
                  >
                    {editing ? (
                      <EditableParagraph block={b.block} articleId={book.id} />
                    ) : (
                      <p style={{ marginBottom: 14 }}>{b.text}</p>
                    )}
                  </BookBlockSlot>
                )
              }
              return (
                <BookBlockSlot key={b.block?.id ?? i} onInsertBelow={insertBelow} onDelete={blockActions?.onDelete} onDuplicate={blockActions?.onDuplicate} onTurnInto={blockActions?.onTurnInto}>
                  <p style={{ marginBottom: 14 }}>{b.text}</p>
                </BookBlockSlot>
              )
            }
            return null
          })
        })()}
      </div>

      {/* Footnotes — sample only (Phase 6 for real) */}
      {!book && (
        <div
          style={{
            clear: "both",
            marginTop: 40,
            paddingTop: 14,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted-foreground)",
              marginBottom: 8,
            }}
          >
            Footnotes
          </div>
          {c.footnotes.map((f, i) => (
            <div key={i} style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 4 }}>
              {f}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
