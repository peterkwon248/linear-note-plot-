import { cn } from "@/lib/utils"
import type { NoteStatus } from "@/lib/types"

/**
 * Shared status icon component — □ inbox, ▣ capture/reference, ☑ permanent.
 * Used across sidebar, editor backlinks footer, and notes table.
 */
export function StatusIcon({ status, className }: { status: NoteStatus; className?: string }) {
  if (status === "inbox") {
    return (
      <span
        className={cn("inline-block h-3.5 w-3.5 shrink-0 rounded-sm border border-current", className)}
        style={{ borderWidth: "1.5px" }}
      />
    )
  }
  if (status === "permanent") {
    return (
      <span
        className={cn("inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border border-current", className)}
        style={{ borderWidth: "1.5px" }}
      >
        <span className="block h-1.5 w-1.5 rounded-none" style={{ background: "currentColor", clipPath: "polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)" }} />
      </span>
    )
  }
  // capture or reference: filled square with inner fill
  return (
    <span
      className={cn("inline-block h-3.5 w-3.5 shrink-0 rounded-sm border border-current", className)}
      style={{ borderWidth: "1.5px", background: "currentColor", opacity: 0.6 }}
    />
  )
}
