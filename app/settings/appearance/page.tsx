"use client"

import { useState } from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import {
  SettingsPageTitle,
  SettingsCard,
  SettingRow,
  Divider,
  SelectControl,
} from "@/components/settings-ui"

export default function AppearancePage() {
  const [theme, setTheme] = useState("dark")
  const [fontSize, setFontSize] = useState("14")
  const [density, setDensity] = useState("default")

  const themes = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ]

  return (
    <>
      <SettingsPageTitle>Appearance</SettingsPageTitle>

      <SettingsCard title="Interface and theme">
        <div className="px-4 py-4">
          <span className="mb-3 block text-[13px] font-medium text-foreground">
            Theme
          </span>
          <div className="flex gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-1 flex-col items-center gap-2 rounded-lg border px-4 py-3 text-[12px] transition-colors ${
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
            onChange={setDensity}
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
