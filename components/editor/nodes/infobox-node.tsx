"use client"

import { useCallback, useEffect, useState } from "react"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import {
  Table as PhTable,
  Plus as PhPlus,
  Trash as PhTrash,
  X as PhX,
  ArrowsIn,
  Image as PhImage,
  CaretDown,
  CaretRight,
  PaintBucket,
} from "@/lib/editor/editor-icons"
import { useBlockResize } from "@/components/editor/hooks/use-block-resize"
import { BlockResizeHandles } from "@/components/editor/hooks/block-resize-handles"
import { InfoboxValueRenderer } from "@/components/editor/infobox-value-renderer"

interface InfoboxRow {
  label: string
  value: string
  /**
   * Tier 1-4 / PR1 (위키와 동일):
   * - "section" = section divider row (bold + tinted bg, value hidden, NOT collapsible)
   * - "group-header" = collapsible group header (chevron + label). Owns rows until next group-header
   * - "field" or undefined = normal label/value row
   */
  type?: "field" | "section" | "group-header"
  /** group-header only: optional row background color (rgba/hex). null/undefined = default tinted bg. */
  color?: string | null
  /** group-header only: whether the group is collapsed by default on first render. */
  defaultCollapsed?: boolean
}

// Tier 1-2: Header color presets (나무위키식 인포박스 색상 테마)
// 알파 0.35 — text가 충분히 읽히면서 색상 구분 가능. Tables의 CELL_COLORS 패턴 차용.
interface HeaderColorPreset {
  label: string
  value: string | null
  swatch: string // 스와치 표시용 (null일 때는 bg-secondary/30 mimic)
}

const HEADER_COLOR_PRESETS: HeaderColorPreset[] = [
  { label: "Default", value: null, swatch: "rgba(148,163,184,0.25)" },
  { label: "Blue", value: "rgba(59,130,246,0.35)", swatch: "rgba(59,130,246,0.35)" },
  { label: "Red", value: "rgba(239,68,68,0.35)", swatch: "rgba(239,68,68,0.35)" },
  { label: "Green", value: "rgba(34,197,94,0.35)", swatch: "rgba(34,197,94,0.35)" },
  { label: "Yellow", value: "rgba(234,179,8,0.35)", swatch: "rgba(234,179,8,0.35)" },
  { label: "Orange", value: "rgba(249,115,22,0.35)", swatch: "rgba(249,115,22,0.35)" },
  { label: "Purple", value: "rgba(168,85,247,0.35)", swatch: "rgba(168,85,247,0.35)" },
  { label: "Pink", value: "rgba(236,72,153,0.35)", swatch: "rgba(236,72,153,0.35)" },
]

// hex (#rrggbb) → rgba(r,g,b,0.35). input[type=color]는 항상 #rrggbb.
function hexToRgba(hex: string, alpha = 0.35): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  return `rgba(${r},${g},${b},${alpha})`
}

function InfoboxNodeView({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const editable = editor.isEditable
  const title = (node.attrs.title as string) || "Info"
  const rows = (node.attrs.rows as InfoboxRow[]) || []
  const width = node.attrs.width as number | null
  const height = node.attrs.height as number | null
  const heroImage = (node.attrs.heroImage as string | null) ?? null
  const heroCaption = (node.attrs.heroCaption as string) || ""
  const headerColor = (node.attrs.headerColor as string | null) ?? null
  const { containerRef, isResizing, onResizeStart } = useBlockResize(width, height, updateAttributes)

  // Tier 1-3: 접기/펼치기 state (local, not persisted — consistent with Summary node)
  const [collapsed, setCollapsed] = useState(false)
  // Tier 1-2: 헤더 색상 피커 토글 (local UI state)
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Listen for scoped plot:set-all-collapsed broadcasts (PR #189 pattern).
  // Atom NodeViews attach to DOM AFTER React commits useEffect, so
  // `containerRef.current?.closest('[data-editor-scope]')` can be null on first
  // run. We retry with requestAnimationFrame until the scope is reachable,
  // then register the listener.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let cleanup: (() => void) | null = null
    let rafId: number | null = null

    const attach = () => {
      const scope = containerRef.current?.closest("[data-editor-scope]")
      if (!scope) {
        // Ref not yet connected to editor scope — retry next frame.
        rafId = requestAnimationFrame(attach)
        return
      }
      const handler = (e: Event) => {
        const { collapsed: c } = (e as CustomEvent).detail
        setCollapsed(c)
      }
      scope.addEventListener("plot:set-all-collapsed", handler as EventListener)
      cleanup = () =>
        scope.removeEventListener("plot:set-all-collapsed", handler as EventListener)
    }
    attach()

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      cleanup?.()
    }
  }, [])

  const updateTitle = useCallback((newTitle: string) => {
    updateAttributes({ title: newTitle })
  }, [updateAttributes])

  const updateRow = useCallback((index: number, field: "label" | "value", text: string) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: text }
    updateAttributes({ rows: newRows })
  }, [rows, updateAttributes])

  const addRow = useCallback(() => {
    updateAttributes({ rows: [...rows, { label: "", value: "", type: "field" }] })
  }, [rows, updateAttributes])

  const addSectionRow = useCallback(() => {
    updateAttributes({ rows: [...rows, { label: "", value: "", type: "section" }] })
  }, [rows, updateAttributes])

  const addGroupHeaderRow = useCallback(() => {
    updateAttributes({
      rows: [...rows, { label: "", value: "", type: "group-header", color: null, defaultCollapsed: false }],
    })
  }, [rows, updateAttributes])

  const updateRowColor = useCallback((index: number, color: string | null) => {
    const newRows = rows.map((r, i) => (i === index && r.type === "group-header" ? { ...r, color } : r))
    updateAttributes({ rows: newRows })
  }, [rows, updateAttributes])

  const removeRow = useCallback((index: number) => {
    const newRows = rows.filter((_, i) => i !== index)
    updateAttributes({ rows: newRows })
  }, [rows, updateAttributes])

  // Group collapse state — in-memory, keyed by group label. Resets on remount.
  // (Wiki uses persisted state via useInfoboxGroupCollapsed, but TipTap atom node
  // doesn't have a stable articleId; in-memory is the simpler trade-off.)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    rows.forEach((r) => {
      if (r.type === "group-header" && r.label && r.defaultCollapsed) init[r.label] = true
    })
    return init
  })

  // Color picker popover state — keyed by group-header row index.
  const [groupColorPickerIndex, setGroupColorPickerIndex] = useState<number | null>(null)

  const toggleGroupCollapsed = useCallback((groupKey: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }))
  }, [])

  // Walk rows to compute current group context per row.
  const rowsWithGroup = rows.map((row, index) => {
    let currentGroup = ""
    for (let i = 0; i <= index; i++) {
      const r = rows[i]
      if (r.type === "group-header") currentGroup = r.label || `group-${i}`
    }
    // The group-header row itself "owns" its group, never hidden by it.
    if (row.type === "group-header") return { row, index, groupKey: row.label || `group-${index}`, hiddenByGroup: false }
    return { row, index, groupKey: currentGroup, hiddenByGroup: !!currentGroup && !!collapsedGroups[currentGroup] }
  })

  const pickHeroImage = useCallback(() => {
    // Phase 1: URL input via prompt.
    // Phase 2 (future): file upload via attachment API.
    const current = heroImage ?? ""
    const input = window.prompt("Image URL", current)
    if (input === null) return
    const trimmed = input.trim()
    updateAttributes({ heroImage: trimmed.length > 0 ? trimmed : null })
  }, [heroImage, updateAttributes])

  const removeHeroImage = useCallback(() => {
    updateAttributes({ heroImage: null, heroCaption: "" })
  }, [updateAttributes])

  const updateHeroCaption = useCallback(
    (text: string) => {
      updateAttributes({ heroCaption: text })
    },
    [updateAttributes],
  )

  return (
    <NodeViewWrapper>
      <div
        ref={containerRef}
        contentEditable={false}
        className={`not-draggable border border-border-subtle rounded-lg my-2 overflow-hidden select-none group/infobox block-resize-wrapper ${isResizing ? "is-resizing" : ""}`}
        style={{
          ...(width ? { width: `${width}px` } : {}),
          ...(height ? { height: `${height}px`, overflowY: "auto" as const } : {}),
        }}
      >
        {editor?.isEditable && <BlockResizeHandles onResizeStart={onResizeStart} />}

        {/* Hero image + caption (Tier 1-1). Hidden when collapsed. */}
        {!collapsed && heroImage && (
          <div className="group/hero relative border-b border-border-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt={heroCaption || title}
              className={`w-full ${editable ? "cursor-pointer" : ""} bg-secondary/20 object-cover max-h-[280px]`}
              onClick={editable ? pickHeroImage : undefined}
              title={editable ? "Click to change image" : undefined}
            />
            {editable && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeHeroImage()
                }}
                className="absolute top-1.5 right-1.5 rounded-full bg-black/50 p-1 text-white/80 hover:bg-black/70 hover:text-white transition-colors opacity-0 group-hover/hero:opacity-100"
                title="Remove hero image"
              >
                <PhX size={12} />
              </button>
            )}
            {/* Caption: shown always if present in read mode; editable input in edit mode */}
            {editable ? (
              <input
                type="text"
                value={heroCaption}
                onChange={(e) => updateHeroCaption(e.target.value)}
                placeholder="Caption (optional)"
                className="w-full px-3 py-1.5 text-[0.75em] italic text-center text-muted-foreground bg-secondary/10 outline-none placeholder:text-muted-foreground/60 border-t border-border-subtle"
              />
            ) : (
              heroCaption && (
                <div className="px-3 py-1.5 text-[0.75em] italic text-center text-muted-foreground bg-secondary/10 border-t border-border-subtle">
                  {heroCaption}
                </div>
              )
            )}
          </div>
        )}
        {!collapsed && !heroImage && editable && (
          <button
            type="button"
            onClick={pickHeroImage}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[0.75em] text-muted-foreground/70 hover:text-muted-foreground hover:bg-hover-bg transition-colors border-b border-border-subtle opacity-0 group-hover/infobox:opacity-100"
            title="Add hero image"
          >
            <PhImage size={12} />
            <span>Add hero image</span>
          </button>
        )}

        {/* Header — always visible, with chevron toggle (Tier 1-3) + color theme (Tier 1-2) */}
        <div
          className={`relative flex items-center justify-between px-3 py-2 ${
            headerColor ? "" : "bg-secondary/30"
          } ${collapsed ? "" : "border-b border-border-subtle"}`}
          style={headerColor ? { backgroundColor: headerColor } : undefined}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg transition-colors shrink-0"
              title={collapsed ? "Expand infobox" : "Collapse infobox"}
            >
              {collapsed ? <CaretRight size={12} /> : <CaretDown size={12} />}
            </button>
            <PhTable size={14} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              value={title}
              onChange={(e) => updateTitle(e.target.value)}
              readOnly={!editable}
              className="text-[0.75em] font-semibold uppercase tracking-wider bg-transparent border-none outline-none text-muted-foreground w-full min-w-0"
              placeholder="Infobox Title"
            />
          </div>
          {editable && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setShowColorPicker((v) => !v)}
                className={`rounded p-0.5 transition-colors shrink-0 ${
                  showColorPicker || headerColor
                    ? "text-foreground"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg opacity-0 group-hover/infobox:opacity-100"
                }`}
                title="Header color"
              >
                <PaintBucket size={12} />
              </button>
              {(width || height) && (
                <button
                  type="button"
                  onClick={() => updateAttributes({ width: null, height: null })}
                  className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg transition-colors opacity-0 group-hover/infobox:opacity-100"
                  title="Reset size"
                >
                  <ArrowsIn size={12} />
                </button>
              )}
              <button
                type="button"
                onClick={() => deleteNode()}
                className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg transition-colors opacity-0 group-hover/infobox:opacity-100"
                title="Remove infobox"
              >
                <PhX size={12} />
              </button>
            </div>
          )}

          {/* Tier 1-2: Color picker popover */}
          {editable && showColorPicker && (
            <div
              className="absolute right-2 top-[calc(100%+4px)] z-10 flex items-center gap-1 rounded-md border border-border-subtle bg-popover p-1.5 shadow-md"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {HEADER_COLOR_PRESETS.map((preset) => {
                const isActive = (headerColor ?? null) === preset.value
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      updateAttributes({ headerColor: preset.value })
                      setShowColorPicker(false)
                    }}
                    title={preset.label}
                    className={`h-5 w-5 rounded-sm border transition-transform hover:scale-110 ${
                      isActive ? "border-foreground ring-1 ring-foreground" : "border-border-subtle"
                    }`}
                    style={{ backgroundColor: preset.swatch }}
                  />
                )
              })}
              <div className="mx-1 h-4 w-px bg-border-subtle" />
              <label
                className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm border border-border-subtle bg-gradient-to-br from-red-400 via-yellow-300 to-blue-400 hover:scale-110 transition-transform"
                title="Custom color"
              >
                <input
                  type="color"
                  value={(headerColor && /^#/.test(headerColor)) ? headerColor : "#3b82f6"}
                  onChange={(e) => {
                    updateAttributes({ headerColor: hexToRgba(e.target.value) })
                  }}
                  className="pointer-events-none h-0 w-0 opacity-0"
                />
              </label>
            </div>
          )}
        </div>

        {/* Rows — hidden when collapsed (Tier 1-3) */}
        {!collapsed && (
        <div className="divide-y divide-border-subtle">
          {rowsWithGroup.map(({ row, index, groupKey, hiddenByGroup }) => {
            if (hiddenByGroup) return null
            if (row.type === "group-header") {
              // PR1: Collapsible group header — chevron + label + optional color + Add color picker
              const isCollapsed = !!collapsedGroups[groupKey]
              return (
                <div
                  key={index}
                  className="relative flex items-center group/row"
                  style={row.color ? { backgroundColor: row.color } : { backgroundColor: "rgba(148,163,184,0.12)" }}
                >
                  <button
                    type="button"
                    onClick={() => toggleGroupCollapsed(groupKey)}
                    className="px-2 py-1.5 text-muted-foreground/60 hover:text-foreground transition-colors shrink-0"
                    title={isCollapsed ? "Expand group" : "Collapse group"}
                  >
                    {isCollapsed ? <CaretRight size={12} /> : <CaretDown size={12} />}
                  </button>
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) => updateRow(index, "label", e.target.value)}
                    readOnly={!editable}
                    className="flex-1 pr-3 py-1.5 text-[0.75em] font-semibold uppercase tracking-wider text-foreground/85 bg-transparent outline-none placeholder:text-muted-foreground/70"
                    placeholder="Group header"
                  />
                  {editable && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setGroupColorPickerIndex((cur) => (cur === index ? null : index))
                        }
                        className={`px-1.5 transition-colors shrink-0 ${
                          groupColorPickerIndex === index || row.color
                            ? "text-foreground"
                            : "text-muted-foreground/60 hover:text-foreground opacity-0 group-hover/row:opacity-100"
                        }`}
                        title="Group color"
                      >
                        <PaintBucket size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="px-2 text-muted-foreground/50 hover:text-red-400 transition-colors opacity-0 group-hover/row:opacity-100"
                        title="Remove group"
                      >
                        <PhTrash size={11} />
                      </button>
                    </>
                  )}
                  {editable && groupColorPickerIndex === index && (
                    <div
                      className="absolute right-2 top-[calc(100%-2px)] z-10 flex items-center gap-1 rounded-md border border-border-subtle bg-popover p-1.5 shadow-md"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      {HEADER_COLOR_PRESETS.map((preset) => {
                        const isActive = (row.color ?? null) === preset.value
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              updateRowColor(index, preset.value)
                              setGroupColorPickerIndex(null)
                            }}
                            title={preset.label}
                            className={`h-5 w-5 rounded-sm border transition-transform hover:scale-110 ${
                              isActive ? "border-foreground ring-1 ring-foreground" : "border-border-subtle"
                            }`}
                            style={{ backgroundColor: preset.swatch }}
                          />
                        )
                      })}
                      <div className="mx-1 h-4 w-px bg-border-subtle" />
                      <label
                        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm border border-border-subtle bg-gradient-to-br from-red-400 via-yellow-300 to-blue-400 hover:scale-110 transition-transform"
                        title="Custom color"
                      >
                        <input
                          type="color"
                          value={(row.color && /^#/.test(row.color)) ? row.color : "#3b82f6"}
                          onChange={(e) => {
                            updateRowColor(index, hexToRgba(e.target.value))
                          }}
                          className="pointer-events-none h-0 w-0 opacity-0"
                        />
                      </label>
                    </div>
                  )}
                </div>
              )
            }
            if (row.type === "section") {
              return (
              // Tier 1-4: Section divider row — full-width, bold, tinted bg, value hidden
              <div key={index} className="flex items-center group/row bg-secondary/40">
                <input
                  type="text"
                  value={row.label}
                  onChange={(e) => updateRow(index, "label", e.target.value)}
                  readOnly={!editable}
                  className="flex-1 px-3 py-1.5 text-[0.75em] font-semibold uppercase tracking-wider text-foreground/80 bg-transparent outline-none placeholder:text-muted-foreground/70"
                  placeholder="Section name"
                />
                {editable && (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="px-2 text-muted-foreground/50 hover:text-red-400 transition-colors opacity-0 group-hover/row:opacity-100"
                    title="Remove section"
                  >
                    <PhTrash size={11} />
                  </button>
                )}
              </div>
              )
            }
            return (
              <div key={index} className="flex items-center group/row">
                <input
                  type="text"
                  value={row.label}
                  onChange={(e) => updateRow(index, "label", e.target.value)}
                  readOnly={!editable}
                  className="w-[120px] shrink-0 px-3 py-1.5 text-[0.75em] font-medium text-muted-foreground bg-secondary/20 border-r border-border-subtle outline-none placeholder:text-muted-foreground/60"
                  placeholder="Label"
                />
                {editable ? (
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => updateRow(index, "value", e.target.value)}
                    className="flex-1 px-3 py-1.5 text-[0.75em] text-foreground bg-transparent outline-none placeholder:text-muted-foreground/60"
                    placeholder="Value"
                  />
                ) : (
                  // Tier 1-5: read-only 리치텍스트 렌더링 (wikilink/md-link/md-image/auto-url)
                  <InfoboxValueRenderer
                    text={row.value}
                    className="flex-1 px-3 py-1.5 text-[0.75em] text-foreground"
                  />
                )}
                {editable && (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="px-2 text-muted-foreground/50 hover:text-red-400 transition-colors opacity-0 group-hover/row:opacity-100"
                    title="Remove row"
                  >
                    <PhTrash size={11} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
        )}

        {/* Add row / Add section buttons — hover-only in edit mode, hidden when collapsed */}
        {!collapsed && editable && (
          <div className="flex border-t border-border-subtle opacity-0 group-hover/infobox:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={addRow}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-[0.75em] text-muted-foreground/70 hover:text-muted-foreground hover:bg-hover-bg transition-colors"
            >
              <PhPlus size={11} />
              <span>Add row</span>
            </button>
            <div className="w-px bg-border-subtle" />
            <button
              type="button"
              onClick={addSectionRow}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-[0.75em] text-muted-foreground/70 hover:text-muted-foreground hover:bg-hover-bg transition-colors"
              title="Add section divider row"
            >
              <PhPlus size={11} />
              <span>Add section</span>
            </button>
            <div className="w-px bg-border-subtle" />
            <button
              type="button"
              onClick={addGroupHeaderRow}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-[0.75em] text-muted-foreground/70 hover:text-muted-foreground hover:bg-hover-bg transition-colors"
              title="Add collapsible group header"
            >
              <PhPlus size={11} />
              <span>Add group</span>
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const InfoboxBlockNode = Node.create({
  name: "infoboxBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: "Info",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-title") || "Info",
        renderHTML: (attributes: Record<string, string>) => ({ "data-title": attributes.title }),
      },
      rows: {
        default: [{ label: "", value: "" }],
        parseHTML: (element: HTMLElement) => {
          try { return JSON.parse(element.getAttribute("data-rows") || "[]") }
          catch { return [{ label: "", value: "" }] }
        },
        renderHTML: (attributes: Record<string, unknown>) => ({ "data-rows": JSON.stringify(attributes.rows) }),
      },
      width: {
        default: null,
        parseHTML: (el) => {
          const w = el.getAttribute("data-width")
          return w ? parseInt(w, 10) : null
        },
        renderHTML: (attrs) => attrs.width ? { "data-width": attrs.width } : {},
      },
      height: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const h = el.getAttribute("data-height")
          return h ? parseInt(h, 10) : null
        },
        renderHTML: (attrs: Record<string, any>) => attrs.height ? { "data-height": attrs.height } : {},
      },
      // Tier 1-1: Hero image + caption (나무위키 인포박스 상단 이미지)
      heroImage: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-hero-image") || null,
        renderHTML: (attrs: Record<string, any>) =>
          attrs.heroImage ? { "data-hero-image": attrs.heroImage } : {},
      },
      heroCaption: {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-hero-caption") || "",
        renderHTML: (attrs: Record<string, any>) =>
          attrs.heroCaption ? { "data-hero-caption": attrs.heroCaption } : {},
      },
      // Tier 1-2: Header color theme (나무위키 인포박스 색상 테마)
      // null = default (bg-secondary/30). Otherwise a raw CSS color string (rgba/hex).
      headerColor: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-header-color") || null,
        renderHTML: (attrs: Record<string, any>) =>
          attrs.headerColor ? { "data-header-color": attrs.headerColor } : {},
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="infobox-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "infobox-block" })]
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "infoboxBlock") {
          e.commands.deleteSelection()
          return true
        }
        const { $from } = e.state.selection
        const before = $from.nodeBefore
        if (before?.type.name === "infoboxBlock") {
          e.commands.deleteRange({ from: $from.pos - before.nodeSize, to: $from.pos })
          return true
        }
        return false
      },
      Delete: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "infoboxBlock") {
          e.commands.deleteSelection()
          return true
        }
        return false
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(InfoboxNodeView)
  },
})
