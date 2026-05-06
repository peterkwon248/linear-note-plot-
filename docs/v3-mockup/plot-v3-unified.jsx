/* @jsx React.createElement */
/* Plot v3 — Unified shell hosting 5 view modes
 *
 * Reuses the A-direction sidebar/activity bar (a-actbar, a-sidebar) so users
 * see one consistent navigation surface; the workspace center swaps between
 * Table / Gallery / Studio / Editorial / Graph based on viewMode state.
 */
const { useState: useStateU, useMemo: useMemoU } = React;

function PlotUnified({ theme, defaultMode = 'table' }) {
  const [viewMode, setViewMode] = useStateU(defaultMode);
  const [activeTab, setActiveTab] = useStateU('all');
  const [activeNoteId, setActiveNoteId] = useStateU('n1');
  const [activeSpace, setActiveSpace] = useStateU('notes');
  const [actbarOpen, setActbarOpen] = useStateU(true);
  const [sidebarOpen, setSidebarOpen] = useStateU(true);
  const [detailOpen, setDetailOpen] = useStateU(false);
  const [grouped, setGrouped] = useStateU(true);
  const [query, setQuery] = useStateU('');
  const [filterOpen, setFilterOpen] = useStateU(false);
  const [filterAnchor, setFilterAnchor] = useStateU(null);
  const filterBtnRef = React.useRef(null);

  const openFilter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setFilterAnchor({ left: rect.left, bottom: rect.bottom });
    setFilterOpen(true);
  };

  const D = window.PlotData;
  const F = (name, fb) => window[name] || (fb && window[fb]) || window.Circle || (() => null);

  const Search = F('Search'); const Plus = F('Plus'); const Filter = F('Filter');
  const Sliders = F('Sliders', 'Settings'); const ChevronDown = F('ChevronDown');
  const ChevronRight = F('ChevronRight');
  const Hash = F('Hash'); const Inbox = F('Inbox'); const Zap = F('Zap');
  const Star = F('Star'); const Calendar = F('Calendar');
  const FileText = F('FileText', 'FileIcon'); const Network = F('Network');
  const Bell = F('Bell'); const Settings = F('Settings');
  const Info = F('Info', 'AlertCircle'); const Menu = F('Menu', 'Sidebar');
  const Layers = F('Layers'); const Book = F('Book');
  const Brain = F('Brain'); const Home = F('Home');
  const Notebook = F('Notebook', 'FileText'); const Bookmarks = F('Bookmarks');
  const Grid = F('Grid', 'Layers'); const Table = F('Table', 'List');
  const BookOpen = F('BookOpen', 'Book'); const ArrowUpDown = F('Move', 'Layers');

  const VIEW_ICONS = { table: Table, gallery: Grid, studio: Layers, editorial: BookOpen, graph: Network };

  // Filtered notes
  const visibleNotes = useMemoU(
    () => D.filterNotes(D.NOTES, { tab: activeTab, query }),
    [activeTab, query]
  );

  const activeNote = D.NOTES.find(n => n.id === activeNoteId) || D.NOTES[0];

  const sharedProps = {
    notes: visibleNotes,
    allNotes: D.NOTES,
    activeNoteId, setActiveNoteId,
    grouped, setGrouped,
    theme,
  };

  return (
    <div className="plot-app a-shell u-shell"
      data-actbar={actbarOpen ? 'open' : 'collapsed'}
      data-sidebar={sidebarOpen ? 'open' : 'collapsed'}
      data-detail={detailOpen ? 'open' : 'closed'}>

      {/* Activity bar */}
      <aside className="a-actbar">
        <div className="a-actbar__head"><div className="a-brand__mark">P</div></div>
        {D.SPACES.map(s => {
          const Icon = F(s.icon);
          return (
            <button key={s.id} className="a-ab a-ab--space"
              data-active={activeSpace === s.id} data-c={s.id}
              onClick={() => setActiveSpace(s.id)}>
              <Icon size={17} />
              <span className="a-ab__label">{s.label}</span>
            </button>
          );
        })}
        <div style={{flex:1}} />
        <button className="a-ab" title="Settings">
          <Settings size={17} />
          <span className="a-ab__label">Settings</span>
        </button>
      </aside>

      {/* Sidebar */}
      <aside className="a-sidebar">
        <div className="a-sb-head">
          <div className="a-sb-title">
            <span className="a-sb-dot" style={{ background:'var(--space-notes)' }} />
            Notes
          </div>
          <div className="a-sb-actions">
            <button className="a-icb" title="New note"><Plus size={14} /></button>
            <button className="a-icb" title="Filter"><Filter size={14} /></button>
          </div>
        </div>

        <div className="a-sb-search">
          <Search size={13} />
          <input placeholder="Find a note…"
            value={query} onChange={e => setQuery(e.target.value)} />
          <kbd className="a-kbd">⌘K</kbd>
        </div>

        <div className="a-sb-scroll">
          <div className="a-sb-section">
            <div className="a-sb-section__head">Library</div>
            <button className="a-sb-link" data-active={activeTab === 'all'} onClick={() => setActiveTab('all')}>
              <FileText size={15} /><span>All notes</span>
              <span className="a-sb-link__count tabular">247</span>
            </button>
            <button className="a-sb-link" data-active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')}>
              <Inbox size={15} /><span>Inbox</span>
              <span className="a-sb-link__count tabular">12</span>
            </button>
            <button className="a-sb-link" data-active={activeTab === 'capture'} onClick={() => setActiveTab('capture')}>
              <Zap size={15} /><span>Fleeting</span>
              <span className="a-sb-link__count tabular">28</span>
            </button>
            <button className="a-sb-link" data-active={activeTab === 'permanent'} onClick={() => setActiveTab('permanent')}>
              <Brain size={15} /><span>Permanent</span>
              <span className="a-sb-link__count tabular">184</span>
            </button>
            <button className="a-sb-link">
              <Star size={15} /><span>Starred</span>
              <span className="a-sb-link__count tabular">23</span>
            </button>
          </div>

          <div className="a-sb-section">
            <div className="a-sb-section__head"><ChevronDown size={11} /> Tags <span className="a-sb-section__hint">{D.TAGS.length}</span></div>
            {D.TAGS.slice(0,5).map(t => (
              <button key={t.id} className="a-sb-link">
                <Hash size={14} /><span>{t.id}</span>
                <span className="a-sb-link__count tabular">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="a-sb-foot">
          <button className="a-sb-foot__primary"><Plus size={14}/> New note <kbd className="a-kbd a-kbd--inv">N</kbd></button>
        </div>
      </aside>

      {/* Workspace */}
      <main className="a-workspace">
        {/* Top header — view switcher + global tools */}
        <header className="u-head">
          <div className="u-head__left">
            <button className="a-icb" title="Toggle sidebar" data-active={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={14} />
            </button>
            <div className="u-head__title">All notes</div>
            <div className="u-head__sub">{visibleNotes.length} of 247 · synced 2m ago</div>
          </div>
          <div className="u-head__right">
            {/* Filter button (Linear-style popover) */}
            <button className="a-tool" onClick={openFilter} data-active={filterOpen}>
              <Filter size={12}/> Filter
            </button>
            {/* View switcher */}
            <div className="u-vs" role="tablist" aria-label="View mode">
              {D.VIEW_MODES.map(v => {
                const Icon = VIEW_ICONS[v.id] || Layers;
                return (
                  <button key={v.id} className="u-vs__btn"
                    data-active={viewMode === v.id}
                    onClick={() => setViewMode(v.id)}
                    title={v.hint}>
                    <Icon size={13} /> {v.label}
                  </button>
                );
              })}
            </div>
            <button className="a-icb"><Bell size={14} /></button>
            <button className="a-icb" title={detailOpen ? 'Hide details' : 'Show details'}
              data-active={detailOpen} onClick={() => setDetailOpen(!detailOpen)}>
              <Info size={14} />
            </button>
          </div>
        </header>

        {/* Mode body */}
        <div className="u-mode" data-mode={viewMode}>
          {viewMode === 'table'     && <UTableMode {...sharedProps} />}
          {viewMode === 'gallery'   && <UGalleryMode {...sharedProps} />}
          {viewMode === 'studio'    && <UStudioMode {...sharedProps} />}
          {viewMode === 'editorial' && <UEditorialMode {...sharedProps} />}
          {viewMode === 'graph'     && <UGraphMode {...sharedProps} />}
        </div>
      </main>

      {/* Detail panel — shared, mode-agnostic */}
      {detailOpen && <UDetailPanel note={activeNote} onClose={() => setDetailOpen(false)} />}

      {/* Linear-style filter popover */}
      <PlotFilterMenu
        open={filterOpen}
        anchorRect={filterAnchor}
        onClose={() => setFilterOpen(false)} />
    </div>
  );
}

window.PlotUnified = PlotUnified;
