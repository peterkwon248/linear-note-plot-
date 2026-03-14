"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { ChevronDown, ChevronRight, Plus, Check, MessageSquare, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { format } from "date-fns"
import type { Thread } from "@/lib/types"

interface ThreadPanelProps {
  noteId: string
}

function DoneThreadItem({ thread }: { thread: Thread }) {
  const [expanded, setExpanded] = useState(false)
  const deleteThread = usePlotStore((s) => s.deleteThread)

  return (
    <div className="group/done border border-border/50 rounded-md overflow-hidden">
      <div className="flex w-full items-center hover:bg-secondary/30 transition-colors">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex flex-1 items-center gap-2 px-3 py-2 text-left"
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          <Check className="h-3 w-3 text-green-500 shrink-0" />
          <span className="text-xs text-muted-foreground">
            {format(new Date(thread.startedAt), "MMM d, h:mm a")}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {thread.steps.length} step{thread.steps.length !== 1 ? "s" : ""}
          </span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); deleteThread(thread.id) }}
          className="opacity-0 group-hover/done:opacity-100 flex items-center justify-center px-2 py-2 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {expanded && thread.steps.length > 0 && (
        <div className="px-3 pb-3 pt-1">
          <div className="ml-4 border-l-2 border-border pl-3 space-y-2">
            {thread.steps.map((step) => (
              <div key={step.id} className="relative">
                <div className="absolute -left-[17px] top-[6px] w-2 h-2 rounded-full bg-cyan-500" />
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{step.text}</p>
                <span className="text-[10px] text-muted-foreground/60">
                  {format(new Date(step.at), "h:mm a")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ThreadPanel({ noteId }: ThreadPanelProps) {
  const threads = usePlotStore((s) => s.threads)
  const startThread = usePlotStore((s) => s.startThread)
  const addThreadStep = usePlotStore((s) => s.addThreadStep)
  const endThread = usePlotStore((s) => s.endThread)
  const deleteThread = usePlotStore((s) => s.deleteThread)

  const noteThreads = (threads ?? []).filter((t) => t.noteId === noteId)
  const activeThread = noteThreads.find((t) => t.status === "active")
  const doneThreads = noteThreads.filter((t) => t.status === "done")

  const [collapsed, setCollapsed] = useState(true)
  const [stepText, setStepText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-expand when there's an active thread
  useEffect(() => {
    if (activeThread) {
      setCollapsed(false)
    }
  }, [activeThread?.id])

  const handleStartThread = () => {
    startThread(noteId)
    setCollapsed(false)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const handleAddStep = () => {
    if (!activeThread || !stepText.trim()) return
    addThreadStep(activeThread.id, stepText.trim())
    setStepText("")
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAddStep()
    }
  }

  const handleEndThread = () => {
    if (!activeThread) return
    endThread(activeThread.id)
    setStepText("")
  }

  const activeBadgeCount = activeThread ? 1 : 0

  return (
    <div className="flex-shrink-0">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-muted-foreground">Thread</span>
        {activeBadgeCount > 0 && (
          <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500/20 px-1 text-[10px] font-medium text-cyan-500">
            {activeBadgeCount}
          </span>
        )}
        {doneThreads.length > 0 && (
          <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-border px-1 text-[10px] font-medium text-muted-foreground">
            {doneThreads.length}
          </span>
        )}
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {/* Active Thread */}
          {activeThread ? (
            <div className="space-y-2">
              {/* Steps timeline */}
              {activeThread.steps.length > 0 && (
                <div className="ml-2 border-l-2 border-border pl-3 space-y-2">
                  {activeThread.steps.map((step) => (
                    <div key={step.id} className="relative">
                      <div className="absolute -left-[17px] top-[6px] w-2 h-2 rounded-full bg-cyan-500" />
                      <p className="text-sm text-foreground whitespace-pre-wrap">{step.text}</p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(step.at), "h:mm a")}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* New step input */}
              <div className="flex gap-2 items-start">
                <div className="mt-2 ml-2 w-2 h-2 rounded-full bg-cyan-500/40 shrink-0" />
                <textarea
                  ref={textareaRef}
                  value={stepText}
                  onChange={(e) => setStepText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a step... (Enter to add, Shift+Enter for newline)"
                  rows={1}
                  className={cn(
                    "flex-1 resize-none bg-transparent text-sm text-foreground",
                    "placeholder:text-muted-foreground/50 outline-none",
                    "min-h-[28px] leading-relaxed"
                  )}
                  style={{ fieldSizing: "content" } as React.CSSProperties}
                />
              </div>

              {/* End Thread / Delete button */}
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => { deleteThread(activeThread.id) }}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
                <button
                  onClick={handleEndThread}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <Check className="h-3 w-3" />
                  End Thread
                </button>
              </div>
            </div>
          ) : (
            /* Start Thread button (shown when no active thread) */
            <button
              onClick={handleStartThread}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors border border-border/50"
            >
              <Plus className="h-3 w-3" />
              Start Thread
            </button>
          )}

          {/* Done Threads */}
          {doneThreads.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 px-1">
                Completed
              </p>
              {doneThreads.map((thread) => (
                <DoneThreadItem key={thread.id} thread={thread} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
