"use client"

import { Bell, Brain, Moon as MoonStars, Unlink as LinkBreak, Sparkles as Sparkle, Target, Square, MessageSquare, Lightbulb } from "lucide-react"
import type { InboxItemKind } from "@/lib/store/slices/inbox"

export function InboxSourceIcon({ kind, className }: { kind: InboxItemKind; className?: string }) {
  const iconProps = { size: 14, strokeWidth: 2, className }
  switch (kind) {
    case "srs":            return <Brain {...iconProps} />
    case "snooze-expired": return <MoonStars {...iconProps} />
    case "wiki-redlink":   return <LinkBreak {...iconProps} />
    case "auto-enroll":    return <Sparkle {...iconProps} />
    case "plan-due":       return <Target {...iconProps} />
    case "task":           return <Square {...iconProps} />
    case "comment":        return <MessageSquare {...iconProps} />
    case "ontology-nudge": return <Lightbulb {...iconProps} />
    case "reminder":
    default:               return <Bell {...iconProps} />
  }
}
