/**
 * wiki-to-tiptap.ts
 *
 * Converts a WikiArticle (Zustand model) into TipTap JSON document.
 * Used for "Copy Wiki to Note" — creates an independent copy that can be edited in the note editor.
 *
 * Mapping:
 *   WikiArticle.title       → heading (level 2)
 *   WikiArticle.aliases     → paragraph (italic)
 *   WikiArticle.infobox     → table (2-column key-value)
 *   WikiBlock "section"     → heading (level from block)
 *   WikiBlock "text"        → contentJson if available, else paragraph from content string
 *   WikiBlock "note-ref"    → noteEmbed node
 *   WikiBlock "image"       → paragraph with "[Image: caption]" placeholder
 *   WikiBlock "table"       → table node
 *   WikiBlock "url"         → paragraph with link mark
 */

import type { WikiArticle, WikiBlock, WikiInfoboxEntry } from "./types"

// ── Types ──

interface TipTapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TipTapNode[]
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
  text?: string
}

interface TipTapDoc {
  type: "doc"
  content: TipTapNode[]
}

// ── Helpers ──

function textNode(text: string, marks?: TipTapNode["marks"]): TipTapNode {
  const node: TipTapNode = { type: "text", text }
  if (marks) node.marks = marks
  return node
}

function paragraph(text?: string, marks?: TipTapNode["marks"]): TipTapNode {
  if (!text) return { type: "paragraph" }
  return { type: "paragraph", content: [textNode(text, marks)] }
}

function heading(text: string, level: number): TipTapNode {
  return {
    type: "heading",
    attrs: { level },
    content: [textNode(text)],
  }
}

// ── Block converters ──

function convertSection(block: WikiBlock): TipTapNode {
  return heading(block.title || "Untitled Section", block.level || 2)
}

function convertText(block: WikiBlock): TipTapNode[] {
  // If rich text JSON exists, extract its content nodes directly
  if (block.contentJson && typeof block.contentJson === "object") {
    const doc = block.contentJson as { content?: TipTapNode[] }
    if (doc.content && Array.isArray(doc.content)) {
      return doc.content
    }
  }
  // Fallback: plain text → split by newlines into paragraphs
  if (block.content) {
    return block.content.split("\n\n").map((para) => {
      if (!para.trim()) return { type: "paragraph" }
      return paragraph(para.trim())
    })
  }
  return [{ type: "paragraph" }]
}

function convertNoteRef(block: WikiBlock): TipTapNode {
  return {
    type: "noteEmbed",
    attrs: { noteId: block.noteId, synced: false, width: null, height: null },
  }
}

function convertImage(block: WikiBlock): TipTapNode {
  // Note editor doesn't have direct wiki image support,
  // create a placeholder paragraph
  const caption = block.caption || "Image"
  return paragraph(`[Image: ${caption}]`, [{ type: "italic" }])
}

function convertTable(block: WikiBlock): TipTapNode {
  const headers = block.tableHeaders || []
  const rows = block.tableRows || []

  const headerCells = headers.map((h) => ({
    type: "tableHeader" as const,
    attrs: { colspan: 1, rowspan: 1, colwidth: null },
    content: [paragraph(h)],
  }))

  const dataRows = rows.map((row) => ({
    type: "tableRow" as const,
    content: row.map((cell) => ({
      type: "tableCell" as const,
      attrs: { colspan: 1, rowspan: 1, colwidth: null },
      content: [paragraph(cell)],
    })),
  }))

  const tableContent: TipTapNode[] = []
  if (headerCells.length > 0) {
    tableContent.push({ type: "tableRow", content: headerCells })
  }
  tableContent.push(...dataRows)

  // If table has a caption, add it as a paragraph before
  const result: TipTapNode[] = []
  if (block.tableCaption) {
    result.push(paragraph(block.tableCaption, [{ type: "bold" }]))
  }
  if (tableContent.length > 0) {
    result.push({ type: "table", content: tableContent })
  }
  return result.length === 1 ? result[0] : { type: "table", content: tableContent }
}

function convertUrl(block: WikiBlock): TipTapNode {
  const title = block.urlTitle || block.url || "Link"
  const url = block.url || ""
  return {
    type: "paragraph",
    content: [
      textNode(title, [{ type: "link", attrs: { href: url, target: "_blank" } }]),
    ],
  }
}

// ── Infobox converter ──

function convertInfobox(entries: WikiInfoboxEntry[]): TipTapNode[] {
  if (!entries || entries.length === 0) return []

  const headerRow: TipTapNode = {
    type: "tableRow",
    content: [
      {
        type: "tableHeader",
        attrs: { colspan: 2, rowspan: 1, colwidth: null },
        content: [paragraph("INFO", [{ type: "bold" }])],
      },
    ],
  }

  const dataRows = entries.map((entry) => ({
    type: "tableRow" as const,
    content: [
      {
        type: "tableCell" as const,
        attrs: { colspan: 1, rowspan: 1, colwidth: null },
        content: [paragraph(entry.key, [{ type: "bold" }])],
      },
      {
        type: "tableCell" as const,
        attrs: { colspan: 1, rowspan: 1, colwidth: null },
        content: [paragraph(entry.value)],
      },
    ],
  }))

  return [
    { type: "table", content: [headerRow, ...dataRows] },
  ]
}

// ── Main converter ──

/**
 * Convert a WikiArticle to a TipTap JSON document.
 * The result can be inserted into a note editor via editor.commands.setContent().
 */
export function wikiArticleToTipTap(article: WikiArticle): TipTapDoc {
  const content: TipTapNode[] = []

  // 1. Title as H2
  content.push(heading(article.title, 2))

  // 2. Aliases as subtitle
  if (article.aliases.length > 0) {
    content.push(paragraph(article.aliases.join(" · "), [{ type: "italic" }]))
  }

  // 3. Infobox as table
  content.push(...convertInfobox(article.infobox))

  // 4. Horizontal rule separator
  if (article.infobox.length > 0) {
    content.push({ type: "horizontalRule" })
  }

  // 5. Blocks
  for (const block of article.blocks) {
    switch (block.type) {
      case "section":
        content.push(convertSection(block))
        break
      case "text": {
        const nodes = convertText(block)
        content.push(...nodes)
        break
      }
      case "note-ref":
        content.push(convertNoteRef(block))
        break
      case "image":
        content.push(convertImage(block))
        break
      case "table": {
        const tableNodes = convertTable(block)
        if (Array.isArray(tableNodes)) {
          content.push(...tableNodes)
        } else {
          content.push(tableNodes)
        }
        break
      }
      case "url":
        content.push(convertUrl(block))
        break
      default:
        // Unknown block type — skip
        break
    }
  }

  return { type: "doc", content }
}

/**
 * Convert a WikiArticle to plain text (for note.content field).
 */
export function wikiArticleToPlainText(article: WikiArticle): string {
  const lines: string[] = []

  lines.push(`# ${article.title}`)
  if (article.aliases.length > 0) {
    lines.push(article.aliases.join(", "))
  }
  lines.push("")

  for (const block of article.blocks) {
    switch (block.type) {
      case "section":
        lines.push(`${"#".repeat(block.level || 2)} ${block.title || "Untitled"}`)
        break
      case "text":
        if (block.content) lines.push(block.content)
        break
      case "note-ref":
        lines.push(`[Embedded note: ${block.noteId}]`)
        break
      case "url":
        lines.push(block.urlTitle || block.url || "")
        break
      default:
        break
    }
    lines.push("")
  }

  return lines.join("\n").trim()
}
