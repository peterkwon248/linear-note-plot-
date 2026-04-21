/**
 * Book Pivot Phase 1A-2 — WikiArticle ↔ Book adapter (on-the-fly conversion).
 *
 * Used as a bridge while the store still stores `WikiArticle`. Phase 1A-3 will
 * add a real `books` slice + migration v81; Phase 1C deletes wikiArticles.
 *
 * **Lossy-forward, lossless-reverse policy**:
 *   - wikiArticleToBook: loses ColumnStructure nuance (all cells collapse to full-width sequential rows).
 *     That's OK — Phase 2 grid editor lets users re-arrange. Column layout is ephemeral.
 *   - bookToWikiArticle: used for writes during the transition. Preserves `blocks` as WikiBlock[]
 *     and flattens `layout` into a single column. Callers must be OK with that loss until Phase 1C
 *     flips storage.
 *
 * Cell mapping (Phase 1A-2 simple version):
 *   - All blocks get `{col: 1, span: 12, row: index+1}` (sequential full-width rows).
 *   - Phase 2 will derive cell from `columnAssignments` properly (12-col grid mapping).
 */

import type { WikiArticle, WikiBlock, WikiBlockType } from "../types"
import type { Book, Block, BlockType, ShellId, ThemeConfig, DecorationConfig } from "./types"

// ─── WikiBlock → Block ────────────────────────────────────────────

/**
 * Map WikiBlockType → Book BlockType. Some wiki types have no direct Book
 * equivalent yet (table, note-ref, url, column-group) — they map to "paragraph"
 * and stash original data in props so Phase 2 renderers can handle them.
 */
function wikiBlockTypeToBookType(type: WikiBlockType): BlockType {
  switch (type) {
    case "section":
      return "heading"
    case "text":
      return "paragraph"
    case "image":
      return "image"
    case "infobox":
      return "infobox"
    case "toc":
      return "toc"
    case "pull-quote":
      return "pullquote"
    case "table":
    case "note-ref":
    case "url":
    case "column-group":
      return "paragraph" // fallback — props carries original data
    default:
      return "paragraph"
  }
}

/**
 * Convert a single WikiBlock to a Book Block.
 * Non-mapped fields go into `props` for renderer access.
 */
export function wikiBlockToBlock(wb: WikiBlock, rowIndex: number): Block {
  const type = wikiBlockTypeToBookType(wb.type)

  // Text content prioritises plaintext `content`, falls back to `title` (section) or empty.
  const text =
    wb.type === "section"
      ? wb.title ?? ""
      : wb.type === "text"
        ? wb.content ?? ""
        : wb.type === "pull-quote"
          ? wb.quoteText ?? ""
          : wb.type === "url"
            ? wb.urlTitle ?? wb.url ?? ""
            : ""

  // Props stash everything type-specific so renderers can recover it.
  const props: Record<string, unknown> = {
    originalType: wb.type,
  }
  if (wb.level !== undefined) props.level = wb.level
  if (wb.collapsed !== undefined) props.collapsed = wb.collapsed
  if (wb.noteId) props.noteId = wb.noteId
  if (wb.contentJson) props.contentJson = wb.contentJson
  if (wb.attachmentId) props.attachmentId = wb.attachmentId
  if (wb.caption) props.caption = wb.caption
  if (wb.imageWidth !== undefined) props.imageWidth = wb.imageWidth
  if (wb.url) props.url = wb.url
  if (wb.urlTitle) props.urlTitle = wb.urlTitle
  if (wb.tableHeaders) props.tableHeaders = wb.tableHeaders
  if (wb.tableRows) props.tableRows = wb.tableRows
  if (wb.tableCaption) props.tableCaption = wb.tableCaption
  if (wb.tableColumnAligns) props.tableColumnAligns = wb.tableColumnAligns
  if (wb.tableAlign) props.tableAlign = wb.tableAlign
  if (wb.fontSize !== undefined) props.fontSize = wb.fontSize
  if (wb.fields) props.fields = wb.fields
  if (wb.headerColor !== undefined) props.headerColor = wb.headerColor
  if (wb.tocCollapsed !== undefined) props.tocCollapsed = wb.tocCollapsed
  if (wb.hiddenLevels) props.hiddenLevels = wb.hiddenLevels
  if (wb.quoteAttribution) props.quoteAttribution = wb.quoteAttribution
  if (wb.quoteVariant) props.quoteVariant = wb.quoteVariant
  if (wb.columnChildren) props.columnChildren = wb.columnChildren
  if (wb.width !== undefined) props.width = wb.width
  if (wb.density !== undefined) props.density = wb.density

  return {
    id: wb.id,
    type,
    col: 1,
    span: 12,
    row: rowIndex + 1,
    text,
    props,
  }
}

// ─── WikiArticle → Book ────────────────────────────────────────────

/**
 * Convert a WikiArticle into a Book with shell="wiki".
 * - All blocks become full-width sequential rows (12-col grid mapping is Phase 2).
 * - theme.accentColor derives from WikiArticle.themeColor if present.
 * - decoration defaults to empty (Phase 5 populates).
 * - pages stays empty (flipbook is Phase 4).
 */
export function wikiArticleToBook(article: WikiArticle): Book {
  // Phase 3 per-column blocks: if layout has per-leaf `blocks`, flatten in order.
  const flatBlocks: WikiBlock[] = Array.isArray(article.blocks)
    ? article.blocks
    : []

  const blocks: Block[] = flatBlocks.map((wb, i) => wikiBlockToBlock(wb, i))

  const themeAccent = (article as WikiArticle & { themeColor?: { light?: string } })
    .themeColor?.light

  const theme: ThemeConfig = {
    bgColor: "",
    texture: "none",
    cardBorder: "",
    fontPair: "default",
    accentColor: themeAccent ?? "",
    textColor: "",
    quoteColor: "",
    cols: 0,
    margins: "standard",
    chapterStyle: "default",
  }

  const decoration: DecorationConfig = {
    ribbon: false,
    ribbonColor: "#9b1c1c",
    bookmark: false,
    ornament: false,
    flipbook: false,
  }

  return {
    id: article.id,
    title: article.title,
    shell: "wiki" as ShellId,
    renderMode: "scroll",
    theme,
    decoration,
    pages: [],
    blocks,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  }
}

// ─── Book → WikiArticle (reverse, used during transition for writes) ──

/**
 * Reverse conversion — collapse a Book back into WikiArticle shape so the
 * existing wiki-articles slice can persist changes. Lossy for Book-only features
 * (shell, theme, decoration, renderMode, cell positions).
 */
export function bookBlockToWikiBlock(b: Block): WikiBlock {
  const origType = (b.props?.originalType as WikiBlockType | undefined) ?? undefined
  const type: WikiBlockType =
    origType ??
    (b.type === "heading"
      ? "section"
      : b.type === "paragraph"
        ? "text"
        : b.type === "image"
          ? "image"
          : b.type === "infobox"
            ? "infobox"
            : b.type === "toc"
              ? "toc"
              : b.type === "pullquote"
                ? "pull-quote"
                : "text")

  const wb: WikiBlock = { id: b.id, type }

  if (type === "section") {
    wb.title = b.text
    if (b.props?.level !== undefined) wb.level = b.props.level as number
    if (b.props?.collapsed !== undefined) wb.collapsed = b.props.collapsed as boolean
  } else if (type === "text") {
    wb.content = b.text
    if (b.props?.contentJson) wb.contentJson = b.props.contentJson as Record<string, unknown>
  } else if (type === "pull-quote") {
    wb.quoteText = b.text
    if (b.props?.quoteAttribution) wb.quoteAttribution = b.props.quoteAttribution as string
    if (b.props?.quoteVariant) wb.quoteVariant = b.props.quoteVariant as WikiBlock["quoteVariant"]
  } else if (type === "image") {
    if (b.props?.attachmentId) wb.attachmentId = b.props.attachmentId as string
    if (b.props?.caption) wb.caption = b.props.caption as string
    if (b.props?.imageWidth !== undefined) wb.imageWidth = b.props.imageWidth as number
  } else if (type === "infobox") {
    if (b.props?.fields) wb.fields = b.props.fields as WikiBlock["fields"]
    if (b.props?.headerColor !== undefined) wb.headerColor = b.props.headerColor as string | null
  } else if (type === "toc") {
    if (b.props?.tocCollapsed !== undefined) wb.tocCollapsed = b.props.tocCollapsed as boolean
    if (b.props?.hiddenLevels) wb.hiddenLevels = b.props.hiddenLevels as number[]
  } else if (type === "url") {
    if (b.props?.url) wb.url = b.props.url as string
    if (b.props?.urlTitle) wb.urlTitle = b.props.urlTitle as string
  }

  // Universal optional fields
  if (b.props?.fontSize !== undefined) wb.fontSize = b.props.fontSize as number
  if (b.props?.width !== undefined) wb.width = b.props.width as WikiBlock["width"]
  if (b.props?.density !== undefined) wb.density = b.props.density as WikiBlock["density"]

  return wb
}
