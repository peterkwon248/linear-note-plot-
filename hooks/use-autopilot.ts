"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"

/**
 * Returns a function that runs autopilot rules on a note after save.
 * Shows a quiet toast with undo if any rules fired.
 */
export function useAutopilotRunner() {
  const runAutopilotOnNote = usePlotStore((s) => s.runAutopilotOnNote)
  const undoAutopilotAction = usePlotStore((s) => s.undoAutopilotAction)

  const runOnNote = useCallback(
    (noteId: string) => {
      const logEntry = runAutopilotOnNote(noteId)
      if (!logEntry) return

      const actionLabels = logEntry.actions.map((a) => {
        switch (a.type) {
          case "set_status": return `→ ${a.value}`
          case "set_priority": return `priority: ${a.value}`
          case "set_label": return "label assigned"
          case "set_triage": return `triage: ${a.value}`
          case "pin": return "pinned"
          case "add_tag": return "tag added"
          case "remove_tag": return "tag removed"
          default: return a.type
        }
      })

      toast(`Autopilot: ${logEntry.ruleName}`, {
        description: actionLabels.join(", "),
        action: {
          label: "Undo",
          onClick: () => {
            undoAutopilotAction(logEntry.id)
            toast("Autopilot action undone")
          },
        },
        duration: 6000,
      })
    },
    [runAutopilotOnNote, undoAutopilotAction]
  )

  return runOnNote
}
