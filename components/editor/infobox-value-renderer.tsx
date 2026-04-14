"use client"

/**
 * Tier 1-5: Infobox value 리치텍스트 렌더러.
 *
 * 나무위키 인포박스 필드 값에 흔히 쓰이는 inline 패턴을 JSX로 변환한다.
 * 편집 모드에서는 원본 plain text input을 그대로 유지 — 이 렌더러는 display only.
 *
 * 지원 패턴 (우선순위 순):
 *   ![alt](url)         → <img> (inline, 국기 아이콘 등)
 *   [[title]]           → wikilink (Plot 기존 article/note resolution)
 *   [text](url)         → 외부 링크 (target=_blank)
 *   https?://...        → auto-link (bare URL)
 *
 * 보안: JSX 기반이라 자동 이스케이프. src/href는 http/https/data:image만 허용.
 */

import { Fragment } from "react"
import { usePlotStore } from "@/lib/store"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"

type Token =
  | { kind: "text"; text: string }
  | { kind: "image"; alt: string; url: string }
  | { kind: "wikilink"; title: string }
  | { kind: "link"; text: string; url: string }
  | { kind: "autolink"; url: string }

// Ordered patterns — first match wins per position.
const MATCHERS: Array<{ kind: Token["kind"]; re: RegExp; parse: (m: RegExpExecArray) => Token }> = [
  {
    kind: "image",
    re: /!\[([^\]]*)\]\(([^)]+)\)/,
    parse: (m) => ({ kind: "image", alt: m[1], url: m[2].trim() }),
  },
  {
    kind: "wikilink",
    re: /\[\[([^\]]+)\]\]/,
    parse: (m) => ({ kind: "wikilink", title: m[1].trim() }),
  },
  {
    kind: "link",
    re: /\[([^\]]+)\]\(([^)]+)\)/,
    parse: (m) => ({ kind: "link", text: m[1], url: m[2].trim() }),
  },
  {
    kind: "autolink",
    re: /https?:\/\/[^\s<>()]+/,
    parse: (m) => ({ kind: "autolink", url: m[0] }),
  },
]

function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  let cursor = 0
  while (cursor < text.length) {
    const slice = text.slice(cursor)
    // Find the earliest matching pattern in this slice
    let best: { token: Token; start: number; length: number } | null = null
    for (const matcher of MATCHERS) {
      const m = matcher.re.exec(slice)
      if (!m) continue
      if (best === null || m.index < best.start) {
        best = { token: matcher.parse(m), start: m.index, length: m[0].length }
      }
    }
    if (!best) {
      tokens.push({ kind: "text", text: slice })
      break
    }
    if (best.start > 0) {
      tokens.push({ kind: "text", text: slice.slice(0, best.start) })
    }
    tokens.push(best.token)
    cursor += best.start + best.length
  }
  return tokens
}

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase()
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("/") // same-origin paths
  )
}

interface InfoboxValueRendererProps {
  text: string
  className?: string
}

export function InfoboxValueRenderer({ text, className }: InfoboxValueRendererProps) {
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)

  const tokens = tokenize(text)

  const resolveWikilink = (title: string) => {
    const lower = title.toLowerCase()
    // Wiki article title match (case-insensitive, also check aliases)
    const article = wikiArticles?.find(
      (a) =>
        a.title.toLowerCase() === lower ||
        (a.aliases ?? []).some((al) => al.toLowerCase() === lower),
    )
    if (article) return { kind: "article" as const, id: article.id }
    // Note title match
    const note = notes?.find((n) => n.title.toLowerCase() === lower && !n.trashedAt)
    if (note) return { kind: "note" as const, id: note.id }
    return null
  }

  return (
    <span className={className}>
      {tokens.map((tok, i) => {
        const key = `tok-${i}`
        switch (tok.kind) {
          case "text":
            return <Fragment key={key}>{tok.text}</Fragment>

          case "image":
            if (!isSafeUrl(tok.url)) {
              return <Fragment key={key}>{`![${tok.alt}](${tok.url})`}</Fragment>
            }
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={key}
                src={tok.url}
                alt={tok.alt}
                className="inline-block h-[1.25em] w-auto align-[-0.2em] mx-0.5"
              />
            )

          case "wikilink": {
            const resolved = resolveWikilink(tok.title)
            if (!resolved) {
              // Dangling wikilink — dashed underline, muted
              return (
                <span
                  key={key}
                  className="border-b border-dashed border-muted-foreground/40 text-muted-foreground"
                  title="No matching article or note"
                >
                  {tok.title}
                </span>
              )
            }
            return (
              <button
                key={key}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (resolved.kind === "article") {
                    navigateToWikiArticle(resolved.id)
                  } else {
                    openNote?.(resolved.id)
                  }
                }}
                className={
                  resolved.kind === "article"
                    ? "text-accent underline decoration-accent/40 hover:decoration-accent"
                    : "text-foreground underline decoration-muted-foreground/40 hover:decoration-foreground"
                }
              >
                {tok.title}
              </button>
            )
          }

          case "link":
            if (!isSafeUrl(tok.url)) {
              return <Fragment key={key}>{`[${tok.text}](${tok.url})`}</Fragment>
            }
            return (
              <a
                key={key}
                href={tok.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-accent underline decoration-accent/40 hover:decoration-accent"
              >
                {tok.text}
              </a>
            )

          case "autolink":
            if (!isSafeUrl(tok.url)) {
              return <Fragment key={key}>{tok.url}</Fragment>
            }
            return (
              <a
                key={key}
                href={tok.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-accent underline decoration-accent/40 hover:decoration-accent break-all"
              >
                {tok.url}
              </a>
            )

          default:
            return null
        }
      })}
    </span>
  )
}
