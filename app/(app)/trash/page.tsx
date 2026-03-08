"use client"

import { NoteListPage } from "@/components/note-list-page"

export default function TrashPage() {
  return <NoteListPage filter={{ type: "trash" }} />
}
