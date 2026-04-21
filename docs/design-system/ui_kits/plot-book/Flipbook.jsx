// Flipbook.jsx — real page-turn animation with rotateY + perspective
const FlipbookViewer = ({ pages, shell, renderPage }) => {
  const [idx, setIdx] = React.useState(0);
  const [turning, setTurning] = React.useState(null); // "next" | "prev" | null

  const turn = (dir) => {
    if (turning) return;
    const next = dir === "next" ? idx + 2 : idx - 2;
    if (next < 0 || next >= pages.length) return;
    setTurning(dir);
    setTimeout(() => {
      setIdx(next);
      setTurning(null);
    }, 600);
  };

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") turn("next");
      if (e.key === "ArrowLeft") turn("prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const leftPage = pages[idx];
  const rightPage = pages[idx + 1];
  const nextLeft = pages[idx + 2];
  const nextRight = pages[idx + 3];
  const prevLeft = pages[idx - 2];
  const prevRight = pages[idx - 1];

  const pageStyle = {
    width: 460, height: 620,
    background: shell.bg, color: shell.fg,
    fontFamily: shell.bodyFont,
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
    overflow: "hidden",
    position: "relative",
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "32px 20px", minHeight: "100vh",
      background: "linear-gradient(180deg, #2a2420 0%, #1a1612 100%)",
    }}>
      {/* Spread */}
      <div style={{ perspective: 2400, marginTop: 24 }}>
        <div style={{
          display: "flex", position: "relative",
          filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.4))",
        }}>
          {/* Left page (static) */}
          <div style={{ ...pageStyle, borderRight: "1px solid rgba(0,0,0,0.12)" }}>
            {leftPage && renderPage(leftPage, idx)}
            {/* Left gutter shadow */}
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 30, background: "linear-gradient(to left, rgba(0,0,0,0.15), transparent)", pointerEvents: "none" }} />
          </div>

          {/* Right page (the turning one) */}
          <div style={{ position: "relative", transformStyle: "preserve-3d" }}>
            {/* underneath: the page after the flip (next spread's right) */}
            {turning === "next" && nextRight && (
              <div style={{ ...pageStyle, position: "absolute", left: 0, top: 0 }}>
                {renderPage(nextRight, idx + 3)}
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 30, background: "linear-gradient(to right, rgba(0,0,0,0.15), transparent)", pointerEvents: "none" }} />
              </div>
            )}
            {/* turning page */}
            <div style={{
              ...pageStyle,
              transformOrigin: "left center",
              transform: turning === "next"
                ? "rotateY(-180deg)"
                : "rotateY(0deg)",
              transition: "transform 0.6s cubic-bezier(0.6, 0, 0.4, 1)",
              backfaceVisibility: "hidden",
              position: "relative",
              zIndex: 2,
            }}>
              {rightPage && renderPage(rightPage, idx + 1)}
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 30, background: "linear-gradient(to right, rgba(0,0,0,0.15), transparent)", pointerEvents: "none" }} />
            </div>
            {/* back side of turning page (what's on the verso after turn) */}
            <div style={{
              ...pageStyle,
              position: "absolute", top: 0, left: 0,
              transformOrigin: "left center",
              transform: turning === "next"
                ? "rotateY(-0deg)"
                : "rotateY(180deg)",
              transition: "transform 0.6s cubic-bezier(0.6, 0, 0.4, 1)",
              backfaceVisibility: "hidden",
              zIndex: 1,
            }}>
              {nextLeft && renderPage(nextLeft, idx + 2)}
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 30, background: "linear-gradient(to left, rgba(0,0,0,0.15), transparent)", pointerEvents: "none" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", padding: "8px 16px", borderRadius: 999, color: "#fff" }}>
        <button onClick={() => turn("prev")} disabled={idx === 0 || !!turning} style={{
          width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)",
          background: "transparent", color: "#fff", cursor: idx === 0 ? "not-allowed" : "pointer", fontSize: 16,
          opacity: idx === 0 ? 0.3 : 1,
        }}>‹</button>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.05em", minWidth: 60, textAlign: "center" }}>
          {idx + 1}–{Math.min(idx + 2, pages.length)} / {pages.length}
        </div>
        <button onClick={() => turn("next")} disabled={idx + 2 >= pages.length || !!turning} style={{
          width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)",
          background: "transparent", color: "#fff", cursor: idx + 2 >= pages.length ? "not-allowed" : "pointer", fontSize: 16,
          opacity: idx + 2 >= pages.length ? 0.3 : 1,
        }}>›</button>
        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.2)", margin: "0 6px" }} />
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>← → arrows</div>
      </div>

      {/* Thumbnail strip */}
      <div style={{ marginTop: 16, display: "flex", gap: 4, padding: 8, background: "rgba(255,255,255,0.04)", borderRadius: 8, maxWidth: 720, overflowX: "auto" }}>
        {pages.map((p, i) => (
          <div key={i} onClick={() => { if (!turning) setIdx(Math.floor(i / 2) * 2); }}
            style={{
              width: 28, height: 38, borderRadius: 2, cursor: "pointer",
              background: i === idx || i === idx + 1 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)",
              border: i === idx || i === idx + 1 ? "1px solid #fff" : "1px solid transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, color: i === idx || i === idx + 1 ? "#1a1612" : "rgba(255,255,255,0.6)",
              flexShrink: 0,
            }}>{i + 1}</div>
        ))}
      </div>
    </div>
  );
};

// Sample paginated content for flipbook demo
const SAMPLE_PAGES = [
  { kind: "cover", title: "Plot", subtitle: "a field guide to your own mind", author: "Peter Kwon" },
  { kind: "blank" },
  { kind: "titlepage", title: "Plot", author: "Peter Kwon", publisher: "PLOT EDITIONS" },
  { kind: "blank" },
  { kind: "chapter", num: "I", title: "On the slow habit" },
  { kind: "body", text: "It begins, as these things always begin, with a notebook. Not a special one — the kind of notebook one buys without ceremony at a station kiosk, spiral-bound, a little too small for the hand. The first entry is not momentous. It is the date and a sentence and perhaps a quotation copied from whatever book happened to be open on the kitchen table.", pageNo: 1 },
  { kind: "body", text: "The second entry, the next day, is much the same. It is only after some months, when the notebook has become thick with handling and its cover has begun to separate at the corners, that one looks back at what one has written and discovers, with a small shock, that a life has been there all along.", pageNo: 2 },
  { kind: "body", text: "Not a story — stories are tidy. A life: fragments that rhyme, returns that surprise.\n\n❧\n\nThis book is about that habit. The habit of writing down what you did not know you noticed.", pageNo: 3 },
  { kind: "chapter", num: "II", title: "The slip box" },
  { kind: "body", text: "Luhmann kept 90,000 notes. He did not intend to. He intended to read widely and remember what he read, and the slip box was the tool he built for that — a simple cabinet of index cards, each one bearing a single fragment, linked by number to others.", pageNo: 5 },
  { kind: "body", text: "The power of the slip box is not in its size but in its grain. A fragment is small enough to re-read in a minute. Ten fragments, together, become a paragraph. A hundred, an essay.", pageNo: 6 },
  { kind: "blank" },
];

const renderSamplePage = (p, idx) => {
  const pad = 40;
  const common = { padding: pad, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", fontFamily: "'Merriweather', Georgia, serif" };
  if (p.kind === "blank") return <div style={common} />;
  if (p.kind === "cover") return (
    <div style={{ ...common, background: "linear-gradient(180deg, #3a2d22 0%, #1f1912 100%)", color: "#f5efe2", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.6, marginTop: 40 }}>Plot Editions</div>
      <div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 52, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16 }}>{p.title}</div>
        <div style={{ fontStyle: "italic", fontSize: 16, opacity: 0.85 }}>{p.subtitle}</div>
      </div>
      <div style={{ fontSize: 14, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 40 }}>{p.author}</div>
    </div>
  );
  if (p.kind === "titlepage") return (
    <div style={{ ...common, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 700, marginBottom: 24 }}>{p.title}</div>
      <div style={{ fontSize: 14, letterSpacing: "0.1em", marginBottom: 60 }}>{p.author}</div>
      <div style={{ fontSize: 10, letterSpacing: "0.2em", opacity: 0.5, textTransform: "uppercase", marginTop: "auto", marginBottom: 20 }}>{p.publisher}</div>
    </div>
  );
  if (p.kind === "chapter") return (
    <div style={{ ...common, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 80, fontWeight: 400, opacity: 0.4, marginBottom: 24 }}>{p.num}</div>
      <div style={{ width: 60, height: 1, background: "currentColor", opacity: 0.3, marginBottom: 24 }} />
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, fontStyle: "italic" }}>{p.title}</div>
    </div>
  );
  return (
    <div style={{ ...common, justifyContent: "space-between" }}>
      <div style={{ fontSize: 10, opacity: 0.5, textAlign: idx % 2 === 0 ? "left" : "right", letterSpacing: "0.1em", textTransform: "uppercase" }}>Plot</div>
      <div style={{ flex: 1, paddingTop: 20, fontSize: 14, lineHeight: 1.75, textAlign: "justify", hyphens: "auto", whiteSpace: "pre-wrap", textIndent: "1.5em" }}>{p.text}</div>
      <div style={{ fontSize: 11, textAlign: "center", opacity: 0.5, fontVariantNumeric: "tabular-nums" }}>{p.pageNo}</div>
    </div>
  );
};

window.BookFlipbook = { FlipbookViewer, SAMPLE_PAGES, renderSamplePage };
