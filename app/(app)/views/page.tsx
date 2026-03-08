"use client"

import { LayoutList, Table2, Check } from "lucide-react"
import { useSettingsStore } from "@/lib/settings-store"

const VIEW_OPTIONS = [
  {
    id: "list" as const,
    label: "List",
    description: "Card-style layout showing title, preview, and metadata",
    icon: LayoutList,
  },
  {
    id: "table" as const,
    label: "Table",
    description: "Spreadsheet-style layout with sortable columns",
    icon: Table2,
  },
]

export default function ViewsPage() {
  const viewMode = useSettingsStore((s) => s.viewMode)
  const setViewMode = useSettingsStore((s) => s.setViewMode)

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      <header className="shrink-0 px-5 pt-5 pb-1">
        <h1 className="text-base font-semibold text-foreground">Views</h1>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Choose how notes are displayed across the app.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-2 gap-3 max-w-lg">
          {VIEW_OPTIONS.map((opt) => {
            const active = viewMode === opt.id
            const Icon = opt.icon
            return (
              <button
                key={opt.id}
                onClick={() => setViewMode(opt.id)}
                className={`relative flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                  active
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-muted-foreground/30 hover:bg-secondary/30"
                }`}
              >
                {active && (
                  <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                    <Check className="h-3 w-3 text-accent-foreground" />
                  </div>
                )}
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-md ${
                    active
                      ? "bg-accent/10 text-accent"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[13px] font-medium text-foreground">
                    {opt.label}
                  </span>
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </main>
  )
}
