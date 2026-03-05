"use client"

import { Switch } from "@/components/ui/switch"
import { useSettingsStore } from "@/lib/settings-store"
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
    </>
  )
}
