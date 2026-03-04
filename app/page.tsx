"use client"

import { LinearSidebar } from "@/components/linear-sidebar"
import { NoteList } from "@/components/note-list"
import { NoteEditor } from "@/components/note-editor"
import { SearchDialog } from "@/components/search-dialog"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function Page() {
  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        <LinearSidebar />
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
            <NoteList />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={65} minSize={40}>
            <NoteEditor />
          </ResizablePanel>
        </ResizablePanelGroup>
        <SearchDialog />
      </div>
    </TooltipProvider>
  )
}
