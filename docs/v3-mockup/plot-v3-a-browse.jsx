/* @jsx React.createElement */
const { useState: useStateA2, useRef: useRefA2, useEffect: useEffectA2 } = React;

const A2_NOTES = [
  { id:'b1', icon:'Brain', tone:'permanent', title:'Spaced repetition for design systems', preview:'The interval problem: how do you remind yourself of a design pattern not when you remember it, but when you would have forgotten it?', updated:'2h', status:'permanent', wordCount:1240, links:8, tags:['notes','learning','design-systems'] },
  { id:'b2', icon:'Layers', tone:'wiki', title:'Why Bento layouts work for dashboards', preview:'Asymmetric grids reduce cognitive load by giving each region a distinct shape. The eye learns the layout once, then navigates by silhouette.', updated:'4h', status:'permanent', wordCount:890, links:5, tags:['design','layout'] },
  { id:'b3', icon:'Target', tone:'capture', title:'Plot v3 design directions — meeting notes', preview:'Two directions on the table: A is precision/connectivity, C is editorial/asymmetric. The decision is less about taste than about what users want to do here.', updated:'5h', status:'capture', wordCount:340, links:2, tags:['plot','meetings'] },
  { id:'b4', icon:'Beaker', tone:'inbox', title:"Linear's command palette — implementation", preview:'Fuzzy match with bias toward recency. Verbs first, nouns second. The whole product becomes addressable through one input.', updated:'yesterday', status:'inbox', wordCount:180, links:1, tags:['linear','engineering'] },
  { id:'b5', icon:'Sitemap', tone:'permanent', title:'Mercury banking — visual hierarchy breakdown', preview:'Numbers always have the most weight. Everything else recedes. The interface treats financial data as the protagonist of every screen.', updated:'2d', status:'permanent', wordCount:1820, links:12, tags:['fintech','design'] },
  { id:'b6', icon:'Bold', tone:'permanent', title:'Graphic Anonymous on type pairing', preview:'Pair a workhorse with a personality. The workhorse handles 90% of text; the personality handles brand moments. Mixing two workhorses is mush.', updated:'3d', status:'permanent', wordCount:670, links:6, tags:['typography','reference'] },
  { id:'b7', icon:'Zap', tone:'capture', title:'Why I quit Notion (again)', preview:'The tool became an end in itself. I was organizing the system more than using it. A second brain that demands constant maintenance is a job.', updated:'4d', status:'capture', wordCount:520, links:3, tags:['tools','productivity'] },
  { id:'b8', icon:'Eye', tone:'permanent', title:"IA Writer's focus mode philosophy", preview:'Focus mode hides everything except the current sentence. Not the paragraph — the sentence. The constraint forces you to commit to one thought at a time.', updated:'1w', status:'permanent', wordCount:1100, links:7, tags:['writing','tools'] },
];

const A2_BACKLINKS = [
  { id:'bl1', icon:'Network', title:'Knowledge graph as memory aid', excerpt:'…closely related to spaced repetition principles, where review intervals…' },
  { id:'bl2', icon:'Brain', title:'Anki vs. RemNote — workflow comparison', excerpt:'…the SRS algorithm derived from spaced repetition for design systems…' },
  { id:'bl3', icon:'Sparkles', title:'On rhythm in long-form writing', excerpt:'…the same memory science that makes spaced repetition work…' },
];

function ABrowseMode({ theme }) {
  const [activeId, setActiveId] = useStateA2('b1');
  const [actbarOpen, setActbarOpen] = useStateA2(true);
  const [navOpen, setNavOpen] = useStateA2(true);
  const [listOpen, setListOpen] = useStateA2(true);
  const [detailOpen, setDetailOpen] = useStateA2(true);
  const [activeSpace, setActiveSpace] = useStateA2('notes');
  const [activeNav, setActiveNav] = useStateA2('all');
  const [panelMenuOpen, setPanelMenuOpen] = useStateA2(false);
  const [displayOpen, setDisplayOpen] = useStateA2(false);
  const [sortBy, setSortBy] = useStateA2('updated');
  const [groupBy, setGroupBy] = useStateA2('none');
  const [density, setDensity] = useStateA2('comfortable');
  const [editorDisplayOpen, setEditorDisplayOpen] = useStateA2(false);
  const [fontScale, setFontScale] = useStateA2('normal');
  const [columnWidth, setColumnWidth] = useStateA2('medium');
  const [focusMode, setFocusMode] = useStateA2(false);

  const F = (name, fb) => window[name] || (fb && window[fb]) || window.Circle || (() => null);
  const Search = F('Search');
  const Plus = F('Plus');
  const Filter = F('Filter');
  const ChevronDown = F('ChevronDown');
  const ChevronLeft = F('ChevronLeft');
  const ChevronRight = F('ChevronRight');
  const Hash = F('Hash');
  const Inbox = F('Inbox');
  const Zap = F('Zap');
  const Star = F('Star');
  const Calendar = F('Calendar');
  const FileText = F('FileText', 'FileIcon');
  const Network = F('Network');
  const Bell = F('Bell');
  const Settings = F('Settings');
  const Sidebar = F('Sidebar', 'Layers');
  const PanelLeft = F('Sidebar', 'Layers');
  const Info = F('Info', 'AlertCircle');
  const Menu = F('Menu', 'Sidebar');
  const Book = F('Book');
  const Bookmarks = F('Bookmarks');
  const Brain = F('Brain');
  const Home = F('Home');
  const Notebook = F('Notebook', 'FileText');
  const Link2 = F('Link');
  const MoreHorizontal = F('MoreHorizontal', 'Settings');
  const SlidersHorizontal = F('Sliders', 'Settings');
  const ArrowUpDown = F('Move', 'Layers');
  const Check = F('Check');
  const Eye = F('Eye');
  const Type = F('Bold', 'FileText');

  const SPACES = [
    { c:'home', label:'Home', Icon: Home },
    { c:'notes', label:'Notes', Icon: FileText },
    { c:'wiki', label:'Wiki', Icon: window.WikiBook || Notebook },
    { c:'calendar', label:'Calendar', Icon: Calendar },
    { c:'ontology', label:'Ontology', Icon: window.OntologyWide || Network },
    { c:'library', label:'Library', Icon: window.Bookshelf || Book },
    { c:'books', label:'Books', Icon: Bookmarks },
  ];

  const NAV_ITEMS = [
    { id:'all', label:'All notes', count:247, Icon: FileText },
    { id:'inbox', label:'Inbox', count:12, Icon: Inbox },
    { id:'fleeting', label:'Fleeting', count:28, Icon: Zap },
    { id:'permanent', label:'Permanent', count:184, Icon: Brain },
    { id:'starred', label:'Starred', count:23, Icon: Star },
  ];

  const note = A2_NOTES.find(n => n.id === activeId) || A2_NOTES[0];
  const NoteIcon = window[note.icon] || (() => null);
  const statusLabel = { inbox:'Inbox', capture:'Fleeting', permanent:'Permanent' }[note.status];

  // Close popovers on outside click
  useEffectA2(() => {
    const onClick = (e) => {
      if (!e.target.closest('.a-popover') && !e.target.closest('[data-pop-trigger]')) {
        setDisplayOpen(false);
        setEditorDisplayOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="plot-app a-shell a-shell--browse5"
      data-actbar={actbarOpen ? 'open' : 'collapsed'}
      data-nav={navOpen ? 'open' : 'collapsed'}
      data-list={listOpen ? 'open' : 'collapsed'}
      data-detail={detailOpen ? 'open' : 'closed'}>

      {/* Activity bar */}
      <aside className="a-actbar">
        <div className="a-actbar__head">
          <div className="a-brand__mark">P</div>
          <button className="a-actbar__close" title="Close activity bar (⌘⇧\\)" onClick={() => setActbarOpen(false)}>
            <ChevronLeft size={13} />
          </button>
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

      {/* Space sidebar — Notes navigation */}
      <aside className="a-sidebar a-sidebar--nav">
        <div className="a-sb-head">
          <div className="a-sb-title">
            <span className="a-sb-dot" style={{ background:'var(--space-notes)' }} />
            Notes
          </div>
          <div className="a-sb-actions">
            <button className="a-icb" title="New note"><Plus size={14} /></button>
            <button className="a-icb" title="Close sidebar (⌘\\)" onClick={() => setNavOpen(false)}><ChevronLeft size={13}/></button>
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
            {NAV_ITEMS.map(it => (
              <button key={it.id} className="a-sb-link" data-active={activeNav === it.id} onClick={() => setActiveNav(it.id)}>
                <it.Icon size={15} />
                <span>{it.label}</span>
                <span className="a-sb-link__count tabular">{it.count}</span>
              </button>
            ))}
          </div>

          <div className="a-sb-section">
            <div className="a-sb-section__head">
              <ChevronDown size={11} /> Tags <span className="a-sb-section__hint">15</span>
            </div>
            <button className="a-sb-link"><Hash size={14} /><span>design-systems</span><span className="a-sb-link__count tabular">42</span></button>
            <button className="a-sb-link"><Hash size={14} /><span>writing</span><span className="a-sb-link__count tabular">38</span></button>
            <button className="a-sb-link"><Hash size={14} /><span>tools</span><span className="a-sb-link__count tabular">29</span></button>
            <button className="a-sb-link"><Hash size={14} /><span>typography</span><span className="a-sb-link__count tabular">21</span></button>
          </div>
        </div>
      </aside>

      {/* Notes list */}
      <aside className="a-sidebar a-sidebar--browse">
        <div className="a-sb-head">
          <div className="a-sb-title">
            All notes
            <span className="a-sb-link__count tabular" style={{marginLeft:6}}>247</span>
          </div>
          <div className="a-sb-actions" style={{position:'relative'}}>
            <button className="a-icb" title="Filter"><Filter size={14} /></button>
            <button className="a-icb" data-pop-trigger data-active={displayOpen} title="Display options" onClick={(e) => { e.stopPropagation(); setDisplayOpen(!displayOpen); setEditorDisplayOpen(false); }}>
              <SlidersHorizontal size={14} />
            </button>
            <button className="a-icb" title="Close list" onClick={() => setListOpen(false)}><ChevronLeft size={13}/></button>
            {displayOpen && (
              <div className="a-popover a-popover--list">
                <div className="a-popover__section">
                  <div className="a-popover__label">Sort by</div>
                  {[
                    {v:'updated', l:'Updated'},
                    {v:'created', l:'Created'},
                    {v:'title', l:'Title'},
                    {v:'links', l:'Most linked'},
                  ].map(o => (
                    <button key={o.v} className="a-popover__item" data-active={sortBy === o.v} onClick={() => setSortBy(o.v)}>
                      <span>{o.l}</span>
                      {sortBy === o.v && <Check size={12} />}
                    </button>
                  ))}
                </div>
                <div className="a-popover__divider" />
                <div className="a-popover__section">
                  <div className="a-popover__label">Group by</div>
                  {[
                    {v:'none', l:'None'},
                    {v:'date', l:'Date'},
                    {v:'status', l:'Status'},
                    {v:'tag', l:'Tag'},
                  ].map(o => (
                    <button key={o.v} className="a-popover__item" data-active={groupBy === o.v} onClick={() => setGroupBy(o.v)}>
                      <span>{o.l}</span>
                      {groupBy === o.v && <Check size={12} />}
                    </button>
                  ))}
                </div>
                <div className="a-popover__divider" />
                <div className="a-popover__section">
                  <div className="a-popover__label">Density</div>
                  <div className="a-popover__seg">
                    {[
                      {v:'compact', l:'Compact'},
                      {v:'comfortable', l:'Cozy'},
                      {v:'spacious', l:'Roomy'},
                    ].map(o => (
                      <button key={o.v} className="a-popover__seg-btn" data-active={density === o.v} onClick={() => setDensity(o.v)}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="a-browse-list" data-density={density}>
          {A2_NOTES.map(n => {
            const I = window[n.icon] || (() => null);
            return (
              <button key={n.id} className="a-bl-item" data-active={activeId === n.id} onClick={() => setActiveId(n.id)}>
                <div className="a-bl-item__head">
                  <span className="a-row__icon" data-tone={n.tone} style={{width:20, height:20}}>
                    <I size={12} />
                  </span>
                  <span className="a-bl-item__title">{n.title}</span>
                  <span className="a-bl-item__time mono tabular">{n.updated}</span>
                </div>
                {density !== 'compact' && (
                  <div className="a-bl-item__preview">{n.preview}</div>
                )}
                {density === 'spacious' && (
                  <div className="a-bl-item__meta">
                    <span className="a-stchip" data-st={n.status}>
                      <span className="a-stchip__dot" />
                      {{inbox:'Inbox', capture:'Fleeting', permanent:'Permanent'}[n.status]}
                    </span>
                    {n.tags.slice(0, 2).map(t => (
                      <span key={t} className="a-tag"><Hash size={9}/>{t}</span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Editor */}
      <main className="a-workspace a-workspace--editor" data-focus={focusMode}>
        <header className="a-ws-head">
          <div className="a-ws-head__left">
            <div style={{position:'relative'}}>
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
                      <button className="a-popover__item" data-active={navOpen} onClick={() => setNavOpen(!navOpen)}>
                        <span>Sidebar</span>
                        {navOpen && <Check size={12}/>}
                      </button>
                      <button className="a-popover__item" data-active={listOpen} onClick={() => setListOpen(!listOpen)}>
                        <span>Note list</span>
                        {listOpen && <Check size={12}/>}
                      </button>
                      <button className="a-popover__item" data-active={detailOpen} onClick={() => setDetailOpen(!detailOpen)}>
                        <span>Detail</span>
                        {detailOpen && <Check size={12}/>}
                      </button>
                    </div>
                    <div className="a-popover__divider" />
                    <div className="a-popover__section">
                      <button className="a-popover__item" onClick={() => { setActbarOpen(true); setNavOpen(true); setListOpen(true); setDetailOpen(true); setPanelMenuOpen(false); }}>
                        <span>Show all panels</span>
                      </button>
                      <button className="a-popover__item" onClick={() => { setActbarOpen(false); setNavOpen(false); setListOpen(false); setDetailOpen(false); setPanelMenuOpen(false); }}>
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
              <span className="a-crumb">Permanent</span>
              <span className="a-crumb__sep">/</span>
              <span className="a-crumb a-crumb--current">{note.title}</span>
            </div>
          </div>
          <div className="a-ws-head__right" style={{position:'relative'}}>
            <button className="a-tool"><Link2 size={12}/> Link</button>
            <button className="a-tool" title="Add to favorites"><Star size={12}/> Favorite</button>
            <button className="a-tool" data-pop-trigger data-active={editorDisplayOpen} onClick={(e) => { e.stopPropagation(); setEditorDisplayOpen(!editorDisplayOpen); setDisplayOpen(false); }}>
              <SlidersHorizontal size={12}/> Display
            </button>
            <button className="a-icb"><MoreHorizontal size={14} /></button>
            <button className="a-icb" title={detailOpen ? 'Hide details' : 'Show details'} data-active={detailOpen} onClick={() => setDetailOpen(!detailOpen)}>
              <Info size={14} />
            </button>
            {editorDisplayOpen && (
              <div className="a-popover a-popover--editor">
                <div className="a-popover__section">
                  <div className="a-popover__label">Text size</div>
                  <div className="a-popover__seg">
                    {[
                      {v:'small', l:'Small'},
                      {v:'normal', l:'Normal'},
                      {v:'large', l:'Large'},
                    ].map(o => (
                      <button key={o.v} className="a-popover__seg-btn" data-active={fontScale === o.v} onClick={() => setFontScale(o.v)}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="a-popover__divider" />
                <div className="a-popover__section">
                  <div className="a-popover__label">Column width</div>
                  <div className="a-popover__seg">
                    {[
                      {v:'narrow', l:'Narrow'},
                      {v:'medium', l:'Medium'},
                      {v:'wide', l:'Wide'},
                    ].map(o => (
                      <button key={o.v} className="a-popover__seg-btn" data-active={columnWidth === o.v} onClick={() => setColumnWidth(o.v)}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="a-popover__divider" />
                <div className="a-popover__section">
                  <button className="a-popover__item a-popover__item--toggle" onClick={() => setFocusMode(!focusMode)}>
                    <Eye size={13} />
                    <span>Focus mode</span>
                    <span className={"a-toggle" + (focusMode ? " a-toggle--on" : "")}>
                      <span className="a-toggle__pip" />
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="a-editor-scroll">
          <article className={"a-editor a-editor--" + columnWidth + " a-editor--font-" + fontScale}>
            <div className="a-editor__chrome">
              <span className="a-row__icon" data-tone={note.tone} style={{width:26, height:26, borderRadius:7}}>
                <NoteIcon size={15} />
              </span>
              <span className="a-stchip" data-st={note.status}>
                <span className="a-stchip__dot" />
                {statusLabel}
              </span>
              <span className="a-editor__meta mono tabular">Edited {note.updated} ago · {note.wordCount.toLocaleString()} words · {note.links} links</span>
            </div>

            <h1 className="a-editor__title">{note.title}</h1>

            <div className="a-editor__tags">
              {note.tags.map(t => <span key={t} className="a-tag"><Hash size={9}/>{t}</span>)}
              <button className="a-tag a-tag--add"><Plus size={9}/> Add tag</button>
            </div>

            <div className="a-editor__body">
              <p>{note.preview}</p>
              <p>The interval problem: how do you remind yourself of a design pattern not when you remember it, but when you would <em>have</em> forgotten it? Spaced repetition gives a clean answer for vocabulary. For design knowledge — components, motifs, edge-cases — the answer is messier.</p>
              <h2>What we want from a system</h2>
              <p>Three things, in order: (1) cheap capture, (2) reliable retrieval, (3) <strong>opportunistic resurfacing</strong>. The third is what conventional notes apps refuse to do — they wait until you go looking.</p>
              <ul>
                <li>Capture should be one keystroke. <code>⌘N</code> from anywhere in the OS.</li>
                <li>Retrieval is search, but search must rank by relevance to the <em>current</em> document.</li>
                <li>Resurfacing happens at the edge — when you start writing about a related topic, the relevant note appears as a suggestion.</li>
              </ul>
              <p>The Anki model is too rigid. The Roam/Obsidian model is too passive. Somewhere between the two is a system that remembers <em>for</em> you, without scheduling your day.</p>
              <h2>Open questions</h2>
              <p>How do you know two notes are about the same thing? Tags fail. Embeddings work but feel arbitrary. The honest answer might be: you don't, and the system should surface adjacency probabilistically, then let the user accept or reject.</p>
              <blockquote>"The value of a note is not in the moment of capture, but in the moment of return. The system that helps you return is the one worth keeping."</blockquote>
            </div>
          </article>
        </div>
      </main>

      {/* Detail / backlinks panel */}
      {detailOpen && (
        <aside className="a-detail">
          <div className="a-detail__head">
            <div className="a-detail__title">
              <Link2 size={13} /> Backlinks
              <span className="a-sb-link__count tabular" style={{marginLeft:4}}>{A2_BACKLINKS.length}</span>
            </div>
            <button className="a-icb" title="Close" onClick={() => setDetailOpen(false)}>
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="a-detail__body">
            <div className="a-detail__group">
              <div className="a-detail__label">Properties</div>
              <div className="a-detail__props">
                <div className="a-detail__prop"><span>Status</span><span className="a-stchip" data-st={note.status}><span className="a-stchip__dot"/>{statusLabel}</span></div>
                <div className="a-detail__prop"><span>Words</span><span className="mono tabular">{note.wordCount.toLocaleString()}</span></div>
                <div className="a-detail__prop"><span>Links</span><span className="mono tabular">{note.links}</span></div>
                <div className="a-detail__prop"><span>Updated</span><span className="mono tabular">{note.updated} ago</span></div>
              </div>
            </div>

            <div className="a-detail__group">
              <div className="a-detail__label">Linked from</div>
              {A2_BACKLINKS.map(bl => {
                const I = window[bl.icon] || (() => null);
                return (
                  <button key={bl.id} className="a-backlink">
                    <div className="a-backlink__head">
                      <I size={12} />
                      <span>{bl.title}</span>
                    </div>
                    <div className="a-backlink__excerpt">{bl.excerpt}</div>
                  </button>
                );
              })}
            </div>

            <div className="a-detail__group">
              <div className="a-detail__label">Outbound links</div>
              <div className="a-detail__row" style={{justifyContent:'space-between', fontSize:12.5}}>
                <span style={{color:'var(--soft-fg)'}}>Knowledge graph as memory aid</span>
                <span className="mono tabular" style={{color:'var(--whisper-fg)', fontSize:11}}>3</span>
              </div>
              <div className="a-detail__row" style={{justifyContent:'space-between', fontSize:12.5}}>
                <span style={{color:'var(--soft-fg)'}}>On rhythm in long-form writing</span>
                <span className="mono tabular" style={{color:'var(--whisper-fg)', fontSize:11}}>2</span>
              </div>
              <div className="a-detail__row" style={{justifyContent:'space-between', fontSize:12.5}}>
                <span style={{color:'var(--soft-fg)'}}>Reflect.app — daily note pattern</span>
                <span className="mono tabular" style={{color:'var(--whisper-fg)', fontSize:11}}>1</span>
              </div>
            </div>
          </div>
        </aside>
      )}
      {/* Edge re-open handles */}
      {!actbarOpen && <button className="a-edge a-edge--actbar" title="Show activity bar" onClick={() => setActbarOpen(true)}><ChevronRight size={11}/></button>}
      {!navOpen && actbarOpen && <button className="a-edge a-edge--nav" title="Show sidebar" onClick={() => setNavOpen(true)}><ChevronRight size={11}/></button>}
      {!listOpen && navOpen && <button className="a-edge a-edge--list" title="Show list" onClick={() => setListOpen(true)}><ChevronRight size={11}/></button>}
      {!detailOpen && <button className="a-edge a-edge--detail" title="Show details" onClick={() => setDetailOpen(true)}><ChevronLeft size={11}/></button>}
    </div>
  );
}
window.ABrowseMode = ABrowseMode;
