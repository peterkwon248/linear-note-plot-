"use client"

/**
 * NoteContextMenuItems — DRY helper for the note row right-click menu.
 *
 * Extracted from notes-table.tsx ContextMenuContent body (2026-05-12) so that
 * three surfaces share an identical menu:
 *   - notes-table.tsx (list mode row)
 *   - notes-board.tsx (board card)
 *   - gallery-view-shell.tsx (gallery card via GalleryView renderContextMenu)
 *
 * Linear principle: same action set across surfaces — only presentation
 * (floating bar vs side panel, etc.) varies. Helper deliberately stays
 * "dumb": all side effects (store mutations, toasts, navigation) come in
 * via props so callers can swap behavior per-surface (e.g., board can wire
 * batch-aware variants if needed).
 *
 * NOT extracted into the helper (intentional):
 *   - `setSplitTargetNoteId` (note-split-mode singleton, fine to call
 *     directly from helper — same on every surface).
 *   - `usePlotStore.getState().openInSecondary` (also same everywhere).
 *   - `getSnoozeTime` & `getEntityColor` (pure utilities).
 */

import { type ReactNode } from "react"
import { usePlotStore } from "@/lib/store"
import type { Note, Folder } from "@/lib/types"
import {
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { FolderPicker } from "@/components/folder-picker"
import { getSnoozeTime, type SnoozePreset } from "@/lib/queries/notes"
import { getEntityColor } from "@/lib/colors"
import { setSplitTargetNoteId } from "@/lib/note-split-mode"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Alarm } from "@phosphor-icons/react/dist/ssr/Alarm"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight"
import { ArrowDownLeft } from "@phosphor-icons/react/dist/ssr/ArrowDownLeft"
import { Tray } from "@phosphor-icons/react/dist/ssr/Tray"
import { Bell } from "@phosphor-icons/react/dist/ssr/Bell"
import { Clock as PhClock } from "@phosphor-icons/react/dist/ssr/Clock"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { PushPinSlash } from "@phosphor-icons/react/dist/ssr/PushPinSlash"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { Scissors } from "@phosphor-icons/react/dist/ssr/Scissors"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { FolderOpen } from "@phosphor-icons/react/dist/ssr/FolderOpen"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { SplitHorizontal } from "@phosphor-icons/react/dist/ssr/SplitHorizontal"

export interface NoteContextMenuItemsProps {
  note: Note
  /** Filtered to kind="note" folders. Caller supplies via useFolderPickerData. */
  noteFolders: Folder[]
  /** Inline folder creation. Caller supplies via useFolderPickerData. */
  createFolderInline: (afterCreate: (newId: string) => void) => void

  /* Status-specific (stone) */
  onKeep: () => void
  onSnooze: (preset: SnoozePreset) => void
  onTrash: () => void

  /* Status-specific (brick) */
  onPromote: () => void
  onMoveBack: () => void

  /* Status-specific (keystone) */
  onDemote: () => void

  /* Common (every note) */
  onRemind: (isoDate: string) => void
  onTogglePin: () => void
  onOpen: () => void
  onMergeWith: () => void
  onLinkWith: () => void
  onShowConnected: (direction: "both" | "in" | "out") => void
  onSetFolder: (folderId: string) => void
  onSetFolders: (folderIds: string[]) => void
}

export function NoteContextMenuItems({
  note,
  noteFolders,
  createFolderInline,
  onKeep,
  onSnooze,
  onTrash,
  onPromote,
  onMoveBack,
  onDemote,
  onRemind,
  onTogglePin,
  onOpen,
  onMergeWith,
  onLinkWith,
  onShowConnected,
  onSetFolder,
  onSetFolders,
}: NoteContextMenuItemsProps): ReactNode {
  return (
    <>
      {/* Stone actions */}
      {note.status === "stone" && note.triageStatus !== "trashed" && (
        <>
          <ContextMenuItem onClick={onKeep} className="text-note">
            <PhCheck className="mr-2 text-accent" size={16} weight="bold" />
            Done
            <span className="ml-auto text-2xs text-muted-foreground">D</span>
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger className="text-note">
              <Alarm className="mr-2 text-muted-foreground" size={16} weight="regular" />
              Snooze
              <span className="ml-auto text-2xs text-muted-foreground">S</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-44">
              <ContextMenuItem onClick={() => onSnooze("3h")} className="text-note">
                3 hours
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onSnooze("tomorrow")} className="text-note">
                Tomorrow 10:00 AM
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onSnooze("3-days")} className="text-note">
                In 3 days
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onSnooze("next-week")} className="text-note">
                Next week 10:00 AM
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onSnooze("1-week")} className="text-note">
                In 1 week
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuItem onClick={onTrash} className="text-note text-destructive focus:text-destructive">
            <Trash className="mr-2" size={16} weight="regular" />
            Trash
            <span className="ml-auto text-2xs">T</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
        </>
      )}

      {/* Brick actions */}
      {note.status === "brick" && (
        <>
          <ContextMenuItem onClick={onPromote} className="text-note">
            <ArrowUpRight className="mr-2 text-chart-5" size={16} weight="regular" />
            Promote to Keystone
            <span className="ml-auto text-2xs text-muted-foreground">P</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={onMoveBack} className="text-note">
            <Tray className="mr-2 text-muted-foreground" size={16} weight="regular" />
            Back to Stone
            <span className="ml-auto text-2xs text-muted-foreground">B</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
        </>
      )}

      {/* Keystone actions */}
      {note.status === "keystone" && (
        <>
          <ContextMenuItem onClick={onDemote} className="text-note">
            <ArrowDownLeft className="mr-2 text-muted-foreground" size={16} weight="regular" />
            Demote to Brick
            <span className="ml-auto text-2xs text-muted-foreground">D</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
        </>
      )}

      {/* Remind me (all notes) */}
      <ContextMenuSub>
        <ContextMenuSubTrigger className="text-note">
          <Bell className="mr-2 text-muted-foreground" size={16} weight="regular" />
          Remind me
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-48">
          <ContextMenuItem onClick={() => onRemind(getSnoozeTime("3h"))} className="text-note">
            <PhClock className="mr-2 text-muted-foreground" size={16} weight="regular" />
            <span>Later today</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onRemind(getSnoozeTime("tomorrow"))} className="text-note">
            <PhClock className="mr-2 text-muted-foreground" size={16} weight="regular" />
            <span>Tomorrow</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onRemind(getSnoozeTime("3-days"))} className="text-note">
            <PhClock className="mr-2 text-muted-foreground" size={16} weight="regular" />
            <span>In 3 days</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onRemind(getSnoozeTime("next-week"))} className="text-note">
            <PhClock className="mr-2 text-muted-foreground" size={16} weight="regular" />
            <span>Next week</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onRemind(getSnoozeTime("1-week"))} className="text-note">
            <PhClock className="mr-2 text-muted-foreground" size={16} weight="regular" />
            <span>In 1 week</span>
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSeparator />

      {/* Pin/Unpin */}
      <ContextMenuItem onClick={onTogglePin} className="text-note">
        {note.pinned ? (
          <>
            <PushPinSlash className="mr-2 text-muted-foreground" size={16} weight="regular" />
            Unpin
          </>
        ) : (
          <>
            <PushPin className="mr-2 text-muted-foreground" size={16} weight="regular" />
            Pin to sidebar
          </>
        )}
      </ContextMenuItem>

      {/* Common actions */}
      <ContextMenuItem onClick={onOpen} className="text-note">
        <FileText className="mr-2 text-muted-foreground" size={16} weight="regular" />
        Open
      </ContextMenuItem>
      <ContextMenuItem onClick={onMergeWith} className="text-note">
        <GitMerge className="mr-2 text-muted-foreground" size={16} weight="regular" />
        GitMerge with...
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => setSplitTargetNoteId(note.id)}
        className="text-note"
      >
        <Scissors className="mr-2 text-muted-foreground" size={16} weight="regular" />
        Split this note...
      </ContextMenuItem>
      <ContextMenuItem onClick={onLinkWith} className="text-note">
        <PhLink className="mr-2 text-muted-foreground" size={16} weight="regular" />
        Link to...
      </ContextMenuItem>

      {/* Show connected */}
      <ContextMenuSub>
        <ContextMenuSubTrigger className="text-note">
          <PhLink className="mr-2 text-muted-foreground" size={16} weight="regular" />
          Show connected
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-44">
          <ContextMenuItem onClick={() => onShowConnected("both")} className="text-note">
            <span className="mr-2 text-muted-foreground">↔</span> Both directions
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onShowConnected("in")} className="text-note">
            <span className="mr-2 text-muted-foreground">←</span> Backlinks only
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onShowConnected("out")} className="text-note">
            <span className="mr-2 text-muted-foreground">→</span> Links out only
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>

      {/* Move to folder (single-replace) */}
      <ContextMenuSub>
        <ContextMenuSubTrigger className="text-note">
          <FolderOpen className="mr-2 text-muted-foreground" size={16} weight="regular" />
          Move to folder
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-48">
          <ContextMenuItem
            onClick={() => onSetFolder("")}
            className={`text-note ${note.folderIds.length === 0 ? "font-medium" : ""}`}
          >
            <span className="text-muted-foreground">No folder</span>
            {note.folderIds.length === 0 && <PhCheck className="ml-auto text-accent" size={14} weight="bold" />}
          </ContextMenuItem>
          {noteFolders.length > 0 && <ContextMenuSeparator />}
          {noteFolders.map((f) => (
            <ContextMenuItem
              key={f.id}
              onClick={() => onSetFolder(f.id)}
              className={`text-note ${note.folderIds.includes(f.id) ? "font-medium" : ""}`}
            >
              <span className="h-2 w-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: getEntityColor(f.color) }} />
              <span className="truncate">{f.name}</span>
              {note.folderIds.includes(f.id) && <PhCheck className="ml-auto text-accent shrink-0" size={14} weight="bold" />}
            </ContextMenuItem>
          ))}
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => createFolderInline((newId) => onSetFolder(newId))}
            className="text-note text-muted-foreground hover:text-foreground"
          >
            <PhPlus className="mr-2" size={14} weight="bold" />
            New folder…
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>

      {/* Add to folders… (multi-toggle) */}
      <ContextMenuSub>
        <ContextMenuSubTrigger className="text-note">
          <FolderOpen className="mr-2 text-muted-foreground" size={16} weight="regular" />
          Add to folders…
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-56 p-1">
          <FolderPicker
            kind="note"
            currentFolderIds={note.folderIds}
            selectMode="multi"
            onApply={(ids) => onSetFolders(ids)}
          />
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSeparator />
      <ContextMenuItem
        onClick={() => usePlotStore.getState().openInSecondary(note.id)}
        className="text-note"
      >
        <SplitHorizontal className="mr-2 text-muted-foreground" size={16} weight="regular" />
        Open in Split View
        <span className="ml-auto text-2xs text-muted-foreground">
          {typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "⌘\\" : "Ctrl+\\"}
        </span>
      </ContextMenuItem>
    </>
  )
}
