"use client"

import { useRef, useState } from "react"
import { usePlotStore } from "@/lib/store"
import { useSettingsStore } from "@/lib/settings-store"
import { downloadFullBackup, formatSize, restoreFromFile, type PlotBackup, type RestoreSummary } from "@/lib/idb-backup"
import { clearMentionIndex } from "@/lib/mention-index-store"
import { clearCache as clearSearchCache } from "@/lib/search/search-index-db"
import { useT } from "@/lib/i18n"
import {
  SettingsPageTitle,
  SettingsCard,
  SettingRow,
  Divider,
} from "@/components/settings-ui"

export default function BackupPage() {
  const t = useT()
  const notes = usePlotStore((s) => s.notes)
  const deleteNote = usePlotStore((s) => s.deleteNote)
  const confirmDelete = useSettingsStore((s) => s.confirmDelete)
  const markBackupTaken = useSettingsStore((s) => s.markBackupTaken)
  const [deleting, setDeleting] = useState(false)
  const [fullBackupState, setFullBackupState] = useState<"idle" | "preparing" | "done" | "error">("idle")
  const [lastFullBackup, setLastFullBackup] = useState<{ sizeBytes: number; stats: PlotBackup["stats"] } | null>(null)
  const [fullBackupError, setFullBackupError] = useState<string | null>(null)
  const [restoreState, setRestoreState] = useState<"idle" | "restoring" | "done" | "error">("idle")
  const [restoreSummary, setRestoreSummary] = useState<RestoreSummary | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const restoreInputRef = useRef<HTMLInputElement>(null)

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
      // Record the timestamp so the Sync page's backup reminder knows
      // the user is up to date.
      markBackupTaken()
    } catch (e) {
      setFullBackupError(e instanceof Error ? e.message : String(e))
      setFullBackupState("error")
    }
  }

  const handleRestoreClick = () => {
    restoreInputRef.current?.click()
  }

  const handleRestoreFile = async (file: File) => {
    if (confirmDelete) {
      const ok = window.confirm(
        `Restore from "${file.name}"?\n\n` +
          "This OVERWRITES every Plot database in this browser " +
          "(notes, wiki, references, attachments). The page will reload " +
          "afterwards. Make sure you have a fresh backup of your current " +
          "state if you want to keep it."
      )
      if (!ok) {
        if (restoreInputRef.current) restoreInputRef.current.value = ""
        return
      }
    }
    setRestoreState("restoring")
    setRestoreError(null)
    setRestoreSummary(null)
    try {
      const summary = await restoreFromFile(file)
      // The restored DBs replaced the source data, but the derived caches
      // (backlink edges, search index) still reflect the PRE-restore state.
      // Clear them so they rebuild from the restored data after reload.
      await clearMentionIndex()
      await clearSearchCache()
      setRestoreSummary(summary)
      setRestoreState("done")
      // Reload so the Zustand store re-hydrates from the freshly restored
      // IDB snapshot — keeping the old in-memory state would lie to the user.
      setTimeout(() => window.location.reload(), 600)
    } catch (e) {
      setRestoreError(e instanceof Error ? e.message : String(e))
      setRestoreState("error")
    } finally {
      if (restoreInputRef.current) restoreInputRef.current.value = ""
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
      <SettingsPageTitle>{t("settings.backup.title")}</SettingsPageTitle>

      <SettingsCard title={t("settings.backup.full.title")}>
        <SettingRow
          label={t("settings.backup.full.label")}
          description={
            fullBackupState === "done" && lastFullBackup
              ? `Saved ${formatSize(lastFullBackup.sizeBytes)} · ${lastFullBackup.stats.notesCount} notes, ${lastFullBackup.stats.wikiArticlesCount} wiki articles, ${lastFullBackup.stats.referencesCount} references`
              : fullBackupState === "error"
                ? `Failed: ${fullBackupError ?? "unknown error"}`
                : t("settings.backup.full.description")
          }
        >
          <button
            onClick={handleFullBackup}
            disabled={fullBackupState === "preparing"}
            className="rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 text-ui text-accent transition-colors hover:bg-accent/15 disabled:opacity-50"
          >
            {fullBackupState === "preparing"
              ? t("settings.backup.full.preparing")
              : fullBackupState === "done"
                ? t("settings.backup.full.download_again")
                : t("settings.backup.full.button")}
          </button>
        </SettingRow>
        <Divider />
        <SettingRow
          label={t("settings.backup.restore.label")}
          description={
            restoreState === "done" && restoreSummary
              ? `Restored ${restoreSummary.totalWritten} entries across ${restoreSummary.perDb.length} databases. Reloading…`
              : restoreState === "error"
                ? `Failed: ${restoreError ?? "unknown error"}`
                : t("settings.backup.restore.description")
          }
        >
          <input
            ref={restoreInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleRestoreFile(file)
            }}
          />
          <button
            onClick={handleRestoreClick}
            disabled={restoreState === "restoring"}
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-ui text-foreground transition-colors hover:bg-hover-bg disabled:opacity-50"
          >
            {restoreState === "restoring"
              ? t("settings.backup.restore.busy")
              : restoreState === "done"
                ? t("settings.backup.restore.done")
                : t("settings.backup.restore.button")}
          </button>
        </SettingRow>
      </SettingsCard>

      <SettingsCard title={t("settings.backup.export.title")}>
        <SettingRow
          label={t("settings.backup.export.json.label")}
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
            {t("settings.backup.export.json.button")}
          </button>
        </SettingRow>
        <Divider />
        <SettingRow
          label={t("settings.backup.export.md.label")}
          description={t("settings.backup.export.md.description")}
        >
          <button
            onClick={handleExportMarkdown}
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-ui text-foreground transition-colors hover:bg-hover-bg"
          >
            {t("settings.backup.export.md.button")}
          </button>
        </SettingRow>
      </SettingsCard>

      <SettingsCard title={t("settings.backup.danger.title")}>
        <SettingRow
          label={t("settings.backup.danger.label")}
          description={t("settings.backup.danger.description")}
        >
          <button
            onClick={handleDeleteAll}
            disabled={deleting || notes.length === 0}
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-ui text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
          >
            {deleting ? t("settings.backup.danger.deleting") : t("settings.backup.danger.button")}
          </button>
        </SettingRow>
      </SettingsCard>
    </>
  )
}
