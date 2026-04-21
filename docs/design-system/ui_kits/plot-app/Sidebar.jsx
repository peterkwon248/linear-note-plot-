// Sidebar.jsx — 220px nav column
const NavRow = ({ icon: Icon, label, count, active, onClick, depth = 0 }) => (
  <div
    onClick={onClick}
    className={"plot-nav-row" + (active ? " is-active" : "")}
    style={{
      display: "flex", alignItems: "center", gap: 8, height: 28,
      padding: `0 10px 0 ${10 + depth * 14}px`,
      borderRadius: 6, cursor: "pointer", fontSize: 14,
      transition: "background var(--transition-default), color var(--transition-default)",
    }}
  >
    {Icon ? <Icon size={16} className="plot-nav-row-icon" style={{ flexShrink: 0 }} /> : <span style={{ width: 16 }} />}
    <span style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{label}</span>
    {count != null ? <span style={{ fontSize: 12, color: "var(--sidebar-count)", fontVariantNumeric: "tabular-nums" }}>{count}</span> : null}
  </div>
);

const SectionHeader = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
    color: "var(--sidebar-muted)", padding: "14px 10px 4px",
  }}>{children}</div>
);

const Sidebar = ({ current, onNav, onOpenCommand }) => (
  <div style={{
    width: 220, background: "var(--sidebar-bg)",
    borderRight: "1px solid var(--sidebar-border)",
    padding: "10px 8px", overflowY: "auto", flexShrink: 0,
    display: "flex", flexDirection: "column", gap: 2,
  }}>
    <button
      onClick={onOpenCommand}
      style={{
        display: "flex", alignItems: "center", gap: 8, height: 32, padding: "0 10px",
        borderRadius: 6, border: "1px solid var(--border)", background: "var(--background)",
        color: "var(--muted-foreground)", fontSize: 13, cursor: "pointer",
        marginBottom: 6, fontFamily: "inherit",
      }}
    >
      <IconSearch size={14} />
      <span>Search</span>
      <span style={{ flex: 1 }} />
      <span className="kbd">⌘</span><span className="kbd">K</span>
    </button>

    <NavRow icon={IconHome} label="Home" active={current === "home"} onClick={() => onNav("home")} />
    <NavRow icon={IconInbox} label="Inbox" count={14} active={current === "inbox"} onClick={() => onNav("inbox")} />
    <NavRow icon={IconCapture} label="Capture" count={37} active={current === "capture"} onClick={() => onNav("capture")} />
    <NavRow icon={IconPermanent} label="Permanent" count={216} active={current === "permanent"} onClick={() => onNav("permanent")} />
    <NavRow icon={IconWiki} label="Wiki" active={current === "wiki"} onClick={() => onNav("wiki")} />
    <NavRow icon={IconGraph} label="Graph" active={current === "graph"} onClick={() => onNav("graph")} />

    <SectionHeader>Favorites</SectionHeader>
    <NavRow icon={IconFolder} label="Design research" onClick={() => {}} />
    <NavRow icon={IconFolder} label="Product strategy" onClick={() => {}} />
    <NavRow icon={IconTag} label="#reading" depth={0} onClick={() => {}} />

    <SectionHeader>Review</SectionHeader>
    <NavRow icon={IconClock} label="Due today" count={8} onClick={() => {}} />
    <NavRow icon={IconSnooze} label="Snoozed" count={3} onClick={() => {}} />
    <NavRow icon={IconArchive} label="Archive" onClick={() => {}} />
  </div>
);

window.Sidebar = Sidebar;
window.NavRow = NavRow;
