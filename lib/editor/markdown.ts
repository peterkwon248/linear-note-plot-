/**
 * Markdown → rich-text bridge (D안 B방식 — UpNote "Paste from Markdown" 미러).
 *
 * Plot 에디터(TipTap)는 마크다운 파서가 없다. `## Today` 같은 마크다운을 템플릿/
 * 일괄 삽입으로 넣으면 raw 텍스트로 박힌다(`## `는 실시간 타이핑 input rule만 H2 변환).
 * 이 유틸은 명시적 변환(`Ctrl+Alt+V` "마크다운으로 붙여넣기")용으로 마크다운 →
 * ProseMirror JSON 변환을 제공한다.
 *
 * 격리 원칙: 메인 에디터 0터치, @tiptap **core 버전 무관**.
 *   - md → HTML : `marked` (GFM: 표·체크리스트·취소선)
 *   - HTML → JSON : `@tiptap/html` `generateJSON` (extensions는 호출부 주입)
 *
 * ⚠️ `markdownToHtml` 출력은 sanitize되지 않은 HTML이다 — 반드시 `generateJSON`
 *    (스키마 기반 파서, 미지 노드/스크립트 제거)으로 통과시킬 것. raw innerHTML 금지.
 */
import { marked, Renderer, type Tokens } from "marked"
import { generateJSON } from "@tiptap/html"
import type { Extensions, JSONContent } from "@tiptap/core"

/*
 * GFM task list 변환:
 *   marked 기본 출력 = `<ul><li><input type="checkbox"> text</li>` (TipTap가 일반 불릿으로 봄)
 *   TipTap TaskList 요구 = `<ul data-type="taskList"><li data-type="taskItem" data-checked="…">text</li>`
 * 기본 렌더러에 위임한 뒤 li 래퍼만 재작성 + checkbox input 제거 → 중첩/loose 케이스도 보존.
 */
const renderer = new Renderer()
const baseListitem = renderer.listitem.bind(renderer)
const baseList = renderer.list.bind(renderer)

renderer.listitem = function (item: Tokens.ListItem): string {
  const html = baseListitem(item)
  if (item.task) {
    const checked = item.checked ? "true" : "false"
    return html
      .replace(/^<li>/, `<li data-type="taskItem" data-checked="${checked}">`)
      .replace(/<input[^>]*type="checkbox"[^>]*>\s?/, "")
  }
  return html
}

renderer.list = function (token: Tokens.List): string {
  const html = baseList(token)
  if (!token.ordered && token.items.some((i) => i.task)) {
    return html.replace(/^<ul>/, '<ul data-type="taskList">')
  }
  return html
}

/**
 * 마크다운 문자열 → HTML (GFM). 순수 함수 — DOM/에디터 의존성 없음(단위 테스트 가능).
 */
export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { gfm: true, breaks: false, renderer }) as string
}

/**
 * 마크다운 문자열 → ProseMirror JSON.
 * `extensions`는 호출부에서 `createRenderExtensions()`를 주입한다(이 모듈이 무거운
 * 에디터 config를 import하지 않도록 — 격리 유지 + core 버전 무관).
 * `generateJSON`이 내부적으로 `DOMParser`를 쓰므로 브라우저(클라이언트)에서 호출한다.
 */
export function markdownToJson(markdown: string, extensions: Extensions): JSONContent {
  return generateJSON(markdownToHtml(markdown), extensions) as JSONContent
}
