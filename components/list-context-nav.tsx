"use client"

/**
 * ListContextNav — Linear-style "list peek" navigator (sibling of
 * BookContextNav). Rendered in the editor header when the current entity was
 * opened from a list/board/grid screen and no book context is active.
 *
 *   ← {label}   N / M   ← →
 *
 * Pane-aware via the parent: the mount site (note-editor / WikiView) reads
 * its pane's listNavContext through useListContextNav and supplies the
 * prev/next/back handlers. This component is presentational only.
 *
 * Styling mirrors BookContextNav for visual parity in the header.
 *
 * Spec: docs/01-plan/features/list-context-navigation.plan.md §4.
 */

import { ChevronLeft as CaretLeft, ChevronRight as CaretRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ListContextNavProps {
  /** Screen label ("All Notes" / "Backlog" / folder name / view name …). */
  label: string
  /** 0-based index of the open entity within the frozen list. */
  index: number
  /** Total entities in the frozen list. */
  total: number
  onPrev: () => void
  onNext: () => void
  /** Return to the originating list screen. */
  onBack: () => void
}

export function ListContextNav({ label, index, total, onPrev, onNext, onBack }: ListContextNavProps) {
  // Render-time guard (caller also gates on active !== null).
  if (total === 0 || index < 0) return null

  const canPrev = index > 0
  const canNext = index < total - 1

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onBack}
        className="group flex items-center gap-1 rounded-md px-1 py-0.5 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
        title={`Back to ${label}`}
      >
        <CaretLeft size={12} strokeWidth={2} className="text-muted-foreground/70 group-hover:text-foreground" />
        <span className="max-w-[160px] truncate font-medium">{label}</span>
      </button>
      <span
        className="select-none text-2xs tabular-nums text-muted-foreground/70"
        title={`Item ${index + 1} of ${total} in this list`}
      >
        {index + 1} <span className="text-muted-foreground/40">/</span> {total}
      </span>
      {/* Mini progress bar — parity with BookContextNav. Inline ~36px track,
          2px accent fill. Hidden on mobile to spare header width. */}
      {total > 0 && (
        <div
          className="hidden h-1 w-9 shrink-0 overflow-hidden rounded-full bg-muted-foreground/15 md:block"
          title={`${Math.round(((index + 1) / total) * 100)}% 진행`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={index + 1}
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      )}
      <div className="flex items-center gap-px">
        <button
          type="button"
          onClick={canPrev ? onPrev : undefined}
          disabled={!canPrev}
          aria-label="Previous in list"
          title="Previous in list"
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded transition-colors",
            canPrev
              ? "text-muted-foreground hover:bg-hover-bg hover:text-foreground"
              : "cursor-not-allowed text-muted-foreground/30",
          )}
        >
          <CaretLeft size={12} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={canNext ? onNext : undefined}
          disabled={!canNext}
          aria-label="Next in list"
          title="Next in list"
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded transition-colors",
            canNext
              ? "text-muted-foreground hover:bg-hover-bg hover:text-foreground"
              : "cursor-not-allowed text-muted-foreground/30",
          )}
        >
          <CaretRight size={12} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
