"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft"
import { SlidersHorizontal } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal"
import { Palette } from "@phosphor-icons/react/dist/ssr/Palette"
import { Pen } from "@phosphor-icons/react/dist/ssr/Pen"
import { Keyboard } from "@phosphor-icons/react/dist/ssr/Keyboard"
import { Cloud as PhCloud } from "@phosphor-icons/react/dist/ssr/Cloud"
import { DownloadSimple } from "@phosphor-icons/react/dist/ssr/DownloadSimple"
import { Info as PhInfo } from "@phosphor-icons/react/dist/ssr/Info"
import { useT } from "@/lib/i18n"

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
      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-ui transition-colors ${
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-hover-bg hover:text-foreground"
      }`}
    >
      <span className="flex shrink-0 items-center justify-center">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-2.5 pb-1 pt-5 text-2xs font-medium uppercase tracking-wider text-muted-foreground first:pt-0">
      {title}
    </div>
  )
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const t = useT()

  const navGroups = [
    {
      section: t("settings.section.general"),
      items: [
        { href: "/settings/preferences", label: t("settings.nav.preferences"), icon: <SlidersHorizontal size={16} weight="regular" /> },
        { href: "/settings/appearance", label: t("settings.nav.appearance"), icon: <Palette size={16} weight="regular" /> },
        { href: "/settings/editor", label: t("settings.nav.editor"), icon: <Pen size={16} weight="regular" /> },
        { href: "/settings/shortcuts", label: t("settings.nav.shortcuts"), icon: <Keyboard size={16} weight="regular" /> },
      ],
    },
    {
      section: t("settings.section.data"),
      items: [
        { href: "/settings/sync", label: t("settings.nav.sync"), icon: <PhCloud size={16} weight="regular" /> },
        { href: "/settings/backup", label: t("settings.nav.backup"), icon: <DownloadSimple size={16} weight="regular" /> },
      ],
    },
    {
      section: t("settings.section.info"),
      items: [
        { href: "/settings/about", label: t("settings.nav.about"), icon: <PhInfo size={16} weight="regular" /> },
      ],
    },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Settings sidebar */}
      <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-background">
        <div className="px-2 pt-3 pb-2">
          <Link
            href="/"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-ui text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          >
            <ArrowLeft size={16} weight="regular" />
            <span>{t("common.back_to_app")}</span>
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
