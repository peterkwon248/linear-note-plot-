"use client"

/**
 * ColumnRenderer — Phase 2-1A.
 *
 * Recursive renderer for `ColumnStructure`. The renderer itself is block-agnostic:
 * the caller provides a `renderBlock(id)` callback and the renderer just decides
 * WHERE blocks go (which column, which order). Meta content (TOC, infobox, hatnote)
 * is injected via `metaSlots` keyed by column-path string ("0", "1", "0.1" etc.).
 *
 * Phase 2-1A: stand-alone component, NOT yet wired into existing wiki article views.
 * Phase 2-1B will replace `wiki-article-view` + `wiki-article-encyclopedia` with this.
 *
 * Layout: CSS Grid. `ratio` → `fr` units. `minWidth` → `minmax(min, fr)`.
 * Direction "horizontal" = columns side-by-side. "vertical" = stacked rows.
 *
 * 진실의 원천: docs/BRAINSTORM-2026-04-14-column-template-system.md (Phase 2 절)
 */

import { type CSSProperties, type ReactNode, Fragment } from "react"
import type { ColumnStructure, ColumnDefinition, ColumnPath } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface ColumnRendererProps {
  /** The column tree to render. */
  layout: ColumnStructure
  /**
   * Render a single block by id. Returning `null` is fine — the renderer skips it.
   * The caller controls block component selection (text/section/image/...).
   */
  renderBlock: (blockId: string) => ReactNode
  /**
   * Optional meta content keyed by column-path string (e.g. "1" or "0.2").
   * ColumnRenderer injects each entry's nodes BEFORE the leaf's blocks in that column.
   * Used for TOC, infobox, hatnotes, etc.
   *
   * Note: paths are encoded as `path.join(".")` for stable lookup.
   */
  metaSlots?: Record<string, ReactNode>
  /** Optional className applied to the outermost wrapper. */
  className?: string
}

/* ── Path helpers ──────────────────────────────────────────────── */

/** Encode a ColumnPath as a string key for metaSlots lookup. */
export function pathKey(path: ColumnPath): string {
  return path.join(".")
}

/** Decode a path key back to ColumnPath. Returns [] for empty key. */
export function parsePathKey(key: string): ColumnPath {
  if (!key) return []
  return key.split(".").map((s) => parseInt(s, 10))
}

/* ── Public component ─────────────────────────────────────────── */

export function ColumnRenderer({
  layout,
  renderBlock,
  metaSlots,
  className,
}: ColumnRendererProps) {
  return (
    <ColumnNode
      node={layout}
      basePath={[]}
      renderBlock={renderBlock}
      metaSlots={metaSlots ?? {}}
      className={className}
    />
  )
}

/* ── Recursive node ───────────────────────────────────────────── */

interface ColumnNodeProps {
  node: ColumnStructure
  basePath: number[]
  renderBlock: (blockId: string) => ReactNode
  metaSlots: Record<string, ReactNode>
  className?: string
}

function ColumnNode({ node, basePath, renderBlock, metaSlots, className }: ColumnNodeProps) {
  const direction = node.direction ?? "horizontal"
  const isHorizontal = direction === "horizontal"

  // Build CSS Grid template from each column's ratio + minWidth.
  // ratio → fr unit. minWidth → minmax(min, fr).
  const tracks = node.columns.map((col) => buildTrack(col)).join(" ")
  const gridStyle: CSSProperties = isHorizontal
    ? { display: "grid", gridTemplateColumns: tracks, gap: "1.5rem" }
    : { display: "grid", gridTemplateRows: tracks, gap: "1rem" }

  return (
    <div className={cn("wiki-column-grid", className)} style={gridStyle} data-direction={direction}>
      {node.columns.map((col, i) => {
        const childPath = [...basePath, i]
        return (
          <ColumnCell
            key={i}
            column={col}
            path={childPath}
            renderBlock={renderBlock}
            metaSlots={metaSlots}
          />
        )
      })}
    </div>
  )
}

interface ColumnCellProps {
  column: ColumnDefinition
  path: number[]
  renderBlock: (blockId: string) => ReactNode
  metaSlots: Record<string, ReactNode>
}

function ColumnCell({ column, path, renderBlock, metaSlots }: ColumnCellProps) {
  const meta = metaSlots[pathKey(path)]

  // Recurse if nested columns
  if (column.content.type === "columns") {
    return (
      <div className="wiki-column-cell">
        {meta /* meta injected before nested grid */}
        <ColumnNode
          node={column.content}
          basePath={path}
          renderBlock={renderBlock}
          metaSlots={metaSlots}
        />
      </div>
    )
  }

  // Leaf: render blocks in order
  return (
    <div className="wiki-column-cell flex flex-col gap-3">
      {meta}
      {column.content.blockIds.map((blockId) => (
        <Fragment key={blockId}>{renderBlock(blockId)}</Fragment>
      ))}
    </div>
  )
}

/* ── Grid track builder ────────────────────────────────────────── */

function buildTrack(col: ColumnDefinition): string {
  const fr = `${col.ratio}fr`
  if (col.minWidth && col.minWidth > 0) {
    return `minmax(${col.minWidth}px, ${fr})`
  }
  return fr
}
