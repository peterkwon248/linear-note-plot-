"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Island } from "@phosphor-icons/react/dist/ssr/Island"
import { LinkSimple } from "@phosphor-icons/react/dist/ssr/LinkSimple"
import { ArrowsClockwise } from "@phosphor-icons/react/dist/ssr/ArrowsClockwise"
import { TrendUp } from "@phosphor-icons/react/dist/ssr/TrendUp"
import { useKnowledgeNudges, type NudgeCard, type NudgeKind } from "@/hooks/use-knowledge-nudges"
import { usePlotStore } from "@/lib/store"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

/**
 * Nudge section for Ontology > Insights.
 *
 * Linear / sabermetrics discipline (mirrors metric-row.tsx):
 *   - 32px row (h-8) — slightly taller than h-7 metric rows because actions live here
 *   - text-2xs everywhere; tabular-nums irrelevant for this section
 *   - Hover bg-hover-bg only; ghost action button on the right
 *
 * Promote nudges open a confirm dialog; everything else fires the action immediately.
 */
export function OntologyNudgeSection({
  /** Hard cap on rendered cards. Section hides entirely when 0 cards survive. */
  limit = 6,
}: {
  limit?: number
}) {
  const cards = useKnowledgeNudges()
  const convertToWiki = usePlotStore((s) => s.convertToWiki)

  const [pendingPromote, setPendingPromote] = useState<NudgeCard | null>(null)

  if (cards.length === 0) return null
  const visible = cards.slice(0, limit)

  function handleClick(card: NudgeCard) {
    if (card.kind === "promote") {
      setPendingPromote(card)
      return
    }
    card.onClick()
  }

  function confirmPromote() {
    if (!pendingPromote) return
    // promote card id encodes the noteId after the colon
    const noteId = pendingPromote.id.split(":")[1]
    if (noteId) {
      convertToWiki(noteId)
      toast.success(`Promoted "${pendingPromote.message}" to wiki`)
    }
    setPendingPromote(null)
  }

  return (
    <>
      <section className="mb-6 border-b border-border/40 pb-4">
        <header className="mb-2 px-2">
          <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            Nudge
          </h3>
          <p className="mt-0.5 text-2xs text-muted-foreground/70">
            Things you can do today
          </p>
        </header>
        <div className="flex flex-col">
          {visible.map((card) => (
            <NudgeRow key={card.id} card={card} onClick={() => handleClick(card)} />
          ))}
        </div>
      </section>

      <AlertDialog
        open={pendingPromote !== null}
        onOpenChange={(open) => !open && setPendingPromote(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to wiki?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">
                {pendingPromote?.message}
              </span>{" "}
              will become a wiki article. Backlinks and content stay intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPromote}>Promote</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function NudgeRow({ card, onClick }: { card: NudgeCard; onClick: () => void }) {
  return (
    <div className="group flex h-10 w-full items-center gap-2 rounded-md px-2 transition-colors duration-100 hover:bg-hover-bg">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground/70">
        {iconFor(card.kind)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-2xs text-foreground">{card.message}</p>
        <p className="truncate text-2xs text-muted-foreground/60">{card.detail}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 rounded-md px-2 py-1 text-2xs text-muted-foreground transition-colors duration-100 hover:bg-secondary hover:text-foreground"
      >
        {card.cta}
      </button>
    </div>
  )
}

function iconFor(kind: NudgeKind) {
  switch (kind) {
    case "orphan":
      return <Island size={13} weight="regular" />
    case "promote":
      return <TrendUp size={13} weight="regular" />
    case "unlinked":
      return <LinkSimple size={13} weight="regular" />
    case "linked":
      return <ArrowsClockwise size={13} weight="regular" />
  }
}
