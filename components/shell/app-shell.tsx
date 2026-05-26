import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function AppShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("plot-shell", className)}>{children}</div>
}

export function WorkspaceFrame({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode
  className?: string
  tone?: "default" | "secondary" | "detail"
}) {
  return (
    <div
      className={cn(
        "plot-workspace-frame",
        tone === "secondary" && "plot-workspace-frame--secondary",
        tone === "detail" && "plot-workspace-frame--detail",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function DetailPanelFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <aside className={cn("plot-detail-frame", className)}>{children}</aside>
}
