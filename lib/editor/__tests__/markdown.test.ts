import { describe, it, expect } from "vitest"
import { markdownToHtml } from "../markdown"

describe("markdownToHtml", () => {
  it("converts ATX headings (the `## Today` raw-text bug)", () => {
    expect(markdownToHtml("# Title")).toContain("<h1>Title</h1>")
    expect(markdownToHtml("## Today")).toContain("<h2>Today</h2>")
    expect(markdownToHtml("### Sub")).toContain("<h3>Sub</h3>")
  })

  it("converts inline marks (bold/italic/code/strike/link)", () => {
    const html = markdownToHtml("a **b** _i_ `c` ~~s~~ [l](https://e.com)")
    expect(html).toContain("<strong>b</strong>")
    expect(html).toContain("<em>i</em>")
    expect(html).toContain("<code>c</code>")
    expect(html).toContain("<del>s</del>")
    expect(html).toContain('<a href="https://e.com">l</a>')
  })

  it("converts bullet lists with nesting", () => {
    const html = markdownToHtml("- a\n- b\n  - nested\n- c")
    expect(html).toContain("<ul>")
    expect(html).toContain("<li>a</li>")
    expect(html).toMatch(/<li>b<ul>\s*<li>nested<\/li>/)
  })

  it("converts ordered lists", () => {
    const html = markdownToHtml("1. one\n2. two")
    expect(html).toContain("<ol>")
    expect(html).toContain("<li>one</li>")
    expect(html).toContain("<li>two</li>")
  })

  it("converts task lists to TipTap-compatible HTML (input stripped)", () => {
    const html = markdownToHtml("- [ ] todo\n- [x] done")
    expect(html).toContain('<ul data-type="taskList">')
    expect(html).toContain('<li data-type="taskItem" data-checked="false">todo</li>')
    expect(html).toContain('<li data-type="taskItem" data-checked="true">done</li>')
    expect(html).not.toContain("<input")
  })

  it("preserves inline marks inside task items", () => {
    const html = markdownToHtml("- [ ] write **report**")
    expect(html).toContain('<li data-type="taskItem" data-checked="false">write <strong>report</strong></li>')
  })

  it("leaves normal lists free of task attributes", () => {
    const html = markdownToHtml("- a\n- b")
    expect(html).not.toContain("data-type=")
    expect(html).not.toContain("<input")
  })

  it("converts blockquotes", () => {
    expect(markdownToHtml("> quote")).toContain("<blockquote>")
  })

  it("converts fenced code blocks with language class", () => {
    const html = markdownToHtml("```js\nconst x = 1\n```")
    expect(html).toContain('<pre><code class="language-js">')
    expect(html).toContain("const x = 1")
  })

  it("converts GFM tables", () => {
    const html = markdownToHtml("| A | B |\n|---|---|\n| 1 | 2 |")
    expect(html).toContain("<table>")
    expect(html).toContain("<th>A</th>")
    expect(html).toContain("<td>1</td>")
  })

  it("converts horizontal rules", () => {
    expect(markdownToHtml("---")).toContain("<hr>")
  })

  it("handles a multi-block template", () => {
    const tpl = "# Daily\n\n## Tasks\n- [ ] write\n\n## Notes\nSome **text**."
    const html = markdownToHtml(tpl)
    expect(html).toContain("<h1>Daily</h1>")
    expect(html).toContain("<h2>Tasks</h2>")
    expect(html).toContain('<li data-type="taskItem" data-checked="false">write</li>')
    expect(html).toContain("<h2>Notes</h2>")
    expect(html).toContain("<strong>text</strong>")
  })

  it("returns empty string for empty input", () => {
    expect(markdownToHtml("")).toBe("")
  })
})
