"use client"

import { NoteListPage } from "@/components/note-list-page"

export default function ArchivePage() {
  return <NoteListPage filter={{ type: "archive" }} />
}
