import { redirect } from "next/navigation"

/**
 * Legacy `/capture` route — preserved as a server-side redirect to `/brick`
 * (Phase A NoteStatus rename). Keeps user bookmarks and old share links
 * working after inbox/capture/permanent → stone/brick/keystone rename.
 */
export default function CaptureRedirectPage() {
  redirect("/brick")
}
