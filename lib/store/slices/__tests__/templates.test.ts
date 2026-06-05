import { describe, it, expect } from "vitest"
import { expandPlaceholders, countPlaceholders } from "../templates"

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
})
