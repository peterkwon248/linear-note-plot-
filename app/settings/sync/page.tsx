"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import {
  SettingsPageTitle,
  SettingsCard,
  SettingRow,
  Divider,
} from "@/components/settings-ui"

export default function SyncPage() {
  const [autoSync, setAutoSync] = useState(false)

  return (
    <>
      <SettingsPageTitle>{"Sync & Storage"}</SettingsPageTitle>

      <SettingsCard title="Sync">
        <SettingRow
          label="Auto-sync"
          description="Automatically sync notes across devices"
        >
          <Switch checked={autoSync} onCheckedChange={setAutoSync} />
        </SettingRow>
        <Divider />
        <SettingRow
          label="Storage location"
          description="Where your notes are stored"
        >
          <span className="text-ui text-muted-foreground">Local (browser)</span>
        </SettingRow>
      </SettingsCard>
    </>
  )
}
