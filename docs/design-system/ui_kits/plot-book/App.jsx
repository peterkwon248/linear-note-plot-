// App.jsx — Book UI kit entry
const { WikiShell, MagazineShell, NewspaperShell, BookShell, BlankShell } = window.Shells;
const { Ribbon, CornerOrnament, Bookmark } = window.Decorations;

const SHELL_COMPONENTS = {
  wiki: WikiShell, magazine: MagazineShell, newspaper: NewspaperShell,
  book: BookShell, blank: BlankShell,
};

const ShellPill = ({ id, label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: "6px 12px", height: 30, border: "1px solid var(--border)", borderRadius: 6,
    background: active ? "var(--foreground)" : "var(--background)",
    color: active ? "var(--background)" : "var(--foreground)",
    fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
  }}>{label}</button>
);

const TweakPanel = ({ theme, setTheme, decor, setDecor, shell, setShell }) => (
  <div style={{
    position: "fixed", top: 70, right: 16, width: 260, background: "var(--popover)",
    border: "1px solid var(--border)", borderRadius: 8, padding: 14, fontSize: 13,
    boxShadow: "var(--shadow-lg)", zIndex: 50, maxHeight: "80vh", overflowY: "auto",
  }}>
    <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)" }}>Shell</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
      {Object.values(window.SHELLS).map(s => (
        <button key={s.id} onClick={() => setShell(s.id)} style={{
          padding: "8px 10px", border: shell === s.id ? "1px solid var(--accent)" : "1px solid var(--border)",
          borderRadius: 6, background: shell === s.id ? "rgba(94,106,210,0.08)" : "var(--background)",
          fontSize: 12, cursor: "pointer", textAlign: "left", fontFamily: "inherit", color: "var(--foreground)",
        }}>{s.label}</button>
      ))}
    </div>

    <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)" }}>Background</div>
    <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <input type="color" value={theme.bgColor} onChange={e => setTheme({ ...theme, bgColor: e.target.value })} style={{ width: 32, height: 24, border: "1px solid var(--border)", borderRadius: 4, background: "none", cursor: "pointer" }} />
      <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Color</span>
    </label>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
      {["none", "paper", "newsprint", "dots", "linen"].map(t => (
        <button key={t} onClick={() => setTheme({ ...theme, texture: t })} style={{
          padding: "3px 8px", fontSize: 11, border: theme.texture === t ? "1px solid var(--accent)" : "1px solid var(--border)",
          borderRadius: 4, background: "var(--background)", cursor: "pointer", color: "var(--foreground)", fontFamily: "inherit",
        }}>{t}</button>
      ))}
    </div>

    <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)" }}>Card border</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
      {["none", "hairline", "subtle", "strong"].map(b => (
        <button key={b} onClick={() => setTheme({ ...theme, cardBorder: b === "none" ? "none" : b === "hairline" ? "1px solid rgba(0,0,0,0.15)" : b === "subtle" ? "1px solid var(--border-subtle)" : "2px solid var(--foreground)" })} style={{
          padding: "3px 8px", fontSize: 11, border: "1px solid var(--border)", borderRadius: 4, background: "var(--background)", cursor: "pointer", color: "var(--foreground)", fontFamily: "inherit",
        }}>{b}</button>
      ))}
    </div>

    {/* ── Level 2: Typography ─────────────────────────── */}
    <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)" }}>Typography</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 14 }}>
      {[
        { id: "default",   label: "Default",   display: "Playfair", body: "Merriweather" },
        { id: "classic",   label: "Classic",   display: "Garamond",  body: "Garamond" },
        { id: "modern",    label: "Modern",    display: "Geist",     body: "Geist" },
        { id: "editorial", label: "Editorial", display: "Playfair", body: "Geist" },
        { id: "bauhaus",   label: "Bauhaus",   display: "Geist Mono", body: "Geist" },
      ].map(f => (
        <button key={f.id} onClick={() => setTheme({ ...theme, fontPair: f.id })} style={{
          padding: "6px 8px", fontSize: 11, textAlign: "left",
          border: theme.fontPair === f.id ? "1px solid var(--accent)" : "1px solid var(--border)",
          background: theme.fontPair === f.id ? "rgba(94,106,210,0.08)" : "var(--background)",
          borderRadius: 4, cursor: "pointer", color: "var(--foreground)", fontFamily: "inherit",
          lineHeight: 1.3,
        }}>
          <div style={{ fontWeight: 600 }}>{f.label}</div>
          <div style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{f.display} / {f.body}</div>
        </button>
      ))}
    </div>

    {/* ── Level 2: Colors ─────────────────────────────── */}
    <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)" }}>Ink colors</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="color" value={theme.textColor || "#1a1a1a"} onChange={e => setTheme({ ...theme, textColor: e.target.value })} style={{ width: 28, height: 22, border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer" }} />
        <span style={{ fontSize: 11, color: "var(--muted-foreground)", flex: 1 }}>Body text</span>
        {theme.textColor && <button onClick={() => setTheme({ ...theme, textColor: "" })} style={{ border: 0, background: "none", cursor: "pointer", fontSize: 10, color: "var(--muted-foreground)" }}>reset</button>}
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="color" value={theme.accentColor || "#5e6ad2"} onChange={e => setTheme({ ...theme, accentColor: e.target.value })} style={{ width: 28, height: 22, border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer" }} />
        <span style={{ fontSize: 11, color: "var(--muted-foreground)", flex: 1 }}>Accent</span>
        {theme.accentColor && <button onClick={() => setTheme({ ...theme, accentColor: "" })} style={{ border: 0, background: "none", cursor: "pointer", fontSize: 10, color: "var(--muted-foreground)" }}>reset</button>}
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="color" value={theme.quoteColor || "#9b1c1c"} onChange={e => setTheme({ ...theme, quoteColor: e.target.value })} style={{ width: 28, height: 22, border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer" }} />
        <span style={{ fontSize: 11, color: "var(--muted-foreground)", flex: 1 }}>Pull quote</span>
        {theme.quoteColor && <button onClick={() => setTheme({ ...theme, quoteColor: "" })} style={{ border: 0, background: "none", cursor: "pointer", fontSize: 10, color: "var(--muted-foreground)" }}>reset</button>}
      </label>
    </div>

    {/* ── Level 2: Layout ─────────────────────────────── */}
    <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)" }}>Columns</div>
    <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
      {[{v:0,l:"Auto"},{v:1,l:"1"},{v:2,l:"2"},{v:3,l:"3"},{v:6,l:"6"}].map(c => (
        <button key={c.v} onClick={() => setTheme({ ...theme, cols: c.v })} style={{
          flex: 1, padding: "5px 0", fontSize: 11,
          border: theme.cols === c.v ? "1px solid var(--accent)" : "1px solid var(--border)",
          background: theme.cols === c.v ? "rgba(94,106,210,0.08)" : "var(--background)",
          borderRadius: 4, cursor: "pointer", color: "var(--foreground)", fontFamily: "inherit",
        }}>{c.l}</button>
      ))}
    </div>

    <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)" }}>Margins</div>
    <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
      {["narrow", "standard", "wide"].map(m => (
        <button key={m} onClick={() => setTheme({ ...theme, margins: m })} style={{
          flex: 1, padding: "5px 0", fontSize: 11,
          border: theme.margins === m ? "1px solid var(--accent)" : "1px solid var(--border)",
          background: theme.margins === m ? "rgba(94,106,210,0.08)" : "var(--background)",
          borderRadius: 4, cursor: "pointer", color: "var(--foreground)", fontFamily: "inherit",
        }}>{m}</button>
      ))}
    </div>

    <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)" }}>Chapter breaks</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 14 }}>
      {[
        { id: "default",  label: "Default" },
        { id: "roman",    label: "I · II · III" },
        { id: "numeric",  label: "01 · 02 · 03" },
        { id: "ornament", label: "❦ ornament" },
        { id: "rule",     label: "── rule ──" },
      ].map(c => (
        <button key={c.id} onClick={() => setTheme({ ...theme, chapterStyle: c.id })} style={{
          padding: "5px 8px", fontSize: 11, textAlign: "left",
          border: theme.chapterStyle === c.id ? "1px solid var(--accent)" : "1px solid var(--border)",
          background: theme.chapterStyle === c.id ? "rgba(94,106,210,0.08)" : "var(--background)",
          borderRadius: 4, cursor: "pointer", color: "var(--foreground)", fontFamily: "inherit",
        }}>{c.label}</button>
      ))}
    </div>

    {/* Save / Load custom shell */}
    <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)" }}>My Shell</div>
    <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
      <button onClick={() => {
        const name = prompt("Name this shell preset:");
        if (!name) return;
        const saved = JSON.parse(localStorage.getItem("book.savedShells") || "{}");
        saved[name] = { shell, theme, decor };
        localStorage.setItem("book.savedShells", JSON.stringify(saved));
        alert(`Saved "${name}"`);
      }} style={{ flex: 1, padding: "5px 0", fontSize: 11, border: "1px solid var(--border)", borderRadius: 4, background: "var(--background)", cursor: "pointer", color: "var(--foreground)", fontFamily: "inherit" }}>Save current</button>
      <button onClick={() => setTheme({ bgColor: "", texture: "", cardBorder: "", fontPair: "default", accentColor: "", textColor: "", quoteColor: "", cols: 0, margins: "standard", chapterStyle: "default" })}
        style={{ padding: "5px 10px", fontSize: 11, border: "1px solid var(--border)", borderRadius: 4, background: "var(--background)", cursor: "pointer", color: "var(--foreground)", fontFamily: "inherit" }}>Reset</button>
    </div>

    <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)" }}>Decoration</div>
    <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <input type="checkbox" checked={decor.ribbon} onChange={e => setDecor({ ...decor, ribbon: e.target.checked })} />
      <span>Ribbon</span>
      <input type="color" value={decor.ribbonColor} onChange={e => setDecor({ ...decor, ribbonColor: e.target.value })} style={{ width: 24, height: 20, border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer", marginLeft: "auto" }} />
    </label>
    <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <input type="checkbox" checked={decor.bookmark} onChange={e => setDecor({ ...decor, bookmark: e.target.checked })} />
      <span>Bookmark tab</span>
    </label>
    <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <input type="checkbox" checked={decor.ornament} onChange={e => setDecor({ ...decor, ornament: e.target.checked })} />
      <span>Corner ornament</span>
    </label>
    <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <input type="checkbox" checked={decor.flipbook} onChange={e => setDecor({ ...decor, flipbook: e.target.checked })} />
      <span>Flipbook preview</span>
    </label>
  </div>
);

const App = () => {
  const [mode, setMode] = React.useState(() => localStorage.getItem("book.mode") || "shells");
  const [shell, setShell] = React.useState(() => localStorage.getItem("book.shell") || "magazine");
  const [showCover, setShowCover] = React.useState(true);
  const [panelOpen, setPanelOpen] = React.useState(true);
  const [theme, setTheme] = React.useState(() => {
    const saved = localStorage.getItem("book.theme");
    return saved ? JSON.parse(saved) : {
      bgColor: "", texture: "", cardBorder: "",
      fontPair: "default",   // default | classic | modern | editorial | bauhaus
      accentColor: "",       // custom accent
      textColor: "",         // custom body text
      quoteColor: "",        // pullquote color
      cols: 0,               // 0 = shell default
      margins: "standard",   // narrow | standard | wide
      chapterStyle: "default", // default | roman | numeric | ornament | rule
    };
  });
  const [decor, setDecor] = React.useState({ ribbon: false, ribbonColor: "#9b1c1c", bookmark: false, ornament: false, flipbook: false });

  React.useEffect(() => { localStorage.setItem("book.theme", JSON.stringify(theme)); }, [theme]);

  React.useEffect(() => { localStorage.setItem("book.shell", shell); }, [shell]);
  React.useEffect(() => { localStorage.setItem("book.mode", mode); }, [mode]);

  if (mode === "main") {
    return <window.PlotMainAppDemo onBack={() => setMode("shells")} />;
  }
  if (mode === "flipbook") {
    const { FlipbookViewer, SAMPLE_PAGES, renderSamplePage } = window.BookFlipbook;
    return (
      <div style={{ minHeight: "100vh", background: "#1a1612" }}>
        <div style={{ position: "fixed", top: 14, left: 14, zIndex: 50 }}>
          <button onClick={() => setMode("shells")} style={{ padding: "6px 12px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, background: "rgba(255,255,255,0.08)", color: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>← Back</button>
        </div>
        <FlipbookViewer pages={SAMPLE_PAGES} shell={window.SHELLS.book} renderPage={renderSamplePage} />
      </div>
    );
  }
  if (mode === "editor") {
    const { GridEditor } = window.BookEditor;
    return (
      <div style={{ minHeight: "100vh", background: "var(--background)" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 40, background: "var(--background)", borderBottom: "1px solid var(--border-subtle)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setMode("shells")} style={{ padding: "6px 12px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--background)", color: "var(--foreground)", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>← Back</button>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Grid Editor — 12-col snap</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Active shell: <b style={{ color: "var(--foreground)" }}>{window.SHELLS[shell].label}</b></div>
        </div>
        <GridEditor shell={shell} cols={window.SHELLS[shell].cols === 1 ? 12 : window.SHELLS[shell].cols} />
      </div>
    );
  }

  const S = window.SHELLS[shell];
  const Component = SHELL_COMPONENTS[shell];
  const bg = theme.bgColor || S.bg;
  const tex = theme.texture || S.texture || "none";

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "var(--font-sans)" }}>
      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: "var(--background)", borderBottom: "1px solid var(--border-subtle)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginRight: 8 }}>Plot Book</div>
        <div style={{ display: "flex", gap: 4 }}>
          {Object.values(window.SHELLS).map(s => <ShellPill key={s.id} id={s.id} label={s.label} active={shell === s.id} onClick={() => { setShell(s.id); setShowCover(true); }} />)}
        </div>
        <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setMode("editor")} style={{ height: 30, padding: "0 12px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--background)", color: "var(--foreground)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Grid Editor →</button>
          <button onClick={() => setMode("flipbook")} style={{ height: 30, padding: "0 12px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--background)", color: "var(--foreground)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Flipbook →</button>
          <button onClick={() => setMode("main")} style={{ height: 30, padding: "0 12px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--background)", color: "var(--foreground)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Main App →</button>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setPanelOpen(!panelOpen)} style={{ height: 30, padding: "0 12px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--background)", color: "var(--foreground)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          {panelOpen ? "Hide" : "Show"} Tweaks
        </button>
      </div>

      {/* Subtitle */}
      <div style={{ padding: "10px 16px", color: "var(--muted-foreground)", fontSize: 12, borderBottom: "1px solid var(--border-subtle)" }}>
        {S.subtitle}
      </div>

      {/* Stage */}
      <div style={{
        background: bg,
        backgroundImage: window.TEXTURES[tex],
        minHeight: "calc(100vh - 80px)",
        position: "relative",
        padding: decor.flipbook ? "40px 20px" : "0",
        transition: "background 0.3s ease",
      }}>
        <div style={{
          position: "relative",
          ...(decor.flipbook ? {
            maxWidth: S.maxWidth + 80,
            margin: "0 auto",
            background: bg,
            boxShadow: "0 24px 64px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.1)",
            border: "1px solid rgba(0,0,0,0.08)",
          } : {}),
        }}>
          {decor.ribbon && <Ribbon color={decor.ribbonColor} position="right" />}
          {decor.ornament && <CornerOrnament glyph="❦" />}
          {decor.bookmark && <Bookmark label="Ch. I" color={decor.ribbonColor} />}

          {shell === "book"
            ? <Component shell={window.resolveShell(S, theme)} theme={theme} showCover={showCover} setShowCover={setShowCover} />
            : <Component shell={window.resolveShell(S, theme)} theme={theme} />}
        </div>

        {decor.flipbook && (
          <div style={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8, background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 999, padding: "6px 14px", boxShadow: "var(--shadow-lg)", zIndex: 30 }}>
            <button style={{ border: 0, background: "none", cursor: "pointer", fontSize: 14, color: "var(--foreground)" }}>‹</button>
            <div style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>7 / 128</div>
            <button style={{ border: 0, background: "none", cursor: "pointer", fontSize: 14, color: "var(--foreground)" }}>›</button>
            <div style={{ width: 1, height: 14, background: "var(--border)", margin: "0 4px" }} />
            <button style={{ border: 0, background: "none", cursor: "pointer", fontSize: 11, color: "var(--muted-foreground)" }}>Zoom −</button>
            <button style={{ border: 0, background: "none", cursor: "pointer", fontSize: 11, color: "var(--muted-foreground)" }}>Zoom +</button>
            <div style={{ width: 1, height: 14, background: "var(--border)", margin: "0 4px" }} />
            <button style={{ border: 0, background: "none", cursor: "pointer", fontSize: 11, color: "var(--muted-foreground)" }}>Thumbs</button>
          </div>
        )}
      </div>

      {panelOpen && <TweakPanel theme={theme} setTheme={setTheme} decor={decor} setDecor={setDecor} shell={shell} setShell={(id) => { setShell(id); setShowCover(true); }} />}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
