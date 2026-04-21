// Shells.jsx — the 5 visually distinct shell renderers
// Each shell takes (theme, decoration) and renders its own chrome + content.

// ─── helpers ─────────────────────────────────────────────
const TEXTURES = {
  none: "none",
  paper: "radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px) 0 0/3px 3px",
  newsprint: "radial-gradient(rgba(0,0,0,0.04) 0.5px, transparent 0.5px) 0 0/2px 2px",
  dots: "radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px) 0 0/14px 14px",
  linen: "repeating-linear-gradient(0deg, rgba(0,0,0,0.015) 0 1px, transparent 1px 2px), repeating-linear-gradient(90deg, rgba(0,0,0,0.015) 0 1px, transparent 1px 2px)",
};

// Level 2 — typography pair resolver
const FONT_PAIRS = {
  default:   { display: "'Playfair Display', Georgia, serif",  body: "'Merriweather', Georgia, serif" },
  classic:   { display: "'EB Garamond', Garamond, serif",       body: "'EB Garamond', Garamond, serif" },
  modern:    { display: "'Geist', system-ui, sans-serif",       body: "'Geist', system-ui, sans-serif" },
  editorial: { display: "'Playfair Display', Georgia, serif",  body: "'Geist', system-ui, sans-serif" },
  bauhaus:   { display: "'Geist Mono', ui-monospace, monospace", body: "'Geist', system-ui, sans-serif" },
};

// Level 2 — margin presets (multiplier × base padding)
const MARGIN_SCALE = { narrow: 0.65, standard: 1, wide: 1.5 };

// Resolve shell with theme overrides applied
window.resolveShell = (shell, theme = {}) => {
  const pair = FONT_PAIRS[theme.fontPair] || FONT_PAIRS.default;
  const mScale = MARGIN_SCALE[theme.margins] || 1;
  return {
    ...shell,
    bodyFont: theme.fontPair && theme.fontPair !== "default" ? pair.body : shell.bodyFont,
    displayFont: theme.fontPair && theme.fontPair !== "default" ? pair.display : shell.displayFont,
    fg: theme.textColor || shell.fg,
    accent: theme.accentColor || "#5e6ad2",
    quoteColor: theme.quoteColor || "#9b1c1c",
    cols: theme.cols > 0 ? theme.cols : shell.cols,
    marginScale: mScale,
    chapterStyle: theme.chapterStyle || "default",
  };
};

// ─── Chapter divider (shared) ───────────────────────────
const ChapterDivider = ({ style, displayFont, label, idx = 1 }) => {
  const roman = ["I","II","III","IV","V","VI","VII","VIII","IX","X"][idx - 1] || idx;
  const num = String(idx).padStart(2, "0");
  const base = { fontFamily: displayFont, textAlign: "center", margin: "24px 0" };
  if (style === "roman") return <div style={{ ...base, fontSize: 32, fontStyle: "italic", letterSpacing: "0.2em" }}>{roman}</div>;
  if (style === "numeric") return <div style={{ ...base, fontSize: 28, fontWeight: 300, letterSpacing: "0.3em", opacity: 0.6 }}>{num}</div>;
  if (style === "ornament") return <div style={{ ...base, fontSize: 22, letterSpacing: "1em", opacity: 0.5 }}>❦</div>;
  if (style === "rule") return <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "28px 0" }}><div style={{ flex: 1, height: 1, background: "currentColor", opacity: 0.25 }} /><div style={{ fontFamily: displayFont, fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.7 }}>{label || num}</div><div style={{ flex: 1, height: 1, background: "currentColor", opacity: 0.25 }} /></div>;
  return <div style={{ ...base, fontSize: 18, letterSpacing: "0.8em", opacity: 0.5 }}>❧</div>;
};

// ─── WIKI ────────────────────────────────────────────────
const WikiShell = ({ shell, theme }) => {
  const c = window.CONTENT.wiki;
  const pad = `${40 * shell.marginScale}px ${48 * shell.marginScale}px`;
  return (
    <div style={{ maxWidth: shell.maxWidth, margin: "0 auto", padding: pad, fontFamily: shell.bodyFont, color: shell.fg }}>
      <h1 style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 0, marginBottom: 6, borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>{c.title}</h1>
      <p style={{ fontStyle: "italic", color: "var(--muted-foreground)", fontSize: 14, marginTop: 6, marginBottom: 24 }}>{c.hatnote}</p>

      {/* Infobox floats right on wide screens */}
      <aside style={{
        float: "right", width: 280, marginLeft: 24, marginBottom: 16,
        border: theme.cardBorder || shell.cardBorder, borderRadius: shell.cardRadius,
        background: "var(--card)", padding: 14,
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, textAlign: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: 8 }}>{c.infobox.title}</div>
        <div style={{ width: "100%", aspectRatio: "4/3", background: "linear-gradient(135deg, #e8d5b7 0%, #c9a878 50%, #8b6f47 100%)", borderRadius: 4, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.8)", fontSize: 11, fontStyle: "italic" }}>Ebbinghaus forgetting curve</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <tbody>
            {c.infobox.fields.map(([k, v]) => (
              <tr key={k} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "6px 0", fontWeight: 600, color: "var(--muted-foreground)", width: "40%", verticalAlign: "top" }}>{k}</td>
                <td style={{ padding: "6px 0" }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </aside>

      {/* ToC */}
      <div style={{ border: "1px solid var(--border-subtle)", background: "var(--card)", padding: "12px 16px", margin: "0 0 20px", display: "inline-block", minWidth: 260, borderRadius: shell.cardRadius }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 8 }}>Contents</div>
        {c.toc.map((r) => (
          <div key={r.n} style={{ fontSize: 13, padding: "2px 0", paddingLeft: (r.n.split(".").length - 1) * 14, color: "var(--foreground)" }}>
            <span style={{ color: "var(--muted-foreground)", marginRight: 6 }}>{r.n}</span>{r.t}
          </div>
        ))}
      </div>

      {/* Body (cols override) */}
      <div style={{ fontSize: 15.5, lineHeight: 1.7, columnCount: shell.cols > 1 ? shell.cols : 1, columnGap: 28 }}>
        {(() => { let hc = 0; return c.body.map((b, i) => {
          if (b.type === "lead") return <p key={i} style={{ marginBottom: 16 }}>{b.text}</p>;
          if (b.type === "h2") {
            hc += 1;
            return (
              <React.Fragment key={i}>
                {shell.chapterStyle !== "default" && hc > 1 && <div style={{ color: shell.fg }}><ChapterDivider style={shell.chapterStyle} displayFont={shell.displayFont} idx={hc} label={b.text} /></div>}
                <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", borderBottom: "1px solid var(--border-subtle)", paddingBottom: 6, marginTop: 28, marginBottom: 12, breakInside: "avoid" }}>{b.text}</h2>
              </React.Fragment>
            );
          }
          if (b.type === "p") return <p key={i} style={{ marginBottom: 14 }}>{b.text}</p>;
          return null;
        }); })()}
      </div>

      <div style={{ clear: "both", marginTop: 40, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 8 }}>Footnotes</div>
        {c.footnotes.map((f, i) => <div key={i} style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 4 }}>{f}</div>)}
      </div>
    </div>
  );
};

// ─── MAGAZINE ────────────────────────────────────────────
const MagazineShell = ({ shell, theme }) => {
  const c = window.CONTENT.magazine;
  const pad = `${48 * shell.marginScale}px ${56 * shell.marginScale}px`;
  const bodyCols = shell.cols > 0 ? shell.cols : 2;
  return (
    <div style={{ maxWidth: shell.maxWidth, margin: "0 auto", padding: pad, fontFamily: shell.bodyFont, color: shell.fg }}>
      {/* Masthead */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "3px double #1a1a1a", paddingBottom: 10, marginBottom: 10 }}>
        <div style={{ fontFamily: shell.displayFont, fontSize: 28, fontWeight: 900, letterSpacing: "0.02em" }}>{c.masthead.brand}</div>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: shell.bodyFont, color: "#555" }}>{c.masthead.issue} · {c.masthead.date}</div>
      </div>

      {/* Nameplate */}
      <div style={{ textAlign: "center", padding: "14px 0 28px", borderBottom: "1px solid rgba(0,0,0,0.2)", marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", fontStyle: "italic", color: "#666" }}>— {c.nameplate} —</div>
      </div>

      {/* Headline trio */}
      <h1 style={{ fontFamily: shell.displayFont, fontSize: 72, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.98, margin: "0 0 20px", maxWidth: "88%" }}>{c.headline}</h1>
      <p style={{ fontFamily: shell.displayFont, fontSize: 22, fontStyle: "italic", fontWeight: 400, lineHeight: 1.35, color: "#333", margin: "0 0 24px", maxWidth: "70%" }}>{c.deck}</p>
      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#666", marginBottom: 40, fontFamily: shell.bodyFont }}>{c.byline}</div>

      {/* Hero image */}
      <div style={{ width: "100%", aspectRatio: "16/9", background: "linear-gradient(135deg, #c9b28a 0%, #8b7355 40%, #3a2e24 100%)", marginBottom: 10, position: "relative" }}>
        <div style={{ position: "absolute", bottom: 12, left: 14, color: "rgba(255,255,255,0.9)", fontSize: 11, fontStyle: "italic" }}>Archive · A reader at the British Library, 1962</div>
      </div>
      <div style={{ fontSize: 11, fontStyle: "italic", color: "#666", marginBottom: 32, textAlign: "right" }}>Photography — archive</div>

      {/* Body — columns override */}
      <div style={{ columnCount: bodyCols, columnGap: 32, fontSize: 15, lineHeight: 1.75, textAlign: "justify", hyphens: "auto" }}>
        {c.body.map((b, i) => {
          if (b.type === "dropcap-p") {
            const first = b.text[0]; const rest = b.text.slice(1);
            return (
              <p key={i} style={{ margin: "0 0 14px", breakInside: "avoid-column" }}>
                <span style={{ fontFamily: shell.displayFont, fontSize: 72, fontWeight: 900, float: "left", lineHeight: 0.85, marginRight: 8, marginTop: 4, color: shell.fg }}>{first}</span>
                {rest}
              </p>
            );
          }
          if (b.type === "pullquote") return (
            <div key={i} style={{ columnSpan: "all", borderTop: `2px solid ${shell.quoteColor}`, borderBottom: `2px solid ${shell.quoteColor}`, padding: "18px 0", margin: "18px 0", fontFamily: shell.displayFont, fontStyle: "italic", fontSize: 28, lineHeight: 1.25, textAlign: "center", fontWeight: 400, color: shell.quoteColor }}>"{b.text}"</div>
          );
          if (b.type === "h2") return (
            <React.Fragment key={i}>
              {shell.chapterStyle !== "default" && <div style={{ columnSpan: "all", color: shell.fg }}><ChapterDivider style={shell.chapterStyle} displayFont={shell.displayFont} idx={i} label={b.text} /></div>}
              <h2 style={{ fontFamily: shell.displayFont, fontSize: 24, fontWeight: 700, margin: "14px 0 10px" }}>{b.text}</h2>
            </React.Fragment>
          );
          if (b.type === "p") return <p key={i} style={{ margin: "0 0 14px" }}>{b.text}</p>;
          return null;
        })}
      </div>
    </div>
  );
};

// ─── NEWSPAPER ───────────────────────────────────────────
const NewspaperShell = ({ shell, theme }) => {
  const c = window.CONTENT.newspaper;
  const pad = `${32 * shell.marginScale}px ${40 * shell.marginScale}px`;
  const totalCols = shell.cols >= 3 ? shell.cols : 6;
  const leadSpan = Math.max(2, Math.floor(totalCols * (4/6)));
  const sideSpan = totalCols - leadSpan;
  const leadBodyCols = Math.max(1, Math.floor(leadSpan / 2));
  return (
    <div style={{ maxWidth: shell.maxWidth, margin: "0 auto", padding: pad, fontFamily: shell.bodyFont, color: shell.fg }}>
      {/* Flag */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #111", paddingBottom: 6, marginBottom: 2 }}>
        <h1 style={{ fontFamily: shell.displayFont, fontSize: 72, fontWeight: 900, letterSpacing: "-0.01em", margin: 0, lineHeight: 1 }}>{c.flag}</h1>
        <div style={{ fontFamily: shell.bodyFont, fontSize: 12, fontStyle: "italic", color: "#555", marginTop: 4 }}>{c.tagline}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #111", padding: "6px 0 10px", marginBottom: 18, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#333" }}>
        <span>{c.dateStrip.vol}</span><span>{c.dateStrip.date}</span><span>{c.dateStrip.edition}</span>
      </div>

      {/* grid body — col override */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${totalCols}, 1fr)`, gap: 0 }}>
        {/* Lead */}
        <div style={{ gridColumn: `1 / span ${leadSpan}`, paddingRight: 18, borderRight: sideSpan > 0 ? "1px solid rgba(0,0,0,0.25)" : "none" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: shell.quoteColor, fontWeight: 700, marginBottom: 4 }}>{c.lead.kicker}</div>
          <h2 style={{ fontFamily: shell.displayFont, fontSize: 44, fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.01em", margin: "0 0 10px" }}>{c.lead.headline}</h2>
          <div style={{ fontFamily: shell.displayFont, fontSize: 18, fontStyle: "italic", fontWeight: 400, color: "#333", lineHeight: 1.4, marginBottom: 8 }}>{c.lead.deck}</div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", marginBottom: 16 }}>{c.lead.byline}</div>

          <div style={{ columnCount: leadBodyCols, columnGap: 18, fontSize: 13.5, lineHeight: 1.55, textAlign: "justify", hyphens: "auto" }}>
            <p style={{ margin: "0 0 10px" }}>
              <span style={{ fontWeight: 700, letterSpacing: "0.06em" }}>{c.lead.city}</span> {c.lead.body[0]}
            </p>
            {c.lead.body.slice(1).map((p, i) => <p key={i} style={{ margin: "0 0 10px" }}>{p}</p>)}
            <p style={{ fontStyle: "italic", color: "#555", margin: "6px 0 0" }}>Continued on Page A12 →</p>
          </div>
        </div>

        {/* Sidebar */}
        {sideSpan > 0 && <div style={{ gridColumn: `${leadSpan + 1} / span ${sideSpan}`, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: shell.quoteColor, fontWeight: 700, marginBottom: 4 }}>{c.side1.kicker}</div>
            <h3 style={{ fontFamily: shell.displayFont, fontSize: 22, fontWeight: 900, lineHeight: 1.08, margin: "0 0 8px" }}>{c.side1.head}</h3>
            <div style={{ fontSize: 13, lineHeight: 1.55, textAlign: "justify" }}>
              {c.side1.body.map((p, i) => <p key={i} style={{ margin: "0 0 8px" }}>{p}</p>)}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.2)", paddingTop: 14 }}>
            <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg, #3a3a3a, #0a0a0a)", marginBottom: 6 }} />
            <div style={{ fontSize: 10, fontStyle: "italic", color: "#555", lineHeight: 1.4 }}>A reader at the Seoul Central Library. PHOTO BY P. KWON</div>
          </div>
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.2)", paddingTop: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: shell.quoteColor, fontWeight: 700, marginBottom: 4 }}>{c.side2.kicker}</div>
            <h3 style={{ fontFamily: shell.displayFont, fontSize: 18, fontWeight: 900, lineHeight: 1.1, margin: "0 0 6px" }}>{c.side2.head}</h3>
            <div style={{ fontSize: 13, lineHeight: 1.55 }}>
              {c.side2.body.map((p, i) => <p key={i} style={{ margin: "0 0 8px" }}>{p}</p>)}
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
};

// ─── BOOK ────────────────────────────────────────────────
const BookShell = ({ shell, theme, showCover, setShowCover }) => {
  const c = window.CONTENT.book;
  if (showCover) {
    return (
      <div style={{ maxWidth: 520, margin: "32px auto", padding: "80px 48px 60px", fontFamily: shell.bodyFont, color: shell.fg, background: "#2f1e14", minHeight: 680, border: "10px solid #1a0f08", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ position: "absolute", inset: 10, border: "1px solid rgba(230,200,140,0.3)", pointerEvents: "none" }} />
        <div style={{ textAlign: "center", color: "#e8d9b8" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", marginBottom: 80, opacity: 0.7 }}>{c.cover.publisher}</div>
          <h1 style={{ fontFamily: shell.displayFont, fontSize: 72, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em", margin: "0 0 18px" }}>{c.cover.title}</h1>
          <div style={{ width: 80, height: 1, background: "#e8d9b8", margin: "0 auto 18px", opacity: 0.5 }} />
          <div style={{ fontFamily: shell.displayFont, fontSize: 16, fontStyle: "italic", fontWeight: 400, opacity: 0.85, marginBottom: 160 }}>{c.cover.subtitle}</div>
          <div style={{ fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.85 }}>{c.cover.author}</div>
        </div>
        <button onClick={() => setShowCover(false)} style={{ position: "absolute", bottom: 16, right: 20, background: "transparent", border: "1px solid rgba(232,217,184,0.4)", color: "#e8d9b8", padding: "6px 12px", borderRadius: 4, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: shell.bodyFont }}>Open →</button>
      </div>
    );
  }
  const pad = `${72 * shell.marginScale}px ${56 * shell.marginScale}px ${96 * shell.marginScale}px`;
  const bodyCols = shell.cols > 0 ? shell.cols : 1;
  // Chapter opener varies by chapterStyle
  const renderChapterOpener = () => {
    if (shell.chapterStyle === "roman") return (
      <div style={{ textAlign: "center", margin: "20px 0 48px" }}>
        <div style={{ fontFamily: shell.displayFont, fontSize: 54, fontWeight: 300, letterSpacing: "0.25em", marginBottom: 18 }}>I</div>
        <h2 style={{ fontFamily: shell.displayFont, fontSize: 22, fontWeight: 400, fontStyle: "italic", letterSpacing: "0.02em", margin: 0 }}>{c.chapterTitle}</h2>
      </div>
    );
    if (shell.chapterStyle === "numeric") return (
      <div style={{ textAlign: "left", margin: "20px 0 48px", borderLeft: `3px solid ${shell.accent}`, paddingLeft: 18 }}>
        <div style={{ fontFamily: shell.displayFont, fontSize: 14, fontWeight: 600, letterSpacing: "0.25em", color: shell.accent, marginBottom: 6 }}>CHAPTER 01</div>
        <h2 style={{ fontFamily: shell.displayFont, fontSize: 32, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>{c.chapterTitle}</h2>
      </div>
    );
    if (shell.chapterStyle === "ornament") return (
      <div style={{ textAlign: "center", margin: "20px 0 48px" }}>
        <div style={{ fontSize: 32, letterSpacing: "1em", opacity: 0.5, marginBottom: 14 }}>❦❦❦</div>
        <h2 style={{ fontFamily: shell.displayFont, fontSize: 28, fontWeight: 400, fontStyle: "italic", margin: 0 }}>{c.chapterTitle}</h2>
      </div>
    );
    if (shell.chapterStyle === "rule") return (
      <div style={{ display: "flex", alignItems: "center", gap: 18, margin: "20px 0 48px" }}>
        <div style={{ flex: 1, height: 1, background: "currentColor", opacity: 0.3 }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: shell.displayFont, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.6, marginBottom: 4 }}>One</div>
          <h2 style={{ fontFamily: shell.displayFont, fontSize: 22, fontWeight: 400, fontStyle: "italic", margin: 0 }}>{c.chapterTitle}</h2>
        </div>
        <div style={{ flex: 1, height: 1, background: "currentColor", opacity: 0.3 }} />
      </div>
    );
    // default
    return (
      <div style={{ textAlign: "center", margin: "20px 0 48px" }}>
        <div style={{ fontFamily: shell.displayFont, fontSize: 44, fontWeight: 400, fontStyle: "italic", marginBottom: 18, letterSpacing: "0.05em" }}>{c.chapterNum}</div>
        <div style={{ width: 60, height: 1, background: "currentColor", margin: "0 auto 18px", opacity: 0.4 }} />
        <h2 style={{ fontFamily: shell.displayFont, fontSize: 22, fontWeight: 400, fontStyle: "italic", letterSpacing: "0.02em", margin: 0 }}>{c.chapterTitle}</h2>
      </div>
    );
  };
  return (
    <div style={{ maxWidth: shell.maxWidth, margin: "0 auto", padding: pad, fontFamily: shell.bodyFont, color: shell.fg, position: "relative" }}>
      {/* Running header */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a7a66", marginBottom: 48, fontStyle: "italic" }}>
        <span>Plot</span><span>On the slow habit</span>
      </div>

      {renderChapterOpener()}

      {/* Body — cols override */}
      <div style={{ fontSize: 16, lineHeight: 1.75, textAlign: "justify", hyphens: "auto", columnCount: bodyCols, columnGap: 32 }}>
        {c.body.map((b, i) => {
          if (b.type === "firstline") {
            const first = b.text[0]; const rest = b.text.slice(1);
            const words = rest.split(" ");
            const smallcapsFirst = words.slice(0, 4).join(" "); const normal = words.slice(4).join(" ");
            return (
              <p key={i} style={{ margin: "0 0 14px", textIndent: 0 }}>
                <span style={{ fontFamily: shell.displayFont, fontSize: 56, fontWeight: 700, float: "left", lineHeight: 0.85, marginRight: 8, marginTop: 6 }}>{first}</span>
                <span style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 14 }}>{smallcapsFirst}</span> {normal}
              </p>
            );
          }
          if (b.type === "p") return <p key={i} style={{ margin: 0, textIndent: "1.5em" }}>{b.text}</p>;
          if (b.type === "break") return <div key={i} style={{ textAlign: "center", margin: "20px 0", fontSize: 18, letterSpacing: "0.8em", color: "#8a7a66" }}>❧</div>;
          return null;
        })}
      </div>

      {/* Folio */}
      <div style={{ textAlign: "center", fontSize: 11, color: "#8a7a66", marginTop: 56, fontStyle: "italic" }}>— 7 —</div>

      <button onClick={() => setShowCover(true)} style={{ position: "fixed", bottom: 20, left: 20, background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)", padding: "6px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>← Cover</button>
    </div>
  );
};

// ─── BLANK ───────────────────────────────────────────────
const BlankShell = ({ shell }) => {
  const pad = `${48 * shell.marginScale}px ${32 * shell.marginScale}px`;
  const gridCols = shell.cols > 0 ? shell.cols : 12;
  return (
    <div style={{ maxWidth: shell.maxWidth, margin: "0 auto", padding: pad, fontFamily: shell.bodyFont, color: shell.fg }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap: 20 }}>
        {[...Array(gridCols)].map((_, i) => (
          <div key={i} style={{ minHeight: 80, border: "1px dashed var(--border)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--muted-foreground)" }}>
            {i + 1}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 40, textAlign: "center", color: "var(--muted-foreground)", fontSize: 14 }}>
        {gridCols}-col grid. Drop blocks anywhere. No chrome, no preset.
      </div>
    </div>
  );
};

// ─── Decorations (shared) ────────────────────────────────
const Ribbon = ({ color, position }) => (
  <div style={{
    position: "absolute", top: 0, [position === "left" ? "left" : "right"]: 40,
    width: 32, height: 96, background: color,
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)",
    boxShadow: "2px 2px 6px rgba(0,0,0,0.15)",
    pointerEvents: "none", zIndex: 10,
  }} />
);

const CornerOrnament = ({ glyph }) => (
  <div style={{ position: "absolute", top: 20, left: 20, fontSize: 28, color: "rgba(0,0,0,0.25)", pointerEvents: "none", zIndex: 5 }}>{glyph}</div>
);

const Bookmark = ({ label, color }) => (
  <div style={{
    position: "absolute", top: 120, right: -4, background: color, color: "#fff",
    padding: "6px 12px 6px 14px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 8px 100%, 0 50%)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)", pointerEvents: "none", zIndex: 10,
  }}>{label}</div>
);

window.Shells = { WikiShell, MagazineShell, NewspaperShell, BookShell, BlankShell };
window.Decorations = { Ribbon, CornerOrnament, Bookmark };
window.TEXTURES = TEXTURES;
