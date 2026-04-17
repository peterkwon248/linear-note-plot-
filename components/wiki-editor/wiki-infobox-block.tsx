"use client"

/**
 * WikiInfoboxBlock — Phase 2-2-C wrapper + Phase 3.1-B presentation controls.
 *
 * - Block wrapper around the shared `WikiInfobox` component.
 * - Exposes Width (preset + drag) / Spacing (density) / Delete via the shared
 *   `block-menu` primitives so the ⋯ menu is visually consistent with every
 *   other wiki block.
 */

import { useRef, useState } from "react"
import type { WikiBlock } from "@/lib/types"
import { WikiInfobox } from "@/components/editor/wiki-infobox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  MenuSurface,
  MenuSection,
  MenuAction,
  MenuDivider,
  PresetGrid,
  WIDTH_OPTIONS,
  DENSITY_OPTIONS,
} from "./block-menu"
import { cn } from "@/lib/utils"
import type { DraggableSyntheticListeners } from "@dnd-kit/core"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr/DotsSixVertical"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { ArrowsHorizontal } from "@phosphor-icons/react/dist/ssr/ArrowsHorizontal"
import { Rows } from "@phosphor-icons/react/dist/ssr/Rows"

export interface WikiInfoboxBlockProps {
  block: WikiBlock
  articleId: string
  editable?: boolean
  onUpdate?: (patch: Partial<Omit<WikiBlock, "id">>) => void
  onDelete?: () => void
  dragHandleProps?: DraggableSyntheticListeners
}

const WIDTH_PX: Record<string, number | null> = {
  narrow: 320,
  default: 560,
  wide: 720,
  full: null,
}

function widthToStyle(w: WikiBlock["width"]): React.CSSProperties {
  if (typeof w === "number") return { width: w, maxWidth: "100%" }
  if (w === "full") return {}
  const px = WIDTH_PX[w ?? "default"]
  if (px == null) return {}
  return { width: "100%", maxWidth: px }
}

/** Density maps to a CSS class applied to the WikiInfobox wrapper. */
function densityClass(d: WikiBlock["density"]): string {
  switch (d) {
    case "compact":
      return "infobox-density-compact"
    case "loose":
      return "infobox-density-loose"
    default:
      return ""
  }
}

export function WikiInfoboxBlock({ block, articleId, editable = false, onUpdate, onDelete, dragHandleProps }: WikiInfoboxBlockProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const widthStyle = widthToStyle(block.width)
  const currentWidthKey: "narrow" | "default" | "wide" | "full" =
    typeof block.width === "number" ? "default" : (block.width ?? "default")
  const currentDensity = (block.density ?? "normal") as "compact" | "normal" | "loose"

  const handleStartDrag = (e: React.MouseEvent) => {
    if (!editable || !onUpdate) return
    e.preventDefault()
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const startX = e.clientX
    const startWidth = wrapper.getBoundingClientRect().width
    setDragging(true)
    const onMove = (ev: MouseEvent) => {
      const next = Math.max(240, Math.min(1200, Math.round(startWidth + (ev.clientX - startX))))
      onUpdate({ width: next })
    }
    const onUp = () => {
      setDragging(false)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  const headerExtraActions = editable ? (
    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(true) }}
          className="rounded p-0.5 text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
          title="Block actions"
        >
          <DotsThree size={12} weight="bold" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <MenuSurface>
          <MenuSection icon={<ArrowsHorizontal size={12} weight="regular" />} label="Width">
            <PresetGrid
              options={WIDTH_OPTIONS}
              active={currentWidthKey}
              onSelect={(v) => {
                onUpdate?.({ width: v === "default" ? undefined : v })
                setMenuOpen(false)
              }}
            />
          </MenuSection>
          <MenuSection icon={<Rows size={12} weight="regular" />} label="Spacing">
            <PresetGrid
              options={DENSITY_OPTIONS}
              active={currentDensity}
              onSelect={(v) => {
                onUpdate?.({ density: v === "normal" ? undefined : v })
                setMenuOpen(false)
              }}
            />
          </MenuSection>
          {typeof block.width === "number" && (
            <>
              <MenuDivider />
              <div className="px-1">
                <MenuAction
                  label={`Reset width (${block.width}px)`}
                  onClick={() => { onUpdate?.({ width: undefined }); setMenuOpen(false) }}
                />
              </div>
            </>
          )}
          {onDelete && (
            <>
              <MenuDivider />
              <div className="px-1 pb-1">
                <MenuAction
                  icon={<Trash size={14} weight="regular" />}
                  label="Delete block"
                  destructive
                  onClick={() => { setMenuOpen(false); onDelete() }}
                />
              </div>
            </>
          )}
        </MenuSurface>
      </PopoverContent>
    </Popover>
  ) : null

  return (
    <div
      ref={wrapperRef}
      className={cn("group/infobox-block relative", densityClass(block.density))}
      style={widthStyle}
    >
      {editable && dragHandleProps && (
        <div
          className="absolute -left-7 top-2 z-10 flex h-6 w-6 cursor-grab items-center justify-center rounded-md text-muted-foreground/0 transition-colors group-hover/infobox-block:text-muted-foreground/40 hover:!text-muted-foreground active:cursor-grabbing"
          {...dragHandleProps}
        >
          <DotsSixVertical size={14} weight="bold" />
        </div>
      )}

      <WikiInfobox
        noteId={articleId}
        entityType="wiki"
        entries={block.fields ?? []}
        editable={editable}
        headerColor={block.headerColor ?? null}
        onEntriesChange={editable ? (fields) => onUpdate?.({ fields }) : undefined}
        onHeaderColorChange={editable ? (color) => onUpdate?.({ headerColor: color }) : undefined}
        headerExtraActions={headerExtraActions}
      />

      {editable && onUpdate && (
        <div
          role="separator"
          aria-orientation="vertical"
          onMouseDown={handleStartDrag}
          className={cn(
            "absolute -right-1 top-0 bottom-0 w-1.5 cursor-col-resize rounded-full transition-opacity",
            dragging
              ? "bg-accent opacity-100"
              : "bg-accent/60 opacity-0 hover:!opacity-100 group-hover/infobox-block:opacity-30",
          )}
          title="Drag to resize"
        />
      )}
    </div>
  )
}
