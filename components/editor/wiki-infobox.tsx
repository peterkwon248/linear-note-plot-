"use client"

import { useState, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiInfoboxEntry } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"

interface WikiInfoboxProps {
  noteId: string
  entries: WikiInfoboxEntry[]
  editable?: boolean
  className?: string
}

export function WikiInfobox({ noteId, entries, editable = false, className }: WikiInfoboxProps) {
  const setWikiInfobox = usePlotStore((s) => s.setWikiInfobox)
  const [isEditing, setIsEditing] = useState(false)
  const [localEntries, setLocalEntries] = useState<WikiInfoboxEntry[]>(entries)

  const handleStartEdit = useCallback(() => {
    setLocalEntries([...entries])
    setIsEditing(true)
  }, [entries])

  const handleSave = useCallback(() => {
    const cleaned = localEntries.filter((e) => e.key.trim() !== "")
    setWikiInfobox(noteId, cleaned)
    setIsEditing(false)
  }, [noteId, localEntries, setWikiInfobox])

  const handleCancel = useCallback(() => {
    setLocalEntries([...entries])
    setIsEditing(false)
  }, [entries])

  const handleAdd = useCallback(() => {
    setLocalEntries((prev) => [...prev, { key: "", value: "" }])
  }, [])

  const handleRemove = useCallback((index: number) => {
    setLocalEntries((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleChange = useCallback((index: number, field: "key" | "value", val: string) => {
    setLocalEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: val } : entry)),
    )
  }, [])

  // Nothing to show and not editable
  if (entries.length === 0 && !editable) return null

  // Display mode
  if (!isEditing) {
    if (entries.length === 0 && editable) {
      return (
        <div className={cn("rounded-lg border border-dashed border-border p-3", className)}>
          <button
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 text-note text-muted-foreground hover:text-foreground transition-colors"
          >
            <PhPlus size={14} weight="regular" />
            Add infobox
          </button>
        </div>
      )
    }

    return (
      <div className={cn("rounded-lg border border-border bg-card/50 overflow-hidden", className)}>
        <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-3 py-2">
          <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            Info
          </span>
          {editable && (
            <button
              onClick={handleStartEdit}
              className="rounded p-0.5 text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
            >
              <PencilSimple size={12} weight="regular" />
            </button>
          )}
        </div>
        <div className="divide-y divide-border">
          {entries.map((entry, i) => (
            <div key={i} className="flex gap-3 px-3 py-2">
              <span className="shrink-0 text-note font-medium text-muted-foreground min-w-[80px]">
                {entry.key}
              </span>
              <span className="text-note text-foreground break-words">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Edit mode
  return (
    <div className={cn("rounded-lg border border-primary/30 bg-card/50 overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-3 py-2">
        <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          Edit Infobox
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className="rounded p-1 text-green-500 hover:bg-green-500/10 transition-colors"
          >
            <PhCheck size={14} weight="bold" />
          </button>
          <button
            onClick={handleCancel}
            className="rounded p-1 text-muted-foreground hover:bg-hover-bg transition-colors"
          >
            <PhX size={14} weight="regular" />
          </button>
        </div>
      </div>
      <div className="space-y-2 p-3">
        {localEntries.map((entry, i) => (
          <div key={i} className="flex items-start gap-2">
            <input
              value={entry.key}
              onChange={(e) => handleChange(i, "key", e.target.value)}
              placeholder="Key"
              className="w-[100px] shrink-0 rounded border border-border bg-background px-2 py-1 text-note outline-none focus:ring-1 focus:ring-ring"
            />
            <input
              value={entry.value}
              onChange={(e) => handleChange(i, "value", e.target.value)}
              placeholder="Value"
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-note outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={() => handleRemove(i)}
              className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <PhX size={14} weight="regular" />
            </button>
          </div>
        ))}
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 text-note text-muted-foreground hover:text-foreground transition-colors"
        >
          <PhPlus size={14} weight="regular" />
          Add field
        </button>
      </div>
    </div>
  )
}
