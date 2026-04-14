"use client"

import { useState } from "react"
import { usePlotStore } from "@/lib/store"
import { useSettingsStore } from "@/lib/settings-store"
import { downloadFullBackup, formatSize, type PlotBackup } from "@/lib/idb-backup"
import {
  SettingsPageTitle,
  SettingsCard,
  SettingRow,
  Divider,
} from "@/components/settings-ui"

export default function BackupPage() {
  const notes = usePlotStore((s) => s.notes)
  const deleteNote = usePlotStore((s) => s.deleteNote)
  const confirmDelete = useSettingsStore((s) => s.confirmDelete)
  const [deleting, setDeleting] = useState(false)
  const [fullBackupState, setFullBackupState] = useState<"idle" | "preparing" | "done" | "error">("idle")
  const [lastFullBackup, setLastFullBackup] = useState<{ sizeBytes: number; stats: PlotBackup["stats"] } | null>(null)
  const [fullBackupError, setFullBackupError] = useState<string | null>(null)

  const handleExportMarkdown = () => {
    const markdownNotes = notes.map((note) => {
      const title = note.title || "Untitled"
      const content = note.content || ""
      return `# ${title}\n\n${content}`
    })
    const combined = markdownNotes.join("\n\n---\n\n")
    const blob = new Blob([combined], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plot-notes-export.md"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFullBackup = async () => {
    setFullBackupState("preparing")
    setFullBackupError(null)
    try {
      const result = await downloadFullBackup()
      setLastFullBackup(result)
      setFullBackupState("done")
    } catch (e) {
      setFullBackupError(e instanceof Error ? e.message : String(e))
      setFullBackupState("error")
    }
  }

  const handleDeleteAll = () => {
    if (confirmDelete) {
      const ok = window.confirm(
        `Are you sure you want to delete all ${notes.length} notes? This cannot be undone.`
      )
      if (!ok) return
    }
    setDeleting(true)
    const ids = notes.map((n) => n.id)
    ids.forEach((id) => deleteNote(id))
    setDeleting(false)
  }

  return (
    <>
      <SettingsPageTitle>{"Backup & Export"}</SettingsPageTitle>

      <SettingsCard title="Full backup">
        <SettingRow
          label="Full data snapshot"
          description={
            fullBackupState === "done" && lastFullBackup
              ? `Saved ${formatSize(lastFullBackup.sizeBytes)} · ${lastFullBackup.stats.notesCount} notes, ${lastFullBackup.stats.wikiArticlesCount} wiki articles, ${lastFullBackup.stats.referencesCount} references`
              : fullBackupState === "error"
                ? `Failed: ${fullBackupError ?? "unknown error"}`
                : "Every IndexedDB database (notes, wiki, references, attachments). Recommended before major changes."
          }
        >
          <button
            onClick={handleFullBackup}
            disabled={fullBackupState === "preparing"}
            className="rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 text-ui text-accent transition-colors hover:bg-accent/15 disabled:opacity-50"
          >
            {fullBackupState === "preparing"
              ? "Preparing…"
              : fullBackupState === "done"
                ? "Download again"
                : "Full Backup"}
          </button>
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Export">
        <SettingRow
          label="Export notes (JSON)"
          description={`Notes only — ${notes.length} notes. Use Full Backup above for complete data.`}
        >
          <button
            onClick={() => {
              const data = JSON.stringify(notes, null, 2)
              const blob = new Blob([data], { type: "application/json" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = "plot-notes-export.json"
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-ui text-foreground transition-colors hover:bg-hover-bg"
          >
            Export JSON
          </button>
        </SettingRow>
        <Divider />
        <SettingRow
          label="Export as Markdown"
          description="Download all notes as a single .md file"
        >
          <button
            onClick={handleExportMarkdown}
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-ui text-foreground transition-colors hover:bg-hover-bg"
          >
            Export Markdown
          </button>
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Danger zone">
        <SettingRow
          label="Delete all notes"
          description="Permanently remove all notes. This cannot be undone."
        >
          <button
            onClick={handleDeleteAll}
            disabled={deleting || notes.length === 0}
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-ui text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete All"}
          </button>
        </SettingRow>
      </SettingsCard>
    </>
  )
}
