"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import type { Note } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useT } from "@/lib/i18n"
import {
  Search,
  GitMerge,
  Close as X,
  GripVertical,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Plus,
  Check,
  FileText,
  Layers,
} from "@/components/icons/imperial"
import { setNoteViewMode } from "@/lib/note-view-mode"

/* ──────────────────────────────────────────────────────────
 * NoteMergePage — standalone "wiki-level" merge mode for NOTES.
 *
 * Mirrors components/views/wiki-merge-page.tsx (WikiMergePage):
 *   searchable multi-select → selected preview → choose survivor
 *   ("existing") OR new title ("new") → merge.
 *
 * Notes are single rich-text docs (not block assemblies), so:
 *   - the per-source "blocks" preview becomes a content/preview snippet,
 *   - wiki "categories" become note "tags" (the note classification analog).
 *
 * Backend mapping (lib/store/slices/notes.ts):
 *   - "existing"/survivor → mergeNotes(survivorId, otherSelectedIds)
 *   - "new"               → createNote({ title }) → mergeNotes(newId, allSelectedIds)
 *   mergeNotes concatenates content, unions tags, sums reads, and trashes
 *   the source notes. On completion → setNoteViewMode("default") + openNote.
 * ────────────────────────────────────────────────────────── */

function notePreviewText(note: Note): string {
  const raw = (note.preview && note.preview.trim().length > 0 ? note.preview : note.content) ?? ""
  const trimmed = raw.trim()
  if (trimmed.length === 0) return "Empty note"
  return trimmed.length > 200 ? trimmed.slice(0, 200) + "…" : trimmed
}

export function NoteMergePage() {
  const t = useT()
  const notes = usePlotStore((s) => s.notes)
  const mergeNotes = usePlotStore((s) => s.mergeNotes)
  const createNote = usePlotStore((s) => s.createNote)
  const openNote = usePlotStore((s) => s.openNote)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  // Final step state
  const [mergeTitle, setMergeTitle] = useState("")
  const [mergeMode, setMergeMode] = useState<"new" | "existing">("existing")
  const [survivorId, setSurvivorId] = useState<string | null>(null)
  // Tag state (note analog of wiki categories)
  const [tags, setTags] = useState<string[]>([])

  // Dropdown open states
  const [titleDropdownOpen, setTitleDropdownOpen] = useState(false)
  const [survivorDropdownOpen, setSurvivorDropdownOpen] = useState(false)
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [showNewTagInput, setShowNewTagInput] = useState(false)
  const [newTagInputValue, setNewTagInputValue] = useState("")

  // Dropdown refs for click-outside
  const titleDropdownRef = useRef<HTMLDivElement>(null)
  const survivorDropdownRef = useRef<HTMLDivElement>(null)
  const tagDropdownRef = useRef<HTMLDivElement>(null)
  const newTagInputRef = useRef<HTMLInputElement>(null)

  // Click-outside handlers
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (titleDropdownRef.current && !titleDropdownRef.current.contains(e.target as Node)) {
        setTitleDropdownOpen(false)
      }
    }
    if (titleDropdownOpen) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [titleDropdownOpen])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (survivorDropdownRef.current && !survivorDropdownRef.current.contains(e.target as Node)) {
        setSurvivorDropdownOpen(false)
      }
    }
    if (survivorDropdownOpen) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [survivorDropdownOpen])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false)
        setShowNewTagInput(false)
        setNewTagInputValue("")
      }
    }
    if (tagDropdownOpen) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [tagDropdownOpen])

  // Focus new tag input when shown
  useEffect(() => {
    if (showNewTagInput && newTagInputRef.current) {
      newTagInputRef.current.focus()
    }
  }, [showNewTagInput])

  // Only non-trashed notes are mergeable.
  const activeNotes = useMemo(() => notes.filter((n) => !n.trashed), [notes])

  // All existing tag names across all notes (for dropdown).
  const allTagNames = useMemo(() => {
    const set = new Set<string>()
    activeNotes.forEach((n) => (n.tags ?? []).forEach((tg) => set.add(tg)))
    return Array.from(set).sort()
  }, [activeNotes])

  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return activeNotes.filter(
      (n) => q.length === 0 || (n.title || "Untitled").toLowerCase().includes(q),
    )
  }, [activeNotes, searchQuery])

  const selectedNotes = useMemo(
    () => selectedIds.map((id) => activeNotes.find((n) => n.id === id)).filter(Boolean) as Note[],
    [selectedIds, activeNotes],
  )

  // When selection changes, update derived state (mirrors WikiMergePage).
  const toggleNote = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      // Auto-set title + survivor from first selected
      if (next.length > 0 && !prev.includes(id)) {
        const first = activeNotes.find((n) => n.id === next[0])
        if (first && prev.length === 0) {
          setMergeTitle(first.title || "Untitled")
          setSurvivorId(first.id)
        }
      }
      // Aggregate tags
      const arr = next.map((nid) => activeNotes.find((n) => n.id === nid)).filter(Boolean) as Note[]
      const allTags = new Set<string>()
      arr.forEach((n) => (n.tags ?? []).forEach((tg) => allTags.add(tg)))
      setTags(Array.from(allTags))
      return next
    })
  }, [activeNotes])

  const removeSelected = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id))
  }, [])

  const moveSelected = useCallback((fromIdx: number, toIdx: number) => {
    setSelectedIds((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next
    })
  }, [])

  const handleMerge = () => {
    if (selectedIds.length < 2) return

    if (mergeMode === "existing") {
      // Survivor is the keeper; the others get absorbed + trashed.
      const keeperId = survivorId ?? selectedIds[0]
      const sourceIds = selectedIds.filter((id) => id !== keeperId)
      if (sourceIds.length === 0) return
      mergeNotes(keeperId, sourceIds)
      const keeper = selectedNotes.find((n) => n.id === keeperId)
      toast.success(
        `Merged ${sourceIds.length} note${sourceIds.length > 1 ? "s" : ""} into "${keeper?.title || mergeTitle || "Untitled"}"`,
      )
      setNoteViewMode("default")
      openNote(keeperId)
      return
    }

    // "new" — create a fresh note, then absorb ALL selected into it.
    const newTitle = mergeTitle.trim() || "Untitled"
    const newId = createNote({ title: newTitle, tags })
    if (!newId) return
    mergeNotes(newId, selectedIds)
    toast.success(`Created merged note "${newTitle}"`)
    setNoteViewMode("default")
    openNote(newId)
  }

  const confirmNewTag = () => {
    const val = newTagInputValue.trim()
    if (val && !tags.includes(val)) {
      setTags((prev) => [...prev, val])
    }
    setNewTagInputValue("")
    setShowNewTagInput(false)
    setTagDropdownOpen(false)
  }

  // Survivor label
  const survivorLabel = selectedNotes.find((n) => n.id === survivorId)?.title || "Untitled"

  // Merge is disabled unless there's a usable title:
  //   - "new": needs a typed title
  //   - "existing": survivor's title acts as the title (always present)
  const mergeDisabled =
    mergeMode === "new" ? !mergeTitle.trim() : !survivorId

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
            <GitMerge size={16} className="text-white/70" />
          </div>
          <div>
            <h2 className="text-note font-semibold text-white/90">Merge Notes</h2>
            <p className="text-2xs text-white/40">Select notes to combine into one</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setNoteViewMode("default")}
              className="rounded-md px-3 py-1.5 text-2xs text-white/50 transition-colors hover:bg-white/5 hover:text-white/70"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex min-h-0 flex-1">
        {/* Left: Source Panel */}
        <div className="flex w-1/2 flex-col border-r border-white/[0.06]">
          <div className="shrink-0 px-4 pt-4 pb-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter notes…"
                className="h-8 w-full rounded-md border border-white/[0.08] bg-white/[0.03] pl-8 pr-3 text-2xs text-white/90 placeholder:text-white/30 focus:border-white/20 focus:outline-none"
              />
            </div>
            <p className="mt-2 text-2xs text-white/30">
              {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""} · {selectedIds.length} selected
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {filteredNotes.map((n) => {
              const isSelected = selectedIds.includes(n.id)
              return (
                <button
                  key={n.id}
                  onClick={() => toggleNote(n.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-all duration-100",
                    isSelected
                      ? "bg-accent/10 ring-1 ring-accent/25"
                      : "hover:bg-white/[0.04]",
                  )}
                >
                  {/* Checkbox */}
                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      isSelected
                        ? "border-accent bg-accent"
                        : "border-white/20",
                    )}
                  >
                    {isSelected && <Check size={10} className="text-white" />}
                  </div>

                  {/* Title */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-note font-medium text-white/85">{n.title || "Untitled"}</p>
                  </div>
                  {n.tags.length > 0 && (
                    <span className="shrink-0 text-2xs tabular-nums text-white/30">
                      {n.tags.length} tag{n.tags.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </button>
              )
            })}
            {filteredNotes.length === 0 && (
              <p className="py-8 text-center text-2xs text-white/25">No notes found</p>
            )}
          </div>
        </div>

        {/* Right: Selected Panel + Preview */}
        <div className="flex w-1/2 flex-col">
          {/* Selected notes */}
          <div className="shrink-0 border-b border-white/[0.06] px-4 pt-4 pb-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-note font-medium text-white/50 uppercase tracking-wider">Selected ({selectedIds.length})</h3>
              {selectedIds.length >= 2 && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-2xs text-accent transition-colors hover:bg-accent/10"
                >
                  {showPreview ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {showPreview ? "Hide Preview" : "Preview Merge"}
                </button>
              )}
            </div>

            {selectedNotes.length === 0 ? (
              <p className="py-6 text-center text-2xs text-white/20">
                Select notes from the left panel
              </p>
            ) : (
              <div className="max-h-[200px] space-y-1 overflow-y-auto">
                {selectedNotes.map((n, idx) => (
                  <div
                    key={n.id}
                    className="group flex items-center gap-2 rounded-md bg-white/[0.04] px-2.5 py-1.5"
                  >
                    <GripVertical size={12} className="shrink-0 cursor-grab text-white/20" />
                    <span className="text-2xs tabular-nums text-white/25 w-4 text-center">{idx + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-note text-white/80">{n.title || "Untitled"}</span>
                    {/* Move up/down */}
                    {idx > 0 && (
                      <button
                        onClick={() => moveSelected(idx, idx - 1)}
                        className="rounded p-0.5 text-white/20 opacity-0 transition-opacity hover:bg-white/5 hover:text-white/50 group-hover:opacity-100"
                        title="Move up"
                      >
                        <ChevronRight size={12} className="-rotate-90" />
                      </button>
                    )}
                    {idx < selectedNotes.length - 1 && (
                      <button
                        onClick={() => moveSelected(idx, idx + 1)}
                        className="rounded p-0.5 text-white/20 opacity-0 transition-opacity hover:bg-white/5 hover:text-white/50 group-hover:opacity-100"
                        title="Move down"
                      >
                        <ChevronRight size={12} className="rotate-90" />
                      </button>
                    )}
                    <button
                      onClick={() => removeSelected(n.id)}
                      className="rounded p-0.5 text-white/20 opacity-0 transition-opacity hover:bg-white/5 hover:text-destructive group-hover:opacity-100"
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Content Preview */}
          {showPreview && selectedNotes.length >= 2 && (
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <h3 className="mb-3 text-2xs font-medium text-white/50 uppercase tracking-wider">Content Preview</h3>
              {selectedNotes.map((n, nIdx) => (
                <div key={n.id} className="mb-4">
                  {/* Source header */}
                  <div className="mb-1.5 flex items-center gap-2">
                    <Layers size={12} className="text-accent/60" />
                    <span className="text-2xs font-medium text-accent/80">{n.title || "Untitled"}</span>
                  </div>
                  {/* Preview snippet */}
                  <div className="ml-1 border-l border-white/[0.06] pl-3">
                    <p className="whitespace-pre-wrap text-2xs leading-relaxed text-white/60">
                      {notePreviewText(n)}
                    </p>
                  </div>
                  {/* Separator */}
                  {nIdx < selectedNotes.length - 1 && (
                    <div className="my-3 border-t border-dashed border-white/[0.06]" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty state when no preview */}
          {!showPreview && selectedNotes.length >= 2 && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <FileText size={32} className="mx-auto mb-2 text-white/10" />
                <p className="text-2xs text-white/25">Click "Preview Merge" to see combined content</p>
              </div>
            </div>
          )}
          {selectedNotes.length < 2 && selectedNotes.length > 0 && (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-2xs text-white/25">Select at least 2 notes to merge</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer — merge controls */}
      {selectedIds.length >= 2 && (
        <div className="shrink-0 border-t border-white/[0.06] bg-white/[0.02] px-6 py-4">
          <div className="flex flex-wrap items-start gap-4">
            {/* Title */}
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-2xs text-white/40">Title</label>
              {mergeMode === "existing" ? (
                /* Merge into existing: title is locked to survivor */
                <div className="flex h-8 items-center rounded-md border border-white/[0.08] bg-white/[0.02] px-3 text-2xs text-white/50">
                  {survivorLabel}
                </div>
              ) : (
                /* New Note: direct input + picker */
                <div className="space-y-1">
                  <div ref={titleDropdownRef} className="relative flex gap-1">
                    <input
                      type="text"
                      value={mergeTitle}
                      onChange={(e) => setMergeTitle(e.target.value)}
                      placeholder="Enter note title…"
                      className="h-8 flex-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-3 text-2xs text-white/90 placeholder:text-white/30 focus:border-white/20 focus:outline-none"
                    />
                    <button
                      onClick={() => setTitleDropdownOpen(!titleDropdownOpen)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-white/40 hover:border-white/15 hover:text-white/60 transition-colors"
                      title="Pick from selected notes"
                    >
                      <ChevronUp size={12} />
                    </button>
                    {titleDropdownOpen && (
                      <div className="absolute left-0 bottom-full z-50 mb-1 w-full rounded-lg border border-white/[0.08] bg-popover py-1 shadow-xl">
                        {selectedNotes.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => { setMergeTitle(n.title || "Untitled"); setTitleDropdownOpen(false) }}
                            className={cn(
                              "flex w-full items-center px-3 py-1.5 text-2xs transition-colors",
                              mergeTitle === (n.title || "Untitled")
                                ? "bg-white/10 text-white/90"
                                : "text-white/60 hover:bg-white/5 hover:text-white/80"
                            )}
                          >
                            {n.title || "Untitled"}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mode */}
            <div>
              <label className="mb-1 block text-2xs text-white/40">Mode</label>
              <div className="flex gap-1 rounded-md bg-white/[0.04] p-0.5">
                <button
                  onClick={() => setMergeMode("existing")}
                  className={cn(
                    "rounded px-2.5 py-1 text-2xs font-medium transition-colors",
                    mergeMode === "existing"
                      ? "bg-white/10 text-white/90"
                      : "text-white/40 hover:text-white/60",
                  )}
                >
                  Merge into existing
                </button>
                <button
                  onClick={() => setMergeMode("new")}
                  className={cn(
                    "rounded px-2.5 py-1 text-2xs font-medium transition-colors",
                    mergeMode === "new"
                      ? "bg-white/10 text-white/90"
                      : "text-white/40 hover:text-white/60",
                  )}
                >
                  New Note
                </button>
              </div>
            </div>

            {/* Survivor (only for "existing" mode) */}
            {mergeMode === "existing" && (
              <div className="min-w-[160px]">
                <label className="mb-1 block text-2xs text-white/40">Survives</label>
                <div ref={survivorDropdownRef} className="relative">
                  <button
                    onClick={() => setSurvivorDropdownOpen(!survivorDropdownOpen)}
                    className="flex h-8 w-full items-center justify-between rounded-md border border-white/[0.08] bg-white/[0.03] px-3 text-2xs text-white/80 hover:border-white/15 transition-colors"
                  >
                    <span className="truncate">{survivorLabel}</span>
                    <ChevronUp size={12} className="ml-2 shrink-0 text-white/30" />
                  </button>
                  {survivorDropdownOpen && (
                    <div className="absolute left-0 bottom-full z-50 mb-1 w-full rounded-lg border border-white/[0.08] bg-popover py-1 shadow-xl">
                      {selectedNotes.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { setSurvivorId(n.id); setMergeTitle(n.title || "Untitled"); setSurvivorDropdownOpen(false) }}
                          className={cn(
                            "flex w-full items-center px-3 py-1.5 text-2xs transition-colors",
                            survivorId === n.id
                              ? "bg-white/10 text-white/90"
                              : "text-white/60 hover:bg-white/5 hover:text-white/80"
                          )}
                        >
                          {n.title || "Untitled"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags (note analog of wiki categories) */}
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-2xs text-white/40">Tags</label>
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-2xs text-accent"
                  >
                    {tag}
                    <button onClick={() => setTags((prev) => prev.filter((c) => c !== tag))} className="hover:text-accent/60">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {/* Custom tag dropdown */}
                <div ref={tagDropdownRef} className="relative">
                  <button
                    onClick={() => { setTagDropdownOpen(!tagDropdownOpen); setShowNewTagInput(false); setNewTagInputValue("") }}
                    className="flex h-6 items-center gap-1 rounded border border-white/[0.08] bg-white/[0.03] px-1.5 text-2xs text-white/50 hover:border-white/15 hover:text-white/70 transition-colors"
                  >
                    <Plus size={10} />
                    Add
                  </button>
                  {tagDropdownOpen && (
                    <div className="absolute left-0 bottom-full z-50 mb-1 min-w-[160px] rounded-lg border border-white/[0.08] bg-popover py-1 shadow-xl">
                      {showNewTagInput ? (
                        <div className="px-2 py-1">
                          <input
                            ref={newTagInputRef}
                            type="text"
                            value={newTagInputValue}
                            onChange={(e) => setNewTagInputValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") confirmNewTag()
                              if (e.key === "Escape") { setShowNewTagInput(false); setNewTagInputValue("") }
                            }}
                            placeholder="Tag name…"
                            className="h-7 w-full rounded border border-white/[0.12] bg-white/[0.06] px-2 text-2xs text-white/90 placeholder:text-white/30 focus:border-white/20 focus:outline-none"
                          />
                          <div className="mt-1 flex gap-1">
                            <button
                              onClick={confirmNewTag}
                              className="flex-1 rounded bg-white/[0.08] py-1 text-2xs text-white/70 hover:bg-white/[0.12] transition-colors"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => { setShowNewTagInput(false); setNewTagInputValue("") }}
                              className="flex-1 rounded py-1 text-2xs text-white/40 hover:bg-white/5 transition-colors"
                            >
                              {t("common.cancel")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {allTagNames.filter((c) => !tags.includes(c)).length === 0 && (
                            <p className="px-3 py-1.5 text-2xs text-white/25">No existing tags</p>
                          )}
                          {allTagNames
                            .filter((c) => !tags.includes(c))
                            .map((c) => (
                              <button
                                key={c}
                                onClick={() => { setTags((prev) => [...prev, c]); setTagDropdownOpen(false) }}
                                className="flex w-full items-center px-3 py-1.5 text-2xs text-white/60 transition-colors hover:bg-white/5 hover:text-white/80"
                              >
                                {c}
                              </button>
                            ))
                          }
                          {allTagNames.filter((c) => !tags.includes(c)).length > 0 && (
                            <div className="my-1 border-t border-white/[0.06]" />
                          )}
                          <button
                            onClick={() => setShowNewTagInput(true)}
                            className="flex w-full items-center gap-1.5 px-3 py-1.5 text-2xs text-white/40 transition-colors hover:bg-white/5 hover:text-white/60"
                          >
                            <Plus size={10} />
                            New tag…
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleMerge}
              disabled={mergeDisabled}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-1.5 text-2xs font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <GitMerge size={14} />
              Merge {selectedIds.length} Notes
            </button>
            <button
              onClick={() => setNoteViewMode("default")}
              className="rounded-md px-3 py-1.5 text-2xs text-white/50 transition-colors hover:bg-white/5 hover:text-white/70"
            >
              {t("common.cancel")}
            </button>
            <p className="text-2xs text-white/30">
              {mergeMode === "existing"
                ? `${selectedIds.length - 1} note${selectedIds.length - 1 > 1 ? "s" : ""} will be absorbed into "${survivorLabel}"`
                : `All ${selectedIds.length} notes will be combined into a new note`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
