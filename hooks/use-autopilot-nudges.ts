"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"
import { buildSRSMapFromHooks } from "@/lib/store/hook-selectors"
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
  // Phase 1b2: SRS due counter derives from the unified `hooks` slice.
  const hooks = usePlotStore((s) => s.hooks)
  const srsMap = buildSRSMapFromHooks(hooks)
  const clusterSuggestions = usePlotStore((s) => s.clusterSuggestions)
  const setPendingWikiAssembly = usePlotStore((s) => s.setPendingWikiAssembly)
  const firedRef = useRef(false)
  const router = useRouter()

  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true

    const timer = setTimeout(() => {
      // Backlog nudge — the onboarding "welcome-note" (seeds.ts WELCOME_NOTE)
      // is excluded so a brand-new user isn't nudged to "triage" the seeded
      // welcome note on first launch (it's onboarding content, not a real
      // untriaged note). Backlog is the default resting status, so a fresh
      // install (welcome note only) should produce no nudge.
      const inboxCount = notes.filter(
        (n) => n.status === "backlog" && !n.trashed && n.id !== "welcome-note"
      ).length

      if (inboxCount > 0 && !isOnCooldown("backlog-waiting")) {
        setCooldown("backlog-waiting")
        toast("Backlog needs attention", {
          description: `${inboxCount} ${inboxCount === 1 ? "note" : "notes"} waiting for triage`,
          action: {
            label: "Open Backlog",
            onClick: () => {
              setActiveRoute("/backlog")
              router.push("/backlog")
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

      // Wiki cluster nudge
      setTimeout(() => {
        const pending = (clusterSuggestions ?? []).filter((s: any) => s.status === "pending")
        if (pending.length > 0 && !isOnCooldown("wiki-cluster")) {
          const top = pending[0]
          setCooldown("wiki-cluster")
          const conceptLabel = top.conceptTitles[0] ?? "related notes"
          toast(`"${conceptLabel}" cluster detected`, {
            description: `${top.noteIds.length} notes form a knowledge cluster`,
            action: {
              label: "Create Wiki",
              onClick: () => {
                setPendingWikiAssembly(top.noteIds)
              },
            },
            duration: 10000,
          })
        }
      }, 4000)
    }, 1000)

    return () => clearTimeout(timer)
  }, []) // intentionally empty deps — fire once on mount
}
