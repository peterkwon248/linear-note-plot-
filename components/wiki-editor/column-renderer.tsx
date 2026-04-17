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

import { type CSSProperties, type ReactNode, Fragment, useState } from "react"
import type { ColumnStructure, ColumnDefinition, ColumnPath } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { useDroppable } from "@dnd-kit/core"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Columns as PhColumns } from "@phosphor-icons/react/dist/ssr/Columns"
import { AddBlockButton } from "./wiki-block-renderer"
import { paletteStyleVars } from "@/lib/column-palette"

/** Phase 3.1-A — map ColumnStructure.gap token to CSS value. */
const GAP_VALUES: Record<"sm" | "md" | "lg", string> = {
  sm: "1rem",
  md: "1.5rem",
  lg: "2.5rem",
}

export interface ColumnRendererProps {
  /** The column tree to render. */
  layout: ColumnStructure
  /**
   * Render a single block by id. Returning `null` is fine — the renderer skips it.
   */
  renderBlock: (blockId: string) => ReactNode
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
  /**
   * Phase 2-2-B-3-b: Called when user clicks AddBlock inside an empty column.
   * Creates a new block of the given type and assigns it to that column.
   */
  onAddBlockToColumn?: (path: number[], type: string, level?: number) => void
  /**
   * Phase 2-2-B-3-b: Called when user clicks "Split into N cols" on a leaf.
   * Converts the leaf into a nested ColumnStructure with `count` inner columns.
   */
  onSplitLeaf?: (path: number[], count: number) => void
  /**
   * Phase 3.1-A: Render a per-column overflow menu (⋯). Typically renders
   * `<WikiColumnMenu>` — name editor, palette picker, article-level rule/gap toggles.
   * Called for each column header. Only shown in edit mode.
   */
  renderColumnMenu?: (path: number[], column: ColumnDefinition) => ReactNode
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
  editable = false,
  onRatiosChange,
  onAddColumnAfter,
  onRemoveColumn,
  onAddBlockToColumn,
  onSplitLeaf,
  renderColumnMenu,
  className,
}: ColumnRendererProps) {
  return (
    <ColumnNode
      node={layout}
      basePath={[]}
      renderBlock={renderBlock}
      editable={editable}
      onRatiosChange={onRatiosChange}
      onAddColumnAfter={onAddColumnAfter}
      onRemoveColumn={onRemoveColumn}
      onAddBlockToColumn={onAddBlockToColumn}
      onSplitLeaf={onSplitLeaf}
      renderColumnMenu={renderColumnMenu}
      className={className}
    />
  )
}

/* ── Recursive node ───────────────────────────────────────────── */

interface ColumnNodeProps {
  node: ColumnStructure
  basePath: number[]
  renderBlock: (blockId: string) => ReactNode
  editable: boolean
  onRatiosChange?: (path: ColumnPath, newRatios: number[]) => void
  onAddColumnAfter?: (parentPath: number[], afterIndex: number) => void
  onRemoveColumn?: (path: number[]) => void
  onAddBlockToColumn?: (path: number[], type: string, level?: number) => void
  onSplitLeaf?: (path: number[], count: number) => void
  renderColumnMenu?: (path: number[], column: ColumnDefinition) => ReactNode
  className?: string
}

function ColumnNode({ node, basePath, renderBlock, editable, onRatiosChange, onAddColumnAfter, onRemoveColumn, onAddBlockToColumn, onSplitLeaf, renderColumnMenu, className }: ColumnNodeProps) {
  const direction = node.direction ?? "horizontal"
  const isHorizontal = direction === "horizontal"
  const colCount = node.columns.length
  // Phase 3: track which column's X is hovered for visual feedback
  const [hoveringRemoveIdx, setHoveringRemoveIdx] = useState<number | null>(null)

  // Drag mode condition: editable + horizontal + 2+ columns + top-level OR nested (top-level easier)
  const useDragMode = editable && isHorizontal && colCount >= 2 && basePath.length === 0

  if (useDragMode) {
    // react-resizable-panels uses percentage (0-100 sum). Convert from ratio.
    const total = node.columns.reduce((s, c) => s + (c.ratio || 1), 0) || 1
    const sizes = node.columns.map((c) => ((c.ratio || 1) / total) * 100)
    // Include ratio fingerprint so PanelGroup remounts when ratios change
    // (react-resizable-panels caches sizes in localStorage by id).
    const ratioFingerprint = node.columns.map((c) => (c.ratio || 1).toFixed(1)).join("-")
    const groupId = `wiki-col-group-${basePath.join(".") || "root"}-${colCount}-${ratioFingerprint}`
    const canAdd = colCount < 6 // matches addColumnAfter cap
    const canRemove = colCount > 1

    return (
      <div className="relative">
        <PanelGroup
          key={groupId}
          id={groupId}
          direction="horizontal"
          className={cn(
            "wiki-column-grid wiki-column-grid--resizable wiki-column-grid--responsive",
            node.rule && "wiki-column-grid--ruled",
            className,
          )}
          data-direction={direction}
          onLayout={(newSizes) => {
            if (!onRatiosChange) return
            // Guard: ignore stale callbacks from PanelGroup during column removal
            // (PanelGroup fires onLayout before unmounting with old column count)
            if (newSizes.length !== node.columns.length) return
            onRatiosChange(basePath, newSizes)
          }}
        >
          {node.columns.map((col, i) => {
            const childPath = [...basePath, i]
            const minSizePct = col.minWidth ? Math.min(40, Math.max(8, (col.minWidth / 1200) * 100)) : 8
            const paletteStyle = paletteStyleVars(col.paletteId, col.paletteAlpha, col.gradientTo)
            return (
              <Fragment key={i}>
                <Panel
                  defaultSize={sizes[i]}
                  minSize={minSizePct}
                  className={cn(
                    "wiki-column-panel group/panel relative rounded-lg p-5 transition-colors",
                    // Phase 3.1-B: only show box when palette is set — bare columns flow naturally
                    hoveringRemoveIdx === i
                      ? "border border-destructive/50 bg-destructive/5"
                      : col.paletteId
                        ? cn("wiki-column-cell--themed border border-transparent", col.gradientTo && "wiki-column-cell--gradient")
                        : "border border-transparent",
                    "self-start",
                    // Phase 3.1-B fix: override grid/flex min-content so column can be
                    // freely resized below image's natural width.
                    // NOTE: no overflow-hidden — buttons live above the column (-top-8).
                    "min-w-0",
                  )}
                  style={paletteStyle}
                >
                  {/* Phase 3.1-B: per-column ⋯ menu + X delete — inside top-right of the column.
                      Pushed up near the column's top edge so they sit above image/infobox menus
                      (which start at image top-1, i.e. Panel's padding top + 4px). */}
                  {(onRemoveColumn || renderColumnMenu) && (
                    <div className="absolute right-1 top-0.5 z-10 flex items-center gap-1">
                      {renderColumnMenu && renderColumnMenu(childPath, col)}
                      {onRemoveColumn && canRemove && (
                        <button
                          type="button"
                          onMouseEnter={() => setHoveringRemoveIdx(i)}
                          onMouseLeave={() => setHoveringRemoveIdx(null)}
                          onClick={() => {
                            const leaf = col.content
                            const hasBlocks = leaf.type === "blocks" &&
                              ((leaf.blocks && leaf.blocks.length > 0) || (leaf.blockIds && leaf.blockIds.length > 0))
                            if (hasBlocks && !window.confirm("이 컬럼의 블록들이 다른 컬럼으로 이동됩니다. 삭제하시겠습니까?")) return
                            setHoveringRemoveIdx(null)
                            onRemoveColumn(childPath)
                          }}
                          title="Remove this card"
                          aria-label="Remove card"
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-border-subtle bg-surface-overlay text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <PhX size={10} weight="bold" />
                        </button>
                      )}
                    </div>
                  )}
                  <ColumnCell
                    column={col}
                    path={childPath}
                    renderBlock={renderBlock}
                    editable={editable}
                    onRatiosChange={onRatiosChange}
                    onAddColumnAfter={onAddColumnAfter}
                    onRemoveColumn={onRemoveColumn}
                    onAddBlockToColumn={onAddBlockToColumn}
                    onSplitLeaf={onSplitLeaf}
                    renderColumnMenu={renderColumnMenu}
                  />
                </Panel>
                {i < colCount - 1 && (
                  <PanelResizeHandle
                    className="wiki-column-resize-handle group/handle relative flex w-1 items-center justify-center transition-colors hover:bg-accent/40 data-[resize-handle-state=drag]:bg-accent"
                    aria-label="Resize card"
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
                        title="Insert card here"
                        aria-label="Insert card"
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
            title="Add card at end"
            aria-label="Add card"
            className="absolute -right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-dashed border-border-subtle bg-surface-overlay/70 text-muted-foreground opacity-40 shadow-sm transition-opacity hover:bg-accent/10 hover:text-accent hover:border-accent/40 hover:opacity-100 pointer-events-auto"
          >
            <PhPlus size={12} weight="bold" />
          </button>
        )}
      </div>
    )
  }

  // Default: CSS Grid (read mode, nested columns, or vertical)
  // Vertical direction uses content-fit tracks so empty full-width panes stay thin.
  const tracks = node.columns.map((col) => buildTrack(col, direction)).join(" ")
  const gap = isHorizontal ? GAP_VALUES[node.gap ?? "md"] : "1rem"
  const gridStyle: CSSProperties = isHorizontal
    ? { display: "grid", gridTemplateColumns: tracks, gap }
    : { display: "grid", gridTemplateRows: tracks, gap }

  // Phase 2-2-B-3-b: Nested horizontal columns in edit mode expose per-column
  // +/X buttons. Ratios stay locked (no drag handles in nested CSS Grid).
  // Show per-column edit UI (X / ⋯) for:
  //  1) Nested horizontal columns (was the original case)
  //  2) Top-level vertical columns (full-width panes) — needed so users can delete them
  //  3) Phase 3.1-A: Top-level horizontal with exactly 1 card — so the ⋯ menu
  //     (palette / name / rule / gap) is reachable even without resize handles.
  //     (2+ card case handled above in useDragMode branch.)
  const showNestedEditUI =
    editable && (
      (isHorizontal && basePath.length > 0) ||
      (!isHorizontal && basePath.length === 0) ||
      (isHorizontal && basePath.length === 0 && colCount === 1)
    )
  const canAdd = showNestedEditUI && isHorizontal && !!onAddColumnAfter
  const canRemove = showNestedEditUI && !!onRemoveColumn && colCount > 1

  return (
    <div
      className={cn(
        "wiki-column-grid",
        isHorizontal && "wiki-column-grid--responsive",
        node.rule && "wiki-column-grid--ruled",
        className,
      )}
      style={gridStyle}
      data-direction={direction}
    >
      {node.columns.map((col, i) => {
        const childPath = [...basePath, i]
        const isLastNested = showNestedEditUI && i === colCount - 1
        const paletteStyle = paletteStyleVars(col.paletteId, col.paletteAlpha, col.gradientTo)
        // Phase 3.1-A fix: 1-card case must still render palette visuals when the user
        // picks a color — `colCount >= 2` gated both the padding and themed class,
        // so `setColumnPaletteId` had no visible effect.
        const showCardBox = colCount >= 2 || !!col.paletteId
        return (
          <div
            key={i}
            className={cn(
              showCardBox && "rounded-lg p-5 transition-colors self-start",
              showCardBox && (
                hoveringRemoveIdx === i
                  ? "border border-destructive/50 bg-destructive/5"
                  : col.paletteId
                    ? cn("wiki-column-cell--themed border border-transparent", col.gradientTo && "wiki-column-cell--gradient")
                    : "border border-transparent"
              ),
              showNestedEditUI && "relative group/nested-panel",
              isLastNested && "pr-3",
              // Phase 3.1-B fix: prevent images from locking column min-width to image natural size
              "min-w-0",
            )}
            style={paletteStyle}
          >
            {(canRemove || (showNestedEditUI && renderColumnMenu)) && (
              <div className="absolute right-1 top-0.5 z-10 flex items-center gap-1">
                {showNestedEditUI && renderColumnMenu && renderColumnMenu(childPath, col)}
                {canRemove && (
                  <button
                    type="button"
                    onMouseEnter={() => setHoveringRemoveIdx(i)}
                    onMouseLeave={() => setHoveringRemoveIdx(null)}
                    onClick={() => {
                      const leaf = col.content
                      const hasBlocks = leaf.type === "blocks" &&
                        ((leaf.blocks && leaf.blocks.length > 0) || (leaf.blockIds && leaf.blockIds.length > 0))
                      if (hasBlocks && !window.confirm("이 컬럼의 블록들이 다른 컬럼으로 이동됩니다. 삭제하시겠습니까?")) return
                      setHoveringRemoveIdx(null)
                      onRemoveColumn!(childPath)
                    }}
                    title="Remove this card"
                    aria-label="Remove card"
                    className="flex h-5 w-5 items-center justify-center rounded-md border border-border-subtle bg-surface-overlay text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <PhX size={10} weight="bold" />
                  </button>
                )}
              </div>
            )}
            <ColumnCell
              column={col}
              path={childPath}
              renderBlock={renderBlock}
              editable={editable}
              onRatiosChange={onRatiosChange}
              onAddColumnAfter={onAddColumnAfter}
              onRemoveColumn={onRemoveColumn}
              onAddBlockToColumn={onAddBlockToColumn}
              onSplitLeaf={onSplitLeaf}
              renderColumnMenu={renderColumnMenu}
            />
            {canAdd && (
              <button
                type="button"
                onClick={() => onAddColumnAfter!(basePath, i)}
                title="Insert card after this one"
                aria-label="Insert card"
                className="absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-dashed border-border-subtle bg-surface-overlay text-muted-foreground opacity-0 shadow-sm transition-opacity hover:bg-accent/10 hover:text-accent hover:border-accent/40 group-hover/nested-panel:opacity-100"
              >
                <PhPlus size={11} weight="bold" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface ColumnCellProps {
  column: ColumnDefinition
  path: number[]
  renderBlock: (blockId: string) => ReactNode
  editable: boolean
  onRatiosChange?: (path: ColumnPath, newRatios: number[]) => void
  onAddColumnAfter?: (parentPath: number[], afterIndex: number) => void
  onRemoveColumn?: (path: number[]) => void
  onAddBlockToColumn?: (path: number[], type: string, level?: number) => void
  onSplitLeaf?: (path: number[], count: number) => void
  renderColumnMenu?: (path: number[], column: ColumnDefinition) => ReactNode
}

function ColumnCell({ column, path, renderBlock, editable, onRatiosChange, onAddColumnAfter, onRemoveColumn, onAddBlockToColumn, onSplitLeaf, renderColumnMenu }: ColumnCellProps) {
  if (column.content.type === "columns") {
    return (
      <div className="wiki-column-cell min-w-0">
        <ColumnNode
          node={column.content}
          basePath={path}
          renderBlock={renderBlock}
          editable={editable}
          onRatiosChange={onRatiosChange}
          onAddColumnAfter={onAddColumnAfter}
          onRemoveColumn={onRemoveColumn}
          onAddBlockToColumn={onAddBlockToColumn}
          onSplitLeaf={onSplitLeaf}
          renderColumnMenu={renderColumnMenu}
        />
      </div>
    )
  }

  // Leaf cell — Phase 3: prefer canonical `blocks` (per-pane), fall back to `blockIds` for legacy.
  // In edit mode, act as a droppable zone so blocks can be dragged between columns.
  const leafBlockIds = column.content.blocks
    ? column.content.blocks.map((b) => b.id)
    : (column.content.blockIds ?? [])

  return editable ? (
    <>
      <LeafDroppableCell
        path={path}
        blockIds={leafBlockIds}
        renderBlock={renderBlock}
        onAddBlockToColumn={onAddBlockToColumn}
        onSplitLeaf={onSplitLeaf}
      />
    </>
  ) : (
    <div className="wiki-column-cell min-w-0 flex flex-col gap-3">
      {leafBlockIds.map((blockId) => (
        <div key={blockId}>{renderBlock(blockId)}</div>
      ))}
    </div>
  )
}

/**
 * Phase 2-2-B-2/3-b: Edit-mode leaf cell with `useDroppable`.
 *
 * Drop id `column-<pathKey>` is consumed by WikiArticleRenderer.handleDragEnd
 * to route `moveBlockToColumn(articleId, blockId, path)`.
 *
 * Phase 2-2-B-3-b additions:
 * - Empty column shows AddBlockButton (replaces the "drop-only" placeholder)
 * - "Split into N" buttons when path depth allows nesting (`path.length < 3`)
 * - Drag hover state still shows "Drop block here" for clarity
 */
function LeafDroppableCell({
  path,
  blockIds,
  renderBlock,
  onAddBlockToColumn,
  onSplitLeaf,
}: {
  path: number[]
  blockIds: string[]
  renderBlock: (blockId: string) => ReactNode
  onAddBlockToColumn?: (path: number[], type: string, level?: number) => void
  onSplitLeaf?: (path: number[], count: number) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${pathKey(path)}` })
  const isEmpty = blockIds.length === 0
  return (
    <div
      ref={setNodeRef}
      data-column-path={pathKey(path)}
      className={cn(
        "wiki-column-cell rounded-md transition-colors min-w-0 flex flex-col gap-3",
        isOver && "bg-accent/5 ring-1 ring-accent/40",
      )}
    >
      {blockIds.map((blockId) => (
        <Fragment key={blockId}>{renderBlock(blockId)}</Fragment>
      ))}
      {isEmpty && (
        <div
          className={cn(
            "flex min-h-[96px] flex-col rounded-md border border-dashed p-3 transition-colors",
            isOver
              ? "items-center justify-center border-accent bg-accent/5"
              : "items-center justify-end border-border-subtle hover:border-border",
          )}
        >
          {isOver ? (
            <span className="text-2xs text-accent">Drop block here</span>
          ) : onAddBlockToColumn ? (
            <div className="relative z-10">
              <AddBlockButton onAdd={(type, level) => onAddBlockToColumn(path, type, level)} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

/* ── Grid track builder ────────────────────────────────────────── */

function buildTrack(col: ColumnDefinition, direction: "horizontal" | "vertical" = "horizontal"): string {
  // Phase 3.1-B: Vertical tracks should fit content (empty full-width panes shouldn't grow).
  if (direction === "vertical") {
    if (col.minHeight && col.minHeight > 0) return `minmax(${col.minHeight}px, auto)`
    return "auto"
  }
  const fr = `${col.ratio}fr`
  if (col.minWidth && col.minWidth > 0) {
    return `minmax(${col.minWidth}px, ${fr})`
  }
  return fr
}
