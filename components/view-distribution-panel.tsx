"use client"

import { useState, type ReactNode } from "react"

/* ── Types ──────────────────────────────────────────────── */

export interface DistributionTab {
  key: string
  label: string
  icon?: ReactNode
}

export interface DistributionItem {
  key: string
  label: string
  count: number
  color?: string
  icon?: ReactNode
}

interface ViewDistributionPanelProps {
  tabs: DistributionTab[]
  getDistribution: (tabKey: string) => DistributionItem[]
  onItemClick: (tabKey: string, itemKey: string) => void
  onClose: () => void
}

/* ── Close Icon ─────────────────────────────────────────── */

const CloseIcon = () => (
  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <line x1="4" y1="4" x2="12" y2="12" />
    <line x1="12" y1="4" x2="4" y2="12" />
  </svg>
)

/* ── Component ──────────────────────────────────────────── */

export function ViewDistributionPanel({
  tabs,
  getDistribution,
  onItemClick,
  onClose,
}: ViewDistributionPanelProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key ?? "")
  const items = getDistribution(activeTab)

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-l border-border-subtle bg-background">
      {/* ── Tab pills + Close ── */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border-subtle px-3 py-2">
        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-2xs transition-colors duration-100 ${
                activeTab === tab.key
                  ? "bg-foreground/10 font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:text-foreground/80"
        >
          <CloseIcon />
        </button>
      </div>

      {/* ── Distribution items ── */}
      <div className="flex-1 overflow-y-auto py-1">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onItemClick(activeTab, item.key)}
            className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-hover-bg"
          >
            {item.icon ? (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {item.icon}
              </span>
            ) : item.color ? (
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            ) : null}
            <span className="flex-1 truncate text-note text-foreground/80">
              {item.label}
            </span>
            <span className="shrink-0 text-2xs tabular-nums text-muted-foreground/70">
              {item.count}
            </span>
          </button>
        ))}
        {items.length === 0 && (
          <div className="px-3 py-6 text-center text-2xs text-muted-foreground/70">
            No data
          </div>
        )}
      </div>
    </div>
  )
}
