"use client"

/**
 * Infobox Hero Image picker (PR-C, Phase 3).
 *
 * Triggered from WikiInfobox's hero slot ("+ Add hero image" or the edit
 * pencil on an existing hero). Captures URL + optional caption + alt text and
 * hands them back to the caller, which persists via `updateWikiArticle` /
 * `updateNote` / `updateWikiTemplate` (영구 룰 #69 — generic patch).
 *
 * Phase 1 = URL only (external image). Phase 2 (future) = file upload via the
 * attachment API; the dialog shape stays the same.
 *
 * Empty URL is rejected (no-op); Enter on URL field submits.
 */

import { useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { InfoboxHero } from "@/lib/types"

interface InfoboxHeroPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Existing hero (edit mode) or null (add mode). */
  initial: InfoboxHero | null
  onSave: (hero: InfoboxHero) => void
}

export function InfoboxHeroPicker({
  open,
  onOpenChange,
  initial,
  onSave,
}: InfoboxHeroPickerProps) {
  const [url, setUrl] = useState("")
  const [caption, setCaption] = useState("")
  const [alt, setAlt] = useState("")
  const urlInputRef = useRef<HTMLInputElement>(null)

  // Reset form whenever the dialog opens — seed from `initial` for edit mode,
  // or clear for add mode.
  useEffect(() => {
    if (open) {
      setUrl(initial?.url ?? "")
      setCaption(initial?.caption ?? "")
      setAlt(initial?.alt ?? "")
      setTimeout(() => urlInputRef.current?.focus(), 30)
    }
  }, [open, initial])

  const trimmedUrl = url.trim()
  const canSubmit = trimmedUrl.length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onSave({
      url: trimmedUrl,
      caption: caption.trim() || undefined,
      alt: alt.trim() || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit hero image" : "Add hero image"}</DialogTitle>
          <DialogDescription>
            Paste an image URL to display at the top of the infobox. Caption
            and alt text are optional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Image URL <span className="text-destructive">*</span>
            </label>
            <input
              ref={urlInputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit()
              }}
              placeholder="https://example.com/image.jpg"
              className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit()
              }}
              placeholder="e.g. Albert Einstein, 1921"
              className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Alt text
            </label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit()
              }}
              placeholder="Short description for screen readers"
              className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {trimmedUrl.length > 0 && (
            <div className="rounded-md border border-border-subtle bg-secondary/30 p-2">
              <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                Preview
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={trimmedUrl}
                alt={alt || caption || "Hero preview"}
                className="max-h-[160px] w-full object-contain rounded"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = "none"
                }}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-hover-bg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {initial ? "Save" : "Add image"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
