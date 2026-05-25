import { FilePlus } from "@phosphor-icons/react/dist/ssr/FilePlus"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { Eye as PhEye } from "@phosphor-icons/react/dist/ssr/Eye"
import { ArrowCircleUp } from "@phosphor-icons/react/dist/ssr/ArrowCircleUp"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Clock as PhClock } from "@phosphor-icons/react/dist/ssr/Clock"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { Brain as PhBrain } from "@phosphor-icons/react/dist/ssr/Brain"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { FileText as PhFileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Paperclip } from "@phosphor-icons/react/dist/ssr/Paperclip"
import { BookOpen as PhBookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { Scissors as PhScissors } from "@phosphor-icons/react/dist/ssr/Scissors"
import { Cube as PhCube } from "@phosphor-icons/react/dist/ssr/Cube"
import { ArrowsDownUp } from "@phosphor-icons/react/dist/ssr/ArrowsDownUp"
import { ListPlus } from "@phosphor-icons/react/dist/ssr/ListPlus"
import { CaretRight as PhCaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { ArrowsMerge } from "@phosphor-icons/react/dist/ssr/ArrowsMerge"
import { ArrowsSplit } from "@phosphor-icons/react/dist/ssr/ArrowsSplit"
import { UserPlus } from "@phosphor-icons/react/dist/ssr/UserPlus"
import { UserMinus } from "@phosphor-icons/react/dist/ssr/UserMinus"
import { Palette } from "@phosphor-icons/react/dist/ssr/Palette"
import { TextT } from "@phosphor-icons/react/dist/ssr/TextT"
import type { Icon as PhIcon } from "@phosphor-icons/react"
import type { EntityEventType } from "@/lib/types"
import { EVENT_HEX } from "@/lib/colors"

interface EventTypeConfig {
  icon: PhIcon
  /** English verb shown in activity timeline. Kept for legacy / fallback. */
  verb: string
  /** i18n dictionary key — consumer should prefer this via useT(). */
  verbKey: string
  color: string
}

/**
 * EntityEventType → display config (icon / verb / color).
 *
 * PR 5d (activity-unification, 2026-05-14): extended from NoteEventType to
 * EntityEventType. Wiki / Book / cross-entity action types added with
 * neutral fallback colors (no new EVENT_HEX entries — kept scope tight;
 * future polish PR can promote to LOCKED palette). ActivityTimeline
 * gracefully skips unknown types via `if (!config) return null`.
 */
export const EVENT_CONFIG: Record<EntityEventType, EventTypeConfig> = {
  created: { icon: FilePlus, verb: "Created", verbKey: "event.verb.created", color: EVENT_HEX.created },
  updated: { icon: PencilSimple, verb: "Edited", verbKey: "event.verb.updated", color: EVENT_HEX.updated },
  opened: { icon: PhEye, verb: "Opened", verbKey: "event.verb.opened", color: EVENT_HEX.opened },
  promoted: { icon: ArrowCircleUp, verb: "Promoted", verbKey: "event.verb.promoted", color: EVENT_HEX.promoted },
  trashed: { icon: Trash, verb: "Trashed", verbKey: "event.verb.trashed", color: EVENT_HEX.trashed },
  untrashed: { icon: Trash, verb: "Restored", verbKey: "event.verb.untrashed", color: EVENT_HEX.untrashed },
  triage_keep: { icon: PhCheck, verb: "Kept", verbKey: "event.verb.triage_keep", color: EVENT_HEX.triage_keep },
  triage_snooze: { icon: PhClock, verb: "Snoozed", verbKey: "event.verb.triage_snooze", color: EVENT_HEX.triage_snooze },
  triage_trash: { icon: Trash, verb: "Triaged to trash", verbKey: "event.verb.triage_trash", color: EVENT_HEX.triage_trash },
  link_added: { icon: PhLink, verb: "Linked", verbKey: "event.verb.link_added", color: EVENT_HEX.link_added },
  link_removed: { icon: PhLink, verb: "Unlinked", verbKey: "event.verb.link_removed", color: EVENT_HEX.link_removed },
  thread_started: { icon: PhBrain, verb: "Started thread", verbKey: "event.verb.thread_started", color: EVENT_HEX.thread_started },
  thread_step_added: { icon: PhBrain, verb: "Added thread step", verbKey: "event.verb.thread_step_added", color: EVENT_HEX.thread_step_added },
  thread_ended: { icon: PhBrain, verb: "Ended thread", verbKey: "event.verb.thread_ended", color: EVENT_HEX.thread_ended },
  thread_deleted: { icon: Trash, verb: "Deleted thread", verbKey: "event.verb.thread_deleted", color: EVENT_HEX.thread_deleted },
  label_changed: { icon: PhTag, verb: "Label changed", verbKey: "event.verb.label_changed", color: EVENT_HEX.label_changed },
  srs_reviewed: { icon: PhBrain, verb: "Reviewed (SRS)", verbKey: "event.verb.srs_reviewed", color: EVENT_HEX.srs_reviewed },
  autopilot_applied: { icon: Sparkle, verb: "Autopilot applied", verbKey: "event.verb.autopilot_applied", color: EVENT_HEX.autopilot_applied },
  relation_added: { icon: PhLink, verb: "Relation added", verbKey: "event.verb.relation_added", color: EVENT_HEX.relation_added },
  relation_removed: { icon: PhLink, verb: "Relation removed", verbKey: "event.verb.relation_removed", color: EVENT_HEX.relation_removed },
  relation_type_changed: { icon: PhLink, verb: "Relation type changed", verbKey: "event.verb.relation_type_changed", color: EVENT_HEX.relation_type_changed },
  alias_changed: { icon: PhTag, verb: "changed aliases", verbKey: "event.verb.alias_changed", color: EVENT_HEX.alias_changed },
  wiki_converted: { icon: PhFileText, verb: "converted to wiki", verbKey: "event.verb.wiki_converted", color: EVENT_HEX.wiki_converted },
  attachment_added: { icon: Paperclip, verb: "attached file", verbKey: "event.verb.attachment_added", color: EVENT_HEX.attachment_added },
  attachment_removed: { icon: Paperclip, verb: "removed attachment", verbKey: "event.verb.attachment_removed", color: EVENT_HEX.attachment_removed },
  reflection_added: { icon: PhBookOpen, verb: "Added reflection", verbKey: "event.verb.reflection_added", color: EVENT_HEX.reflection_added },
  split: { icon: PhScissors, verb: "Split into new note", verbKey: "event.verb.split", color: EVENT_HEX.split },
  // ── Wiki-specific (PR 5d) ──────────────────────────────
  block_added: { icon: PhCube, verb: "Added block", verbKey: "event.verb.block_added", color: "#5e6ad2" },
  block_removed: { icon: Trash, verb: "Removed block", verbKey: "event.verb.block_removed", color: "#6b7280" },
  block_reordered: { icon: ArrowsDownUp, verb: "Reordered blocks", verbKey: "event.verb.block_reordered", color: "#6b7280" },
  section_collapsed: { icon: PhCaretRight, verb: "Toggled section", verbKey: "event.verb.section_collapsed", color: "#6b7280" },
  merged: { icon: ArrowsMerge, verb: "Merged article", verbKey: "event.verb.merged", color: "#10b981" },
  unmerged: { icon: ArrowsSplit, verb: "Unmerged article", verbKey: "event.verb.unmerged", color: "#f59e0b" },
  // ── Book-specific (PR 5d) ──────────────────────────────
  item_added: { icon: ListPlus, verb: "Added item", verbKey: "event.verb.item_added", color: "#5e6ad2" },
  item_removed: { icon: Trash, verb: "Removed item", verbKey: "event.verb.item_removed", color: "#6b7280" },
  item_reordered: { icon: ArrowsDownUp, verb: "Reordered items", verbKey: "event.verb.item_reordered", color: "#6b7280" },
  smart_source_added: { icon: Sparkle, verb: "Added smart source", verbKey: "event.verb.smart_source_added", color: "#8b5cf6" },
  smart_source_removed: { icon: Trash, verb: "Removed smart source", verbKey: "event.verb.smart_source_removed", color: "#6b7280" },
  converted_to_manual: { icon: PencilSimple, verb: "Converted to manual", verbKey: "event.verb.converted_to_manual", color: "#f59e0b" },
  chapter_added: { icon: PhBookOpen, verb: "Added chapter", verbKey: "event.verb.chapter_added", color: "#5e6ad2" },
  // ── Cross-entity (PR 5d) — Tag / Sticker / File / Reference ──
  member_added: { icon: UserPlus, verb: "Added member", verbKey: "event.verb.member_added", color: "#10b981" },
  member_removed: { icon: UserMinus, verb: "Removed member", verbKey: "event.verb.member_removed", color: "#6b7280" },
  color_changed: { icon: Palette, verb: "Color changed", verbKey: "event.verb.color_changed", color: "#a855f7" },
  renamed: { icon: TextT, verb: "Renamed", verbKey: "event.verb.renamed", color: "#5e6ad2" },
}

// Human-readable event type labels for filter chips
export const EVENT_TYPE_GROUPS: { label: string; types: EntityEventType[] }[] = [
  { label: "Created", types: ["created"] },
  { label: "Edited", types: ["updated"] },
  { label: "Opened", types: ["opened"] },
  { label: "Status", types: ["promoted", "trashed", "untrashed"] },
  { label: "Triage", types: ["triage_keep", "triage_snooze", "triage_trash"] },
  { label: "Links", types: ["link_added", "link_removed", "relation_added", "relation_removed", "relation_type_changed"] },
  { label: "Review", types: ["srs_reviewed"] },
  { label: "Autopilot", types: ["autopilot_applied"] },
]
