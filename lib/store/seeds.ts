import type { Note, Folder, Tag, Label, NoteTemplate, WikiArticle, WikiBlock, WikiCategory, WikiTemplate, Book } from "../types"
import { workflowDefaults } from "./helpers"
import { buildSectionIndex } from "../wiki-section-index"

export const SEED_FOLDERS: Folder[] = [
  { id: "folder-1", name: "Projects", color: "#5e6ad2", parentId: null, lastAccessedAt: null, pinned: false, pinnedOrder: 0, createdAt: new Date().toISOString(), kind: "note" },
  { id: "folder-2", name: "Daily Log", color: "#45d483", parentId: null, lastAccessedAt: null, pinned: false, pinnedOrder: 0, createdAt: new Date().toISOString(), kind: "note" },
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
  // ── Daily / Periodic ─────────────────────────────────────
  {
    id: "tmpl-daily",
    name: "Daily Log",
    title: "Daily - {date}",
    content: "## Today\n\n### Done\n\n- \n\n### In Progress\n\n- \n\n### Notes\n\n",
    contentJson: null,
    labelId: "label-4",
    tags: [],
    folderId: "folder-2",
    pinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-weekly",
    name: "Weekly Review",
    title: "Weekly - {year}-{month}-{day}",
    content: "## Highlights\n\n- \n\n## Wins\n\n- \n\n## Challenges\n\n- \n\n## Next Week\n\n- [ ] ",
    contentJson: null,
    labelId: "label-4",
    tags: [],
    folderId: "folder-2",
    pinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-monthly",
    name: "Monthly Reflection",
    title: "Monthly - {year}-{month}",
    content: "## Goals\n\n- \n\n## Progress\n\n- \n\n## Lessons Learned\n\n- \n\n## Next Month\n\n- [ ] ",
    contentJson: null,
    labelId: "label-4",
    tags: [],
    folderId: "folder-2",
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ── Meeting ───────────────────────────────────────────────
  {
    id: "tmpl-meeting",
    name: "Meeting Notes",
    title: "Meeting - {date}",
    content: "## Attendees\n\n- \n\n## Agenda\n\n1. \n\n## Decisions\n\n- \n\n## Action Items\n\n- [ ] ",
    contentJson: null,
    labelId: "label-3",
    tags: [],
    folderId: null,
    pinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-1on1",
    name: "1:1 Meeting",
    title: "1:1 - {date}",
    content: "## Updates\n\n- \n\n## Blockers\n\n- \n\n## Feedback\n\n- \n\n## Action Items\n\n- [ ] ",
    contentJson: null,
    labelId: "label-3",
    tags: [],
    folderId: null,
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-standup",
    name: "Standup",
    title: "Standup - {date}",
    content: "## Yesterday\n\n- \n\n## Today\n\n- \n\n## Blockers\n\n- ",
    contentJson: null,
    labelId: "label-3",
    tags: [],
    folderId: null,
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ── Knowledge Work ────────────────────────────────────────
  {
    id: "tmpl-idea",
    name: "Idea",
    title: "",
    content: "## Idea\n\n\n\n## Why?\n\n\n\n## Next Steps\n\n- ",
    contentJson: null,
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
    title: "",
    content: "## Topic\n\n\n\n## Key Findings\n\n\n\n## Sources\n\n- \n\n## Insights\n\n",
    contentJson: null,
    labelId: "label-2",
    tags: [],
    folderId: null,
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-reading",
    name: "Reading Notes",
    title: "",
    content: "## Book / Source\n\n\n\n## Key Quotes\n\n> \n\n## My Thoughts\n\n\n\n## Action Items\n\n- [ ] ",
    contentJson: null,
    labelId: "label-2",
    tags: ["tag-4"],
    folderId: null,
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ── Personal ──────────────────────────────────────────────
  {
    id: "tmpl-diary",
    name: "Diary",
    title: "Diary - {date}",
    content: "## How I Feel Today\n\n\n\n## What Happened\n\n\n\n## Gratitude\n\n- ",
    contentJson: null,
    labelId: "label-4",
    tags: [],
    folderId: null,
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-goal",
    name: "Goal Setting",
    title: "",
    content: "## Goal\n\n\n\n## Why\n\n\n\n## Steps\n\n- [ ] \n\n## Deadline\n\n",
    contentJson: null,
    labelId: "label-5",
    tags: [],
    folderId: null,
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ── Decision / Project ────────────────────────────────────
  {
    id: "tmpl-decision",
    name: "Decision Log",
    title: "Decision - {date}",
    content: "## Context\n\n\n\n## Options\n\n1. \n2. \n\n## Decision\n\n\n\n## Rationale\n\n\n\n## Reversibility\n\n",
    contentJson: null,
    labelId: "label-5",
    tags: [],
    folderId: null,
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-project",
    name: "Project Kickoff",
    title: "",
    content: "## Project Goal\n\n\n\n## Stakeholders\n\n- \n\n## Milestones\n\n- [ ] \n\n## Risks\n\n- ",
    contentJson: null,
    labelId: null,
    tags: [],
    folderId: "folder-1",
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
    folderIds: [],
    tags: ["tag-1"],
    labelId: null,
    status: "keystone",
    priority: "high",
    reads: 5,
    pinned: true,
    trashed: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    ...workflowDefaults("keystone"),
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
    folderIds: [],
    tags: ["tag-4", "tag-1"],
    labelId: "label-2",
    status: "brick",
    priority: "medium",
    reads: 3,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    ...workflowDefaults("brick"),
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
    folderIds: ["folder-1"],
    tags: ["tag-1", "tag-3"],
    labelId: null,
    status: "keystone",
    priority: "medium",
    reads: 8,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    ...workflowDefaults("keystone"),
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
    folderIds: [],
    tags: ["tag-1"],
    labelId: "label-1",
    status: "stone",
    priority: "none",
    reads: 1,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    ...workflowDefaults("stone"),
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
    folderIds: ["folder-2"],
    tags: ["tag-3"],
    labelId: "label-4",
    status: "stone",
    priority: "none",
    reads: 0,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    ...workflowDefaults("stone"),
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
    folderIds: [],
    tags: [],
    labelId: "label-5",
    status: "stone",
    priority: "low",
    reads: 0,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 900000).toISOString(),
    updatedAt: new Date(Date.now() - 900000).toISOString(),
    ...workflowDefaults("stone"),
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
    folderIds: [],
    tags: ["tag-2"],
    labelId: "label-2",
    status: "keystone",
    priority: "none",
    reads: 2,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    ...workflowDefaults("keystone"),
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
    folderIds: [],
    tags: ["tag-2", "tag-1"],
    labelId: "label-1",
    status: "brick",
    priority: "none",
    reads: 1,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    ...workflowDefaults("brick"),
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
    folderIds: [],
    tags: ["tag-2"],
    labelId: null,
    status: "stone",
    priority: "none",
    reads: 0,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    ...workflowDefaults("stone"),
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
    color: "#a78bfa",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "wcat-seed-2",
    name: "Zettelkasten",
    parentIds: ["wcat-seed-1"],
    description: "The Zettelkasten slip-box methodology",
    color: "#60a5fa",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "wcat-seed-3",
    name: "Note Types",
    parentIds: ["wcat-seed-1", "wcat-seed-2"],
    description: "Different types of notes in knowledge systems",
    color: "#34d399",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "wcat-seed-4",
    name: "Computer Science",
    parentIds: [],
    description: "Fundamentals of computing and programming",
    color: "#fbbf24",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "wcat-seed-5",
    name: "Algorithms",
    parentIds: ["wcat-seed-4"],
    description: "Algorithm design and analysis",
    color: "#fb7185",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "wcat-seed-6",
    name: "Data Structures",
    parentIds: ["wcat-seed-4"],
    description: "Organizing and storing data efficiently",
    color: "#f472b6",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "wcat-seed-7",
    name: "Philosophy",
    parentIds: [],
    description: "Fundamental questions about existence, knowledge, and ethics",
    color: "#22d3ee",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "wcat-seed-8",
    name: "Epistemology",
    parentIds: ["wcat-seed-7"],
    description: "Theory of knowledge — what we can know and how",
    color: "#fb923c",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "wcat-seed-9",
    name: "Productivity",
    parentIds: [],
    description: "Methods and tools for personal effectiveness",
    color: "#84cc16",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "wcat-seed-10",
    name: "Note-taking",
    parentIds: ["wcat-seed-9", "wcat-seed-1"],
    description: "Strategies and tools for effective note-taking",
    color: "#c084fc",
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
    folderIds: [],
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
    folderIds: [],
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
    folderIds: [],
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: "wiki-4",
    title: "Linked Notes",
    aliases: ["Backlinking", "Note Linking"],
    infobox: [
      { key: "Concept", value: "Bidirectional links between atomic notes" },
      { key: "Origin", value: "Roam Research, Obsidian" },
    ],
    blocks: [
      { id: bid(), type: "section", title: "Overview", level: 2 },
      { id: bid(), type: "text", content: "Linked notes form a knowledge graph by connecting atomic ideas through explicit references. Each link is bidirectional — the target note 'knows' it's being referenced." },
      { id: bid(), type: "section", title: "Tools", level: 2 },
      { id: bid(), type: "text", content: "Roam Research popularized bidirectional links. Obsidian followed. Plot uses [[wikilink]] syntax for both note→note and note→wiki references." },
      { id: bid(), type: "section", title: "Best Practices", level: 2 },
      { id: bid(), type: "text", content: "Link generously while writing. Review backlinks periodically — clusters of connected notes signal emergent themes worth promoting to permanent status." },
      { id: bid(), type: "section", title: "See Also", level: 2 },
      { id: bid(), type: "note-ref", noteId: "note-2" },
    ],
    tags: ["tag-2"],
    categoryIds: ["wcat-seed-2"],
    folderIds: [],
    pinned: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "wiki-5",
    title: "Atomic Notes",
    aliases: ["Single-idea notes"],
    infobox: [
      { key: "Principle", value: "One idea per note" },
      { key: "Origin", value: "Zettelkasten" },
    ],
    blocks: [
      { id: bid(), type: "section", title: "Definition", level: 2 },
      { id: bid(), type: "text", content: "An atomic note contains exactly one self-contained idea. Atomicity enables flexible recombination — notes can be referenced from many contexts without bringing extraneous content along." },
      { id: bid(), type: "section", title: "How to Atomize", level: 2 },
      { id: bid(), type: "text", content: "When a note grows long, look for distinct sub-ideas. Each can become its own note, linked back to the original via [[wikilinks]]." },
      { id: bid(), type: "section", title: "Plot's Approach", level: 2 },
      { id: bid(), type: "text", content: "Plot encourages atomicity through Block-level granularity and easy wikilink creation. The Stone → Brick → Block status progression refines ideas toward atomic clarity." },
    ],
    tags: ["tag-2"],
    categoryIds: ["wcat-seed-3", "wcat-seed-10"],
    folderIds: [],
    pinned: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "wiki-6",
    title: "Working Memory",
    aliases: ["Short-term memory"],
    infobox: [],
    // Default-template stub: 3 section + 1 empty text = 4 blocks, all text empty.
    // Surfaces in wiki-list with IconWikiStub badge.
    blocks: [
      { id: bid(), type: "section", title: "Overview", level: 2 },
      { id: bid(), type: "section", title: "Capacity", level: 2 },
      { id: bid(), type: "section", title: "See Also", level: 2 },
      { id: bid(), type: "text", content: "" },
    ],
    tags: [],
    categoryIds: ["wcat-seed-7"],
    folderIds: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "wiki-7",
    title: "Sönke Ahrens",
    aliases: ["Ahrens"],
    infobox: [
      { key: "Born", value: "1972" },
      { key: "Known for", value: "How to Take Smart Notes" },
      { key: "Field", value: "Education, learning theory" },
    ],
    blocks: [
      { id: bid(), type: "section", title: "Biography", level: 2 },
      { id: bid(), type: "text", content: "Sönke Ahrens is a German educator and author best known for popularizing the Zettelkasten method in the English-speaking world through his 2017 book \"How to Take Smart Notes.\"" },
      { id: bid(), type: "section", title: "Influence", level: 2 },
      { id: bid(), type: "text", content: "Ahrens distilled Niklas Luhmann's method into actionable practices for students, writers, and researchers. The book has become standard reading in productivity and knowledge-management circles." },
      { id: bid(), type: "section", title: "See Also", level: 2 },
      { id: bid(), type: "note-ref", noteId: "note-2" },
    ],
    tags: ["tag-2"],
    categoryIds: ["wcat-seed-1"],
    folderIds: [],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  // ── Wiki tier-balance seeding (2026-05-15) ──
  // Adds 10 articles spread across Computer Science / Productivity /
  // Philosophy categories with parentArticleId chains so the board's
  // tier grouping (1st / 2nd / 3rd+) reads as balanced columns instead
  // of every article landing in 1st tier.
  {
    id: "wiki-8",
    title: "Computer Science",
    aliases: ["CS"],
    infobox: [{ key: "Field", value: "Study of computation" }],
    blocks: [
      { id: bid(), type: "section", title: "Overview", level: 2 },
      { id: bid(), type: "text", content: "Computer Science is the study of computation, information, and automation. It spans theoretical foundations (algorithms, data structures, complexity) and practical engineering (software systems, programming languages, hardware)." },
      { id: bid(), type: "section", title: "Branches", level: 2 },
      { id: bid(), type: "text", content: "Algorithms · Data Structures · Programming Languages · Systems · Theory of Computation · Artificial Intelligence." },
    ],
    tags: ["tag-5", "tag-1"],
    categoryIds: ["wcat-seed-4"],
    folderIds: [],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "wiki-9",
    title: "Algorithms",
    aliases: ["Algorithm Design"],
    infobox: [{ key: "Parent field", value: "Computer Science" }],
    blocks: [
      { id: bid(), type: "section", title: "Overview", level: 2 },
      { id: bid(), type: "text", content: "An algorithm is a finite sequence of well-defined instructions used to solve a problem or perform a computation. Algorithm design is a core area of computer science." },
      { id: bid(), type: "section", title: "Common Paradigms", level: 2 },
      { id: bid(), type: "text", content: "Divide and conquer · Greedy · Dynamic programming · Backtracking · Randomized." },
    ],
    tags: ["tag-5"],
    categoryIds: ["wcat-seed-5"],
    parentArticleId: "wiki-8",
    folderIds: [],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "wiki-10",
    title: "Quicksort",
    aliases: ["Hoare's sort"],
    infobox: [
      { key: "Inventor", value: "Tony Hoare (1959)" },
      { key: "Avg complexity", value: "O(n log n)" },
    ],
    blocks: [
      { id: bid(), type: "section", title: "Overview", level: 2 },
      { id: bid(), type: "text", content: "Quicksort is a divide-and-conquer sorting algorithm. It picks a pivot, partitions the array around it, and recursively sorts the partitions." },
      { id: bid(), type: "section", title: "Complexity", level: 2 },
      { id: bid(), type: "text", content: "Average O(n log n), worst-case O(n²) with poor pivot choices. In-place with O(log n) stack depth." },
    ],
    tags: ["tag-5"],
    categoryIds: ["wcat-seed-5"],
    parentArticleId: "wiki-9",
    folderIds: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "wiki-11",
    title: "Binary Search",
    aliases: [],
    infobox: [{ key: "Complexity", value: "O(log n)" }],
    blocks: [
      { id: bid(), type: "section", title: "Overview", level: 2 },
      { id: bid(), type: "text", content: "Binary search finds the position of a target value within a sorted array by repeatedly halving the search interval." },
    ],
    tags: ["tag-5"],
    categoryIds: ["wcat-seed-5"],
    parentArticleId: "wiki-9",
    folderIds: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "wiki-12",
    title: "Data Structures",
    aliases: [],
    infobox: [{ key: "Parent field", value: "Computer Science" }],
    blocks: [
      { id: bid(), type: "section", title: "Overview", level: 2 },
      { id: bid(), type: "text", content: "A data structure is a way of organizing and storing data so that it can be accessed and modified efficiently. Choice of structure determines the time and space complexity of operations." },
      { id: bid(), type: "section", title: "Categories", level: 2 },
      { id: bid(), type: "text", content: "Linear (array, linked list) · Tree (binary tree, B-tree, trie) · Hash (hash table) · Graph." },
    ],
    tags: ["tag-5", "tag-1"],
    categoryIds: ["wcat-seed-6"],
    parentArticleId: "wiki-8",
    folderIds: [],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "wiki-13",
    title: "Hash Table",
    aliases: ["Hash Map", "Dictionary"],
    infobox: [{ key: "Avg lookup", value: "O(1)" }],
    blocks: [
      { id: bid(), type: "section", title: "Overview", level: 2 },
      { id: bid(), type: "text", content: "A hash table maps keys to values via a hash function that computes an index into an array of buckets. Average-case lookup, insert, and delete are O(1)." },
    ],
    tags: ["tag-5"],
    categoryIds: ["wcat-seed-6"],
    parentArticleId: "wiki-12",
    folderIds: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: "wiki-14",
    title: "Productivity Methods",
    aliases: ["Productivity Systems"],
    infobox: [{ key: "Field", value: "Personal effectiveness" }],
    blocks: [
      { id: bid(), type: "section", title: "Overview", level: 2 },
      { id: bid(), type: "text", content: "Productivity methods are systematic approaches to managing time, attention, and work. They aim to reduce friction and align daily action with long-term goals." },
    ],
    tags: ["tag-3"],
    categoryIds: ["wcat-seed-9"],
    folderIds: [],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "wiki-15",
    title: "Getting Things Done",
    aliases: ["GTD"],
    infobox: [
      { key: "Creator", value: "David Allen" },
      { key: "Book", value: "Getting Things Done (2001)" },
    ],
    blocks: [
      { id: bid(), type: "section", title: "Overview", level: 2 },
      { id: bid(), type: "text", content: "Getting Things Done (GTD) is a productivity methodology that emphasizes capturing every commitment in a trusted external system, then processing those items into actionable next steps." },
      { id: bid(), type: "section", title: "Five Steps", level: 2 },
      { id: bid(), type: "text", content: "1. Capture — 2. Clarify — 3. Organize — 4. Reflect — 5. Engage." },
    ],
    tags: ["tag-3", "tag-4"],
    categoryIds: ["wcat-seed-9"],
    parentArticleId: "wiki-14",
    folderIds: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "wiki-16",
    title: "Pomodoro Technique",
    aliases: ["Pomodoro"],
    infobox: [
      { key: "Creator", value: "Francesco Cirillo (1980s)" },
      { key: "Interval", value: "25 min work + 5 min break" },
    ],
    blocks: [
      { id: bid(), type: "section", title: "Overview", level: 2 },
      { id: bid(), type: "text", content: "The Pomodoro Technique breaks work into focused 25-minute intervals separated by short breaks. After four intervals, a longer break is taken." },
    ],
    tags: ["tag-3"],
    categoryIds: ["wcat-seed-9"],
    parentArticleId: "wiki-14",
    folderIds: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: "wiki-17",
    title: "Theory of Knowledge",
    aliases: ["Epistemology"],
    infobox: [{ key: "Field", value: "Philosophy" }],
    blocks: [
      { id: bid(), type: "section", title: "Overview", level: 2 },
      { id: bid(), type: "text", content: "Epistemology is the branch of philosophy concerned with the nature, sources, and limits of knowledge. Central questions: what counts as knowledge, how do we justify beliefs, what is truth." },
      { id: bid(), type: "section", title: "Major Positions", level: 2 },
      { id: bid(), type: "text", content: "Rationalism · Empiricism · Pragmatism · Coherentism · Foundationalism." },
    ],
    tags: ["tag-1", "tag-2"],
    categoryIds: ["wcat-seed-8"],
    folderIds: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

// Compute sectionIndex from blocks for each seed article
export const SEED_WIKI_ARTICLES: WikiArticle[] = _SEED_WIKI_ARTICLES_RAW.map((a) => ({
  ...a,
  sectionIndex: buildSectionIndex(a.blocks),
}))

/* ── SEED_BOOKS (books-view-engine demo set) ──────────────────
   8 books covering all kind/visual states for manual verification:
   - kind: 3 Manual / 2 Smart / 2 Hybrid / 1 Trashed
   - emoji vs no-emoji: 4 with cover emoji, 4 fallback to BookKindIcon
   - pinned: 2 pinned (one Manual, one Hybrid)
   - smartSources span all 5 kinds across the set (folder/tag/label only —
     category/sticker reserved for future seeds; sourceType filter still
     surfaces "_none" branch correctly).
   Fractional-indexing keys use simple "a0","a1",... — lexicographically
   correct, no generateKeyBetween call needed at seed time. */
const now = Date.now()
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString()
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString()

export const SEED_BOOKS: Book[] = [
  // 1. Manual + Pinned + Emoji — featured curated guide
  {
    id: "book-1",
    title: "Getting Started Guide",
    description: "Hand-curated intro notes for new readers.",
    color: null,
    items: [
      { kind: "note", id: "bi-1-1", refId: "note-1", order: "a0" },
      { kind: "note", id: "bi-1-2", refId: "note-2", order: "a1" },
    ],
    pinned: true,
    smartSources: [],
    excludeIds: [],
    createdAt: daysAgo(14),
    updatedAt: hoursAgo(2),
  },

  // 2. Manual + Emoji — themed compilation
  {
    id: "book-2",
    title: "Reading Journal",
    description: "Books I finished this season.",
    color: null,
    items: [
      { kind: "note", id: "bi-2-1", refId: "note-2", order: "a0" },
      { kind: "chapter-heading", id: "bi-2-h", title: "Q2 Reflections", order: "a1" },
      { kind: "note", id: "bi-2-2", refId: "note-7", order: "a2" },
    ],
    smartSources: [],
    excludeIds: [],
    createdAt: daysAgo(10),
    updatedAt: hoursAgo(8),
  },

  // 3. Smart (no emoji → ⚡ Lightning icon) — single tag source
  {
    id: "book-3",
    title: "Zettelkasten Hub",
    description: "Auto-pulled by Zettelkasten tag.",
    color: null,
    items: [],
    smartSources: [{ kind: "tag", refId: "tag-2" }],
    excludeIds: [],
    createdAt: daysAgo(7),
    updatedAt: hoursAgo(24),
  },

  // 4. Smart (no emoji) — folder source
  {
    id: "book-4",
    title: "Project Tracker",
    description: "Everything in the Projects folder.",
    color: null,
    items: [],
    smartSources: [{ kind: "folder", refId: "folder-1" }],
    excludeIds: [],
    createdAt: daysAgo(5),
    updatedAt: hoursAgo(48),
  },

  // 5. Smart + Emoji — multi-source aggregation
  {
    id: "book-5",
    title: "Research Library",
    description: "Spans multiple research topics.",
    color: null,
    items: [],
    smartSources: [
      { kind: "tag", refId: "tag-3" },
      { kind: "tag", refId: "tag-4" },
      { kind: "label", refId: "label-2" },
    ],
    excludeIds: [],
    createdAt: daysAgo(4),
    updatedAt: hoursAgo(36),
  },

  // 6. Hybrid (no emoji → ✨ Sparkle icon) — manual + auto
  {
    id: "book-6",
    title: "Knowledge Compilation",
    description: "Hand-picked notes blended with tag-based auto-fill.",
    color: null,
    items: [
      { kind: "chapter-heading", id: "bi-6-h1", title: "Foundations", order: "a0" },
      { kind: "note", id: "bi-6-1", refId: "note-1", order: "a1" },
      { kind: "note", id: "bi-6-2", refId: "note-3", order: "a2" },
      { kind: "chapter-heading", id: "bi-6-h2", title: "Recent Captures", order: "a3" },
    ],
    smartSources: [{ kind: "tag", refId: "tag-1" }],
    excludeIds: [],
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(12),
  },

  // 7. Hybrid + Pinned + Emoji — daily-driver mix
  {
    id: "book-7",
    title: "Daily + Inspiration",
    description: "Daily log entries plus auto-pulled ideas.",
    color: null,
    items: [
      { kind: "note", id: "bi-7-1", refId: "note-4", order: "a0" },
      { kind: "note", id: "bi-7-2", refId: "note-5", order: "a1" },
    ],
    pinned: true,
    smartSources: [
      { kind: "folder", refId: "folder-2" },
      { kind: "label", refId: "label-1" },
    ],
    excludeIds: [],
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(4),
  },

  // 8. Trashed — surfaces the trash chip in ViewHeader + restore flow
  {
    id: "book-8",
    title: "Old Project Notes",
    description: "Archived after Q1 wrap-up.",
    color: null,
    items: [
      { kind: "note", id: "bi-8-1", refId: "note-9", order: "a0" },
    ],
    smartSources: [],
    excludeIds: [],
    trashed: true,
    trashedAt: daysAgo(1),
    createdAt: daysAgo(20),
    updatedAt: daysAgo(1),
  },
]

/* ── Wiki Templates (NoteTemplate 정합 + Wiki 본질 확장) ──────────
 * 8개 seed: Empty (default) + Wikipedia 정합 5개 (Concept / Person /
 * Place / Reference / Book Note) + Plot 본질 3개 (Tutorial / Project
 * Log). 사용자가 자유 추가/삭제 가능 (seed는 idempotent push만).
 *
 * blocks의 id는 hard-coded지만 createWikiArticleFromTemplate /
 * getWikiTemplateBlocksExpanded가 cloneAndExpandBlocks로 새 genId()
 * 부여 → article level 충돌 회피.
 *
 * infobox value는 placeholder 없이 빈 string으로 시작 (사용자가
 * 직접 채움 — Wikipedia 정합).
 */
const wikiTplNow = new Date().toISOString()
export const SEED_WIKI_TEMPLATES: WikiTemplate[] = [
  {
    id: "wtmpl-empty",
    name: "Empty",
    description: "백지에서 시작. 어떤 구조도 미리 잡지 않음.",
    title: "Untitled",
    aliases: [],
    blocks: [],
    infobox: [],
    infoboxPreset: "custom",
    pinned: true,
    createdAt: wikiTplNow,
    updatedAt: wikiTplNow,
  },
  {
    id: "wtmpl-concept",
    name: "Concept",
    description: "추상 개념/이론/원리 정리 (예: Zettelkasten, Single Responsibility).",
    title: "Concept",
    aliases: [],
    blocks: [
      { id: "wt-concept-1", type: "section", title: "Definition", level: 2 },
      { id: "wt-concept-2", type: "text", content: "" },
      { id: "wt-concept-3", type: "section", title: "Origin", level: 2 },
      { id: "wt-concept-4", type: "text", content: "" },
      { id: "wt-concept-5", type: "section", title: "Examples", level: 2 },
      { id: "wt-concept-6", type: "text", content: "" },
      { id: "wt-concept-7", type: "section", title: "Misconceptions", level: 2 },
      { id: "wt-concept-8", type: "text", content: "" },
      { id: "wt-concept-9", type: "section", title: "See Also", level: 2 },
    ],
    infobox: [
      { key: "Field", value: "" },
      { key: "First Coined", value: "" },
      { key: "Related Terms", value: "" },
    ],
    infoboxPreset: "concept",
    pinned: false,
    createdAt: wikiTplNow,
    updatedAt: wikiTplNow,
  },
  {
    id: "wtmpl-person",
    name: "Person",
    description: "인물 wiki (예: Albert Einstein, Steve Jobs).",
    title: "Person Name",
    aliases: [],
    blocks: [
      { id: "wt-person-1", type: "section", title: "Early Life", level: 2 },
      { id: "wt-person-2", type: "text", content: "" },
      { id: "wt-person-3", type: "section", title: "Career", level: 2 },
      { id: "wt-person-4", type: "text", content: "" },
      { id: "wt-person-5", type: "section", title: "Major Works", level: 2 },
      { id: "wt-person-6", type: "text", content: "" },
      { id: "wt-person-7", type: "section", title: "Legacy", level: 2 },
      { id: "wt-person-8", type: "text", content: "" },
      { id: "wt-person-9", type: "section", title: "Quotes", level: 2 },
    ],
    infobox: [
      { key: "Born", value: "" },
      { key: "Died", value: "" },
      { key: "Occupation", value: "" },
      { key: "Nationality", value: "" },
    ],
    infoboxPreset: "person",
    pinned: false,
    createdAt: wikiTplNow,
    updatedAt: wikiTplNow,
  },
  {
    id: "wtmpl-place",
    name: "Place",
    description: "장소 wiki (예: Seoul, Mount Fuji).",
    title: "Place Name",
    aliases: [],
    blocks: [
      { id: "wt-place-1", type: "section", title: "Geography", level: 2 },
      { id: "wt-place-2", type: "text", content: "" },
      { id: "wt-place-3", type: "section", title: "History", level: 2 },
      { id: "wt-place-4", type: "text", content: "" },
      { id: "wt-place-5", type: "section", title: "Demographics", level: 2 },
      { id: "wt-place-6", type: "text", content: "" },
      { id: "wt-place-7", type: "section", title: "Culture", level: 2 },
    ],
    infobox: [
      { key: "Location", value: "" },
      { key: "Country", value: "" },
      { key: "Population", value: "" },
      { key: "Coordinates", value: "" },
    ],
    infoboxPreset: "place",
    pinned: false,
    createdAt: wikiTplNow,
    updatedAt: wikiTplNow,
  },
  {
    id: "wtmpl-reference",
    name: "Reference",
    description: "학술 논문/책 정리 (예: Attention Is All You Need).",
    title: "Reference Title",
    aliases: [],
    blocks: [
      { id: "wt-ref-1", type: "section", title: "Abstract", level: 2 },
      { id: "wt-ref-2", type: "text", content: "" },
      { id: "wt-ref-3", type: "section", title: "Key Points", level: 2 },
      { id: "wt-ref-4", type: "text", content: "" },
      { id: "wt-ref-5", type: "section", title: "Related Works", level: 2 },
      { id: "wt-ref-6", type: "text", content: "" },
      { id: "wt-ref-7", type: "section", title: "Citation", level: 2 },
    ],
    infobox: [
      { key: "Author", value: "" },
      { key: "Year", value: "" },
      { key: "Source", value: "" },
      { key: "DOI", value: "" },
    ],
    infoboxPreset: "work-book",
    pinned: false,
    createdAt: wikiTplNow,
    updatedAt: wikiTplNow,
  },
  {
    id: "wtmpl-tutorial",
    name: "Tutorial",
    description: "절차/How-to (예: Setting up Next.js).",
    title: "Tutorial",
    aliases: [],
    blocks: [
      { id: "wt-tut-1", type: "section", title: "Prerequisites", level: 2 },
      { id: "wt-tut-2", type: "text", content: "" },
      { id: "wt-tut-3", type: "section", title: "Steps", level: 2 },
      { id: "wt-tut-4", type: "text", content: "" },
      { id: "wt-tut-5", type: "section", title: "Common Pitfalls", level: 2 },
      { id: "wt-tut-6", type: "text", content: "" },
      { id: "wt-tut-7", type: "section", title: "Further Reading", level: 2 },
    ],
    infobox: [],
    infoboxPreset: "custom",
    pinned: false,
    createdAt: wikiTplNow,
    updatedAt: wikiTplNow,
  },
  {
    id: "wtmpl-project-log",
    name: "Project Log",
    description: "진행 중 프로젝트 추적 (예: Plot v3 Refresh).",
    title: "Project Name",
    aliases: [],
    blocks: [
      { id: "wt-proj-1", type: "section", title: "Background", level: 2 },
      { id: "wt-proj-2", type: "text", content: "" },
      { id: "wt-proj-3", type: "section", title: "Current State", level: 2 },
      { id: "wt-proj-4", type: "text", content: "" },
      { id: "wt-proj-5", type: "section", title: "Next Steps", level: 2 },
      { id: "wt-proj-6", type: "text", content: "" },
      { id: "wt-proj-7", type: "section", title: "Decisions Log", level: 2 },
    ],
    infobox: [
      { key: "Status", value: "" },
      { key: "Started", value: "" },
      { key: "Team", value: "" },
      { key: "Goals", value: "" },
    ],
    infoboxPreset: "custom",
    pinned: false,
    createdAt: wikiTplNow,
    updatedAt: wikiTplNow,
  },
  {
    id: "wtmpl-book-note",
    name: "Book Note",
    description: "읽은 책 정리 (예: Atomic Habits, 이기적 유전자).",
    title: "Book Title",
    aliases: [],
    blocks: [
      { id: "wt-book-1", type: "section", title: "Summary", level: 2 },
      { id: "wt-book-2", type: "text", content: "" },
      { id: "wt-book-3", type: "section", title: "Key Themes", level: 2 },
      { id: "wt-book-4", type: "text", content: "" },
      { id: "wt-book-5", type: "section", title: "Personal Notes", level: 2 },
      { id: "wt-book-6", type: "text", content: "" },
      { id: "wt-book-7", type: "section", title: "Quotes", level: 2 },
    ],
    infobox: [
      { key: "Author", value: "" },
      { key: "Year", value: "" },
      { key: "Genre", value: "" },
      { key: "Rating", value: "" },
    ],
    infoboxPreset: "work-book",
    pinned: false,
    createdAt: wikiTplNow,
    updatedAt: wikiTplNow,
  },
]
