import type { WikiArticle, WikiBlock, WikiMergeSnapshot, ColumnPath, ColumnStructure, ColumnDefinition, WikiTemplate } from "../../types"
import { genId, now, persistBlockBody, removeBlockBody, persistArticleBlocks, removeArticleBlocks, type AppendEventFn } from "../helpers"
import { buildSectionIndex } from "../../wiki-section-index"
import { extractLinksFromWikiBlocks } from "../../body-helpers"
import { resolveWikiTemplate } from "./wiki-templates"
import {
  findBlockLocation,
  insertBlockAtPath,
  removeBlockFromPath,
  patchBlockAtPath,
  updateLeafAtPath,
  firstLeafPath,
  collectBlocksFromLayout,
} from "../../wiki-column-tree"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

/* ── Phase 1 helpers ───────────────────────────────────────────────
 *  Instantiate blocks + columnAssignments from a WikiTemplate.
 *  Each section becomes a Section block (and any initialBlocks attached).
 *  columnAssignments maps every generated block id → its section's columnPath. */

interface TemplateInstantiation {
  blocks: WikiBlock[]
  columnAssignments: Record<string, ColumnPath>
  layout: ColumnStructure
  titleStyle?: WikiArticle["titleStyle"]
  themeColor?: WikiArticle["themeColor"]
}

/**
 * Phase 2-2-C: Infobox + TOC emerge as first-class `WikiBlock`s at instantiation
 * time (no more scalar metadata on `WikiArticle`). The infobox is placed in its
 * template-prescribed column; the TOC lands in the first-of-multi-column or the
 * only column for 1-col templates (keeps it near the content).
 */
function instantiateTemplate(template: WikiTemplate): TemplateInstantiation {
  const blocks: WikiBlock[] = []
  const columnAssignments: Record<string, ColumnPath> = {}
  // Group blocks by columnPath so we can populate ColumnBlocksLeaf.blockIds correctly.
  const blocksByPath = new Map<string, string[]>()
  const pathKey = (p: ColumnPath) => p.join(".")
  const assign = (blockId: string, path: ColumnPath) => {
    columnAssignments[blockId] = path
    const key = pathKey(path)
    if (!blocksByPath.has(key)) blocksByPath.set(key, [])
    blocksByPath.get(key)!.push(blockId)
  }

  // 1) Infobox block — always emit so the authoring UX matches pre-Phase-2-2-C
  //    behaviour (editable articles showed an "+ Add infobox" affordance even
  //    when empty). Uses the template-prescribed column path.
  const infoboxBlock: WikiBlock = {
    id: genId(),
    type: "infobox",
    fields: template.infobox.fields.map((f) => ({ ...f })),
    headerColor: template.infobox.headerColor ?? null,
  }
  blocks.push(infoboxBlock)
  assign(infoboxBlock.id, template.infobox.columnPath)

  // 2) TOC block — defaults to the main column ([0]) so it's always near content.
  //    User can drag it elsewhere post-instantiation.
  const tocBlock: WikiBlock = {
    id: genId(),
    type: "toc",
    tocCollapsed: false,
  }
  blocks.push(tocBlock)
  assign(tocBlock.id, [0])

  // 3) Section blocks (+ optional seed blocks under each) from the template.
  for (const section of template.sections) {
    const sectionBlock: WikiBlock = {
      id: genId(),
      type: "section",
      title: section.title,
      level: section.level,
    }
    blocks.push(sectionBlock)
    assign(sectionBlock.id, section.columnPath)

    if (section.initialBlocks) {
      for (const seed of section.initialBlocks) {
        const b: WikiBlock = { ...seed, id: genId() }
        blocks.push(b)
        assign(b.id, section.columnPath)
      }
    }
  }

  // Walk template.layout and populate the leaf blockIds based on each leaf's path.
  const populated = populateColumnLayoutBlockIds(template.layout, [], blocksByPath)

  return {
    blocks,
    columnAssignments,
    layout: populated,
    titleStyle: template.titleStyle,
    themeColor: template.themeColor,
  }
}

/** Recursively populate ColumnBlocksLeaf.blockIds based on the path map. */
function populateColumnLayoutBlockIds(
  node: ColumnStructure,
  basePath: number[],
  blocksByPath: Map<string, string[]>,
): ColumnStructure {
  return {
    ...node,
    columns: node.columns.map((col, i) => {
      const path = [...basePath, i]
      if (col.content.type === "columns") {
        return { ...col, content: populateColumnLayoutBlockIds(col.content, path, blocksByPath) }
      }
      return {
        ...col,
        content: { type: "blocks", blockIds: blocksByPath.get(path.join(".")) ?? [] },
      }
    }),
  }
}

/** 1-column Blank fallback for articles without a template. */
function blankColumnLayout(blockIds: string[]): ColumnStructure {
  return {
    type: "columns",
    columns: [{ ratio: 1, content: { type: "blocks", blockIds } }],
  }
}

/**
 * Phase 2-2-B-2: Sync every ColumnBlocksLeaf's `blockIds` from the canonical
 * `columnAssignments` record. Keeps the source of truth on `columnAssignments`
 * (blockId → ColumnPath) and makes leaf blockIds a derived view, ordered by
 * the article's `blocks[]` array so ordering stays stable.
 *
 * Blocks whose columnAssignments entry doesn't resolve to any leaf fall back
 * to the first leaf (main column, depth-first) so they remain visible.
 */
function syncLayoutFromAssignments(
  layout: ColumnStructure,
  blocks: WikiBlock[],
  assignments: Record<string, ColumnPath>,
): ColumnStructure {
  const leafPaths: number[][] = []
  const collectLeafPaths = (node: ColumnStructure, basePath: number[]) => {
    node.columns.forEach((col, i) => {
      const p = [...basePath, i]
      if (col.content.type === "columns") collectLeafPaths(col.content, p)
      else leafPaths.push(p)
    })
  }
  collectLeafPaths(layout, [])
  const firstLeafKey = leafPaths[0] ? leafPaths[0].join(".") : ""

  // Phase 3: bucket by block objects (not just ids) so leaf.blocks also gets populated
  const blockMap = new Map(blocks.map((b) => [b.id, b]))
  const idBuckets = new Map<string, string[]>()
  const blockBuckets = new Map<string, WikiBlock[]>()
  leafPaths.forEach((p) => {
    const key = p.join(".")
    idBuckets.set(key, [])
    blockBuckets.set(key, [])
  })
  for (const b of blocks) {
    const assignPath = assignments[b.id]
    const key = assignPath && assignPath.length > 0 ? assignPath.join(".") : firstLeafKey
    const idBucket = idBuckets.get(key) ?? idBuckets.get(firstLeafKey)
    const blkBucket = blockBuckets.get(key) ?? blockBuckets.get(firstLeafKey)
    idBucket?.push(b.id)
    blkBucket?.push(b)
  }

  const rewrite = (node: ColumnStructure, basePath: number[]): ColumnStructure => ({
    ...node,
    columns: node.columns.map((col, i) => {
      const p = [...basePath, i]
      if (col.content.type === "columns") {
        return { ...col, content: rewrite(col.content, p) }
      }
      const key = p.join(".")
      return {
        ...col,
        content: {
          type: "blocks",
          blockIds: idBuckets.get(key) ?? [],
          blocks: blockBuckets.get(key) ?? [],
        },
      }
    }),
  })
  return rewrite(layout, [])
}

/**
 * Phase 2-2-B-3: Immutably insert a new empty column at a parent path, after `afterIndex`.
 * `parentPath: []` means top-level. `afterIndex: -1` inserts at the front.
 * Returns null if parentPath doesn't resolve to a columns node.
 */
function insertColumnAtPath(
  layout: ColumnStructure,
  parentPath: number[],
  afterIndex: number,
  newCol: ColumnDefinition,
): ColumnStructure | null {
  if (parentPath.length === 0) {
    const insertAt = Math.max(-1, Math.min(layout.columns.length - 1, afterIndex)) + 1
    const columns = [...layout.columns.slice(0, insertAt), newCol, ...layout.columns.slice(insertAt)]
    return { ...layout, columns }
  }
  const [head, ...rest] = parentPath
  const col = layout.columns[head]
  if (!col || col.content.type !== "columns") return null
  const updatedInner = insertColumnAtPath(col.content, rest, afterIndex, newCol)
  if (!updatedInner) return null
  const columns = layout.columns.map((c, i) => (i === head ? { ...c, content: updatedInner } : c))
  return { ...layout, columns }
}

/**
 * Phase 2-2-B-3: Immutably remove a column at a ColumnPath. Returns null if the
 * path doesn't resolve to a column, or if removing would leave zero columns.
 */
function removeColumnAtPath(layout: ColumnStructure, path: number[]): ColumnStructure | null {
  if (path.length === 0) return null // can't remove the root structure itself
  if (path.length === 1) {
    const idx = path[0]
    if (idx < 0 || idx >= layout.columns.length) return null
    if (layout.columns.length <= 1) return null // keep at least one column
    return { ...layout, columns: layout.columns.filter((_, i) => i !== idx) }
  }
  const [head, ...rest] = path
  const col = layout.columns[head]
  if (!col || col.content.type !== "columns") return null
  const updatedInner = removeColumnAtPath(col.content, rest)
  if (!updatedInner) return null
  const columns = layout.columns.map((c, i) => (i === head ? { ...c, content: updatedInner } : c))
  return { ...layout, columns }
}

/**
 * Phase 2-2-B-3-b: Convert a leaf cell at `path` into a nested N-column
 * ColumnStructure. The leaf's existing blockIds land in the first inner column;
 * the remaining N-1 inner columns start empty. Returns null if the path doesn't
 * resolve to a blocks-leaf.
 *
 * Depth check is done at the action level (path.length < 3 required so the new
 * inner columns sit at depth <= 3).
 */
function splitLeafAtPath(
  layout: ColumnStructure,
  path: number[],
  splitCount: number,
): ColumnStructure | null {
  if (path.length === 0) return null // root is already columns
  const [head, ...rest] = path
  const col = layout.columns[head]
  if (!col) return null

  if (rest.length === 0) {
    if (col.content.type !== "blocks") return null
    const originalBlockIds = col.content.blockIds
    const innerColumns: ColumnDefinition[] = Array.from({ length: splitCount }, (_, i) => ({
      ratio: 1,
      minWidth: 180,
      content: { type: "blocks" as const, blockIds: i === 0 ? originalBlockIds : [] },
    }))
    const newInner: ColumnStructure = { type: "columns", columns: innerColumns }
    const columns = layout.columns.map((c, i) =>
      i === head ? { ...c, content: newInner } : c,
    )
    return { ...layout, columns }
  }

  if (col.content.type !== "columns") return null
  const updatedInner = splitLeafAtPath(col.content, rest, splitCount)
  if (!updatedInner) return null
  const columns = layout.columns.map((c, i) =>
    i === head ? { ...c, content: updatedInner } : c,
  )
  return { ...layout, columns }
}

/**
 * Phase 2-2-B-3: Remap columnAssignments after a removal — any block whose
 * assignment path was rooted at `removedPath` (or started with it) falls back
 * to the article's first-leaf path.
 */
function remapAssignmentsAfterRemoval(
  assignments: Record<string, ColumnPath>,
  removedPath: number[],
  newLayout: ColumnStructure,
): Record<string, ColumnPath> {
  // Find first leaf path in the new layout (depth-first).
  let firstLeaf: number[] = []
  const find = (node: ColumnStructure, base: number[]): boolean => {
    for (let i = 0; i < node.columns.length; i++) {
      const p = [...base, i]
      const col = node.columns[i]
      if (col.content.type === "columns") {
        if (find(col.content, p)) return true
      } else {
        firstLeaf = p
        return true
      }
    }
    return false
  }
  find(newLayout, [])

  const out: Record<string, ColumnPath> = {}
  const matchesRemoved = (p: number[]) => {
    if (p.length < removedPath.length) return false
    for (let i = 0; i < removedPath.length; i++) if (p[i] !== removedPath[i]) return false
    return true
  }
  for (const [blockId, assignPath] of Object.entries(assignments)) {
    if (matchesRemoved(assignPath)) out[blockId] = firstLeaf
    else out[blockId] = assignPath
  }
  return out
}

/**
 * Phase 2-2-B-1: Immutably update column ratios at a ColumnPath.
 * `path: []` → update top-level ratios. `path: [i]` → update nested columns[i].content (must be ColumnStructure).
 * Returns new ColumnStructure, or `null` if the path doesn't resolve to a columns node.
 */
function updateRatiosAtPath(
  layout: ColumnStructure,
  path: number[],
  newRatios: number[],
): ColumnStructure | null {
  if (path.length === 0) {
    if (newRatios.length !== layout.columns.length) return null
    return {
      ...layout,
      columns: layout.columns.map((col, i) => ({ ...col, ratio: newRatios[i] })),
    }
  }
  const [head, ...rest] = path
  const col = layout.columns[head]
  if (!col || col.content.type !== "columns") return null
  const updatedInner = updateRatiosAtPath(col.content, rest, newRatios)
  if (!updatedInner) return null
  const columns = layout.columns.map((c, i) =>
    i === head ? { ...c, content: updatedInner } : c,
  )
  return { ...layout, columns }
}

/**
 * Build a flat N-column ColumnStructure preset.
 * - 1 col: full-width single column (Blank)
 * - 2 col: main 3fr + sidebar 1fr (min 240px, priority 1 = first to collapse on narrow)
 * - 3 col: main 2fr + 2× sidebar 1fr (each min 200px, priority 1)
 * - N col (4+): equal columns, each ratio 1, min 180px
 *
 * All existing blocks land in column [0] (main). Sidebar columns start empty —
 * Phase 2-2-B will add UI to drag blocks between columns.
 */
function buildColumnPreset(presetCount: number, blockIds: string[]): ColumnStructure {
  const main = { ratio: presetCount === 1 ? 1 : presetCount === 2 ? 3 : 2, content: { type: "blocks" as const, blockIds } }
  if (presetCount === 1) {
    return { type: "columns", columns: [main] }
  }
  if (presetCount === 2) {
    return {
      type: "columns",
      columns: [
        main,
        { ratio: 1, minWidth: 240, priority: 1, content: { type: "blocks", blockIds: [] } },
      ],
    }
  }
  if (presetCount === 3) {
    return {
      type: "columns",
      columns: [
        main,
        { ratio: 1, minWidth: 200, priority: 1, content: { type: "blocks", blockIds: [] } },
        { ratio: 1, minWidth: 200, priority: 2, content: { type: "blocks", blockIds: [] } },
      ],
    }
  }
  // 4+ columns — equal split
  return {
    type: "columns",
    columns: Array.from({ length: presetCount }, (_, i) => ({
      ratio: 1,
      minWidth: 180,
      priority: i + 1,
      content: { type: "blocks" as const, blockIds: i === 0 ? blockIds : [] },
    })),
  }
}

export function createWikiArticlesSlice(set: Set, get: Get) {
  return {
    /* ── CRUD ── */

    createWikiArticle: (partial: {
      title: string
      aliases?: string[]
      tags?: string[]
      blocks?: WikiBlock[]
      templateId?: string
    }) => {
      const id = genId()

      // Phase 1: resolve template if templateId provided. Falls back to default if not found.
      const template = partial.templateId
        ? resolveWikiTemplate(get(), partial.templateId)
        : undefined

      // Block source priority: explicit `partial.blocks` > template instantiation > legacy default.
      let blocks: WikiBlock[]
      let layout: ColumnStructure
      let columnAssignments: Record<string, ColumnPath>
      let titleStyle: WikiArticle["titleStyle"]
      let themeColor: WikiArticle["themeColor"]

      if (partial.blocks) {
        // Explicit blocks override — assume 1-column Blank, no template metadata.
        // Phase 2-2-C: caller is responsible for including any infobox/toc blocks
        // they want (this path bypasses template instantiation entirely).
        blocks = partial.blocks
        const ids = blocks.map((b) => b.id)
        layout = blankColumnLayout(ids)
        columnAssignments = Object.fromEntries(ids.map((bid) => [bid, [0]]))
      } else if (template) {
        const inst = instantiateTemplate(template)
        blocks = inst.blocks
        layout = inst.layout
        columnAssignments = inst.columnAssignments
        titleStyle = inst.titleStyle
        themeColor = inst.themeColor
      } else {
        // Legacy default: Infobox + TOC + Overview + Details + See Also
        // (Phase 2-2-C: meta is now blocks; preserves feature parity with old scalar path)
        const infoboxId = genId()
        const tocId = genId()
        const overviewId = genId()
        const textId = genId()
        const detailsId = genId()
        const seeAlsoId = genId()
        blocks = [
          { id: infoboxId, type: "infobox" as const, fields: [], headerColor: null },
          { id: tocId, type: "toc" as const, tocCollapsed: false },
          { id: overviewId, type: "section" as const, title: "Overview", level: 2 },
          { id: textId, type: "text" as const, content: "" },
          { id: detailsId, type: "section" as const, title: "Details", level: 2 },
          { id: seeAlsoId, type: "section" as const, title: "See Also", level: 2 },
        ]
        const ids = blocks.map((b) => b.id)
        layout = blankColumnLayout(ids)
        columnAssignments = Object.fromEntries(ids.map((bid) => [bid, [0]]))
      }

      const article: WikiArticle = {
        id,
        title: partial.title,
        aliases: partial.aliases ?? [],
        blocks,
        sectionIndex: buildSectionIndex(blocks),
        tags: partial.tags ?? [],
        linksOut: extractLinksFromWikiBlocks(blocks),
        // Phase 1 fields
        layout,
        columnAssignments,
        titleStyle,
        themeColor,
        templateId: template?.id,
        createdAt: now(),
        updatedAt: now(),
      }
      set((state: any) => ({
        wikiArticles: [...state.wikiArticles, article],
      }))
      // Persist text block bodies to IDB
      for (const b of article.blocks) {
        if (b.type === "text" && b.content) {
          persistBlockBody({ id: b.id, content: b.content })
        }
      }
      // Persist block metadata to IDB
      persistArticleBlocks(id, article.blocks)
      return id
    },

    updateWikiArticle: (articleId: string, patch: Partial<Omit<WikiArticle, "id" | "createdAt">>) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId) return a
          const updated = { ...a, ...patch, updatedAt: now() }
          // If blocks were replaced, rebuild sectionIndex, linksOut and persist
          if (patch.blocks) {
            updated.sectionIndex = buildSectionIndex(patch.blocks)
            updated.linksOut = extractLinksFromWikiBlocks(patch.blocks)
            persistArticleBlocks(articleId, patch.blocks)
          }
          return updated
        }),
      }))
    },

    /**
     * Phase 2-2-B-3: Insert a new empty column at `parentPath`, after `afterIndex`.
     * `parentPath: []` = top-level. `afterIndex: -1` inserts at the front.
     * Caps total top-level columns at 6 (matches `applyColumnPreset` clamp).
     */
    addColumnAfter: (articleId: string, parentPath: number[], afterIndex: number) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId || !a.layout) return a
          // Hard cap to prevent runaway column counts (applies to top-level only — nested is user's responsibility).
          if (parentPath.length === 0 && a.layout.columns.length >= 6) return a
          const newCol: ColumnDefinition = {
            ratio: 1,
            minWidth: 180,
            content: { type: "blocks", blockIds: [] },
          }
          const layout = insertColumnAtPath(a.layout, parentPath, afterIndex, newCol)
          if (!layout) return a
          return { ...a, layout, updatedAt: now() }
        }),
      }))
    },

    /**
     * Phase 2-2-B-3: Remove the column at `path`. Blocks that were assigned to
     * the removed column (or any descendant) fall back to the first remaining leaf.
     * No-op if removal would leave zero columns at that level.
     */
    removeColumn: (articleId: string, path: number[]) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId || !a.layout) return a
          const newLayout = removeColumnAtPath(a.layout, path)
          if (!newLayout) return a
          const remappedAssignments = remapAssignmentsAfterRemoval(
            a.columnAssignments ?? {},
            path,
            newLayout,
          )
          const synced = syncLayoutFromAssignments(newLayout, a.blocks, remappedAssignments)
          return { ...a, layout: synced, columnAssignments: remappedAssignments, updatedAt: now() }
        }),
      }))
    },

    /**
     * Phase 2-2-B-3-b: Split a leaf cell at `path` into `count` inner columns.
     * The leaf's existing blocks stay in inner column [0]; the rest start empty.
     * `columnAssignments` entries that pointed to `path` are remapped to `[...path, 0]`.
     *
     * Guards:
     * - `path.length < 3` (so new inner columns live at depth <= 3)
     * - `count` must be 2, 3, or 4
     * - No-op if path doesn't resolve to a blocks-leaf
     */
    splitLeafIntoColumns: (articleId: string, path: number[], count: number) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId || !a.layout) return a
          if (path.length === 0 || path.length >= 3) return a
          if (count < 2 || count > 4) return a
          const newLayout = splitLeafAtPath(a.layout, path, count)
          if (!newLayout) return a
          const pathStr = path.join(".")
          const oldAssignments = a.columnAssignments ?? {}
          const nextAssignments: Record<string, ColumnPath> = {}
          for (const [blockId, p] of Object.entries(oldAssignments)) {
            nextAssignments[blockId] = p.join(".") === pathStr ? [...path, 0] : p
          }
          const synced = syncLayoutFromAssignments(newLayout, a.blocks, nextAssignments)
          return { ...a, layout: synced, columnAssignments: nextAssignments, updatedAt: now() }
        }),
      }))
    },

    /**
     * Phase 2-2-B-2: Move a block to a target column by ColumnPath.
     * Updates `columnAssignments[blockId]` and re-syncs every leaf's blockIds
     * from the canonical assignments map (stable ordering from `blocks[]`).
     * No-op if targetPath doesn't resolve to a leaf within the current layout.
     */
    moveBlockToColumn: (articleId: string, blockId: string, targetPath: ColumnPath) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId || !a.layout) return a
          if (!a.blocks.some((b) => b.id === blockId)) return a
          const nextAssignments = { ...(a.columnAssignments ?? {}), [blockId]: targetPath }
          const layout = syncLayoutFromAssignments(a.layout, a.blocks, nextAssignments)
          return { ...a, layout, columnAssignments: nextAssignments, updatedAt: now() }
        }),
      }))
    },

    /**
     * Phase 2-2-B-1: Update column ratios at a given path (top-level or nested).
     * `path` identifies which ColumnStructure to mutate ([] = top-level, [i] = nested at columns[i], etc.).
     * `newRatios` must match the length of columns at that path. Keeps all other properties intact.
     */
    updateColumnRatios: (articleId: string, path: number[], newRatios: number[]) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId || !a.layout) return a
          const layout = updateRatiosAtPath(a.layout, path, newRatios)
          if (!layout) return a
          return { ...a, layout, updatedAt: now() }
        }),
      }))
    },

    /**
     * Phase 2-2-A: Apply a column count preset (1, 2, 3, ...) to an article.
     * Resets `layout` to a flat preset and `columnAssignments` so all blocks live in column [0].
     * Sidebar columns start empty — Phase 2-2-B will let users drag blocks across columns.
     *
     * If presetCount matches current column count, this is a no-op (preserves user's drag-adjusted ratios).
     */
    applyColumnPreset: (articleId: string, presetCount: number) => {
      const safeCount = Math.max(1, Math.min(6, Math.floor(presetCount)))
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId) return a
          const currentCount = a.layout?.columns.length ?? 1
          if (currentCount === safeCount) return a // no-op preserves user's ratio adjustments
          const blockIds = a.blocks.map((b) => b.id)
          const layout = buildColumnPreset(safeCount, blockIds)
          const columnAssignments = Object.fromEntries(blockIds.map((id) => [id, [0]]))
          return { ...a, layout, columnAssignments, updatedAt: now() }
        }),
      }))
    },

    addArticleReference: (articleId: string, referenceId: string) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) =>
          a.id !== articleId ? a : {
            ...a,
            referenceIds: [...new Set([...(a.referenceIds ?? []), referenceId])],
            updatedAt: now(),
          }
        ),
      }))
    },

    removeArticleReference: (articleId: string, referenceId: string) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) =>
          a.id !== articleId ? a : {
            ...a,
            referenceIds: (a.referenceIds ?? []).filter((id: string) => id !== referenceId),
            updatedAt: now(),
          }
        ),
      }))
    },

    deleteWikiArticle: (articleId: string) => {
      // Clean up block bodies from IDB before removing
      const article = get().wikiArticles.find((a: WikiArticle) => a.id === articleId)
      if (article) {
        for (const b of article.blocks) {
          if (b.type === "text") removeBlockBody(b.id)
        }
      }
      // Remove block metadata from IDB
      removeArticleBlocks(articleId)
      set((state: any) => ({
        wikiArticles: state.wikiArticles.filter((a: WikiArticle) => a.id !== articleId),
      }))
    },

    /* ── Block Operations ── */

    addWikiBlock: (articleId: string, block: Omit<WikiBlock, "id">, afterBlockId?: string) => {
      const newBlock: WikiBlock = { ...block, id: genId() }
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId) return a
          // ── Legacy flat blocks update ──
          const blocks = [...a.blocks]
          if (afterBlockId === "__prepend__") {
            blocks.unshift(newBlock)
          } else if (afterBlockId) {
            const idx = blocks.findIndex((b) => b.id === afterBlockId)
            blocks.splice(idx + 1, 0, newBlock)
          } else {
            blocks.push(newBlock)
          }
          // ── Phase 3: layout leaf sync ──
          let layout = a.layout
          if (layout) {
            // Determine target leaf: same leaf as afterBlockId, or first leaf
            let targetPath: ColumnPath | null = null
            if (afterBlockId && afterBlockId !== "__prepend__") {
              const loc = findBlockLocation(layout, afterBlockId)
              targetPath = loc?.path ?? null
            }
            if (!targetPath) targetPath = firstLeafPath(layout)
            const pos = afterBlockId === "__prepend__" ? "prepend" as const : "append" as const
            layout = insertBlockAtPath(layout, targetPath, newBlock, pos) ?? layout
          }
          const sectionIndex = buildSectionIndex(blocks)
          const linksOut = extractLinksFromWikiBlocks(blocks)
          persistArticleBlocks(articleId, blocks)
          return { ...a, blocks, layout, sectionIndex, linksOut, updatedAt: now() }
        }),
      }))
      // Persist text block body to IDB
      if (newBlock.type === "text" && (newBlock.content || newBlock.contentJson)) {
        persistBlockBody({ id: newBlock.id, content: newBlock.content ?? "", contentJson: newBlock.contentJson })
      }
      return newBlock.id
    },

    removeWikiBlock: (articleId: string, blockId: string) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId) return a
          const blocks = a.blocks.filter((b) => b.id !== blockId)
          // Phase 3: remove from layout leaf too
          let layout = a.layout
          if (layout) {
            const loc = findBlockLocation(layout, blockId)
            if (loc) layout = removeBlockFromPath(layout, loc.path, blockId) ?? layout
          }
          const sectionIndex = buildSectionIndex(blocks)
          const linksOut = extractLinksFromWikiBlocks(blocks)
          persistArticleBlocks(articleId, blocks)
          return { ...a, blocks, layout, sectionIndex, linksOut, updatedAt: now() }
        }),
      }))
      removeBlockBody(blockId)
    },

    updateWikiBlock: (articleId: string, blockId: string, patch: Partial<Omit<WikiBlock, "id">>) => {
      const affectsIndex = patch.title !== undefined || patch.level !== undefined || patch.collapsed !== undefined || patch.type !== undefined
      const affectsLinks = patch.content !== undefined || patch.title !== undefined
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId) return a
          const blocks = a.blocks.map((b) =>
            b.id === blockId ? { ...b, ...patch } : b
          )
          // Phase 3: patch in layout leaf too
          let layout = a.layout
          if (layout) {
            const loc = findBlockLocation(layout, blockId)
            if (loc) layout = patchBlockAtPath(layout, loc.path, blockId, patch) ?? layout
          }
          persistArticleBlocks(articleId, blocks)
          const sectionIndex = affectsIndex ? buildSectionIndex(blocks) : a.sectionIndex
          const linksOut = affectsLinks ? extractLinksFromWikiBlocks(blocks) : a.linksOut
          return { ...a, blocks, layout, sectionIndex, linksOut, updatedAt: now() }
        }),
      }))
      if (patch.content !== undefined) {
        persistBlockBody({ id: blockId, content: patch.content })
      }
    },

    moveWikiBlock: (articleId: string, blockId: string, targetIndex: number) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId) return a
          const blocks = [...a.blocks]
          const fromIdx = blocks.findIndex((b) => b.id === blockId)
          if (fromIdx === -1) return a
          const [moved] = blocks.splice(fromIdx, 1)
          const insertAt = Math.min(targetIndex, blocks.length)
          blocks.splice(insertAt, 0, moved)
          const sectionIndex = buildSectionIndex(blocks)
          persistArticleBlocks(articleId, blocks)
          return { ...a, blocks, sectionIndex, updatedAt: now() }
        }),
      }))
    },

    reorderWikiBlocks: (articleId: string, blockIds: string[]) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId) return a
          const blockMap = new Map(a.blocks.map((b) => [b.id, b]))
          const ordered = blockIds
            .map((id) => blockMap.get(id))
            .filter(Boolean) as WikiBlock[]
          // Phase 3: rebuild each leaf's blocks from the new order.
          // Blocks stay in whatever leaf they were in; only the within-leaf
          // ordering changes to match the new global ordering.
          let layout = a.layout
          if (layout) {
            const newOrderIndex = new Map(blockIds.map((id, idx) => [id, idx]))
            const rebuildLeaf = (leaf: import("../../types").ColumnBlocksLeaf): import("../../types").ColumnBlocksLeaf => {
              if (!leaf.blocks) return leaf
              const sorted = [...leaf.blocks].sort((x, y) =>
                (newOrderIndex.get(x.id) ?? Infinity) - (newOrderIndex.get(y.id) ?? Infinity),
              )
              return { ...leaf, blocks: sorted, blockIds: sorted.map((b) => b.id) }
            }
            const walkReorder = (node: ColumnStructure): ColumnStructure => ({
              ...node,
              columns: node.columns.map((col) =>
                col.content.type === "columns"
                  ? { ...col, content: walkReorder(col.content) }
                  : { ...col, content: rebuildLeaf(col.content) },
              ),
            })
            layout = walkReorder(layout)
          }
          const sectionIndex = buildSectionIndex(ordered)
          persistArticleBlocks(articleId, ordered)
          return { ...a, blocks: ordered, layout, sectionIndex, linksOut: extractLinksFromWikiBlocks(ordered), updatedAt: now() }
        }),
      }))
    },

    mergeWikiArticles: (primaryId: string, secondaryId: string, options?: { title?: string }) => {
      const state = get()
      const primary = (state.wikiArticles as WikiArticle[]).find((a) => a.id === primaryId)
      const secondary = (state.wikiArticles as WikiArticle[]).find((a) => a.id === secondaryId)
      if (!primary || !secondary) return

      // Divider section with merge snapshot for unmerge.
      // Phase 2-2-C: infobox lives inside `blocks` — snapshot carries blocks only.
      const secondaryBlockIds = secondary.blocks.map((b) => b.id)
      const dividerBlock: WikiBlock = {
        id: genId(),
        type: "section" as const,
        title: `From: ${secondary.title}`,
        level: 2,
        mergedFrom: {
          articleId: secondary.id,
          title: secondary.title,
          aliases: [...secondary.aliases],
          tags: [...secondary.tags],
          blockIds: secondaryBlockIds,
          blocks: JSON.parse(JSON.stringify(secondary.blocks)),
          mergedAt: now(),
        },
      }

      // Concat blocks: primary + divider + secondary (infobox blocks naturally included)
      const mergedBlocks = [...primary.blocks, dividerBlock, ...secondary.blocks]

      // Title: use option override, else keep primary title
      const mergedTitle = options?.title ?? primary.title

      // Update primary with merged data
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== primaryId) return a
          const sectionIndex = buildSectionIndex(mergedBlocks)
          return {
            ...a,
            title: mergedTitle,
            blocks: mergedBlocks,
            sectionIndex,
            aliases: [...new Set([...a.aliases, secondary.title, ...secondary.aliases].filter((al) => al !== mergedTitle))],
            tags: [...new Set([...a.tags, ...secondary.tags])],
            linksOut: extractLinksFromWikiBlocks(mergedBlocks),
            updatedAt: now(),
          }
        }),
      }))

      // Persist merged blocks to IDB
      persistArticleBlocks(primaryId, mergedBlocks)

      // Delete secondary article (removes its block metadata from IDB)
      // But DON'T remove text block bodies since they now belong to the primary
      removeArticleBlocks(secondaryId)
      set((state: any) => ({
        wikiArticles: state.wikiArticles.filter((a: WikiArticle) => a.id !== secondaryId),
      }))
    },

    splitWikiArticle: (sourceId: string, blockIds: string[], newTitle: string): string | null => {
      const state = get()
      const source = (state.wikiArticles as WikiArticle[]).find((a) => a.id === sourceId)
      if (!source) return null

      const blockIdSet = new Set(blockIds)
      const extractedBlocks = source.blocks.filter((b) => blockIdSet.has(b.id))
      const remainingBlocks = source.blocks.filter((b) => !blockIdSet.has(b.id))

      if (extractedBlocks.length === 0 || remainingBlocks.length === 0) return null

      // Create new article with extracted blocks
      const newId = genId()
      const newArticle: WikiArticle = {
        id: newId,
        title: newTitle,
        aliases: [],
        blocks: extractedBlocks,
        sectionIndex: buildSectionIndex(extractedBlocks),
        tags: [...source.tags],
        linksOut: extractLinksFromWikiBlocks(extractedBlocks),
        createdAt: now(),
        updatedAt: now(),
      }

      // Update source: remove extracted blocks
      set((state: any) => ({
        wikiArticles: [
          ...state.wikiArticles.map((a: WikiArticle) => {
            if (a.id !== sourceId) return a
            return {
              ...a,
              blocks: remainingBlocks,
              sectionIndex: buildSectionIndex(remainingBlocks),
              linksOut: extractLinksFromWikiBlocks(remainingBlocks),
              updatedAt: now(),
            }
          }),
          newArticle,
        ],
      }))

      // Persist both
      persistArticleBlocks(sourceId, remainingBlocks)
      persistArticleBlocks(newId, extractedBlocks)
      for (const b of extractedBlocks) {
        if (b.type === "text" && b.content) {
          persistBlockBody({ id: b.id, content: b.content })
        }
      }

      return newId
    },

    /** Copy blocks to a new article WITHOUT removing from source (non-destructive) */
    copyToNewArticle: (sourceId: string, blockIds: string[], newTitle: string): string | null => {
      const state = get()
      const source = (state.wikiArticles as WikiArticle[]).find((a) => a.id === sourceId)
      if (!source) return null

      const blockIdSet = new Set(blockIds)
      const blocksToCopy = source.blocks.filter((b) => blockIdSet.has(b.id))
      if (blocksToCopy.length === 0) return null

      // Deep-clone blocks with new IDs
      const clonedBlocks = blocksToCopy.map((b) => ({
        ...b,
        id: genId(),
      }))

      const newId = genId()
      const newArticle: WikiArticle = {
        id: newId,
        title: newTitle,
        aliases: [],
        blocks: clonedBlocks,
        sectionIndex: buildSectionIndex(clonedBlocks),
        tags: [...source.tags],
        linksOut: extractLinksFromWikiBlocks(clonedBlocks),
        createdAt: now(),
        updatedAt: now(),
      }

      // Source is NOT modified — only add the new article
      set((state: any) => ({
        wikiArticles: [...state.wikiArticles, newArticle],
      }))

      // Persist new article blocks + bodies
      persistArticleBlocks(newId, clonedBlocks)
      for (const b of clonedBlocks) {
        if (b.type === "text" && b.content) {
          persistBlockBody({ id: b.id, content: b.content })
        }
      }

      return newId
    },

    unmergeWikiArticle: (articleId: string, dividerBlockId: string): string | null => {
      const state = get()
      const article = (state.wikiArticles as WikiArticle[]).find((a) => a.id === articleId)
      if (!article) return null

      const divider = article.blocks.find((b) => b.id === dividerBlockId)
      if (!divider?.mergedFrom) return null

      const snapshot = divider.mergedFrom
      const mergedBlockIdSet = new Set(snapshot.blockIds)

      // Extract merged blocks + remove divider from original
      const extractedBlocks = article.blocks.filter((b) => mergedBlockIdSet.has(b.id))
      const remainingBlocks = article.blocks.filter((b) => b.id !== dividerBlockId && !mergedBlockIdSet.has(b.id))

      if (extractedBlocks.length === 0) return null

      // Recreate the original article from snapshot
      const restoredId = genId()
      const restoredArticle: WikiArticle = {
        id: restoredId,
        title: snapshot.title,
        aliases: snapshot.aliases,
        blocks: extractedBlocks,
        sectionIndex: buildSectionIndex(extractedBlocks),
        tags: snapshot.tags,
        createdAt: snapshot.mergedAt,
        updatedAt: now(),
      }

      // Remove merged aliases/tags from the original
      const snapshotAliasSet = new Set([snapshot.title, ...snapshot.aliases])
      const snapshotTagSet = new Set(snapshot.tags)

      set((state: any) => ({
        wikiArticles: [
          ...state.wikiArticles.map((a: WikiArticle) => {
            if (a.id !== articleId) return a
            return {
              ...a,
              blocks: remainingBlocks,
              sectionIndex: buildSectionIndex(remainingBlocks),
              aliases: a.aliases.filter((al) => !snapshotAliasSet.has(al)),
              tags: a.tags.filter((t) => !snapshotTagSet.has(t) || a.tags.indexOf(t) < snapshot.tags.length),
              updatedAt: now(),
            }
          }),
          restoredArticle,
        ],
      }))

      persistArticleBlocks(articleId, remainingBlocks)
      persistArticleBlocks(restoredId, extractedBlocks)

      return restoredId
    },

    mergeMultipleWikiArticles: (
      sourceIds: string[],
      options: {
        title: string
        mode: "new" | "into"
        targetId?: string
        blockOrder: WikiBlock[]
        categories?: string[]
        categoryIds?: string[]
        tags?: string[]
        aliases?: string[]
      }
    ): string => {
      const state = get()
      const articles = (state.wikiArticles as WikiArticle[])
      const sources = sourceIds
        .map((id) => articles.find((a) => a.id === id))
        .filter(Boolean) as WikiArticle[]

      if (sources.length === 0) return ""

      // Build merge history snapshots for each source.
      // Phase 2-2-C: infobox now lives inside `blocks` — snapshot just captures blocks.
      const mergeHistory: WikiMergeSnapshot[] = sources.map((src) => ({
        articleId: src.id,
        title: src.title,
        aliases: [...src.aliases],
        tags: [...src.tags],
        blockIds: src.blocks.map((b) => b.id),
        blocks: JSON.parse(JSON.stringify(src.blocks)),
        mergedAt: now(),
      }))

      const blocks = options.blockOrder
      const sectionIndex = buildSectionIndex(blocks)
      const linksOut = extractLinksFromWikiBlocks(blocks)

      // Collect all aliases from sources + explicit aliases
      const allAliases = new Set<string>(options.aliases ?? [])
      for (const src of sources) {
        allAliases.add(src.title)
        for (const a of src.aliases) allAliases.add(a)
      }
      allAliases.delete(options.title) // don't alias self

      // Collect all tags
      const allTags = new Set<string>(options.tags ?? [])
      for (const src of sources) {
        for (const t of src.tags) allTags.add(t)
      }

      // Phase 2-2-C: infobox is now a block — merge order preserves whichever
      // infobox block the caller ordered in `options.blockOrder`. No scalar merge.

      if (options.mode === "into" && options.targetId) {
        // Mode: merge into existing article
        const targetId = options.targetId

        // Filter mergeHistory to exclude the target itself
        const targetMergeHistory = mergeHistory.filter((s) => s.articleId !== targetId)

        // Get existing mergeHistory from target
        const target = articles.find((a) => a.id === targetId)
        const existingHistory = target?.mergeHistory ?? []

        set((state: any) => ({
          wikiArticles: state.wikiArticles
            .filter((a: WikiArticle) => sourceIds.includes(a.id) && a.id !== targetId ? false : true)
            .map((a: WikiArticle) => {
              if (a.id !== targetId) return a
              return {
                ...a,
                title: options.title,
                blocks,
                sectionIndex,
                aliases: Array.from(allAliases),
                tags: Array.from(allTags),
                categoryIds: options.categoryIds ?? a.categoryIds,
                linksOut,
                mergeHistory: [...existingHistory, ...targetMergeHistory],
                updatedAt: now(),
              }
            }),
        }))

        // Persist blocks
        persistArticleBlocks(targetId, blocks)
        for (const b of blocks) {
          if (b.type === "text" && b.content) {
            persistBlockBody({ id: b.id, content: b.content })
          }
        }

        // Clean up deleted sources' IDB data (but not text block bodies since they may be in use)
        for (const id of sourceIds) {
          if (id !== targetId) removeArticleBlocks(id)
        }

        return targetId
      } else {
        // Mode: create new article
        const newId = genId()
        const newArticle: WikiArticle = {
          id: newId,
          title: options.title,
          aliases: Array.from(allAliases),
          blocks,
          sectionIndex,
          tags: Array.from(allTags),
          categoryIds: options.categoryIds,
          linksOut,
          mergeHistory,
          createdAt: now(),
          updatedAt: now(),
        }

        set((state: any) => ({
          wikiArticles: [
            ...state.wikiArticles.filter((a: WikiArticle) => !sourceIds.includes(a.id)),
            newArticle,
          ],
        }))

        // Persist blocks
        persistArticleBlocks(newId, blocks)
        for (const b of blocks) {
          if (b.type === "text" && b.content) {
            persistBlockBody({ id: b.id, content: b.content })
          }
        }

        // Clean up deleted sources' IDB data
        for (const id of sourceIds) {
          removeArticleBlocks(id)
        }

        return newId
      }
    },

    unmergeFromHistory: (articleId: string, snapshotIndex: number): string[] => {
      const state = get()
      const article = (state.wikiArticles as WikiArticle[]).find((a) => a.id === articleId)
      if (!article || !article.mergeHistory) return []

      const snapshot = article.mergeHistory[snapshotIndex]
      if (!snapshot) return []

      const snapshotBlockIdSet = new Set(snapshot.blockIds)

      // Extract blocks that belong to this snapshot from current article
      const extractedBlocks = article.blocks.filter((b) => snapshotBlockIdSet.has(b.id))
      // Remaining blocks = blocks NOT in this snapshot
      const remainingBlocks = article.blocks.filter((b) => !snapshotBlockIdSet.has(b.id))

      // If no blocks could be extracted, use the snapshot's stored blocks
      const restorationBlocks = extractedBlocks.length > 0
        ? extractedBlocks
        : JSON.parse(JSON.stringify(snapshot.blocks)) as WikiBlock[]

      // Create restored article from snapshot.
      // Phase 2-2-C: snapshot.infobox (legacy scalar) no longer restored directly —
      // pre-v78 snapshots would require a migration pass. Current snapshots keep
      // infobox inside `blocks`, so restoration is complete via restorationBlocks.
      const restoredId = genId()
      const restoredArticle: WikiArticle = {
        id: restoredId,
        title: snapshot.title,
        aliases: [...snapshot.aliases],
        blocks: restorationBlocks,
        sectionIndex: buildSectionIndex(restorationBlocks),
        tags: [...snapshot.tags],
        linksOut: extractLinksFromWikiBlocks(restorationBlocks),
        createdAt: snapshot.mergedAt,
        updatedAt: now(),
      }

      // Remove the used snapshot from mergeHistory
      const updatedHistory = [
        ...article.mergeHistory.slice(0, snapshotIndex),
        ...article.mergeHistory.slice(snapshotIndex + 1),
      ]

      // Remove snapshot's aliases/tags from the current article
      const snapshotAliasSet = new Set([snapshot.title, ...snapshot.aliases])
      const snapshotTagSet = new Set(snapshot.tags)

      const updatedRemainingBlocks = remainingBlocks.length > 0 ? remainingBlocks : article.blocks
      const remainingLinksOut = extractLinksFromWikiBlocks(updatedRemainingBlocks)

      set((state: any) => ({
        wikiArticles: [
          ...state.wikiArticles.map((a: WikiArticle) => {
            if (a.id !== articleId) return a
            return {
              ...a,
              blocks: updatedRemainingBlocks,
              sectionIndex: buildSectionIndex(updatedRemainingBlocks),
              aliases: a.aliases.filter((al) => !snapshotAliasSet.has(al)),
              tags: a.tags.filter((t) => !snapshotTagSet.has(t)),
              linksOut: remainingLinksOut,
              mergeHistory: updatedHistory.length > 0 ? updatedHistory : undefined,
              updatedAt: now(),
            }
          }),
          restoredArticle,
        ],
      }))

      persistArticleBlocks(articleId, updatedRemainingBlocks)
      persistArticleBlocks(restoredId, restorationBlocks)
      for (const b of restorationBlocks) {
        if (b.type === "text" && b.content) {
          persistBlockBody({ id: b.id, content: b.content })
        }
      }

      return [restoredId]
    },
  }
}
