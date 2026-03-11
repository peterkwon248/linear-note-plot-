"use client"

import { History } from "lucide-react"
import { ActivityStats } from "@/components/activity/activity-stats"
import { ActivityFeed } from "@/components/activity/activity-feed"

export function ActivityView() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <History className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Activity</h1>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        <ActivityStats />
        <ActivityFeed />
      </div>
    </div>
  )
}
