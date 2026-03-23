import {
  FilePlus, Pencil, Eye, ArrowUpCircle, Archive, Trash2,
  Check, Clock, Tag, Brain, Sparkles, Link2, FileText, Paperclip, BookOpen,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { NoteEventType } from "@/lib/types"
import { EVENT_HEX } from "@/lib/colors"

interface EventTypeConfig {
  icon: LucideIcon
  verb: string
  color: string
}

export const EVENT_CONFIG: Record<NoteEventType, EventTypeConfig> = {
  created: { icon: FilePlus, verb: "Created", color: EVENT_HEX.created },
  updated: { icon: Pencil, verb: "Edited", color: EVENT_HEX.updated },
  opened: { icon: Eye, verb: "Opened", color: EVENT_HEX.opened },
  promoted: { icon: ArrowUpCircle, verb: "Promoted", color: EVENT_HEX.promoted },
  archived: { icon: Archive, verb: "Archived", color: EVENT_HEX.archived },
  unarchived: { icon: Archive, verb: "Unarchived", color: EVENT_HEX.unarchived },
  trashed: { icon: Trash2, verb: "Trashed", color: EVENT_HEX.trashed },
  untrashed: { icon: Trash2, verb: "Restored", color: EVENT_HEX.untrashed },
  triage_keep: { icon: Check, verb: "Kept", color: EVENT_HEX.triage_keep },
  triage_snooze: { icon: Clock, verb: "Snoozed", color: EVENT_HEX.triage_snooze },
  triage_trash: { icon: Trash2, verb: "Triaged to trash", color: EVENT_HEX.triage_trash },
  link_added: { icon: Link2, verb: "Linked", color: EVENT_HEX.link_added },
  link_removed: { icon: Link2, verb: "Unlinked", color: EVENT_HEX.link_removed },
  thread_started: { icon: Brain, verb: "Started thread", color: EVENT_HEX.thread_started },
  thread_step_added: { icon: Brain, verb: "Added thread step", color: EVENT_HEX.thread_step_added },
  thread_ended: { icon: Brain, verb: "Ended thread", color: EVENT_HEX.thread_ended },
  thread_deleted: { icon: Trash2, verb: "Deleted thread", color: EVENT_HEX.thread_deleted },
  label_changed: { icon: Tag, verb: "Label changed", color: EVENT_HEX.label_changed },
  srs_reviewed: { icon: Brain, verb: "Reviewed (SRS)", color: EVENT_HEX.srs_reviewed },
  autopilot_applied: { icon: Sparkles, verb: "Autopilot applied", color: EVENT_HEX.autopilot_applied },
  relation_added: { icon: Link2, verb: "Relation added", color: EVENT_HEX.relation_added },
  relation_removed: { icon: Link2, verb: "Relation removed", color: EVENT_HEX.relation_removed },
  relation_type_changed: { icon: Link2, verb: "Relation type changed", color: EVENT_HEX.relation_type_changed },
  alias_changed: { icon: Tag, verb: "changed aliases", color: EVENT_HEX.alias_changed },
  wiki_converted: { icon: FileText, verb: "converted to wiki", color: EVENT_HEX.wiki_converted },
  attachment_added: { icon: Paperclip, verb: "attached file", color: EVENT_HEX.attachment_added },
  attachment_removed: { icon: Paperclip, verb: "removed attachment", color: EVENT_HEX.attachment_removed },
  reflection_added: { icon: BookOpen, verb: "Added reflection", color: EVENT_HEX.reflection_added },
}

// Human-readable event type labels for filter chips
export const EVENT_TYPE_GROUPS: { label: string; types: NoteEventType[] }[] = [
  { label: "Created", types: ["created"] },
  { label: "Edited", types: ["updated"] },
  { label: "Opened", types: ["opened"] },
  { label: "Status", types: ["promoted", "archived", "unarchived", "trashed", "untrashed"] },
  { label: "Triage", types: ["triage_keep", "triage_snooze", "triage_trash"] },
  { label: "Links", types: ["link_added", "link_removed", "relation_added", "relation_removed", "relation_type_changed"] },
  { label: "Review", types: ["srs_reviewed"] },
  { label: "Autopilot", types: ["autopilot_applied"] },
]
