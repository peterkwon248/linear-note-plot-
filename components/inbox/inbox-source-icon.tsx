"use client"

import { Bell } from "@phosphor-icons/react/dist/ssr/Bell"
import { Brain } from "@phosphor-icons/react/dist/ssr/Brain"
import { MoonStars } from "@phosphor-icons/react/dist/ssr/MoonStars"
import { LinkBreak } from "@phosphor-icons/react/dist/ssr/LinkBreak"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"
import type { InboxItemKind } from "@/lib/store/slices/inbox"

export function InboxSourceIcon({ kind, className }: { kind: InboxItemKind; className?: string }) {
  const iconProps = { size: 14, weight: "regular" as const, className }
  switch (kind) {
    case "srs":            return <Brain {...iconProps} />
    case "snooze-expired": return <MoonStars {...iconProps} />
    case "wiki-redlink":   return <LinkBreak {...iconProps} />
    case "auto-enroll":    return <Sparkle {...iconProps} />
    case "reminder":
    default:               return <Bell {...iconProps} />
  }
}
