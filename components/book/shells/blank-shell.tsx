"use client"

import type { Shell, ThemeConfig, Book, Block } from "@/lib/book/types"
import { BookBlockSlot } from "../book-block-slot"
import { usePlotStore } from "@/lib/store"
import {
  EditableParagraph,
  EditableSectionHeading,
  EmptyBookCTA,
  useBlockEditHelpers,
} from "../shared-editable"

interface BlankShellProps {
  shell: Shell
  theme: ThemeConfig
  /** When a book is loaded, render its blocks as a simple 12-col flow. */
  book?: Book
  /** Edit mode — inline editors + block chrome. Default false = read-only render. */
  editing?: boolean
}

export function BlankShell({ shell, theme, book, editing = false }: BlankShellProps) {
  const marginScale = theme.margins === "narrow" ? 0.65 : theme.margins === "wide" ? 1.5 : 1
  const pad = `${48 * marginScale}px`
  const wikiBlocks = usePlotStore((s) =>
    book ? s.wikiArticles.find((a) => a.id === book.id)?.blocks : undefined,
  )
  const { buildInsertBelow, buildBlockActions } = useBlockEditHelpers(book, editing)

  return (
    <div
      style={{
        maxWidth: shell.maxWidth,
        margin: "0 auto",
        padding: pad,
        fontFamily: shell.bodyFont,
        color: shell.fg,
        minHeight: "60vh",
      }}
    >
      {book ? (
        <>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: "0 0 24px",
            }}
          >
            {book.title}
          </h1>
          {editing && book.blocks.length === 0 && <EmptyBookCTA bookId={book.id} />}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 16,
            }}
          >
            {book.blocks.map((b) => {
              const blk = b as Block
              const insertBelow = buildInsertBelow(b.id)
              const blockActions = buildBlockActions(blk, wikiBlocks)
              const slotProps = {
                onInsertBelow: insertBelow,
                onDelete: blockActions?.onDelete,
                onDuplicate: blockActions?.onDuplicate,
                onTurnInto: blockActions?.onTurnInto,
              }
              const gridStyle: React.CSSProperties = {
                gridColumn: `${b.col} / span ${b.span}`,
                padding: "6px 0",
              }
              if (b.type === "heading") {
                const h2Style: React.CSSProperties = {
                  fontSize: 20,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  margin: 0,
                }
                return (
                  <div key={b.id} style={gridStyle}>
                    <BookBlockSlot {...slotProps}>
                      {editing ? (
                        <EditableSectionHeading block={blk} articleId={book.id} fallbackText={b.text} style={h2Style} />
                      ) : (
                        <h2 style={h2Style}>{b.text}</h2>
                      )}
                    </BookBlockSlot>
                  </div>
                )
              }
              if (b.type === "paragraph") {
                return (
                  <div key={b.id} style={gridStyle}>
                    <BookBlockSlot {...slotProps}>
                      {editing ? (
                        <EditableParagraph block={blk} articleId={book.id} />
                      ) : (
                        <p style={{ fontSize: 15, lineHeight: 1.65, margin: 0 }}>{b.text}</p>
                      )}
                    </BookBlockSlot>
                  </div>
                )
              }
              // Fallback for other types — render plain text
              return (
                <div
                  key={b.id}
                  style={{
                    ...gridStyle,
                    fontSize: 15,
                    lineHeight: 1.65,
                  }}
                >
                  <BookBlockSlot {...slotProps}>{b.text}</BookBlockSlot>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 16,
              minHeight: 400,
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: "var(--hover-bg)",
                  borderRadius: 4,
                  minHeight: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "var(--muted-foreground)",
                  border: "1px dashed var(--border-subtle)",
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: 48,
              color: "var(--muted-foreground)",
              fontSize: 14,
            }}
          >
            <p style={{ marginBottom: 8 }}>Blank shell &mdash; 12-column grid, no chrome</p>
            <p style={{ fontSize: 12, opacity: 0.7 }}>
              Press <kbd style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "1px 6px",
              }}>/</kbd> in the Grid Editor to add blocks
            </p>
          </div>
        </>
      )}
    </div>
  )
}
