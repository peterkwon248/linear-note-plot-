import type { ReactNode } from "react"
import type { SortField, ViewMode, GroupBy } from "./types"
import { CircleDashed, CircleHalf, CheckCircle } from "@phosphor-icons/react"
import { NOTE_STATUS_HEX } from "@/lib/colors"

export interface FilterCategory {
  key: string
  label: string
  icon: ReactNode
  values: FilterValue[]
}

export interface FilterValue {
  key: string
  label: string
  color?: string
  count?: number
  icon?: ReactNode
}

export interface QuickFilter {
  label: string
  desc: string
  rules: Array<{ field: string; operator: string; value: string }>
}

export interface DisplayConfig {
  orderingOptions: Array<{ value: SortField; label: string }>
  groupingOptions: Array<{ value: GroupBy; label: string }>
  toggles: Array<{ key: string; label: string; icon?: ReactNode }>
  properties: Array<{ key: string; label: string; icon?: ReactNode }>
  supportedModes?: ViewMode[]
}

export interface ViewConfig {
  showFilter: boolean
  showDisplay: boolean
  showDetailPanel: boolean
  filterCategories: FilterCategory[]
  quickFilters: QuickFilter[]
  displayConfig: DisplayConfig
}

// SVG Icons (14px, strokeWidth 1.2)
const StatusIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 2.5a5.5 5.5 0 010 11" fill="currentColor" opacity="0.15"/></svg>
const PriorityIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><line x1="3" y1="13" x2="3" y2="10"/><line x1="6.5" y1="13" x2="6.5" y2="7"/><line x1="10" y1="13" x2="10" y2="4"/><line x1="13" y1="13" x2="13" y2="2"/></svg>
const FolderIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"><path d="M14 12.5a1 1 0 01-1 1H3a1 1 0 01-1-1V3.5a1 1 0 011-1h3.5l1.5 2H13a1 1 0 011 1z"/></svg>
const LabelIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 4.5h12l2.5 3.5-2.5 3.5h-12z"/></svg>
const TagIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"><path d="M8.5 1.5H2v6.5l5.65 5.65a1 1 0 001.41 0l4.59-4.59a1 1 0 000-1.41z"/><circle cx="5" cy="5" r="1" fill="currentColor" stroke="none"/></svg>
const SourceIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><line x1="1.5" y1="8" x2="14.5" y2="8"/><path d="M8 2a10.5 10.5 0 013 6 10.5 10.5 0 01-3 6 10.5 10.5 0 01-3-6 10.5 10.5 0 013-6z"/></svg>
const CalendarIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="12" height="11" rx="1.5"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="5.3" y1="1.3" x2="5.3" y2="4.7"/><line x1="10.7" y1="1.3" x2="10.7" y2="4.7"/></svg>
const LinkIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.7 8.7a3.3 3.3 0 005 .4l2-2a3.3 3.3 0 00-4.7-4.7L8.4 3"/><path d="M9.3 7.3a3.3 3.3 0 00-5-.4l-2 2a3.3 3.3 0 004.7 4.7l.6-.6"/></svg>
const ContentIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><line x1="2.5" y1="4" x2="13.5" y2="4"/><line x1="2.5" y1="8" x2="10" y2="8"/><line x1="2.5" y1="12" x2="7" y2="12"/></svg>
const PinIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="11" x2="8" y2="15"/><path d="M3.5 11h9V9.8a1.3 1.3 0 00-.7-1.2L10.5 8A1.3 1.3 0 0110 7V4h.5a1.3 1.3 0 000-2.7h-5a1.3 1.3 0 100 2.7H6v3a1.3 1.3 0 01-.5 1l-1.3.6a1.3 1.3 0 00-.7 1.2z"/></svg>
const ArchiveIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="2" width="13" height="3" rx="1"/><path d="M2.5 5v8a1.3 1.3 0 001.3 1.3h8.4A1.3 1.3 0 0013.5 13V5"/><line x1="6" y1="8.5" x2="10" y2="8.5"/></svg>
const TrashIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 4 3.3 4 14 4"/><path d="M12.7 4v9a1.3 1.3 0 01-1.4 1.3H4.7A1.3 1.3 0 013.3 13V4m2 0V2.7a1.3 1.3 0 011.4-1.4h2.6a1.3 1.3 0 011.4 1.4V4"/></svg>
const SortIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><line x1="2.5" y1="4" x2="10" y2="4"/><line x1="2.5" y1="8" x2="7.5" y2="8"/><line x1="2.5" y1="12" x2="5" y2="12"/></svg>
const GraphIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="3.3" r="1.7"/><circle cx="3.3" cy="12.7" r="1.7"/><circle cx="12.7" cy="12.7" r="1.7"/><line x1="8" y1="5" x2="3.3" y2="11"/><line x1="8" y1="5" x2="12.7" y2="11"/><line x1="5" y1="12.7" x2="11" y2="12.7"/></svg>
const EyeIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 8s2.7-5 7-5 7 5 7 5-2.7 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>

export const NOTES_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: true,
  filterCategories: [
    { key: "status", label: "Status", icon: StatusIcon, values: [
      { key: "inbox", label: "Inbox", color: "rgba(255,255,255,0.32)", icon: <CircleDashed size={14} weight="regular" style={{ color: NOTE_STATUS_HEX.inbox }} /> },
      { key: "capture", label: "Capture", color: "#f5a623", icon: <CircleHalf size={14} weight="fill" style={{ color: NOTE_STATUS_HEX.capture }} /> },
      { key: "permanent", label: "Permanent", color: "#45d483", icon: <CheckCircle size={14} weight="fill" style={{ color: NOTE_STATUS_HEX.permanent }} /> },
    ]},
    { key: "folder", label: "Folder", icon: FolderIcon, values: [] },
    { key: "label", label: "Label", icon: LabelIcon, values: [] },
    { key: "tags", label: "Tags", icon: TagIcon, values: [] },
    { key: "source", label: "Source", icon: SourceIcon, values: [
      { key: "manual", label: "Manual" },
      { key: "webclip", label: "Web Clip" },
      { key: "import", label: "Import" },
    ]},
    { key: "updatedAt", label: "Dates", icon: CalendarIcon, values: [
      { key: "today", label: "Today" },
      { key: "this-week", label: "This week" },
      { key: "this-month", label: "This month" },
      { key: "stale", label: "Stale (30+ days)" },
    ]},
    { key: "links", label: "Links", icon: LinkIcon, values: [
      { key: "_any", label: "Has links" },
      { key: "backlinks", label: "Has backlinks" },
      { key: "_none", label: "No links" },
    ]},
    { key: "content", label: "Content", icon: ContentIcon, values: [
      { key: "hasImage", label: "Has images" },
      { key: "hasCode", label: "Has code blocks" },
      { key: "hasTable", label: "Has tables" },
    ]},
    { key: "pinned", label: "Pinned", icon: PinIcon, values: [
      { key: "yes", label: "Pinned" },
      { key: "no", label: "Not pinned" },
    ]},
  ],
  quickFilters: [
    { label: "Needs attention", desc: "stale + unlinked", rules: [
      { field: "updatedAt", operator: "lt", value: "stale" },
      { field: "links", operator: "eq", value: "_none" },
    ]},
    { label: "Active work", desc: "updated < 7d", rules: [
      { field: "updatedAt", operator: "eq", value: "this-week" },
    ]},
    { label: "Orphans", desc: "unlinked + unread", rules: [
      { field: "links", operator: "eq", value: "_none" },
    ]},
  ],
  displayConfig: {
    supportedModes: ["list", "board"],
    orderingOptions: [
      { value: "updatedAt", label: "Updated" },
      { value: "createdAt", label: "Created" },
      { value: "title", label: "Name" },
      { value: "links", label: "Links" },
      { value: "reads", label: "Word count" },
    ],
    groupingOptions: [
      { value: "none", label: "No grouping" },
      { value: "status", label: "Status" },
      { value: "folder", label: "Folder" },
      { value: "label", label: "Label" },
    ],
    toggles: [
      { key: "showTrashed", label: "Show trashed", icon: TrashIcon },
      { key: "compact", label: "Compact mode", icon: SortIcon },
      { key: "showCardPreview", label: "Show card preview", icon: EyeIcon },
      { key: "nestedReplies", label: "Nested replies", icon: ContentIcon },
    ],
    properties: [
      { key: "status", label: "Status", icon: StatusIcon },
      { key: "folder", label: "Folder", icon: FolderIcon },
      { key: "links", label: "Links", icon: LinkIcon },
      { key: "wordCount", label: "Words", icon: ContentIcon },
      { key: "updatedAt", label: "Updated", icon: CalendarIcon },
      { key: "createdAt", label: "Created", icon: CalendarIcon },
    ],
  },
}

export const WIKI_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: true,
  filterCategories: [
    { key: "isWiki", label: "Wiki Status", icon: StatusIcon, values: [
      { key: "article", label: "Article", color: "#8b5cf6" },
    ]},
    { key: "tags", label: "Category", icon: TagIcon, values: [] },
    { key: "links", label: "Backlinks", icon: LinkIcon, values: [
      { key: "5+", label: "5+ backlinks" },
      { key: "10+", label: "10+ backlinks" },
      { key: "_none", label: "No backlinks" },
    ]},
  ],
  quickFilters: [],
  displayConfig: {
    supportedModes: ["list", "board"],
    orderingOptions: [
      { value: "links", label: "Most linked" },
      { value: "updatedAt", label: "Updated" },
      { value: "title", label: "Name" },
    ],
    groupingOptions: [
      { value: "none", label: "No grouping" },
      { value: "label", label: "Category" },
    ],
    toggles: [
      { key: "showRedLinks", label: "Show red links", icon: LinkIcon },
    ],
    properties: [
      { key: "links", label: "Backlinks", icon: LinkIcon },
      { key: "tags", label: "Categories", icon: TagIcon },
      { key: "updatedAt", label: "Updated", icon: CalendarIcon },
    ],
  },
}

export const WIKI_CATEGORY_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: true,
  filterCategories: [
    { key: "wikiTier", label: "Tier", icon: TagIcon, values: [
      { key: "1", label: "Tier 1 (Top)" },
      { key: "2", label: "Tier 2" },
      { key: "3", label: "Tier 3" },
    ]},
    { key: "wikiStatus", label: "Status", icon: StatusIcon, values: [
      { key: "has-articles", label: "Has articles" },
      { key: "empty", label: "Empty" },
    ]},
  ],
  quickFilters: [],
  displayConfig: {
    supportedModes: ["list", "board"],
    orderingOptions: [
      { value: "title", label: "Name" },
      { value: "parent", label: "Parent" },
      { value: "tier", label: "Tier" },
      { value: "articles", label: "Articles" },
      { value: "sub", label: "Sub" },
      { value: "updatedAt", label: "Updated" },
    ],
    groupingOptions: [
      { value: "none", label: "No grouping" },
      { value: "tier", label: "Tier" },
      { value: "parent", label: "Parent" },
      { value: "family", label: "Family" },
    ],
    toggles: [
      { key: "showDescription", label: "Show description", icon: ContentIcon },
      { key: "showEmptyGroups", label: "Show empty", icon: EyeIcon },
    ],
    properties: [
      { key: "parent", label: "Parent" },
      { key: "tier", label: "Tier" },
      { key: "articles", label: "Articles" },
      { key: "sub", label: "Sub" },
      { key: "updatedAt", label: "Updated" },
    ],
  },
}

export const GRAPH_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: true,
  filterCategories: [
    { key: "status", label: "Status", icon: StatusIcon, values: [
      { key: "inbox", label: "Inbox", color: "rgba(255,255,255,0.32)", icon: <CircleDashed size={14} weight="regular" style={{ color: NOTE_STATUS_HEX.inbox }} /> },
      { key: "capture", label: "Capture", color: "#f5a623", icon: <CircleHalf size={14} weight="fill" style={{ color: NOTE_STATUS_HEX.capture }} /> },
      { key: "permanent", label: "Permanent", color: "#45d483", icon: <CheckCircle size={14} weight="fill" style={{ color: NOTE_STATUS_HEX.permanent }} /> },
    ]},
    { key: "tags", label: "Tags", icon: TagIcon, values: [] },
    { key: "label", label: "Label", icon: LabelIcon, values: [] },
    { key: "relationType", label: "Relations", icon: LinkIcon, values: [
      { key: "related-to", label: "Related to", color: "#6b7280" },
      { key: "inspired-by", label: "Inspired by", color: "#8b5cf6" },
      { key: "contradicts", label: "Contradicts", color: "#ef4444" },
      { key: "extends", label: "Extends", color: "#3b82f6" },
      { key: "depends-on", label: "Depends on", color: "#f59e0b" },
    ]},
  ],
  quickFilters: [],
  displayConfig: {
    supportedModes: [],
    orderingOptions: [
      { value: "links", label: "Connections" },
      { value: "title", label: "Name" },
    ],
    groupingOptions: [],
    toggles: [
      { key: "showTagNodes", label: "Show tag nodes", icon: TagIcon },
      { key: "showWikilinks", label: "Show wikilinks", icon: LinkIcon },
      { key: "showLabels", label: "Show labels", icon: EyeIcon },
    ],
    properties: [],
  },
}

export const INBOX_VIEW_CONFIG: ViewConfig = {
  showFilter: false,
  showDisplay: true,
  showDetailPanel: false,
  filterCategories: [],
  quickFilters: [],
  displayConfig: {
    supportedModes: ["list"],
    orderingOptions: [
      { value: "createdAt", label: "Newest" },
      { value: "updatedAt", label: "Updated" },
      { value: "title", label: "Name" },
    ],
    groupingOptions: [],
    toggles: [
      { key: "showSnoozed", label: "Show snoozed", icon: CalendarIcon },
      { key: "showKept", label: "Show kept", icon: ArchiveIcon },
    ],
    properties: [
      { key: "source", label: "Source", icon: SourceIcon },
      { key: "createdAt", label: "Age", icon: CalendarIcon },
    ],
  },
}

export const INSIGHTS_VIEW_CONFIG: ViewConfig = {
  showFilter: false,
  showDisplay: true,
  showDetailPanel: false,
  filterCategories: [],
  quickFilters: [],
  displayConfig: {
    supportedModes: [],
    orderingOptions: [
      { value: "priority", label: "Severity" },
      { value: "reads", label: "Count" },
    ],
    groupingOptions: [],
    toggles: [
      { key: "showInfo", label: "Show info level", icon: EyeIcon },
      { key: "showResolved", label: "Show resolved", icon: ArchiveIcon },
    ],
    properties: [
      { key: "priority", label: "Severity", icon: PriorityIcon },
      { key: "reads", label: "Count", icon: ContentIcon },
    ],
  },
}

export const CALENDAR_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: true,
  filterCategories: [
    { key: "status", label: "Status", icon: StatusIcon, values: [
      { key: "inbox", label: "Inbox", color: "rgba(255,255,255,0.32)", icon: <CircleDashed size={14} weight="regular" style={{ color: NOTE_STATUS_HEX.inbox }} /> },
      { key: "capture", label: "Capture", color: "#f5a623", icon: <CircleHalf size={14} weight="fill" style={{ color: NOTE_STATUS_HEX.capture }} /> },
      { key: "permanent", label: "Permanent", color: "#45d483", icon: <CheckCircle size={14} weight="fill" style={{ color: NOTE_STATUS_HEX.permanent }} /> },
    ]},
    { key: "folder", label: "Folder", icon: FolderIcon, values: [] },
    { key: "label", label: "Label", icon: LabelIcon, values: [] },
    { key: "tags", label: "Tags", icon: TagIcon, values: [] },
  ],
  quickFilters: [],
  displayConfig: {
    supportedModes: [],
    orderingOptions: [
      { value: "createdAt", label: "Created date" },
      { value: "updatedAt", label: "Updated date" },
    ],
    groupingOptions: [],
    toggles: [
      { key: "showNotes", label: "Notes", icon: ContentIcon },
      { key: "showWiki", label: "Wiki", icon: LinkIcon },
      { key: "showReminders", label: "Reminders", icon: CalendarIcon },
    ],
    properties: [],
  },
}

export const VIEW_CONFIGS: Record<string, ViewConfig> = {
  notes: NOTES_VIEW_CONFIG,
  wiki: WIKI_VIEW_CONFIG,
  "wiki-category": WIKI_CATEGORY_VIEW_CONFIG,
  graph: GRAPH_VIEW_CONFIG,
  inbox: INBOX_VIEW_CONFIG,
  insights: INSIGHTS_VIEW_CONFIG,
  calendar: CALENDAR_VIEW_CONFIG,
}
