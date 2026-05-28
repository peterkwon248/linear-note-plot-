import { redirect } from "next/navigation"

/**
 * Legacy `/capture` route — preserved as a server-side redirect to `/in-progress`
 * (NoteStatus rename). Keeps user bookmarks and old share links working after the
 * inbox/capture/permanent → … → backlog/todo/in_progress/done rename history.
 */
export default function CaptureRedirectPage() {
  redirect("/in-progress")
}
