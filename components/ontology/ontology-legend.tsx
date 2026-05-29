"use client"

/**
 * OntologyLegend — graph color/shape key.
 *
 * 색=status / 모양=공간 (2026-05-29): 노드 색은 4단계 status(노트·위키 공통),
 * 모양은 공간(○ Note=circle / ⬡ Wiki=hexagon). Books는 kind 아이콘(색은 per-book).
 *
 * 두 축을 분리한 이유: status 4단계가 노트·위키 공통이 되면서, 예전처럼
 * NOTES(status) / WIKI(entity violet)로 섞으면 "위키 status는 어디?"가 됨.
 * → STATUS(색) + TYPE(모양) 축 분리로 명확화. wiki violet(entity) 표기 폐기.
 *
 * 라이트모드 가독: GroupHeader 대비 강화(/70 제거), status는 채움 dot(outline
 * 아이콘보다 라이트 배경에서 잘 읽힘).
 */

import { useState } from "react"
import { ChevronDown as CaretDown, ChevronRight as CaretRight } from "lucide-react"
import { NOTE_STATUS_HEX } from "@/lib/colors"
import { BookKindIcon } from "@/components/property-chips"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n"

function GroupHeader({ label }: { label: string }) {
  return (
    <div className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
  )
}

function LegendRow({
  glyph,
  label,
  color,
}: {
  glyph: React.ReactNode
  label: string
  color?: string
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <span
        className="flex h-3.5 w-3.5 shrink-0 items-center justify-center"
        style={color ? { color } : undefined}
      >
        {glyph}
      </span>
      <span className="text-note text-foreground">{label}</span>
    </div>
  )
}

/** Status swatch — same dot shape; the COLOR carries the 4-stage meaning. */
function StatusDot({ color }: { color: string }) {
  return <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
}

/** Note shape — circle outline (neutral; the SHAPE carries the space). */
function CircleGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden>
      <circle cx="6.5" cy="6.5" r="4.3" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

/** Wiki shape — hexagon + cube wireframe, mirroring the graph wiki node
 *  (pointy-top hexagon + center→{top, bottom-right, bottom-left} lines). */
function HexGlyph() {
  const cx = 6.5
  const cy = 6.5
  const s = 4.7
  const pts: Array<[number, number]> = [
    [cx, cy - s], // 0 top
    [cx + s * 0.87, cy - s * 0.5], // 1 top-right
    [cx + s * 0.87, cy + s * 0.5], // 2 bottom-right
    [cx, cy + s], // 3 bottom
    [cx - s * 0.87, cy + s * 0.5], // 4 bottom-left
    [cx - s * 0.87, cy - s * 0.5], // 5 top-left
  ]
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden>
      <polygon
        points={pts.map((p) => `${p[0]},${p[1]}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <line x1={cx} y1={cy} x2={pts[0][0]} y2={pts[0][1]} stroke="currentColor" strokeWidth="0.85" opacity={0.55} />
      <line x1={cx} y1={cy} x2={pts[2][0]} y2={pts[2][1]} stroke="currentColor" strokeWidth="0.85" opacity={0.55} />
      <line x1={cx} y1={cy} x2={pts[4][0]} y2={pts[4][1]} stroke="currentColor" strokeWidth="0.85" opacity={0.55} />
    </svg>
  )
}

export function OntologyLegend({ className }: { className?: string }) {
  const [open, setOpen] = useState(true)
  const t = useT()

  return (
    <div
      className={cn(
        // Linear-faithful — translucent surface with subtle border.
        "pointer-events-auto select-none rounded-md border border-border-subtle bg-card/85 backdrop-blur-sm shadow-sm",
        "w-44 text-foreground",
        className,
      )}
    >
      {/* Toggle header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        title={t("ontology.legend")}
      >
        {open ? <CaretDown size={10} strokeWidth={2.5} /> : <CaretRight size={10} strokeWidth={2.5} />}
        {t("ontology.legend")}
      </button>

      {open && (
        <div className="border-t border-border-subtle pb-1.5">
          {/* STATUS — color axis (notes + wiki share the same 4-stage colors). */}
          <GroupHeader label={t("ontology.legend.status")} />
          <LegendRow glyph={<StatusDot color={NOTE_STATUS_HEX.backlog} />} label={t("status.backlog")} />
          <LegendRow glyph={<StatusDot color={NOTE_STATUS_HEX.todo} />} label={t("status.todo")} />
          <LegendRow glyph={<StatusDot color={NOTE_STATUS_HEX.in_progress} />} label={t("status.in_progress")} />
          <LegendRow glyph={<StatusDot color={NOTE_STATUS_HEX.done} />} label={t("status.done")} />

          {/* TYPE — shape axis (note=circle, wiki=hexagon). Neutral tone. */}
          <GroupHeader label={t("ontology.legend.type")} />
          <LegendRow glyph={<CircleGlyph />} label={t("ontology.legend.notes")} />
          <LegendRow glyph={<HexGlyph />} label={t("ontology.legend.wiki")} />

          {/* BOOKS — kind icons via BookKindIcon (parity with book cards/rows):
              Smart=violet, Hybrid=amber, Manual=neutral(의도적 무채색). Book은
              graph에서 노드가 아니라 hull(영역)이라 TYPE이 아닌 별도 섹션. */}
          <GroupHeader label={t("ontology.legend.books")} />
          <LegendRow glyph={<BookKindIcon kind="smart" size={13} />} label={t("ontology.legend.smart")} />
          <LegendRow glyph={<BookKindIcon kind="hybrid" size={13} />} label={t("ontology.legend.hybrid")} />
          <LegendRow glyph={<BookKindIcon kind="manual" size={13} />} label={t("ontology.legend.manual")} />
        </div>
      )}
    </div>
  )
}
