import { cn } from "@/lib/utils"
import type { NoteStatus } from "@/lib/types"

/**
 * Linear-style status indicator — colored circles with distinct states.
 * - inbox: hollow gray circle (pending)
 * - capture: half-filled amber circle (in progress)
 * - permanent: solid green circle (complete)
 */

const STATUS_COLORS = {
  inbox: "#6b7280",     // gray-500
  capture: "#f59e0b",   // amber-500
  permanent: "#22c55e", // green-500
}

export function StatusIcon({ status, className }: { status: NoteStatus; className?: string }) {
  const color = STATUS_COLORS[status]
  
  if (status === "inbox") {
    // Hollow circle
    return (
      <span
        className={cn("inline-block h-3 w-3 shrink-0 rounded-full", className)}
        style={{ 
          border: `1.5px solid ${color}`,
          opacity: 0.7
        }}
      />
    )
  }
  
  if (status === "capture") {
    // Half-filled circle (gradient effect)
    return (
      <span
        className={cn("inline-block h-3 w-3 shrink-0 rounded-full", className)}
        style={{ 
          border: `1.5px solid ${color}`,
          background: `linear-gradient(to top, ${color} 50%, transparent 50%)`
        }}
      />
    )
  }
  
  // permanent: solid filled circle
  return (
    <span
      className={cn("inline-block h-3 w-3 shrink-0 rounded-full", className)}
      style={{ 
        backgroundColor: color,
      }}
    />
  )
}
