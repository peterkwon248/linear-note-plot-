"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"

/* ── Cooldown helpers ──────────────────────────────────── */

const COOLDOWN_KEY = "plot-nudge-cooldowns"
const COOLDOWN_HOURS = 4

function getCooldowns(): Record<string, number> {
  try {
    const raw = localStorage.getItem(COOLDOWN_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function isOnCooldown(type: string): boolean {
  const cooldowns = getCooldowns()
  const last = cooldowns[type]
  if (!last) return false
  return Date.now() - last < COOLDOWN_HOURS * 60 * 60 * 1000
}

function setCooldown(type: string): void {
  const cooldowns = getCooldowns()
  cooldowns[type] = Date.now()
  localStorage.setItem(COOLDOWN_KEY, JSON.stringify(cooldowns))
}

/* ── Hook ──────────────────────────────────────────────── */

export function useAutopilotNudges(): void {
  const notes = usePlotStore((s) => s.notes)
  const srsMap = usePlotStore((s) => s.srsStateByNoteId)
  const firedRef = useRef(false)
  const router = useRouter()

  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true

    const timer = setTimeout(() => {
      // Inbox nudge
      const inboxCount = notes.filter(
        (n) => n.status === "inbox" && !n.archived && !n.trashed
      ).length

      if (inboxCount > 0 && !isOnCooldown("inbox-waiting")) {
        setCooldown("inbox-waiting")
        toast("Inbox needs attention", {
          description: `${inboxCount} ${inboxCount === 1 ? "note" : "notes"} waiting for triage`,
          action: {
            label: "Open Inbox",
            onClick: () => {
              setActiveRoute("/inbox")
              router.push("/inbox")
            },
          },
          duration: 8000,
        })
      }

      // SRS due nudge — slightly delayed to avoid toast stacking
      setTimeout(() => {
        const now = Date.now()
        const dueCount = Object.values(srsMap).filter(
          (s) => new Date(s.dueAt).getTime() < now
        ).length

        if (dueCount > 0 && !isOnCooldown("srs-due")) {
          setCooldown("srs-due")
          toast("SRS review due", {
            description: `${dueCount} ${dueCount === 1 ? "note" : "notes"} ready for review`,
            action: {
              label: "Open Review",
              onClick: () => {
                router.push("/review")
              },
            },
            duration: 8000,
          })
        }
      }, 2000)
    }, 1000)

    return () => clearTimeout(timer)
  }, []) // intentionally empty deps — fire once on mount
}
