// NoteList.jsx — list, board, and inbox views
const tagTints = {
  method:   { bg: "#ede9fe", fg: "#6d28d9" },
  design:   { bg: "#ecfccb", fg: "#4d7c0f" },
  writing:  { bg: "#fef3c7", fg: "#b45309" },
  product:  { bg: "#e0f2fe", fg: "#0369a1" },
  research: { bg: "#fce7f3", fg: "#be185d" },
  reading:  { bg: "#ffedd5", fg: "#c2410c" },
  idea:     { bg: "#e0e7ff", fg: "#4338ca" },
};

const Tag = ({ name }) => {
  const t = tagTints[name] || { bg: "var(--muted)", fg: "var(--muted-foreground)" };
  return <span style={{
    fontSize: 11, padding: "1px 6px", borderRadius: 4, background: t.bg, color: t.fg, fontWeight: 500, whiteSpace: "nowrap",
  }}>{name}</span>;
};

const StatusDot = ({ kind }) => {
  const colors = { capture: "#f2994a", permanent: "#7c3aed", inbox: "#6b7280", ready: "#45d483" };
  return <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors[kind] || "#6b7280", display: "inline-block", flexShrink: 0 }} />;
};

const NoteRow = ({ note, selected, onClick }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "18px 16px 62px 1fr auto auto 18px",
        gap: 10, alignItems: "center", height: 36, padding: "0 14px",
        borderRadius: 6, cursor: "pointer",
        background: selected ? "rgba(94,106,210,0.08)" : hover ? "var(--hover-bg)" : "transparent",
        transition: "background var(--transition-default)",
      }}
    >
      <div style={{
        width: 14, height: 14, borderRadius: 3, border: "1.5px solid var(--border)",
        opacity: (hover || selected) ? 1 : 0, transition: "opacity var(--transition-default)",
        background: selected ? "var(--accent)" : "transparent",
        borderColor: selected ? "var(--accent)" : "var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{selected ? <IconCheck size={10} style={{ color: "#fff" }} /> : null}</div>
      <StatusDot kind={note.kind} />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted-foreground)" }}>{note.id}</span>
      <span style={{ fontSize: 14, color: "var(--foreground)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{note.title}</span>
      <div style={{ display: "flex", gap: 4 }}>{(note.tags || []).map(t => <Tag key={t} name={t} />)}</div>
      <span style={{ fontSize: 12, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{note.when}</span>
      <IconMore size={14} style={{ color: "var(--muted-foreground)", opacity: hover ? 1 : 0, transition: "opacity var(--transition-default)" }} />
    </div>
  );
};

const NoteList = ({ notes, selectedId, onSelect }) => (
  <div style={{ padding: "8px 12px", overflowY: "auto" }}>
    {notes.map(n => (
      <NoteRow key={n.id} note={n} selected={selectedId === n.id} onClick={() => onSelect(n.id)} />
    ))}
  </div>
);

const BoardCard = ({ note, onClick }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: "var(--card)", borderRadius: 8, padding: 12, cursor: "pointer",
        border: "1px solid var(--border-subtle)",
        boxShadow: hover ? "var(--shadow-md)" : "none",
        transition: "box-shadow var(--transition-default)",
        display: "flex", flexDirection: "column", gap: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <StatusDot kind={note.kind} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted-foreground)" }}>{note.id}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{note.when}</span>
      </div>
      <div style={{ fontSize: 13.5, color: "var(--foreground)", lineHeight: 1.35, fontWeight: 500 }}>{note.title}</div>
      {note.preview ? <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{note.preview}</div> : null}
      <div style={{ display: "flex", gap: 4, marginTop: 2 }}>{(note.tags || []).map(t => <Tag key={t} name={t} />)}</div>
    </div>
  );
};

const Board = ({ notes, onSelect }) => {
  const cols = [
    { id: "inbox", label: "Inbox", filter: n => n.kind === "inbox" },
    { id: "capture", label: "Capture", filter: n => n.kind === "capture" },
    { id: "permanent", label: "Permanent", filter: n => n.kind === "permanent" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, padding: 20, overflowY: "auto", alignItems: "start" }}>
      {cols.map(col => {
        const items = notes.filter(col.filter);
        return (
          <div key={col.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px" }}>
              <StatusDot kind={col.id} />
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)" }}>{col.label}</span>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{items.length}</span>
            </div>
            {items.map(n => <BoardCard key={n.id} note={n} onClick={() => onSelect(n.id)} />)}
          </div>
        );
      })}
    </div>
  );
};

window.NoteList = NoteList;
window.Board = Board;
window.Tag = Tag;
window.StatusDot = StatusDot;
