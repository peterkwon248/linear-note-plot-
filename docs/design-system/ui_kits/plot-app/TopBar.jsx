// TopBar.jsx — 52px top chrome
const ViewToggle = ({ view, setView }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 2, padding: 2, background: "var(--muted)", borderRadius: 6 }}>
    {[
      { id: "list", icon: IconList, label: "List" },
      { id: "board", icon: IconBoard, label: "Board" },
      { id: "table", icon: IconTable, label: "Table" },
    ].map(({ id, icon: Icon, label }) => (
      <button key={id} onClick={() => setView(id)} title={label} style={{
        width: 28, height: 24, border: 0, borderRadius: 4, cursor: "pointer",
        background: view === id ? "var(--background)" : "transparent",
        color: view === id ? "var(--foreground)" : "var(--muted-foreground)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: view === id ? "var(--shadow-xs)" : "none",
        transition: "background var(--transition-default)",
      }}>
        <Icon size={14} />
      </button>
    ))}
  </div>
);

const Chip = ({ children, onClick }) => (
  <button onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 6, height: 26, padding: "0 10px",
    border: "1px dashed var(--border)", borderRadius: 6, background: "transparent",
    color: "var(--muted-foreground)", fontSize: 12.5, fontFamily: "inherit", cursor: "pointer",
    transition: "border-color var(--transition-default), color var(--transition-default)",
  }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--foreground)"; e.currentTarget.style.color = "var(--foreground)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted-foreground)"; }}
  >
    {children}
  </button>
);

const TopBar = ({ title, subtitle, view, setView, onNew }) => (
  <div style={{
    height: 52, borderBottom: "1px solid var(--border-subtle)",
    display: "flex", alignItems: "center", padding: "0 16px", gap: 14,
    background: "var(--background)", flexShrink: 0,
  }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{title}</div>
      {subtitle ? <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{subtitle}</div> : null}
    </div>
    <div style={{ flex: 1 }} />
    <Chip><IconFilter size={12} /> Filter</Chip>
    <Chip><IconSort size={12} /> Sort</Chip>
    <div style={{ width: 1, height: 20, background: "var(--border)" }} />
    <ViewToggle view={view} setView={setView} />
    <button onClick={onNew} style={{
      display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px",
      borderRadius: 6, background: "var(--foreground)", color: "var(--background)",
      border: 0, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
      transition: "opacity var(--transition-default)",
    }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
    >
      <IconPlus size={14} /> New Note <span style={{ opacity: 0.5, marginLeft: 4, fontFamily: "var(--font-mono)", fontSize: 11 }}>C</span>
    </button>
  </div>
);

window.TopBar = TopBar;
