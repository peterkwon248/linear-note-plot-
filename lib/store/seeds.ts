import type { Note, Folder, Tag, Label, NoteTemplate, WikiArticle, WikiBlock, WikiCategory } from "../types"
import { workflowDefaults } from "./helpers"
import { buildSectionIndex } from "../wiki-section-index"

export const SEED_FOLDERS: Folder[] = [
  { id: "folder-1", name: "Projects", color: "#5e6ad2", parentId: null, lastAccessedAt: null, pinned: false, pinnedOrder: 0, createdAt: new Date().toISOString() },
  { id: "folder-2", name: "Daily Log", color: "#45d483", parentId: null, lastAccessedAt: null, pinned: false, pinnedOrder: 0, createdAt: new Date().toISOString() },
]

export const SEED_TAGS: Tag[] = [
  { id: "tag-1", name: "Knowledge Management", color: "#5e6ad2" },
  { id: "tag-2", name: "Zettelkasten", color: "#7c66dc" },
  { id: "tag-3", name: "Productivity", color: "#45d483" },
  { id: "tag-4", name: "Reading", color: "#f5a623" },
  { id: "tag-5", name: "Tech", color: "#e5484d" },
]

export const SEED_LABELS: Label[] = [
  { id: "label-1", name: "Idea", color: "#7c66dc" },
  { id: "label-2", name: "Research", color: "#5e6ad2" },
  { id: "label-3", name: "Meeting", color: "#45d483" },
  { id: "label-4", name: "Diary", color: "#e5484d" },
  { id: "label-5", name: "Memo", color: "#f5a623" },
]

export const SEED_TEMPLATES: NoteTemplate[] = [
  {
    id: "tmpl-meeting",
    name: "Meeting Notes",
    description: "Meeting notes template",
    icon: "📋",
    color: "#45d483",
    title: "Meeting - {date}",
    content: "## Attendees\n\n- \n\n## Agenda\n\n1. \n\n## Decisions\n\n- \n\n## Action Items\n\n- [ ] ",
    contentJson: null,
    status: "capture",
    priority: "medium",
    labelId: "label-3",
    tags: [],
    folderId: null,
    pinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-daily",
    name: "Daily Log",
    description: "Daily journal entry",
    icon: "📝",
    color: "#5e6ad2",
    title: "Daily - {date}",
    content: "## Today\n\n### Done\n\n- \n\n### In Progress\n\n- \n\n### Notes\n\n",
    contentJson: null,
    status: "inbox",
    priority: "none",
    labelId: "label-4",
    tags: [],
    folderId: null,
    pinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-idea",
    name: "Idea",
    description: "Quick idea note",
    icon: "💡",
    color: "#7c66dc",
    title: "",
    content: "## Idea\n\n\n\n## Why?\n\n\n\n## Next Steps\n\n- ",
    contentJson: null,
    status: "inbox",
    priority: "none",
    labelId: "label-1",
    tags: [],
    folderId: null,
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-research",
    name: "Research",
    description: "Research note",
    icon: "🔬",
    color: "#5e6ad2",
    title: "",
    content: "## Topic\n\n\n\n## Key Findings\n\n\n\n## Sources\n\n- \n\n## Insights\n\n",
    contentJson: null,
    status: "capture",
    priority: "none",
    labelId: "label-2",
    tags: [],
    folderId: null,
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

/* ── Content strings ────────────────────────────────── */

const NOTE_1_CONTENT = `# Getting Started with Plot

Plot is an app that combines notes, wiki, and a knowledge graph into one.

## Get Started in 3 Minutes

### 1. Write Notes
Jot down any thought quickly. Notes go through three stages:
- **Inbox** — a thought you just had
- **Capture** — a note you're refining
- **Permanent** — a finished, polished note

### 2. Organize Knowledge with Wiki
Turn concepts you reference repeatedly into a [[wiki:Zettelkasten]] wiki page. Wiki pages are your personal encyclopedia.
- Link with double brackets like \`[[wiki:Zettelkasten]]\`
- Frequently referenced notes are automatically suggested as wiki candidates

### 3. Discover Connections
Explore how your notes connect visually in the Graph View.
- See which notes reference this one via backlinks
- Classify with tags and folders, distinguish types with labels

## Next Steps
- Read the [[wiki:Zettelkasten]] wiki
- Check out [[My Reading Notes]]
- Create your very first note!`

const NOTE_2_CONTENT = `# My Reading Notes

Good reading notes don't just copy the original text verbatim.

## 3-Step Method

### Step 1: Highlight
Underline the important parts as you read.

### Step 2: Rewrite in Your Own Words
Rewrite the highlighted passages **in your own words**. This is what's called a [[wiki:Fleeting Note]].

### Step 3: Connect
Think about how it relates to your existing notes.
- "This concept aligns with the core principle of [[wiki:Zettelkasten]]"
- "This is the opposite viewpoint from something I read before"

## Example
> "Creativity is not about creating something from nothing, but about finding new combinations of existing ideas."

Rewritten: **Creative thinking is the art of connection. It's not about inventing something new, but about weaving existing ideas together in new ways.** — This is why [[wiki:Zettelkasten]] emphasizes linking.`

const NOTE_3_CONTENT = `# Build a Personal Wiki

## Goals
Systematically build my own personal wiki.

## Principles
1. Add or improve one wiki page every day
2. Connect every permanent note to at least one wiki page
3. Check for orphaned notes in the Graph View each quarter

## Progress
- [x] Install Plot and configure basics
- [x] Study the [[wiki:Zettelkasten]] methodology
- [ ] Write seed wiki pages for each area of interest
- [ ] Establish a weekly review routine`

const NOTE_4_CONTENT = `# Compound Interest of Knowledge

Just like compound interest, knowledge accelerates as it accumulates.

With 10 notes there's not much to connect,
but with 100 notes, every new note links to several existing ones.

→ A core insight of [[wiki:Zettelkasten]]
→ Even if the effect is small at first, consistent accumulation is key`

const NOTE_5_CONTENT = `# Weekly Review 2026-W14

## What I Did This Week
- Started organizing concepts using Plot's wiki feature
- Applied [[My Reading Notes]] method to summarize a book

## To-Do Next Week
- [ ] Add 3 new wiki pages
- [ ] Identify existing notes to promote to wiki`

const NOTE_6_CONTENT = "Quick Memo: to organize later — effective tag usage, folders vs tags comparison"

const NOTE_7_CONTENT = `My first encounter with Zettelkasten was through Sönke Ahrens' book "How to Take Smart Notes."

The key takeaway: **writing is thinking.** You don't just store information — you actively process it by restating ideas in your own words.

I've been using [[wiki:Zettelkasten]] principles in Plot for 2 weeks now. The most powerful aspect is how [[wiki:Permanent Note]]s naturally form clusters over time.

What surprised me: the system gets MORE useful as it grows, not less. Every new note creates potential connections with all existing ones.`

const NOTE_8_CONTENT = `My criteria for promoting a note to Permanent status:

1. **Standalone** — Does it make sense without context?
2. **Atomic** — Is it about ONE idea only?
3. **Connected** — Can I link it to at least 2 existing notes?

The hardest part is step 1. Most of my [[wiki:Fleeting Note]]s are too context-dependent.

Goal: Convert at least 3 fleeting notes to [[wiki:Permanent Note]]s every week.`

const NOTE_9_CONTENT = `Should fleeting notes have an expiration date?

In [[wiki:Zettelkasten]], a [[wiki:Fleeting Note]] is meant to be temporary. But I keep accumulating them without processing.

Maybe I should set a 7-day rule: if a fleeting note isn't promoted within a week, review and either promote or delete it.`

/* ── Seed notes ─────────────────────────────────────── */

export const SEED_NOTES: Note[] = [
  {
    id: "note-1",
    title: "Getting Started with Plot",
    content: NOTE_1_CONTENT,
    contentJson: null,
    folderId: null,
    tags: ["tag-1"],
    labelId: null,
    status: "permanent",
    priority: "high",
    reads: 5,
    pinned: true,
    trashed: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    ...workflowDefaults("permanent"),
    noteType: "note" as const,
    summary: "Core concepts and getting started guide for the Plot app",
    preview: "Getting Started with Plot — Plot is an app that combines notes, wiki, and a knowledge graph into one.",
    linksOut: ["zettelkasten", "my reading notes"],
    aliases: [],
    wikiInfobox: [],
    referenceIds: [],
  },
  {
    id: "note-2",
    title: "My Reading Notes",
    content: NOTE_2_CONTENT,
    contentJson: null,
    folderId: null,
    tags: ["tag-4", "tag-1"],
    labelId: "label-2",
    status: "capture",
    priority: "medium",
    reads: 3,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    ...workflowDefaults("capture"),
    noteType: "note" as const,
    summary: "A 3-step method for writing effective reading notes",
    preview: "My Reading Notes — Good reading notes don't just copy the original text verbatim.",
    linksOut: ["fleeting note", "zettelkasten"],
    aliases: [],
    wikiInfobox: [],
    referenceIds: [],
  },
  {
    id: "note-3",
    title: "Build a Personal Wiki",
    content: NOTE_3_CONTENT,
    contentJson: null,
    folderId: "folder-1",
    tags: ["tag-1", "tag-3"],
    labelId: null,
    status: "permanent",
    priority: "medium",
    reads: 8,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    ...workflowDefaults("permanent"),
    noteType: "note" as const,
    summary: "Personal wiki building project plan and progress",
    preview: "Build a Personal Wiki — Goals: Systematically build my own personal wiki.",
    linksOut: ["zettelkasten"],
    aliases: [],
    wikiInfobox: [],
    referenceIds: [],
  },
  {
    id: "note-4",
    title: "Compound Interest of Knowledge",
    content: NOTE_4_CONTENT,
    contentJson: null,
    folderId: null,
    tags: ["tag-1"],
    labelId: "label-1",
    status: "inbox",
    priority: "none",
    reads: 1,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    ...workflowDefaults("inbox"),
    noteType: "note" as const,
    summary: null,
    preview: "Just like compound interest, knowledge accelerates as it accumulates.",
    linksOut: ["zettelkasten"],
    aliases: [],
    wikiInfobox: [],
    referenceIds: [],
  },
  {
    id: "note-5",
    title: "Weekly Review 2026-W14",
    content: NOTE_5_CONTENT,
    contentJson: null,
    folderId: "folder-2",
    tags: ["tag-3"],
    labelId: "label-4",
    status: "inbox",
    priority: "none",
    reads: 0,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    ...workflowDefaults("inbox"),
    noteType: "note" as const,
    summary: null,
    preview: "Weekly Review 2026-W14 — Applied My Reading Notes method to summarize a book.",
    linksOut: ["my reading notes"],
    aliases: [],
    wikiInfobox: [],
    referenceIds: [],
  },
  {
    id: "note-6",
    title: "Quick Memo",
    content: NOTE_6_CONTENT,
    contentJson: null,
    folderId: null,
    tags: [],
    labelId: "label-5",
    status: "inbox",
    priority: "low",
    reads: 0,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 900000).toISOString(),
    updatedAt: new Date(Date.now() - 900000).toISOString(),
    ...workflowDefaults("inbox"),
    noteType: "note" as const,
    summary: null,
    preview: "Quick Memo: to organize later — effective tag usage, folders vs tags comparison",
    linksOut: [],
    aliases: [],
    wikiInfobox: [],
    referenceIds: [],
  },
  {
    id: "note-7",
    title: "Zettelkasten",
    content: NOTE_7_CONTENT,
    contentJson: null,
    folderId: null,
    tags: ["tag-2"],
    labelId: "label-2",
    status: "permanent",
    priority: "none",
    reads: 2,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    ...workflowDefaults("permanent"),
    noteType: "note" as const,
    summary: null,
    preview: "My first encounter with Zettelkasten was through Sönke Ahrens' book \"How to Take Smart Notes.\" The key takeaway: writing is thinking.",
    linksOut: ["zettelkasten", "permanent note"],
    aliases: [],
    wikiInfobox: [],
    referenceIds: [],
  },
  {
    id: "note-8",
    title: "Permanent Note",
    content: NOTE_8_CONTENT,
    contentJson: null,
    folderId: null,
    tags: ["tag-2", "tag-1"],
    labelId: "label-1",
    status: "capture",
    priority: "none",
    reads: 1,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    ...workflowDefaults("capture"),
    noteType: "note" as const,
    summary: null,
    preview: "My criteria for promoting a note to Permanent status: Standalone — Does it make sense without context? Atomic — Is it about ONE idea only?",
    linksOut: ["permanent note", "fleeting note"],
    aliases: [],
    wikiInfobox: [],
    referenceIds: [],
  },
  {
    id: "note-9",
    title: "Fleeting Note",
    content: NOTE_9_CONTENT,
    contentJson: null,
    folderId: null,
    tags: ["tag-2"],
    labelId: null,
    status: "inbox",
    priority: "none",
    reads: 0,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    ...workflowDefaults("inbox"),
    noteType: "note" as const,
    summary: null,
    preview: "Should fleeting notes have an expiration date? In Zettelkasten, a fleeting note is meant to be temporary. But I keep accumulating them.",
    linksOut: ["fleeting note", "zettelkasten"],
    aliases: [],
    wikiInfobox: [],
    referenceIds: [],
  },
]

/* ── Seed Wiki Categories (DAG) ── */

export const SEED_WIKI_CATEGORIES: WikiCategory[] = [
  {
    id: "wcat-seed-1",
    name: "Knowledge Management",
    parentIds: [],
    description: "Methods and systems for organizing knowledge",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "wcat-seed-2",
    name: "Zettelkasten",
    parentIds: ["wcat-seed-1"],
    description: "The Zettelkasten slip-box methodology",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "wcat-seed-3",
    name: "Note Types",
    parentIds: ["wcat-seed-1", "wcat-seed-2"],
    description: "Different types of notes in knowledge systems",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "wcat-seed-4",
    name: "Computer Science",
    parentIds: [],
    description: "Fundamentals of computing and programming",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "wcat-seed-5",
    name: "Algorithms",
    parentIds: ["wcat-seed-4"],
    description: "Algorithm design and analysis",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "wcat-seed-6",
    name: "Data Structures",
    parentIds: ["wcat-seed-4"],
    description: "Organizing and storing data efficiently",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "wcat-seed-7",
    name: "Philosophy",
    parentIds: [],
    description: "Fundamental questions about existence, knowledge, and ethics",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "wcat-seed-8",
    name: "Epistemology",
    parentIds: ["wcat-seed-7"],
    description: "Theory of knowledge — what we can know and how",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "wcat-seed-9",
    name: "Productivity",
    parentIds: [],
    description: "Methods and tools for personal effectiveness",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "wcat-seed-10",
    name: "Note-taking",
    parentIds: ["wcat-seed-9", "wcat-seed-1"],
    description: "Strategies and tools for effective note-taking",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
]

/* ── Seed Wiki Articles (Assembly Model) ── */

const ts = () => new Date().toISOString()
const bid = () => crypto.randomUUID()

const _SEED_WIKI_ARTICLES_RAW: Omit<WikiArticle, "sectionIndex">[] = [
  {
    id: "wiki-1",
    title: "Zettelkasten",
    aliases: ["Slip box", "Zettelkasten Method"],
    infobox: [
      { key: "Creator", value: "Niklas Luhmann" },
      { key: "Origin", value: "Zettelkasten (German)" },
      { key: "Meaning", value: "Slip box" },
      { key: "Core Principle", value: "Linking and indexing" },
    ],
    blocks: [
      { id: bid(), type: "section", title: "Overview", level: 2 },
      { id: bid(), type: "text", content: "Zettelkasten is a knowledge management methodology devised by the German sociologist Niklas Luhmann. \"Zettelkasten\" is German for \"slip box.\" Luhmann used this system to produce 70 books and over 400 academic papers across 40 years." },
      { id: bid(), type: "section", title: "Core Principles", level: 2 },
      { id: bid(), type: "section", title: "Atomic Notes", level: 3 },
      { id: bid(), type: "text", content: "Each note contains exactly one idea. This is called a Permanent Note." },
      { id: bid(), type: "section", title: "Linking", level: 3 },
      { id: bid(), type: "text", content: "Every time you write a new note, find and create connections to existing notes. As these links accumulate, unexpected insights emerge." },
      { id: bid(), type: "section", title: "Indexing", level: 3 },
      { id: bid(), type: "text", content: "Create structure notes that serve as entry points. In Plot, this corresponds to wiki pages — like this one." },
      { id: bid(), type: "section", title: "Zettelkasten in Plot", level: 2 },
      { id: bid(), type: "text", content: "Here's how Zettelkasten concepts map to Plot features:\n\n• Slip box → Notes list\n• Permanent note → Permanent-status note\n• Index card → Wiki article\n• Link → [[wikilink]]\n• Structure note → Tags + Folders" },
      { id: bid(), type: "section", title: "See Also", level: 2 },
      { id: bid(), type: "note-ref", noteId: "note-2" },
    ],
    tags: ["tag-2", "tag-1"],
    categoryIds: ["wcat-seed-1", "wcat-seed-2"],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "wiki-2",
    title: "Permanent Note",
    aliases: ["Evergreen Note"],
    infobox: [
      { key: "Origin", value: "Zettelkasten method" },
      { key: "Also known as", value: "Evergreen Note" },
    ],
    blocks: [
      { id: bid(), type: "section", title: "Definition", level: 2 },
      { id: bid(), type: "text", content: "A Permanent Note is the final, refined output in the Zettelkasten system. Unlike fleeting notes (quick jottings) or literature notes (reading highlights), a permanent note is:\n\n1. Written in your own words\n2. Atomic — one idea per note\n3. Context-independent — understandable on its own\n4. Connected — linked to at least one other note" },
      { id: bid(), type: "section", title: "Characteristics", level: 2 },
      { id: bid(), type: "text", content: "Permanent notes are meant to last. They are revisited, refined, and connected over time. The goal is not quantity but quality — each permanent note should represent a distinct, durable insight." },
      { id: bid(), type: "section", title: "In Practice", level: 2 },
      { id: bid(), type: "text", content: "In Plot, changing a note's status to \"Permanent\" signals that it has been refined into an evergreen idea. These notes are the building blocks of wiki articles." },
      { id: bid(), type: "note-ref", noteId: "note-2" },
      { id: bid(), type: "section", title: "See Also", level: 2 },
      { id: bid(), type: "text", content: "Related concepts: Fleeting Note, Literature Note" },
    ],
    tags: ["tag-2"],
    categoryIds: ["wcat-seed-3"],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "wiki-3",
    title: "Fleeting Note",
    aliases: ["Quick Note", "Scratch Note"],
    infobox: [],
    blocks: [
      { id: bid(), type: "section", title: "Definition", level: 2 },
      { id: bid(), type: "text", content: "A Fleeting Note is a quick, temporary note captured in the moment. It's not meant to be permanent — it's raw material to be processed later into a Permanent Note." },
      { id: bid(), type: "section", title: "In Practice", level: 2 },
      { id: bid(), type: "text", content: "Inbox-status notes in Plot serve as fleeting notes. They should be reviewed regularly and either promoted to Capture/Permanent or discarded. The key habit is not to hoard fleeting notes — process them within a day or two." },
      { id: bid(), type: "note-ref", noteId: "note-2" },
      { id: bid(), type: "section", title: "See Also", level: 2 },
      { id: bid(), type: "text", content: "Related concepts: Permanent Note, Literature Note" },
    ],
    tags: ["tag-2"],
    categoryIds: ["wcat-seed-3"],
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
]

// Compute sectionIndex from blocks for each seed article.
// Phase 1: also derive `columnLayout` + `columnAssignments` from legacy `layout` string,
// matching the migration v76 logic so fresh re-seeds produce valid articles.
export const SEED_WIKI_ARTICLES: WikiArticle[] = _SEED_WIKI_ARTICLES_RAW.map((a) => {
  const blockIds = a.blocks.map((b) => b.id)
  const isEncyclopedia = a.layout === "encyclopedia"
  const columnLayout = isEncyclopedia
    ? {
        type: "columns" as const,
        columns: [
          { ratio: 3, content: { type: "blocks" as const, blockIds } },
          { ratio: 1, minWidth: 240, priority: 1, content: { type: "blocks" as const, blockIds: [] } },
        ],
      }
    : {
        type: "columns" as const,
        columns: [{ ratio: 1, content: { type: "blocks" as const, blockIds } }],
      }
  const columnAssignments = Object.fromEntries(blockIds.map((id) => [id, [0]]))
  return {
    ...a,
    sectionIndex: buildSectionIndex(a.blocks),
    columnLayout,
    columnAssignments,
  }
})
