"use client"

/**
 * SourcesSection — Smart Book sources management UI (Phase 5 / Phase A).
 *
 * Embedded in BookDetailPage between description and items list. Shows
 * current `book.smartSources` (Phase A: folder kind only) with add/remove
 * controls. Auto items appear in the main items list via `resolveBookItems`
 * (see `lib/books/resolver.ts`).
 *
 * Folder picker filters to `kind === "note"` per PRD §1 INVARIANT — wiki
 * folders aren't supported until Phase A.5.
 *
 * Spec: `.omc/plans/smart-book-prd.md` §5.5.
 */

import { useState, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Folder as PhFolder } from "@phosphor-icons/react/dist/ssr/Folder"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"

interface SourcesSectionProps {
  bookId: string
}

export function SourcesSection({ bookId }: SourcesSectionProps) {
  const books = usePlotStore((s) => s.books)
  const folders = usePlotStore((s) => s.folders)
  const notes = usePlotStore((s) => s.notes)
  const addSmartSource = usePlotStore((s) => s.addSmartSource)
  const removeSmartSource = usePlotStore((s) => s.removeSmartSource)

  const book = books.find((b) => b.id === bookId)
  const sources = book?.smartSources ?? []

  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Resolve source folders for display (skip stale refs)
  const resolvedSources = useMemo(() => {
    return sources
      .filter((s) => s.kind === "folder") // Phase A only
      .map((s) => {
        const folder = folders.find((f) => f.id === s.refId)
        return folder ? { source: s, folder } : null
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [sources, folders])

  // Folder picker candidates: kind="note" only (PRD §1 INVARIANT) +
  // not already added.
  const existingRefIds = useMemo(
    () => new Set(sources.filter((s) => s.kind === "folder").map((s) => s.refId)),
    [sources],
  )
  // Tweak C: candidates carry preview counts so users see what each source
  // will pull (and how much already exists in the book as manual).
  const manualNoteRefIds = useMemo(() => {
    return new Set(
      (book?.items ?? [])
        .filter((i): i is Extract<typeof i, { kind: "note" }> => i.kind === "note")
        .map((i) => i.refId),
    )
  }, [book])
  const candidates = useMemo(() => {
    const q = search.toLowerCase().trim()
    return folders
      .filter((f) => f.kind === "note" && !existingRefIds.has(f.id))
      .filter((f) => !q || f.name.toLowerCase().includes(q))
      .map((folder) => {
        const folderNotes = notes.filter(
          (n) => n.folderIds.includes(folder.id) && !n.trashed,
        )
        const inBook = folderNotes.filter((n) => manualNoteRefIds.has(n.id)).length
        return { folder, total: folderNotes.length, inBook }
      })
      .sort((a, b) => a.folder.name.localeCompare(b.folder.name))
  }, [folders, existingRefIds, search, notes, manualNoteRefIds])

  if (!book) return null

  const handleAdd = (folderId: string) => {
    const ok = addSmartSource(bookId, { kind: "folder", refId: folderId })
    if (ok) {
      const folderName = folders.find((f) => f.id === folderId)?.name ?? "folder"
      toast.success(`Added source: ${folderName}`)
    } else {
      toast("Already added", { duration: 1500 })
    }
    setSearch("")
    // Keep dialog open for multi-add — user closes manually
  }

  const handleRemove = (refId: string, name: string) => {
    removeSmartSource(bookId, "folder", refId)
    toast(`Removed source: ${name}`)
  }

  return (
    <div className="mb-6 rounded-md border border-border/40 bg-card/30">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Sparkle size={12} weight="regular" />
          Smart sources
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-medium text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          title="Add folder source"
        >
          <PhPlus size={12} weight="bold" />
          Add folder
        </button>
      </div>

      {/* Source list / empty state */}
      {resolvedSources.length === 0 ? (
        <div className="px-4 pb-3 pt-0 text-2xs text-muted-foreground/70">
          No sources yet. Auto-fill this book by adding a folder.
        </div>
      ) : (
        <ul className="divide-y divide-border/30 border-t border-border/30">
          {resolvedSources.map(({ source, folder }) => (
            <li
              key={`${source.kind}-${source.refId}`}
              className="group flex items-center gap-2 px-4 py-1.5 text-note transition-colors hover:bg-hover-bg/40"
            >
              <PhFolder size={14} weight="regular" className="text-muted-foreground" />
              <span className="flex-1 truncate text-foreground">{folder.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(source.refId, folder.name)}
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/50 opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                title={`Remove source: ${folder.name}`}
                aria-label={`Remove source: ${folder.name}`}
              >
                <PhX size={12} weight="regular" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Folder picker dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-md gap-0 p-0">
          <DialogHeader className="px-4 pb-2 pt-4">
            <DialogTitle className="text-sm">Add folder source</DialogTitle>
            <DialogDescription className="text-2xs">
              Notes from this folder will appear in the book automatically.
            </DialogDescription>
          </DialogHeader>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search folders..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-72">
              <CommandEmpty>No matching folders</CommandEmpty>
              <CommandGroup>
                {candidates.map(({ folder, total, inBook }) => {
                  const newCount = total - inBook
                  const hint =
                    total === 0
                      ? "empty"
                      : inBook === 0
                        ? `${total}`
                        : newCount === 0
                          ? `${total} all in book`
                          : `${newCount} new · ${inBook} in book`
                  return (
                    <CommandItem
                      key={folder.id}
                      value={folder.id}
                      onSelect={() => handleAdd(folder.id)}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <PhFolder size={14} weight="regular" className="text-muted-foreground" />
                      <span className="flex-1 truncate">{folder.name}</span>
                      <span className="text-2xs text-muted-foreground/60 tabular-nums">
                        {hint}
                      </span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  )
}
