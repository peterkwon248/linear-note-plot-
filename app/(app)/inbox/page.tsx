import { redirect } from "next/navigation"

/**
 * Legacy `/inbox` route — preserved as a server-side redirect to `/stone`
 * (Phase A NoteStatus rename). Keeps user bookmarks and old share links
 * working after inbox/capture/permanent → stone/brick/keystone rename.
 */
export default function InboxRedirectPage() {
  redirect("/stone")
}
