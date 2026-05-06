/* @jsx React.createElement */
const { useState: useStateA1 } = React;

// Mock data — Notes
const A1_NOTES = [
  { id:'n1', icon:'Brain', tone:'permanent', title:'Spaced repetition for design systems', status:'permanent', tags:['notes','learning','design-systems'], updated:'2h', wordCount:1240, links:8, backlinks:14, priority:'high' },
  { id:'n2', icon:'Layers', tone:'wiki', title:'Why Bento layouts work for dashboards', status:'permanent', tags:['design','layout'], updated:'4h', wordCount:890, links:5, backlinks:9, priority:'medium' },
  { id:'n3', icon:'Target', tone:'capture', title:'Plot v3 design directions — meeting notes', status:'capture', tags:['plot','meetings'], updated:'5h', wordCount:340, links:2, backlinks:3, priority:'medium' },
  { id:'n4', icon:'Beaker', tone:'inbox', title:'Linear\'s command palette implementation details', status:'inbox', tags:['linear','engineering'], updated:'yesterday', wordCount:180, links:1, backlinks:0, priority:'low' },
  { id:'n5', icon:'Sitemap', tone:'permanent', title:'Mercury banking — visual hierarchy breakdown', status:'permanent', tags:['fintech','design'], updated:'2d', wordCount:1820, links:12, backlinks:7, priority:'medium' },
  { id:'n6', icon:'Bold', tone:'permanent', title:'Graphic Anonymous on type pairing', status:'permanent', tags:['typography','reference'], updated:'3d', wordCount:670, links:6, backlinks:4, priority:'low' },
  { id:'n7', icon:'Zap', tone:'capture', title:'Why I quit Notion (again)', status:'capture', tags:['tools','productivity'], updated:'4d', wordCount:520, links:3, backlinks:2, priority:'medium' },
  { id:'n8', icon:'Network', tone:'inbox', title:'Obsidian graph view — what it gets wrong', status:'inbox', tags:['obsidian','graph','critique'], updated:'1w', wordCount:90, links:0, backlinks:0, priority:'low' },
  { id:'n9', icon:'Eye', tone:'permanent', title:'IA Writer\'s focus mode philosophy', status:'permanent', tags:['writing','tools'], updated:'1w', wordCount:1100, links:7, backlinks:5, priority:'low' },
  { id:'n10', icon:'Sunrise', tone:'capture', title:'Reflect.app — daily note pattern study', status:'capture', tags:['ai','daily-notes'], updated:'1w', wordCount:740, links:4, backlinks:2, priority:'medium' },
  { id:'n11', icon:'Sparkles', tone:'permanent', title:'On rhythm in long-form writing', status:'permanent', tags:['writing','craft'], updated:'2w', wordCount:2300, links:9, backlinks:11, priority:'high' },
  { id:'n12', icon:'Building', tone:'inbox', title:'Architecture of second brains — IndieWeb', status:'inbox', tags:['second-brain','reading'], updated:'2w', wordCount:60, links:0, backlinks:0, priority:'low' },
];

const A1_GROUPS = [
  { id:'today', label:'Today', range:'Wed · Nov 6' },
  { id:'yesterday', label:'Yesterday', range:'Tue · Nov 5' },
  { id:'thisweek', label:'This week', range:'Nov 1–4' },
  { id:'older', label:'Older' },
];

function aGroupFor(updated) {
  if (updated === '2h' || updated === '4h' || updated === '5h') return 'today';
  if (updated === 'yesterday') return 'yesterday';
  if (updated === '2d' || updated === '3d' || updated === '4d') return 'thisweek';
  return 'older';
}

const A1_TABS = [
  { id:'all', label:'All notes', count: 247 },
  { id:'inbox', label:'Inbox', count: 12, dot:'inbox' },
  { id:'capture', label:'Fleeting', count: 28, dot:'capture' },
  { id:'permanent', label:'Permanent', count: 184, dot:'permanent' },
  { id:'orphan', label:'Orphans', count: 6 },
];

function ANotesTable({ theme }) {
  const [activeTab, setActiveTab] = useStateA1('all');
  const [activeRow, setActiveRow] = useStateA1('n1');
  const [grouped, setGrouped] = useStateA1(true);
  const [actbarOpen, setActbarOpen] = useStateA1(true);
  const [sidebarOpen, setSidebarOpen] = useStateA1(true);
  const [detailOpen, setDetailOpen] = useStateA1(true);
  const [activeSpace, setActiveSpace] = useStateA1('notes');
  const [panelMenuOpen, setPanelMenuOpen] = useStateA1(false);

  const F = (name, fb) => window[name] || (fb && window[fb]) || window.Circle || (() => null);
  const Search = F('Search');
  const Plus = F('Plus');
  const Filter = F('Filter');
  const SlidersHorizontal = F('Sliders', 'Settings');
  const ChevronDown = F('ChevronDown');
  const Hash = F('Hash');
  const Inbox = F('Inbox');
  const Zap = F('Zap');
  const Star = F('Star');
  const Sun = F('Sun');
  const Calendar = F('Calendar');
  const FileText = F('FileText', 'FileIcon');
  const Network = F('Network');
  const Bell = F('Bell');
  const Settings = F('Settings');
  const Sidebar = F('Sidebar', 'Layers');
  const PanelLeft = F('Sidebar', 'Layers');
  const Info = F('Info', 'AlertCircle');
  const Menu = F('Menu', 'Sidebar');
  const Check = F('Check');
  const ChevronLeft = F('ChevronLeft');
  const ChevronRight = F('ChevronRight');
  const ArrowUpDown = F('Move', 'Layers');
  const Link2 = F('Link');
  const Layers = F('Layers');
  const Book = F('Book');
  const Library = F('Bookmarks', 'Book');
  const Brain = F('Brain');
  const Library2 = F('Bookmarks', 'Book');
  const Home = F('Home');
  const Notebook = F('Notebook', 'FileText');
  const Bookmarks = F('Bookmarks');

  const SPACES = [
    { c:'home', label:'Home', Icon: Home },
    { c:'notes', label:'Notes', Icon: FileText },
    { c:'wiki', label:'Wiki', Icon: window.WikiBook || Notebook },
    { c:'calendar', label:'Calendar', Icon: Calendar },
    { c:'ontology', label:'Ontology', Icon: window.OntologyWide || Network },
    { c:'library', label:'Library', Icon: window.Bookshelf || Book },
    { c:'books', label:'Books', Icon: Bookmarks },
  ];

  return (
    <div className="plot-app a-shell"
      data-actbar={actbarOpen ? 'open' : 'collapsed'}
      data-sidebar={sidebarOpen ? 'open' : 'collapsed'}
      data-detail={detailOpen ? 'open' : 'closed'}>
      {/* Activity bar */}
      <aside className="a-actbar">
        <div className="a-actbar__head">
          <div className="a-brand__mark">P</div>
        </div>
        {SPACES.map(({c, label, Icon}) => (
          <button key={c}
            className="a-ab a-ab--space"
            data-active={activeSpace === c}
            data-c={c}
            onClick={() => setActiveSpace(c)}>
            <Icon size={17} />
            <span className="a-ab__label">{label}</span>
          </button>
        ))}
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
          <input placeholder="Find a note…" />
          <kbd className="a-kbd">⌘K</kbd>
        </div>

        <div className="a-sb-scroll">
          <div className="a-sb-section">
            <div className="a-sb-section__head">Library</div>
            <button className="a-sb-link" data-active="true">
              <FileText size={15} />
              <span>All notes</span>
              <span className="a-sb-link__count tabular">247</span>
            </button>
            <button className="a-sb-link">
              <Inbox size={15} />
              <span>Inbox</span>
              <span className="a-sb-link__count tabular">12</span>
            </button>
            <button className="a-sb-link">
              <Zap size={15} />
              <span>Fleeting</span>
              <span className="a-sb-link__count tabular">28</span>
            </button>
            <button className="a-sb-link">
              <Brain size={15} />
              <span>Permanent</span>
              <span className="a-sb-link__count tabular">184</span>
            </button>
            <button className="a-sb-link">
              <Star size={15} />
              <span>Starred</span>
              <span className="a-sb-link__count tabular">23</span>
            </button>
          </div>

          <div className="a-sb-section">
            <div className="a-sb-section__head">
              <ChevronDown size={11} /> Workflows
            </div>
            <button className="a-sb-link"><span className="a-sb-link__dot" style={{background:'var(--status-inbox)'}}/><span>Triage queue</span><span className="a-sb-link__count tabular">12</span></button>
            <button className="a-sb-link"><span className="a-sb-link__dot" style={{background:'var(--status-capture)'}}/><span>Needs review</span><span className="a-sb-link__count tabular">7</span></button>
            <button className="a-sb-link"><span className="a-sb-link__dot" style={{background:'var(--priority-medium)'}}/><span>Stale &gt; 30d</span><span className="a-sb-link__count tabular">19</span></button>
            <button className="a-sb-link"><span className="a-sb-link__dot" style={{background:'var(--priority-low)'}}/><span>Orphans</span><span className="a-sb-link__count tabular">6</span></button>
          </div>

          <div className="a-sb-section">
            <div className="a-sb-section__head">
              <ChevronDown size={11} /> Tags
              <span className="a-sb-section__hint">15</span>
            </div>
            <button className="a-sb-link"><Hash size={14} /><span>design-systems</span><span className="a-sb-link__count tabular">42</span></button>
            <button className="a-sb-link"><Hash size={14} /><span>writing</span><span className="a-sb-link__count tabular">38</span></button>
            <button className="a-sb-link"><Hash size={14} /><span>tools</span><span className="a-sb-link__count tabular">29</span></button>
            <button className="a-sb-link"><Hash size={14} /><span>typography</span><span className="a-sb-link__count tabular">21</span></button>
            <button className="a-sb-link"><Hash size={14} /><span>second-brain</span><span className="a-sb-link__count tabular">17</span></button>
          </div>
        </div>

        <div className="a-sb-foot">
          <button className="a-sb-foot__primary"><Plus size={14}/> New note <kbd className="a-kbd a-kbd--inv">N</kbd></button>
        </div>
      </aside>

      {/* Workspace */}
      <main className="a-workspace">
        <header className="a-ws-head">
          <div className="a-ws-head__left">
            <div className="a-panel-menu" style={{position:'relative'}}>
              <button className="a-icb" title="Show panels" data-active={panelMenuOpen} onClick={(e) => { e.stopPropagation(); setPanelMenuOpen(!panelMenuOpen); }}>
                <Menu size={14} />
              </button>
              {panelMenuOpen && (
                <>
                  <div style={{position:'fixed', inset:0, zIndex:50}} onClick={() => setPanelMenuOpen(false)} />
                  <div className="a-popover" style={{left:0, right:'auto', minWidth:220, zIndex:51}}>
                    <div className="a-popover__section">
                      <div className="a-popover__label">Panels</div>
                      <button className="a-popover__item" data-active={actbarOpen} onClick={() => setActbarOpen(!actbarOpen)}>
                        <span>Activity bar</span>
                        {actbarOpen && <Check size={12}/>}
                      </button>
                      <button className="a-popover__item" data-active={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <span>Sidebar</span>
                        {sidebarOpen && <Check size={12}/>}
                      </button>
                      <button className="a-popover__item" data-active={detailOpen} onClick={() => setDetailOpen(!detailOpen)}>
                        <span>Detail</span>
                        {detailOpen && <Check size={12}/>}
                      </button>
                    </div>
                    <div className="a-popover__divider" />
                    <div className="a-popover__section">
                      <button className="a-popover__item" onClick={() => { setActbarOpen(true); setSidebarOpen(true); setDetailOpen(true); setPanelMenuOpen(false); }}>
                        <span>Show all panels</span>
                      </button>
                      <button className="a-popover__item" onClick={() => { setActbarOpen(false); setSidebarOpen(false); setDetailOpen(false); setPanelMenuOpen(false); }}>
                        <span>Hide all panels</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="a-crumbs">
              <span className="a-crumb">Notes</span>
              <span className="a-crumb__sep">/</span>
              <span className="a-crumb a-crumb--current">All notes</span>
            </div>
          </div>
          <div className="a-ws-head__right">
            <button className="a-ws-search">
              <Search size={12} />
              <span>Search…</span>
              <kbd className="a-kbd">⌘K</kbd>
            </button>
            <button className="a-icb"><Bell size={14} /></button>
            <button className="a-icb" title={detailOpen ? 'Hide details' : 'Show details'} data-active={detailOpen} onClick={() => setDetailOpen(!detailOpen)}>
              <Info size={14} />
            </button>
          </div>
        </header>

        {/* Tabs row (Linear-style) */}
        <div className="a-tabs-row">
          <div className="a-tabs">
            {A1_TABS.map(t => (
              <button key={t.id} className="a-tab" data-active={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}>
                {t.dot && <span className="a-tab__dot" style={{ background:`var(--status-${t.dot})` }} />}
                <span>{t.label}</span>
                <span className="a-tab__count tabular">{t.count}</span>
              </button>
            ))}
            <button className="a-tab a-tab--add"><Plus size={11}/></button>
          </div>
          <div className="a-tabs__right">
            <button className="a-tool"><Filter size={12}/> Filter</button>
            <button className="a-tool" data-active={grouped} onClick={() => setGrouped(!grouped)}>
              <Layers size={12}/> {grouped ? 'Grouped' : 'Flat'}
            </button>
            <button className="a-tool"><ArrowUpDown size={12}/> Updated</button>
            <button className="a-tool"><SlidersHorizontal size={12}/> Display</button>
          </div>
        </div>

        {/* Table */}
        <div className="a-table">
          {/* Column header */}
          <div className="a-th">
            <div className="a-th__cell" style={{ gridColumn:'1 / 2' }}>Title</div>
            <div className="a-th__cell">Tags</div>
            <div className="a-th__cell">Status</div>
            <div className="a-th__cell">Links</div>
            <div className="a-th__cell">Words</div>
            <div className="a-th__cell">Updated</div>
          </div>

          {grouped ? (
            A1_GROUPS.map(g => {
              const rows = A1_NOTES.filter(n => aGroupFor(n.updated) === g.id);
              if (!rows.length) return null;
              return (
                <div key={g.id}>
                  <div className="a-tg">
                    <ChevronDown size={11}/>
                    <span className="a-tg__label">{g.label}</span>
                    {g.range && <span className="a-tg__range mono">{g.range}</span>}
                    <span className="a-tg__count tabular">{rows.length}</span>
                    <div className="a-tg__line" />
                  </div>
                  {rows.map(n => <ARow key={n.id} n={n} active={activeRow === n.id} onClick={() => setActiveRow(n.id)} />)}
                </div>
              );
            })
          ) : (
            A1_NOTES.map(n => <ARow key={n.id} n={n} active={activeRow === n.id} onClick={() => setActiveRow(n.id)} />)
          )}

          <div className="a-th-foot">
            <span className="tabular">{A1_NOTES.length} of 247 notes</span>
            <span className="a-th-foot__sep">·</span>
            <span>Press <kbd className="a-kbd">↵</kbd> to open · <kbd className="a-kbd">Space</kbd> to peek</span>
          </div>
        </div>
      </main>

      {/* Detail panel */}
      {detailOpen && (() => {
        const note = A1_NOTES.find(n => n.id === activeRow) || A1_NOTES[0];
        const NoteIcon = window[note.icon] || (() => null);
        const statusLabel = { inbox:'Inbox', capture:'Fleeting', permanent:'Permanent' }[note.status];
        return (
          <aside className="a-detail">
            <div className="a-detail__head">
              <div className="a-detail__title">
                <span className="a-row__icon" data-tone={note.tone} style={{width:22, height:22}}>
                  <NoteIcon size={13} />
                </span>
                Details
              </div>
              <button className="a-icb" title="Close" onClick={() => setDetailOpen(false)}>
                <ChevronRight size={14} />
              </button>
            </div>
            <div className="a-detail__body">
              <div className="a-detail__group">
                <div className="a-detail__label">Title</div>
                <div className="a-detail__value" style={{fontWeight:600}}>{note.title}</div>
              </div>
              <div className="a-detail__group">
                <div className="a-detail__label">Status</div>
                <div className="a-detail__row">
                  <span className="a-stchip" data-st={note.status}>
                    <span className="a-stchip__dot" />
                    {statusLabel}
                  </span>
                  <span className="a-row__pri" style={{ background:`var(--priority-${note.priority})`, height:14 }} />
                  <span style={{fontSize:11.5, color:'var(--sidebar-muted)', textTransform:'capitalize'}}>{note.priority} priority</span>
                </div>
              </div>
              <div className="a-detail__stats">
                <div className="a-detail__stat">
                  <span className="a-detail__stat-num">{note.wordCount.toLocaleString()}</span>
                  <span className="a-detail__stat-lbl">Words</span>
                </div>
                <div className="a-detail__stat">
                  <span className="a-detail__stat-num">{note.links}</span>
                  <span className="a-detail__stat-lbl">Links</span>
                </div>
                <div className="a-detail__stat">
                  <span className="a-detail__stat-num">{note.backlinks}</span>
                  <span className="a-detail__stat-lbl">Backlinks</span>
                </div>
              </div>
              <div className="a-detail__group">
                <div className="a-detail__label">Tags</div>
                <div className="a-row__tags" style={{flexWrap:'wrap'}}>
                  {note.tags.map(t => <span key={t} className="a-tag"><Hash size={9}/>{t}</span>)}
                </div>
              </div>
              <div className="a-detail__group">
                <div className="a-detail__label">Updated</div>
                <div className="a-detail__value mono tabular" style={{fontSize:12.5, color:'var(--soft-fg)'}}>{note.updated} ago</div>
              </div>
              <div className="a-detail__group">
                <div className="a-detail__label">Excerpt</div>
                <div className="a-detail__excerpt">“The value of a note is not in the moment of capture, but in the moment of return. The system that helps you return is the one worth keeping…”</div>
              </div>
            </div>
          </aside>
        );
      })()}
    </div>
  );
}

function ARow({ n, active, onClick }) {
  const Hash = window.Hash || (() => null);
  const Link2 = window.Link || (() => null);

  const statusLabel = { inbox:'Inbox', capture:'Fleeting', permanent:'Permanent' }[n.status];
  const priColor = `var(--priority-${n.priority})`;

  return (
    <div className="a-row" data-active={active} onClick={onClick}>
      <div className="a-row__lead">
        <span className="a-row__pri" style={{ background: priColor }} />
        <span className="a-row__icon" data-tone={n.tone}>
          {(() => {
            const I = window[n.icon] || (() => null);
            return <I size={14} />;
          })()}
        </span>
        <span className="a-row__title">{n.title}</span>
      </div>
      <div className="a-row__cell a-row__tags">
        {n.tags.slice(0,2).map(t => <span key={t} className="a-tag"><Hash size={9}/>{t}</span>)}
        {n.tags.length > 2 && <span className="a-tag a-tag--more">+{n.tags.length - 2}</span>}
      </div>
      <div className="a-row__cell">
        <span className="a-stchip" data-st={n.status}>
          <span className="a-stchip__dot" />
          {statusLabel}
        </span>
      </div>
      <div className="a-row__cell a-row__links mono tabular">
        {n.links > 0 ? (
          <span className="a-links"><Link2 size={10}/> {n.links}<span className="a-links__sep">·</span>{n.backlinks}</span>
        ) : (
          <span className="a-links a-links--zero">—</span>
        )}
      </div>
      <div className="a-row__cell a-row__words mono tabular">
        {n.wordCount.toLocaleString()}
      </div>
      <div className="a-row__cell a-row__updated mono tabular">
        {n.updated}
      </div>
    </div>
  );
}

window.ANotesTable = ANotesTable;
