"use client"

import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { useSettingsStore } from "@/lib/settings-store"
import { useT } from "@/lib/i18n"
import {
  SettingsPageTitle,
  SettingsCard,
  SettingRow,
  Divider,
  SelectControl,
} from "@/components/settings-ui"

/** Format a "X days/hours ago" label for a past ISO timestamp. */
function relativePast(iso: string | null): string {
  if (!iso) return "Never"
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return "Just now"
  const minutes = Math.floor(ms / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export default function SyncPage() {
  const t = useT()
  const backupReminder = useSettingsStore((s) => s.backupReminder)
  const setBackupReminder = useSettingsStore((s) => s.setBackupReminder)
  const backupReminderDays = useSettingsStore((s) => s.backupReminderDays)
  const setBackupReminderDays = useSettingsStore((s) => s.setBackupReminderDays)
  const lastBackupAt = useSettingsStore((s) => s.lastBackupAt)

  return (
    <>
      <SettingsPageTitle>{t("settings.sync.title")}</SettingsPageTitle>

      <SettingsCard title={t("settings.sync.storage")}>
        <SettingRow
          label={t("settings.sync.storage.label")}
          description={t("settings.sync.storage.description")}
        >
          <span className="text-ui text-muted-foreground">{t("settings.sync.storage.value")}</span>
        </SettingRow>
      </SettingsCard>

      <SettingsCard title={t("settings.sync.reminders")}>
        <SettingRow
          label={t("settings.sync.reminders.toggle.label")}
          description={`Show a one-time nudge each session if no full backup has been taken in the last ${backupReminderDays} day${backupReminderDays === 1 ? "" : "s"}.`}
        >
          <Switch checked={backupReminder} onCheckedChange={setBackupReminder} />
        </SettingRow>
        <Divider />
        <SettingRow
          label={t("settings.sync.reminders.threshold.label")}
          description={t("settings.sync.reminders.threshold.description")}
        >
          <SelectControl
            value={String(backupReminderDays)}
            onChange={(v) => setBackupReminderDays(Number(v))}
            options={[
              { label: "1 day", value: "1" },
              { label: "3 days", value: "3" },
              { label: "7 days", value: "7" },
              { label: "14 days", value: "14" },
              { label: "30 days", value: "30" },
            ]}
          />
        </SettingRow>
        <Divider />
        <SettingRow
          label={t("settings.sync.reminders.last.label")}
          description={
            lastBackupAt
              ? `Recorded ${relativePast(lastBackupAt)} (${new Date(lastBackupAt).toLocaleString()})`
              : t("settings.sync.reminders.last.none")
          }
        >
          <Link
            href="/settings/backup"
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-ui text-foreground transition-colors hover:bg-hover-bg"
          >
            {t("settings.sync.reminders.backup_now")}
          </Link>
        </SettingRow>
      </SettingsCard>

      <SettingsCard title={t("settings.sync.multidevice")}>
        <SettingRow
          label={t("settings.sync.multidevice.label")}
          description={t("settings.sync.multidevice.description")}
        >
          <span className="text-ui text-muted-foreground">{t("settings.sync.multidevice.value")}</span>
        </SettingRow>
      </SettingsCard>
    </>
  )
}
