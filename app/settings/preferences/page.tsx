"use client"

import { useMemo } from "react"
import { Switch } from "@/components/ui/switch"
import { useSettingsStore } from "@/lib/settings-store"
import { usePlotStore } from "@/lib/store"
import { getSRSHooks } from "@/lib/store/hook-selectors"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"
import {
  SettingsPageTitle,
  SettingsCard,
  SettingRow,
  Divider,
  SelectControl,
} from "@/components/settings-ui"

export default function PreferencesPage() {
  const t = useT()
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const startView = useSettingsStore((s) => s.startView)
  const setStartView = useSettingsStore((s) => s.setStartView)
  const confirmDelete = useSettingsStore((s) => s.confirmDelete)
  const setConfirmDelete = useSettingsStore((s) => s.setConfirmDelete)

  const notes = usePlotStore((s) => s.notes)
  // Phase 1b2: SRS enrollment count derives from the unified `hooks` slice.
  const hooks = usePlotStore((s) => s.hooks)
  const enrollAllPermanentSRS = usePlotStore((s) => s.enrollAllPermanentSRS)

  const unenrolledCount = useMemo(() => {
    const enrolled = new Set(
      getSRSHooks(hooks)
        .filter((h) => h.target.kind === "note")
        .map((h) => h.target.id),
    )
    return notes.filter((n) => n.status === "keystone" && !n.trashed && !enrolled.has(n.id)).length
  }, [notes, hooks])

  return (
    <>
      <SettingsPageTitle>{t("settings.preferences.title")}</SettingsPageTitle>

      <SettingsCard title={t("settings.preferences.general")}>
        <SettingRow label={t("settings.preferences.language.label")} description={t("settings.preferences.language.description")}>
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
        <SettingRow label={t("settings.preferences.startview.label")} description={t("settings.preferences.startview.description")}>
          <SelectControl
            value={startView}
            onChange={(v) => setStartView(v as "home" | "all" | "stone" | "pinned")}
            options={[
              { label: t("settings.preferences.startview.home"), value: "home" },
              { label: t("settings.preferences.startview.all"), value: "all" },
              { label: t("settings.preferences.startview.stone"), value: "stone" },
              { label: t("settings.preferences.startview.pinned"), value: "pinned" },
            ]}
          />
        </SettingRow>
        <Divider />
        <SettingRow
          label={t("settings.preferences.confirmdelete.label")}
          description={t("settings.preferences.confirmdelete.description")}
        >
          <Switch checked={confirmDelete} onCheckedChange={setConfirmDelete} />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title={t("settings.preferences.srs.title")}>
        <SettingRow
          label={t("settings.preferences.srs.bulk.label")}
          description={`${unenrolledCount} keystone note${unenrolledCount === 1 ? "" : "s"} not yet enrolled in SRS`}
        >
          <button
            onClick={() => {
              const count = enrollAllPermanentSRS()
              if (count > 0) {
                toast(`Enrolled ${count} note${count === 1 ? "" : "s"} into SRS`)
              } else {
                toast("All keystone notes are already enrolled")
              }
            }}
            disabled={unenrolledCount === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-note font-medium text-foreground transition-colors hover:bg-hover-bg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("settings.preferences.srs.bulk.button")}
          </button>
        </SettingRow>
      </SettingsCard>
    </>
  )
}
