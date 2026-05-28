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
  Pin as PushPin,
  Plus as PhPlus,
  Link as PhLink,
  Brain as PhBrain,
  SkipForward,
  CheckCircle,
  Clock as PhClock,
  Trash2 as Trash,
  ArrowUpCircle as ArrowCircleUp,
  ArrowDownCircle as ArrowCircleDown,
  Inbox as Tray,
  Crosshair,
  Terminal,
  Layers as Stack,
  Shield as PhShield,
  Settings as GearSix,
  Sun,
  Moon,
  GitMerge,
} from "lucide-react"
import {
  setActiveRoute,
} from "@/lib/table-route"
import { useT } from "@/lib/i18n"
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
  const t = useT()
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

  // Backspace on empty input → back to commands mode. Escape → close.
  // Radix Dialog has built-in Escape handling via onEscapeKeyDown, but cmdk's
  // CommandPrimitive.Input intercepts the key in some IME/composition states
  // (notably Korean), so we close explicitly here. `closePalette` is a hoisted
  // function declaration below, which is why it can be called from this
  // useCallback without extra deps.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        closePalette()
        return
      }
      if (e.key === "Backspace" && query === "" && commandPaletteMode === "links") {
        e.preventDefault()
        setCommandPaletteMode("commands")
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        return t("cmdk.placeholder.commands")
      case "links":
        return t("cmdk.placeholder.links")
    }
  }, [commandPaletteMode, t])

  // Linear-style hybrid: 기본 commands 모드는 뱃지 없이 깔끔. links 같은
  // sub-mode일 때만 뱃지로 모드를 명시 (UX 명확성). #117/#118의 정체성
  // 절충 원칙을 그대로 적용 — 기본 surface는 minimal, special path는 explicit.
  const showModeBadge = commandPaletteMode !== "commands"

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
        {/* Sub-mode badge — Commands 모드일 땐 숨김. Linear 정합. */}
        {showModeBadge && (
          <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2">
            <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-2xs font-medium text-accent-foreground">
              {commandPaletteMode === "links" && <PhLink size={12} strokeWidth={2} />}
              {commandPaletteMode === "links" && t("cmdk.mode.links")}
            </span>
          </div>
        )}
        {thinkingStepInput ? (
          <div className="flex h-14 items-center gap-3 border-b border-border px-4">
            <PhBrain className="shrink-0 text-muted-foreground" size={18} strokeWidth={2} />
            <input
              className="flex h-12 w-full rounded-md bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={t("cmdk.placeholder.thinking")}
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
            className={showModeBadge ? "pl-20 text-base" : "text-base"}
          />
        )}
      </div>

      {!thinkingStepInput && (
        <CommandList>
          <CommandEmpty>
            {commandPaletteMode === "commands" && t("cmdk.empty.commands")}
            {commandPaletteMode === "links" && (isIndexing ? t("cmdk.empty.links_indexing") : t("cmdk.empty.links"))}
          </CommandEmpty>

          {/* ====== COMMANDS MODE ====== */}
          {commandPaletteMode === "commands" && (
            <>
              {/* Navigation */}
              <CommandGroup heading={t("cmdk.group.navigation")}>
                <CommandItem
                  value="go-to-backlog"
                  onSelect={() => { router.push("/backlog"); closePalette() }}
                >
                  <Tray size={16} />
                  <span>{t("cmdk.cmd.go_to_stone")}</span>
                  <CommandShortcut>G I</CommandShortcut>
                </CommandItem>
                <CommandItem
                  value="go-to-todo"
                  onSelect={() => { router.push("/todo"); closePalette() }}
                >
                  <Stack size={16} />
                  <span>{t("cmdk.cmd.go_to_todo")}</span>
                  <CommandShortcut>G T</CommandShortcut>
                </CommandItem>
                <CommandItem
                  value="go-to-in-progress"
                  onSelect={() => { router.push("/in-progress"); closePalette() }}
                >
                  <Stack size={16} />
                  <span>{t("cmdk.cmd.go_to_brick")}</span>
                  <CommandShortcut>G C</CommandShortcut>
                </CommandItem>
                <CommandItem
                  value="go-to-done"
                  onSelect={() => { router.push("/done"); closePalette() }}
                >
                  <PhShield size={16} />
                  <span>{t("cmdk.cmd.go_to_keystone")}</span>
                  <CommandShortcut>G M</CommandShortcut>
                </CommandItem>
                <CommandItem
                  value="go-to-all-notes"
                  onSelect={() => { router.push("/notes"); closePalette() }}
                >
                  <FileText size={16} />
                  <span>{t("cmdk.cmd.go_to_all_notes")}</span>
                  <CommandShortcut>G N</CommandShortcut>
                </CommandItem>
                <CommandItem
                  value="go-to-settings"
                  onSelect={() => { router.push("/settings"); closePalette() }}
                >
                  <GearSix size={16} />
                  <span>{t("cmdk.cmd.go_to_settings")}</span>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              {/* Creation */}
              <CommandGroup heading={t("cmdk.group.creation")}>
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
                  <PhPlus size={16} />
                  <span>{t("cmdk.cmd.create_new_note")}</span>
                  <CommandShortcut>C</CommandShortcut>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              {/* System */}
              <CommandGroup heading={t("cmdk.group.system")}>
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
                    <Sun size={16} />
                  ) : (
                    <Moon size={16} />
                  )}
                  <span>{t("cmdk.cmd.toggle_theme")}</span>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              {/* Graph */}
              <CommandGroup heading={t("cmdk.group.graph")}>
                <CommandItem
                  value="graph-focus-depth-1"
                  onSelect={() => execCommand(() => setGraphFocusDepth(1), "Graph focus: depth 1")}
                >
                  <Crosshair size={16} />
                  <span>{t("cmdk.cmd.graph_focus_depth")} 1</span>
                </CommandItem>
                <CommandItem
                  value="graph-focus-depth-2"
                  onSelect={() => execCommand(() => setGraphFocusDepth(2), "Graph focus: depth 2")}
                >
                  <Crosshair size={16} />
                  <span>{t("cmdk.cmd.graph_focus_depth")} 2</span>
                </CommandItem>
                <CommandItem
                  value="graph-focus-depth-3"
                  onSelect={() => execCommand(() => setGraphFocusDepth(3), "Graph focus: depth 3")}
                >
                  <Crosshair size={16} />
                  <span>{t("cmdk.cmd.graph_focus_depth")} 3</span>
                </CommandItem>
                <CommandItem
                  value="graph-focus-off"
                  onSelect={() => execCommand(() => setGraphFocusDepth(0), "Graph focus: off")}
                >
                  <Crosshair size={16} />
                  <span>{t("cmdk.cmd.graph_focus_off")}</span>
                </CommandItem>
              </CommandGroup>

              {/* Note-Specific Commands */}
              {selectedNote && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`${t("cmdk.group.note_prefix")}: ${selectedNote.title || t("common.untitled")}`}>
                    <CommandItem
                      value="toggle-pin-note"
                      onSelect={() =>
                        execCommand(
                          () => togglePin(selectedNote.id),
                          selectedNote.pinned ? "Unpinned" : "Pinned"
                        )
                      }
                    >
                      <PushPin size={16} />
                      <span>{t("cmdk.cmd.toggle_pin")}</span>
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
                        <PhBrain size={16} />
                        <span>{t("cmdk.cmd.start_thread")}</span>
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
                          <SkipForward size={16} />
                          <span>{t("cmdk.cmd.add_step")}</span>
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
                          <CheckCircle size={16} />
                          <span>{t("cmdk.cmd.end_thread")}</span>
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
                      <PhLink size={16} />
                      <span>{t("cmdk.cmd.link_to_note")}</span>
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
                      <GitMerge size={16} />
                      <span>{t("cmdk.cmd.merge_with")}</span>
                    </CommandItem>

                  </CommandGroup>

                  {/* Stage-Specific Commands */}
                  {selectedNote.status === "backlog" && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Backlog Actions">
                        <CommandItem
                          value="triage-keep"
                          onSelect={() =>
                            execCommand(() => triageKeep(selectedNote.id), "Kept - moved to In Progress")
                          }
                        >
                          <CheckCircle size={16} />
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
                          <PhClock size={16} />
                          <span>Snooze until Tomorrow</span>
                          <CommandShortcut>S</CommandShortcut>
                        </CommandItem>
                        <CommandItem
                          value="triage-trash"
                          onSelect={() =>
                            execCommand(() => triageTrash(selectedNote.id), "Trashed")
                          }
                        >
                          <Trash size={16} />
                          <span>Trash</span>
                          <CommandShortcut>T</CommandShortcut>
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}

                  {selectedNote.status === "in_progress" && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="In Progress Actions">
                        <CommandItem
                          value="promote-to-done"
                          onSelect={() =>
                            execCommand(
                              () => promoteToPermanent(selectedNote.id),
                              "Promoted to Done"
                            )
                          }
                        >
                          <ArrowCircleUp size={16} />
                          <span>Promote to Done</span>
                          <CommandShortcut>P</CommandShortcut>
                        </CommandItem>
                        <CommandItem
                          value="move-back-to-backlog"
                          onSelect={() =>
                            execCommand(
                              () => moveBackToInbox(selectedNote.id),
                              "Moved back to Backlog"
                            )
                          }
                        >
                          <Tray size={16} />
                          <span>Back to Backlog</span>
                          <CommandShortcut>B</CommandShortcut>
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}

                  {selectedNote.status === "done" && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Done Actions">
                        <CommandItem
                          value="demote-to-in-progress"
                          onSelect={() =>
                            execCommand(
                              () => undoPromote(selectedNote.id),
                              "Demoted to In Progress"
                            )
                          }
                        >
                          <ArrowCircleDown size={16} />
                          <span>Demote to In Progress</span>
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
                        <PhLink className="shrink-0 self-start mt-0.5" size={16} />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">
                            {highlightQuery(note.title || "Untitled", query)}
                          </div>
                          <div className="truncate text-2xs text-muted-foreground leading-tight">
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
                        <PhLink className="shrink-0 self-start mt-0.5" size={16} />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{note.title || "Untitled"}</div>
                          <div className="truncate text-2xs text-muted-foreground leading-tight">
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
