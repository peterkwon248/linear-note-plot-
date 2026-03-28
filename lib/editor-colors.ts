export interface EditorColor {
  label: string
  value: string
  swatch: string
}

export const TEXT_COLORS: EditorColor[] = [
  { label: "Default", value: "", swatch: "#E2E2E2" },
  { label: "Red", value: "#EF4444", swatch: "#EF4444" },
  { label: "Orange", value: "#F97316", swatch: "#F97316" },
  { label: "Amber", value: "#F59E0B", swatch: "#F59E0B" },
  { label: "Yellow", value: "#EAB308", swatch: "#EAB308" },
  { label: "Lime", value: "#84CC16", swatch: "#84CC16" },
  { label: "Green", value: "#22C55E", swatch: "#22C55E" },
  { label: "Teal", value: "#14B8A6", swatch: "#14B8A6" },
  { label: "Cyan", value: "#06B6D4", swatch: "#06B6D4" },
  { label: "Sky", value: "#0EA5E9", swatch: "#0EA5E9" },
  { label: "Blue", value: "#3B82F6", swatch: "#3B82F6" },
  { label: "Indigo", value: "#6366F1", swatch: "#6366F1" },
  { label: "Purple", value: "#A855F7", swatch: "#A855F7" },
  { label: "Pink", value: "#EC4899", swatch: "#EC4899" },
  { label: "Rose", value: "#F43F5E", swatch: "#F43F5E" },
  { label: "Gray", value: "#9CA3AF", swatch: "#9CA3AF" },
]

export const HIGHLIGHT_COLORS: EditorColor[] = [
  { label: "None", value: "", swatch: "transparent" },
  { label: "Red", value: "rgba(239,68,68,0.25)", swatch: "#EF4444" },
  { label: "Orange", value: "rgba(249,115,22,0.25)", swatch: "#F97316" },
  { label: "Amber", value: "rgba(245,158,11,0.25)", swatch: "#F59E0B" },
  { label: "Yellow", value: "rgba(234,179,8,0.3)", swatch: "#EAB308" },
  { label: "Lime", value: "rgba(132,204,22,0.25)", swatch: "#84CC16" },
  { label: "Green", value: "rgba(34,197,94,0.25)", swatch: "#22C55E" },
  { label: "Teal", value: "rgba(20,184,166,0.25)", swatch: "#14B8A6" },
  { label: "Cyan", value: "rgba(6,182,212,0.25)", swatch: "#06B6D4" },
  { label: "Sky", value: "rgba(14,165,233,0.25)", swatch: "#0EA5E9" },
  { label: "Blue", value: "rgba(59,130,246,0.25)", swatch: "#3B82F6" },
  { label: "Indigo", value: "rgba(99,102,241,0.25)", swatch: "#6366F1" },
  { label: "Purple", value: "rgba(168,85,247,0.25)", swatch: "#A855F7" },
  { label: "Pink", value: "rgba(236,72,153,0.25)", swatch: "#EC4899" },
  { label: "Rose", value: "rgba(244,63,94,0.25)", swatch: "#F43F5E" },
  { label: "Gray", value: "rgba(156,163,175,0.2)", swatch: "#9CA3AF" },
]
