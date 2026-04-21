// ActivityBar.jsx — 44px left rail
const ActivityBar = ({ current, onNav }) => {
  const items = [
    { id: "home", icon: IconHome, label: "Home" },
    { id: "inbox", icon: IconInbox, label: "Inbox", badge: 14 },
    { id: "capture", icon: IconCapture, label: "Capture" },
    { id: "permanent", icon: IconPermanent, label: "Permanent" },
    { id: "wiki", icon: IconWiki, label: "Wiki" },
    { id: "graph", icon: IconGraph, label: "Graph" },
    { id: "calendar", icon: IconCalendar, label: "Calendar" },
  ];
  return (
    <div style={{
      width: 44, background: "var(--sidebar-bg)",
      borderRight: "1px solid var(--sidebar-border)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "8px 0", gap: 2, flexShrink: 0,
    }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--foreground)", color: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, marginBottom: 8, letterSpacing: "-0.02em" }}>P</div>
      {items.map(({ id, icon: Icon, label, badge }) => {
        const active = current === id;
        return (
          <button
            key={id}
            onClick={() => onNav(id)}
            title={label}
            style={{
              width: 32, height: 32, border: 0, borderRadius: 6, cursor: "pointer",
              background: active ? "var(--sidebar-active)" : "transparent",
              color: active ? "var(--sidebar-active-text)" : "var(--sidebar-icon)",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", transition: "background var(--transition-default), color var(--transition-default)",
            }}
            onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--sidebar-hover)"; e.currentTarget.style.color = "var(--sidebar-hover-text)"; }}}
            onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sidebar-icon)"; }}}
          >
            <Icon size={18} />
            {badge ? <span style={{ position: "absolute", top: 2, right: 2, width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} /> : null}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <button title="Settings" style={{ width: 32, height: 32, border: 0, borderRadius: 6, background: "transparent", color: "var(--sidebar-icon)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <IconSettings size={16} />
      </button>
    </div>
  );
};

window.ActivityBar = ActivityBar;
