"use client"

export type OntologyTabKey = "graph" | "insights"

/**
 * Compact 32px tab strip below ViewHeader. Linear pattern:
 *   - inactive: muted foreground, hover lifts to foreground
 *   - active: full foreground + 2px bottom border
 *   - no chips, no pills, no rounded backgrounds
 */
export function OntologyTabBar({
  tab,
  onChange,
}: {
  tab: OntologyTabKey
  onChange: (tab: OntologyTabKey) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Ontology view"
      className="flex h-8 shrink-0 items-end gap-0 border-b border-border/60 px-3"
    >
      <Tab active={tab === "graph"} label="Graph" onClick={() => onChange("graph")} />
      <Tab active={tab === "insights"} label="Insights" onClick={() => onChange("insights")} />
    </div>
  )
}

function Tab({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "relative inline-flex h-8 items-center px-3 text-2xs font-medium transition-colors duration-100 " +
        (active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground")
      }
    >
      {label}
      {active && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[-1px] left-2 right-2 h-[2px] rounded-sm bg-foreground"
        />
      )}
    </button>
  )
}
