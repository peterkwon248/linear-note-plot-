import type { Shell, ShellId, ThemeConfig, BlockDefinition, BlockType } from "./types"

export const SHELLS: Record<ShellId, Shell> = {
  wiki: {
    id: "wiki",
    label: "Wiki",
    subtitle: "Encyclopedia-style: single column, infobox, ToC, footnotes",
    bg: "var(--background)",
    fg: "var(--foreground)",
    texture: "none",
    bodyFont: "'Geist', system-ui, sans-serif",
    displayFont: "'Geist', system-ui, sans-serif",
    cols: 1,
    maxWidth: 960,
    cardBorder: "1px solid var(--border-subtle)",
    cardRadius: 6,
  },
  magazine: {
    id: "magazine",
    label: "Magazine",
    subtitle: "Editorial: masthead, drop caps, pull quotes, 2-col layout",
    bg: "#faf7f0",
    fg: "#1a1a1a",
    texture: "none",
    bodyFont: "'Merriweather', Georgia, serif",
    displayFont: "'Playfair Display', Georgia, serif",
    cols: 2,
    maxWidth: 1080,
    cardBorder: "none",
    cardRadius: 0,
  },
  newspaper: {
    id: "newspaper",
    label: "Newspaper",
    subtitle: "Dense 6-col grid, column rules, headlines by size hierarchy",
    bg: "#f4efe6",
    fg: "#111111",
    texture: "newsprint",
    bodyFont: "'Merriweather', Georgia, serif",
    displayFont: "'Playfair Display', Georgia, serif",
    cols: 6,
    maxWidth: 1200,
    cardBorder: "1px solid rgba(0,0,0,0.15)",
    cardRadius: 0,
  },
  book: {
    id: "book",
    label: "Book",
    subtitle: "Classic novel: cover, chapters, running headers, ribbon",
    bg: "#f5efe2",
    fg: "#1a1a1a",
    texture: "paper",
    bodyFont: "'Merriweather', Georgia, serif",
    displayFont: "'Playfair Display', Georgia, serif",
    cols: 1,
    maxWidth: 520,
    cardBorder: "none",
    cardRadius: 0,
  },
  blank: {
    id: "blank",
    label: "Blank",
    subtitle: "No chrome, 12-col grid, start from scratch",
    bg: "var(--background)",
    fg: "var(--foreground)",
    texture: "none",
    bodyFont: "'Geist', system-ui, sans-serif",
    displayFont: "'Geist', system-ui, sans-serif",
    cols: 12,
    maxWidth: 1200,
    cardBorder: "none",
    cardRadius: 6,
  },
}

export const FONT_PAIRS = {
  default: {
    display: "'Playfair Display', Georgia, serif",
    body: "'Merriweather', Georgia, serif",
  },
  classic: {
    display: "'EB Garamond', Garamond, serif",
    body: "'EB Garamond', Garamond, serif",
  },
  modern: {
    display: "'Geist', system-ui, sans-serif",
    body: "'Geist', system-ui, sans-serif",
  },
  editorial: {
    display: "'Playfair Display', Georgia, serif",
    body: "'Geist', system-ui, sans-serif",
  },
  bauhaus: {
    display: "'Geist Mono', ui-monospace, monospace",
    body: "'Geist', system-ui, sans-serif",
  },
}

export const MARGIN_SCALE = {
  narrow: 0.65,
  standard: 1,
  wide: 1.5,
}

export function resolveShell(shell: Shell, theme: ThemeConfig): Shell {
  const pair = FONT_PAIRS[theme.fontPair] || FONT_PAIRS.default
  const mScale = MARGIN_SCALE[theme.margins] || 1

  return {
    ...shell,
    bodyFont:
      theme.fontPair && theme.fontPair !== "default" ? pair.body : shell.bodyFont,
    displayFont:
      theme.fontPair && theme.fontPair !== "default"
        ? pair.display
        : shell.displayFont,
    fg: theme.textColor || shell.fg,
    cols: theme.cols > 0 ? theme.cols : shell.cols,
  }
}

export const BLOCK_LIBRARY: Record<BlockType, BlockDefinition> = {
  // universal
  paragraph: { label: "Paragraph", hint: "Body text", glyph: "\u00b6", shells: "*", span: 12 },
  heading: { label: "Heading", hint: "Section title", glyph: "H", shells: "*", span: 12 },
  image: { label: "Image", hint: "Photo + caption", glyph: "\u25a3", shells: "*", span: 6 },
  quote: { label: "Quote", hint: "Indented blockquote", glyph: "\u201c", shells: "*", span: 10 },
  divider: { label: "Divider", hint: "Horizontal rule", glyph: "\u2014", shells: "*", span: 12 },
  // wiki
  infobox: { label: "Infobox", hint: "Right-rail fact table", glyph: "\u24d8", shells: ["wiki"], span: 4 },
  toc: { label: "Table of Contents", hint: "Auto-numbered ToC", glyph: "\u2630", shells: ["wiki"], span: 12 },
  footnote: { label: "Footnote", hint: "Numbered reference", glyph: "\u00b9", shells: ["wiki"], span: 12 },
  hatnote: { label: "Hatnote", hint: "Italic preface", glyph: "\u2310", shells: ["wiki"], span: 12 },
  // magazine
  masthead: { label: "Masthead", hint: "Brand + issue strip", glyph: "M", shells: ["magazine"], span: 12 },
  nameplate: { label: "Nameplate", hint: "Section label w/ rules", glyph: "\u00a7", shells: ["magazine", "newspaper"], span: 12 },
  headline: { label: "Headline", hint: "Display-type title", glyph: "A", shells: ["magazine", "newspaper"], span: 12 },
  deck: { label: "Deck", hint: "Subhead under headline", glyph: "a", shells: ["magazine", "newspaper"], span: 12 },
  byline: { label: "Byline", hint: "Author \xb7 photographer", glyph: "\u2014", shells: ["magazine", "newspaper"], span: 12 },
  dropcap: { label: "Drop Cap", hint: "Opening paragraph", glyph: "Q", shells: ["magazine", "book"], span: 12 },
  pullquote: { label: "Pull Quote", hint: "Oversized italic break", glyph: "\u275d", shells: ["magazine"], span: 8 },
  // newspaper
  flag: { label: "Flag", hint: "Newspaper wordmark", glyph: "F", shells: ["newspaper"], span: 12 },
  datestrip: { label: "Date Strip", hint: "Date \xb7 edition \xb7 vol", glyph: "\u2550", shells: ["newspaper"], span: 12 },
  columnrule: { label: "Column Rule", hint: "Vertical divider", glyph: "\u2502", shells: ["newspaper"], span: 1 },
  kicker: { label: "Kicker", hint: "Small-caps section tag", glyph: "\u203a", shells: ["newspaper", "magazine"], span: 12 },
  jumpline: { label: "Jump Line", hint: "Continued on page\u2026", glyph: "\u2197", shells: ["newspaper"], span: 12 },
  // book
  cover: { label: "Cover", hint: "Front cover page", glyph: "\u25a2", shells: ["book"], span: 12 },
  backcover: { label: "Back Cover", hint: "Closing page", glyph: "\u25a3", shells: ["book"], span: 12 },
  chapter: { label: "Chapter", hint: "Roman numeral + title", glyph: "I", shells: ["book"], span: 12 },
  ornament: { label: "Ornament", hint: "\u2767 \u2766 \u2756 break", glyph: "\u2766", shells: ["book", "magazine"], span: 12 },
  colophon: { label: "Colophon", hint: "Typeface credits", glyph: "\u00a9", shells: ["book"], span: 12 },
  runninghead: { label: "Running Head", hint: "Page-top label", glyph: "\u203e", shells: ["book"], span: 12 },
}

export function getShellBlocks(shellId: ShellId): [BlockType, BlockDefinition][] {
  return (Object.entries(BLOCK_LIBRARY) as [BlockType, BlockDefinition][]).filter(
    ([, def]) => def.shells === "*" || def.shells.includes(shellId)
  )
}

export const TEXTURES = {
  none: "none",
  paper: "radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px)",
  newsprint: "radial-gradient(rgba(0,0,0,0.04) 0.5px, transparent 0.5px)",
  dots: "radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)",
  linen: "repeating-linear-gradient(0deg, rgba(0,0,0,0.015) 0 1px, transparent 1px 2px), repeating-linear-gradient(90deg, rgba(0,0,0,0.015) 0 1px, transparent 1px 2px)",
}

export const SAMPLE_CONTENT = {
  wiki: {
    title: "Spaced Repetition",
    hatnote: "This article is about the memory technique. For the software, see SRS software.",
    infobox: {
      title: "Spaced Repetition",
      fields: [
        ["Type", "Learning technique"],
        ["Based on", "Ebbinghaus forgetting curve"],
        ["First used", "1885"],
        ["Key figure", "Sebastian Leitner"],
        ["Related", "Active recall, Interleaving"],
      ],
    },
    toc: [
      { n: "1", t: "History" },
      { n: "2", t: "Scientific basis" },
      { n: "2.1", t: "The forgetting curve" },
      { n: "3", t: "Implementation" },
      { n: "4", t: "Software" },
    ],
    body: [
      { type: "lead", text: "Spaced repetition is an evidence-based learning technique that incorporates increasing intervals of time between subsequent review of previously learned material." },
      { type: "h2", text: "History" },
      { type: "p", text: "The principle was first described by German psychologist Hermann Ebbinghaus in his 1885 book Memory: A Contribution to Experimental Psychology." },
      { type: "h2", text: "Scientific basis" },
      { type: "p", text: "The spacing effect demonstrates that learning is more effective when study sessions are spaced out over time, rather than concentrated in a single session." },
    ],
    footnotes: [
      "1. Ebbinghaus, H. (1885). Memory: A Contribution to Experimental Psychology.",
      "2. Pimsleur, P. (1967). A Memory Schedule. The Modern Language Journal.",
    ],
  },
  magazine: {
    masthead: { brand: "PLOT", issue: "Issue 01", date: "Spring 2026" },
    nameplate: "On Knowledge",
    headline: "The Slow Art of Remembering",
    deck: "Why the best ideas come from the patience of returning, again and again, to what we thought we already knew",
    byline: "Words \u2014 Peter Kwon \xb7 Photography \u2014 Archive",
    body: [
      { type: "dropcap-p", text: "It begins, as these things always begin, with a notebook. Not a special one \u2014 the kind of notebook one buys without ceremony at a station kiosk, spiral-bound, a little too small for the hand." },
      { type: "pullquote", text: "A notebook is the cheapest lab in the world." },
      { type: "p", text: "The first entry is not momentous. It is the date and a sentence and perhaps a quotation copied from whatever book happened to be open on the kitchen table." },
      { type: "h2", text: "The Second Return" },
      { type: "p", text: "The second entry, the next day, is much the same. It is only after some months, when the notebook has become thick with handling, that one looks back." },
    ],
  },
  newspaper: {
    flag: "THE PLOT TIMES",
    tagline: "All the knowledge that\u2019s fit to remember",
    dateStrip: { vol: "Vol. CLXIV", date: "Monday, April 21, 2026", edition: "Late Edition" },
    lead: {
      kicker: "KNOWLEDGE MANAGEMENT",
      headline: "Scientists Confirm: Writing It Down Actually Works",
      deck: "Decades of research validate ancient practice of note-taking",
      byline: "By P. KWON",
      city: "SEOUL \u2014",
      body: [
        "In a finding that would surprise no one who has ever kept a notebook, researchers have confirmed what writers have known for centuries.",
        "The study, published in the Journal of Memory and Cognition, tracked 1,200 participants over five years.",
      ],
    },
    side1: {
      kicker: "TECHNOLOGY",
      head: "Local-First Software Gains Momentum",
      body: ["A growing movement of developers is building software that puts user data first."],
    },
    side2: {
      kicker: "CULTURE",
      head: "The Return of the Commonplace Book",
      body: ["Sales of blank notebooks have increased 340% since 2020."],
    },
  },
  book: {
    cover: {
      publisher: "PLOT EDITIONS",
      title: "Plot",
      subtitle: "a field guide to your own mind",
      author: "Peter Kwon",
    },
    chapterTitle: "On the slow habit",
    body: [
      { type: "dropcap-p", text: "It begins, as these things always begin, with a notebook. Not a special one \u2014 the kind of notebook one buys without ceremony at a station kiosk, spiral-bound, a little too small for the hand." },
      { type: "p", text: "The first entry is not momentous. It is the date and a sentence and perhaps a quotation copied from whatever book happened to be open." },
      { type: "p", text: "Not a story \u2014 stories are tidy. A life: fragments that rhyme, returns that surprise." },
    ],
  },
}
