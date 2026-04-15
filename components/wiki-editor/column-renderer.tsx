"use client"

/**
 * ColumnRenderer — Phase 2-1A + Phase 2-2-B-1 (편집 모드 드래그 핸들).
 *
 * Recursive renderer for `ColumnStructure`. Block-agnostic — caller provides
 * `renderBlock(id)`. Meta content (TOC, infobox, hatnote) injected via
 * `metaSlots` keyed by column-path string ("0", "1", "0.1" etc.).
 *
 * Phase 2-2-B-1 additions:
 * - `editable` + `onRatiosChange(path, newRatios)` props
 * - When editable + horizontal: top-level uses `react-resizable-panels` for drag handles
 * - Read mode (or vertical): plain CSS Grid as before
 * - Nested columns always use CSS Grid (PanelGroup nesting adds UX complexity; Phase 2-2-B-3)
 *
 * 진실의 원천: docs/BRAINSTORM-2026-04-14-column-template-system.md
 */

import { type CSSProperties, type ReactNode, Fragment } from "react"
import type { ColumnStructure, ColumnDefinition, ColumnPath } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { useDroppable } from "@dnd-kit/core"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"

export interface ColumnRendererProps {
  /** The column tree to render. */
  layout: ColumnStructure
  /**
   * Render a single block by id. Returning `null` is fine — the renderer skips it.
   */
  renderBlock: (blockId: string) => ReactNode
  /**
   * Meta content keyed by column-path string (e.g. "1" or "0.2").
   * Injected BEFORE the leaf's blocks in that column. Used for TOC, infobox, etc.
   */
  metaSlots?: Record<string, ReactNode>
  /**
   * When true, top-level horizontal columns render with react-resizable-panels
   * so users can drag column boundaries. Nested columns keep CSS Grid.
   */
  editable?: boolean
  /**
   * Called when user drags a column boundary (`editable` must be true).
   * Receives the ColumnPath of the parent whose columns' ratios changed,
   * plus the new ratios array (same length as columns at that path).
   */
  onRatiosChange?: (path: ColumnPath, newRatios: number[]) => void
  /**
   * Phase 2-2-B-3: Called when user clicks a `+` button to insert a column.
   * `parentPath` = which ColumnStructure to mutate. `afterIndex = -1` inserts at the front.
   */
  onAddColumnAfter?: (parentPath: number[], afterIndex: number) => void
  /**
   * Phase 2-2-B-3: Called when user clicks a column's delete X button.
   * `path` = full path to the column being removed.
   */
  onRemoveColumn?: (path: number[]) => void
  /** Optional className applied to the outermost wrapper. */
  className?: string
}

/* ── Path helpers (public) ─────────────────────────────────────── */

export function pathKey(path: ColumnPath): string {
  return path.join(".")
}

export function parsePathKey(key: string): ColumnPath {
  if (!key) return []
  return key.split(".").map((s) => parseInt(s, 10))
}

/* ── Public component ─────────────────────────────────────────── */

export function ColumnRenderer({
  layout,
  renderBlock,
  metaSlots,
  editable = false,
  onRatiosChange,
  onAddColumnAfter,
  onRemoveColumn,
  className,
}: ColumnRendererProps) {
  return (
    <ColumnNode
      node={layout}
      basePath={[]}
      renderBlock={renderBlock}
      metaSlots={metaSlots ?? {}}
      editable={editable}
      onRatiosChange={onRatiosChange}
      onAddColumnAfter={onAddColumnAfter}
      onRemoveColumn={onRemoveColumn}
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
  editable: boolean
  onRatiosChange?: (path: ColumnPath, newRatios: number[]) => void
  onAddColumnAfter?: (parentPath: number[], afterIndex: number) => void
  onRemoveColumn?: (path: number[]) => void
  className?: string
}

function ColumnNode({ node, basePath, renderBlock, metaSlots, editable, onRatiosChange, onAddColumnAfter, onRemoveColumn, className }: ColumnNodeProps) {
  const direction = node.direction ?? "horizontal"
  const isHorizontal = direction === "horizontal"
  const colCount = node.columns.length

  // Drag mode condition: editable + horizontal + 2+ columns + top-level OR nested (top-level easier)
  const useDragMode = editable && isHorizontal && colCount >= 2 && basePath.length === 0

  if (useDragMode) {
    // react-resizable-panels uses percentage (0-100 sum). Convert from ratio.
    const total = node.columns.reduce((s, c) => s + (c.ratio || 1), 0) || 1
    const sizes = node.columns.map((c) => ((c.ratio || 1) / total) * 100)
    const groupId = `wiki-col-group-${basePath.join(".") || "root"}-${colCount}`
    const canAdd = colCount < 6 // matches addColumnAfter cap
    const canRemove = colCount > 1

    return (
      <div className="relative">
        <PanelGroup
          id={groupId}
          direction="horizontal"
          className={cn("wiki-column-grid wiki-column-grid--resizable", className)}
          data-direction={direction}
          onLayout={(newSizes) => {
            if (!onRatiosChange) return
            onRatiosChange(basePath, newSizes)
          }}
        >
          {node.columns.map((col, i) => {
            const childPath = [...basePath, i]
            const minSizePct = col.minWidth ? Math.min(40, Math.max(8, (col.minWidth / 1200) * 100)) : 8
            return (
              <Fragment key={i}>
                <Panel defaultSize={sizes[i]} minSize={minSizePct} className="wiki-column-panel group/panel relative">
                  {/* Phase 2-2-B-3: per-column X (remove) button — hover to reveal */}
                  {onRemoveColumn && canRemove && (
                    <button
                      type="button"
                      onClick={() => onRemoveColumn(childPath)}
                      title="Remove this column"
                      aria-label="Remove column"
                      className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-md border border-border-subtle bg-surface-overlay text-muted-foreground opacity-0 shadow-sm transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover/panel:opacity-100"
                    >
                      <PhX size={10} weight="bold" />
                    </button>
                  )}
                  <ColumnCell
                    column={col}
                    path={childPath}
                    renderBlock={renderBlock}
                    metaSlots={metaSlots}
                    editable={editable}
                    onRatiosChange={onRatiosChange}
                    onAddColumnAfter={onAddColumnAfter}
                    onRemoveColumn={onRemoveColumn}
                  />
                </Panel>
                {i < colCount - 1 && (
                  <PanelResizeHandle
                    className="wiki-column-resize-handle group/handle relative flex w-1 items-center justify-center transition-colors hover:bg-accent/40 data-[resize-handle-state=drag]:bg-accent"
                    aria-label="Resize column"
                  >
                    <span className="h-8 w-0.5 rounded-sm bg-border-subtle transition-colors group-hover/handle:bg-accent/60" />
                    {/* Phase 2-2-B-3: `+` button between columns (hover to reveal) */}
                    {onAddColumnAfter && canAdd && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddColumnAfter(basePath, i)
                        }}
                        title="Insert column here"
                        aria-label="Insert column"
                        className="absolute left-1/2 top-2 z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-border-subtle bg-surface-overlay text-muted-foreground opacity-0 shadow-sm transition-opacity hover:bg-accent/10 hover:text-accent group-hover/handle:opacity-100"
                      >
                        <PhPlus size={10} weight="bold" />
                      </button>
                    )}
                  </PanelResizeHandle>
                )}
              </Fragment>
            )
          })}
        </PanelGroup>
        {/* Phase 2-2-B-3: trailing `+` button (append column at end) */}
        {onAddColumnAfter && canAdd && (
          <button
            type="button"
            onClick={() => onAddColumnAfter(basePath, colCount - 1)}
            title="Add column at end"
            aria-label="Add column"
            className="absolute -right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-dashed border-border-subtle bg-surface-overlay/70 text-muted-foreground opacity-40 shadow-sm transition-opacity hover:bg-accent/10 hover:text-accent hover:border-accent/40 hover:opacity-100 pointer-events-auto"
          >
            <PhPlus size={12} weight="bold" />
          </button>
        )}
      </div>
    )
  }

  // Default: CSS Grid (read mode, nested columns, or vertical)
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
            editable={editable}
            onRatiosChange={onRatiosChange}
            onAddColumnAfter={onAddColumnAfter}
            onRemoveColumn={onRemoveColumn}
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
  editable: boolean
  onRatiosChange?: (path: ColumnPath, newRatios: number[]) => void
  onAddColumnAfter?: (parentPath: number[], afterIndex: number) => void
  onRemoveColumn?: (path: number[]) => void
}

function ColumnCell({ column, path, renderBlock, metaSlots, editable, onRatiosChange, onAddColumnAfter, onRemoveColumn }: ColumnCellProps) {
  const meta = metaSlots[pathKey(path)]

  if (column.content.type === "columns") {
    return (
      <div className="wiki-column-cell">
        {meta}
        <ColumnNode
          node={column.content}
          basePath={path}
          renderBlock={renderBlock}
          metaSlots={metaSlots}
          editable={editable}
          onRatiosChange={onRatiosChange}
          onAddColumnAfter={onAddColumnAfter}
          onRemoveColumn={onRemoveColumn}
        />
      </div>
    )
  }

  // Leaf cell — in edit mode, act as a droppable zone so blocks can be dragged
  // between columns. Read mode stays a plain div.
  return editable ? (
    <LeafDroppableCell path={path} blockIds={column.content.blockIds} meta={meta} renderBlock={renderBlock} />
  ) : (
    <div className="wiki-column-cell flex flex-col gap-3">
      {meta}
      {column.content.blockIds.map((blockId) => (
        <Fragment key={blockId}>{renderBlock(blockId)}</Fragment>
      ))}
    </div>
  )
}

/**
 * Phase 2-2-B-2: Edit-mode leaf cell with `useDroppable`.
 * Drop id `column-<pathKey>` is consumed by WikiArticleRenderer.handleDragEnd
 * to route `moveBlockToColumn(articleId, blockId, path)`.
 */
function LeafDroppableCell({
  path,
  blockIds,
  meta,
  renderBlock,
}: {
  path: number[]
  blockIds: string[]
  meta: ReactNode
  renderBlock: (blockId: string) => ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${pathKey(path)}` })
  const isEmpty = blockIds.length === 0
  return (
    <div
      ref={setNodeRef}
      data-column-path={pathKey(path)}
      className={cn(
        "wiki-column-cell flex flex-col gap-3 rounded-md transition-colors",
        isOver && "bg-accent/5 ring-1 ring-accent/40",
      )}
    >
      {meta}
      {blockIds.map((blockId) => (
        <Fragment key={blockId}>{renderBlock(blockId)}</Fragment>
      ))}
      {isEmpty && (
        <div
          className={cn(
            "flex min-h-[96px] items-center justify-center rounded-md border border-dashed text-2xs transition-colors",
            isOver
              ? "border-accent text-accent"
              : "border-border-subtle text-muted-foreground/40",
          )}
        >
          {isOver ? "Drop block here" : "Empty column — drop a block here"}
        </div>
      )}
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
