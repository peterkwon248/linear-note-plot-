"use client"

import { EditorView } from "@/components/redesign/editor/editor-view"
import { editorMock } from "@/components/redesign/editor/editor.mock"

/**
 * Editor surface — isolated render of the pure presentational `EditorView`
 * driven by mock data. This is the exact unit handed to Open Design. The
 * wrapper gives the surface a flex height so its internal `flex-1
 * overflow-y-auto` body scrolls between the fixed header and the bottom
 * FixedToolbar (live: provided by the app shell).
 *
 * ⚠️ The document body is a static approximation — the TipTap/ProseMirror
 * engine is intentionally excluded (chrome/shell redesign only).
 */
export default function EditorPreviewPage() {
  return (
    <div className="flex h-[calc(100vh-2.25rem)] flex-col">
      <EditorView vm={editorMock} />
    </div>
  )
}
