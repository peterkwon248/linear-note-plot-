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
} from "@/lib/editor/editor-icons"
import { useBlockResize } from "@/components/editor/hooks/use-block-resize"
import { BlockResizeHandles } from "@/components/editor/hooks/block-resize-handles"

interface InfoboxRow {
  label: string
  value: string
}

function InfoboxNodeView({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const editable = editor.isEditable
  const title = (node.attrs.title as string) || "Info"
  const rows = (node.attrs.rows as InfoboxRow[]) || []
  const width = node.attrs.width as number | null
  const height = node.attrs.height as number | null
  const heroImage = (node.attrs.heroImage as string | null) ?? null
  const heroCaption = (node.attrs.heroCaption as string) || ""
  const { containerRef, isResizing, onResizeStart } = useBlockResize(width, height, updateAttributes)

  // Tier 1-3: 접기/펼치기 state (local, not persisted — consistent with Summary node)
  const [collapsed, setCollapsed] = useState(false)

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
    updateAttributes({ rows: [...rows, { label: "", value: "" }] })
  }, [rows, updateAttributes])

  const removeRow = useCallback((index: number) => {
    const newRows = rows.filter((_, i) => i !== index)
    updateAttributes({ rows: newRows })
  }, [rows, updateAttributes])

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
                className="w-full px-3 py-1.5 text-2xs italic text-center text-muted-foreground bg-secondary/10 outline-none placeholder:text-muted-foreground/30 border-t border-border-subtle"
              />
            ) : (
              heroCaption && (
                <div className="px-3 py-1.5 text-2xs italic text-center text-muted-foreground bg-secondary/10 border-t border-border-subtle">
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
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-2xs text-muted-foreground/40 hover:text-muted-foreground hover:bg-hover-bg transition-colors border-b border-border-subtle opacity-0 group-hover/infobox:opacity-100"
            title="Add hero image"
          >
            <PhImage size={12} />
            <span>Add hero image</span>
          </button>
        )}

        {/* Header — always visible, with chevron toggle (Tier 1-3) */}
        <div
          className={`flex items-center justify-between px-3 py-2 bg-secondary/30 ${
            collapsed ? "" : "border-b border-border-subtle"
          }`}
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
              className="text-2xs font-semibold uppercase tracking-wider bg-transparent border-none outline-none text-muted-foreground w-full min-w-0"
              placeholder="Infobox Title"
            />
          </div>
          {editable && (
            <div className="flex items-center gap-0.5">
              {(width || height) && (
                <button
                  type="button"
                  onClick={() => updateAttributes({ width: null, height: null })}
                  className="rounded p-0.5 text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors opacity-0 group-hover/infobox:opacity-100"
                  title="Reset size"
                >
                  <ArrowsIn size={12} />
                </button>
              )}
              <button
                type="button"
                onClick={() => deleteNode()}
                className="rounded p-0.5 text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors opacity-0 group-hover/infobox:opacity-100"
                title="Remove infobox"
              >
                <PhX size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Rows — hidden when collapsed (Tier 1-3) */}
        {!collapsed && (
        <div className="divide-y divide-border-subtle">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center group/row">
              <input
                type="text"
                value={row.label}
                onChange={(e) => updateRow(index, "label", e.target.value)}
                readOnly={!editable}
                className="w-[120px] shrink-0 px-3 py-1.5 text-2xs font-medium text-muted-foreground bg-secondary/20 border-r border-border-subtle outline-none placeholder:text-muted-foreground/30"
                placeholder="Label"
              />
              <input
                type="text"
                value={row.value}
                onChange={(e) => updateRow(index, "value", e.target.value)}
                readOnly={!editable}
                className="flex-1 px-3 py-1.5 text-2xs text-foreground bg-transparent outline-none placeholder:text-muted-foreground/30"
                placeholder="Value"
              />
              {editable && (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="px-2 text-muted-foreground/20 hover:text-red-400 transition-colors opacity-0 group-hover/row:opacity-100"
                  title="Remove row"
                >
                  <PhTrash size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
        )}

        {/* Add row button — hover-only in edit mode, hidden when collapsed */}
        {!collapsed && editable && (
          <button
            type="button"
            onClick={addRow}
            className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-2xs text-muted-foreground/40 hover:text-muted-foreground hover:bg-hover-bg transition-colors border-t border-border-subtle opacity-0 group-hover/infobox:opacity-100"
          >
            <PhPlus size={11} />
            <span>Add row</span>
          </button>
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
