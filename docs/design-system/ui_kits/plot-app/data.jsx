// data.js — fake notes used by the index
const SAMPLE_NOTES = [
  { id: "NOT-214", kind: "permanent", title: "Zettelkasten vs PARA — an honest comparison", when: "2d", tags: ["method", "writing"],
    preview: "PARA optimizes retrieval for projects. Zettelkasten optimizes connection for ideas. You don't pick; you layer.",
    ready: false,
    body: [
      { type: "p", text: "PARA optimizes retrieval for projects. Zettelkasten optimizes connection for ideas. You don't pick; you layer them." },
      { type: "h2", text: "What each is actually solving" },
      { type: "p", text: "PARA (Projects · Areas · Resources · Archive) is a filing system. It assumes the unit is the task and the question is \"where does this go so I can find it when the deadline comes.\"" },
      { type: "p", text: "Zettelkasten assumes the unit is the idea and the question is \"what else is this connected to.\" The slip-box is a generator, not a shelf." },
      { type: "quote", text: "Structure should be felt, not seen." },
      { type: "h2", text: "How Plot layers them" },
      { type: "ul", items: ["Inbox = untyped capture", "Capture = active development (PARA's \"Projects\")", "Permanent = atomic notes, bidirectionally linked"] },
      { type: "p", text: "See also:" },
      { type: "link-back", text: "Atomic notes — the smallest unit that holds" },
    ],
  },
  { id: "NOT-213", kind: "capture", title: "Opacity hierarchy is a design primitive", when: "5d", tags: ["design"],
    preview: "Most apps use color to separate states. Linear uses opacity. The result reads calmer because you're not competing shades.",
    ready: true,
    body: [
      { type: "p", text: "Most apps use color to separate states: active is blue, hover is darker blue, disabled is grey. Linear uses opacity against a single text color and it reads dramatically calmer." },
      { type: "h2", text: "The six stops" },
      { type: "ul", items: ["0.93 — active", "0.85 — hover", "0.65 — resting body", "0.55 — resting icon", "0.45 — count/meta", "0.35 — hint"] },
      { type: "p", text: "You never invent an in-between value. The constraint is the design." },
      { type: "code", text: "color: rgba(255, 255, 255, 0.65);  /* resting */\ncolor: rgba(255, 255, 255, 0.85);  /* hover  */" },
    ],
  },
  { id: "NOT-212", kind: "capture", title: "Ship crumbs, not loaves", when: "1w", tags: ["writing"], preview: "A crumb a week beats a loaf a year. Plot's review queue is built for crumbs." },
  { id: "NOT-211", kind: "inbox", title: "Claim: local-first is a feeling, not an architecture", when: "1w", tags: ["product"], preview: "Offline-capable isn't the point. Instant is the point." },
  { id: "NOT-210", kind: "permanent", title: "Atomic notes — the smallest unit that holds", when: "2w", tags: ["method"], preview: "A note is atomic when removing any sentence breaks the point." },
  { id: "NOT-209", kind: "capture", title: "Review Queue algorithm — fixed-step SRS", when: "2w", tags: ["product"], preview: "Intervals: 1, 3, 7, 14, 30, 60, 120 days. No ease factor." },
  { id: "NOT-208", kind: "inbox", title: "Read: The Garden and the Stream — Mike Caulfield", when: "3w", tags: ["reading"] },
  { id: "NOT-207", kind: "permanent", title: "Quality Wednesdays — a ritual, not a meeting", when: "3w", tags: ["method", "product"], preview: "Every Wednesday, close all tabs. Fix one sharp edge in the product. That's it." },
  { id: "NOT-206", kind: "inbox", title: "Thought: the best tools don't have onboarding", when: "1mo", tags: ["idea"] },
  { id: "NOT-205", kind: "capture", title: "How I take notes in 2026", when: "1mo", tags: ["writing", "method"], preview: "The workflow after two years of trying every app." },
];

window.SAMPLE_NOTES = SAMPLE_NOTES;
