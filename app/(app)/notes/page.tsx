"use client"

import { NoteListPage } from "@/components/note-list-page"

export default function NotesPage() {
  return <NoteListPage filter={{ type: "all" }} />
}
