"use client"

import { NoteListPage } from "@/components/note-list-page"

export default function ProjectsPage() {
  return <NoteListPage filter={{ type: "projects" }} />
}
