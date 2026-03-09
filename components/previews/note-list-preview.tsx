"use client"

import * as React from "react"

// Mock data
const mockNotes = [
  {
    id: "1",
    title: "Weekly Planning Framework",
    preview: "A systematic approach to planning the week ahead using time-blocking and priority matrices...",
    status: "permanent" as const,
    linkCount: 5,
    updatedAt: "1h ago",
    pinned: true,
  },
  {
    id: "2",
    title: "Bayesian Decision Making",
    preview: "How to update beliefs based on new evidence and make better decisions under uncertainty...",
    status: "capture" as const,
    linkCount: 3,
    updatedAt: "2h ago",
    pinned: true,
  },
  {
    id: "3",
    title: "Game Theory Applications",
    preview: "Exploring Nash equilibrium and its applications in everyday negotiations and strategy...",
    status: "capture" as const,
    linkCount: 2,
    updatedAt: "3h ago",
    pinned: false,
    group: "Today",
  },
  {
    id: "4",
    title: "Reading Notes: Thinking Fast and Slow",
    preview: "System 1 vs System 2 thinking, cognitive biases, and heuristics that shape our judgments...",
    status: "inbox" as const,
    linkCount: 0,
    updatedAt: "5h ago",
    pinned: false,
    group: "Today",
  },
  {
    id: "5",
    title: "Investment Thesis Template",
    preview: "A structured framework for evaluating investment opportunities and documenting rationale...",
    status: "permanent" as const,
    linkCount: 4,
    updatedAt: "2d ago",
    pinned: false,
    group: "This Week",
  },
  {
    id: "6",
    title: "Probability Fundamentals",
    preview: "Core concepts in probability theory including conditional probability and Bayes theorem...",
    status: "capture" as const,
    linkCount: 6,
    updatedAt: "3d ago",
    pinned: false,
    group: "This Week",
  },
  {
    id: "7",
    title: "Quick capture from podcast",
    preview: "Interesting point about network effects and platform dynamics in two-sided markets...",
    status: "inbox" as const,
    linkCount: 0,
    updatedAt: "5d ago",
    pinned: false,
    group: "Older",
  },
]

// Status icon components - Plot's rounded square identity
function StatusIcon({ status, size = 14 }: { status: "inbox" | "capture" | "permanent"; size?: number }) {
  const radius = size * 0.2

  if (status === "inbox") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
        <rect
          x="2"
          y="2"
          width="12"
          height="12"
          rx={radius * 16 / size}
          stroke="#71717a"
          strokeWidth="1.4"
          fill="none"
        />
      </svg>
    )
  }

  if (status === "capture") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
        <rect x="2" y="2" width="12" height="12" rx="2.5" stroke="#fb923c" strokeWidth="1.4" fill="none" />
        <rect x="2" y="8" width="12" height="6" rx="1" fill="#fb923c" />
      </svg>
    )
  }

  // permanent
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <rect x="2" y="2" width="12" height="12" rx="2.5" fill="#4ade80" />
      <path d="M5.5 8L7.5 10L10.5 6" stroke="#09090b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Icons
function LayoutListIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 4h7" />
      <path d="M14 9h7" />
      <path d="M14 15h7" />
      <path d="M14 20h7" />
    </svg>
  )
}

function Table2Icon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
    </svg>
  )
}

function CalendarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </svg>
  )
}

function FilterIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

function LinkIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function PinIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
    </svg>
  )
}

function FileTextIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-800">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  )
}

function XIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

// Note row component
function NoteRow({
  note,
  isSelected,
  onClick,
}: {
  note: typeof mockNotes[0]
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`
        group cursor-pointer px-4 py-3 rounded-md transition-colors
        ${isSelected ? "bg-zinc-800/50 border-l-2 border-indigo-500 pl-[14px]" : "hover:bg-zinc-800/30"}
      `}
    >
      {/* Line 1: Status + Title + Pin + Links + Date */}
      <div className="flex items-center gap-2">
        <StatusIcon status={note.status} size={14} />
        <span className="flex-1 text-[13px] text-zinc-200 font-normal truncate">
          {note.title}
        </span>
        {note.pinned && (
          <span className="text-zinc-600">
            <PinIcon size={12} />
          </span>
        )}
        {note.linkCount > 0 && (
          <span className="flex items-center gap-0.5 text-[12px] text-zinc-600 tabular-nums">
            <LinkIcon size={12} />
            {note.linkCount}
          </span>
        )}
        <span className="text-[12px] text-zinc-600 tabular-nums">{note.updatedAt}</span>
      </div>
      {/* Line 2: Preview */}
      <div className="mt-1 pl-[22px]">
        <p className="text-[12px] text-zinc-600 truncate">{note.preview}</p>
      </div>
    </div>
  )
}

// Group header
function GroupHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-4 mt-6 mb-2">
      <span className="text-[12px] text-zinc-500 font-medium">{title}</span>
      <span className="text-[11px] text-zinc-600">{count}</span>
    </div>
  )
}

// Filter chip
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-zinc-200 transition-colors">
        <XIcon size={12} />
      </button>
    </span>
  )
}

// Empty state
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] text-center">
      <FileTextIcon size={48} />
      <p className="mt-4 text-[15px] text-zinc-500">No notes yet</p>
      <p className="mt-1 text-[13px] text-zinc-600">
        Create your first note with <span className="text-zinc-400">Cmd+N</span>
      </p>
    </div>
  )
}

// Main component
export default function NoteListPreview() {
  const [viewMode, setViewMode] = React.useState<"list" | "table" | "calendar">("list")
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>("2")
  const [showFilters, setShowFilters] = React.useState(true)
  const [showEmpty, setShowEmpty] = React.useState(false)

  const pinnedNotes = mockNotes.filter((n) => n.pinned)
  const todayNotes = mockNotes.filter((n) => !n.pinned && n.group === "Today")
  const thisWeekNotes = mockNotes.filter((n) => !n.pinned && n.group === "This Week")
  const olderNotes = mockNotes.filter((n) => !n.pinned && n.group === "Older")

  const totalCount = mockNotes.length

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Simulated sidebar placeholder */}
      <div className="flex">
        <div className="w-[220px] shrink-0 h-screen bg-zinc-900/60 border-r border-zinc-800" />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            {/* Left: Title */}
            <h1 className="text-[16px] font-medium text-zinc-100">Notes</h1>

            {/* Center/Right: View toggles + filter + count */}
            <div className="flex items-center gap-4">
              {/* View mode toggle */}
              <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-lg">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-zinc-800 text-zinc-200"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <LayoutListIcon size={14} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "table"
                      ? "bg-zinc-800 text-zinc-200"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Table2Icon size={14} />
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "calendar"
                      ? "bg-zinc-800 text-zinc-200"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <CalendarIcon size={14} />
                </button>
              </div>

              {/* Filter button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1.5 rounded-md transition-colors ${
                  showFilters ? "text-zinc-300" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <FilterIcon size={14} />
              </button>

              {/* Note count */}
              <span className="text-[12px] text-zinc-600">{totalCount} notes</span>

              {/* Toggle empty state (for demo) */}
              <button
                onClick={() => setShowEmpty(!showEmpty)}
                className="text-[11px] text-zinc-700 hover:text-zinc-500 px-2 py-1 border border-zinc-800 rounded"
              >
                {showEmpty ? "Show notes" : "Show empty"}
              </button>
            </div>
          </div>

          {/* Filter chips row */}
          {showFilters && !showEmpty && (
            <div className="flex items-center gap-2 px-6 py-3 border-b border-zinc-800/50">
              <FilterChip label="Status: Capture" onRemove={() => {}} />
              <FilterChip label="Tag: #philosophy" onRemove={() => {}} />
              <button className="text-[12px] text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-800/50 transition-colors">
                Quick filters
              </button>
            </div>
          )}

          {/* Note list */}
          <div className="p-2">
            {showEmpty ? (
              <EmptyState />
            ) : (
              <>
                {/* Pinned section */}
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

                {/* Today group */}
                {todayNotes.length > 0 && (
                  <>
                    <GroupHeader title="Today" count={todayNotes.length} />
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

                {/* This Week group */}
                {thisWeekNotes.length > 0 && (
                  <>
                    <GroupHeader title="This Week" count={thisWeekNotes.length} />
                    {thisWeekNotes.map((note) => (
                      <NoteRow
                        key={note.id}
                        note={note}
                        isSelected={selectedNoteId === note.id}
                        onClick={() => setSelectedNoteId(note.id)}
                      />
                    ))}
                  </>
                )}

                {/* Older group */}
                {olderNotes.length > 0 && (
                  <>
                    <GroupHeader title="Older" count={olderNotes.length} />
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
