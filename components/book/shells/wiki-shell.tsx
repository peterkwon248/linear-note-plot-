"use client"

import type { Shell, ThemeConfig, Book, Block } from "@/lib/book/types"
import { SAMPLE_CONTENT } from "@/lib/book/shells"
import { ChapterDivider } from "./chapter-divider"
import { BookBlockSlot } from "../book-block-slot"
import { BookDndProvider } from "../book-dnd-provider"
import { usePlotStore } from "@/lib/store"
import { computeSectionNumbers } from "@/lib/wiki-block-utils"
import {
  EditableParagraph,
  EditableSectionHeading,
  EmptyBookCTA,
  useBlockEditHelpers,
} from "../shared-editable"
import { WikiBlockRenderer } from "@/components/wiki-editor/wiki-block-renderer"
import type { WikiBlock } from "@/lib/types"

interface WikiShellProps {
  shell: Shell
  theme: ThemeConfig
  /** When provided, title + body render from the real book. Infobox/TOC/footnotes still use sample until Phase 6. */
  book?: Book
  /** Edit mode — show inline editors + block chrome (add/delete/menu). Default false = read-only render. */
  editing?: boolean
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
      // Preserve original Book Block type; only collapse heading→h2 and paragraph→p for
      // the inline editable paths. All other types (infobox/toc/image/url/table/pullquote)
      // keep their original type and fall through to WikiBlockRenderer in the render loop.
      type: b.type === "heading" ? "h2" : b.type === "paragraph" ? "p" : b.type,
      text: b.text ?? "",
      block: b,
    })) ?? c.body.map((b) => ({ ...b, block: undefined as Block | undefined }))
  const { buildInsertBelow, buildBlockActions } = useBlockEditHelpers(book, editing)

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
      <BookDndProvider
        articleId={book?.id}
        items={book ? book.blocks.map((b) => b.id) : []}
        enabled={!!(editing && book)}
      >
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
              const insertBelow = buildInsertBelow(b.block?.id)
              const blockActions = buildBlockActions(b.block, wikiBlocks)
              const slotProps = {
                blockId: editing && book && b.block ? b.block.id : undefined,
                onInsertBelow: insertBelow,
                onDelete: blockActions?.onDelete,
                onDuplicate: blockActions?.onDuplicate,
                onTurnInto: blockActions?.onTurnInto,
              }

              if (b.type === "lead")
                return (
                  <BookBlockSlot key={b.block?.id ?? i} {...slotProps}>
                    <p style={{ marginBottom: 16 }}>{b.text}</p>
                  </BookBlockSlot>
                )
              if (b.type === "h2") {
                hc += 1
                const h2Style: React.CSSProperties = {
                  fontSize: 22,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: 6,
                  marginTop: 28,
                  marginBottom: 12,
                  breakInside: "avoid",
                }
                return (
                  <BookBlockSlot key={b.block?.id ?? i} {...slotProps}>
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
                    {editing && book && b.block ? (
                      <EditableSectionHeading
                        block={b.block}
                        articleId={book.id}
                        sectionNumber={sectionNumbers?.get(b.block.id)}
                        fallbackText={b.text}
                        style={h2Style}
                      />
                    ) : (
                      <h2 style={h2Style}>
                        {b.block && sectionNumbers?.get(b.block.id) && (
                          <span style={{ color: "var(--muted-foreground)", marginRight: 8, fontWeight: 400 }}>
                            {sectionNumbers.get(b.block.id)}
                          </span>
                        )}
                        {b.text}
                      </h2>
                    )}
                  </BookBlockSlot>
                )
              }
              if (b.type === "p") {
                if (book && b.block) {
                  return (
                    <BookBlockSlot key={b.block.id} {...slotProps}>
                      {editing ? (
                        <EditableParagraph block={b.block} articleId={book.id} />
                      ) : (
                        <p style={{ marginBottom: 14 }}>{b.text}</p>
                      )}
                    </BookBlockSlot>
                  )
                }
                return (
                  <BookBlockSlot key={b.block?.id ?? i} {...slotProps}>
                    <p style={{ marginBottom: 14 }}>{b.text}</p>
                  </BookBlockSlot>
                )
              }
              // Fallback for all remaining types (infobox / toc / pull-quote / image / url / table / note-ref / column-group)
              // — delegate to the full WikiBlockRenderer so each type renders with its real chrome.
              if (book && b.block) {
                const wb = wikiBlocks?.find((w) => w.id === b.block!.id)
                if (wb) {
                  return (
                    <BookBlockSlot key={wb.id} {...slotProps}>
                      <WikiBlockRenderer
                        block={wb}
                        articleId={book.id}
                        editable={editing}
                        onUpdate={
                          editing
                            ? (patch) => usePlotStore.getState().updateWikiBlock(book.id, wb.id, patch)
                            : undefined
                        }
                        onDelete={blockActions?.onDelete}
                      />
                    </BookBlockSlot>
                  )
                }
              }
              return null
            })
          })()}
        </div>
      </BookDndProvider>

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
