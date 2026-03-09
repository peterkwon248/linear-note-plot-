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
import {
  FileText,
  Pin,
  Plus,
  LayoutGrid,
  Link2,
  Brain,
  BrainCircuit,
  StepForward,
  CheckCircle2,
  Clock,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Inbox,
  Focus,
  Search,
  Terminal,
  Network,
  Layers,
  Shield,
  ClipboardCheck,
  FolderOpen,
  Settings,
  Sun,
  Moon,
  Merge,
} from "lucide-react"

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

type PaletteMode = "search" | "commands" | "links"

const MODE_LABELS: Record<PaletteMode, string> = {
  search: "Search",
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
  const thinkingChains = usePlotStore((s) => s.thinkingChains)
  const knowledgeMaps = usePlotStore((s) => s.knowledgeMaps)

  // Actions
  const createNote = usePlotStore((s) => s.createNote)
  const togglePin = usePlotStore((s) => s.togglePin)
  const startThinkingChain = usePlotStore((s) => s.startThinkingChain)
  const addThinkingStep = usePlotStore((s) => s.addThinkingStep)
  const endThinkingChain = usePlotStore((s) => s.endThinkingChain)
  const addWikiLink = usePlotStore((s) => s.addWikiLink)
  const setGraphFocusDepth = usePlotStore((s) => s.setGraphFocusDepth)
  const triageKeep = usePlotStore((s) => s.triageKeep)
  const triageSnooze = usePlotStore((s) => s.triageSnooze)
  const triageTrash = usePlotStore((s) => s.triageTrash)
  const promoteToPermanent = usePlotStore((s) => s.promoteToPermanent)
  const undoPromote = usePlotStore((s) => s.undoPromote)
  const moveBackToInbox = usePlotStore((s) => s.moveBackToInbox)
  const addNoteToMap = usePlotStore((s) => s.addNoteToMap)
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
        ? thinkingChains.find((c) => c.noteId === selectedNoteId && c.status === "active") ?? null
        : null,
    [selectedNoteId, thinkingChains]
  )

  // Reset state when dialog closes
  useEffect(() => {
    if (!searchOpen) {
      setQuery("")
      setCommandPaletteMode("search")
      setThinkingStepInput(false)
      setThinkingStepText("")
      prevQueryRef.current = ""
    }
  }, [searchOpen, setCommandPaletteMode])

  // Mode switching via input prefixes
  useEffect(() => {
    if (commandPaletteMode === "search") {
      if (query === ">") {
        setCommandPaletteMode("commands")
        setQuery("")
        return
      }
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

  // Handle backspace on empty input to go back to search
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && query === "" && commandPaletteMode !== "search") {
        e.preventDefault()
        setCommandPaletteMode("search")
      }
    },
    [query, commandPaletteMode, setCommandPaletteMode]
  )

  // Ctrl+K and "/" shortcuts are now in hooks/use-global-shortcuts.ts

  function closePalette() {
    setSearchOpen(false)
    setQuery("")
    setCommandPaletteMode("search")
    setThinkingStepInput(false)
    setThinkingStepText("")
  }

  // ---------- Search Mode ----------

  // Filtered note pool (non-archived, non-trashed) shared by Search + Links
  const searchableNotes = useMemo(
    () => notes.filter((n) => !n.archived && !n.trashed && n.triageStatus !== "trashed"),
    [notes],
  )

  // Backlinks map — maintained by index hook, recalculated only when notes change
  const backlinksMap = useBacklinksIndex()

  // Worker-based search for search and links modes
  const searchQuery = commandPaletteMode !== "commands" ? query : ""
  const { results: workerResults, isIndexing } = useSearch(searchQuery, 12)

  // Recent notes (no query) – unchanged behavior
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

  // Disable cmdk's internal filter for Search/Links so Fuse controls ordering.
  // For Commands mode, let cmdk handle its own filtering (return undefined).
  const cmdkFilter = useMemo(
    () =>
      commandPaletteMode === "commands" ? undefined : () => 1,
    [commandPaletteMode],
  )

  function handleSearchSelect(noteId: string) {
    setSelectedNoteId(noteId)
    router.push("/notes")
    closePalette()
  }

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
      case "search":
        return 'Search notes. Type ">" for commands, "[[" to link.'
      case "commands":
        return "Run a command. Backspace to go back."
      case "links":
        return "Search for a note to link to."
    }
  }, [commandPaletteMode])

  const inputPlaceholder = useMemo(() => {
    switch (commandPaletteMode) {
      case "search":
        return "Search notes..."
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
        {/* Mode badge */}
        {commandPaletteMode !== "search" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center">
            <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {commandPaletteMode === "commands" && <Terminal className="h-3.5 w-3.5" />}
              {commandPaletteMode === "links" && <Link2 className="h-3.5 w-3.5" />}
              {MODE_LABELS[commandPaletteMode]}
            </span>
          </div>
        )}
        {thinkingStepInput ? (
          <div className="flex h-12 items-center gap-2 border-b px-3">
            <BrainCircuit className="h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter thinking step text..."
              value={thinkingStepText}
              onChange={(e) => setThinkingStepText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && thinkingStepText.trim() && activeChain) {
                  e.preventDefault()
                  addThinkingStep(activeChain.id, thinkingStepText.trim())
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
            className={commandPaletteMode !== "search" ? "pl-24" : undefined}
          />
        )}
      </div>

      {!thinkingStepInput && (
        <CommandList>
          <CommandEmpty>
            {commandPaletteMode === "search" && (isIndexing ? "Building search index..." : "No notes found.")}
            {commandPaletteMode === "commands" && "No matching commands."}
            {commandPaletteMode === "links" && (isIndexing ? "Building search index..." : "No notes found to link.")}
          </CommandEmpty>

          {/* ====== SEARCH MODE ====== */}
          {commandPaletteMode === "search" && (
            <>
              {/* Worker-based search results (non-empty query) */}
              {hasFuzzyQuery && workerResults.length > 0 && (
                <CommandGroup heading="Results">
                  {workerResults.map((note) => (
                    <CommandItem
                      key={note.id}
                      value={`search-${note.id}`}
                      onSelect={() => handleSearchSelect(note.id)}
                    >
                      {note.pinned ? (
                        <Pin className="h-4 w-4 shrink-0 self-start mt-0.5" />
                      ) : (
                        <FileText className="h-4 w-4 shrink-0 self-start mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate">
                          {note.title || "Untitled"}
                        </div>
                        <div className="truncate text-xs text-muted-foreground leading-tight">
                          {noteSublabel(note)}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Recent notes (empty query) */}
              {!hasFuzzyQuery && recentNotes.length > 0 && (
                <CommandGroup heading="Recent Notes">
                  {recentNotes.map((note) => (
                    <CommandItem
                      key={note.id}
                      value={`search-${note.id}-${note.title || "Untitled"}`}
                      onSelect={() => handleSearchSelect(note.id)}
                    >
                      {note.pinned ? (
                        <Pin className="h-4 w-4 shrink-0 self-start mt-0.5" />
                      ) : (
                        <FileText className="h-4 w-4 shrink-0 self-start mt-0.5" />
                      )}
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

              {/* Quick actions (empty query only) */}
              {!hasFuzzyQuery && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Quick Actions">
                    <CommandItem
                      value="quick-go-to-inbox"
                      onSelect={() => {
                        router.push("/inbox")
                        closePalette()
                      }}
                    >
                      <Inbox className="h-4 w-4" />
                      <span>Go to Inbox</span>
                      <CommandShortcut>G I</CommandShortcut>
                    </CommandItem>
                    <CommandItem
                      value="quick-go-to-settings"
                      onSelect={() => {
                        router.push("/settings")
                        closePalette()
                      }}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Go to Settings</span>
                    </CommandItem>
                    <CommandItem
                      value="switch-to-commands"
                      onSelect={() => {
                        setCommandPaletteMode("commands")
                        setQuery("")
                      }}
                    >
                      <Terminal className="h-4 w-4" />
                      <span>Open Commands</span>
                      <CommandShortcut>{">"}</CommandShortcut>
                    </CommandItem>
                    {selectedNoteId && (
                      <CommandItem
                        value="switch-to-links"
                        onSelect={() => {
                          setCommandPaletteMode("links")
                          setQuery("")
                        }}
                      >
                        <Link2 className="h-4 w-4" />
                        <span>Link to note...</span>
                        <CommandShortcut>{"[["}</CommandShortcut>
                      </CommandItem>
                    )}
                  </CommandGroup>
                </>
              )}
            </>
          )}

          {/* ====== COMMANDS MODE ====== */}
          {commandPaletteMode === "commands" && (
            <>
              {/* Navigation */}
              <CommandGroup heading="Navigation">
                <CommandItem
                  value="go-to-inbox"
                  onSelect={() => { router.push("/inbox"); closePalette() }}
                >
                  <Inbox className="h-4 w-4" />
                  <span>Go to Inbox</span>
                  <CommandShortcut>G I</CommandShortcut>
                </CommandItem>
                <CommandItem
                  value="go-to-capture"
                  onSelect={() => { router.push("/capture"); closePalette() }}
                >
                  <Layers className="h-4 w-4" />
                  <span>Go to Capture</span>
                  <CommandShortcut>G C</CommandShortcut>
                </CommandItem>
                <CommandItem
                  value="go-to-permanent"
                  onSelect={() => { router.push("/permanent"); closePalette() }}
                >
                  <Shield className="h-4 w-4" />
                  <span>Go to Permanent</span>
                  <CommandShortcut>G M</CommandShortcut>
                </CommandItem>
                <CommandItem
                  value="go-to-review"
                  onSelect={() => { router.push("/review"); closePalette() }}
                >
                  <ClipboardCheck className="h-4 w-4" />
                  <span>Go to Review</span>
                </CommandItem>
                <CommandItem
                  value="go-to-maps"
                  onSelect={() => { router.push("/maps"); closePalette() }}
                >
                  <Network className="h-4 w-4" />
                  <span>Go to Maps</span>
                </CommandItem>
                <CommandItem
                  value="go-to-all-notes"
                  onSelect={() => { router.push("/notes"); closePalette() }}
                >
                  <FileText className="h-4 w-4" />
                  <span>Go to All Notes</span>
                  <CommandShortcut>G N</CommandShortcut>
                </CommandItem>
                <CommandItem
                  value="go-to-projects"
                  onSelect={() => { router.push("/projects"); closePalette() }}
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>Go to Projects</span>
                  <CommandShortcut>G P</CommandShortcut>
                </CommandItem>
                <CommandItem
                  value="go-to-views"
                  onSelect={() => { router.push("/views"); closePalette() }}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span>Go to Views</span>
                  <CommandShortcut>G V</CommandShortcut>
                </CommandItem>
                <CommandItem
                  value="go-to-settings"
                  onSelect={() => { router.push("/settings"); closePalette() }}
                >
                  <Settings className="h-4 w-4" />
                  <span>Go to Settings</span>
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
                  <Plus className="h-4 w-4" />
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
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
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
                  <Focus className="h-4 w-4" />
                  <span>Set Graph Focus Depth 1</span>
                </CommandItem>
                <CommandItem
                  value="graph-focus-depth-2"
                  onSelect={() => execCommand(() => setGraphFocusDepth(2), "Graph focus: depth 2")}
                >
                  <Focus className="h-4 w-4" />
                  <span>Set Graph Focus Depth 2</span>
                </CommandItem>
                <CommandItem
                  value="graph-focus-depth-3"
                  onSelect={() => execCommand(() => setGraphFocusDepth(3), "Graph focus: depth 3")}
                >
                  <Focus className="h-4 w-4" />
                  <span>Set Graph Focus Depth 3</span>
                </CommandItem>
                <CommandItem
                  value="graph-focus-off"
                  onSelect={() => execCommand(() => setGraphFocusDepth(0), "Graph focus: off")}
                >
                  <Focus className="h-4 w-4" />
                  <span>Set Graph Focus Off</span>
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
                      <Pin className="h-4 w-4" />
                      <span>{selectedNote.pinned ? "Unpin Note" : "Pin Note"}</span>
                      <CommandShortcut>⌘⇧P</CommandShortcut>
                    </CommandItem>

                    {/* Thinking Chain */}
                    {!activeChain && (
                      <CommandItem
                        value="start-thinking-chain"
                        onSelect={() =>
                          execCommand(
                            () => startThinkingChain(selectedNote.id),
                            "Thinking chain started"
                          )
                        }
                      >
                        <Brain className="h-4 w-4" />
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
                          <StepForward className="h-4 w-4" />
                          <span>Add Thinking Step</span>
                        </CommandItem>
                        <CommandItem
                          value="end-thinking-chain"
                          onSelect={() =>
                            execCommand(
                              () => endThinkingChain(activeChain.id),
                              "Thinking chain ended"
                            )
                          }
                        >
                          <CheckCircle2 className="h-4 w-4" />
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
                      <Link2 className="h-4 w-4" />
                      <span>Link to Note...</span>
                      <CommandShortcut>{"[["}</CommandShortcut>
                    </CommandItem>

                    {/* Merge with */}
                    <CommandItem
                      value="merge-with-note"
                      onSelect={() => {
                        closePalette()
                        setMergePickerOpen(true, selectedNote.id)
                      }}
                    >
                      <Merge className="h-4 w-4" />
                      <span>Merge with...</span>
                    </CommandItem>

                    {/* Add to map */}
                    {knowledgeMaps.length > 0 && (
                      <>
                        {knowledgeMaps.map((map) => {
                          const isInMap = map.noteIds.includes(selectedNoteId!)
                          if (isInMap) return null
                          return (
                            <CommandItem
                              key={map.id}
                              value={`add-to-map-${map.id}-${map.title}`}
                              onSelect={() => {
                                addNoteToMap(map.id, selectedNoteId!)
                                toast.success(`Added to "${map.title}"`)
                                closePalette()
                              }}
                            >
                              <Network className="h-4 w-4" />
                              <span>Add to map: {map.title}</span>
                            </CommandItem>
                          )
                        })}
                      </>
                    )}
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
                          <CheckCircle2 className="h-4 w-4" />
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
                          <Clock className="h-4 w-4" />
                          <span>Snooze until Tomorrow</span>
                          <CommandShortcut>S</CommandShortcut>
                        </CommandItem>
                        <CommandItem
                          value="triage-trash"
                          onSelect={() =>
                            execCommand(() => triageTrash(selectedNote.id), "Trashed")
                          }
                        >
                          <Trash2 className="h-4 w-4" />
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
                          <ArrowUpCircle className="h-4 w-4" />
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
                          <Inbox className="h-4 w-4" />
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
                          <ArrowDownCircle className="h-4 w-4" />
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
                        <Link2 className="h-4 w-4 shrink-0 self-start mt-0.5" />
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
                        <Link2 className="h-4 w-4 shrink-0 self-start mt-0.5" />
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
