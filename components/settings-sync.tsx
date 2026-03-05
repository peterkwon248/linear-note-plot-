"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { useSettingsStore } from "@/lib/settings-store"

export function SettingsSync() {
  const settingsTheme = useSettingsStore((s) => s.theme)
  const fontSize = useSettingsStore((s) => s.fontSize)
  const density = useSettingsStore((s) => s.density)
  const { setTheme } = useTheme()

  // Sync settings store theme → next-themes
  useEffect(() => {
    setTheme(settingsTheme)
  }, [settingsTheme, setTheme])

  // Apply font size to root element
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`
  }, [fontSize])

  // Apply density as data attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-density", density)
  }, [density])

  return null
}
