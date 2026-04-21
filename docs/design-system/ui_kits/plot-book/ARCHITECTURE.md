# Book — Architecture (4-layer model)

A Plot Book is assembled from **four orthogonal layers**. Every change the user makes is a mutation on exactly one layer. The rendering pipeline composes them in order.

```
┌─────────────────────────────────────────────┐
│  LAYER 4 — DECORATION (ribbon, ornaments)   │  absolute-positioned, non-interactive
├─────────────────────────────────────────────┤
│  LAYER 3 — BLOCKS (text, image, quote…)     │  flows inside grid cells
├─────────────────────────────────────────────┤
│  LAYER 2 — GRID (12-col responsive snap)    │  determines cell geometry
├─────────────────────────────────────────────┤
│  LAYER 1 — SHELL (wiki, magazine, news…)    │  sets chrome, fonts, bg, rules
└─────────────────────────────────────────────┘
```

---

## Layer 1 — Shell

Picks the *kind* of publication. Each shell ships a fixed kit of defaults:

| Shell | Body font | Display font | Bg | Base grid | Chrome shown by default |
|---|---|---|---|---|---|
| `wiki` | Geist 15/1.75 | Geist 600 | `--background` | 12-col, max 960 | Title · Infobox · ToC · Footnotes |
| `magazine` | Merriweather 15/1.75 | Playfair 900 | `#faf7f0` | 12-col asymmetric | Masthead · Nameplate · Headline · Deck · Byline · Drop-cap |
| `newspaper` | Merriweather 14/1.6 | Playfair 900 condensed | `#f4efe6` | 6-col rigid w/ rules | Flag · Date strip · Column rules · Jump line |
| `book` | Merriweather 14/1.6 justified | Playfair 700 | `#f5efe2` | 1-col centered 480 | Cover · Half-title · Title · Running header · Page no · Chapter opener |
| `flipbook` | (wraps any shell) | — | — | two-page spread | Page-turn UI + thumbnails |
| `blank` | Geist 15/1.75 | Geist 600 | `--background` | 12-col | (none) |

Shell is a **data** choice (`shell: "magazine"`), not a component. The renderer branches on this key.

---

## Layer 2 — Grid

Every shell places blocks on a **12-col responsive grid** (newspaper is 6-col; book is 1-col). Cells are described by `{col: 1-12, span: 1-12, row: auto|number}`. The grid is always there — the shell just sets different defaults for `cols`, `gap`, `maxWidth`, `padding`.

Snap behavior:
- Drag → snaps to column boundaries. No pixel-precise placement.
- Resize → snaps to span increments (1, 2, 3, …, 12).
- Row height → auto by content; user can lock a row to `--row-minh` token (sm/md/lg).

This is the "freedom B" contract: the user *feels* free drag-and-drop, but the system guarantees a readable result.

---

## Layer 3 — Blocks

Atomic content. Each block has `{id, type, props, content, cell}`. Types grouped by role:

**Text** — `paragraph · heading · blockquote · pullquote · drop-cap · caption · footnote · running-header · page-number`
**Media** — `image · gallery · video · embed`
**Chrome** (inserted by shell, editable) — `masthead · nameplate · flag · date-strip · cover · back-cover · colophon · infobox · toc`
**Structure** — `column-rule · ornamental-break · spacer · card`
**Interactive** — `bookmark · link-suggestion · footnote-ref`

Every block honors `cell` (where it goes on the grid) and `style` (shell-scoped overrides for font/color/border).

---

## Layer 4 — Decoration

Non-flowing, purely visual. A Plot Book can have:

- **Ribbon** — SVG, anchored top or left, z-index above grid, pointer-events none
- **Endpaper** — first/last spread decorative pattern (SVG swatches)
- **Background texture** — subtle SVG (paper grain, dot grid, newsprint fleck)
- **Corner ornament** — magazine flourish in page corner
- **Fold crease** — newspaper centerfold shadow line
- **Bookmark tab** — right-edge tab with chapter name

Decorations never consume grid cells; they live in a sibling `<div class="book-decor">` layered `position: absolute; inset: 0`.

---

## Data shape (source of truth)

```ts
type Book = {
  id: string
  shell: "wiki" | "magazine" | "newspaper" | "book" | "blank"
  renderMode: "scroll" | "flipbook"         // orthogonal to shell

  theme: {
    bgColor?: string
    bgTexture?: "none" | "paper" | "newsprint" | "dots" | "linen"
    accentColor?: string
    cardBorder?: "none" | "hairline" | "subtle" | "strong"
    cardRadius?: "sharp" | "soft" | "round"
    fontOverride?: { body?: string, display?: string }
  }

  decoration: {
    ribbon?: { show: boolean, color: string, position: "top" | "left" }
    endpaper?: { show: boolean, pattern: string }
    cornerOrnament?: { show: boolean, glyph: string }
    bookmarks?: Array<{ label: string, blockId: string, color: string }>
  }

  pages: Array<Page>                        // flipbook splits by pages; scroll ignores
  blocks: Block[]                           // flat array, referenced by cell
}

type Page = { id: string, blockIds: string[], breakBefore?: boolean }

type Block = {
  id: string
  type: BlockType
  cell: { col: number, span: number, row?: number, rowSpan?: number }
  props: Record<string, unknown>
  content: string | Block[]
  style?: Partial<BlockStyle>
}
```

---

## Editor UX contract

The editor distinguishes **three moves** clearly (so it doesn't feel chaotic):

1. **Pick shell** → full document transform. Modal gallery with big previews. Explicit "Change shell" action. Not a drag.
2. **Edit blocks** → inline. Click to select, drag to move within grid, edge-handles to resize span, `/` to insert a new block.
3. **Decorate** → right-rail panel. Toggles + pickers. No free-drag of decorations; they snap to shell-approved slots.

The UI separates these visually:
- Shell picker: top-left of document, reads "Magazine ▾".
- Block editing: inline with the content, only when selected.
- Decoration: right sidebar with clear section headers.

**No overloaded chrome.** The cardinal sin of the current wiki editor is dashed borders, hover-reveal buttons, and nested +/× everywhere. Plot Book's answer: **chrome appears only on the currently-selected cell, one level at a time.**

---

## Rendering order

```
<BookRoot shell={…} bg={…}>
  <BookDecoration />               {/* Layer 4 — absolute */}
  <BookChrome shell={…}>           {/* shell-scoped running headers etc */}
    <BookGrid cols={…}>            {/* Layer 2 */}
      {blocks.map(b => (
        <Cell cell={b.cell}>
          <BlockRenderer block={b} />  {/* Layer 3 */}
        </Cell>
      ))}
    </BookGrid>
  </BookChrome>
</BookRoot>
```

In flipbook mode, the tree is wrapped in `<FlipbookViewer>` which handles page-splitting and page-turn.

---

## Why this beats the current wiki-editor

| Problem in current wiki-editor | 4-layer answer |
|---|---|
| Column tree + blocks tangled together | Grid and Blocks are separate layers |
| Editor chrome (+/×) on every column and block at once | Chrome only on selected cell |
| Palette applied as card tint — no real "shell" difference | Shell owns fonts + bg + chrome; card tint is just one style option |
| Cover/ribbon/endpaper can't be expressed | Layer 4 dedicated to decoration |
| "Magazine vs wiki" feels the same in practice | Shell sets body font, grid, and chrome — visibly different |
| Flipbook impossible to bolt on later | `renderMode` is a top-level flag from day one |
