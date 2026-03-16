"use client"

import {
  Filter, Plus, X, Check, Zap, Clock, Link2, Eye, FileQuestion, FolderOpen,
  Tag, Pin, CircleDot, Signal, Globe, FileText, Type, ALargeSmall, Hash,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { StatusBadge, PriorityBadge } from "@/components/note-fields"
import type { FilterRule, FilterField, GroupBy } from "@/lib/view-engine/types"
import type { NoteStatus, NotePriority, NoteSource, Folder, Tag as TagType } from "@/lib/types"

/* ── Helpers ──────────────────────────────────────────── */

export function hasFilter(filters: FilterRule[], field: FilterRule["field"], value: string, operator: FilterRule["operator"] = "eq") {
  return filters.some((f) => f.field === field && f.operator === operator && f.value === value)
}

function countFieldFilters(filters: FilterRule[], field: FilterRule["field"]) {
  return filters.filter((f) => f.field === field).length
}

function countDateFilters(filters: FilterRule[]) {
  return filters.filter((f) => f.field === "updatedAt" || f.field === "createdAt").length
}

function countContentFilters(filters: FilterRule[]) {
  return filters.filter((f) => f.field === "content" || f.field === "wordCount" || f.field === "title" || f.field === "reads").length
}

export function formatFilterLabel(rule: FilterRule, folderList?: Folder[], tagList?: TagType[]): string {
  // Status
  if (rule.field === "status") return rule.value.charAt(0).toUpperCase() + rule.value.slice(1)
  // Priority
  if (rule.field === "priority" && rule.value === "none") return "No priority"
  if (rule.field === "priority") return rule.value.charAt(0).toUpperCase() + rule.value.slice(1)
  // Folder
  if (rule.field === "folder" && rule.value === "_none") return "No folder"
  if (rule.field === "folder" && rule.value !== "_none" && folderList) {
    const folder = folderList.find((f) => f.id === rule.value)
    return folder ? folder.name : rule.value
  }
  // Label
  if (rule.field === "label" && rule.value === "_none") return "No label"
  if (rule.field === "label" && rule.value === "_any") return "Has label"
  // Tags
  if (rule.field === "tags" && rule.value === "_any") return "Has tags"
  if (rule.field === "tags" && rule.value === "_none") return "No tags"
  if (rule.field === "tags" && tagList) {
    const tag = tagList.find((t) => t.id === rule.value)
    return tag ? `#${tag.name}` : `#${rule.value}`
  }
  // Source
  if (rule.field === "source" && rule.value === "_none") return "No source"
  if (rule.field === "source") {
    const labels: Record<string, string> = { manual: "Manual", webclip: "Web clip", import: "Import", share: "Shared", api: "API" }
    return labels[rule.value] ?? rule.value
  }
  // Links
  if (rule.field === "links" && rule.operator === "eq" && rule.value === "0") return "Unlinked"
  if (rule.field === "links" && rule.operator === "gt") return `${rule.value}+ links`
  // Reads
  if (rule.field === "reads" && rule.operator === "eq" && rule.value === "0") return "Unread"
  if (rule.field === "reads" && rule.operator === "gt") return `${rule.value}+ reads`
  // Content
  if (rule.field === "content" && rule.value === "empty") return "Empty body"
  // Word count
  if (rule.field === "wordCount" && rule.operator === "lt") return `< ${rule.value} words`
  if (rule.field === "wordCount" && rule.operator === "gt") return `${rule.value}+ words`
  // Title
  if (rule.field === "title" && rule.value === "empty") return "Untitled"
  // Dates
  if (rule.field === "updatedAt" && rule.operator === "gt" && rule.value === "24h") return "Updated today"
  if (rule.field === "updatedAt" && rule.operator === "gt" && rule.value === "7d") return "Updated this week"
  if (rule.field === "updatedAt" && rule.operator === "gt" && rule.value === "30d") return "Updated this month"
  if (rule.field === "updatedAt" && rule.operator === "lt" && rule.value === "7d") return "Stale 7d+"
  if (rule.field === "updatedAt" && rule.operator === "lt" && rule.value === "30d") return "Stale 30d+"
  if (rule.field === "updatedAt" && rule.operator === "lt" && rule.value === "90d") return "Stale 90d+"
  if (rule.field === "createdAt" && rule.operator === "gt" && rule.value === "24h") return "Created today"
  if (rule.field === "createdAt" && rule.operator === "gt" && rule.value === "7d") return "Created this week"
  if (rule.field === "createdAt" && rule.operator === "gt" && rule.value === "30d") return "Created this month"
  // Pinned
  if (rule.field === "pinned" && rule.value === "true") return "Pinned"
  return `${rule.field}: ${rule.value}`
}

/* ── Active count badge ─────────────────────────────── */

function ActiveBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-accent/15 px-1 text-[11px] font-medium text-accent">
      {count}
    </span>
  )
}

/* ── Check icon for toggleable items ─────────────────── */

function CheckMark({ active }: { active: boolean }) {
  return <Check className={`h-3.5 w-3.5 shrink-0 ${active ? "text-accent opacity-100" : "opacity-0"}`} />
}

/* ── Shared menu items (nested sub-menus) ────────────── */

interface FilterMenuProps {
  filters: FilterRule[]
  groupBy: GroupBy
  isSingleStatusTab: boolean
  folders: Folder[]
  tags: TagType[]
  onToggleFilter: (field: FilterRule["field"], value: string, operator?: FilterRule["operator"]) => void
  onSetFilters: (filters: FilterRule[]) => void
}

export function FilterMenuItems({
  filters,
  groupBy,
  isSingleStatusTab,
  folders,
  tags,
  onToggleFilter,
  onSetFilters,
}: FilterMenuProps) {
  const showStatusFilter = groupBy !== "status" && groupBy !== "triage" && !isSingleStatusTab
  const showPriorityFilter = groupBy !== "priority"
  const showFolderFilter = groupBy !== "folder"
  const showLinksFilter = groupBy !== "linkCount"

  const statusCount = countFieldFilters(filters, "status")
  const priorityCount = countFieldFilters(filters, "priority")
  const folderCount = countFieldFilters(filters, "folder")
  const labelCount = countFieldFilters(filters, "label")
  const tagCount = countFieldFilters(filters, "tags")
  const sourceCount = countFieldFilters(filters, "source")
  const dateCount = countDateFilters(filters)
  const linksCount = countFieldFilters(filters, "links")
  const contentCount = countContentFilters(filters)
  const pinnedCount = countFieldFilters(filters, "pinned")

  return (
    <>
      {/* ── Quick Filters (presets) ── */}
      <DropdownMenuItem className="text-[12px] font-medium text-muted-foreground" disabled>
        <Zap className="h-3.5 w-3.5 mr-1" /> Quick Filters
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={(e) => {
        e.preventDefault()
        onSetFilters([
          { field: "updatedAt", operator: "lt", value: "30d" },
          { field: "links", operator: "eq", value: "0" },
        ])
      }}>
        <span className="text-[14px]">Needs attention</span>
        <span className="ml-auto text-[11px] text-muted-foreground">stale + unlinked</span>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={(e) => {
        e.preventDefault()
        onSetFilters([{ field: "updatedAt", operator: "gt", value: "7d" }])
      }}>
        <span className="text-[14px]">Active work</span>
        <span className="ml-auto text-[11px] text-muted-foreground">updated &lt; 7d</span>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={(e) => {
        e.preventDefault()
        onSetFilters([
          { field: "links", operator: "eq", value: "0" },
          { field: "reads", operator: "eq", value: "0" },
        ])
      }}>
        <span className="text-[14px]">Orphans</span>
        <span className="ml-auto text-[11px] text-muted-foreground">unlinked + unread</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />

      {/* ── Status ── */}
      {showStatusFilter && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <CircleDot className="h-4 w-4 text-muted-foreground" />
            <span className="text-[14px]">Status</span>
            <ActiveBadge count={statusCount} />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            {(["inbox", "capture", "permanent"] as NoteStatus[]).map((s) => (
              <DropdownMenuItem key={s} onSelect={(e) => { e.preventDefault(); onToggleFilter("status", s) }}>
                <CheckMark active={hasFilter(filters, "status", s)} />
                <StatusBadge status={s} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )}

      {/* ── Priority ── */}
      {showPriorityFilter && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Signal className="h-4 w-4 text-muted-foreground" />
            <span className="text-[14px]">Priority</span>
            <ActiveBadge count={priorityCount} />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            {(["urgent", "high", "medium", "low", "none"] as NotePriority[]).map((p) => (
              <DropdownMenuItem key={p} onSelect={(e) => { e.preventDefault(); onToggleFilter("priority", p) }}>
                <CheckMark active={hasFilter(filters, "priority", p)} />
                <PriorityBadge priority={p} />
                <span className="ml-2 text-[14px] capitalize">{p === "none" ? "No priority" : p}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )}

      {/* ── Folder ── */}
      {showFolderFilter && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-[14px]">Folder</span>
            <ActiveBadge count={folderCount} />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52">
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("folder", "_none") }}>
              <CheckMark active={hasFilter(filters, "folder", "_none")} />
              <span className="text-[14px] text-muted-foreground">No folder</span>
            </DropdownMenuItem>
            {folders.length > 0 && <DropdownMenuSeparator />}
            {folders.map((folder) => (
              <DropdownMenuItem key={folder.id} onSelect={(e) => { e.preventDefault(); onToggleFilter("folder", folder.id) }}>
                <CheckMark active={hasFilter(filters, "folder", folder.id)} />
                <span className="text-[14px]">{folder.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )}

      {/* ── Label ── */}
      {groupBy !== "label" && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-[14px]">Label</span>
            <ActiveBadge count={labelCount} />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("label", "_none") }}>
              <CheckMark active={hasFilter(filters, "label", "_none")} />
              <span className="text-[14px] text-muted-foreground">No label</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("label", "_any") }}>
              <CheckMark active={hasFilter(filters, "label", "_any")} />
              <span className="text-[14px]">Has label</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )}

      {/* ── Tags ── */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="text-[14px]">Tags</span>
          <ActiveBadge count={tagCount} />
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-52">
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("tags", "_any") }}>
            <CheckMark active={hasFilter(filters, "tags", "_any")} />
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-[14px]">Has tags</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("tags", "_none") }}>
            <CheckMark active={hasFilter(filters, "tags", "_none")} />
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-[14px]">No tags</span>
          </DropdownMenuItem>
          {tags.length > 0 && <DropdownMenuSeparator />}
          {tags.map((tag) => (
            <DropdownMenuItem key={tag.id} onSelect={(e) => { e.preventDefault(); onToggleFilter("tags", tag.id) }}>
              <CheckMark active={hasFilter(filters, "tags", tag.id)} />
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <span className="text-[14px]">{tag.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />

      {/* ── Source ── */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-[14px]">Source</span>
          <ActiveBadge count={sourceCount} />
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-48">
          {(["manual", "webclip", "import", "share", "api"] as NonNullable<NoteSource>[]).map((src) => {
            const labels: Record<string, string> = { manual: "Manual", webclip: "Web clip", import: "Import", share: "Shared", api: "API" }
            return (
              <DropdownMenuItem key={src} onSelect={(e) => { e.preventDefault(); onToggleFilter("source", src) }}>
                <CheckMark active={hasFilter(filters, "source", src)} />
                <span className="text-[14px]">{labels[src]}</span>
              </DropdownMenuItem>
            )
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("source", "_none") }}>
            <CheckMark active={hasFilter(filters, "source", "_none")} />
            <span className="text-[14px] text-muted-foreground">No source</span>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      {/* ── Dates ── */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-[14px]">Dates</span>
          <ActiveBadge count={dateCount} />
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-52">
          <DropdownMenuItem className="text-[11px] font-medium text-muted-foreground" disabled>
            Updated
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("updatedAt", "24h", "gt") }}>
            <CheckMark active={hasFilter(filters, "updatedAt", "24h", "gt")} />
            <span className="text-[14px]">Today</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("updatedAt", "7d", "gt") }}>
            <CheckMark active={hasFilter(filters, "updatedAt", "7d", "gt")} />
            <span className="text-[14px]">This week</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("updatedAt", "30d", "gt") }}>
            <CheckMark active={hasFilter(filters, "updatedAt", "30d", "gt")} />
            <span className="text-[14px]">This month</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[11px] font-medium text-muted-foreground" disabled>
            Stale
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("updatedAt", "7d", "lt") }}>
            <CheckMark active={hasFilter(filters, "updatedAt", "7d", "lt")} />
            <span className="text-[14px]">7+ days ago</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("updatedAt", "30d", "lt") }}>
            <CheckMark active={hasFilter(filters, "updatedAt", "30d", "lt")} />
            <span className="text-[14px]">30+ days ago</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("updatedAt", "90d", "lt") }}>
            <CheckMark active={hasFilter(filters, "updatedAt", "90d", "lt")} />
            <span className="text-[14px]">90+ days ago</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[11px] font-medium text-muted-foreground" disabled>
            Created
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("createdAt", "24h", "gt") }}>
            <CheckMark active={hasFilter(filters, "createdAt", "24h", "gt")} />
            <span className="text-[14px]">Today</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("createdAt", "7d", "gt") }}>
            <CheckMark active={hasFilter(filters, "createdAt", "7d", "gt")} />
            <span className="text-[14px]">This week</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("createdAt", "30d", "gt") }}>
            <CheckMark active={hasFilter(filters, "createdAt", "30d", "gt")} />
            <span className="text-[14px]">This month</span>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />

      {/* ── Links ── */}
      {showLinksFilter && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-[14px]">Links</span>
            <ActiveBadge count={linksCount} />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("links", "0") }}>
              <CheckMark active={hasFilter(filters, "links", "0")} />
              <span className="text-[14px]">Unlinked</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("links", "0", "gt") }}>
              <CheckMark active={hasFilter(filters, "links", "0", "gt")} />
              <span className="text-[14px]">Has links</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("links", "2", "gt") }}>
              <CheckMark active={hasFilter(filters, "links", "2", "gt")} />
              <span className="text-[14px]">3+ links</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("links", "4", "gt") }}>
              <CheckMark active={hasFilter(filters, "links", "4", "gt")} />
              <span className="text-[14px]">5+ links</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("links", "9", "gt") }}>
              <CheckMark active={hasFilter(filters, "links", "9", "gt")} />
              <span className="text-[14px]">10+ links</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )}

      {/* ── Content ── */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-[14px]">Content</span>
          <ActiveBadge count={contentCount} />
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-52">
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("content", "empty") }}>
            <CheckMark active={hasFilter(filters, "content", "empty")} />
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
            <span className="text-[14px]">Empty body</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("title", "empty") }}>
            <CheckMark active={hasFilter(filters, "title", "empty")} />
            <Type className="h-4 w-4 text-muted-foreground" />
            <span className="text-[14px]">Untitled</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("reads", "0") }}>
            <CheckMark active={hasFilter(filters, "reads", "0")} />
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-[14px]">Unread</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[11px] font-medium text-muted-foreground" disabled>
            Word Count
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("wordCount", "50", "lt") }}>
            <CheckMark active={hasFilter(filters, "wordCount", "50", "lt")} />
            <ALargeSmall className="h-4 w-4 text-muted-foreground" />
            <span className="text-[14px]">Short (&lt; 50 words)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("wordCount", "199", "gt") }}>
            <CheckMark active={hasFilter(filters, "wordCount", "199", "gt")} />
            <ALargeSmall className="h-4 w-4 text-muted-foreground" />
            <span className="text-[14px]">Long (200+ words)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("wordCount", "499", "gt") }}>
            <CheckMark active={hasFilter(filters, "wordCount", "499", "gt")} />
            <ALargeSmall className="h-4 w-4 text-muted-foreground" />
            <span className="text-[14px]">Very long (500+ words)</span>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      {/* ── Pinned ── */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Pin className="h-4 w-4 text-muted-foreground" />
          <span className="text-[14px]">Pinned</span>
          <ActiveBadge count={pinnedCount} />
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-44">
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("pinned", "true") }}>
            <CheckMark active={hasFilter(filters, "pinned", "true")} />
            <span className="text-[14px]">Pinned only</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("pinned", "false") }}>
            <CheckMark active={hasFilter(filters, "pinned", "false")} />
            <span className="text-[14px]">Not pinned</span>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
  )
}

/* ── Filter Grouping (for grouped chips) ──────────────── */

export type FilterGroupKey = "status" | "priority" | "folder" | "label" | "tags" | "source" | "dates" | "links" | "content" | "pinned"

const FIELD_TO_GROUP: Record<FilterField, FilterGroupKey> = {
  status: "status",
  priority: "priority",
  folder: "folder",
  tags: "tags",
  source: "source",
  updatedAt: "dates",
  createdAt: "dates",
  links: "links",
  content: "content",
  wordCount: "content",
  title: "content",
  reads: "content",
  label: "label",
  pinned: "pinned",
  isWiki: "content",
}

export function getFilterGroupKey(field: FilterField): FilterGroupKey {
  return FIELD_TO_GROUP[field]
}

export const FILTER_GROUP_META: Record<FilterGroupKey, { label: string; icon: typeof CircleDot }> = {
  status: { label: "Status", icon: CircleDot },
  priority: { label: "Priority", icon: Signal },
  folder: { label: "Folder", icon: FolderOpen },
  label: { label: "Label", icon: Tag },
  tags: { label: "Tags", icon: Hash },
  source: { label: "Source", icon: Globe },
  dates: { label: "Dates", icon: Clock },
  links: { label: "Links", icon: Link2 },
  content: { label: "Content", icon: FileText },
  pinned: { label: "Pinned", icon: Pin },
}

/* ── Per-field dropdown content (for grouped chips) ─── */

interface FilterFieldContentProps {
  groupKey: FilterGroupKey
  filters: FilterRule[]
  folders: Folder[]
  tags: TagType[]
  onToggleFilter: (field: FilterRule["field"], value: string, operator?: FilterRule["operator"]) => void
}

export function FilterFieldContent({ groupKey, filters, folders, tags, onToggleFilter }: FilterFieldContentProps) {
  switch (groupKey) {
    case "status":
      return (
        <>
          {(["inbox", "capture", "permanent"] as NoteStatus[]).map((s) => (
            <DropdownMenuItem key={s} onSelect={(e) => { e.preventDefault(); onToggleFilter("status", s) }}>
              <CheckMark active={hasFilter(filters, "status", s)} />
              <StatusBadge status={s} />
            </DropdownMenuItem>
          ))}
        </>
      )
    case "priority":
      return (
        <>
          {(["urgent", "high", "medium", "low", "none"] as NotePriority[]).map((p) => (
            <DropdownMenuItem key={p} onSelect={(e) => { e.preventDefault(); onToggleFilter("priority", p) }}>
              <CheckMark active={hasFilter(filters, "priority", p)} />
              <PriorityBadge priority={p} />
              <span className="ml-2 text-[14px] capitalize">{p === "none" ? "No priority" : p}</span>
            </DropdownMenuItem>
          ))}
        </>
      )
    case "folder":
      return (
        <>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("folder", "_none") }}>
            <CheckMark active={hasFilter(filters, "folder", "_none")} />
            <span className="text-[14px] text-muted-foreground">No folder</span>
          </DropdownMenuItem>
          {folders.length > 0 && <DropdownMenuSeparator />}
          {folders.map((folder) => (
            <DropdownMenuItem key={folder.id} onSelect={(e) => { e.preventDefault(); onToggleFilter("folder", folder.id) }}>
              <CheckMark active={hasFilter(filters, "folder", folder.id)} />
              <span className="text-[14px]">{folder.name}</span>
            </DropdownMenuItem>
          ))}
        </>
      )
    case "label":
      return (
        <>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("label", "_none") }}>
            <CheckMark active={hasFilter(filters, "label", "_none")} />
            <span className="text-[14px] text-muted-foreground">No label</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("label", "_any") }}>
            <CheckMark active={hasFilter(filters, "label", "_any")} />
            <span className="text-[14px]">Has label</span>
          </DropdownMenuItem>
        </>
      )
    case "tags":
      return (
        <>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("tags", "_any") }}>
            <CheckMark active={hasFilter(filters, "tags", "_any")} />
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-[14px]">Has tags</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("tags", "_none") }}>
            <CheckMark active={hasFilter(filters, "tags", "_none")} />
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-[14px]">No tags</span>
          </DropdownMenuItem>
          {tags.length > 0 && <DropdownMenuSeparator />}
          {tags.map((tag) => (
            <DropdownMenuItem key={tag.id} onSelect={(e) => { e.preventDefault(); onToggleFilter("tags", tag.id) }}>
              <CheckMark active={hasFilter(filters, "tags", tag.id)} />
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
              <span className="text-[14px]">{tag.name}</span>
            </DropdownMenuItem>
          ))}
        </>
      )
    case "source": {
      const srcLabels: Record<string, string> = { manual: "Manual", webclip: "Web clip", import: "Import", share: "Shared", api: "API" }
      return (
        <>
          {(["manual", "webclip", "import", "share", "api"] as NonNullable<NoteSource>[]).map((src) => (
            <DropdownMenuItem key={src} onSelect={(e) => { e.preventDefault(); onToggleFilter("source", src) }}>
              <CheckMark active={hasFilter(filters, "source", src)} />
              <span className="text-[14px]">{srcLabels[src]}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("source", "_none") }}>
            <CheckMark active={hasFilter(filters, "source", "_none")} />
            <span className="text-[14px] text-muted-foreground">No source</span>
          </DropdownMenuItem>
        </>
      )
    }
    case "dates":
      return (
        <>
          <DropdownMenuItem className="text-[11px] font-medium text-muted-foreground" disabled>Updated</DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("updatedAt", "24h", "gt") }}>
            <CheckMark active={hasFilter(filters, "updatedAt", "24h", "gt")} />
            <span className="text-[14px]">Today</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("updatedAt", "7d", "gt") }}>
            <CheckMark active={hasFilter(filters, "updatedAt", "7d", "gt")} />
            <span className="text-[14px]">This week</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("updatedAt", "30d", "gt") }}>
            <CheckMark active={hasFilter(filters, "updatedAt", "30d", "gt")} />
            <span className="text-[14px]">This month</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[11px] font-medium text-muted-foreground" disabled>Stale</DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("updatedAt", "7d", "lt") }}>
            <CheckMark active={hasFilter(filters, "updatedAt", "7d", "lt")} />
            <span className="text-[14px]">7+ days ago</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("updatedAt", "30d", "lt") }}>
            <CheckMark active={hasFilter(filters, "updatedAt", "30d", "lt")} />
            <span className="text-[14px]">30+ days ago</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("updatedAt", "90d", "lt") }}>
            <CheckMark active={hasFilter(filters, "updatedAt", "90d", "lt")} />
            <span className="text-[14px]">90+ days ago</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[11px] font-medium text-muted-foreground" disabled>Created</DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("createdAt", "24h", "gt") }}>
            <CheckMark active={hasFilter(filters, "createdAt", "24h", "gt")} />
            <span className="text-[14px]">Today</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("createdAt", "7d", "gt") }}>
            <CheckMark active={hasFilter(filters, "createdAt", "7d", "gt")} />
            <span className="text-[14px]">This week</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("createdAt", "30d", "gt") }}>
            <CheckMark active={hasFilter(filters, "createdAt", "30d", "gt")} />
            <span className="text-[14px]">This month</span>
          </DropdownMenuItem>
        </>
      )
    case "links":
      return (
        <>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("links", "0") }}>
            <CheckMark active={hasFilter(filters, "links", "0")} />
            <span className="text-[14px]">Unlinked</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("links", "0", "gt") }}>
            <CheckMark active={hasFilter(filters, "links", "0", "gt")} />
            <span className="text-[14px]">Has links</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("links", "2", "gt") }}>
            <CheckMark active={hasFilter(filters, "links", "2", "gt")} />
            <span className="text-[14px]">3+ links</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("links", "4", "gt") }}>
            <CheckMark active={hasFilter(filters, "links", "4", "gt")} />
            <span className="text-[14px]">5+ links</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("links", "9", "gt") }}>
            <CheckMark active={hasFilter(filters, "links", "9", "gt")} />
            <span className="text-[14px]">10+ links</span>
          </DropdownMenuItem>
        </>
      )
    case "content":
      return (
        <>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("content", "empty") }}>
            <CheckMark active={hasFilter(filters, "content", "empty")} />
            <span className="text-[14px]">Empty body</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("title", "empty") }}>
            <CheckMark active={hasFilter(filters, "title", "empty")} />
            <span className="text-[14px]">Untitled</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("reads", "0") }}>
            <CheckMark active={hasFilter(filters, "reads", "0")} />
            <span className="text-[14px]">Unread</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[11px] font-medium text-muted-foreground" disabled>Word Count</DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("wordCount", "50", "lt") }}>
            <CheckMark active={hasFilter(filters, "wordCount", "50", "lt")} />
            <span className="text-[14px]">Short (&lt; 50 words)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("wordCount", "199", "gt") }}>
            <CheckMark active={hasFilter(filters, "wordCount", "199", "gt")} />
            <span className="text-[14px]">Long (200+ words)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("wordCount", "499", "gt") }}>
            <CheckMark active={hasFilter(filters, "wordCount", "499", "gt")} />
            <span className="text-[14px]">Very long (500+ words)</span>
          </DropdownMenuItem>
        </>
      )
    case "pinned":
      return (
        <>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("pinned", "true") }}>
            <CheckMark active={hasFilter(filters, "pinned", "true")} />
            <span className="text-[14px]">Pinned only</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("pinned", "false") }}>
            <CheckMark active={hasFilter(filters, "pinned", "false")} />
            <span className="text-[14px]">Not pinned</span>
          </DropdownMenuItem>
        </>
      )
  }
}

/* ── FilterButton (toolbar) ──────────────────────────── */

interface FilterButtonProps extends FilterMenuProps {
  /* inherits filters, groupBy, isSingleStatusTab, folders, tags, onToggleFilter, onSetFilters */
  hideLabel?: boolean
}

export function FilterButton({ hideLabel, ...props }: FilterButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[14px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Filter className="h-4 w-4" />
          {!hideLabel && "Filter"}
          {props.filters.length > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent/15 px-1 text-[11px] font-medium text-accent">
              {props.filters.length}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <FilterMenuItems {...props} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ── FilterChipBar (below toolbar, only when active) ── */

interface FilterChipBarProps extends FilterMenuProps {
  onRemoveFilter: (idx: number) => void
  onClearAll: () => void
}

export function FilterChipBar({
  filters,
  folders,
  tags,
  onRemoveFilter,
  onClearAll,
  ...menuProps
}: FilterChipBarProps) {
  if (filters.length === 0) return null

  return (
    <div className="flex shrink-0 items-center gap-1.5 border-b border-border px-5 py-1.5">
      {/* Active filter chips */}
      {filters.map((f, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/50 px-2 py-0.5 text-[12px] text-foreground"
        >
          <span className="text-muted-foreground">{formatFilterLabel(f, folders, tags)}</span>
          <button
            onClick={() => onRemoveFilter(i)}
            className="ml-0.5 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}

      {/* + Add more */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center justify-center rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Plus className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <FilterMenuItems filters={filters} folders={folders} tags={tags} {...menuProps} />
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear — right aligned */}
      <div className="ml-auto">
        <button
          onClick={onClearAll}
          className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
