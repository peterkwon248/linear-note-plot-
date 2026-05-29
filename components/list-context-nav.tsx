"use client"

/**
 * ListContextNav — Linear-style "list peek" navigator (sibling of
 * BookContextNav). Rendered in the editor header when the current entity was
 * opened from a list/board/grid screen and no book context is active.
 *
 *   ‹ {label} ⌄   N / M   [progress]   ‹ ›
 *
 * The label is a dropdown trigger (TOC parity with BookContextNav): it opens
 * the frozen list's items so the user can jump to any of them, with a
 * "Back to {label}" footer to return to the list screen. When the list was
 * grouped (status/folder/…) the dropdown renders section headers per group;
 * otherwise a flat list. With no items it degrades to a plain back link.
 *
 * Pane-aware via the parent: the mount site (note-editor / WikiView) reads its
 * pane's listNavContext through useListContextNav and supplies items + groups
 * + prev/next/back/jump handlers. Presentational only.
 *
 * Spec: docs/01-plan/features/list-context-navigation.plan.md §4.
 */

import {
  ChevronLeft as CaretLeft,
  ChevronRight as CaretRight,
  ChevronDown as CaretDown,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusShapeIcon } from "@/components/status-icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ListNavItem, ListNavGroup } from "@/hooks/use-list-context-nav"

interface ListContextNavProps {
  /** Screen label ("All Notes" / "Backlog" / folder name / view name …). */
  label: string
  /** 0-based index of the open entity within the frozen list. */
  index: number
  /** Total entities in the frozen list. */
  total: number
  /** Frozen-order items for the TOC dropdown (flat). */
  items?: ListNavItem[] | null
  /** Grouped sections for the dropdown (when opened from a grouped list). */
  groups?: ListNavGroup[] | null
  onPrev: () => void
  onNext: () => void
  /** Return to the originating list screen. */
  onBack: () => void
  /** Jump to a specific frozen index (TOC dropdown). Required for the dropdown to render. */
  onJumpTo?: (index: number) => void
}

export function ListContextNav({
  label,
  index,
  total,
  items,
  groups,
  onPrev,
  onNext,
  onBack,
  onJumpTo,
}: ListContextNavProps) {
  // Render-time guard (caller also gates on active !== null).
  if (total === 0 || index < 0) return null

  const canPrev = index > 0
  const canNext = index < total - 1
  const grouped = !!groups && groups.length > 0
  const tocAvailable = !!onJumpTo && (grouped || (!!items && items.length > 0))

  const renderItem = (item: ListNavItem) => {
    const isActive = item.index === index
    return (
      <DropdownMenuItem
        key={item.id}
        onClick={() => onJumpTo!(item.index)}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 text-note cursor-pointer",
          isActive && "bg-accent/10 text-accent",
        )}
      >
        <span className="flex h-4 w-5 shrink-0 items-center justify-center text-2xs tabular-nums text-muted-foreground/60">
          {isActive ? <Check size={11} strokeWidth={2.5} className="text-accent" /> : item.index + 1}
        </span>
        {item.status && <StatusShapeIcon status={item.status} size={13} />}
        <span className="flex-1 truncate">{item.title}</span>
      </DropdownMenuItem>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      {tocAvailable ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group flex items-center gap-1 rounded-md px-1 py-0.5 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
              title={`${label} — open list`}
              aria-label="Open list"
            >
              <CaretLeft size={12} strokeWidth={2} className="text-muted-foreground/70 group-hover:text-foreground" />
              <span className="max-w-[160px] truncate font-medium">{label}</span>
              <CaretDown size={10} strokeWidth={2.5} className="text-muted-foreground/50 group-hover:text-foreground/70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 max-h-[60vh] overflow-y-auto">
            {grouped ? (
              groups!.map((g, gi) => (
                <div key={`${g.label}-${gi}`}>
                  {gi > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-2xs text-muted-foreground">
                    {g.label}
                    <span className="ml-1 text-muted-foreground/60">· {g.items.length}</span>
                  </DropdownMenuLabel>
                  {g.items.map(renderItem)}
                </div>
              ))
            ) : (
              <>
                <DropdownMenuLabel className="text-2xs text-muted-foreground">
                  {label}
                  <span className="ml-1 text-muted-foreground/60">· {total} {total === 1 ? "item" : "items"}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {items!.map(renderItem)}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onBack}
              className="flex items-center gap-2 px-2 py-1.5 text-2xs text-muted-foreground cursor-pointer"
            >
              <CaretLeft size={11} strokeWidth={2} />
              Back to {label}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button
          type="button"
          onClick={onBack}
          className="group flex items-center gap-1 rounded-md px-1 py-0.5 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          title={`Back to ${label}`}
        >
          <CaretLeft size={12} strokeWidth={2} className="text-muted-foreground/70 group-hover:text-foreground" />
          <span className="max-w-[160px] truncate font-medium">{label}</span>
        </button>
      )}
      <span
        className="select-none text-2xs tabular-nums text-muted-foreground/70"
        title={`Item ${index + 1} of ${total} in this list`}
      >
        {index + 1} <span className="text-muted-foreground/40">/</span> {total}
      </span>
      {/* Mini progress bar — parity with BookContextNav. */}
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
