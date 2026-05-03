"use client"

/**
 * folder-picker.tsx — Kind-aware folder picker (PR folder-b).
 *
 * Single source of truth for "Move to folder" UX. v107 (PR a) introduced
 * `Folder.kind = "note" | "wiki"` and forced membership to be type-strict
 * (a folder accepts notes XOR wikis, never both). PR (b) wires that into
 * every picker site by sharing this component.
 *
 * Design:
 *   - We DO NOT own the container (Popover / ContextMenuSub / inline
 *     expand). Each call site has different surrounding chrome — keeping
 *     the container at the call site means we don't fight Radix's portal
 *     semantics. This component renders the *content* only.
 *   - `kind` drives the filter — only folders matching the kind appear.
 *     Cross-kind folders are physically impossible to select.
 *   - `selectMode` is "single" today; PR (c) flips selected sites to
 *     "multi" with checkbox semantics. The single-mode contract (overwrite
 *     entire folderIds set with [chosen] or [] for "No folder") matches
 *     PR (a)'s wire-protocol.
 *   - `inlineCreate` exposes a "+ New folder…" row that creates with the
 *     correct kind and immediately selects the new folder. Default on.
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

import { useState } from "react"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { PRESET_COLORS } from "@/lib/colors"

export type FolderPickerKind = "note" | "wiki"
export type FolderPickerSelectMode = "single" | "multi"
export type FolderPickerVariant = "popover" | "submenu"

export interface FolderPickerProps {
  /** Filter: folders with this kind are the only ones shown / creatable. */
  kind: FolderPickerKind
  /** Current membership — used for the checkmark + (PR c) multi-toggle. */
  currentFolderIds: string[]
  /** Single-mode: receives the chosen id, or null for "No folder". */
  onSelect: (folderId: string | null) => void
  /** Hide the "No folder" row (e.g. when caller has no semantic reset). */
  showNoFolder?: boolean
  /** Hide the inline "+ New folder" creator. Default: shown. */
  inlineCreate?: boolean
  /** "single" today; "multi" reserved for PR (c). */
  selectMode?: FolderPickerSelectMode
  /** Visual density. Submenu sites use slightly smaller text. */
  variant?: FolderPickerVariant
}

/**
 * Renders ONLY the inner item list — caller wraps with PopoverContent /
 * ContextMenuSubContent / inline div. This keeps each call site in charge
 * of portal/positioning, while the visible UX (rows, kind filter, inline
 * create) stays consistent.
 */
export function FolderPicker({
  kind,
  currentFolderIds,
  onSelect,
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

  const isSelected = (id: string) => currentFolderIds.includes(id)
  const noneSelected = currentFolderIds.length === 0

  const handleCreate = () => {
    const name = window.prompt("New folder name:")?.trim()
    if (!name) return
    // Distinguishable color across the existing folder set. PRESET_COLORS
    // (16-color palette in lib/colors.ts) is the canonical app palette;
    // local cycling palettes were the pre-PR (b) ad-hoc per call site.
    const color = PRESET_COLORS[matching.length % PRESET_COLORS.length]
    const newId = createFolder(name, kind, color)
    onSelect(newId)
  }

  return (
    <div className="flex flex-col gap-px">
      {showNoFolder && (
        <button
          type="button"
          onClick={() => onSelect(null)}
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
            onClick={() => onSelect(f.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md transition-colors hover:bg-hover-bg",
              sizeRow,
              selected ? "text-foreground font-medium" : "text-foreground/80"
            )}
            title={f.name}
          >
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: f.color }}
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
            onClick={handleCreate}
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
    const color = PRESET_COLORS[matching.length % PRESET_COLORS.length]
    const newId = createFolder(name, kind, color)
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
 */
export function FolderPickerInlineSubmenu({
  kind,
  currentFolderIds,
  onSelect,
  triggerLabel = "Move to folder",
  triggerIcon,
}: {
  kind: FolderPickerKind
  currentFolderIds: string[]
  onSelect: (folderId: string | null) => void
  triggerLabel?: string
  triggerIcon?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const folders = usePlotStore((s) => s.folders)
  const matching = folders.filter((f) => f.kind === kind)
  const currentName = currentFolderIds[0]
    ? matching.find((f) => f.id === currentFolderIds[0])?.name ?? "Unknown"
    : null

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
          {currentName ?? "—"}
        </span>
        <span className={cn("transition-transform text-muted-foreground text-xs", open && "rotate-90")}>›</span>
      </button>
      {open && (
        <div className="ml-4 mt-0.5 mb-1 max-h-[240px] overflow-y-auto">
          <FolderPicker
            kind={kind}
            currentFolderIds={currentFolderIds}
            onSelect={(id) => {
              setOpen(false)
              onSelect(id)
            }}
            variant="submenu"
          />
        </div>
      )}
    </div>
  )
}
