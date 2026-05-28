import { redirect } from "next/navigation"

/**
 * Legacy `/permanent` route — preserved as a server-side redirect to `/done`
 * (NoteStatus rename). Keeps user bookmarks and old share links working after the
 * inbox/capture/permanent → … → backlog/todo/in_progress/done rename history.
 */
export default function PermanentRedirectPage() {
  redirect("/done")
}
