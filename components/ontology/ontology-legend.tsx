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
 *   - 색: WIKI_STATUS_HEX + NOTE_STATUS_HEX (변경 X — chart-N 금지 룰 유지)
 *   - icons: Plot이 정의한 entity icon system 그대로 (IconStone / IconBrick /
 *     IconBlock / IconWikiStub / IconWikiArticle / Lightning / Sparkle /
 *     PencilSimple)
 *
 * EDGES section은 별도 PR (scope ↓). 이번 PR은 node legend만.
 */

import { useState } from "react"
import { IconStone, IconBrick, IconBlock, IconWikiStub, IconWikiArticle } from "@/components/plot-icons"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { NOTE_STATUS_HEX, WIKI_STATUS_HEX, SPACE_COLORS } from "@/lib/colors"
import { cn } from "@/lib/utils"

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
        title={open ? "Collapse legend" : "Expand legend"}
      >
        {open ? <CaretDown size={10} weight="bold" /> : <CaretRight size={10} weight="bold" />}
        Legend
      </button>

      {open && (
        <div className="border-t border-border-subtle pb-1.5">
          {/* NOTES */}
          <GroupHeader label="Notes" />
          <LegendRow
            icon={<IconStone size={13} />}
            label="Stone"
            color={NOTE_STATUS_HEX.stone}
          />
          <LegendRow
            icon={<IconBrick size={13} />}
            label="Brick"
            color={NOTE_STATUS_HEX.brick}
          />
          <LegendRow
            icon={<IconBlock size={13} />}
            label="Block"
            color={NOTE_STATUS_HEX.keystone}
          />

          {/* WIKI */}
          <GroupHeader label="Wiki" />
          <LegendRow
            icon={<IconWikiStub size={13} />}
            label="Stub"
            color={WIKI_STATUS_HEX.stub}
          />
          <LegendRow
            icon={<IconWikiArticle size={13} />}
            label="Article"
            color={WIKI_STATUS_HEX.article}
          />

          {/* BOOKS — kind icons (Smart/Hybrid/Manual). Color is per-book
              (book.color), not fixed by kind, so we use a neutral muted
              tone here; the canvas itself shows the actual book hull color. */}
          <GroupHeader label="Books" />
          <LegendRow
            icon={<Lightning size={13} weight="regular" />}
            label="Smart"
          />
          <LegendRow
            icon={<Sparkle size={13} weight="regular" />}
            label="Hybrid"
          />
          <LegendRow
            icon={<PencilSimple size={13} weight="regular" />}
            label="Manual"
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
              <span>Wiki entity</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
