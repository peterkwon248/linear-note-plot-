"use client"

import { useState } from "react"
import { SidebarView } from "@/components/redesign/sidebar/sidebar-view"
import {
  notesContextMock,
  notesShellMock,
  homeContextMock,
  homeShellMock,
} from "@/components/redesign/sidebar/sidebar.mock"

/**
 * Sidebar surface — isolated render of the pure presentational `SidebarView`
 * driven by mock data. This is the exact unit handed to Open Design.
 *
 * The live sidebar is a fixed-width panel (store `sidebarWidth`, default 220px —
 * lib/store/index.ts:72) inside the app shell. The wrapper here reproduces that:
 * a 220px column with the live sidebar background (`.a-sidebar` resolves
 * `var(--sidebar-bg)`) and full height so the inner `flex-1 overflow-y-auto` nav
 * scrolls.
 *
 * A local context switcher (Notes / Home) lets us render both ported contexts —
 * the live god switches these off `useActiveSpace()`; here it's a `useState`
 * toggle that swaps which `SidebarContextModel` + shell label is passed in.
 */
export default function SidebarPreviewPage() {
  const [ctx, setCtx] = useState<"notes" | "home">("notes")

  const vm = ctx === "notes" ? notesShellMock : homeShellMock
  const context = ctx === "notes" ? notesContextMock : homeContextMock

  return (
    <div className="flex h-[calc(100vh-2.25rem)] flex-col">
      {/* Context switcher (preview-only; not part of the handoff unit). */}
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-4 py-2">
        <span className="mr-2 text-2xs uppercase tracking-wider text-muted-foreground">
          Context
        </span>
        {(["notes", "home"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCtx(c)}
            className={
              "rounded-md px-2.5 py-1 text-2xs font-medium transition-colors " +
              (ctx === c
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {c === "notes" ? "Notes" : "Home"}
          </button>
        ))}
      </div>

      {/* Fixed-width sidebar column (live: 220px) on the app background. */}
      <div className="flex min-h-0 flex-1 bg-background">
        <div className="h-full w-[220px] shrink-0">
          <SidebarView vm={vm} context={context} />
        </div>
      </div>
    </div>
  )
}
