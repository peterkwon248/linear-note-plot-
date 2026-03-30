"use client"

import { useMemo } from "react"
import { Switch } from "@/components/ui/switch"
import { useSettingsStore } from "@/lib/settings-store"
import { usePlotStore } from "@/lib/store"
import { toast } from "sonner"
import {
  SettingsPageTitle,
  SettingsCard,
  SettingRow,
  Divider,
  SelectControl,
} from "@/components/settings-ui"

export default function PreferencesPage() {
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const startView = useSettingsStore((s) => s.startView)
  const setStartView = useSettingsStore((s) => s.setStartView)
  const confirmDelete = useSettingsStore((s) => s.confirmDelete)
  const setConfirmDelete = useSettingsStore((s) => s.setConfirmDelete)

  const notes = usePlotStore((s) => s.notes)
  const srsStateByNoteId = usePlotStore((s) => s.srsStateByNoteId)
  const enrollAllPermanentSRS = usePlotStore((s) => s.enrollAllPermanentSRS)

  const unenrolledCount = useMemo(
    () => notes.filter((n) => n.status === "permanent" && !n.trashed && !srsStateByNoteId[n.id]).length,
    [notes, srsStateByNoteId]
  )

  return (
    <>
      <SettingsPageTitle>Preferences</SettingsPageTitle>

      <SettingsCard title="General">
        <SettingRow label="Language" description="Interface display language">
          <SelectControl
            value={language}
            onChange={setLanguage}
            options={[
              { label: "English", value: "en" },
              { label: "한국어", value: "ko" },
              { label: "日本語", value: "ja" },
              { label: "Español", value: "es" },
              { label: "Français", value: "fr" },
              { label: "Deutsch", value: "de" },
            ]}
          />
        </SettingRow>
        <Divider />
        <SettingRow label="Start view" description="Default view when opening the app">
          <SelectControl
            value={startView}
            onChange={(v) => setStartView(v as "all" | "inbox" | "pinned")}
            options={[
              { label: "All Notes", value: "all" },
              { label: "Inbox", value: "inbox" },
              { label: "Pinned", value: "pinned" },
            ]}
          />
        </SettingRow>
        <Divider />
        <SettingRow
          label="Confirm before deleting"
          description="Show confirmation dialog when deleting notes"
        >
          <Switch checked={confirmDelete} onCheckedChange={setConfirmDelete} />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Spaced Repetition">
        <SettingRow
          label="Bulk enroll permanent notes"
          description={`${unenrolledCount} permanent note${unenrolledCount === 1 ? "" : "s"} not yet enrolled in SRS`}
        >
          <button
            onClick={() => {
              const count = enrollAllPermanentSRS()
              if (count > 0) {
                toast(`Enrolled ${count} note${count === 1 ? "" : "s"} into SRS`)
              } else {
                toast("All permanent notes are already enrolled")
              }
            }}
            disabled={unenrolledCount === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-note font-medium text-foreground transition-colors hover:bg-hover-bg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Enroll All
          </button>
        </SettingRow>
      </SettingsCard>
    </>
  )
}
