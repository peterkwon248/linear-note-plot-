"use client"

import { useSettingsStore } from "@/lib/settings-store"
import {
  SettingsPageTitle,
  SettingsCard,
  SettingRow,
  Divider,
  SelectControl,
} from "@/components/settings-ui"
import { Moon } from "@phosphor-icons/react/dist/ssr/Moon"
import { Sun } from "@phosphor-icons/react/dist/ssr/Sun"
import { Monitor } from "@phosphor-icons/react/dist/ssr/Monitor"

export default function AppearancePage() {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const fontSize = useSettingsStore((s) => s.fontSize)
  const setFontSize = useSettingsStore((s) => s.setFontSize)
  const density = useSettingsStore((s) => s.density)
  const setDensity = useSettingsStore((s) => s.setDensity)

  const themes = [
    { id: "light" as const, label: "Light", icon: Sun },
    { id: "dark" as const, label: "Dark", icon: Moon },
    { id: "system" as const, label: "System", icon: Monitor },
  ]

  return (
    <>
      <SettingsPageTitle>Appearance</SettingsPageTitle>

      <SettingsCard title="Interface and theme">
        <div className="px-4 py-4">
          <span className="mb-3 block text-ui font-medium text-foreground">
            Theme
          </span>
          <div className="flex gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-1 flex-col items-center gap-2 rounded-lg border px-4 py-3 text-note transition-colors ${
                  theme === t.id
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                }`}
              >
                <t.icon className="h-5 w-5" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
        <Divider />
        <SettingRow label="Interface font size" description="Controls the base font size">
          <SelectControl
            value={fontSize}
            onChange={setFontSize}
            options={[
              { label: "12px", value: "12" },
              { label: "13px", value: "13" },
              { label: "14px", value: "14" },
              { label: "15px", value: "15" },
              { label: "16px", value: "16" },
            ]}
          />
        </SettingRow>
        <Divider />
        <SettingRow label="Display density" description="Compact or comfortable spacing">
          <SelectControl
            value={density}
            onChange={(v) => setDensity(v as "compact" | "default" | "comfortable")}
            options={[
              { label: "Compact", value: "compact" },
              { label: "Default", value: "default" },
              { label: "Comfortable", value: "comfortable" },
            ]}
          />
        </SettingRow>
      </SettingsCard>
    </>
  )
}
