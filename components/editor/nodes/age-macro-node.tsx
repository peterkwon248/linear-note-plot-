"use client"

import { useState } from "react"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// ── 만 나이 계산 ──────────────────────────────────────────────────────────────

function calcAge(dateStr: string): { valid: boolean; age: number; isFuture: boolean; daysUntil: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!match) return { valid: false, age: 0, isFuture: false, daysUntil: 0 }

  const birthYear = parseInt(match[1], 10)
  const birthMonth = parseInt(match[2], 10) - 1 // 0-indexed
  const birthDay = parseInt(match[3], 10)

  if (
    isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay) ||
    birthMonth < 0 || birthMonth > 11 ||
    birthDay < 1 || birthDay > 31
  ) {
    return { valid: false, age: 0, isFuture: false, daysUntil: 0 }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const birth = new Date(birthYear, birthMonth, birthDay)
  birth.setHours(0, 0, 0, 0)

  if (birth > today) {
    // 미래 날짜 — 출생 예정
    const daysUntil = Math.round((birth.getTime() - today.getTime()) / 86400000)
    return { valid: true, age: 0, isFuture: true, daysUntil }
  }

  // 한국식 만 나이: 현재 연도 - 출생 연도 - (생일 아직 안 지났으면 1)
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()
  const todayDay = today.getDate()

  let age = todayYear - birthYear
  // 생일이 아직 안 지났으면 -1
  if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
    age -= 1
  }

  return { valid: true, age, isFuture: false, daysUntil: 0 }
}

function formatAgeLabel(dateStr: string): string {
  if (!dateStr) return "[date]"
  const result = calcAge(dateStr)
  if (!result.valid) return "[invalid date]"
  if (result.isFuture) return `Due in ${result.daysUntil}d`
  return `${result.age} y/o`
}

// ── NodeView ──────────────────────────────────────────────────────────────────

function AgeMacroView({ node, updateAttributes, editor }: NodeViewProps) {
  const editable = editor.isEditable
  const dateStr = (node.attrs.date as string) || ""
  const label = formatAgeLabel(dateStr)
  const [open, setOpen] = useState(false)

  const chipClass =
    "inline-flex items-center rounded-md px-1.5 py-0.5 text-[13px] font-medium " +
    "bg-secondary/40 text-foreground/80 border border-border/40 " +
    "hover:bg-secondary/60 hover:border-border/70 transition-colors " +
    (editable ? "cursor-pointer select-none" : "select-none")

  if (!editable) {
    return (
      <NodeViewWrapper as="span">
        <span contentEditable={false} className={chipClass}>
          {label}
        </span>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper as="span">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <span contentEditable={false} className={chipClass} title={dateStr || undefined}>
            {label}
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
            <label className="text-xs font-medium text-muted-foreground">Date of birth</label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => updateAttributes({ date: e.target.value })}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="text-xs text-muted-foreground">
              {dateStr ? formatAgeLabel(dateStr) : "Pick a date"}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  )
}

// ── TipTap Node Definition ────────────────────────────────────────────────────

export const AgeMacroNode = Node.create({
  name: "ageMacro",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      date: {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-age") || "",
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-age": attrs.date || "",
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-age]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const label = formatAgeLabel((node.attrs.date as string) || "")
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "age-macro" }),
      label,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AgeMacroView)
  },
})
