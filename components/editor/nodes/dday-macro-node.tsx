"use client"

import { useState } from "react"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// ── D-Day 계산 ────────────────────────────────────────────────────────────────

type DDayResult =
  | { kind: "today" }
  | { kind: "future"; days: number }
  | { kind: "past"; days: number }
  | { kind: "invalid" }

function calcDDay(dateStr: string): DDayResult {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!match) return { kind: "invalid" }

  const y = parseInt(match[1], 10)
  const m = parseInt(match[2], 10) - 1
  const d = parseInt(match[3], 10)

  if (isNaN(y) || isNaN(m) || isNaN(d) || m < 0 || m > 11 || d < 1 || d > 31) {
    return { kind: "invalid" }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = new Date(y, m, d)
  target.setHours(0, 0, 0, 0)

  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)

  if (diff === 0) return { kind: "today" }
  if (diff > 0) return { kind: "future", days: diff }
  return { kind: "past", days: Math.abs(diff) }
}

function formatDDayLabel(dateStr: string, labelStr?: string | null): string {
  if (!dateStr) return "[date]"
  const result = calcDDay(dateStr)
  const prefix = labelStr ? `${labelStr} ` : ""
  switch (result.kind) {
    case "invalid":
      return "[invalid date]"
    case "today":
      return `${prefix}D-Day`
    case "future":
      return `${prefix}D-${result.days}`
    case "past":
      return `${prefix}D+${result.days}`
  }
}

// ── 상태별 chip 색상 ──────────────────────────────────────────────────────────

function getChipStyle(dateStr: string): string {
  const result = calcDDay(dateStr)
  const base =
    "inline-flex items-center rounded-md px-1.5 py-0.5 text-[13px] font-medium " +
    "border transition-colors select-none "

  switch (result.kind) {
    case "today":
      return base + "bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30"
    case "future":
      return base + "bg-primary/15 text-primary border-primary/25 hover:bg-primary/25"
    case "past":
    default:
      return base + "bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted/70"
  }
}

// ── NodeView ──────────────────────────────────────────────────────────────────

function DDayMacroView({ node, updateAttributes, editor }: NodeViewProps) {
  const editable = editor.isEditable
  const dateStr = (node.attrs.date as string) || ""
  const labelStr = (node.attrs.label as string | null) || ""
  const displayLabel = formatDDayLabel(dateStr, labelStr || null)
  const chipClass = getChipStyle(dateStr) + (editable ? " cursor-pointer" : "")

  const [open, setOpen] = useState(false)

  if (!editable) {
    return (
      <NodeViewWrapper as="span">
        <span contentEditable={false} className={chipClass}>
          {displayLabel}
        </span>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper as="span">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <span contentEditable={false} className={chipClass} title={dateStr || undefined}>
            {displayLabel}
          </span>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-3"
          align="start"
          side="bottom"
          sideOffset={6}
          collisionPadding={16}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => updateAttributes({ date: e.target.value })}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Label (optional)</label>
              <input
                type="text"
                value={labelStr}
                onChange={(e) => updateAttributes({ label: e.target.value || null })}
                placeholder="Wedding, exam, …"
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {dateStr ? formatDDayLabel(dateStr, labelStr || null) : "Pick a date"}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  )
}

// ── TipTap Node Definition ────────────────────────────────────────────────────

export const DDayMacroNode = Node.create({
  name: "ddayMacro",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      date: {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-dday") || "",
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-dday": attrs.date || "",
        }),
      },
      label: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-label") || null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.label ? { "data-label": attrs.label } : {},
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-dday]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const label = formatDDayLabel(
      (node.attrs.date as string) || "",
      (node.attrs.label as string | null) ?? null,
    )
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "dday-macro" }),
      label,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DDayMacroView)
  },
})
