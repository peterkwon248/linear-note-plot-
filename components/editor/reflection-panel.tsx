"use client"

import { useState, useRef, KeyboardEvent } from "react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { format } from "date-fns"
import type { Reflection } from "@/lib/types"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"

interface ReflectionPanelProps {
  noteId: string
}

export function ReflectionPanel({ noteId }: ReflectionPanelProps) {
  const reflections = usePlotStore((s) => s.reflections)
  const addReflection = usePlotStore((s) => s.addReflection)

  const noteReflections = (reflections ?? [])
    .filter((r) => r.noteId === noteId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const [collapsed, setCollapsed] = useState(true)
  const [composing, setComposing] = useState(false)
  const [text, setText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleAdd = () => {
    if (!text.trim()) return
    addReflection(noteId, text.trim())
    setText("")
    setComposing(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
    if (e.key === "Escape") {
      setComposing(false)
      setText("")
    }
  }

  const handleStartComposing = () => {
    setComposing(true)
    setCollapsed(false)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  return (
    <div className="flex-shrink-0">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors"
      >
        {collapsed ? (
          <CaretRight className="text-muted-foreground shrink-0" size={14} weight="regular" />
        ) : (
          <CaretDown className="text-muted-foreground shrink-0" size={14} weight="regular" />
        )}
        <BookOpen className="text-muted-foreground shrink-0" size={14} weight="regular" />
        <span className="text-xs font-medium text-muted-foreground">Reflections</span>
        {noteReflections.length > 0 && (
          <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/20 px-1 text-2xs font-medium text-amber-500">
            {noteReflections.length}
          </span>
        )}
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {/* Existing reflections — append-only timeline */}
          {noteReflections.length > 0 && (
            <div className="ml-2 border-l-2 border-border pl-3 space-y-3">
              {noteReflections.map((ref) => (
                <ReflectionEntry key={ref.id} reflection={ref} />
              ))}
            </div>
          )}

          {/* Compose area */}
          {composing ? (
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="이 노트를 돌아보며... (Enter to save, Esc to cancel)"
                rows={2}
                className={cn(
                  "w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground",
                  "placeholder:text-muted-foreground/50 outline-none focus:border-amber-500/50",
                  "min-h-[60px] leading-relaxed"
                )}
                style={{ fieldSizing: "content" } as React.CSSProperties}
              />
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => { setComposing(false); setText("") }}
                  className="rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!text.trim()}
                  className="rounded-md px-2.5 py-1 text-xs text-amber-500 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleStartComposing}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors border border-border/50"
            >
              <PhPlus size={12} weight="regular" />
              Add Reflection
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ReflectionEntry({ reflection }: { reflection: Reflection }) {
  const createdDate = new Date(reflection.createdAt)
  const isRecent = Date.now() - createdDate.getTime() < 7 * 24 * 60 * 60 * 1000

  return (
    <div className="relative">
      <div className="absolute -left-[17px] top-[6px] w-2 h-2 rounded-full bg-amber-500" />
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
        {reflection.text}
      </p>
      <span className={cn(
        "text-2xs",
        isRecent ? "text-amber-500/60" : "text-muted-foreground/60"
      )}>
        {format(createdDate, "yyyy.MM.dd h:mm a")}
      </span>
    </div>
  )
}
