// Editor.jsx — Tiptap-style editor surface
const EditorToolbarButton = ({ icon: Icon, active, onClick, title }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: 28, height: 28, border: 0, borderRadius: 4, cursor: "pointer",
        background: active ? "var(--toolbar-active)" : hover ? "var(--hover-bg)" : "transparent",
        color: active ? "var(--accent)" : "var(--muted-foreground)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background var(--transition-default), color var(--transition-default)",
      }}>
      <Icon size={14} />
    </button>
  );
};

const Editor = ({ note, onPromote }) => {
  if (!note) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", gap: 10, background: "var(--background)" }}>
        <IconCapture size={28} style={{ opacity: 0.3 }} />
        <div style={{ fontSize: 14 }}>Select a note</div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>Or press <span className="kbd">C</span> to capture a new one</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--background)", overflow: "hidden" }}>
      {/* Note header strip */}
      <div style={{ height: 44, display: "flex", alignItems: "center", padding: "0 20px", gap: 10, borderBottom: "1px solid var(--border-subtle)" }}>
        <StatusDot kind={note.kind} />
        <span style={{ fontSize: 13, color: "var(--muted-foreground)", textTransform: "capitalize" }}>{note.kind}</span>
        <span style={{ color: "var(--muted-foreground)" }}>·</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted-foreground)" }}>{note.id}</span>
        <span style={{ flex: 1 }} />
        {note.ready ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 8px", borderRadius: 6, background: "rgba(69,212,131,0.1)", color: "#047857", fontSize: 12, fontWeight: 500 }}>
            <IconSparkle size={11} /> Ready to promote
          </div>
        ) : null}
        <button onClick={onPromote} style={{
          display: "inline-flex", alignItems: "center", gap: 6, height: 28, padding: "0 10px",
          border: "1px solid var(--border)", borderRadius: 6, background: "var(--background)",
          color: "var(--foreground)", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit",
        }}>Promote <span className="kbd">P</span></button>
        <IconMore size={16} style={{ color: "var(--muted-foreground)", cursor: "pointer" }} />
      </div>

      {/* Toolbar */}
      <div style={{ height: 36, display: "flex", alignItems: "center", padding: "0 12px", gap: 2, borderBottom: "1px solid var(--border-subtle)" }}>
        <EditorToolbarButton icon={IconBold} title="Bold ⌘B" />
        <EditorToolbarButton icon={IconItalic} title="Italic ⌘I" />
        <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px" }} />
        <EditorToolbarButton icon={IconQuote} title="Quote" />
        <EditorToolbarButton icon={IconList} title="List" />
        <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px" }} />
        <EditorToolbarButton icon={IconLink} title="Link ⌘K" />
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>saved · 2s ago</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 48px" }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2, marginTop: 0, marginBottom: 16, color: "var(--foreground)" }}>{note.title}</h1>

          <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            {(note.tags || []).map(t => <Tag key={t} name={t} />)}
          </div>

          <div style={{ fontSize: 15, lineHeight: 1.75, letterSpacing: "-0.01em", color: "var(--foreground)" }}>
            {(note.body || []).map((block, i) => {
              if (block.type === "p") return <p key={i} style={{ marginBottom: 16 }}>{block.text}</p>;
              if (block.type === "h2") return <h2 key={i} style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-0.015em", marginTop: 32, marginBottom: 12 }}>{block.text}</h2>;
              if (block.type === "quote") return (
                <blockquote key={i} style={{ borderLeft: "2px solid var(--border)", padding: "4px 0 4px 20px", margin: "20px 0", color: "var(--muted-foreground)", fontStyle: "italic" }}>{block.text}</blockquote>
              );
              if (block.type === "code") return (
                <pre key={i} style={{ background: "var(--editor-code-bg)", padding: 14, borderRadius: 6, margin: "16px 0", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.5, overflow: "auto" }}>{block.text}</pre>
              );
              if (block.type === "ul") return (
                <ul key={i} style={{ paddingLeft: 22, marginBottom: 16 }}>
                  {block.items.map((it, j) => <li key={j} style={{ marginBottom: 4 }}>{it}</li>)}
                </ul>
              );
              if (block.type === "link-back") return (
                <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 8px", borderRadius: 4, background: "var(--muted)", color: "var(--foreground)", fontSize: 13, marginRight: 4, cursor: "pointer" }}>
                  <IconLink size={11} /> {block.text}
                </div>
              );
              return null;
            })}
          </div>

          {/* Backlinks */}
          <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
            <div className="text-label" style={{ marginBottom: 10 }}>Linked from</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", color: "var(--foreground)", fontSize: 13 }}>
                <IconLink size={12} style={{ color: "var(--muted-foreground)" }} /> How I take notes in 2026
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", color: "var(--foreground)", fontSize: 13 }}>
                <IconLink size={12} style={{ color: "var(--muted-foreground)" }} /> Tools for thought, a reading list
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Editor = Editor;
