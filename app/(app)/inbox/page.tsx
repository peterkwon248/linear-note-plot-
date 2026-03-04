"use client"

import { NoteListPage } from "@/components/note-list-page"

export default function InboxPage() {
  return <NoteListPage filter={{ type: "inbox" }} />
}
