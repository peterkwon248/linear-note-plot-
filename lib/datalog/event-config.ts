import {
  FilePlus, Pencil, Eye, ArrowUpCircle, Archive, Trash2,
  Check, Clock, Tag, Brain, Sparkles, Link2, FileText, Paperclip,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { NoteEventType } from "@/lib/types"

interface EventTypeConfig {
  icon: LucideIcon
  verb: string
  color: string
}

export const EVENT_CONFIG: Record<NoteEventType, EventTypeConfig> = {
  created: { icon: FilePlus, verb: "Created", color: "#45d483" },
  updated: { icon: Pencil, verb: "Edited", color: "#5e6ad2" },
  opened: { icon: Eye, verb: "Opened", color: "#6b7280" },
  promoted: { icon: ArrowUpCircle, verb: "Promoted", color: "#10b981" },
  archived: { icon: Archive, verb: "Archived", color: "#f59e0b" },
  unarchived: { icon: Archive, verb: "Unarchived", color: "#f59e0b" },
  trashed: { icon: Trash2, verb: "Trashed", color: "#ef4444" },
  untrashed: { icon: Trash2, verb: "Restored", color: "#ef4444" },
  triage_keep: { icon: Check, verb: "Kept", color: "#45d483" },
  triage_snooze: { icon: Clock, verb: "Snoozed", color: "#f59e0b" },
  triage_trash: { icon: Trash2, verb: "Triaged to trash", color: "#ef4444" },
  link_added: { icon: Link2, verb: "Linked", color: "#5e6ad2" },
  link_removed: { icon: Link2, verb: "Unlinked", color: "#5e6ad2" },
  thread_started: { icon: Brain, verb: "Started thread", color: "#06b6d4" },
  thread_step_added: { icon: Brain, verb: "Added thread step", color: "#06b6d4" },
  thread_ended: { icon: Brain, verb: "Ended thread", color: "#06b6d4" },
  thread_deleted: { icon: Trash2, verb: "Deleted thread", color: "#ef4444" },
  map_added: { icon: Link2, verb: "Added to map", color: "#5e6ad2" },
  map_removed: { icon: Link2, verb: "Removed from map", color: "#5e6ad2" },
  label_changed: { icon: Tag, verb: "Label changed", color: "#a855f7" },
  srs_reviewed: { icon: Brain, verb: "Reviewed (SRS)", color: "#06b6d4" },
  autopilot_applied: { icon: Sparkles, verb: "Autopilot applied", color: "#8b5cf6" },
  relation_added: { icon: Link2, verb: "Relation added", color: "#3b82f6" },
  relation_removed: { icon: Link2, verb: "Relation removed", color: "#3b82f6" },
  relation_type_changed: { icon: Link2, verb: "Relation type changed", color: "#3b82f6" },
  alias_changed: { icon: Tag, verb: "changed aliases", color: "text-blue-400" },
  wiki_converted: { icon: FileText, verb: "converted to wiki", color: "text-purple-400" },
  attachment_added: { icon: Paperclip, verb: "attached file", color: "text-green-400" },
  attachment_removed: { icon: Paperclip, verb: "removed attachment", color: "text-red-400" },
}

// Human-readable event type labels for filter chips
export const EVENT_TYPE_GROUPS: { label: string; types: NoteEventType[] }[] = [
  { label: "Created", types: ["created"] },
  { label: "Edited", types: ["updated"] },
  { label: "Opened", types: ["opened"] },
  { label: "Status", types: ["promoted", "archived", "unarchived", "trashed", "untrashed"] },
  { label: "Triage", types: ["triage_keep", "triage_snooze", "triage_trash"] },
  { label: "Links", types: ["link_added", "link_removed", "map_added", "map_removed", "relation_added", "relation_removed", "relation_type_changed"] },
  { label: "Review", types: ["srs_reviewed"] },
  { label: "Autopilot", types: ["autopilot_applied"] },
]
