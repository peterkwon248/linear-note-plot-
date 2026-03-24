"use client"

import { WikiStatusDot, StubsBySourceList } from "./wiki-shared"
import { shortRelative } from "@/lib/format-utils"
import type { Note } from "@/lib/types"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"

interface WikiSidebarProps {
  categories: { tags: { name: string; count: number }[]; uncategorized: number }
  recentChanges: Note[]
  redLinks: { title: string; refCount: number }[]
  stubsBySource: [string, number][]
  stubCount: number
  onOpenArticle: (id: string) => void
  onCreateFromRedLink: (title: string) => void
}

export function WikiSidebar({
  categories,
  recentChanges,
  redLinks,
  stubsBySource,
  stubCount,
  onOpenArticle,
  onCreateFromRedLink,
}: WikiSidebarProps) {
  return (
    <div className="w-[260px] shrink-0 border-l border-border/50 overflow-y-auto px-4 py-5">
      {/* Categories */}
      <Section title="Categories">
        {categories.tags.length === 0 && categories.uncategorized === 0 ? (
          <p className="text-2xs text-muted-foreground/40">No categories</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {categories.tags.map((tag) => (
              <span
                key={tag.name}
                className="rounded-[5px] bg-secondary/50 px-1.5 py-0.5 text-2xs font-medium text-foreground/70"
              >
                {tag.name}
                <span className="ml-0.5 tabular-nums text-muted-foreground/40">{tag.count}</span>
              </span>
            ))}
            {categories.uncategorized > 0 && (
              <span className="rounded-[5px] bg-chart-3/5 px-1.5 py-0.5 text-2xs font-medium text-chart-3/60">
                Uncategorized
                <span className="ml-0.5 tabular-nums">{categories.uncategorized}</span>
              </span>
            )}
          </div>
        )}
      </Section>

      {/* Recent */}
      <Section title="Recent">
        {recentChanges.length === 0 ? (
          <p className="text-2xs text-muted-foreground/40">No recent changes</p>
        ) : (
          <div className="space-y-px">
            {recentChanges.map((note) => (
              <button
                key={note.id}
                onClick={() => onOpenArticle(note.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-[7px] text-left transition-colors duration-100 hover:bg-hover-bg"
              >
                <WikiStatusDot status={note.wikiStatus} />
                <span className="min-w-0 flex-1 truncate text-[11.5px] text-foreground/80">
                  {note.title || "Untitled"}
                </span>
                <span className="shrink-0 text-2xs tabular-nums text-muted-foreground/30">
                  {shortRelative(note.updatedAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* Red Links */}
      {redLinks.length > 0 && (
        <Section title="Red Links">
          <div className="space-y-px">
            {redLinks.slice(0, 5).map((item) => (
              <div key={item.title} className="group flex items-center gap-2 rounded-md px-2 py-[7px] transition-colors duration-100 hover:bg-hover-bg">
                <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-destructive/60" />
                <span className="min-w-0 flex-1 truncate text-[11.5px] text-destructive/70">
                  {item.title}
                </span>
                <span className="shrink-0 text-2xs tabular-nums text-muted-foreground/30 group-hover:hidden">
                  {item.refCount}
                </span>
                <button
                  onClick={() => onCreateFromRedLink(item.title)}
                  className="hidden shrink-0 items-center gap-0.5 text-2xs font-medium text-accent group-hover:flex"
                >
                  <PhPlus size={12} weight="regular" />
                  Create
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Stubs by Source */}
      {stubCount > 0 && (
        <Section title="Stubs by Source">
          <StubsBySourceList items={stubsBySource} />
        </Section>
      )}
    </div>
  )
}

/* ── Section ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="mb-2 text-2xs font-medium uppercase tracking-wide text-muted-foreground/40">
        {title}
      </h4>
      {children}
    </div>
  )
}
