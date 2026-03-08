"use client"

import { ChevronDown } from "lucide-react"

export function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[15px] font-medium text-foreground">{label}</span>
        {description && (
          <span className="text-[14px] text-muted-foreground">{description}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  )
}

export function Divider() {
  return <div className="border-t border-border" />
}

export function SettingsCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-[15px] font-semibold text-foreground">{title}</h3>
      <div className="rounded-lg border border-border bg-card">{children}</div>
    </div>
  )
}

export function SelectControl({
  value,
  options,
  onChange,
}: {
  value: string
  options: { label: string; value: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-md border border-border bg-secondary px-3 py-1.5 pr-7 text-[15px] text-foreground outline-none transition-colors hover:border-muted-foreground/30 focus:border-accent"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export function SettingsPageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="mb-6 text-2xl font-semibold text-foreground">{children}</h1>
  )
}
