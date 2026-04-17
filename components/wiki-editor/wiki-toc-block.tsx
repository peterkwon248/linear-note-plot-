"use client"

/**
 * WikiTocBlock — Phase 2-2-C + Phase 3.1-B presentation controls.
 *
 * Sections are derived live from `article.blocks`; this block only stores
 * display state (`tocCollapsed`, `hiddenLevels`, `width`, `fontSize`, `density`).
 *
 * ⋯ menu uses shared `block-menu` primitives for visual consistency with
 * every other wiki block.
 */

import { useMemo, useState, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiBlock } from "@/lib/types"
import { computeSectionNumbers } from "@/lib/wiki-block-utils"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  MenuSurface,
  MenuSection,
  MenuAction,
  MenuDivider,
  PresetGrid,
  WIDTH_OPTIONS,
  FONT_SIZE_OPTIONS,
  DENSITY_OPTIONS,
} from "./block-menu"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr/DotsSixVertical"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { ArrowsHorizontal } from "@phosphor-icons/react/dist/ssr/ArrowsHorizontal"
import { TextAa } from "@phosphor-icons/react/dist/ssr/TextAa"
import { Rows } from "@phosphor-icons/react/dist/ssr/Rows"
import type { DraggableSyntheticListeners } from "@dnd-kit/core"

export interface WikiTocBlockProps {
  block: WikiBlock
  articleId: string
  editable?: boolean
  onUpdate?: (patch: Partial<Omit<WikiBlock, "id">>) => void
  onDelete?: () => void
  dragHandleProps?: DraggableSyntheticListeners
}

/** TOC-specific width targets (narrower than Infobox since TOC is a sidebar-style card). */
const TOC_WIDTH_PX: Record<string, number | null> = {
  narrow: 280,
  default: 400,
  wide: 560,
  full: null,
}

function widthToStyle(w: WikiBlock["width"]): React.CSSProperties {
  if (typeof w === "number") return { width: w, maxWidth: "100%" }
  if (w === "full") return {}
  const px = TOC_WIDTH_PX[w ?? "default"]
  if (px == null) return {}
  return { width: "100%", maxWidth: px }
}

export function WikiTocBlock({ block, articleId, editable = false, onUpdate, onDelete, dragHandleProps }: WikiTocBlockProps) {
  const blocks = usePlotStore((s) => s.wikiArticles.find((a) => a.id === articleId)?.blocks ?? [])

  const sectionNumbers = useMemo(() => computeSectionNumbers(blocks), [blocks])
  const hidden = block.hiddenLevels ?? []
  const sections = useMemo(() => {
    const out: { id: string; title: string; level: number; number: string }[] = []
    for (const b of blocks) {
      if (b.type !== "section") continue
      const level = b.level ?? 2
      if (hidden.includes(level)) continue
      out.push({
        id: b.id,
        title: b.title || "Untitled",
        level,
        number: sectionNumbers.get(b.id) ?? "",
      })
    }
    return out
  }, [blocks, sectionNumbers, hidden])

  const [open, setOpen] = useState(!(block.tocCollapsed ?? false))
  useEffect(() => {
    setOpen(!(block.tocCollapsed ?? false))
  }, [block.tocCollapsed])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ collapsed: boolean }>).detail
      if (typeof detail?.collapsed === "boolean") setOpen(!detail.collapsed)
    }
    window.addEventListener("plot:set-all-collapsed", handler as EventListener)
    return () => window.removeEventListener("plot:set-all-collapsed", handler as EventListener)
  }, [])

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (editable) onUpdate?.({ tocCollapsed: !next })
  }

  const [menuOpen, setMenuOpen] = useState(false)

  const widthStyle = widthToStyle(block.width)
  const fontScale = block.fontSize && block.fontSize > 0 ? block.fontSize : 1
  const rootStyle: React.CSSProperties = { ...widthStyle, fontSize: `${fontScale}em` }

  const currentWidthKey: "narrow" | "default" | "wide" | "full" =
    typeof block.width === "number" ? "default" : (block.width ?? "default")
  const currentDensity = (block.density ?? "normal") as "compact" | "normal" | "loose"

  const dragHandle = editable && dragHandleProps ? (
    <div
      className="absolute -left-7 top-2 z-10 flex h-6 w-6 cursor-grab items-center justify-center rounded-md text-muted-foreground/0 transition-colors group-hover/toc-block:text-muted-foreground/40 hover:!text-muted-foreground active:cursor-grabbing"
      {...dragHandleProps}
    >
      <DotsSixVertical size={14} weight="bold" />
    </div>
  ) : null

  const actionsMenu = editable ? (
    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(true) }}
          className="absolute right-1 top-1 z-20 p-1 text-muted-foreground opacity-0 transition-opacity duration-100 hover:!opacity-100 hover:text-foreground group-hover/toc-block:opacity-30"
          title="Block actions"
          style={{ fontSize: "1rem" }}
        >
          <DotsThree size={14} weight="bold" />
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
          <MenuSection icon={<TextAa size={12} weight="regular" />} label="Font size">
            <PresetGrid
              options={FONT_SIZE_OPTIONS}
              active={fontScale as 0.85 | 1 | 1.15 | 1.3}
              onSelect={(v) => {
                onUpdate?.({ fontSize: v === 1 ? undefined : v })
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

  if (sections.length === 0) {
    if (!editable) return null
    return (
      <div
        className="group/toc-block relative rounded-lg border border-dashed border-border-subtle px-4 py-3 text-2xs text-muted-foreground/50"
        style={rootStyle}
      >
        {dragHandle}
        {actionsMenu}
        Contents — add sections to populate
      </div>
    )
  }

  return (
    <div
      className="group/toc-block relative rounded-lg border border-border bg-secondary/30"
      style={rootStyle}
    >
      {dragHandle}
      {actionsMenu}
      <button onClick={handleToggle} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <span className="font-bold text-foreground/80">Contents</span>
        <CaretDown
          size={14}
          weight="bold"
          className={cn("text-muted-foreground transition-transform duration-200", !open && "-rotate-90")}
        />
      </button>
      {open && (
        <div
          className="flex flex-col px-4 pb-3.5"
          style={{
            gap:
              block.density === "compact"
                ? "0"
                : block.density === "loose"
                  ? "0.9rem"
                  : "0.25rem",
          }}
        >
          {sections.map((s) => (
            <div key={s.id} style={{ paddingLeft: `${(s.level - 2) * 1}em` }}>
              <button
                onClick={() => {
                  document.getElementById(`wiki-block-${s.id}`)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }}
                className="text-note text-accent/80 transition-colors hover:text-accent"
              >
                {s.number}. {s.title}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
