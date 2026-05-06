/* @jsx React.createElement */
const { useState: useStateCB } = React;

const CB_NOTES = [
  { id:'n1', icon:'Brain',     tone:'permanent', title:'Spaced repetition for design systems', excerpt:'The Anki model is too rigid. The Roam/Obsidian model is too passive. Somewhere between is a system that resurfaces notes when you start writing about a related topic.', tags:['notes','learning','systems'], updated:'2h', wordCount:1240, links:8, backlinks:14, dur:'02:04', rate:'120%', ts: 8 },
  { id:'n2', icon:'Layers',    tone:'permanent', title:'Why Bento layouts work for dashboards', excerpt:'Bento boxes give you visual rhythm without rigid grids. Each cell becomes a thought.', tags:['design','layout'], updated:'4h', wordCount:890, links:5, backlinks:9, dur:'01:28', rate:'90%', ts: 17 },
  { id:'n3', icon:'Target',    tone:'capture',   title:'Plot v3 — design directions', excerpt:'Two directions: Linear-precision (A) and Studio OS (C). C has three subdirections.', tags:['plot','meetings'], updated:'5h', wordCount:340, links:2, backlinks:3, dur:'00:34', rate:'80%', ts: 24 },
  { id:'n4', icon:'Beaker',    tone:'inbox',     title:'Linear command palette — implementation', excerpt:'Fuzzy match scores boost recently-used commands; mode awareness; nested menus collapse on Esc.', tags:['linear','engineering'], updated:'yesterday', wordCount:180, links:1, backlinks:0, dur:'00:18', rate:'60%', ts: 36 },
  { id:'n5', icon:'Sitemap',   tone:'permanent', title:'Mercury — visual hierarchy breakdown', excerpt:'Mercury treats numbers as the primary citizen. Generous whitespace; small captions.', tags:['fintech','design'], updated:'2d', wordCount:1820, links:12, backlinks:7, dur:'03:02', rate:'100%', ts: 48 },
  { id:'n6', icon:'Bold',      tone:'permanent', title:'On type pairing — Graphic Anonymous', excerpt:'A serif and a sans rarely fight if they share a vertical proportion and contrast level.', tags:['typography'], updated:'3d', wordCount:670, links:6, backlinks:4, dur:'01:07', rate:'95%', ts: 60 },
  { id:'n7', icon:'Zap',       tone:'capture',   title:'Why I quit Notion (again)', excerpt:'Notion is best at the wrong things — bases and blocks — and worst at the only thing I want.', tags:['tools','productivity'], updated:'4d', wordCount:520, links:3, backlinks:2, dur:'00:52', rate:'85%', ts: 72 },
];

const CB_LIBRARY = [
  { kind:'sec', label:'Spaces' },
  { kind:'row', id:'all',       icon:'FileText', label:'All notes',  count: 247, dot: null },
  { kind:'row', id:'inbox',     icon:'Inbox',    label:'Inbox',      count: 12,  dot: 'inbox' },
  { kind:'row', id:'fleeting',  icon:'Zap',      label:'Fleeting',   count: 28,  dot: 'capture' },
  { kind:'row', id:'permanent', icon:'Brain',    label:'Permanent',  count: 184, dot: 'permanent' },
  { kind:'row', id:'wiki',      icon:'Book',     label:'Wiki',       count: 23,  dot: null },
  { kind:'sec', label:'Status' },
  { kind:'row', id:'pinned',    icon:'Pin',      label:'Pinned',     count: 9,   dot: null },
  { kind:'row', id:'archive',   icon:'Archive',  label:'Archive',    count: 56,  dot: null },
  { kind:'sec', label:'Tags' },
  { kind:'row', id:'design',    icon:'Hash',     label:'design',     count: 38,  dot: null },
  { kind:'row', id:'linear',    icon:'Hash',     label:'linear',     count: 14,  dot: null },
  { kind:'row', id:'writing',   icon:'Hash',     label:'writing',    count: 21,  dot: null },
];

function CBNotesStudio({ theme }) {
  const [activeId, setActiveId] = useStateCB('n1');
  const [activeRow, setActiveRow] = useStateCB('all');
  const [libOpen, setLibOpen] = useStateCB(true);
  const [insOpen, setInsOpen] = useStateCB(true);
  const [insTab, setInsTab] = useStateCB('props');
  const [mode, setMode] = useStateCB('list');
  const [panelMenuOpen, setPanelMenuOpen] = useStateCB(false);

  const F = (name, fb) => window[name] || (fb && window[fb]) || (() => null);
  const Search = F('Search');
  const Plus = F('Plus');
  const Filter = F('Filter');
  const Settings = F('Settings');
  const Sliders = F('Sliders');
  const Menu = F('Menu');
  const Check = F('Check');
  const ChevronLeft = F('ChevronLeft');
  const ChevronRight = F('ChevronRight');
  const Bell = F('Bell');
  const Info = F('Info');
  const Link2 = F('Link');
  const Star = F('Star');
  const MoreHorizontal = F('MoreHorizontal', 'MoreVertical');
  const Eye = F('Eye');
  const FileText = F('FileText');
  const Inbox = F('Inbox');
  const Zap = F('Zap');
  const Brain = F('Brain');
  const Hash = F('Hash');
  const Pin = F('Pin');
  const Archive = F('Archive');
  const Book = F('Book');
  const Layers = F('Layers');
  const Network = F('Network');

  const byId = Object.fromEntries(CB_NOTES.map(n => [n.id, n]));
  const current = byId[activeId] || CB_NOTES[0];

  const visible = activeRow === 'all' ? CB_NOTES :
    ['inbox','fleeting','permanent'].includes(activeRow) ? CB_NOTES.filter(n => n.tone === (activeRow === 'fleeting' ? 'capture' : activeRow)) : CB_NOTES;

  return (
    <div className="cb-app" style={{ position:'relative' }}>
      {/* TRANSPORT BAR */}
      <header className="cb-transport">
        <div className="cb-tx__brand"><span>P</span>STUDIO</div>

        <div style={{position:'relative'}}>
          <button className="cb-tx__btn" title="Show panels" data-active={panelMenuOpen} onClick={(e) => { e.stopPropagation(); setPanelMenuOpen(!panelMenuOpen); }}>
            <Menu size={13}/>
          </button>
          {panelMenuOpen && (
            <>
              <div style={{position:'fixed', inset:0, zIndex:55}} onClick={() => setPanelMenuOpen(false)} />
              <div className="cb-pop" style={{ left: 0 }}>
                <div className="cb-pop__label">Docks</div>
                <button className="cb-pop__row" onClick={() => setLibOpen(!libOpen)}>
                  <span>Library</span>{libOpen && <Check size={11}/>}
                </button>
                <button className="cb-pop__row" onClick={() => setInsOpen(!insOpen)}>
                  <span>Inspector</span>{insOpen && <Check size={11}/>}
                </button>
                <div className="cb-pop__sep"/>
                <button className="cb-pop__row" onClick={() => { setLibOpen(true); setInsOpen(true); setPanelMenuOpen(false); }}>
                  <span>Show all docks</span>
                </button>
                <button className="cb-pop__row" onClick={() => { setLibOpen(false); setInsOpen(false); setPanelMenuOpen(false); }}>
                  <span>Hide all docks</span>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="cb-tx__group">
          <button className="cb-tx__btn"><Plus size={12}/></button>
          <button className="cb-tx__btn"><Filter size={12}/></button>
          <button className="cb-tx__btn"><Sliders size={12}/></button>
        </div>

        <div className="cb-tx__seg">
          {[
            { id:'list',     label:'List' },
            { id:'workspace',label:'Stack' },
            { id:'graph',    label:'Graph' },
            { id:'timeline', label:'Time' },
          ].map(m => (
            <button key={m.id} data-active={mode === m.id} onClick={() => setMode(m.id)}>{m.label}</button>
          ))}
        </div>

        <div className="cb-tx__counter tabular">
          <span><b>{visible.length}</b> tracks</span>
          <dim>·</dim>
          <span><b>{visible.reduce((s,n) => s + n.wordCount, 0).toLocaleString()}</b> words</span>
          <dim>·</dim>
          <span><b>{visible.reduce((s,n) => s + n.links, 0)}</b> links</span>
        </div>

        <div className="cb-tx__spacer" />

        <button className="cb-tx__search">
          <Search size={11}/>
          <span>Find in workspace</span>
          <kbd>⌘F</kbd>
        </button>
        <button className="cb-tx__btn" data-active={insOpen} title="Inspector" onClick={() => setInsOpen(!insOpen)}>
          <Info size={13}/>
        </button>
        <button className="cb-tx__btn"><Settings size={13}/></button>
      </header>

      {/* LIBRARY DOCK */}
      {libOpen && (
        <aside className="cb-library">
          <div className="cb-lib__head">
            <span>Library</span>
            <div className="cb-lib__head-r">
              <button className="cb-lib__icb" title="New"><Plus size={11}/></button>
              <button className="cb-lib__icb" title="Hide library" onClick={() => setLibOpen(false)}><ChevronLeft size={11}/></button>
            </div>
          </div>
          <div className="cb-lib__body">
            {CB_LIBRARY.map((row, i) => {
              if (row.kind === 'sec') return <div key={i} className="cb-lib__sec">{row.label}</div>;
              const Ico = F(row.icon);
              return (
                <button key={row.id} className="cb-lib__row" data-active={activeRow === row.id} onClick={() => setActiveRow(row.id)}>
                  {row.dot
                    ? <span className="cb-lib__row__dot" style={{ background: `var(--cb-${row.dot === 'permanent' ? 'green' : row.dot === 'capture' ? 'amber' : 'fg-3'})` }}/>
                    : <Ico size={13}/>}
                  <span>{row.label}</span>
                  <span className="cb-lib__row__count tabular">{row.count}</span>
                </button>
              );
            })}
          </div>
        </aside>
      )}
      {!libOpen && <button className="cb-edge cb-edge--lib" title="Show library" onClick={() => setLibOpen(true)}><ChevronRight size={11}/></button>}

      {/* WORKSPACE */}
      <section className="cb-workspace">
        <div className="cb-ws__bar">
          <div className="cb-ws__bar-l">
            <span><b>WORKSPACE</b></span>
            <span style={{margin:'0 6px', color:'var(--cb-fg-4)'}}>·</span>
            <span>All notes</span>
            <span style={{margin:'0 6px', color:'var(--cb-fg-4)'}}>·</span>
            <span style={{color:'var(--cb-cyan)'}}>{visible.length} active</span>
          </div>
          <div className="cb-ws__bar-r">
            <button className="cb-tx__btn"><Layers size={12}/></button>
            <button className="cb-tx__btn"><Network size={12}/></button>
            <button className="cb-tx__btn"><Eye size={12}/></button>
            <button className="cb-tx__btn"><MoreHorizontal size={12}/></button>
          </div>
        </div>

        {/* Tracks */}
        <div className="cb-ws__main">
          {visible.map(n => {
            const Ico = F(n.icon, 'FileText');
            // sparkline data
            const bars = Array.from({length: 24}, (_,i) => 3 + Math.abs(Math.sin(i * 0.6 + n.id.length)) * 26);
            return (
              <div key={n.id} className="cb-track" data-active={activeId === n.id}>
                <div className="cb-track__head">
                  <span className="cb-track__chip" data-tone={n.tone}>{n.tone}</span>
                  <span className="cb-track__title">{n.title}</span>
                  <span className="cb-track__date">· {n.updated}</span>
                  <div className="cb-track__meta-r">
                    <span><Link2 size={10}/>{n.links}/{n.backlinks}</span>
                    <span>{n.wordCount.toLocaleString()} W</span>
                    <span>{n.dur}</span>
                    <span>{n.rate}</span>
                  </div>
                </div>
                <div className="cb-track__body" onClick={() => setActiveId(n.id)}>
                  <div className="cb-track__excerpt">{n.excerpt}</div>
                  <div className="cb-scope">
                    <div className="cb-scope__head">
                      <span>density</span>
                      <span>{Math.round(bars.reduce((a,b)=>a+b,0))}u</span>
                    </div>
                    <div className="cb-scope__bars">
                      {bars.map((h, i) => <div key={i} className="cb-scope__bar" style={{ height: `${h}px` }}/>)}
                    </div>
                    <div className="cb-scope__foot">
                      <span>peak <b>{Math.round(Math.max(...bars))}</b></span>
                      <span>avg <b>{Math.round(bars.reduce((a,b)=>a+b,0)/bars.length)}</b></span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mini timeline */}
        <div className="cb-tl">
          <div className="cb-tl__head">
            <span><b>TIMELINE</b></span>
            <span>· playhead 14:32</span>
            <span style={{color:'var(--cb-cyan)'}}>· {visible.length} pips</span>
            <span style={{marginLeft:'auto'}}>1d range</span>
          </div>
          <div className="cb-tl__rail">
            {[
              { label:'00:00' }, { label:'04:00' }, { label:'08:00' }, { label:'12:00' }, { label:'16:00' }, { label:'20:00' }
            ].map((s, i) => (
              <div key={i} className="cb-tl__seg">
                <b>{s.label}</b>
              </div>
            ))}
            {CB_NOTES.map(n => (
              <div key={n.id} className="cb-tl__pip" data-tone={n.tone}
                style={{ left: `${(n.ts / 96) * 100}%` }}/>
            ))}
            <div className="cb-tl__playhead" style={{ left: `${(60/96)*100}%` }}/>
          </div>
        </div>
      </section>

      {/* INSPECTOR DOCK */}
      {insOpen && (
        <aside className="cb-inspector">
          <div className="cb-ins__tabs">
            {[
              { id:'props',   label:'Properties' },
              { id:'links',   label:'Links' },
              { id:'history', label:'History' },
            ].map(t => (
              <button key={t.id} className="cb-ins__tab" data-active={insTab === t.id} onClick={() => setInsTab(t.id)}>{t.label}</button>
            ))}
          </div>
          <div className="cb-ins__head">
            <div className="cb-ins__head-text">
              <div className="cb-ins__id">N-{current.id.toUpperCase()} · {current.tone.toUpperCase()}</div>
              <div className="cb-ins__title">{current.title}</div>
            </div>
            <button className="cb-ins__close" title="Close" onClick={() => setInsOpen(false)}><ChevronRight size={13}/></button>
          </div>

          {insTab === 'props' && (
            <div className="cb-ins__body">
              <div className="cb-ins__sec">
                <div className="cb-ins__sec-title"><span>Levels</span><b>4 channels</b></div>
                <div className="cb-ins__levels">
                  {Array.from({length: 28}, (_,i) => (
                    <div key={i} className="cb-ins__level" style={{ height: `${4 + Math.abs(Math.sin(i*0.4 + current.id.length))*22}px`, opacity: 0.5 + Math.abs(Math.sin(i*0.5))*0.4 }}/>
                  ))}
                </div>
              </div>
              <div className="cb-ins__sec">
                <div className="cb-ins__sec-title"><span>Metrics</span></div>
                <div className="cb-ins__row"><label>Words</label><val>{current.wordCount.toLocaleString()}</val></div>
                <div className="cb-ins__row"><label>Outgoing</label><val>{current.links}</val></div>
                <div className="cb-ins__row"><label>Backlinks</label><val>{current.backlinks}</val></div>
                <div className="cb-ins__row"><label>Updated</label><val>{current.updated}</val></div>
                <div className="cb-ins__row"><label>Density</label><val>{current.rate}</val></div>
                <div className="cb-ins__row"><label>Duration</label><val>{current.dur}</val></div>
              </div>
              <div className="cb-ins__sec">
                <div className="cb-ins__sec-title"><span>Tags</span><b>{current.tags.length}</b></div>
                <div className="cb-ins__chips">
                  {current.tags.map(t => <span key={t} className="cb-ins__chip">#{t}</span>)}
                </div>
              </div>
              <div className="cb-ins__sec">
                <div className="cb-ins__sec-title"><span>Channel</span></div>
                <div className="cb-ins__row"><label>Tone</label><val style={{color:`var(--cb-${current.tone === 'permanent' ? 'green' : current.tone === 'capture' ? 'amber' : 'fg-3'})`}}>{current.tone}</val></div>
                <div className="cb-ins__row"><label>Solo</label><val>off</val></div>
                <div className="cb-ins__row"><label>Mute</label><val>off</val></div>
                <div className="cb-ins__row"><label>Pinned</label><val>—</val></div>
              </div>
            </div>
          )}

          {insTab === 'links' && (
            <div className="cb-ins__body">
              <div className="cb-ins__sec">
                <div className="cb-ins__sec-title"><span>Backlinks</span><b>{current.backlinks}</b></div>
                <div className="cb-ins__bl">
                  {CB_NOTES.filter(n => n.id !== current.id).slice(0,4).map(n => (
                    <button key={n.id} className="cb-ins__bl-item" onClick={() => setActiveId(n.id)}>
                      <span className="cb-ins__bl-dot" style={{background:`var(--cb-${n.tone === 'permanent' ? 'green' : n.tone === 'capture' ? 'amber' : 'fg-3'})`}}/>
                      <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{n.title}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="cb-ins__sec">
                <div className="cb-ins__sec-title"><span>Outgoing</span><b>{current.links}</b></div>
                <div className="cb-ins__bl">
                  {CB_NOTES.filter(n => n.id !== current.id).slice(2,5).map(n => (
                    <button key={n.id} className="cb-ins__bl-item" onClick={() => setActiveId(n.id)}>
                      <span className="cb-ins__bl-dot" style={{background:`var(--cb-${n.tone === 'permanent' ? 'green' : n.tone === 'capture' ? 'amber' : 'fg-3'})`}}/>
                      <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{n.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {insTab === 'history' && (
            <div className="cb-ins__body">
              <div className="cb-ins__sec">
                <div className="cb-ins__sec-title"><span>Revisions</span><b>14</b></div>
                <div className="cb-ins__bl">
                  {[
                    { ver:'v14', at:'2h',  diff:'+42 / -8' },
                    { ver:'v13', at:'4h',  diff:'+12 / -3' },
                    { ver:'v12', at:'1d',  diff:'+87 / -19' },
                    { ver:'v11', at:'2d',  diff:'+5'  },
                    { ver:'v10', at:'3d',  diff:'+220 / -41' },
                  ].map(r => (
                    <div key={r.ver} className="cb-ins__bl-item">
                      <span style={{fontFamily:'var(--cb-mono)', color:'var(--cb-cyan)', fontSize:10.5}}>{r.ver}</span>
                      <span style={{flex:1, color:'var(--cb-fg-3)', fontSize:11, fontFamily:'var(--cb-mono)'}}>{r.diff}</span>
                      <span style={{color:'var(--cb-fg-4)', fontSize:10, fontFamily:'var(--cb-mono)'}}>{r.at}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>
      )}
      {!insOpen && <button className="cb-edge cb-edge--ins" title="Show inspector" onClick={() => setInsOpen(true)}><ChevronLeft size={11}/></button>}

      {/* STATUS BAR */}
      <footer className="cb-status">
        <div className="cb-status__group"><span className="dot"/><b>READY</b></div>
        <div className="cb-status__group">{visible.length} TRACKS</div>
        <div className="cb-status__group">SAMPLE 48k</div>
        <div className="cb-status__group">BUF 1024</div>
        <div className="cb-status__spacer"/>
        <div className="cb-status__group">CPU <b>14%</b></div>
        <div className="cb-status__group">MEM <b>2.1G</b></div>
        <div className="cb-status__group cb-status__group--cyan">SYNC ✓</div>
        <div className="cb-status__group">v3.0.0-beta</div>
      </footer>
    </div>
  );
}

window.CBNotesStudio = CBNotesStudio;
