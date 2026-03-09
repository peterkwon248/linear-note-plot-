"use client"

import { useState } from "react"
import {
  LayoutList,
  Table2,
  Calendar,
  Filter,
  Pin,
  Link2,
  FileText,
  Check,
} from "lucide-react"

// ======================
// MOCK DATA
// ======================
const MOCK_NOTES = [
  {
    id: "1",
    title: "Weekly Planning Session",
    preview: "Review Q1 goals and set priorities for the upcoming sprint...",
    status: "permanent" as const,
    pinned: true,
    linkCount: 5,
    updatedAt: "1h ago",
    group: "today",
  },
  {
    id: "2",
    title: "API Design Decisions",
    preview: "REST vs GraphQL considerations for the new microservice architecture...",
    status: "capture" as const,
    pinned: true,
    linkCount: 3,
    updatedAt: "2h ago",
    group: "today",
  },
  {
    id: "3",
    title: "Bayesian Thinking",
    preview: "Notes on updating beliefs with new evidence and probability theory...",
    status: "capture" as const,
    pinned: false,
    linkCount: 2,
    updatedAt: "3h ago",
    group: "today",
  },
  {
    id: "4",
    title: "Decision Framework",
    preview: "A systematic approach to making better decisions under uncertainty...",
    status: "permanent" as const,
    pinned: false,
    linkCount: 7,
    updatedAt: "Yesterday",
    group: "this-week",
  },
  {
    id: "5",
    title: "Game Theory Memo",
    preview: "Key concepts from the game theory workshop and practical applications...",
    status: "inbox" as const,
    pinned: false,
    linkCount: 0,
    updatedAt: "2 days ago",
    group: "this-week",
  },
  {
    id: "6",
    title: "Book Notes: Thinking Fast and Slow",
    preview: "Daniel Kahneman on System 1 and System 2 thinking patterns...",
    status: "capture" as const,
    pinned: false,
    linkCount: 4,
    updatedAt: "Mar 5",
    group: "older",
  },
  {
    id: "7",
    title: "Meeting Notes - Product Sync",
    preview: "Discussion points from the weekly product team synchronization...",
    status: "inbox" as const,
    pinned: false,
    linkCount: 1,
    updatedAt: "Mar 3",
    group: "older",
  },
]

// ======================
// STATUS ICONS (Plot's rounded squares)
// ======================
function StatusIcon({ status, size = 14 }: { status: "inbox" | "capture" | "permanent"; size?: number }) {
  const radius = 2

  if (status === "inbox") {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
        <rect
          x="1.5"
          y="1.5"
          width="11"
          height="11"
          rx={radius}
          stroke="#71717a"
          strokeWidth="1.4"
          fill="none"
        />
      </svg>
    )
  }

  if (status === "capture") {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
        <rect
          x="1.5"
          y="1.5"
          width="11"
          height="11"
          rx={radius}
          stroke="#fb923c"
          strokeWidth="1.4"
          fill="none"
        />
        <rect x="1.5" y="7" width="11" height="5.5" rx={1} fill="#fb923c" />
      </svg>
    )
  }

  // permanent
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="1.5" width="11" height="11" rx={radius} fill="#4ade80" />
      <path
        d="M4.5 7L6.5 9L9.5 5"
        stroke="#09090b"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ======================
// NOTE ROW COMPONENT
// ======================
function NoteRow({
  note,
  isSelected,
  onClick,
}: {
  note: (typeof MOCK_NOTES)[0]
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`
        px-4 py-3 cursor-pointer transition-colors rounded-md
        ${isSelected ? "bg-zinc-800/50 border-l-2 border-indigo-500" : "hover:bg-zinc-800/30"}
      `}
    >
      {/* Line 1 */}
      <div className="flex items-center gap-2">
        <StatusIcon status={note.status} />
        <span className="text-[13px] text-zinc-200 font-normal truncate flex-1">
          {note.title}
        </span>
        {note.pinned && <Pin size={12} className="text-zinc-600 shrink-0" strokeWidth={1.4} />}
        {note.linkCount > 0 && (
          <span className="flex items-center gap-0.5 text-[12px] text-zinc-600 shrink-0">
            <Link2 size={12} strokeWidth={1.4} />
            {note.linkCount}
          </span>
        )}
        <span className="text-[12px] text-zinc-600 shrink-0">{note.updatedAt}</span>
      </div>
      {/* Line 2 */}
      <div className="ml-[22px] mt-1">
        <p className="text-[12px] text-zinc-600 truncate">{note.preview}</p>
      </div>
    </div>
  )
}

// ======================
// GROUP HEADER
// ======================
function GroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-4 mt-6 mb-2">
      <span className="text-[12px] text-zinc-500 font-medium">{label}</span>
      <span className="text-[11px] text-zinc-600">{count}</span>
    </div>
  )
}

// ======================
// EMPTY STATE
// ======================
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <FileText size={48} className="text-zinc-800 mb-4" strokeWidth={1} />
      <p className="text-[15px] text-zinc-500 mb-2">No notes yet</p>
      <p className="text-[13px] text-zinc-600">Create your first note with Cmd+N</p>
    </div>
  )
}

// ======================
// MAIN COMPONENT
// ======================
export default function NoteListPreview() {
  const [viewMode, setViewMode] = useState<"list" | "table" | "calendar">("list")
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [showEmpty, setShowEmpty] = useState(false)
  const [filters, setFilters] = useState<string[]>(["Status: Capture", "Tag: #philosophy"])

  const notes = showEmpty ? [] : MOCK_NOTES
  const pinnedNotes = notes.filter((n) => n.pinned)
  const todayNotes = notes.filter((n) => !n.pinned && n.group === "today")
  const weekNotes = notes.filter((n) => !n.pinned && n.group === "this-week")
  const olderNotes = notes.filter((n) => !n.pinned && n.group === "older")

  const removeFilter = (filter: string) => {
    setFilters(filters.filter((f) => f !== filter))
  }

  return (
    <div className="h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h1 className="text-[16px] text-zinc-100 font-medium">Notes</h1>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-900 rounded-md p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "list" ? "bg-zinc-800 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <LayoutList size={14} strokeWidth={1.4} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "table" ? "bg-zinc-800 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Table2 size={14} strokeWidth={1.4} />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "calendar" ? "bg-zinc-800 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Calendar size={14} strokeWidth={1.4} />
            </button>
          </div>

          {/* Filter Button */}
          <button className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
            <Filter size={14} strokeWidth={1.4} />
          </button>

          {/* Note Count */}
          <span className="text-[12px] text-zinc-600">{notes.length} notes</span>
        </div>
      </div>

      {/* FILTER CHIPS */}
      {filters.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => removeFilter(filter)}
              className="flex items-center gap-1 px-2 py-1 text-[12px] rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 transition-colors"
            >
              {filter}
              <span className="ml-1 text-zinc-500">x</span>
            </button>
          ))}
          <button className="px-2 py-1 text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors">
            Quick filters
          </button>
        </div>
      )}

      {/* Toggle empty state for demo */}
      <div className="px-4 py-2 border-b border-zinc-800">
        <button
          onClick={() => setShowEmpty(!showEmpty)}
          className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          [{showEmpty ? "Show notes" : "Show empty state"}]
        </button>
      </div>

      {/* NOTE LIST */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="pb-8">
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div className="mb-4">
                {pinnedNotes.map((note) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    isSelected={selectedNoteId === note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                  />
                ))}
              </div>
            )}

            {/* Today */}
            {todayNotes.length > 0 && (
              <>
                <GroupHeader label="Today" count={todayNotes.length} />
                {todayNotes.map((note) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    isSelected={selectedNoteId === note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                  />
                ))}
              </>
            )}

            {/* This Week */}
            {weekNotes.length > 0 && (
              <>
                <GroupHeader label="This Week" count={weekNotes.length} />
                {weekNotes.map((note) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    isSelected={selectedNoteId === note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                  />
                ))}
              </>
            )}

            {/* Older */}
            {olderNotes.length > 0 && (
              <>
                <GroupHeader label="Older" count={olderNotes.length} />
                {olderNotes.map((note) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    isSelected={selectedNoteId === note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
