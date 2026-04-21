# Book — Layout Reference Research

Research compiled for Plot's "Book" (formerly Wiki) feature — the surface where a user composes a long-form publication and picks the *kind* of publication it is (encyclopedia, magazine, newspaper, novel, flipbook, blank canvas).

The reference set below is a distilled checklist — what each medium's readers expect structurally, not a visual copy. Plot generates *its own* layouts that satisfy these expectations.

---

## 1. Encyclopedia / Wiki (Wikipedia, 나무위키)

**Reader expectations**
- A single-column main reading stream at ~680–760px optical width, left-aligned.
- An **infobox** anchored top-right (float-right on wide screens, stacks on top on mobile): portrait, quick-facts table, small caption.
- A **table of contents** block that appears *before* the first H2, numbered (1, 1.1, 1.2, 2…), collapsible.
- **Hatnotes** ("이 문서는 …에 관한 것입니다") as italicized, indented preface below the title.
- Footnotes as numbered superscript links → numbered list at the bottom.
- Section headings with a thin bottom rule. No decorative type — utilitarian serif/sans.
- **Running chrome is nearly absent.** No hero banner, no cover. The title is the banner.
- Wikipedia's default skin (Vector 2022) uses max content width 960px with generous 60px gutters; 나무위키 is denser (max ~1000px, tighter leading).

**What Plot's `wiki` shell must ship**
- Title block (H1, 28–32px, -0.02em, tight) + optional italic hatnote underneath.
- Right-rail Infobox slot (auto-stacks under title on narrow).
- Numbered-ToC block that auto-extracts from H2/H3.
- Section-heading style with 1px `--border-subtle` bottom rule.
- Footnote block with auto-numbering.
- Max text column 720px (matches Plot's `--editor-max-width`).

---

## 2. Magazine (Monocle, Kinfolk, The Gentlewoman, Cereal)

**Reader expectations**
- A **masthead** at the very top: wordmark + issue number + date, set in a display serif or condensed sans. Distinct typographic voice from the body.
- A **nameplate strip** below the masthead: section name (e.g. "Affairs", "Culture"), rule above and below, lowercase small-caps or italic.
- **Headline** in display type (48–96px), often serif, often sized to fill the gutter.
- A **deck** (subhead, 18–22px, italic or light weight) under the headline.
- A **byline** ("Words — Peter Kwon · Photography — …") set small-caps, ~11px, with em-dash separators.
- A **drop cap** on the opening paragraph (3-line, same serif as headline).
- Asymmetric multi-column grids: 12-col underlying grid but typical column layouts are 3-5-4 or 2-4-6 split.
- Large full-bleed photography or full-spread graphics.
- **Pull quotes** in oversized italic display type, rules above and below, breaking out of the text column.
- Page numbers + running header ("Monocle — Issue 168 — September 2024") in the top margin.

**What Plot's `magazine` shell must ship**
- Masthead component (brand name + issue metadata).
- Nameplate component (section name with double rule).
- Headline / deck / byline as a locked trio of typographic slots.
- Drop cap automatic on first block when enabled.
- Pull-quote block.
- Photo-block with full-bleed + caption (italic, right-aligned).
- Running header slot (repeats on every "page" in flipbook mode).
- 12-col flexible grid with asymmetric presets (3-9, 4-8, 5-7, 2-5-5, 3-6-3, 4-4-4).

---

## 3. Newspaper (NYT, FT, Le Monde, Chosun Ilbo)

**Reader expectations**
- A **nameplate/flag** at the top: huge blackletter or serif wordmark (NYT's gothic), date + edition line underneath in a thin rule-enclosed strip.
- Strict **6-column** rigid grid at broadsheet width. Text columns are narrow (~32-40 chars per line — shorter than magazine or wiki).
- Headlines in **condensed serif display**, multiple sizes stacked (lead, 2-col head, 1-col head) — the *size* of the headline signals the importance of the story.
- **Decks** (1-3 layers of subhead) in decreasing weight.
- Bylines in small-caps, italic city name ("SEOUL —").
- **Rules** between columns. Thin gray vertical rules, not gaps.
- Text **wraps** around photos; photos have line-drawn borders and sparse italic captions.
- **Jump lines** ("Continued on Page A12") at the end of columns.
- Dense, information-rich, minimal whitespace.

**What Plot's `newspaper` shell must ship**
- Flag component (big serif wordmark + date strip + edition).
- 6-col grid locked (can merge into 2, 3, 4 col spans).
- Text-column style with vertical column rules.
- Headline-tier system: Lead (96px), Story (48px), Sub-story (28px), Brief (19px) — size IS the hierarchy.
- Italic byline with all-caps city prefix.
- Photo with thin ruled border and italic caption.
- Short measure (narrow columns) — this is *the* newspaper feel.

---

## 4. Novel / Book (Penguin Classics, Folio Society, Everyman's Library)

**Reader expectations**
- **Front cover** page — title, subtitle, author, publisher mark. Often a single photograph or illustration.
- **Half-title** and **title page** (two separate pages).
- **Back cover** with short jacket-copy + barcode region (we skip the barcode).
- **Frontispiece** (optional image before title page).
- **Running header**: chapter title on verso (left), book title on recto (right). Italic, small, all-caps letter-spacing.
- **Page numbers** centered at the foot OR outer corner at foot.
- **Chapter-opener** pages: chapter number in roman numerals or set in display, title below, **drop cap** on first word, first line in small-caps for 3-4 words.
- Body text: serif (Garamond, Caslon, Bembo, Minion) at 11-12pt equivalent, 1.55 leading, justified with hyphenation, first-line indent (no paragraph space). Measure ~62 chars / 25em.
- **Bookmark ribbon** — a thin fabric ribbon anchored at the top of the spine, draping over the page edge.
- **Endpapers** — patterned/colored front + back inner covers.
- **Ornamental breaks** (❖, ❦, three centered asterisks) between scenes.
- **Colophon** at the very end (typeface, paper, printer).

**What Plot's `book` shell must ship**
- Cover block (image/color + title/subtitle/author/publisher lockup, template choices).
- Back-cover block (copy + short author bio + publisher).
- Chapter-opener block (roman numeral, title, drop cap, small-caps opener).
- Running-header slot (verso/recto aware).
- Ornamental break block (gallery of glyphs).
- Ribbon + endpaper decorative layer (CSS, not DOM content).
- Body text with justified + hyphenation + first-line indent toggle.
- Colophon block.

---

## 5. Flipbook (fliphtml5 style)

**Reader expectations**
- Display spreads two pages at a time (verso + recto). On mobile, one page.
- Visible **page edge** (slight shadow or paper-texture edge suggesting real pages).
- **Page-turn animation** — page lifts, curls, and folds from the right edge. Takes 350-500ms.
- **Bookmark ribbon** or corner-peel indicator for quick navigation.
- **Thumbnail strip** along the bottom for scrubbing.
- **Current page indicator** ("7 / 128") and a search field, usually bottom-right.
- **Zoom control** — pinch or +/- buttons, because print-sized pages don't fit.
- Back-button / fullscreen / download / share buttons as a floating toolbar.
- Autoplay mode (slideshow).
- Works inside any parent shell — a Plot magazine/newspaper/book can *render* in flipbook mode.

**What Plot's `flipbook` shell must ship**
- Viewer is not a shell itself — it's a **render mode** that wraps any shell.
- Two-page-spread layout with page-turn transform (CSS `transform: rotateY()` with `perspective` on parent).
- Thumbnail strip + zoom + page counter floating toolbar.
- Respects the inner shell's page-break hints.

---

## 6. Blank / Custom

- No chrome. 12-col grid, body fonts, nothing else. For users who want to compose from scratch.

---

## Cross-cutting features (from the user's note — must be editable per Book)

| Feature | Where it lives | Default per shell |
|---|---|---|
| **Background color** | Page-level CSS variable `--book-bg` | Wiki: `--background` / Magazine: warm cream `#faf7f0` / Newspaper: newsprint `#f4efe6` / Book: cream `#f5efe2` / Blank: `--background` |
| **Background texture** | Overlay SVG or CSS `background-image` | Newspaper: faint dot-grid / Book: paper grain (subtle noise) / others: none |
| **Decorations** | Absolutely-positioned layer above grid | Magazine: corner ornament / Book: ribbon + endpaper / Newspaper: fold crease |
| **Card borders** | `--card-border-style` token | Wiki: 1px subtle / Magazine: none / Newspaper: 1px hairline / Book: none |
| **Banner / title / cards position** | User-drag within grid cells | See shell presets |
| **Bookmark ribbon** | Decorative layer, toggleable | Book only by default |
| **Ribbon color** | Token `--ribbon-color` | Crimson `#9b1c1c` default; user can change |

---

## References (for grounding — not for pixel-copy)

- Wikipedia Vector 2022 skin (max content width, infobox behavior, ToC rules)
- 나무위키 스킨 (tighter density + inline category tags)
- Monocle "Affairs" / "Culture" sections (nameplate + masthead grammar, drop cap, pull quote)
- Kinfolk / Cereal (quieter monocle — same grammar, less color)
- NYT 1-column → 6-column responsive (flag, strict grid, size-as-hierarchy, italic city prefix)
- FT (salmon newsprint background — our `magazine` cream is a cousin)
- Penguin Classics Deluxe (cover-dominant + inside Garamond body, no ornaments)
- Folio Society (ornamental breaks, endpapers, ribbons — our full decorative set)
- fliphtml5 / Issuu / Heyzine (page-turn animation, thumbnail scrubber, zoom)
- Readymag / Framer Sites (snap-to-grid "freeform" editing — our editing model)

---

## Out of scope (intentionally)

- Fully absolute-positioned drag like Figma / Photoshop. We use a 12-col snap grid inside each shell — this is the difference between "user-friendly" and "designer tool".
- Real CMYK print color spec / crop marks / bleed. Plot is digital-first; `book` shell simulates the feel, not the production.
- Handwritten / hand-drawn decorations. All decoration is a token choice from a curated palette.
