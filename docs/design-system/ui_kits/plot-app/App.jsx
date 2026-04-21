// App.jsx — wires everything together
const App = () => {
  const [nav, setNav] = React.useState(() => localStorage.getItem("plot.nav") || "capture");
  const [view, setView] = React.useState(() => localStorage.getItem("plot.view") || "list");
  const [selected, setSelected] = React.useState("NOT-214");
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [theme, setTheme] = React.useState(() => localStorage.getItem("plot.theme") || "light");

  React.useEffect(() => { localStorage.setItem("plot.nav", nav); }, [nav]);
  React.useEffect(() => { localStorage.setItem("plot.view", view); }, [view]);
  React.useEffect(() => {
    localStorage.setItem("plot.theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdOpen(true); }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const notes = window.SAMPLE_NOTES;
  const filtered = React.useMemo(() => {
    if (nav === "inbox")     return notes.filter(n => n.kind === "inbox");
    if (nav === "capture")   return notes.filter(n => n.kind === "capture");
    if (nav === "permanent") return notes.filter(n => n.kind === "permanent");
    return notes;
  }, [nav, notes]);

  const selectedNote = notes.find(n => n.id === selected);

  const titles = {
    home: { t: "Home", s: "Everything at a glance" },
    inbox: { t: "Inbox", s: `${filtered.length} to triage` },
    capture: { t: "Capture", s: `${filtered.length} in development` },
    permanent: { t: "Permanent", s: `${filtered.length} evergreen notes` },
    wiki: { t: "Wiki", s: "Long-form, connected" },
    graph: { t: "Graph", s: "The shape of your thinking" },
    calendar: { t: "Calendar", s: "Due + review schedule" },
  };
  const th = titles[nav] || { t: "Plot", s: "" };

  const runCommand = (id) => {
    if (id === "new-note") return;
    if (id === "theme") return setTheme(theme === "dark" ? "light" : "dark");
    const navMap = { capture: "capture", inbox: "inbox", permanent: "permanent", wiki: "wiki" };
    if (navMap[id]) setNav(navMap[id]);
  };

  return (
    <div data-screen-label="00 Plot App" style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "var(--background)", color: "var(--foreground)" }}>
      <ActivityBar current={nav} onNav={setNav} />
      <Sidebar current={nav} onNav={setNav} onOpenCommand={() => setCmdOpen(true)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar title={th.t} subtitle={th.s} view={view} setView={setView} onNew={() => {}} />

        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* List column */}
          <div style={{ width: view === "board" ? "auto" : 520, flexShrink: 0, borderRight: view === "board" ? 0 : "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", minHeight: 0, flex: view === "board" ? 1 : "none" }}>
            {view === "list"  ? <NoteList notes={filtered} selectedId={selected} onSelect={setSelected} /> : null}
            {view === "board" ? <Board    notes={filtered} onSelect={(id) => { setSelected(id); setView("list"); }} /> : null}
            {view === "table" ? <NoteList notes={filtered} selectedId={selected} onSelect={setSelected} /> : null}
          </div>

          {view !== "board" ? (
            <Editor note={selectedNote} onPromote={() => {}} />
          ) : null}
        </div>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onRun={runCommand} />

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        style={{
          position: "fixed", bottom: 14, right: 14, height: 28, padding: "0 10px",
          borderRadius: 6, border: "1px solid var(--border)", background: "var(--background)",
          color: "var(--foreground)", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          display: "inline-flex", alignItems: "center", gap: 6,
          boxShadow: "var(--shadow-sm)",
        }}
      >{theme === "dark" ? "☾ Dark" : "☀ Light"}</button>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
