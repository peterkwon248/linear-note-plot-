"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import type { TaskItem } from "@/lib/todo-index"
import { CheckSquare } from "@phosphor-icons/react/dist/ssr/CheckSquare"
import { Square } from "@phosphor-icons/react/dist/ssr/Square"
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"

export function TodoView() {
  const todoTasks = usePlotStore((s) => s.todoTasks)
  const toggleTaskChecked = usePlotStore((s) => s.toggleTaskChecked)
  const addQuickTask = usePlotStore((s) => s.addQuickTask)
  const openNote = usePlotStore((s) => s.openNote)
  const rebuildTodoIndex = usePlotStore((s) => s.rebuildTodoIndex)

  const [showCompleted, setShowCompleted] = useState(false)
  const [newTaskText, setNewTaskText] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const incomplete = useMemo(() => todoTasks.filter((t) => !t.checked), [todoTasks])
  const completed = useMemo(() => todoTasks.filter((t) => t.checked), [todoTasks])
  const total = todoTasks.length
  const completedCount = completed.length
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0

  function handleNoteClick(noteId: string) {
    setActiveRoute("/notes")
    openNote(noteId)
  }

  // Rebuild index on mount
  useEffect(() => {
    rebuildTodoIndex()
  }, [rebuildTodoIndex])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Todos</h1>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-secondary/60">
              <div
                className="h-full rounded-full bg-chart-5 transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-2xs text-muted-foreground tabular-nums">
              {completedCount}/{total}
            </span>
          </div>
        </div>

        {/* Quick add task */}
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-overlay px-4 py-2.5">
          <Plus size={16} className="shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTaskText.trim()) {
                addQuickTask(newTaskText.trim())
                setNewTaskText("")
              }
            }}
            placeholder="Add a task..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          />
          {newTaskText.trim() && (
            <span className="text-2xs text-muted-foreground">Enter to add</span>
          )}
        </div>

        {/* Empty state */}
        {total === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <CheckSquare size={32} className="text-muted-foreground/40" />
            <p className="text-note text-muted-foreground">No tasks yet</p>
            <p className="text-2xs text-muted-foreground/60">
              Type above to add your first task
            </p>
          </div>
        )}

        {/* Incomplete tasks */}
        {incomplete.length > 0 && (
          <section className="mb-6">
            <h2 className="text-2xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Incomplete ({incomplete.length})
            </h2>
            <div className="rounded-lg border border-border-subtle bg-surface-overlay">
              {incomplete.map((task, i) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTaskChecked(task.noteId, task.position)}
                  onNoteClick={() => handleNoteClick(task.noteId)}
                  isLast={i === incomplete.length - 1}
                />
              ))}
            </div>
          </section>
        )}

        {/* Completed tasks */}
        {completed.length > 0 && (
          <section>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-1.5 text-2xs font-medium text-muted-foreground uppercase tracking-wide mb-2 hover:text-foreground transition-colors"
            >
              {showCompleted ? <CaretDown size={12} /> : <CaretRight size={12} />}
              Completed ({completed.length})
            </button>
            {showCompleted && (
              <div className="rounded-lg border border-border-subtle bg-surface-overlay">
                {completed.map((task, i) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTaskChecked(task.noteId, task.position)}
                    onNoteClick={() => handleNoteClick(task.noteId)}
                    isLast={i === completed.length - 1}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

function TaskRow({
  task,
  onToggle,
  onNoteClick,
  isLast,
}: {
  task: TaskItem
  onToggle: () => void
  onNoteClick: () => void
  isLast: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-hover-bg ${
        !isLast ? "border-b border-border-subtle" : ""
      }`}
    >
      <button
        onClick={onToggle}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        {task.checked ? (
          <CheckSquare size={18} weight="fill" className="text-chart-5" />
        ) : (
          <Square size={18} />
        )}
      </button>
      <span
        className={`flex-1 text-sm truncate ${
          task.checked ? "line-through text-muted-foreground/50" : "text-foreground"
        }`}
      >
        {task.text || "Untitled task"}
      </span>
      <button
        onClick={onNoteClick}
        className="shrink-0 text-2xs text-muted-foreground/60 hover:text-foreground transition-colors truncate max-w-[150px]"
      >
        {task.noteTitle || "Untitled"}
      </button>
    </div>
  )
}
