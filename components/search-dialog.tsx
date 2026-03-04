"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { getSnoozeTime } from "@/lib/queries/notes"
import { toast } from "sonner"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import {
  FileText,
  Pin,
  Plus,
  Archive,
  ArchiveRestore,
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
} from "lucide-react"

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
  const toggleArchive = usePlotStore((s) => s.toggleArchive)
  const startThinkingChain = usePlotStore((s) => s.startThinkingChain)
  const addThinkingStep = usePlotStore((s) => s.addThinkingStep)
  const endThinkingChain = usePlotStore((s) => s.endThinkingChain)
  const addWikiLink = usePlotStore((s) => s.addWikiLink)
  const setGraphFocusDepth = usePlotStore((s) => s.setGraphFocusDepth)
  const triageKeep = usePlotStore((s) => s.triageKeep)
  const triageSnooze = usePlotStore((s) => s.triageSnooze)
  const triageTrash = usePlotStore((s) => s.triageTrash)
  const promoteToPermament = usePlotStore((s) => s.promoteToPermament)
  const undoPromote = usePlotStore((s) => s.undoPromote)
  const moveBackToInbox = usePlotStore((s) => s.moveBackToInbox)
  const addNoteToMap = usePlotStore((s) => s.addNoteToMap)

  const router = useRouter()

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

  // Cmd/Ctrl+K and "/" keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen(!searchOpen)
        return
      }
      // "/" shortcut (when not in an input)
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [setSearchOpen, searchOpen])

  function closePalette() {
    setSearchOpen(false)
    setQuery("")
    setCommandPaletteMode("search")
    setThinkingStepInput(false)
    setThinkingStepText("")
  }

  // ---------- Search Mode ----------

  const searchResults = useMemo(() => {
    if (commandPaletteMode !== "search" && commandPaletteMode !== "links") return []
    if (!query.trim()) {
      // Show recent notes when no query
      return [...notes]
        .filter((n) => !n.archived && n.triageStatus !== "trashed")
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 8)
    }
    const q = query.toLowerCase()
    return notes
      .filter(
        (n) =>
          !n.archived &&
          n.triageStatus !== "trashed" &&
          (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
      )
      .slice(0, 10)
  }, [notes, query, commandPaletteMode])

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
    >
      <div className="relative">
        {/* Mode badge */}
        {commandPaletteMode !== "search" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center">
            <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {commandPaletteMode === "commands" && <Terminal className="h-3 w-3" />}
              {commandPaletteMode === "links" && <Link2 className="h-3 w-3" />}
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
            {commandPaletteMode === "search" && "No notes found."}
            {commandPaletteMode === "commands" && "No matching commands."}
            {commandPaletteMode === "links" && "No notes found to link."}
          </CommandEmpty>

          {/* ====== SEARCH MODE ====== */}
          {commandPaletteMode === "search" && (
            <>
              {searchResults.length > 0 && (
                <CommandGroup heading={query.trim() ? "Results" : "Recent Notes"}>
                  {searchResults.map((note) => (
                    <CommandItem
                      key={note.id}
                      value={`search-${note.id}-${note.title || "Untitled"}`}
                      onSelect={() => handleSearchSelect(note.id)}
                    >
                      {note.pinned ? (
                        <Pin className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      <span className="flex-1 truncate">{note.title || "Untitled"}</span>
                      <span className="ml-2 text-xs text-muted-foreground capitalize">
                        {note.stage}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {!query.trim() && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Quick Actions">
                    <CommandItem
                      value="switch-to-commands"
                      onSelect={() => {
                        setCommandPaletteMode("commands")
                        setQuery("")
                      }}
                    >
                      <Terminal className="h-4 w-4" />
                      <span>Open Commands</span>
                      <span className="ml-auto text-xs text-muted-foreground">{">"}</span>
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
                        <span className="ml-auto text-xs text-muted-foreground">{"[["}</span>
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
              {/* Global Commands */}
              <CommandGroup heading="Global">
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
                </CommandItem>

                <CommandItem
                  value="open-knowledge-maps"
                  onSelect={() => {
                    router.push("/maps")
                    closePalette()
                  }}
                >
                  <Network className="h-4 w-4" />
                  <span>Open Knowledge Maps</span>
                </CommandItem>

                <CommandSeparator />

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
                    </CommandItem>

                    <CommandItem
                      value="toggle-archive-note"
                      onSelect={() =>
                        execCommand(
                          () => toggleArchive(selectedNote.id),
                          selectedNote.archived ? "Unarchived" : "Archived"
                        )
                      }
                    >
                      {selectedNote.archived ? (
                        <ArchiveRestore className="h-4 w-4" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                      <span>{selectedNote.archived ? "Unarchive" : "Archive"}</span>
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
                  {selectedNote.stage === "inbox" && (
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
                        </CommandItem>
                        <CommandItem
                          value="triage-trash"
                          onSelect={() =>
                            execCommand(() => triageTrash(selectedNote.id), "Trashed")
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Trash</span>
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}

                  {selectedNote.stage === "capture" && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Capture Actions">
                        <CommandItem
                          value="promote-to-permanent"
                          onSelect={() =>
                            execCommand(
                              () => promoteToPermament(selectedNote.id),
                              "Promoted to Permanent"
                            )
                          }
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                          <span>Promote to Permanent</span>
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
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}

                  {selectedNote.stage === "permanent" && (
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
              {searchResults.length > 0 && (
                <CommandGroup heading="Select a note to link">
                  {searchResults
                    .filter((n) => n.id !== selectedNoteId)
                    .map((note) => (
                      <CommandItem
                        key={note.id}
                        value={`link-${note.id}-${note.title || "Untitled"}`}
                        onSelect={() => handleLinkSelect(note)}
                      >
                        <Link2 className="h-4 w-4" />
                        <span className="flex-1 truncate">{note.title || "Untitled"}</span>
                        <span className="ml-2 text-xs text-muted-foreground capitalize">
                          {note.stage}
                        </span>
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
