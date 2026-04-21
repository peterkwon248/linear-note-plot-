// MainAppDemo.jsx — Plot main app with "Book" in sidebar
const PlotMainAppDemo = ({ onBack }) => {
  const [activeBook, setActiveBook] = React.useState("spaced-repetition");

  const books = [
    { id: "spaced-repetition", title: "Spaced repetition", shell: "wiki", when: "2d", kind: "Encyclopedia" },
    { id: "commonplace", title: "The quiet return of the commonplace book", shell: "magazine", when: "5d", kind: "Essay" },
    { id: "field-guide", title: "Plot — a field guide to your own mind", shell: "book", when: "1w", kind: "Novel" },
    { id: "plot-times", title: "The Plot Times — Oct 14", shell: "newspaper", when: "2w", kind: "Digest" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "var(--font-sans)", background: "var(--background)" }}>
      {/* Activity bar */}
      <div style={{ width: 44, background: "#f5f5f7", borderRight: "1px solid #e2e3e8", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0", gap: 4 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "#1a1a2e", color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>P</div>
        {["⌂", "✉", "✎", "◆", "📖", "◌"].map((g, i) => (
          <button key={i} style={{ width: 32, height: 32, border: 0, borderRadius: 6, background: g === "📖" ? "rgba(0,0,0,0.06)" : "transparent", cursor: "pointer", fontSize: 14, color: "#1a1a2e" }}>{g}</button>
        ))}
      </div>

      {/* Sidebar */}
      <div style={{ width: 240, background: "#f5f5f7", borderRight: "1px solid #e2e3e8", padding: 10, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        <button onClick={onBack} style={{ padding: "6px 10px", marginBottom: 6, border: "1px solid #e2e3e8", borderRadius: 6, background: "#fff", fontSize: 12, cursor: "pointer", textAlign: "left", color: "#6b7280" }}>← Back to kit index</button>
        {[
          { l: "Home", c: null },
          { l: "Inbox", c: 14 },
          { l: "Capture", c: 37 },
          { l: "Permanent", c: 216 },
          { l: "Book", c: 4, active: true, highlight: true },
          { l: "Graph", c: null },
        ].map((r, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", height: 28, padding: "0 10px",
            borderRadius: 6, fontSize: 14, cursor: "pointer",
            background: r.active ? "rgba(0,0,0,0.06)" : "transparent",
            color: r.active ? "#1a1a2e" : "#1a1a2e",
            fontWeight: r.active ? 500 : 400,
          }}>
            <span style={{ flex: 1 }}>{r.l}</span>
            {r.c != null && <span style={{ fontSize: 12, color: "#9ca3af" }}>{r.c}</span>}
          </div>
        ))}
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", padding: "14px 10px 4px" }}>Your Books</div>
        {books.map(b => (
          <div key={b.id} onClick={() => setActiveBook(b.id)} style={{
            display: "flex", alignItems: "center", gap: 8, height: 28, padding: "0 10px",
            borderRadius: 6, fontSize: 13, cursor: "pointer",
            background: activeBook === b.id ? "rgba(94,106,210,0.08)" : "transparent",
            color: "#1a1a2e",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background:
              b.shell === "wiki" ? "#5e6ad2" :
              b.shell === "magazine" ? "#f2994a" :
              b.shell === "newspaper" ? "#111" :
              b.shell === "book" ? "#9b1c1c" : "#ccc" }} />
            <span style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{b.title}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: 52, borderBottom: "1px solid #e2e3e8", display: "flex", alignItems: "center", padding: "0 16px", gap: 14, background: "#fff" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Book</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{books.length} books · pick a shell, make it yours</div>
          </div>
          <div style={{ flex: 1 }} />
          <button style={{ height: 30, padding: "0 12px", borderRadius: 6, background: "#1a1a2e", color: "#fff", border: 0, fontSize: 13, cursor: "pointer" }}>+ New Book</button>
        </div>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18, padding: 24, overflowY: "auto", background: "#fafbfc" }}>
          {books.map(b => (
            <div key={b.id} style={{
              background: "#fff", borderRadius: 10, overflow: "hidden", cursor: "pointer",
              border: activeBook === b.id ? "1.5px solid #5e6ad2" : "1px solid #e2e3e8",
              boxShadow: activeBook === b.id ? "0 4px 16px rgba(94,106,210,0.14)" : "0 1px 2px rgba(0,0,0,0.04)",
              transition: "box-shadow 0.2s, border-color 0.2s",
            }} onClick={() => setActiveBook(b.id)}>
              <div style={{ height: 150, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", position: "relative",
                background: b.shell === "wiki" ? "linear-gradient(135deg, #5e6ad2, #4a52b8)" :
                           b.shell === "magazine" ? "linear-gradient(135deg, #faf7f0, #e8dfce)" :
                           b.shell === "newspaper" ? "linear-gradient(135deg, #f4efe6, #d8cfbf)" :
                           "linear-gradient(135deg, #3a2d22, #1f1912)",
                color: b.shell === "magazine" || b.shell === "newspaper" ? "#1a1a1a" : "#fff",
              }}>
                <div style={{ textAlign: "center", padding: 20 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.7, marginBottom: 10 }}>{b.kind}</div>
                  <div style={{ fontFamily: b.shell === "wiki" ? "var(--font-sans)" : "'Playfair Display', serif", fontSize: b.title.length > 30 ? 16 : 22, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.015em" }}>{b.title}</div>
                </div>
              </div>
              <div style={{ padding: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>{b.shell}</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: "#9ca3af" }}>{b.when}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

window.PlotMainAppDemo = PlotMainAppDemo;
