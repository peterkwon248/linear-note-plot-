// ShellData.jsx — shell presets + starter content
const SHELLS = {
  wiki: {
    id: "wiki", label: "Wiki", subtitle: "Encyclopedia-style. Infobox, ToC, footnotes.",
    bg: "var(--background)", fg: "var(--foreground)",
    bodyFont: "var(--font-sans)", displayFont: "var(--font-sans)",
    maxWidth: 960, cols: 12, gap: 24,
    cardBorder: "1px solid var(--border-subtle)", cardRadius: 6,
    texture: "none",
  },
  magazine: {
    id: "magazine", label: "Magazine", subtitle: "Monocle-style. Masthead, drop cap, pull quotes.",
    bg: "#faf7f0", fg: "#1a1a1a",
    bodyFont: "'Merriweather', Georgia, serif", displayFont: "'Playfair Display', Georgia, serif",
    maxWidth: 1100, cols: 12, gap: 28,
    cardBorder: "none", cardRadius: 0,
    texture: "paper",
  },
  newspaper: {
    id: "newspaper", label: "Newspaper", subtitle: "NYT-style. 6-col rigid, column rules.",
    bg: "#f4efe6", fg: "#111",
    bodyFont: "'Merriweather', Georgia, serif", displayFont: "'Playfair Display', Georgia, serif",
    maxWidth: 1200, cols: 6, gap: 0,
    cardBorder: "none", cardRadius: 0,
    texture: "newsprint",
  },
  book: {
    id: "book", label: "Book", subtitle: "Novel-style. Cover, chapters, ribbon, ornaments.",
    bg: "#f5efe2", fg: "#1b1612",
    bodyFont: "'Merriweather', Georgia, serif", displayFont: "'Playfair Display', Georgia, serif",
    maxWidth: 560, cols: 1, gap: 24,
    cardBorder: "none", cardRadius: 0,
    texture: "linen",
  },
  blank: {
    id: "blank", label: "Blank", subtitle: "12-col grid, Plot defaults. Start from scratch.",
    bg: "var(--background)", fg: "var(--foreground)",
    bodyFont: "var(--font-sans)", displayFont: "var(--font-sans)",
    maxWidth: 1100, cols: 12, gap: 20,
    cardBorder: "1px solid var(--border-subtle)", cardRadius: 8,
    texture: "none",
  },
};

// Sample content per shell — realistic enough to feel like a real publication.
const CONTENT = {
  wiki: {
    title: "Spaced repetition",
    hatnote: "This article is about the learning technique. For the SRS software category, see Anki.",
    infobox: {
      title: "Spaced repetition",
      fields: [
        ["Type", "Learning technique"],
        ["Proposed", "Hermann Ebbinghaus, 1885"],
        ["Variant", "Leitner system · SM-2 · FSRS"],
        ["Efficacy", "Robust across 100+ studies"],
      ],
    },
    toc: [
      { n: "1", t: "History" },
      { n: "2", t: "The forgetting curve" },
      { n: "2.1", t: "Ebbinghaus's experiment" },
      { n: "3", t: "Algorithms" },
      { n: "3.1", t: "Leitner system" },
      { n: "3.2", t: "SuperMemo (SM-2)" },
      { n: "3.3", t: "FSRS" },
      { n: "4", t: "In software" },
      { n: "5", t: "Criticism" },
    ],
    body: [
      { type: "lead", text: "Spaced repetition is a learning technique in which newly introduced and more difficult flashcards are shown more frequently, while older and less difficult ones are shown less frequently. The intervals grow according to the reviewer's performance — correct recalls stretch the next review further out, failures reset it." },
      { type: "h2", text: "History" },
      { type: "p", text: "The technique has roots in Hermann Ebbinghaus's 1885 research on forgetting. Ebbinghaus memorized lists of nonsense syllables and plotted his own retention over time, producing the first curve that now bears his name." },
      { type: "p", text: "It was codified into a practical study system by Sebastian Leitner in 1972 (the Leitner system), and later operationalized into computer algorithms by Piotr Woźniak at SuperMemo, beginning with SM-0 in 1985 and reaching SM-2 by 1987[1]." },
      { type: "h2", text: "The forgetting curve" },
      { type: "p", text: "Retention of unrehearsed information drops sharply within hours and days. Spaced repetition explicitly fights this curve by scheduling reviews near the predicted failure point." },
      { type: "h2", text: "Algorithms" },
      { type: "p", text: "Modern implementations include the Leitner system (analog boxes), SM-2 (Anki's default), Mnemosyne's variant, and FSRS (Free Spaced Repetition Scheduler), which uses a three-component memory model fit to the user's review history." },
    ],
    footnotes: [
      "1. Woźniak, P. A. (1990). Optimization of learning. Master's thesis, University of Technology in Poznań.",
    ],
  },
  magazine: {
    masthead: { brand: "PLOT", issue: "Issue 04", date: "October 2026" },
    nameplate: "Culture",
    headline: "The quiet return of the commonplace book",
    deck: "Why a 400-year-old habit of reading with a pen in hand is suddenly relevant again.",
    byline: "Words — Peter Kwon    ·    Photography — archive",
    body: [
      { type: "dropcap-p", text: "Ben Jonson kept one. So did Locke, Milton, and Thomas Jefferson. For four centuries the commonplace book — a private notebook where a reader collected passages, quotations, and half-formed arguments — was the default technology of a serious mind. Then, somewhere in the 20th century, it disappeared." },
      { type: "p", text: "Now it's back. Not under its own name — the phrase is almost never used by the people reviving it — but under names like \"Zettelkasten\", \"second brain\", \"personal wiki\". The substance is the same: the slow accumulation of fragments, connected over time." },
      { type: "pullquote", text: "A commonplace book is not a to-do list. It is a conversation with your former self." },
      { type: "p", text: "What changed? The obvious answer is software — any notes app now offers tagging and backlinks that a paper book cannot. But the deeper reason is attention. For a generation that reads in scrolling fragments, a commonplace book is the opposite technology: it makes you slow down, extract one idea, write it by hand." },
      { type: "h2", text: "Three rules" },
      { type: "p", text: "The revivalists share three rules. Write only passages you'd want to re-encounter in five years. Always in your own handwriting, or at least your own words. Review the whole book once a season." },
    ],
  },
  newspaper: {
    flag: "THE PLOT TIMES",
    tagline: "\"All the notes that fit to print.\"",
    dateStrip: { date: "WEDNESDAY, OCTOBER 14, 2026", edition: "LATE EDITION", vol: "VOL. IV · NO. 217" },
    lead: {
      kicker: "LEARNING",
      headline: "Memory Researchers Say the Forgetting Curve Is Real, Actionable, and Mostly Ignored",
      deck: "After a century of research, the science of retention is robust — but most students still cram.",
      byline: "By P. KWON",
      city: "SEOUL —",
      body: [
        "A 135-year-old curve drawn by a German psychologist in 1885 now has better empirical support than most theories in learning science. And most learners, researchers say, still act as if it didn't exist.",
        "\"The finding is unambiguous,\" said one reviewer. \"Distributed practice beats massed practice, at every age, in every subject we've tested.\" And yet walk into any library the week before exams and watch what happens.",
        "The reasons are partly cognitive. Cramming feels productive because recognition is easy — you see the term, you've seen it before, you move on. Recall, the effortful retrieval that spaced repetition demands, feels slower because it is slower. It is also what actually builds memory.",
      ],
    },
    side1: {
      kicker: "TECHNOLOGY",
      head: "Local-First Apps Return to Favor",
      body: [
        "A generation of note-takers is rediscovering software that does not depend on a server.",
        "The movement, loosely described as \"local-first,\" argues that your notes should outlive any company that made the app.",
      ],
    },
    side2: {
      kicker: "REVIEW",
      head: "Three New Titles on Attention",
      body: [
        "This week's desk reviews three recent books on the attention economy and what, if anything, can be done about it.",
      ],
    },
  },
  book: {
    cover: { title: "Plot", subtitle: "a field guide to your own mind", author: "Peter Kwon", publisher: "PLOT EDITIONS" },
    chapterNum: "I",
    chapterTitle: "On the slow habit",
    body: [
      { type: "firstline", text: "It begins, as these things always begin, with a notebook." },
      { type: "p", text: "Not a special one — the kind of notebook one buys without ceremony at a station kiosk, spiral-bound, a little too small for the hand. The first entry is not momentous. It is the date and a sentence and perhaps a quotation copied from whatever book happened to be open on the kitchen table. The second entry, the next day, is much the same." },
      { type: "p", text: "It is only after some months, when the notebook has become thick with handling and its cover has begun to separate at the corners, that one looks back at what one has written and discovers, with a small shock, that a life has been there all along. Not a story — stories are tidy. A life: fragments that rhyme, returns that surprise." },
      { type: "break" },
      { type: "p", text: "This book is about that habit. The habit of writing down what you did not know you noticed. It is not, I should say at once, a method. There are methods for this — some quite elaborate, involving colored tabs and taxonomies and software — and for the reader who wants one I recommend without reservation the patient work of the German sociologist Niklas Luhmann, whose slip-box was, in retrospect, the finest argument yet made for the dignity of the commonplace book." },
      { type: "p", text: "But a method is not a habit, and the difference between them is the whole subject of the pages that follow." },
    ],
  },
};

window.SHELLS = SHELLS;
window.CONTENT = CONTENT;
