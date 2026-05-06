/* @jsx React.createElement */
const { useState: useStateCA } = React;

// Mock data — extended with excerpts for cards
const CA_NOTES = [
  { id:'n1', icon:'Brain',     tone:'permanent', title:'Spaced repetition for design systems', excerpt:'The Anki model is too rigid. The Roam/Obsidian model is too passive. Somewhere between is a system that resurfaces notes when you start writing about a related topic.', tags:['notes','learning'], updated:'2h', wordCount:1240, links:8, backlinks:14 },
  { id:'n2', icon:'Layers',    tone:'permanent', title:'Why Bento layouts work for dashboards', excerpt:'Bento boxes give you visual rhythm without rigid grids. Each cell becomes a thought; you can vary density without breaking the page.', tags:['design','layout'], updated:'4h', wordCount:890, links:5, backlinks:9 },
  { id:'n3', icon:'Target',    tone:'capture',   title:'Plot v3 design directions — meeting notes', excerpt:'Two directions: Linear-precision (A) and Studio OS (C). C has three subdirections — Atelier, Pro Studio, Editorial.', tags:['plot','meetings'], updated:'5h', wordCount:340, links:2, backlinks:3 },
  { id:'n4', icon:'Beaker',    tone:'inbox',     title:'Linear\'s command palette implementation', excerpt:'Fuzzy match scores boost recently-used commands; mode awareness; nested menus collapse on Esc.', tags:['linear','engineering'], updated:'yesterday', wordCount:180, links:1, backlinks:0 },
  { id:'n5', icon:'Sitemap',   tone:'permanent', title:'Mercury banking — visual hierarchy breakdown', excerpt:'Mercury treats numbers as the primary citizen — large tabular figures, small captions, generous whitespace. Banking apps usually invert this.', tags:['fintech','design'], updated:'2d', wordCount:1820, links:12, backlinks:7 },
  { id:'n6', icon:'Bold',      tone:'permanent', title:'Graphic Anonymous on type pairing', excerpt:'A serif and a sans rarely fight if they share a vertical proportion and contrast level. The trouble is mixing two voices that both want to lead.', tags:['typography'], updated:'3d', wordCount:670, links:6, backlinks:4 },
  { id:'n7', icon:'Zap',       tone:'capture',   title:'Why I quit Notion (again)', excerpt:'Notion is best at the wrong things — bases and blocks — and worst at the only thing I want: writing without ceremony.', tags:['tools','productivity'], updated:'4d', wordCount:520, links:3, backlinks:2 },
  { id:'n8', icon:'Network',   tone:'inbox',     title:'Obsidian graph view — what it gets wrong', excerpt:'The graph reflects link topology, not meaning. Two notes about wildly different things appear close because they share a tag.', tags:['obsidian','critique'], updated:'1w', wordCount:90, links:0, backlinks:0 },
  { id:'n9', icon:'Eye',       tone:'permanent', title:'IA Writer\'s focus mode philosophy', excerpt:'Focus mode is not just dim text — it\'s a constraint. You can only edit one paragraph at a time, so you commit before moving on.', tags:['writing','tools'], updated:'1w', wordCount:1100, links:7, backlinks:5 },
  { id:'n10', icon:'Sunrise',  tone:'capture',   title:'Reflect.app — daily note pattern study', excerpt:'A daily note that is the entry point, but every snippet inside it is also a first-class note. Cross-references happen at the line level.', tags:['ai','daily-notes'], updated:'1w', wordCount:740, links:4, backlinks:2 },
  { id:'n11', icon:'Sparkles', tone:'permanent', title:'On rhythm in long-form writing', excerpt:'Sentences need varying length the way a song needs rests. The longest sentence comes after the shortest. Pace is rhythm, not speed.', tags:['writing','craft'], updated:'2w', wordCount:2300, links:9, backlinks:11 },
  { id:'n12', icon:'Building', tone:'inbox',     title:'Architecture of second brains — IndieWeb', excerpt:'IndieWeb thinks of the second brain as a set of interlinked sites, not a single app. Backlinks are HTTP requests, not graph edges.', tags:['second-brain'], updated:'2w', wordCount:60, links:0, backlinks:0 },
];

const CA_GROUPS = [
  { id:'today',     label:'Today',     sub:'Wed · Nov 6' },
  { id:'yesterday', label:'Yesterday', sub:'Tue · Nov 5' },
  { id:'thisweek',  label:'This week', sub:'Nov 1 — 4' },
  { id:'older',     label:'Older' },
];

function caGroupFor(updated) {
  if (updated === '2h' || updated === '4h' || updated === '5h') return 'today';
  if (updated === 'yesterday') return 'yesterday';
  if (updated === '2d' || updated === '3d' || updated === '4d') return 'thisweek';
  return 'older';
}

const CA_CHIPS = [
  { id:'all',       label:'All',       count: 247 },
  { id:'inbox',     label:'Inbox',     count: 12,  tone:'inbox' },
  { id:'capture',   label:'Fleeting',  count: 28,  tone:'capture' },
  { id:'permanent', label:'Permanent', count: 184, tone:'permanent' },
  { id:'wiki',      label:'Wiki',      count: 23,  tone:'wiki' },
];

const CA_TRAY_TOOLS = [
  { id:'home',     iconName:'Home',     label:'Home' },
  { id:'notes',    iconName:'FileText', label:'Notes', count: 247 },
  { id:'capture',  iconName:'Zap',      label:'Capture', count: 28 },
  { id:'graph',    iconName:'Network',  label:'Graph' },
  { id:'tags',     iconName:'Hash',     label:'Tags' },
  { id:'calendar', iconName:'Calendar', label:'Daily' },
  { id:'star',     iconName:'Star',     label:'Favorites', count: 23 },
];

function CANotesCanvas({ theme }) {
  const [activeChip, setActiveChip] = useStateCA('all');
  const [activeNote, setActiveNote] = useStateCA('n1');
  const [trayOpen, setTrayOpen] = useStateCA(true);
  const [contextOpen, setContextOpen] = useStateCA(true);
  const [activeTool, setActiveTool] = useStateCA('notes');
  const [panelMenuOpen, setPanelMenuOpen] = useStateCA(false);

  const F = (name, fb) => window[name] || (fb && window[fb]) || (() => null);
  const Search = F('Search');
  const Plus = F('Plus');
  const Filter = F('Filter');
  const Sliders = F('Sliders');
  const Bell = F('Bell');
  const Info = F('Info');
  const ChevronLeft = F('ChevronLeft');
  const ChevronRight = F('ChevronRight');
  const Settings = F('Settings');
  const Menu = F('Menu');
  const Check = F('Check');
  const Link2 = F('Link');
  const Hash = F('Hash');
  const Tag = F('Tag', 'Hash');
  const ArrowUpDown = F('Move', 'Layers');
  const Layers = F('Layers');
  const FileText = F('FileText');

  const byId = Object.fromEntries(CA_NOTES.map(n => [n.id, n]));
  const filtered = activeChip === 'all' ? CA_NOTES : CA_NOTES.filter(n => n.tone === activeChip);
  const grouped = CA_GROUPS.map(g => ({
    ...g,
    notes: filtered.filter(n => caGroupFor(n.updated) === g.id),
  })).filter(g => g.notes.length > 0);

  const current = byId[activeNote] || CA_NOTES[0];

  return (
    <div className="ca-app" style={{ position:'relative' }}>
      {/* Tool tray */}
      {trayOpen && (
        <aside className="ca-tray" style={{ position:'relative' }}>
          <button className="ca-tray__close" title="Hide tools" onClick={() => setTrayOpen(false)}><ChevronLeft size={12}/></button>
          <div className="ca-tray__brand">P</div>
          {CA_TRAY_TOOLS.map((t, i) => {
            const Ico = F(t.iconName);
            return (
              <React.Fragment key={t.id}>
                {i === 4 && <div className="ca-tray__sep" />}
                <button className="ca-tool" data-active={activeTool === t.id} onClick={() => setActiveTool(t.id)} title={t.label}>
                  <Ico size={17} />
                  {t.count != null && <span className="ca-tool__count tabular">{t.count}</span>}
                  <span className="ca-tool__label">{t.label.slice(0,5)}</span>
                </button>
              </React.Fragment>
            );
          })}
          <div className="ca-tray__spacer" />
          <button className="ca-tool" title="Settings"><Settings size={17}/><span className="ca-tool__label">Set</span></button>
        </aside>
      )}
      {!trayOpen && (
        <button className="ca-edge ca-edge--tray" title="Show tools" onClick={() => setTrayOpen(true)}>
          <ChevronRight size={11}/>
        </button>
      )}

      {/* Main canvas */}
      <section className="ca-canvas">
        {/* Masthead */}
        <header className="ca-mast">
          <div className="ca-mast__left">
            <div style={{position:'relative'}}>
              <button className="ca-icb" title="Show panels" data-active={panelMenuOpen} onClick={(e) => { e.stopPropagation(); setPanelMenuOpen(!panelMenuOpen); }} style={{marginRight:8}}>
                <Menu size={14}/>
              </button>
              {panelMenuOpen && (
                <>
                  <div style={{position:'fixed', inset:0, zIndex:55}} onClick={() => setPanelMenuOpen(false)} />
                  <div className="ca-pop">
                    <div className="ca-pop__label">Panels</div>
                    <button className="ca-pop__row" onClick={() => setTrayOpen(!trayOpen)}>
                      <span>Tool tray</span>{trayOpen && <Check size={12}/>}
                    </button>
                    <button className="ca-pop__row" onClick={() => setContextOpen(!contextOpen)}>
                      <span>Context panel</span>{contextOpen && <Check size={12}/>}
                    </button>
                    <div className="ca-pop__sep" />
                    <button className="ca-pop__row" onClick={() => { setTrayOpen(true); setContextOpen(true); setPanelMenuOpen(false); }}>
                      <span>Show all</span>
                    </button>
                    <button className="ca-pop__row" onClick={() => { setTrayOpen(false); setContextOpen(false); setPanelMenuOpen(false); }}>
                      <span>Hide all</span>
                    </button>
                  </div>
                </>
              )}
            </div>
            <h1 className="ca-mast__title serif">Notes</h1>
            <span className="ca-mast__sub">a working catalogue</span>
          </div>
          <div className="ca-mast__right">
            <span className="ca-mast__date">Nov · Wed 06 · 2025</span>
            <button className="ca-search">
              <Search size={12}/>
              <span>Search…</span>
              <kbd>⌘K</kbd>
            </button>
            <button className="ca-icb"><Bell size={14}/></button>
            <button className="ca-icb" title="New note"><Plus size={14}/></button>
            <button className="ca-icb" data-active={contextOpen} title={contextOpen ? 'Hide context' : 'Show context'} onClick={() => setContextOpen(!contextOpen)}>
              <Info size={14}/>
            </button>
          </div>
        </header>

        {/* Filter chips */}
        <div className="ca-filters">
          {CA_CHIPS.map(c => (
            <button key={c.id} className="ca-chip" data-active={activeChip === c.id} onClick={() => setActiveChip(c.id)}>
              {c.tone && <span className="ca-chip__dot" style={{ background: `var(--ca-${c.tone === 'permanent' ? 'moss' : c.tone === 'capture' ? 'mustard' : c.tone === 'wiki' ? 'rust' : 'ink-4'})` }} />}
              <span>{c.label}</span>
              <span className="ca-chip__count">{c.count}</span>
            </button>
          ))}
          <div className="ca-filters__spacer" />
          <button className="ca-filters__tool"><Filter size={11}/> Filter</button>
          <button className="ca-filters__tool"><ArrowUpDown size={11}/> Updated</button>
          <button className="ca-filters__tool"><Sliders size={11}/> Display</button>
        </div>

        {/* Canvas with cards */}
        <div className="ca-scroll">
          {grouped.map(g => (
            <div key={g.id} className="ca-section">
              <div className="ca-section__head">
                <h2 className="ca-section__title">{g.label}</h2>
                {g.sub && <span className="ca-section__sub">— {g.sub}</span>}
                <span className="ca-section__count">{g.notes.length} notes</span>
              </div>
              <div className="ca-grid">
                {g.notes.map(n => {
                  const Ico = F(n.icon, 'FileText');
                  return (
                    <button key={n.id} className="ca-card" data-active={activeNote === n.id} onClick={() => setActiveNote(n.id)}>
                      <div className="ca-card__head">
                        <span className="ca-card__icon" data-tone={n.tone}><Ico size={14}/></span>
                        <span className="ca-card__meta">
                          <span className="ca-card__dot" data-tone={n.tone}/>
                          <span>{n.tone}</span>
                        </span>
                      </div>
                      <h3 className="ca-card__title">{n.title}</h3>
                      <p className="ca-card__excerpt">{n.excerpt}</p>
                      <div className="ca-card__foot">
                        {n.tags.slice(0,2).map(t => (
                          <span key={t} className="ca-card__tag">#{t}</span>
                        ))}
                        <span className="ca-card__stat">
                          <span><Link2 size={9}/>{n.links}</span>
                          <span className="ca-card__time">{n.updated}</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Context panel */}
      {contextOpen && (
        <aside className="ca-context">
          <div className="ca-context__head">
            <div className="ca-context__head-text">
              <div className="ca-context__eyebrow">{current.tone} · {current.updated}</div>
              <h3 className="ca-context__title">{current.title}</h3>
            </div>
            <button className="ca-context__close" title="Close" onClick={() => setContextOpen(false)}>
              <ChevronRight size={14}/>
            </button>
          </div>
          <div className="ca-context__body">
            <div className="ca-prop">
              <div className="ca-prop__label">Excerpt</div>
              <div className="ca-prop__value" style={{ display:'block', fontFamily:'var(--ca-serif)', fontSize:13.5, fontStyle:'italic', color:'var(--ca-ink-2)', lineHeight:1.5 }}>
                "{current.excerpt}"
              </div>
            </div>
            <div className="ca-prop">
              <div className="ca-prop__label">Tags</div>
              <div className="ca-prop__row">
                {current.tags.map(t => <span key={t} className="ca-prop__chip">#{t}</span>)}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="ca-prop">
                <div className="ca-prop__label">Words</div>
                <div className="ca-prop__value tabular" style={{ fontFamily:'var(--font-mono)' }}>{current.wordCount.toLocaleString()}</div>
              </div>
              <div className="ca-prop">
                <div className="ca-prop__label">Links</div>
                <div className="ca-prop__value tabular" style={{ fontFamily:'var(--font-mono)' }}>{current.links} → · ← {current.backlinks}</div>
              </div>
            </div>
            <div className="ca-prop">
              <div className="ca-prop__label">Backlinks</div>
              <div className="ca-bl-list">
                {CA_NOTES.filter(n => n.id !== current.id).slice(0, 4).map(n => (
                  <button key={n.id} className="ca-bl-item" onClick={() => setActiveNote(n.id)}>
                    <span className="ca-bl-item__dot" style={{ background:`var(--ca-${n.tone === 'permanent' ? 'moss' : n.tone === 'capture' ? 'mustard' : n.tone === 'wiki' ? 'rust' : 'ink-4'})` }}/>
                    <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.title}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="ca-prop">
              <div className="ca-prop__label">Outgoing links</div>
              <div className="ca-bl-list">
                {CA_NOTES.filter(n => n.id !== current.id).slice(2, 5).map(n => (
                  <button key={n.id} className="ca-bl-item" onClick={() => setActiveNote(n.id)}>
                    <span className="ca-bl-item__dot" style={{ background:`var(--ca-${n.tone === 'permanent' ? 'moss' : n.tone === 'capture' ? 'mustard' : n.tone === 'wiki' ? 'rust' : 'ink-4'})` }}/>
                    <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}
      {!contextOpen && (
        <button className="ca-edge ca-edge--ctx" title="Show context" onClick={() => setContextOpen(true)}>
          <ChevronLeft size={11}/>
        </button>
      )}
    </div>
  );
}

window.CANotesCanvas = CANotesCanvas;
