"use client"

import { useState, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { RELATION_TYPES, RELATION_TYPE_CONFIG } from "@/lib/relation-helpers"
import type { RelationType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"

interface RelationPickerProps {
  sourceNoteId: string
  onAdd: (targetNoteId: string, type: RelationType) => void
  onClose: () => void
}

export function RelationPicker({ sourceNoteId, onAdd, onClose }: RelationPickerProps) {
  const notes = usePlotStore((s) => s.notes)
  const relations = usePlotStore((s) => s.relations)
  const [search, setSearch] = useState("")
  const [selectedType, setSelectedType] = useState<RelationType>("related-to")

  const filtered = useMemo(() => {
    const existingTargets = new Set(
      relations
        .filter(r => r.sourceNoteId === sourceNoteId && r.type === selectedType)
        .map(r => r.targetNoteId)
    )
    return notes
      .filter(n =>
        n.id !== sourceNoteId &&
        !n.trashed &&
        !existingTargets.has(n.id) &&
        (search === "" ||
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.preview.toLowerCase().includes(search.toLowerCase()))
      )
      .slice(0, 10)
  }, [notes, relations, sourceNoteId, selectedType, search])

  return (
    <div className="mt-2 rounded-md border border-border bg-popover p-2 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-2xs font-medium text-muted-foreground">Add Relation</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-hover-bg">
          <PhX className="text-muted-foreground" size={14} weight="regular" />
        </button>
      </div>

      {/* Type selector */}
      <div className="flex flex-wrap gap-1">
        {RELATION_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={cn(
              "text-2xs px-2 py-0.5 rounded-full border transition-colors",
              t === selectedType
                ? "border-foreground/30 bg-secondary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-hover-bg"
            )}
          >
            {RELATION_TYPE_CONFIG[t].label}
          </button>
        ))}
      </div>

      {/* MagnifyingGlass */}
      <div className="relative">
        <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={14} weight="regular" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="MagnifyingGlass notes..."
          className="w-full pl-7 pr-2 py-1.5 text-note bg-secondary/50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Results */}
      <div className="max-h-[200px] overflow-y-auto space-y-0.5">
        {filtered.length === 0 ? (
          <span className="text-note text-muted-foreground px-1 py-2 block">No matching notes</span>
        ) : (
          filtered.map(n => (
            <button
              key={n.id}
              onClick={() => onAdd(n.id, selectedType)}
              className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-note text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
            >
              <span className="truncate">{n.title || "Untitled"}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
