import Link from "next/link"

/**
 * Redesign preview index — the 5 diagnosis surfaces. Ready surfaces link to
 * their isolated presentational render (the unit handed to Open Design).
 */
const SURFACES: Array<{
  label: string
  href: string | null
  live: string
  status: "ready" | "todo"
}> = [
  { label: "홈", href: "/preview/redesign/home", live: "views/home-view.tsx + home/*", status: "ready" },
  { label: "사이드바", href: "/preview/redesign/sidebar", live: "linear-sidebar.tsx · 2011줄", status: "ready" },
  { label: "노트리스트", href: "/preview/redesign/notes-list", live: "notes-table.tsx · 1993줄", status: "ready" },
  { label: "에디터", href: "/preview/redesign/editor", live: "note-editor.tsx + FixedToolbar · 905줄+", status: "ready" },
  { label: "인사이트", href: "/preview/redesign/insights", live: "insights-view.tsx · 대시보드", status: "ready" },
]

export default function RedesignIndex() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-xl font-semibold text-foreground">리디자인 프리뷰</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Open Design 핸드오프용 순수 presentational 컴포넌트. 라이브 앱은 0 touch —
        여기서 시각만 따로 떠서 도구에 넘기고, 확정 후 라이브로 스왑한다.
      </p>

      <ul className="mt-8 space-y-2">
        {SURFACES.map((s) => {
          const inner = (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">{s.label}</span>
                <span className="font-mono text-2xs text-muted-foreground">{s.live}</span>
              </div>
              {s.status === "ready" ? (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-2xs font-medium text-emerald-600 dark:text-emerald-400">
                  ready →
                </span>
              ) : (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-2xs font-medium text-muted-foreground">
                  준비 중
                </span>
              )}
            </div>
          )
          return (
            <li key={s.label}>
              {s.href ? (
                <Link href={s.href} className="block transition-opacity hover:opacity-80">
                  {inner}
                </Link>
              ) : (
                <div className="opacity-50">{inner}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
