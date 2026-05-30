"use client"

/**
 * UserAvatar — workspace identity anchor + workspace menu (GlobalTopBar left).
 *
 * Chunk 1+2 (2026-05-25): 'P' brand mark moved from activity bar to GlobalTopBar
 * as workspace identity anchor. `.a-brand__mark` className preserves the gradient
 * badge visual (28×28 rounded-7px, space-home→space-wiki gradient, white "P").
 *
 * Shell pass B (2026-05-30): the badge is no longer a dead anchor — it now opens
 * a Linear-style workspace menu (top-left workspace dropdown pattern). The right
 * cluster's three chrome icons (theme · settings · trash) fold into this one menu
 * so the right side stays clean. Items: Settings · Theme toggle · Trash ·
 * Keyboard shortcuts. Hover reuses the note-row motion tokens
 * (`--row-hover-bg` / `--duration-fast` / `--ease-out`, commit 295be0a) so the
 * dropdown feels native to the rest of the surface.
 */

import Link from "next/link"
import {
  Settings as IconGear,
  Trash2 as IconTrash,
  Moon as IconMoon,
  Sun as IconSun,
  Keyboard as IconKeyboard,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu"
import { useSettingsStore } from "@/lib/settings-store"
import { usePlotStore } from "@/lib/store"
import { useT } from "@/lib/i18n"

/** Derive up to 2-char initials from a display name.
 * - Multi-word (space-separated): first letter of each word, max 2, uppercased.
 * - Single word (CJK / no spaces): first character only (preserves CJK glyph).
 * - Empty / whitespace-only: returns fallback "P" to preserve brand identity. */
function getInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return "P"
  const words = trimmed.split(/\s+/)
  if (words.length === 1) return [...trimmed][0] // spread handles multi-byte chars
  return words
    .slice(0, 2)
    .map((w) => [...w][0].toUpperCase())
    .join("")
}

/* Shared row recipe: note-row hover token (`--row-hover-bg` via `bg-hover-bg`)
 * + fast decelerate transition, overriding the default `focus:bg-accent`.
 * 16px icon · label · dimmed shortcut hint = Linear workspace-menu row. */
const ITEM_CLASS =
  "gap-2.5 px-2 py-1.5 text-note text-foreground/85 [transition:background_var(--duration-fast)_var(--ease-out)] focus:bg-hover-bg focus:text-foreground [&_svg]:size-4 [&_svg]:text-muted-foreground focus:[&_svg]:text-foreground"

export function UserAvatar() {
  const t = useT()

  const userName = useSettingsStore((s) => s.userName)
  const initial = getInitials(userName)

  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const isDark = theme === "dark"
  const toggleTheme = () => setTheme(isDark ? "light" : "dark")

  const setShortcutOverlayOpen = usePlotStore((s) => s.setShortcutOverlayOpen)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="a-brand__mark shrink-0 outline-none [transition:filter_var(--duration-fast)_var(--ease-out),box-shadow_var(--duration-fast)_var(--ease-out)] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background data-[state=open]:brightness-110 data-[state=open]:ring-2 data-[state=open]:ring-accent/50"
          aria-label={t("nav.workspace.menu")}
          title={t("nav.workspace.menu")}
        >
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-56 rounded-lg border-border-subtle bg-surface-overlay p-1 shadow-lg"
      >
        <DropdownMenuItem asChild className={ITEM_CLASS}>
          <Link href="/settings">
            <IconGear strokeWidth={2} />
            <span className="flex-1">{t("nav.settings")}</span>
            <DropdownMenuShortcut className="text-2xs tracking-normal text-muted-foreground/60">
              ⌘,
            </DropdownMenuShortcut>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          className={ITEM_CLASS}
          onSelect={(e) => {
            // Keep the menu open is not desired here — toggling theme then
            // closing matches Linear (action item, not a sticky toggle).
            e.preventDefault()
            toggleTheme()
          }}
        >
          {isDark ? <IconSun strokeWidth={2} /> : <IconMoon strokeWidth={2} />}
          <span className="flex-1">
            {isDark ? t("nav.theme.light_mode") : t("nav.theme.dark_mode")}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border-subtle" />

        <DropdownMenuItem
          className={ITEM_CLASS}
          onSelect={() => setShortcutOverlayOpen(true)}
        >
          <IconKeyboard strokeWidth={2} />
          <span className="flex-1">{t("nav.help.shortcuts")}</span>
          <DropdownMenuShortcut className="text-2xs tracking-normal text-muted-foreground/60">
            ?
          </DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border-subtle" />

        <DropdownMenuItem asChild className={ITEM_CLASS}>
          <Link href="/trash">
            <IconTrash strokeWidth={2} />
            <span className="flex-1">{t("nav.trash")}</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
