"use client"

import { useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { usePlotStore } from "@/lib/store"
import { getSnoozeTime } from "@/lib/queries/notes"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { useSearch } from "@/lib/search/use-search"
import { shortRelative } from "@/lib/format-utils"
import { toast } from "sonner"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { Brain as PhBrain } from "@phosphor-icons/react/dist/ssr/Brain"
import { SkipForward } from "@phosphor-icons/react/dist/ssr/SkipForward"
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle"
import { Clock as PhClock } from "@phosphor-icons/react/dist/ssr/Clock"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { ArrowCircleUp } from "@phosphor-icons/react/dist/ssr/ArrowCircleUp"
import { ArrowCircleDown } from "@phosphor-icons/react/dist/ssr/ArrowCircleDown"
import { Tray } from "@phosphor-icons/react/dist/ssr/Tray"
import { Crosshair } from "@phosphor-icons/react/dist/ssr/Crosshair"
import { Terminal } from "@phosphor-icons/react/dist/ssr/Terminal"
import { Stack } from "@phosphor-icons/react/dist/ssr/Stack"
import { Shield as PhShield } from "@phosphor-icons/react/dist/ssr/Shield"
import { GearSix } from "@phosphor-icons/react/dist/ssr/GearSix"
import { Sun } from "@phosphor-icons/react/dist/ssr/Sun"
import { Moon } from "@phosphor-icons/react/dist/ssr/Moon"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import {
  setActiveRoute,
} from "@/lib/table-route"
function highlightQuery(text: string, q: string): ReactNode {
  if (!q.trim()) return text
  const lower = text.toLowerCase()
  const qLower = q.toLowerCase().trim()
  const idx = lower.indexOf(qLower)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/30 text-foreground rounded-sm">
        {text.slice(idx, idx + qLower.length)}
      </mark>
      {text.slice(idx + qLower.length)}
    </>
  )
}

type PaletteMode = "commands" | "links"

const MODE_LABELS: Record<PaletteMode, string> = {
  commands: "Commands",
  links: "Link to...",
}

export function SearchDialog() {
  const searchOpen = usePlotStore((s) => s.searchOpen)
  const setSearchOpen = usePlotStore((s) => s.setSearchOpen)
  const notes = usePlotStore((s) => s.notes)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const commandPaletteMode = usePlotStore((s) => s.commandPaletteMode)
  const setCommandPaletteMode = usePlotStore((s) => s.setCommandPaletteMode)
  const threads = usePlotStore((s) => s.threads)

  // Actions
  const createNote = usePlotStore((s) => s.createNote)
  const togglePin = usePlotStore((s) => s.togglePin)
  const startThread = usePlotStore((s) => s.startThread)
  const addThreadStep = usePlotStore((s) => s.addThreadStep)
  const endThread = usePlotStore((s) => s.endThread)
  const addWikiLink = usePlotStore((s) => s.addWikiLink)
  const setGraphFocusDepth = usePlotStore((s) => s.setGraphFocusDepth)
  const triageKeep = usePlotStore((s) => s.triageKeep)
  const triageSnooze = usePlotStore((s) => s.triageSnooze)
  const triageTrash = usePlotStore((s) => s.triageTrash)
  const promoteToPermanent = usePlotStore((s) => s.promoteToPermanent)
  const undoPromote = usePlotStore((s) => s.undoPromote)
  const moveBackToInbox = usePlotStore((s) => s.moveBackToInbox)
  const setMergePickerOpen = usePlotStore((s) => s.setMergePickerOpen)

  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()

  const [query, setQuery] = useState("")
  const [thinkingStepInput, setThinkingStepInput] = useState(false)
  const [thinkingStepText, setThinkingStepText] = useState("")
  const prevQueryRef = useRef("")

  const selectedNote = useMemo(
    () => (selectedNoteId ? notes.find((n) => n.id === selectedNoteId) ?? null : null),
    [selectedNoteId, notes]
  )

  const activeChain = useMemo(
    () =>
      selectedNoteId
        ? threads.find((c) => c.noteId === selectedNoteId && c.status === "active") ?? null
        : null,
    [selectedNoteId, threads]
  )

  // Reset state when dialog closes
  useEffect(() => {
    if (!searchOpen) {
      setQuery("")
      setCommandPaletteMode("commands")
      setThinkingStepInput(false)
      setThinkingStepText("")
      prevQueryRef.current = ""
    }
  }, [searchOpen, setCommandPaletteMode])

  // Mode switching via input prefixes
  useEffect(() => {
    if (commandPaletteMode === "commands") {
      if (query === "[[") {
        if (selectedNoteId) {
          setCommandPaletteMode("links")
          setQuery("")
        } else {
          // No selected note, can't link
          setQuery("")
          toast.error("Select a note first to create a link")
        }
        return
      }
    }
    prevQueryRef.current = query
  }, [query, commandPaletteMode, setCommandPaletteMode, selectedNoteId])

  // Handle backspace on empty input to go back to commands mode
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && query === "" && commandPaletteMode === "links") {
        e.preventDefault()
        setCommandPaletteMode("commands")
      }
    },
    [query, commandPaletteMode, setCommandPaletteMode]
  )

  // Ctrl+K and "/" shortcuts are now in hooks/use-global-shortcuts.ts

  function closePalette() {
    setSearchOpen(false)
    setQuery("")
    setCommandPaletteMode("commands")
    setThinkingStepInput(false)
    setThinkingStepText("")
  }

  // ---------- Links Mode Data ----------

  // Filtered note pool (non-trashed)
  const searchableNotes = useMemo(
    () => notes.filter((n) => !n.trashed && n.triageStatus !== "trashed"),
    [notes],
  )

  // Backlinks map — maintained by index hook, recalculated only when notes change
  const backlinksMap = useBacklinksIndex()

  // Worker-based search for links mode
  const searchQuery = commandPaletteMode === "links" ? query : ""
  const { results: workerResults, isIndexing } = useSearch(searchQuery, 12)

  // Recent notes (no query) – for links mode
  const recentNotes = useMemo(
    () =>
      [...searchableNotes]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 8),
    [searchableNotes],
  )

  // Whether we're showing search results (non-empty query) vs recent notes
  const hasFuzzyQuery = query.trim().length > 0

  /** Build sublabel text: "Inbox · Updated 2d · 3 backlinks" */
  function noteSublabel(note: { id: string; status: string; updatedAt: string; createdAt: string }): string {
    const stageLabel = note.status.charAt(0).toUpperCase() + note.status.slice(1)
    const relTime = shortRelative(note.updatedAt || note.createdAt)
    const bl = backlinksMap.get(note.id) ?? 0
    const blSuffix = bl > 0 ? ` · ${bl} backlink${bl !== 1 ? "s" : ""}` : ""
    return `${stageLabel} · Updated ${relTime}${blSuffix}`
  }

  // Disable cmdk's internal filter for Links mode so Fuse controls ordering.
  // For Commands mode, let cmdk handle its own filtering (return undefined).
  const cmdkFilter = useMemo(
    () =>
      commandPaletteMode === "commands" ? undefined : () => 1,
    [commandPaletteMode],
  )

  // ---------- Links Mode ----------

  function handleLinkSelect(targetNote: { id: string; title: string }) {
    if (!selectedNoteId) return
    addWikiLink(selectedNoteId, targetNote.title || "Untitled")
    toast.success(`Linked to "${targetNote.title || "Untitled"}"`)
    closePalette()
  }

  // ---------- Commands Mode ----------

  function execCommand(action: () => void, message: string) {
    action()
    toast.success(message)
    closePalette()
  }

  // Determine dialog description based on mode
  const dialogDescription = useMemo(() => {
    switch (commandPaletteMode) {
      case "commands":
        return 'Run a command. Type "[[" to link a note. Backspace to go back.'
      case "links":
        return "Search for a note to link to."
    }
  }, [commandPaletteMode])

  const inputPlaceholder = useMemo(() => {
    switch (commandPaletteMode) {
      case "commands":
        return "Type a command..."
      case "links":
        return "Search notes to link..."
    }
  }, [commandPaletteMode])

  return (
    <CommandDialog
      open={searchOpen}
      onOpenChange={(open) => {
        if (!open) closePalette()
        else setSearchOpen(true)
      }}
      title="Command Palette"
      description={dialogDescription}
      filter={cmdkFilter}
    >
      <div className="relative">
        {/* Mode badge — always shown */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center">
          <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {commandPaletteMode === "commands" && <Terminal size={14} weight="regular" />}
            {commandPaletteMode === "links" && <PhLink size={14} weight="regular" />}
            {MODE_LABELS[commandPaletteMode]}
          </span>
        </div>
        {thinkingStepInput ? (
          <div className="flex h-12 items-center gap-2 border-b px-3">
            <PhBrain className="shrink-0 opacity-50" size={16} weight="regular" />
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter thinking step text..."
              value={thinkingStepText}
              onChange={(e) => setThinkingStepText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && thinkingStepText.trim() && activeChain) {
                  e.preventDefault()
                  addThreadStep(activeChain.id, thinkingStepText.trim())
                  toast.success("Thinking step added")
                  closePalette()
                }
                if (e.key === "Escape") {
                  setThinkingStepInput(false)
                  setThinkingStepText("")
                }
              }}
              autoFocus
            />
          </div>
        ) : (
          <CommandInput
            placeholder={inputPlaceholder}
            value={query}
            onValueChange={setQuery}
            onKeyDown={handleKeyDown}
            className="pl-24"
          />
        )}
      </div>

      {!thinkingStepInput && (
        <CommandList>
          <CommandEmpty>
            {commandPaletteMode === "commands" && "No matching commands."}
            {commandPaletteMode === "links" && (isIndexing ? "Building search index..." : "No notes found to link.")}
          </CommandEmpty>

          {/* ====== COMMANDS MODE ====== */}
          {commandPaletteMode === "commands" && (
            <>
              {/* Navigation */}
              <CommandGroup heading="Navigation">
                <CommandItem
                  value="go-to-inbox"
                  onSelect={() => { router.push("/inbox"); closePalette() }}
                >
                  <Tray size={16} weight="regular" />
                  <span>Go to Inbox</span>
                  <CommandShortcut>G I</CommandShortcut>
                </CommandItem>
                <CommandItem
                  value="go-to-capture"
                  onSelect={() => { router.push("/capture"); closePalette() }}
                >
                  <Stack size={16} weight="regular" />
                  <span>Go to Capture</span>
                  <CommandShortcut>G C</CommandShortcut>
                </CommandItem>
                <CommandItem
                  value="go-to-permanent"
                  onSelect={() => { router.push("/permanent"); closePalette() }}
                >
                  <PhShield size={16} weight="regular" />
                  <span>Go to Permanent</span>
                  <CommandShortcut>G M</CommandShortcut>
                </CommandItem>
                <CommandItem
                  value="go-to-all-notes"
                  onSelect={() => { router.push("/notes"); closePalette() }}
                >
                  <FileText size={16} weight="regular" />
                  <span>Go to All Notes</span>
                  <CommandShortcut>G N</CommandShortcut>
                </CommandItem>
                <CommandItem
                  value="go-to-settings"
                  onSelect={() => { router.push("/settings"); closePalette() }}
                >
                  <GearSix size={16} weight="regular" />
                  <span>Go to GearSix</span>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              {/* Creation */}
              <CommandGroup heading="Creation">
                <CommandItem
                  value="create-new-note"
                  onSelect={() =>
                    execCommand(() => {
                      const id = createNote()
                      setSelectedNoteId(id)
                      router.push("/notes")
                    }, "Note created")
                  }
                >
                  <PhPlus size={16} weight="regular" />
                  <span>Create New Note</span>
                  <CommandShortcut>C</CommandShortcut>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              {/* System */}
              <CommandGroup heading="System">
                <CommandItem
                  value="toggle-theme"
                  onSelect={() =>
                    execCommand(
                      () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
                      `Switched to ${resolvedTheme === "dark" ? "light" : "dark"} mode`
                    )
                  }
                >
                  {resolvedTheme === "dark" ? (
                    <Sun size={16} weight="regular" />
                  ) : (
                    <Moon size={16} weight="regular" />
                  )}
                  <span>Toggle Theme</span>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              {/* Graph */}
              <CommandGroup heading="Graph">
                <CommandItem
                  value="graph-focus-depth-1"
                  onSelect={() => execCommand(() => setGraphFocusDepth(1), "Graph focus: depth 1")}
                >
                  <Crosshair size={16} weight="regular" />
                  <span>Set Graph Crosshair Depth 1</span>
                </CommandItem>
                <CommandItem
                  value="graph-focus-depth-2"
                  onSelect={() => execCommand(() => setGraphFocusDepth(2), "Graph focus: depth 2")}
                >
                  <Crosshair size={16} weight="regular" />
                  <span>Set Graph Crosshair Depth 2</span>
                </CommandItem>
                <CommandItem
                  value="graph-focus-depth-3"
                  onSelect={() => execCommand(() => setGraphFocusDepth(3), "Graph focus: depth 3")}
                >
                  <Crosshair size={16} weight="regular" />
                  <span>Set Graph Crosshair Depth 3</span>
                </CommandItem>
                <CommandItem
                  value="graph-focus-off"
                  onSelect={() => execCommand(() => setGraphFocusDepth(0), "Graph focus: off")}
                >
                  <Crosshair size={16} weight="regular" />
                  <span>Set Graph Crosshair Off</span>
                </CommandItem>
              </CommandGroup>

              {/* Note-Specific Commands */}
              {selectedNote && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`Note: ${selectedNote.title || "Untitled"}`}>
                    <CommandItem
                      value="toggle-pin-note"
                      onSelect={() =>
                        execCommand(
                          () => togglePin(selectedNote.id),
                          selectedNote.pinned ? "Unpinned" : "Pinned"
                        )
                      }
                    >
                      <PushPin size={16} weight="regular" />
                      <span>{selectedNote.pinned ? "Unpin Note" : "PushPin Note"}</span>
                      <CommandShortcut>⌘⇧P</CommandShortcut>
                    </CommandItem>

                    {/* Thinking Chain */}
                    {!activeChain && (
                      <CommandItem
                        value="start-thinking-chain"
                        onSelect={() =>
                          execCommand(
                            () => startThread(selectedNote.id),
                            "Thread started"
                          )
                        }
                      >
                        <PhBrain size={16} weight="regular" />
                        <span>Start Thinking Chain</span>
                      </CommandItem>
                    )}
                    {activeChain && (
                      <>
                        <CommandItem
                          value="add-thinking-step"
                          onSelect={() => {
                            setThinkingStepInput(true)
                            setThinkingStepText("")
                          }}
                        >
                          <SkipForward size={16} weight="regular" />
                          <span>Add Thinking Step</span>
                        </CommandItem>
                        <CommandItem
                          value="end-thinking-chain"
                          onSelect={() =>
                            execCommand(
                              () => endThread(activeChain.id),
                              "Thread ended"
                            )
                          }
                        >
                          <CheckCircle size={16} weight="regular" />
                          <span>End Thinking Chain</span>
                        </CommandItem>
                      </>
                    )}

                    {/* Link to note */}
                    <CommandItem
                      value="link-to-note"
                      onSelect={() => {
                        setCommandPaletteMode("links")
                        setQuery("")
                      }}
                    >
                      <PhLink size={16} weight="regular" />
                      <span>Link to Note...</span>
                      <CommandShortcut>{"[["}</CommandShortcut>
                    </CommandItem>

                    {/* GitMerge with */}
                    <CommandItem
                      value="merge-with-note"
                      onSelect={() => {
                        closePalette()
                        setMergePickerOpen(true, selectedNote.id)
                      }}
                    >
                      <GitMerge size={16} weight="regular" />
                      <span>GitMerge with...</span>
                    </CommandItem>

                  </CommandGroup>

                  {/* Stage-Specific Commands */}
                  {selectedNote.status === "inbox" && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Inbox Actions">
                        <CommandItem
                          value="triage-keep"
                          onSelect={() =>
                            execCommand(() => triageKeep(selectedNote.id), "Kept - moved to Capture")
                          }
                        >
                          <CheckCircle size={16} weight="regular" />
                          <span>Keep</span>
                          <CommandShortcut>K</CommandShortcut>
                        </CommandItem>
                        <CommandItem
                          value="triage-snooze"
                          onSelect={() =>
                            execCommand(
                              () => triageSnooze(selectedNote.id, getSnoozeTime("tomorrow")),
                              "Snoozed until tomorrow"
                            )
                          }
                        >
                          <PhClock size={16} weight="regular" />
                          <span>Snooze until Tomorrow</span>
                          <CommandShortcut>S</CommandShortcut>
                        </CommandItem>
                        <CommandItem
                          value="triage-trash"
                          onSelect={() =>
                            execCommand(() => triageTrash(selectedNote.id), "Trashed")
                          }
                        >
                          <Trash size={16} weight="regular" />
                          <span>Trash</span>
                          <CommandShortcut>T</CommandShortcut>
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}

                  {selectedNote.status === "capture" && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Capture Actions">
                        <CommandItem
                          value="promote-to-permanent"
                          onSelect={() =>
                            execCommand(
                              () => promoteToPermanent(selectedNote.id),
                              "Promoted to Permanent"
                            )
                          }
                        >
                          <ArrowCircleUp size={16} weight="regular" />
                          <span>Promote to Permanent</span>
                          <CommandShortcut>P</CommandShortcut>
                        </CommandItem>
                        <CommandItem
                          value="move-back-to-inbox"
                          onSelect={() =>
                            execCommand(
                              () => moveBackToInbox(selectedNote.id),
                              "Moved back to Inbox"
                            )
                          }
                        >
                          <Tray size={16} weight="regular" />
                          <span>Back to Inbox</span>
                          <CommandShortcut>B</CommandShortcut>
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}

                  {selectedNote.status === "permanent" && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Permanent Actions">
                        <CommandItem
                          value="demote-to-capture"
                          onSelect={() =>
                            execCommand(
                              () => undoPromote(selectedNote.id),
                              "Demoted to Capture"
                            )
                          }
                        >
                          <ArrowCircleDown size={16} weight="regular" />
                          <span>Demote to Capture</span>
                          <CommandShortcut>D</CommandShortcut>
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {/* ====== LINKS MODE ====== */}
          {commandPaletteMode === "links" && (
            <>
              {/* Worker search results in Links mode */}
              {hasFuzzyQuery && workerResults.length > 0 && (
                <CommandGroup heading="Select a note to link">
                  {workerResults
                    .filter((n) => n.id !== selectedNoteId)
                    .map((note) => (
                      <CommandItem
                        key={note.id}
                        value={`link-${note.id}`}
                        onSelect={() => handleLinkSelect(note)}
                      >
                        <PhLink className="shrink-0 self-start mt-0.5" size={16} weight="regular" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">
                            {highlightQuery(note.title || "Untitled", query)}
                          </div>
                          <div className="truncate text-xs text-muted-foreground leading-tight">
                            {noteSublabel(note)}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}

              {/* Recent notes when no query in Links mode */}
              {!hasFuzzyQuery && (
                <CommandGroup heading="Select a note to link">
                  {recentNotes
                    .filter((n) => n.id !== selectedNoteId)
                    .map((note) => (
                      <CommandItem
                        key={note.id}
                        value={`link-${note.id}-${note.title || "Untitled"}`}
                        onSelect={() => handleLinkSelect(note)}
                      >
                        <PhLink className="shrink-0 self-start mt-0.5" size={16} weight="regular" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{note.title || "Untitled"}</div>
                          <div className="truncate text-xs text-muted-foreground leading-tight">
                            {noteSublabel(note)}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      )}
    </CommandDialog>
  )
}
