import type { Note, AutopilotRule, AutopilotAction, AutopilotLogEntry, NoteStatus, NotePriority, TriageStatus } from "../../types"
import { genId, now, type AppendEventFn } from "../helpers"
import { runAutopilot } from "../../autopilot"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

const MAX_LOG_ENTRIES = 100

/** Apply a single autopilot action to a note (returns partial update) */
function applyAction(note: Note, action: AutopilotAction): Partial<Note> {
  switch (action.type) {
    case "set_status":
      return { status: action.value as NoteStatus, updatedAt: now(), lastTouchedAt: now() }
    case "set_priority":
      return { priority: action.value as NotePriority, updatedAt: now() }
    case "set_label":
      return { labelId: action.value ?? null, updatedAt: now() }
    case "set_triage":
      return { triageStatus: action.value as TriageStatus, updatedAt: now() }
    case "archive":
      return { archived: true, archivedAt: now(), updatedAt: now() }
    case "pin":
      return { pinned: true, updatedAt: now() }
    case "add_tag":
      return action.value && !note.tags.includes(action.value)
        ? { tags: [...note.tags, action.value], updatedAt: now() }
        : {}
    case "remove_tag":
      return action.value
        ? { tags: note.tags.filter((t) => t !== action.value), updatedAt: now() }
        : {}
    default:
      return {}
  }
}

export function createAutopilotSlice(set: Set, get: Get, appendEvent: AppendEventFn) {
  return {
    // ── CRUD ──
    createAutopilotRule: (rule: Omit<AutopilotRule, "id" | "createdAt" | "updatedAt">) => {
      const newRule: AutopilotRule = {
        ...rule,
        id: `rule-${genId()}`,
        createdAt: now(),
        updatedAt: now(),
      }
      set((state: any) => ({
        autopilotRules: [...state.autopilotRules, newRule],
      }))
      return newRule.id
    },

    updateAutopilotRule: (id: string, updates: Partial<AutopilotRule>) => {
      set((state: any) => ({
        autopilotRules: state.autopilotRules.map((r: AutopilotRule) =>
          r.id === id ? { ...r, ...updates, updatedAt: now() } : r
        ),
      }))
    },

    deleteAutopilotRule: (id: string) => {
      set((state: any) => ({
        autopilotRules: state.autopilotRules.filter((r: AutopilotRule) => r.id !== id),
      }))
    },

    toggleAutopilotRule: (id: string) => {
      set((state: any) => ({
        autopilotRules: state.autopilotRules.map((r: AutopilotRule) =>
          r.id === id ? { ...r, enabled: !r.enabled, updatedAt: now() } : r
        ),
      }))
    },

    setAutopilotEnabled: (enabled: boolean) => {
      set({ autopilotEnabled: enabled })
    },

    // ── Runner ──
    runAutopilotOnNote: (noteId: string) => {
      const state = get()
      if (!state.autopilotEnabled) return null

      const note = state.notes.find((n: Note) => n.id === noteId)
      if (!note || note.trashed || note.archived) return null

      const rules = state.autopilotRules as AutopilotRule[]
      const result = runAutopilot(note, rules, "on_save", 0)

      if (result.applied.length === 0) return null

      // Collect all actions from all matched rules
      const allActions: AutopilotAction[] = result.applied.flatMap((r) => r.actions)

      // Apply all actions to the note
      let updates: Partial<Note> = {}
      for (const action of allActions) {
        updates = { ...updates, ...applyAction(note, action) }
      }

      // Update note
      set((s: any) => ({
        notes: s.notes.map((n: Note) =>
          n.id === noteId ? { ...n, ...updates } : n
        ),
      }))

      // If promoted to permanent, enroll in SRS
      if (updates.status === "permanent" && note.status !== "permanent") {
        get().enrollSRS(noteId)
      }

      // Log the action
      const logEntry: AutopilotLogEntry = {
        id: genId(),
        ruleId: result.applied[0].ruleId,
        ruleName: result.applied[0].ruleName,
        noteId: note.id,
        noteTitle: note.title,
        actions: allActions,
        at: now(),
        undone: false,
      }

      set((s: any) => {
        const log = [...s.autopilotLog, logEntry]
        return { autopilotLog: log.length > MAX_LOG_ENTRIES ? log.slice(-MAX_LOG_ENTRIES) : log }
      })

      appendEvent(noteId, "autopilot_applied", {
        rules: result.applied.map((r) => r.ruleName),
        actions: allActions.map((a) => a.type),
      })

      return logEntry
    },

    // ── Undo ──
    undoAutopilotAction: (logEntryId: string) => {
      const state = get()
      const entry = (state.autopilotLog as AutopilotLogEntry[]).find(
        (e) => e.id === logEntryId && !e.undone
      )
      if (!entry) return false

      const note = state.notes.find((n: Note) => n.id === entry.noteId)
      if (!note) return false

      // Reverse each action
      let reverseUpdates: Partial<Note> = {}
      for (const action of entry.actions) {
        switch (action.type) {
          case "set_status":
            // We can't know the original status perfectly, but we can infer from the rule
            // For Inbox→Capture, reverse to inbox. For Capture→Permanent, reverse to capture.
            if (action.value === "capture") reverseUpdates.status = "inbox"
            else if (action.value === "permanent") reverseUpdates.status = "capture"
            break
          case "set_priority":
            reverseUpdates.priority = "none"
            break
          case "set_label":
            reverseUpdates.labelId = null
            break
          case "set_triage":
            reverseUpdates.triageStatus = "untriaged"
            break
          case "archive":
            reverseUpdates = { ...reverseUpdates, archived: false, archivedAt: null }
            break
          case "pin":
            reverseUpdates.pinned = false
            break
          case "add_tag":
            if (action.value) {
              reverseUpdates.tags = note.tags.filter((t: string) => t !== action.value)
            }
            break
          case "remove_tag":
            if (action.value && !note.tags.includes(action.value)) {
              reverseUpdates.tags = [...note.tags, action.value]
            }
            break
        }
      }

      reverseUpdates.updatedAt = now()
      reverseUpdates.lastTouchedAt = now()

      // If reverting from permanent, unenroll SRS
      if (reverseUpdates.status && reverseUpdates.status !== "permanent" && note.status === "permanent") {
        get().unenrollSRS(entry.noteId)
      }

      set((s: any) => ({
        notes: s.notes.map((n: Note) =>
          n.id === entry.noteId ? { ...n, ...reverseUpdates } : n
        ),
        autopilotLog: s.autopilotLog.map((e: AutopilotLogEntry) =>
          e.id === logEntryId ? { ...e, undone: true } : e
        ),
      }))

      return true
    },

    clearAutopilotLog: () => {
      set({ autopilotLog: [] })
    },
  }
}
