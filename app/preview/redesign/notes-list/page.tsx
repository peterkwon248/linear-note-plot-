"use client"

import { useState } from "react"
import { NotesListView } from "@/components/redesign/notes-list/notes-list-view"
import { notesListMock, notesListFlatMock } from "@/components/redesign/notes-list/notes-list.mock"

/**
 * Notes-list surface — isolated render of the pure presentational
 * `NotesListView` driven by mock data.
 *
 * Two variants toggled by a slim toolbar:
 *   - grouped  : status 기준 3개 그룹 (backlog/todo/done)
 *   - flat     : 단일 그룹, sort chip 표시
 *
 * The wrapper gives the surface a flex height so its internal
 * `flex-1 overflow-y-auto` scrolls (live: provided by the app shell).
 */
export default function NotesListPreviewPage() {
  const [variant, setVariant] = useState<"grouped" | "flat">("grouped")
  const vm = variant === "grouped" ? notesListMock : notesListFlatMock

  return (
    <div className="flex h-[calc(100vh-2.25rem)] flex-col">
      {/* Variant switcher — preview-only chrome */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-1.5 text-2xs text-muted-foreground bg-secondary/20">
        <span className="font-medium text-foreground/60">변형:</span>
        {(["grouped", "flat"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            className={`rounded px-2 py-0.5 transition-colors ${
              variant === v
                ? "bg-accent/15 text-foreground font-medium"
                : "hover:bg-hover-bg text-muted-foreground"
            }`}
          >
            {v === "grouped" ? "그룹 (상태별)" : "플랫 (정렬 칩)"}
          </button>
        ))}
        <span className="ml-auto opacity-40">12 notes · {vm.viewState.isGrouped ? `${vm.groups.length}개 그룹` : "그룹 없음"}</span>
      </div>

      <NotesListView vm={vm} />
    </div>
  )
}
