// CommandPalette.jsx — ⌘K modal
const CommandPalette = ({ open, onClose, onRun }) => {
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  if (!open) return null;

  const items = [
    { id: "new-note", label: "New Note", hint: "C", icon: IconPlus, section: "Actions" },
    { id: "capture", label: "Go to Capture", hint: "G C", icon: IconCapture, section: "Navigation" },
    { id: "inbox", label: "Go to Inbox", hint: "G I", icon: IconInbox, section: "Navigation" },
    { id: "permanent", label: "Go to Permanent", hint: "G P", icon: IconPermanent, section: "Navigation" },
    { id: "wiki", label: "Open Wiki", hint: "G W", icon: IconWiki, section: "Navigation" },
    { id: "snooze", label: "Snooze selected note", hint: "S", icon: IconSnooze, section: "Actions" },
    { id: "promote", label: "Promote to Permanent", hint: "P", icon: IconPermanent, section: "Actions" },
    { id: "theme", label: "Toggle theme", hint: "⌘ ⇧ T", icon: IconSettings, section: "Preferences" },
  ];

  const filtered = q ? items.filter(i => i.label.toLowerCase().includes(q.toLowerCase())) : items;
  const sections = {};
  filtered.forEach(i => { (sections[i.section] ||= []).push(i); });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "12vh", zIndex: 100,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 560, maxHeight: "60vh", display: "flex", flexDirection: "column",
        background: "var(--popover)", borderRadius: 12, overflow: "hidden",
        boxShadow: "var(--shadow-popover)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
          <IconSearch size={16} style={{ color: "var(--muted-foreground)" }} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search or run a command…"
            style={{
              flex: 1, border: 0, outline: 0, background: "transparent",
              fontSize: 15, color: "var(--foreground)", fontFamily: "inherit",
            }} />
          <span className="kbd">Esc</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 6 }}>
          {Object.entries(sections).map(([sec, its]) => (
            <div key={sec}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", padding: "10px 10px 6px" }}>{sec}</div>
              {its.map(it => (
                <CommandRow key={it.id} item={it} onRun={() => { onRun(it.id); onClose(); }} />
              ))}
            </div>
          ))}
          {filtered.length === 0 ? (
            <div style={{ padding: "28px 14px", textAlign: "center", fontSize: 13, color: "var(--muted-foreground)" }}>No commands match "{q}"</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const CommandRow = ({ item, onRun }) => {
  const [hover, setHover] = React.useState(false);
  const Icon = item.icon;
  return (
    <div
      onClick={onRun}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
        borderRadius: 6, cursor: "pointer",
        background: hover ? "var(--hover-bg)" : "transparent",
        color: "var(--foreground)",
      }}
    >
      <Icon size={15} style={{ color: "var(--muted-foreground)" }} />
      <span style={{ flex: 1, fontSize: 14 }}>{item.label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted-foreground)" }}>{item.hint}</span>
    </div>
  );
};

window.CommandPalette = CommandPalette;
