import { redirect } from "next/navigation"

/**
 * Legacy `/permanent` route — preserved as a server-side redirect to `/keystone`
 * (Phase A NoteStatus rename). Keeps user bookmarks and old share links
 * working after inbox/capture/permanent → stone/brick/keystone rename.
 */
export default function PermanentRedirectPage() {
  redirect("/keystone")
}
