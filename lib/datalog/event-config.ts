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
import type { Icon as PhIcon } from "@phosphor-icons/react"
import type { NoteEventType } from "@/lib/types"
import { EVENT_HEX } from "@/lib/colors"

interface EventTypeConfig {
  icon: PhIcon
  verb: string
  color: string
}

export const EVENT_CONFIG: Record<NoteEventType, EventTypeConfig> = {
  created: { icon: FilePlus, verb: "Created", color: EVENT_HEX.created },
  updated: { icon: PencilSimple, verb: "Edited", color: EVENT_HEX.updated },
  opened: { icon: PhEye, verb: "Opened", color: EVENT_HEX.opened },
  promoted: { icon: ArrowCircleUp, verb: "Promoted", color: EVENT_HEX.promoted },
  trashed: { icon: Trash, verb: "Trashed", color: EVENT_HEX.trashed },
  untrashed: { icon: Trash, verb: "Restored", color: EVENT_HEX.untrashed },
  triage_keep: { icon: PhCheck, verb: "Kept", color: EVENT_HEX.triage_keep },
  triage_snooze: { icon: PhClock, verb: "Snoozed", color: EVENT_HEX.triage_snooze },
  triage_trash: { icon: Trash, verb: "Triaged to trash", color: EVENT_HEX.triage_trash },
  link_added: { icon: PhLink, verb: "Linked", color: EVENT_HEX.link_added },
  link_removed: { icon: PhLink, verb: "Unlinked", color: EVENT_HEX.link_removed },
  thread_started: { icon: PhBrain, verb: "Started thread", color: EVENT_HEX.thread_started },
  thread_step_added: { icon: PhBrain, verb: "Added thread step", color: EVENT_HEX.thread_step_added },
  thread_ended: { icon: PhBrain, verb: "Ended thread", color: EVENT_HEX.thread_ended },
  thread_deleted: { icon: Trash, verb: "Deleted thread", color: EVENT_HEX.thread_deleted },
  label_changed: { icon: PhTag, verb: "Label changed", color: EVENT_HEX.label_changed },
  srs_reviewed: { icon: PhBrain, verb: "Reviewed (SRS)", color: EVENT_HEX.srs_reviewed },
  autopilot_applied: { icon: Sparkle, verb: "Autopilot applied", color: EVENT_HEX.autopilot_applied },
  relation_added: { icon: PhLink, verb: "Relation added", color: EVENT_HEX.relation_added },
  relation_removed: { icon: PhLink, verb: "Relation removed", color: EVENT_HEX.relation_removed },
  relation_type_changed: { icon: PhLink, verb: "Relation type changed", color: EVENT_HEX.relation_type_changed },
  alias_changed: { icon: PhTag, verb: "changed aliases", color: EVENT_HEX.alias_changed },
  wiki_converted: { icon: PhFileText, verb: "converted to wiki", color: EVENT_HEX.wiki_converted },
  attachment_added: { icon: Paperclip, verb: "attached file", color: EVENT_HEX.attachment_added },
  attachment_removed: { icon: Paperclip, verb: "removed attachment", color: EVENT_HEX.attachment_removed },
  reflection_added: { icon: PhBookOpen, verb: "Added reflection", color: EVENT_HEX.reflection_added },
  split: { icon: PhScissors, verb: "Split into new note", color: EVENT_HEX.split },
}

// Human-readable event type labels for filter chips
export const EVENT_TYPE_GROUPS: { label: string; types: NoteEventType[] }[] = [
  { label: "Created", types: ["created"] },
  { label: "Edited", types: ["updated"] },
  { label: "Opened", types: ["opened"] },
  { label: "Status", types: ["promoted", "trashed", "untrashed"] },
  { label: "Triage", types: ["triage_keep", "triage_snooze", "triage_trash"] },
  { label: "Links", types: ["link_added", "link_removed", "relation_added", "relation_removed", "relation_type_changed"] },
  { label: "Review", types: ["srs_reviewed"] },
  { label: "Autopilot", types: ["autopilot_applied"] },
]
