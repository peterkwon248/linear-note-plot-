"use client"

/**
 * Save as preset dialog (PR-D, Phase 4).
 *
 * Triggered from WikiInfobox's edit-mode footer ("Save as preset…"). Captures
 * a snapshot of the current infobox entries + header color and persists it as
 * a UserInfoboxPreset so the user can reuse the same layout on other articles
 * and notes (cross-entity).
 *
 * Empty label is rejected (no-op); enter key submits.
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
import type { WikiInfoboxEntry } from "@/lib/types"

interface SavePresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Snapshot of the current article's infobox at the moment the user clicked Save. */
  entries: WikiInfoboxEntry[]
  /** Current header color (rgba) — saved alongside the layout. */
  headerColor: string | null
  /** Called with `{ label, hint }` when the user confirms. Returns the new preset id. */
  onSave: (input: { label: string; hint?: string }) => void
}

export function SavePresetDialog({
  open,
  onOpenChange,
  entries,
  headerColor: _headerColor,
  onSave,
}: SavePresetDialogProps) {
  const [label, setLabel] = useState("")
  const [hint, setHint] = useState("")
  const labelInputRef = useRef<HTMLInputElement>(null)

  // Reset form whenever the dialog opens — prior values shouldn't leak across uses.
  useEffect(() => {
    if (open) {
      setLabel("")
      setHint("")
      // Defer focus until Radix mounts the content node.
      setTimeout(() => labelInputRef.current?.focus(), 30)
    }
  }, [open])

  // Field/group breakdown for the preview line.
  const fieldCount = entries.filter((e) => e.type !== "group-header" && e.type !== "section").length
  const groupCount = entries.filter((e) => e.type === "group-header").length

  const trimmedLabel = label.trim()
  const canSubmit = trimmedLabel.length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onSave({ label: trimmedLabel, hint: hint.trim() || undefined })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Save as preset</DialogTitle>
          <DialogDescription>
            현재 인포박스 레이아웃을 재사용 가능한 preset으로 저장합니다. 다른
            article 또는 note에서 dropdown의 &quot;My Presets&quot; 섹션에서
            선택할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              ref={labelInputRef}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit()
              }}
              placeholder="예: 내 인물 v2"
              className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Hint <span className="text-muted-foreground/60">(선택)</span>
            </label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit()
              }}
              placeholder="예: 한국 인물용 (시상 내역 포함)"
              className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="rounded-md border border-border-subtle bg-secondary/20 px-2.5 py-2 text-xs text-muted-foreground">
            저장될 내용: <span className="font-medium text-foreground">{fieldCount} fields</span>
            {groupCount > 0 && (
              <>
                {" + "}
                <span className="font-medium text-foreground">{groupCount} groups</span>
              </>
            )}
            {entries.length === 0 && <span>비어있음 — 최소 1개 field 권장</span>}
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-hover-bg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save preset
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
