"use client"

import type { Shell, ThemeConfig, Book, Block } from "@/lib/book/types"
import { SAMPLE_CONTENT } from "@/lib/book/shells"
import { BookBlockSlot } from "../book-block-slot"
import { usePlotStore } from "@/lib/store"
import {
  EditableParagraph,
  EditableSectionHeading,
  EmptyBookCTA,
  useBlockEditHelpers,
} from "../shared-editable"

interface NewspaperShellProps {
  shell: Shell
  theme: ThemeConfig
  /** Lead headline/body swap to real book; side columns stay as sample. */
  book?: Book
  /** Edit mode — inline editors + block chrome. Default false = read-only render. */
  editing?: boolean
}

export function NewspaperShell({ shell, theme, book, editing = false }: NewspaperShellProps) {
  const c = SAMPLE_CONTENT.newspaper
  const wikiBlocks = usePlotStore((s) =>
    book ? s.wikiArticles.find((a) => a.id === book.id)?.blocks : undefined,
  )
  const realLeadHeadline = book?.title ?? c.lead.headline
  const realLeadBlocks: Array<{ type: "h2" | "p"; text: string; block: Block | undefined }> = book
    ? book.blocks.map((b) => ({
        type: b.type === "heading" ? ("h2" as const) : ("p" as const),
        text: b.text ?? "",
        block: b as Block | undefined,
      }))
    : c.lead.body.map((p: string) => ({ type: "p" as const, text: p, block: undefined }))
  const { buildInsertBelow, buildBlockActions } = useBlockEditHelpers(book, editing)
  const marginScale = theme.margins === "narrow" ? 0.65 : theme.margins === "wide" ? 1.5 : 1
  const pad = `${32 * marginScale}px ${40 * marginScale}px`
  const totalCols = shell.cols >= 3 ? shell.cols : 6
  const leadSpan = Math.max(2, Math.floor(totalCols * (4 / 6)))
  const sideSpan = totalCols - leadSpan
  const leadBodyCols = Math.max(1, Math.floor(leadSpan / 2))
  const quoteColor = theme.quoteColor || "#9b1c1c"

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
      {/* Flag */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #111", paddingBottom: 6, marginBottom: 2 }}>
        <h1
          style={{
            fontFamily: shell.displayFont,
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: "-0.01em",
            margin: 0,
            lineHeight: 1,
          }}
        >
          {c.flag}
        </h1>
        <div style={{ fontFamily: shell.bodyFont, fontSize: 12, fontStyle: "italic", color: "#555", marginTop: 4 }}>
          {c.tagline}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderBottom: "1px solid #111",
          padding: "6px 0 10px",
          marginBottom: 18,
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#333",
        }}
      >
        <span>{c.dateStrip.vol}</span>
        <span>{c.dateStrip.date}</span>
        <span>{c.dateStrip.edition}</span>
      </div>

      {/* Grid body */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${totalCols}, 1fr)`, gap: 0 }}>
        {/* Lead */}
        <div
          style={{
            gridColumn: `1 / span ${leadSpan}`,
            paddingRight: 18,
            borderRight: sideSpan > 0 ? "1px solid rgba(0,0,0,0.25)" : "none",
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: quoteColor,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            {c.lead.kicker}
          </div>
          <h2
            style={{
              fontFamily: shell.displayFont,
              fontSize: 44,
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: "-0.01em",
              margin: "0 0 10px",
            }}
          >
            {realLeadHeadline}
          </h2>
          <div
            style={{
              fontFamily: shell.displayFont,
              fontSize: 18,
              fontStyle: "italic",
              fontWeight: 400,
              color: "#333",
              lineHeight: 1.4,
              marginBottom: 8,
            }}
          >
            {c.lead.deck}
          </div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#555",
              marginBottom: 16,
            }}
          >
            {c.lead.byline}
          </div>

          <div
            style={{
              columnCount: leadBodyCols,
              columnGap: 18,
              fontSize: 13.5,
              lineHeight: 1.55,
              textAlign: "justify",
              hyphens: "auto",
            }}
          >
            {editing && book && book.blocks.length === 0 && <EmptyBookCTA bookId={book.id} />}
            {realLeadBlocks.map((b, i) => {
              const insertBelow = buildInsertBelow(b.block?.id)
              const blockActions = buildBlockActions(b.block, wikiBlocks)
              if (b.type === "h2") {
                const h2Style: React.CSSProperties = {
                  fontFamily: shell.displayFont,
                  fontSize: 20,
                  fontWeight: 800,
                  margin: "10px 0 6px",
                }
                const sectionBody =
                  editing && book && b.block ? (
                    <EditableSectionHeading block={b.block} articleId={book.id} fallbackText={b.text} style={h2Style} />
                  ) : (
                    <h2 style={h2Style}>{b.text}</h2>
                  )
                return (
                  <BookBlockSlot
                    key={b.block?.id ?? i}
                    onInsertBelow={insertBelow}
                    onDelete={blockActions?.onDelete}
                    onDuplicate={blockActions?.onDuplicate}
                    onTurnInto={blockActions?.onTurnInto}
                  >
                    {sectionBody}
                  </BookBlockSlot>
                )
              }
              const isFirst = i === 0
              if (editing && book && b.block) {
                return (
                  <BookBlockSlot
                    key={b.block.id}
                    onInsertBelow={insertBelow}
                    onDelete={blockActions?.onDelete}
                    onDuplicate={blockActions?.onDuplicate}
                    onTurnInto={blockActions?.onTurnInto}
                  >
                    <EditableParagraph block={b.block} articleId={book.id} />
                  </BookBlockSlot>
                )
              }
              return (
                <BookBlockSlot
                  key={b.block?.id ?? i}
                  onInsertBelow={insertBelow}
                  onDelete={blockActions?.onDelete}
                  onDuplicate={blockActions?.onDuplicate}
                  onTurnInto={blockActions?.onTurnInto}
                >
                  <p style={{ margin: "0 0 10px" }}>
                    {isFirst && !book && (
                      <span style={{ fontWeight: 700, letterSpacing: "0.06em" }}>{c.lead.city} </span>
                    )}
                    {b.text}
                  </p>
                </BookBlockSlot>
              )
            })}
            {!book && (
              <p style={{ fontStyle: "italic", color: "#555", margin: "6px 0 0" }}>Continued on Page A12 &rarr;</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {sideSpan > 0 && (
          <div
            style={{
              gridColumn: `${leadSpan + 1} / span ${sideSpan}`,
              paddingLeft: 18,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: quoteColor,
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {c.side1.kicker}
              </div>
              <h3
                style={{
                  fontFamily: shell.displayFont,
                  fontSize: 22,
                  fontWeight: 900,
                  lineHeight: 1.08,
                  margin: "0 0 8px",
                }}
              >
                {c.side1.head}
              </h3>
              <div style={{ fontSize: 13, lineHeight: 1.55, textAlign: "justify" }}>
                {c.side1.body.map((p, i) => (
                  <p key={i} style={{ margin: "0 0 8px" }}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.2)", paddingTop: 14 }}>
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1/1",
                  background: "linear-gradient(135deg, #3a3a3a, #0a0a0a)",
                  marginBottom: 6,
                }}
              />
              <div style={{ fontSize: 10, fontStyle: "italic", color: "#555", lineHeight: 1.4 }}>
                A reader at the Seoul Central Library. PHOTO BY P. KWON
              </div>
            </div>
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.2)", paddingTop: 14 }}>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: quoteColor,
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {c.side2.kicker}
              </div>
              <h3
                style={{
                  fontFamily: shell.displayFont,
                  fontSize: 18,
                  fontWeight: 900,
                  lineHeight: 1.1,
                  margin: "0 0 6px",
                }}
              >
                {c.side2.head}
              </h3>
              <div style={{ fontSize: 13, lineHeight: 1.55 }}>
                {c.side2.body.map((p, i) => (
                  <p key={i} style={{ margin: "0 0 8px" }}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
