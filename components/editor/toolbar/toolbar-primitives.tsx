"use client"

import { cn } from "@/lib/utils"

/* ── ToolbarButton ───────────────────────────────────────── */

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
  /** 'default' = 40×40 (FixedToolbar), 'sm' = 24×24 (bubble) */
  size?: "default" | "sm"
  className?: string
}

export function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
  size = "default",
  className,
}: ToolbarButtonProps) {
  const sizeClasses = size === "sm" ? "w-6 h-6" : "w-10 h-10"

  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => { if (!disabled) onClick() }}
      disabled={disabled}
      title={title}
      className={cn(
        sizeClasses,
        "rounded-md flex items-center justify-center shrink-0 border-0 outline-none transition-colors duration-100",
        disabled
          ? "cursor-not-allowed opacity-40 text-muted-foreground"
          : isActive
            ? "cursor-pointer text-foreground bg-toolbar-active"
            : "cursor-pointer text-muted-foreground hover:text-foreground hover:bg-hover-bg",
        className,
      )}
    >
      {children}
    </button>
  )
}

/* ── ToolbarDivider ──────────────────────────────────────── */

export function ToolbarDivider({ className }: { className?: string }) {
  return (
    <div className={cn("w-px h-7 bg-border-subtle mx-1 shrink-0", className)} />
  )
}

/* ── ToolbarGroup ────────────────────────────────────────── */

export function ToolbarGroup({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {children}
    </div>
  )
}

/* ── ToolbarSpacer ───────────────────────────────────────── */

export function ToolbarSpacer() {
  return <div className="flex-1" />
}
