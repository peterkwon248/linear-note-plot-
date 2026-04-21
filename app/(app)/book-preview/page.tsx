"use client"

// Phase 2A — Book preview route. Renders the full 4-layer Book editor
// (Shell picker + Grid editor + Flipbook viewer) without touching the existing
// Wiki system. Used for design validation during Phase 2-5.
//
// Once the new renderer is stable, this replaces app/(app)/wiki/page.tsx
// via Phase 3+ cleanup (per BRAINSTORM-2026-04-21-book-pivot.md).

import dynamic from "next/dynamic"

const BookEditor = dynamic(() => import("@/components/book/book-editor").then((m) => m.BookEditor), {
  ssr: false,
})

export default function BookPreviewPage() {
  return <BookEditor />
}
