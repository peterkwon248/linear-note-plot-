"use client"

import { usePlotStore } from "@/lib/store"
import {
  SettingsPageTitle,
  SettingsCard,
  SettingRow,
  Divider,
} from "@/components/settings-ui"

export default function BackupPage() {
  const notes = usePlotStore((s) => s.notes)

  return (
    <>
      <SettingsPageTitle>{"Backup & Export"}</SettingsPageTitle>

      <SettingsCard title="Export">
        <SettingRow
          label="Export all notes"
          description={`Export ${notes.length} notes as JSON`}
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
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-secondary/80"
          >
            Export JSON
          </button>
        </SettingRow>
        <Divider />
        <SettingRow
          label="Export as Markdown"
          description="Download each note as a .md file"
        >
          <button className="rounded-md border border-border bg-secondary px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-secondary/80">
            Export Markdown
          </button>
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Danger zone">
        <SettingRow
          label="Delete all notes"
          description="Permanently remove all notes. This cannot be undone."
        >
          <button className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-[13px] text-destructive transition-colors hover:bg-destructive/20">
            Delete All
          </button>
        </SettingRow>
      </SettingsCard>
    </>
  )
}
