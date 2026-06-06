import { describe, it, expect, beforeEach } from "vitest"
import { expandPlaceholders, countPlaceholders, extractPrompts } from "../templates"
import { useSettingsStore } from "../../../settings-store"

// Date locale (month/weekday names) now follows the UI language. Pin EN before
// every test so assertions are deterministic regardless of host machine locale
// (this dev box is ko-KR, CI is en) — ko cases set language explicitly.
beforeEach(() => {
  useSettingsStore.setState({ language: "en" })
})

describe("expandPlaceholders", () => {
  it("expands UpNote double-brace date tokens (the {{YYYY}}-{{MM}}-{{DD}} ask)", () => {
    expect(expandPlaceholders("{{YYYY}}-{{MM}}-{{DD}}")).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("expands 2-digit year {{YY}}", () => {
    const out = expandPlaceholders("{{YY}}")
    expect(out).toMatch(/^\d{2}$/)
    expect(out).toBe(String(new Date().getFullYear()).slice(2))
  })

  it("expands month names {{MMMM}} / {{MMM}}", () => {
    const long = expandPlaceholders("{{MMMM}}")
    const short = expandPlaceholders("{{MMM}}")
    expect(long).toMatch(/^(January|February|March|April|May|June|July|August|September|October|November|December)$/)
    expect(short).toMatch(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/)
  })

  it("expands weekday names {{dddd}} / {{ddd}}", () => {
    expect(expandPlaceholders("{{dddd}}")).toMatch(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/)
    expect(expandPlaceholders("{{ddd}}")).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/)
  })

  it("does not confuse overlapping tokens (MMMM vs MMM vs MM)", () => {
    const out = expandPlaceholders("{{MMMM}} {{MMM}} {{MM}}")
    expect(out).not.toContain("{")
    // month number is 2 digits
    expect(out.split(" ").pop()).toMatch(/^\d{2}$/)
  })

  it("still expands Plot legacy single-brace tokens", () => {
    expect(expandPlaceholders("{date}")).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(expandPlaceholders("{year}")).toMatch(/^\d{4}$/)
  })

  it("leaves unknown tokens untouched", () => {
    expect(expandPlaceholders("{{nope}} plain")).toBe("{{nope}} plain")
  })
})

describe("countPlaceholders", () => {
  it("counts the new double-brace tokens", () => {
    expect(countPlaceholders("{{YYYY}}-{{MM}}-{{DD}} {{dddd}}")).toBe(4)
  })

  it("counts legacy single-brace tokens", () => {
    expect(countPlaceholders("{date} and {year}")).toBe(2)
  })

  it("returns 0 for no placeholders", () => {
    expect(countPlaceholders("just text")).toBe(0)
  })

  it("counts offset and format tokens", () => {
    expect(countPlaceholders("{{date+1}} {{date-7}} {{date:YYYY/MM/DD}} {{tomorrow}}")).toBe(4)
  })
})

describe("expandPlaceholders — offsets, format params, locale", () => {
  const DAY = 86_400_000

  it("offsets days: {{date+1}} = tomorrow, {{date-1}} = yesterday", () => {
    const plus = expandPlaceholders("{{date+1}}")
    const minus = expandPlaceholders("{{date-1}}")
    expect(plus).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(minus).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    // exactly two days apart
    expect(Math.round((Date.parse(plus) - Date.parse(minus)) / DAY)).toBe(2)
  })

  it("offsets weeks/months/years: {{date+1w}} / {{date+1m}} / {{date+1y}}", () => {
    expect(expandPlaceholders("{{date+1w}}")).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(expandPlaceholders("{{date+1m}}")).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(expandPlaceholders("{{date+1y}}")).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    // +7 days and +1w land on the same date
    expect(expandPlaceholders("{{date+1w}}")).toBe(expandPlaceholders("{{date+7}}"))
  })

  it("named relative: {{tomorrow}} / {{yesterday}}", () => {
    const tom = expandPlaceholders("{{tomorrow}}")
    const yes = expandPlaceholders("{{yesterday}}")
    expect(Math.round((Date.parse(tom) - Date.parse(yes)) / DAY)).toBe(2)
    // {{tomorrow}} === {{date+1}}
    expect(tom).toBe(expandPlaceholders("{{date+1}}"))
  })

  it("format parameter: {{date:YYYY/MM/DD}} and offset+format {{date+1:YYYY-MM-DD}}", () => {
    expect(expandPlaceholders("{{date:YYYY/MM/DD}}")).toMatch(/^\d{4}\/\d{2}\/\d{2}$/)
    expect(expandPlaceholders("{{date+1:YYYY-MM-DD}}")).toBe(expandPlaceholders("{{date+1}}"))
  })

  it("does not let the date matcher swallow {{datetime}}", () => {
    expect(expandPlaceholders("{{datetime}}")).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })

  it("localizes month/weekday names to Korean when language=ko", () => {
    useSettingsStore.setState({ language: "ko" })
    expect(expandPlaceholders("{{MMMM}}")).toMatch(/월$/) // e.g. "6월"
    expect(expandPlaceholders("{{dddd}}")).toMatch(/요일$/) // e.g. "토요일"
  })

  it("keeps English month/weekday names when language=en", () => {
    useSettingsStore.setState({ language: "en" })
    expect(expandPlaceholders("{{MMMM}}")).toMatch(
      /^(January|February|March|April|May|June|July|August|September|October|November|December)$/,
    )
    expect(expandPlaceholders("{{dddd}}")).toMatch(
      /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/,
    )
  })
})

describe("prompt tokens", () => {
  it("substitutes {{prompt:Label}} from provided values", () => {
    expect(expandPlaceholders("제목: {{prompt:제목}}", { 제목: "회의록" })).toBe("제목: 회의록")
  })

  it("returns empty string for an unanswered prompt", () => {
    expect(expandPlaceholders("{{prompt:없음}}!")).toBe("!")
  })

  it("extractPrompts returns distinct labels in first-seen order", () => {
    expect(extractPrompts("{{prompt:제목}} / {{prompt:담당}} / {{prompt:제목}}")).toEqual([
      "제목",
      "담당",
    ])
  })

  it("counts prompt tokens", () => {
    expect(countPlaceholders("{{prompt:A}} {{date}} {{prompt:B}}")).toBe(3)
  })
})
