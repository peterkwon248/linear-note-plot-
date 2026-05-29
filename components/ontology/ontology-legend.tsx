"use client"

/**
 * OntologyLegend — graph color/icon key (Option A + B combined).
 *
 * TODO.md P1 #3 (2026-05-14): 사용자 시그널 — 색 충돌 (Brick orange ↔ Stub
 * orange, Block emerald ↔ Article emerald) + Light mode 가시성. 단순 dot
 * 대신 entity 그룹 헤더 (NOTES / WIKI / BOOKS) + status별 icon silhouette로
 * 의미 차이 명확히.
 *
 * 영구 LOCKED:
 *   - 색: NOTE_STATUS_HEX (변경 X — chart-N 금지 룰 유지). v151: wiki status도
 *     Notes와 통일되어 NOTE_STATUS_HEX 공유 (WIKI_STATUS_HEX 폐기).
 *   - icons: Plot이 정의한 entity icon system 그대로 (IconBacklog/Todo/
 *     InProgress/Done / IconWiki(entity glyph) / Lightning / Sparkle /
 *     PencilSimple)
 *
 * EDGES section은 별도 PR (scope ↓). 이번 PR은 node legend만.
 */

import { useState } from "react"
import { IconBacklog, IconTodo, IconInProgress, IconDone, IconWiki } from "@/components/plot-icons"
import { Zap as Lightning, Sparkles as Sparkle, Pencil as PencilSimple, ChevronDown as CaretDown, ChevronRight as CaretRight } from "lucide-react"
import { NOTE_STATUS_HEX, SPACE_COLORS } from "@/lib/colors"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n"

function GroupHeader({ label }: { label: string }) {
  return (
    <div className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
      {label}
    </div>
  )
}

function LegendRow({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode
  label: string
  color?: string
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <span
        className="flex h-3.5 w-3.5 shrink-0 items-center justify-center"
        style={color ? { color } : undefined}
      >
        {icon}
      </span>
      <span className="text-note text-foreground">{label}</span>
    </div>
  )
}

export function OntologyLegend({ className }: { className?: string }) {
  const [open, setOpen] = useState(true)
  const t = useT()

  return (
    <div
      className={cn(
        // Linear-faithful — translucent dark surface with subtle border.
        "pointer-events-auto select-none rounded-md border border-border-subtle bg-card/85 backdrop-blur-sm shadow-sm",
        // Width clamps to content; collapsed state shrinks to header only.
        "w-44 text-foreground",
        className,
      )}
    >
      {/* Toggle header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        title={open ? t("ontology.legend") : t("ontology.legend")}
      >
        {open ? <CaretDown size={10} strokeWidth={2.5} /> : <CaretRight size={10} strokeWidth={2.5} />}
        {t("ontology.legend")}
      </button>

      {open && (
        <div className="border-t border-border-subtle pb-1.5">
          {/* NOTES */}
          <GroupHeader label={t("ontology.legend.notes")} />
          <LegendRow
            icon={<IconBacklog size={13} />}
            label={t("status.backlog")}
            color={NOTE_STATUS_HEX.backlog}
          />
          <LegendRow
            icon={<IconTodo size={13} />}
            label={t("status.todo")}
            color={NOTE_STATUS_HEX.todo}
          />
          <LegendRow
            icon={<IconInProgress size={13} />}
            label={t("status.in_progress")}
            color={NOTE_STATUS_HEX.in_progress}
          />
          <LegendRow
            icon={<IconDone size={13} />}
            label={t("status.done")}
            color={NOTE_STATUS_HEX.done}
          />

          {/* WIKI — v151: wiki articles share the SAME 4-stage status as Notes
              (above). Graph wiki NODES are colored by the wiki entity color
              (violet), so the legend shows a single Wiki entity glyph here
              rather than a separate status sub-list. */}
          <GroupHeader label={t("ontology.legend.wiki")} />
          <LegendRow
            icon={<IconWiki size={13} />}
            label={t("ontology.legend.wiki")}
            color={SPACE_COLORS.wiki}
          />

          {/* BOOKS — kind icons (Smart/Hybrid/Manual). Color is per-book
              (book.color), not fixed by kind, so we use a neutral muted
              tone here; the canvas itself shows the actual book hull color. */}
          <GroupHeader label={t("ontology.legend.books")} />
          <LegendRow
            icon={<Lightning size={13} strokeWidth={2} />}
            label={t("ontology.legend.smart")}
          />
          <LegendRow
            icon={<Sparkle size={13} strokeWidth={2} />}
            label={t("ontology.legend.hybrid")}
          />
          <LegendRow
            icon={<PencilSimple size={13} strokeWidth={2} />}
            label={t("ontology.legend.manual")}
          />

          {/* Wiki entity vs Article state — explicit note about the
              entity vs publication-state color split (avoids "why is the
              article green AND the entity violet?" confusion). Compact
              one-line footnote, muted. */}
          <div className="mx-2 mt-1.5 border-t border-border-subtle pt-1.5 pb-0.5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: SPACE_COLORS.wiki }}
              />
              <span>{t("ontology.legend.wiki_entity")}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
