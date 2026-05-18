"use client"

/**
 * Hatnote edit dialog (PR-E1).
 *
 * Add or edit a single Hatnote on a WikiArticle. Wikipedia/나무위키 style —
 * 5 types: "above"(상위 문서) / "below"(하위 문서) / "distinguish"(다른 뜻) /
 * "main"(주 문서) / "see-also"(같이 보기). Free-form text + optional target
 * article link (uses WikiPickerDialog). Empty text is rejected (no-op);
 * Enter submits.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WikiPickerDialog } from "@/components/wiki-picker-dialog"
import { usePlotStore } from "@/lib/store"
import type { Hatnote, HatnoteType } from "@/lib/types"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { BookOpen as PhBookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"

interface HatnoteEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Owning article (excluded from the target picker to prevent self-reference). */
  articleId: string
  /** Existing hatnote in edit mode; undefined/null in add mode. */
  existing?: Hatnote | null
  onSave: (hatnote: Hatnote) => void
}

const TYPE_OPTIONS: { value: HatnoteType; label: string; description: string }[] = [
  { value: "main",        label: "Main article",        description: "Points to the primary article on this topic." },
  { value: "see-also",    label: "See also",            description: "Suggests a related article worth visiting." },
  { value: "distinguish", label: "Not to be confused",  description: "Disambiguates from a similarly-named article." },
  { value: "above",       label: "Part of",             description: "Names the parent/super-topic this article belongs to." },
  { value: "below",       label: "Subtopics",           description: "Lists narrower topics covered separately." },
]

function genHatnoteId(): string {
  return `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function HatnoteEditDialog({
  open,
  onOpenChange,
  articleId,
  existing,
  onSave,
}: HatnoteEditDialogProps) {
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const [type, setType] = useState<HatnoteType>("main")
  const [text, setText] = useState("")
  const [targetArticleId, setTargetArticleId] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const textInputRef = useRef<HTMLInputElement>(null)

  // Reset form whenever the dialog opens — seed from `existing` for edit mode,
  // or defaults for add mode.
  useEffect(() => {
    if (open) {
      setType(existing?.type ?? "main")
      setText(existing?.text ?? "")
      setTargetArticleId(existing?.targetArticleId ?? null)
      setTimeout(() => textInputRef.current?.focus(), 30)
    }
  }, [open, existing])

  const targetTitle = targetArticleId
    ? wikiArticles.find((a) => a.id === targetArticleId)?.title ?? null
    : null

  const trimmedText = text.trim()
  const canSubmit = trimmedText.length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onSave({
      id: existing?.id ?? genHatnoteId(),
      type,
      text: trimmedText,
      targetArticleId: targetArticleId ?? null,
    })
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{existing ? "Edit hatnote" : "Add hatnote"}</DialogTitle>
            <DialogDescription>
              Small italic notice at the top of the article (Wikipedia style).
              Optionally links to another article.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Type
              </label>
              <Select value={type} onValueChange={(v) => setType(v as HatnoteType)}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="text-sm">{opt.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {TYPE_OPTIONS.find((o) => o.value === type)?.description}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Text <span className="text-destructive">*</span>
              </label>
              <input
                ref={textInputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit()
                }}
                placeholder="e.g., 'Albert Einstein'"
                className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Target article <span className="text-muted-foreground/60">(optional)</span>
              </label>
              {targetArticleId && targetTitle ? (
                <div className="mt-1 flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
                  <PhBookOpen size={14} className="shrink-0 text-teal-500/70" />
                  <span className="flex-1 truncate text-sm text-foreground">{targetTitle}</span>
                  <button
                    type="button"
                    onClick={() => setTargetArticleId(null)}
                    className="shrink-0 rounded-sm p-0.5 text-muted-foreground/70 transition-colors hover:bg-hover-bg hover:text-foreground"
                    aria-label="Clear target article"
                  >
                    <PhX size={12} />
                  </button>
                </div>
              ) : targetArticleId && !targetTitle ? (
                <div className="mt-1 flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
                  <span className="flex-1 truncate text-sm text-muted-foreground italic">
                    (article not found)
                  </span>
                  <button
                    type="button"
                    onClick={() => setTargetArticleId(null)}
                    className="shrink-0 rounded-sm p-0.5 text-muted-foreground/70 transition-colors hover:bg-hover-bg hover:text-foreground"
                    aria-label="Clear target article"
                  >
                    <PhX size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  className="mt-1 w-full rounded-md border border-dashed border-border bg-background px-2.5 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
                >
                  + Link to wiki article…
                </button>
              )}
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-hover-bg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {existing ? "Save" : "Add hatnote"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WikiPickerDialog
        open={showPicker}
        onOpenChange={setShowPicker}
        title="Select target article"
        excludeIds={[articleId]}
        onSelect={(id) => {
          setTargetArticleId(id)
          setShowPicker(false)
        }}
      />
    </>
  )
}
