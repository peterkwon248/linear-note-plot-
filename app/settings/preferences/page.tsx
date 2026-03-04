"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import {
  SettingsPageTitle,
  SettingsCard,
  SettingRow,
  Divider,
  SelectControl,
} from "@/components/settings-ui"

export default function PreferencesPage() {
  const [language, setLanguage] = useState("en")
  const [startView, setStartView] = useState("all")
  const [confirmDelete, setConfirmDelete] = useState(true)
  const [markdown, setMarkdown] = useState(true)

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
              { label: "Spanish", value: "es" },
              { label: "French", value: "fr" },
              { label: "German", value: "de" },
              { label: "Japanese", value: "ja" },
            ]}
          />
        </SettingRow>
        <Divider />
        <SettingRow label="Start view" description="Default view when opening the app">
          <SelectControl
            value={startView}
            onChange={setStartView}
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

      <SettingsCard title="Markdown">
        <SettingRow
          label="Live markdown preview"
          description="Render markdown formatting as you type"
        >
          <Switch checked={markdown} onCheckedChange={setMarkdown} />
        </SettingRow>
      </SettingsCard>
    </>
  )
}
