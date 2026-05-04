"use client"

/**
 * folder-picker.tsx — Kind-aware folder picker (PR folder-b + PR folder-c).
 *
 * Single source of truth for folder selection UX. v107 (PR a) introduced
 * `Folder.kind = "note" | "wiki"` and forced membership to be type-strict
 * (a folder accepts notes XOR wikis, never both). PR (b) wired the kind
 * filter into every picker site. PR (c) adds the multi-select mode that
 * exposes the N:M model to the user.
 *
 * Design:
 *   - We DO NOT own the container (Popover / ContextMenuSub / inline
 *     expand). Each call site has different surrounding chrome — keeping
 *     the container at the call site means we don't fight Radix's portal
 *     semantics. This component renders the *content* only.
 *   - `kind` drives the filter — only folders matching the kind appear.
 *     Cross-kind folders are physically impossible to select.
 *   - `selectMode="single"` (default) replaces the whole folderIds set
 *     with `[chosen]` or `[]` (No folder). One click commits + closes.
 *   - `selectMode="multi"` (PR c) renders rows with checkboxes that
 *     toggle individual memberships in a local pending set. Caller
 *     supplies `onApply(folderIds)` instead of `onSelect`. No "No folder"
 *     row in multi-mode (uncheck everything = empty set). An Apply
 *     footer commits the diff. This matches the N:M wire-protocol of
 *     `setNoteFolders` / `setWikiFolders` (full set replacement).
 *   - `inlineCreate` exposes a "+ New folder…" row that creates with the
 *     correct kind and immediately selects the new folder (single mode)
 *     or pre-checks it (multi mode). Default on.
 *
 * Visual variants:
 *   - `variant="popover"` (default) — flat button rows for Popover content.
 *   - `variant="submenu"` — same content with submenu-friendly text size.
 *
 * Not handled here (intentional):
 *   - Container chrome (caller wraps).
 *   - Search filter — folder lists in Plot are short by design (auto-collapse
 *     after 30 days). Add a search row only if a single workspace ever hits
 *     >50 folders, which it can't today.
 *   - Right-click affordances on individual folder rows. Caller can layer
 *     those at the row level if needed.
 */

import { useState, useEffect } from "react"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { PRESET_COLORS, getEntityColor } from "@/lib/colors" // v109: opt-in color fallback

export type FolderPickerKind = "note" | "wiki"
export type FolderPickerSelectMode = "single" | "multi"
export type FolderPickerVariant = "popover" | "submenu"

export interface FolderPickerProps {
  /** Filter: folders with this kind are the only ones shown / creatable. */
  kind: FolderPickerKind
  /** Current membership — used for the checkmark + (multi) initial toggle. */
  currentFolderIds: string[]
  /**
   * Single-mode: receives the chosen id, or null for "No folder".
   * Required when `selectMode="single"` (default). Ignored in multi-mode.
   */
  onSelect?: (folderId: string | null) => void
  /**
   * Multi-mode: receives the full new folder-id set on Apply. Empty array
   * means "no folder". Required when `selectMode="multi"`. Ignored in
   * single mode.
   */
  onApply?: (folderIds: string[]) => void
  /** Hide the "No folder" row. Forced off in multi-mode. */
  showNoFolder?: boolean
  /** Hide the inline "+ New folder" creator. Default: shown. */
  inlineCreate?: boolean
  /** "single" (default) replaces set; "multi" toggles + Apply commits. */
  selectMode?: FolderPickerSelectMode
  /** Visual density. Submenu sites use slightly smaller text. */
  variant?: FolderPickerVariant
}

/**
 * Renders ONLY the inner item list — caller wraps with PopoverContent /
 * ContextMenuSubContent / inline div. This keeps each call site in charge
 * of portal/positioning, while the visible UX (rows, kind filter, inline
 * create, multi-toggle) stays consistent.
 */
export function FolderPicker({
  kind,
  currentFolderIds,
  onSelect,
  onApply,
  showNoFolder = true,
  inlineCreate = true,
  selectMode = "single",
  variant = "popover",
}: FolderPickerProps) {
  const folders = usePlotStore((s) => s.folders)
  const createFolder = usePlotStore((s) => s.createFolder)

  // Type-strict filter (the whole point of PR b).
  const matching = folders.filter((f) => f.kind === kind)

  const sizeRow = variant === "submenu"
    ? "px-2.5 py-1.5 text-2xs"
    : "px-2.5 py-1.5 text-note"
  const sizeNoFolder = variant === "submenu"
    ? "px-2.5 py-1.5 text-2xs"
    : "px-2.5 py-1.5 text-note"
  const sizeCreate = variant === "submenu"
    ? "px-2.5 py-1.5 text-2xs"
    : "px-2.5 py-1.5 text-note"

  // ── Single-mode (legacy + default) ─────────────────────────────────
  // One click on a folder row commits + closes via onSelect. The "No
  // folder" row is the explicit reset. PR (c) preserves this contract
  // for every call site that didn't opt into multi.
  if (selectMode === "single") {
    const isSelected = (id: string) => currentFolderIds.includes(id)
    const noneSelected = currentFolderIds.length === 0

    const handleCreateSingle = () => {
      const name = window.prompt("New folder name:")?.trim()
      if (!name) return
      // v109: opt-in color — new folders start uncolored (neutral gray).
      // Users assign a color via "Set color..." in the sidebar context menu.
      const newId = createFolder(name, kind)
      onSelect?.(newId)
    }

    return (
      <div className="flex flex-col gap-px">
        {showNoFolder && (
          <button
            type="button"
            onClick={() => onSelect?.(null)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md transition-colors hover:bg-hover-bg",
              sizeNoFolder,
              noneSelected ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            <span className="shrink-0 w-2.5">{noneSelected && <PhCheck size={10} weight="bold" className="text-accent" />}</span>
            <span className="flex-1 text-left">No folder</span>
          </button>
        )}
        {showNoFolder && matching.length > 0 && (
          <div className="my-1 border-t border-border-subtle" />
        )}
        {matching.length === 0 && !inlineCreate && (
          <div className={cn(
            "flex w-full items-center gap-2 text-muted-foreground/70 italic",
            sizeRow
          )}>
            {kind === "wiki" ? "No wiki folders yet" : "No note folders yet"}
          </div>
        )}
        {matching.map((f) => {
          const selected = isSelected(f.id)
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelect?.(f.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md transition-colors hover:bg-hover-bg",
                sizeRow,
                selected ? "text-foreground font-medium" : "text-foreground/80"
              )}
              title={f.name}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: getEntityColor(f.color) }}
              />
              <span className="flex-1 text-left truncate">{f.name}</span>
              {selected && <PhCheck size={12} weight="bold" className="text-accent shrink-0" />}
            </button>
          )
        })}
        {inlineCreate && (
          <>
            {matching.length > 0 && <div className="my-1 border-t border-border-subtle" />}
            <button
              type="button"
              onClick={handleCreateSingle}
              className={cn(
                "flex w-full items-center gap-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors",
                sizeCreate
              )}
            >
              <PhPlus size={12} weight="bold" />
              <span>New {kind === "wiki" ? "wiki" : "note"} folder…</span>
            </button>
          </>
        )}
      </div>
    )
  }

  // ── Multi-mode (PR c) ──────────────────────────────────────────────
  // Render the pending set as a local state (initialized from current
  // membership). Toggling a row mutates the pending set; "Apply" commits
  // the new set wholesale via onApply. Cancel / outside-click reverts.
  // No "No folder" row — clearing all checkboxes already encodes that.
  return (
    <FolderPickerMulti
      kind={kind}
      matching={matching}
      currentFolderIds={currentFolderIds}
      onApply={onApply}
      inlineCreate={inlineCreate}
      sizeRow={sizeRow}
      sizeCreate={sizeCreate}
    />
  )
}

/**
 * Multi-select branch — extracted so we can keep the local pending-set
 * useState scoped (single-mode is stateless and shouldn't pay for a
 * hook). The pending set syncs back to currentFolderIds when the parent
 * remounts the picker (e.g. user closes + reopens the popover) via the
 * useEffect dep on currentFolderIds.length / id signature.
 */
function FolderPickerMulti({
  kind,
  matching,
  currentFolderIds,
  onApply,
  inlineCreate,
  sizeRow,
  sizeCreate,
}: {
  kind: FolderPickerKind
  matching: ReturnType<typeof useFolderPickerData>["folders"]
  currentFolderIds: string[]
  onApply?: (folderIds: string[]) => void
  inlineCreate: boolean
  sizeRow: string
  sizeCreate: string
}) {
  const createFolder = usePlotStore((s) => s.createFolder)

  // Pending set — what the user is about to commit. Initialised from
  // currentFolderIds and resynced if the prop changes (e.g. parent reopened
  // the picker on a different note). We use a Set for O(1) toggle but
  // always emit a sorted-by-folder-order array so the wire-protocol matches
  // what the matching folders order would naturally produce.
  const [pending, setPending] = useState<Set<string>>(
    () => new Set(currentFolderIds),
  )
  // Resync on signature change. We compare by joined string so equal-set
  // re-renders don't reset pending edits the user is mid-flight.
  const signature = currentFolderIds.slice().sort().join(",")
  useEffect(() => {
    setPending(new Set(currentFolderIds))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  const toggle = (id: string) => {
    setPending((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCreateMulti = () => {
    const name = window.prompt("New folder name:")?.trim()
    if (!name) return
    // v109: opt-in color (see handleCreateSingle).
    const newId = createFolder(name, kind)
    // Newly created folder is pre-checked — most users create-then-apply.
    setPending((prev) => {
      const next = new Set(prev)
      next.add(newId)
      return next
    })
  }

  const apply = () => {
    if (!onApply) return
    // Order: preserve `matching` folder order (sidebar order) so the chip
    // strip in the detail panel matches the sidebar visual sort.
    const ordered = matching
      .map((f) => f.id)
      .filter((fid) => pending.has(fid))
    onApply(ordered)
  }

  // Diff hint — if pending differs from current, surface a subtle dirty
  // indicator on the Apply button so users know there's something to commit.
  const currentSet = new Set(currentFolderIds)
  const dirty =
    pending.size !== currentSet.size ||
    Array.from(pending).some((id) => !currentSet.has(id))

  return (
    <div className="flex flex-col gap-px">
      {matching.length === 0 && !inlineCreate && (
        <div className={cn(
          "flex w-full items-center gap-2 text-muted-foreground/70 italic",
          sizeRow
        )}>
          {kind === "wiki" ? "No wiki folders yet" : "No note folders yet"}
        </div>
      )}
      {matching.map((f) => {
        const checked = pending.has(f.id)
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => toggle(f.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md transition-colors hover:bg-hover-bg",
              sizeRow,
              checked ? "text-foreground font-medium" : "text-foreground/80"
            )}
            title={f.name}
          >
            {/* Checkbox — square, accent-tinted when checked. Inline SVG so
                we don't pay for a Radix checkbox just for visual parity. */}
            <span
              className={cn(
                "shrink-0 flex items-center justify-center h-3.5 w-3.5 rounded-sm border transition-colors",
                checked
                  ? "bg-accent border-accent text-accent-foreground"
                  : "border-border bg-card",
              )}
            >
              {checked && <PhCheck size={10} weight="bold" />}
            </span>
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: getEntityColor(f.color) }}
            />
            <span className="flex-1 text-left truncate">{f.name}</span>
          </button>
        )
      })}
      {inlineCreate && (
        <>
          {matching.length > 0 && <div className="my-1 border-t border-border-subtle" />}
          <button
            type="button"
            onClick={handleCreateMulti}
            className={cn(
              "flex w-full items-center gap-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors",
              sizeCreate
            )}
          >
            <PhPlus size={12} weight="bold" />
            <span>New {kind === "wiki" ? "wiki" : "note"} folder…</span>
          </button>
        </>
      )}
      {/* Apply footer — separates the action from the togglable list so
          accidentally toggling near the bottom doesn't apply prematurely.
          Rendered even when there are no folders so users can clear an
          existing membership via this picker (rare but possible). */}
      <div className="my-1 border-t border-border-subtle" />
      <div className="flex items-center justify-between px-2 pt-1">
        <span className="text-2xs text-muted-foreground">
          {pending.size === 0 ? "No folders" : `${pending.size} selected`}
        </span>
        <button
          type="button"
          onClick={apply}
          disabled={!dirty}
          className={cn(
            "rounded-md px-2 py-1 text-2xs font-medium transition-colors",
            dirty
              ? "bg-accent text-accent-foreground hover:bg-accent/80"
              : "text-muted-foreground/50 cursor-not-allowed",
          )}
        >
          Apply
        </button>
      </div>
    </div>
  )
}

/**
 * Hook variant — exposes the filtered folder list and the create handler
 * so a caller (notably the ContextMenu submenu in notes-table) can render
 * its own ContextMenuItems while still going through the kind filter +
 * shared create logic. This preserves native menu keyboard nav inside
 * Radix ContextMenu, which the button-based <FolderPicker> would lose.
 */
export function useFolderPickerData(kind: FolderPickerKind) {
  const folders = usePlotStore((s) => s.folders)
  const createFolder = usePlotStore((s) => s.createFolder)
  const matching = folders.filter((f) => f.kind === kind)

  const createFolderInline = (afterCreate: (newId: string) => void) => {
    const name = window.prompt("New folder name:")?.trim()
    if (!name) return
    // v109: opt-in color (see handleCreateSingle).
    const newId = createFolder(name, kind)
    afterCreate(newId)
  }

  return { folders: matching, createFolderInline }
}

/**
 * Inline-expand variant for sites where opening a nested Popover would
 * create portal collisions (e.g. the wiki-list row's right-click menu).
 * This wraps the FolderPicker content in a click-to-toggle row that
 * reveals a scrollable list inline — same content, container provided.
 *
 * Used by `wiki-list.tsx`'s row-level "Move to folder" submenu.
 *
 * Supports both selectMode="single" (default) and "multi" (PR c) — multi
 * mode shows a count summary instead of the first folder name in the
 * trigger row, matching the multi-select semantics.
 */
export function FolderPickerInlineSubmenu({
  kind,
  currentFolderIds,
  onSelect,
  onApply,
  selectMode = "single",
  triggerLabel = "Move to folder",
  triggerIcon,
}: {
  kind: FolderPickerKind
  currentFolderIds: string[]
  onSelect?: (folderId: string | null) => void
  onApply?: (folderIds: string[]) => void
  selectMode?: FolderPickerSelectMode
  triggerLabel?: string
  triggerIcon?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const folders = usePlotStore((s) => s.folders)
  const matching = folders.filter((f) => f.kind === kind)

  // Trigger summary: in single mode show the active folder name; in multi
  // show "n folders" so users see the membership cardinality at a glance.
  let triggerSummary: string
  if (selectMode === "multi") {
    triggerSummary = currentFolderIds.length === 0
      ? "—"
      : currentFolderIds.length === 1
        ? matching.find((f) => f.id === currentFolderIds[0])?.name ?? "1 folder"
        : `${currentFolderIds.length} folders`
  } else {
    triggerSummary = currentFolderIds[0]
      ? matching.find((f) => f.id === currentFolderIds[0])?.name ?? "Unknown"
      : "—"
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
      >
        {triggerIcon}
        <span className="flex-1 text-left">{triggerLabel}</span>
        <span className="text-2xs text-muted-foreground truncate max-w-[80px]">
          {triggerSummary}
        </span>
        <span className={cn("transition-transform text-muted-foreground text-xs", open && "rotate-90")}>›</span>
      </button>
      {open && (
        <div className="ml-4 mt-0.5 mb-1 max-h-[240px] overflow-y-auto">
          <FolderPicker
            kind={kind}
            currentFolderIds={currentFolderIds}
            selectMode={selectMode}
            variant="submenu"
            onSelect={(id) => {
              setOpen(false)
              onSelect?.(id)
            }}
            onApply={(ids) => {
              setOpen(false)
              onApply?.(ids)
            }}
          />
        </div>
      )}
    </div>
  )
}
