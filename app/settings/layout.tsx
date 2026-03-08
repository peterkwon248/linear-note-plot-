"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowLeft,
  SlidersHorizontal,
  Palette,
  PenTool,
  Keyboard,
  Cloud,
  Download,
  Info,
} from "lucide-react"

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  active?: boolean
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[15px] transition-colors ${
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      }`}
    >
      <span className="flex shrink-0 items-center justify-center">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-2.5 pb-1 pt-5 text-[12px] font-medium uppercase tracking-wider text-muted-foreground first:pt-0">
      {title}
    </div>
  )
}

const navGroups = [
  {
    section: "General",
    items: [
      { href: "/settings/preferences", label: "Preferences", icon: <SlidersHorizontal className="h-4 w-4" /> },
      { href: "/settings/appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
      { href: "/settings/editor", label: "Editor", icon: <PenTool className="h-4 w-4" /> },
      { href: "/settings/shortcuts", label: "Shortcuts", icon: <Keyboard className="h-4 w-4" /> },
    ],
  },
  {
    section: "Data",
    items: [
      { href: "/settings/sync", label: "Sync & Storage", icon: <Cloud className="h-4 w-4" /> },
      { href: "/settings/backup", label: "Backup & Export", icon: <Download className="h-4 w-4" /> },
    ],
  },
  {
    section: "Info",
    items: [
      { href: "/settings/about", label: "About", icon: <Info className="h-4 w-4" /> },
    ],
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Settings sidebar */}
      <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-background">
        <div className="px-2 pt-3 pb-2">
          <Link
            href="/"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[15px] text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to app</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {navGroups.map((group) => (
            <div key={group.section}>
              <SectionHeader title={group.section} />
              <div className="space-y-px">
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={pathname === item.href}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Settings content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-[900px] px-10 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
