"use client"

import { useState } from "react"
import { BubbleMenu } from "@tiptap/react/menus"
import { useEditorState } from "@tiptap/react"
import type { Editor } from "@tiptap/core"
import {
  Trash,
  Plus,
  Minus,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  TextB,
  PaintBucket,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Rows,
} from "@/lib/editor/editor-icons"
import { useT } from "@/lib/i18n"

const CELL_COLORS = [
  { label: "None", value: "" },
  { label: "Gray", value: "rgba(128,128,128,0.25)" },
  { label: "Blue", value: "rgba(59,130,246,0.25)" },
  { label: "Green", value: "rgba(34,197,94,0.25)" },
  { label: "Yellow", value: "rgba(234,179,8,0.25)" },
  { label: "Red", value: "rgba(239,68,68,0.25)" },
  { label: "Purple", value: "rgba(168,85,247,0.25)" },
]

const btn = "flex items-center justify-center w-7 h-7 rounded-md hover:bg-hover-bg hover:text-foreground transition-colors"
const btnActive = "bg-toolbar-active text-foreground"
const btnMuted = "text-muted-foreground"
const btnDisabled = "opacity-30 pointer-events-none"
const divider = "w-px h-4 bg-border mx-0.5 shrink-0"

interface TableBubbleMenuProps {
  editor: Editor
}

export function TableBubbleMenu({ editor }: TableBubbleMenuProps) {
  const t = useT()
  const [showColors, setShowColors] = useState(false)

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      isInHeaderRow: e?.isActive("tableHeader") ?? false,
      canMerge: e?.can().mergeCells() ?? false,
      canSplit: e?.can().splitCell() ?? false,
      hasCellSelection: e ? "$anchorCell" in e.state.selection : false,
      isBold: e?.isActive("bold") ?? false,
      alignLeft: e?.isActive({ textAlign: "left" }) ?? false,
      alignCenter: e?.isActive({ textAlign: "center" }) ?? false,
      alignRight: e?.isActive({ textAlign: "right" }) ?? false,
    }),
  })

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableBubbleMenu"
      options={{ placement: "top-start", offset: 8 }}
      shouldShow={({ editor: e }: { editor: Editor }) => e.isActive("table")}
    >
      <div className="flex items-center gap-0.5 rounded-lg border border-border bg-surface-overlay p-1 shadow-lg relative">
        {/* ── Row ── */}
        <button type="button" className={`${btn} ${btnMuted}`} title={t("editor.table.add_row_above")}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowBefore().run() }}>
          <ArrowUp size={12} />
        </button>
        <button type="button" className={`${btn} ${btnMuted}`} title={t("editor.table.add_row_below")}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run() }}>
          <ArrowDown size={12} />
        </button>
        <button type="button"
          className={`${btn} ${state.isInHeaderRow ? btnDisabled : btnMuted}`}
          title={state.isInHeaderRow ? t("editor.table.cannot_delete_header") : t("editor.table.delete_row")}
          onMouseDown={(e) => { e.preventDefault(); if (!state.isInHeaderRow) editor.chain().focus().deleteRow().run() }}>
          <Minus size={12} />
        </button>

        <div className={divider} />

        {/* ── Col ── */}
        <button type="button" className={`${btn} ${btnMuted}`} title={t("editor.table.add_col_left")}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnBefore().run() }}>
          <ArrowLeft size={12} />
        </button>
        <button type="button" className={`${btn} ${btnMuted}`} title={t("editor.table.add_col_right")}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run() }}>
          <ArrowRight size={12} />
        </button>
        <button type="button"
          className={`${btn} ${!editor.can().deleteColumn() ? btnDisabled : btnMuted}`}
          title={t("editor.table.delete_col")}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteColumn().run() }}>
          <Minus size={12} />
        </button>

        <div className={divider} />

        {/* ── Merge/Split ── */}
        {state.canMerge && (
          <button type="button" className={`${btn} ${btnMuted} !w-auto px-2 text-2xs`} title={t("editor.table.merge_cells")}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().mergeCells().run() }}>
            {t("editor.table.merge_cells")}
          </button>
        )}
        {state.canSplit && (
          <button type="button" className={`${btn} ${btnMuted} !w-auto px-2 text-2xs`} title={t("editor.table.split_cell")}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().splitCell().run() }}>
            {t("editor.table.split_cell")}
          </button>
        )}
        {(state.canMerge || state.canSplit) && <div className={divider} />}

        {/* ── Align ── */}
        <button type="button" className={`${btn} ${state.alignLeft ? btnActive : btnMuted}`} title={t("editor.table.align_left")}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("left").run() }}>
          <TextAlignLeft size={12} />
        </button>
        <button type="button" className={`${btn} ${state.alignCenter ? btnActive : btnMuted}`} title={t("editor.table.align_center")}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("center").run() }}>
          <TextAlignCenter size={12} />
        </button>
        <button type="button" className={`${btn} ${state.alignRight ? btnActive : btnMuted}`} title={t("editor.table.align_right")}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("right").run() }}>
          <TextAlignRight size={12} />
        </button>

        <div className={divider} />

        {/* ── Bold ── */}
        <button type="button" className={`${btn} ${state.isBold ? btnActive : btnMuted}`} title="Bold"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}>
          <TextB size={12} />
        </button>

        {/* ── Cell color ── */}
        <button type="button" className={`${btn} ${btnMuted}`} title={t("editor.table.cell_bg")}
          onMouseDown={(e) => { e.preventDefault(); setShowColors(!showColors) }}>
          <PaintBucket size={12} />
        </button>

        {/* ── Header toggle ── */}
        <button type="button"
          className={`${btn} ${state.isInHeaderRow ? btnActive : btnMuted}`}
          title={t("editor.table.toggle_header")}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeaderRow().run() }}>
          <Rows size={12} />
        </button>

        <div className={divider} />

        {/* ── Delete (smart) ── */}
        <button type="button"
          className={`${btn} text-destructive hover:bg-destructive/10`}
          title={state.hasCellSelection ? t("editor.table.delete_row") : t("editor.table.delete_table")}
          onMouseDown={(e) => {
            e.preventDefault()
            if (state.hasCellSelection) {
              // Try deleteRow first, then deleteColumn — removes whichever applies
              const chain = editor.chain().focus()
              if (editor.can().deleteRow()) chain.deleteRow()
              if (editor.can().deleteColumn()) chain.deleteColumn()
              chain.run()
            } else {
              editor.chain().focus().deleteTable().run()
            }
          }}>
          <Trash size={12} />
        </button>

        {/* ── Color picker popover ── */}
        {showColors && (
          <div className="absolute top-full left-0 mt-1 flex gap-1 rounded-lg border border-border bg-surface-overlay p-1.5 shadow-lg z-50">
            {CELL_COLORS.map((c) => (
              <button
                key={c.label}
                type="button"
                title={c.label}
                className="w-6 h-6 rounded border border-border-subtle hover:scale-110 transition-transform"
                style={{ background: c.value || "var(--background)" }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor.commands.setCellAttribute("backgroundColor", c.value || null)
                  setShowColors(false)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </BubbleMenu>
  )
}
