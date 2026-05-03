"use client"

/**
 * TemplatesFloatingActionBar — multi-select action bar for the Templates list.
 *
 * Shown when selectedIds.size > 0. Provides:
 *   - Selection count + clear
 *   - Pin / Unpin (unified label based on mixed state)
 *   - Delete (with undo toast)
 *
 * Styling follows floating-action-bar.tsx (fixed bottom-center, dark blur
 * card, slide-in animation).
 */

import { useMemo } from "react"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { PushPinSlash } from "@phosphor-icons/react/dist/ssr/PushPinSlash"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import type { NoteTemplate } from "@/lib/types"

/* ── Props ────────────────────────────────────────────── */

interface TemplatesFloatingActionBarProps {
  selectedIds: Set<string>
  templates: NoteTemplate[]
  onClearSelection: () => void
}

/* ── Divider ──────────────────────────────────────────── */

function Divider() {
  return <div className="h-7 w-px bg-border mx-1.5" />
}

/* ── Component ────────────────────────────────────────── */

export function TemplatesFloatingActionBar({
  selectedIds,
  templates,
  onClearSelection,
}: TemplatesFloatingActionBarProps) {
  const toggleTemplatePin = usePlotStore((s) => s.toggleTemplatePin) as (id: string) => void
  const deleteTemplate = usePlotStore((s) => s.deleteTemplate) as (id: string) => void
  const restoreTemplate = usePlotStore((s) => s.restoreTemplate) as (id: string) => void

  const ids = useMemo(() => Array.from(selectedIds), [selectedIds])
  const count = ids.length

  const selectedTemplates = useMemo(
    () => templates.filter((t) => selectedIds.has(t.id)),
    [templates, selectedIds],
  )

  // Pin state: allPinned → show Unpin, otherwise show Pin
  const allPinned = useMemo(
    () => selectedTemplates.length > 0 && selectedTemplates.every((t) => t.pinned),
    [selectedTemplates],
  )

  /* ── Handlers ─────────────────────────────────────────── */

  const handlePinToggle = () => {
    if (allPinned) {
      // Unpin all
      ids.forEach((id) => {
        const t = templates.find((t) => t.id === id)
        if (t?.pinned) toggleTemplatePin(id)
      })
      toast(`Unpinned ${count} template${count > 1 ? "s" : ""}`)
    } else {
      // Pin all (including already-pinned — toggleTemplatePin flips, so only
      // pin the ones that are currently unpinned)
      ids.forEach((id) => {
        const t = templates.find((t) => t.id === id)
        if (!t?.pinned) toggleTemplatePin(id)
      })
      toast(`Pinned ${count} template${count > 1 ? "s" : ""}`)
    }
    onClearSelection()
  }

  const handleDelete = () => {
    ids.forEach((id) => deleteTemplate(id))
    onClearSelection()
    toast(`Deleted ${count} template${count > 1 ? "s" : ""}`, {
      action: {
        label: "Undo",
        onClick: () => {
          ids.forEach((id) => restoreTemplate(id))
          toast(`Restored ${count} template${count > 1 ? "s" : ""}`)
        },
      },
      duration: 5000,
    })
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 rounded-lg border border-border bg-card shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-center gap-1 px-4 py-2.5">
        {/* Count + clear */}
        <div className="flex items-center gap-1.5 px-1.5">
          <span className="text-ui font-medium text-foreground whitespace-nowrap">
            {count} template{count > 1 ? "s" : ""} selected
          </span>
          <button
            onClick={onClearSelection}
            className="rounded-md p-0.5 text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
          >
            <PhX size={16} weight="regular" />
          </button>
        </div>

        <Divider />

        {/* Pin / Unpin */}
        <button
          onClick={handlePinToggle}
          className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-ui font-medium text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
        >
          {allPinned ? (
            <>
              <PushPinSlash size={16} weight="regular" />
              Unpin
            </>
          ) : (
            <>
              <PushPin size={16} weight="regular" />
              Pin
            </>
          )}
        </button>

        <Divider />

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-3 py-2 text-ui font-medium text-destructive hover:bg-destructive/20 transition-colors"
        >
          <Trash size={16} weight="regular" />
          Delete
        </button>
      </div>
    </div>
  )
}
