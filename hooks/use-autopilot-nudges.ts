"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"
import { buildSRSMapFromHooks } from "@/lib/store/hook-selectors"
import { useT } from "@/lib/i18n"

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
  // Phase 1b2: SRS due counter derives from the unified `hooks` slice.
  const hooks = usePlotStore((s) => s.hooks)
  const srsMap = buildSRSMapFromHooks(hooks)
  const clusterSuggestions = usePlotStore((s) => s.clusterSuggestions)
  const setPendingWikiAssembly = usePlotStore((s) => s.setPendingWikiAssembly)
  const firedRef = useRef(false)
  const router = useRouter()
  const t = useT()

  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true

    const timer = setTimeout(() => {
      // (removed 2026-06-05) Backlog nudge — `backlog` is Plot's DEFAULT resting
      // status, so "{n} notes waiting for triage" fired whenever any backlog note
      // existed, i.e. on virtually every normal session. That made it triage spam
      // rather than a signal. Removed. The SRS + cluster nudges below are genuine
      // event-driven signals (something became due / a cluster formed) and stay.

      // SRS due nudge
      setTimeout(() => {
        const now = Date.now()
        const dueCount = Object.values(srsMap).filter(
          (s) => new Date(s.dueAt).getTime() < now
        ).length

        if (dueCount > 0 && !isOnCooldown("srs-due")) {
          setCooldown("srs-due")
          toast(t("nudge.srs.title"), {
            description: t("nudge.srs.desc").replace("{count}", String(dueCount)),
            action: {
              label: t("nudge.srs.action"),
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
          const conceptLabel = top.conceptTitles[0] ?? t("nudge.cluster.fallback")
          toast(t("nudge.cluster.title").replace("{concept}", conceptLabel), {
            description: t("nudge.cluster.desc").replace("{count}", String(top.noteIds.length)),
            action: {
              label: t("nudge.cluster.action"),
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
