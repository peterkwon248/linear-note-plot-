// Editor.jsx — shell-aware block palette, slash menu, 12-col snap drag editor
// Attached as window.BookEditor for the App to mount.

const BLOCK_LIBRARY = {
  // universal
  paragraph:   { label: "Paragraph",  hint: "Body text",               glyph: "¶",  shells: "*", span: 12 },
  heading:     { label: "Heading",    hint: "Section title",            glyph: "H",  shells: "*", span: 12 },
  image:       { label: "Image",      hint: "Photo + caption",          glyph: "▣",  shells: "*", span: 6 },
  quote:       { label: "Quote",      hint: "Indented blockquote",      glyph: "“”", shells: "*", span: 10 },
  divider:     { label: "Divider",    hint: "Horizontal rule",          glyph: "—",  shells: "*", span: 12 },
  // wiki
  infobox:     { label: "Infobox",    hint: "Right-rail fact table",    glyph: "ⓘ",  shells: ["wiki"], span: 4 },
  toc:         { label: "Table of Contents", hint: "Auto-numbered ToC", glyph: "☰", shells: ["wiki"], span: 12 },
  footnote:    { label: "Footnote",   hint: "Numbered reference",       glyph: "¹",  shells: ["wiki"], span: 12 },
  hatnote:     { label: "Hatnote",    hint: "Italic preface",           glyph: "⌐",  shells: ["wiki"], span: 12 },
  // magazine
  masthead:    { label: "Masthead",   hint: "Brand + issue strip",      glyph: "M",  shells: ["magazine"], span: 12 },
  nameplate:   { label: "Nameplate",  hint: "Section label w/ rules",   glyph: "§",  shells: ["magazine", "newspaper"], span: 12 },
  headline:    { label: "Headline",   hint: "Display-type title",       glyph: "A",  shells: ["magazine", "newspaper"], span: 12 },
  deck:        { label: "Deck",       hint: "Subhead under headline",   glyph: "a",  shells: ["magazine", "newspaper"], span: 12 },
  byline:      { label: "Byline",     hint: "Author · photographer",    glyph: "—",  shells: ["magazine", "newspaper"], span: 12 },
  dropcap:     { label: "Drop Cap",   hint: "Opening paragraph",        glyph: "Q",  shells: ["magazine", "book"], span: 12 },
  pullquote:   { label: "Pull Quote", hint: "Oversized italic break",   glyph: "❝",  shells: ["magazine"], span: 8 },
  // newspaper
  flag:        { label: "Flag",       hint: "Newspaper wordmark",       glyph: "F",  shells: ["newspaper"], span: 12 },
  datestrip:   { label: "Date Strip", hint: "Date · edition · vol",     glyph: "═",  shells: ["newspaper"], span: 12 },
  columnrule:  { label: "Column Rule",hint: "Vertical divider",         glyph: "│",  shells: ["newspaper"], span: 1 },
  kicker:      { label: "Kicker",     hint: "Small-caps section tag",   glyph: "›",  shells: ["newspaper", "magazine"], span: 12 },
  jumpline:    { label: "Jump Line",  hint: "Continued on page…",       glyph: "↗",  shells: ["newspaper"], span: 12 },
  // book
  cover:       { label: "Cover",      hint: "Front cover page",         glyph: "▢",  shells: ["book"], span: 12 },
  backcover:   { label: "Back Cover", hint: "Closing page",             glyph: "▣",  shells: ["book"], span: 12 },
  chapter:     { label: "Chapter",    hint: "Roman numeral + title",    glyph: "I",  shells: ["book"], span: 12 },
  ornament:    { label: "Ornament",   hint: "❧ ❦ ❖ break",              glyph: "❦",  shells: ["book", "magazine"], span: 12 },
  colophon:    { label: "Colophon",   hint: "Typeface credits",         glyph: "©",  shells: ["book"], span: 12 },
  runninghead: { label: "Running Head",hint: "Page-top label",          glyph: "‾",  shells: ["book"], span: 12 },
};

function shellBlocks(shell) {
  return Object.entries(BLOCK_LIBRARY).filter(([, b]) => b.shells === "*" || b.shells.includes(shell));
}

// ── Slash menu ──────────────────────────────────────────────────────
const SlashMenu = ({ shell, open, x, y, onPick, onClose, q, setQ }) => {
  const inputRef = React.useRef(null);
  React.useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);
  if (!open) return null;

  const entries = shellBlocks(shell).filter(([k, b]) =>
    !q || b.label.toLowerCase().includes(q.toLowerCase()) || b.hint.toLowerCase().includes(q.toLowerCase()));
  const groups = {
    "Content":      entries.filter(([k]) => ["paragraph", "heading", "quote", "image", "divider"].includes(k)),
    [shell.charAt(0).toUpperCase() + shell.slice(1)]:
                    entries.filter(([, b]) => b.shells !== "*" && b.shells.includes(shell)),
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60 }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: "absolute", left: x, top: y, width: 300, maxHeight: 380,
        background: "var(--popover)", border: "1px solid var(--border)",
        borderRadius: 8, boxShadow: "var(--shadow-popover)", overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
          placeholder="Filter blocks…" onKeyDown={e => e.key === "Escape" && onClose()}
          style={{ border: 0, outline: 0, padding: "10px 12px", fontSize: 13, borderBottom: "1px solid var(--border-subtle)", background: "transparent", color: "var(--foreground)", fontFamily: "inherit" }} />
        <div style={{ overflowY: "auto", padding: 4 }}>
          {Object.entries(groups).map(([g, its]) => its.length > 0 && (
            <div key={g}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--muted-foreground)", padding: "8px 10px 4px" }}>{g}</div>
              {its.map(([k, b]) => (
                <div key={k} onClick={() => onPick(k)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "6px 10px",
                  borderRadius: 5, cursor: "pointer",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--hover-bg)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ width: 26, height: 26, borderRadius: 5, background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--foreground)" }}>{b.glyph}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "var(--foreground)" }}>{b.label}</div>
                    <div style={{ fontSize: 11, color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.hint}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {entries.length === 0 && <div style={{ padding: 14, fontSize: 12, color: "var(--muted-foreground)", textAlign: "center" }}>No blocks match "{q}"</div>}
        </div>
      </div>
    </div>
  );
};

// ── 12-col snap grid editor ─────────────────────────────────────────
const GridEditor = ({ shell, cols = 12 }) => {
  const [blocks, setBlocks] = React.useState(() => ([
    { id: "b1", type: "heading",   col: 1, span: 12, row: 1, text: "Untitled Book" },
    { id: "b2", type: "paragraph", col: 1, span: 7,  row: 2, text: "Click a block to select. Drag the top handle to move. Drag the right edge to resize. Click empty cell to insert. Press / to open the block menu." },
    { id: "b3", type: "image",     col: 8, span: 5,  row: 2, text: "Photo placeholder" },
    { id: "b4", type: "quote",     col: 2, span: 10, row: 3, text: "A notebook is the cheapest lab in the world." },
  ]));
  const [selected, setSelected] = React.useState(null);
  const [slash, setSlash] = React.useState({ open: false, x: 0, y: 0, q: "", at: null });
  const [drag, setDrag] = React.useState(null); // { id, kind: "move"|"resize", startX, startCol, startSpan }
  const gridRef = React.useRef(null);

  const colWidth = () => {
    const el = gridRef.current; if (!el) return 80;
    const gap = 12;
    return (el.clientWidth - gap * (cols - 1)) / cols;
  };

  const onCellClick = (e, col, row) => {
    if (drag) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setSlash({ open: true, x: rect.left + 10, y: rect.top + 10, q: "", at: { col, row } });
  };

  const insertBlock = (type) => {
    const def = BLOCK_LIBRARY[type];
    const at = slash.at || { col: 1, row: (blocks.reduce((m, b) => Math.max(m, b.row), 0) || 0) + 1 };
    const maxRow = blocks.reduce((m, b) => Math.max(m, b.row), 0);
    const row = at.row <= maxRow ? maxRow + 1 : at.row;
    const col = Math.min(at.col, cols - def.span + 1);
    setBlocks([...blocks, { id: "b" + (blocks.length + 1) + "_" + Date.now(), type, col, span: def.span, row, text: def.label }]);
    setSlash({ open: false, x: 0, y: 0, q: "", at: null });
  };

  const startDrag = (e, id, kind) => {
    e.stopPropagation(); e.preventDefault();
    const b = blocks.find(x => x.id === id);
    setDrag({ id, kind, startX: e.clientX, startY: e.clientY, startCol: b.col, startSpan: b.span, startRow: b.row });
    setSelected(id);
  };

  React.useEffect(() => {
    if (!drag) return;
    const cw = colWidth() + 12;
    const onMove = (e) => {
      const dx = e.clientX - drag.startX;
      const dySteps = Math.round((e.clientY - drag.startY) / 60);
      const dCol = Math.round(dx / cw);
      setBlocks(prev => prev.map(b => {
        if (b.id !== drag.id) return b;
        if (drag.kind === "move") {
          const col = Math.max(1, Math.min(cols - b.span + 1, drag.startCol + dCol));
          const row = Math.max(1, drag.startRow + dySteps);
          return { ...b, col, row };
        } else { // resize
          const span = Math.max(1, Math.min(cols - b.col + 1, drag.startSpan + dCol));
          return { ...b, span };
        }
      }));
    };
    const onUp = () => setDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [drag]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !slash.open && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        setSlash({ open: true, x: window.innerWidth / 2 - 150, y: 120, q: "", at: null });
      }
      if (e.key === "Backspace" && selected && document.activeElement.tagName !== "INPUT") {
        setBlocks(bs => bs.filter(b => b.id !== selected));
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, slash.open]);

  const maxRow = Math.max(4, blocks.reduce((m, b) => Math.max(m, b.row), 0) + 2);
  const rows = Array.from({ length: maxRow }, (_, i) => i + 1);

  return (
    <>
      <div ref={gridRef} onClick={() => setSelected(null)} style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridAutoRows: "minmax(60px, auto)",
        gap: 12,
        padding: 32,
        minHeight: "calc(100vh - 180px)",
        background: `
          linear-gradient(to right, transparent calc(100% - 1px), rgba(94,106,210,0.06) 0)
        `,
      }}>
        {/* Grid guides */}
        {rows.flatMap(r => Array.from({ length: cols }, (_, c) => (
          <div key={`g${r}-${c}`} onClick={(e) => { e.stopPropagation(); onCellClick(e, c + 1, r); }}
            style={{
              gridColumn: `${c + 1} / span 1`, gridRow: `${r} / span 1`,
              border: "1px dashed rgba(94,106,210,0.12)",
              borderRadius: 4, background: "transparent", cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(94,106,210,0.04)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          />
        )))}

        {/* Blocks */}
        {blocks.map(b => {
          const def = BLOCK_LIBRARY[b.type] || BLOCK_LIBRARY.paragraph;
          const isSelected = selected === b.id;
          return (
            <div key={b.id} onClick={(e) => { e.stopPropagation(); setSelected(b.id); }}
              style={{
                gridColumn: `${b.col} / span ${b.span}`,
                gridRow: `${b.row} / span 1`,
                position: "relative",
                background: "var(--background)",
                border: isSelected ? "1.5px solid var(--accent)" : "1px solid var(--border-subtle)",
                borderRadius: 6, padding: 14,
                cursor: "pointer", minHeight: 56,
                boxShadow: isSelected ? "0 0 0 3px rgba(94,106,210,0.12)" : "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                fontFamily: "inherit",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{def.glyph} {def.label}</span>
                <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>col {b.col} · span {b.span}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.5 }}>{b.text}</div>

              {isSelected && (
                <>
                  {/* Move handle — top */}
                  <div onMouseDown={(e) => startDrag(e, b.id, "move")} title="Drag to move"
                    style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", width: 44, height: 16, background: "var(--accent)", borderRadius: 4, cursor: "grab", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, letterSpacing: "0.08em" }}>⋮⋮</div>
                  {/* Resize handle — right */}
                  <div onMouseDown={(e) => startDrag(e, b.id, "resize")} title="Drag to resize"
                    style={{ position: "absolute", right: -6, top: 0, bottom: 0, width: 12, cursor: "ew-resize", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 3, height: 24, background: "var(--accent)", borderRadius: 2 }} />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating hint */}
      <div style={{ position: "fixed", bottom: 16, left: 16, fontSize: 11, color: "var(--muted-foreground)", background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", boxShadow: "var(--shadow-sm)", display: "flex", gap: 14 }}>
        <span><span className="kbd">/</span> insert</span>
        <span><span className="kbd">⌫</span> delete</span>
        <span>drag top to move · drag right to resize</span>
      </div>

      <SlashMenu shell={shell} open={slash.open} x={slash.x} y={slash.y}
        q={slash.q} setQ={(q) => setSlash({ ...slash, q })}
        onPick={insertBlock} onClose={() => setSlash({ ...slash, open: false })} />
    </>
  );
};

window.BookEditor = { GridEditor, BLOCK_LIBRARY, shellBlocks };
