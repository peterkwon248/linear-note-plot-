"use client"

/**
 * FilePicker — modal dialog for choosing an existing Attachment to insert.
 *
 * file-entity-prd §4: makes reuse a first-class action. Without this picker
 * every "insert image" / "insert file" path creates a fresh upload (5 pastes
 * of the same image → 5 records + 5 blobs). The picker surfaces every File
 * record so the user can pick one and insert `attachment://<existing-id>`
 * directly — no new upload, no blob duplication.
 *
 * Pattern: mirrors WikiTemplatePicker (Dialog overlay + search + grid). The
 * PRD calls for a cmdk variant; that's an upgrade once the core flow lands.
 */

import { useEffect, useMemo, useState } from "react"
import { usePlotStore } from "@/lib/store"
import { useAttachmentUrl } from "@/lib/use-attachment-url"
import { X as PhX, Search as MagnifyingGlass, File as PhFile, Image as PhImage } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Attachment } from "@/lib/types"

interface FilePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Restrict which records are listed. "image" only shows image-typed
   *  records (insert-image flow), "file" only non-image, "all" shows both. */
  accept?: "image" | "file" | "all"
  /** Called when the user picks an attachment. The caller is responsible for
   *  inserting the `attachment://<id>` node into its editor. */
  onPick: (attachment: Attachment) => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(att: Attachment): boolean {
  return att.type === "image" || (att.mimeType?.startsWith("image/") ?? false)
}

/** Image grid tile — async thumbnail via useAttachmentUrl. Kept as its own
 *  component so each tile can hold its own resolved blob URL state without
 *  the parent rerendering when one thumbnail loads. */
function ImageTile({ att, onPick }: { att: Attachment; onPick: () => void }) {
  const { url, loading } = useAttachmentUrl(`attachment://${att.id}`)
  return (
    <button
      onClick={onPick}
      className="group flex flex-col gap-1.5 rounded-md border border-border bg-secondary/30 p-2 text-left transition-colors duration-100 hover:border-accent/60 hover:bg-hover-bg"
    >
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded bg-background">
        {loading ? (
          <PhImage size={20} strokeWidth={1.5} className="text-muted-foreground/40" />
        ) : url ? (
          <img src={url} alt={att.name} className="h-full w-full object-cover" />
        ) : (
          <PhImage size={20} strokeWidth={1.5} className="text-muted-foreground/40" />
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="truncate text-note text-foreground/85" title={att.name}>
          {att.name}
        </span>
        <span className="text-2xs text-muted-foreground/60 tabular-nums">
          {formatFileSize(att.size)}
        </span>
      </div>
    </button>
  )
}

function FileRow({ att, onPick }: { att: Attachment; onPick: () => void }) {
  return (
    <button
      onClick={onPick}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-note transition-colors duration-100 hover:bg-hover-bg"
    >
      <PhFile size={14} strokeWidth={2} className="shrink-0 text-muted-foreground/70" />
      <span className="min-w-0 flex-1 truncate text-foreground/85" title={att.name}>
        {att.name}
      </span>
      <span className="shrink-0 text-2xs text-muted-foreground/60 tabular-nums">
        {formatFileSize(att.size)}
      </span>
    </button>
  )
}

export function FilePicker({ open, onOpenChange, accept = "all", onPick }: FilePickerProps) {
  const attachments = usePlotStore((s) => s.attachments)
  const [search, setSearch] = useState("")

  // Active + accept-filtered + sorted by createdAt desc (most recent first).
  const filtered = useMemo(() => {
    const live = attachments.filter((a) => !a.trashed)
    const typed = live.filter((a) => {
      if (accept === "image") return isImage(a)
      if (accept === "file") return !isImage(a)
      return true
    })
    const q = search.trim().toLowerCase()
    const matched = q
      ? typed.filter((a) => a.name.toLowerCase().includes(q))
      : typed
    return [...matched].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
  }, [attachments, accept, search])

  const images = useMemo(() => filtered.filter(isImage), [filtered])
  const files = useMemo(() => filtered.filter((a) => !isImage(a)), [filtered])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onOpenChange])

  // Reset search on close so a fresh open starts empty.
  useEffect(() => {
    if (!open) setSearch("")
  }, [open])

  if (!open) return null

  const handlePick = (att: Attachment) => {
    onPick(att)
    onOpenChange(false)
  }

  const title =
    accept === "image" ? "Insert image from library"
      : accept === "file" ? "Insert file from library"
      : "Insert from library"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-150"
      onClick={() => onOpenChange(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-2xl max-h-[80vh] flex-col rounded-lg border border-border bg-card shadow-xl animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-ui font-semibold text-foreground">{title}</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors duration-100"
            aria-label="Close"
          >
            <PhX size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-border px-5 py-2.5">
          <div className="relative">
            <MagnifyingGlass
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={14}
              strokeWidth={2}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files…"
              autoFocus
              className="h-8 w-full rounded-md bg-secondary/40 pl-8 pr-3 text-note text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {filtered.length === 0 ? (
            <p className="text-center text-note text-muted-foreground/70 py-8">
              {search.trim() ? "No matching files" : "No files yet"}
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Images grid */}
              {images.length > 0 && (
                <section>
                  {accept === "all" && (
                    <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-muted-foreground/70">
                      Images · {images.length}
                    </p>
                  )}
                  <div
                    className={cn(
                      "grid gap-2",
                      "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
                    )}
                  >
                    {images.map((att) => (
                      <ImageTile key={att.id} att={att} onPick={() => handlePick(att)} />
                    ))}
                  </div>
                </section>
              )}

              {/* Files list */}
              {files.length > 0 && (
                <section>
                  {accept === "all" && (
                    <p className="mb-1 text-2xs font-medium uppercase tracking-wider text-muted-foreground/70">
                      Files · {files.length}
                    </p>
                  )}
                  <div className="flex flex-col">
                    {files.map((att) => (
                      <FileRow key={att.id} att={att} onPick={() => handlePick(att)} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
