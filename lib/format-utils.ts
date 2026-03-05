import { formatDistanceToNowStrict } from "date-fns"

/**
 * Compact relative-time string: "2d", "3h", "10m", "1y", etc.
 * Shared between notes-table and search-dialog.
 */
export function shortRelative(dateStr: string): string {
  const dist = formatDistanceToNowStrict(new Date(dateStr), { addSuffix: false })
  return dist
    .replace(/ seconds?/, "s")
    .replace(/ minutes?/, "m")
    .replace(/ hours?/, "h")
    .replace(/ days?/, "d")
    .replace(/ weeks?/, "w")
    .replace(/ months?/, "mo")
    .replace(/ years?/, "y")
}
