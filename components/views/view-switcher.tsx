"use client"

/**
 * v3 ViewSwitcher — segmented control for swapping between view modes.
 *
 * Mockup ref: `docs/v3-mockup/plot-v3-unified.css:7-37` (`.u-vs`).
 *
 * Phase 5.1 scope is intentionally narrow — only Table (`list`) and Gallery
 * are exposed here. Studio / Editorial / Graph land in subsequent PRs and
 * will plug into the same union type without touching this component's shape.
 */

import { Table } from "@phosphor-icons/react/dist/ssr/Table"
import { GridFour } from "@phosphor-icons/react/dist/ssr/GridFour"
import type { ViewMode } from "@/lib/view-engine/types"

/** Subset of ViewMode that this PR's switcher exposes. */
export type ViewSwitcherMode = Extract<ViewMode, "list" | "gallery">

interface ViewSwitcherProps {
  value: ViewSwitcherMode
  onChange: (mode: ViewSwitcherMode) => void
}

const MODES: { id: ViewSwitcherMode; label: string; Icon: typeof Table }[] = [
  { id: "list",    label: "Table",   Icon: Table },
  { id: "gallery", label: "Gallery", Icon: GridFour },
]

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return (
    <div className="u-vs" role="tablist" aria-label="View mode">
      {MODES.map(({ id, label, Icon }) => {
        const active = value === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            className="u-vs__btn"
            data-active={active ? "true" : undefined}
            onClick={() => onChange(id)}
            title={label}
          >
            <Icon size={14} weight="regular" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
