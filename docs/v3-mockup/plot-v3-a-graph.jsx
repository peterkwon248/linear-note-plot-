/* @jsx React.createElement */
const { useState: useStateAG, useMemo: useMemoAG } = React;

// Graph data
const AG_NODES = [
  { id:'n1',  x: 360, y: 220, r: 18, tone:'permanent', title:'Spaced repetition for design systems', tags:['notes','learning','systems'], wordCount:1240, links:8, backlinks:14, t: 8 },
  { id:'n2',  x: 540, y: 160, r: 15, tone:'permanent', title:'Why bento layouts work', tags:['design','layout'], wordCount:890, links:5, backlinks:9, t: 17 },
  { id:'n3',  x: 220, y: 380, r: 12, tone:'capture',   title:'Plot v3 — directions', tags:['plot','meetings'], wordCount:340, links:2, backlinks:3, t: 24 },
  { id:'n4',  x: 460, y: 410, r: 10, tone:'inbox',     title:'Linear command palette', tags:['linear','engineering'], wordCount:180, links:1, backlinks:0, t: 36 },
  { id:'n5',  x: 700, y: 280, r: 17, tone:'permanent', title:'Mercury — visual hierarchy', tags:['fintech','design'], wordCount:1820, links:12, backlinks:7, t: 48 },
  { id:'n6',  x: 620, y: 460, r: 13, tone:'permanent', title:'On type pairing', tags:['typography'], wordCount:670, links:6, backlinks:4, t: 60 },
  { id:'n7',  x: 320, y: 110, r: 11, tone:'capture',   title:'Why I quit Notion', tags:['tools','productivity'], wordCount:520, links:3, backlinks:2, t: 72 },
  { id:'n8',  x: 820, y: 200, r: 9,  tone:'inbox',     title:'Obsidian graph view', tags:['obsidian','critique'], wordCount:90, links:0, backlinks:0, t: 80 },
  { id:'n9',  x: 160, y: 200, r: 14, tone:'permanent', title:'IA Writer focus mode', tags:['writing','tools'], wordCount:1100, links:7, backlinks:5, t: 88 },
  { id:'n10', x: 780, y: 420, r: 12, tone:'capture',   title:'Reflect daily notes', tags:['ai','daily-notes'], wordCount:740, links:4, backlinks:2, t: 92 },
  { id:'n11', x: 480, y: 280, r: 19, tone:'permanent', title:'On rhythm in long-form writing', tags:['writing','craft'], wordCount:2300, links:9, backlinks:11, t: 28 },
  { id:'n12', x: 180, y: 480, r: 8,  tone:'inbox',     title:'IndieWeb second brain', tags:['second-brain'], wordCount:60, links:0, backlinks:0, t: 95 },
];

const AG_EDGES = [
  ['n1','n11'], ['n1','n2'], ['n1','n9'], ['n1','n3'],
  ['n2','n5'], ['n2','n6'],
  ['n3','n4'], ['n3','n11'],
  ['n5','n6'], ['n5','n8'],
  ['n6','n11'],
  ['n7','n9'], ['n7','n3'],
  ['n9','n11'], ['n9','n12'],
  ['n10','n5'], ['n10','n11'],
  ['n11','n6'], ['n11','n12'],
];

const AG_TONE = (t) => t === 'permanent' ? 'var(--space-notes)' : t === 'capture' ? '#DC6803' : t === 'wiki' ? '#4F46E5' : 'var(--sidebar-muted)';

function AGraph({ theme }) {
  const [activeId, setActiveId] = useStateAG('n11');
  const [hoverId, setHoverId] = useStateAG(null);
  const [lensOpen, setLensOpen] = useStateAG(true);
  const [railOpen, setRailOpen] = useStateAG(true);
  const [layout, setLayout] = useStateAG('force');
  const [depth, setDepth] = useStateAG(2);
  const [tonesOn, setTonesOn] = useStateAG({ permanent: true, capture: true, inbox: true, wiki: true });
  const [zoom, setZoom] = useStateAG(100);
  const [timeWindow, setTimeWindow] = useStateAG([0, 96]); // 0..96h

  const F = (name, fb) => window[name] || (fb && window[fb]) || (() => null);
  const Search = F('Search');
  const Plus = F('Plus');
  const Filter = F('Filter');
  const Layers = F('Layers');
  const Eye = F('Eye');
  const Settings = F('Settings');
  const ChevronLeft = F('ChevronLeft');
  const ChevronRight = F('ChevronRight');
  const ZoomIn = F('ZoomIn', 'Plus');
  const ZoomOut = F('ZoomOut', 'Minus');
  const Maximize = F('Maximize', 'Square');
  const Network = F('Network');
  const Hash = F('Hash');
  const Brain = F('Brain');
  const Zap = F('Zap');
  const Inbox = F('Inbox');
  const Book = F('Book');
  const Play = F('Play');
  const Pause = F('Pause');
  const Lock = F('Lock');
  const Crosshair = F('Crosshair', 'Target');

  const byId = useMemoAG(() => Object.fromEntries(AG_NODES.map(n => [n.id, n])), []);
  const adj = useMemoAG(() => {
    const m = {};
    AG_NODES.forEach(n => m[n.id] = new Set());
    AG_EDGES.forEach(([a,b]) => { m[a].add(b); m[b].add(a); });
    return m;
  }, []);

  // BFS for hops within depth
  const hopsFrom = useMemoAG(() => {
    if (!activeId) return {};
    const result = { [activeId]: 0 };
    let frontier = [activeId];
    for (let d = 1; d <= depth; d++) {
      const next = [];
      for (const id of frontier) {
        for (const nb of adj[id] || []) {
          if (!(nb in result)) { result[nb] = d; next.push(nb); }
        }
      }
      frontier = next;
    }
    return result;
  }, [activeId, depth, adj]);

  const inWindow = (n) => n.t >= timeWindow[0] && n.t <= timeWindow[1];
  const tonePass = (n) => tonesOn[n.tone];
  const visibleNodes = AG_NODES.filter(n => inWindow(n) && tonePass(n));
  const visibleSet = new Set(visibleNodes.map(n => n.id));

  const current = byId[activeId] || AG_NODES[0];
  const neighbors = AG_NODES.filter(n => n.id !== activeId && hopsFrom[n.id] != null);

  // Histogram for scrubber
  const histogram = useMemoAG(() => {
    const buckets = 32;
    const arr = Array(buckets).fill(0);
    AG_NODES.forEach(n => {
      const b = Math.min(buckets - 1, Math.floor((n.t / 96) * buckets));
      arr[b] += n.r;
    });
    return arr;
  }, []);

  const VB_W = 980, VB_H = 580;

  return (
    <div className="ag-shell" data-lens={lensOpen ? 'open' : 'collapsed'} data-rail={railOpen ? 'open' : 'collapsed'} style={{ position: 'relative' }}>

      {/* LENS */}
      {lensOpen && (
        <aside className="ag-lens">
          <div className="ag-lens__head">
            <span className="ag-lens__title">Lens</span>
            <button className="ag-lens__icb" title="Save lens"><Plus size={13}/></button>
            <button className="ag-lens__icb" title="Hide lens" onClick={() => setLensOpen(false)}><ChevronLeft size={13}/></button>
          </div>
          <div className="ag-lens__body">

            <div className="ag-sec"><span className="ag-sec__label">Tones</span></div>
            {[
              { id:'permanent', label:'Permanent', icon:'Brain', count: 184, color:'var(--space-notes)' },
              { id:'capture',   label:'Fleeting',  icon:'Zap',   count: 28,  color:'#DC6803' },
              { id:'inbox',     label:'Inbox',     icon:'Inbox', count: 12,  color:'var(--sidebar-muted)' },
              { id:'wiki',      label:'Wiki',      icon:'Book',  count: 23,  color:'#4F46E5' },
            ].map(r => {
              const Ico = F(r.icon);
              return (
                <button key={r.id} className="ag-row" data-checked={tonesOn[r.id]} onClick={() => setTonesOn({ ...tonesOn, [r.id]: !tonesOn[r.id] })}>
                  <span className="ag-row__check">{tonesOn[r.id] && <span style={{ fontSize:9 }}>✓</span>}</span>
                  <span className="ag-row__dot" style={{ background: r.color }}/>
                  <span>{r.label}</span>
                  <span className="ag-row__count tabular">{r.count}</span>
                </button>
              );
            })}

            <div className="ag-sec"><span className="ag-sec__label">Depth from focus</span></div>
            <div className="ag-slider">
              <div className="ag-slider__top">
                <span>Hops</span>
                <val>{depth}</val>
              </div>
              <div className="ag-slider__rail" onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const v = Math.max(1, Math.min(4, Math.round(((e.clientX - r.left) / r.width) * 4)));
                setDepth(v);
              }}>
                <div className="ag-slider__fill" style={{ width: `${(depth/4)*100}%` }}/>
                <div className="ag-slider__thumb" style={{ left: `${(depth/4)*100}%` }}/>
              </div>
            </div>

            <div className="ag-sec"><span className="ag-sec__label">Layout</span></div>
            <div className="ag-seg">
              {[{id:'force',l:'Force'},{id:'radial',l:'Radial'},{id:'time',l:'Time'}].map(o => (
                <button key={o.id} data-active={layout === o.id} onClick={() => setLayout(o.id)}>{o.l}</button>
              ))}
            </div>

            <div className="ag-sec"><span className="ag-sec__label">Saved lenses</span><span className="ag-sec__count">3</span></div>
            {[
              { id:'l1', name:'Writing craft',     count: 14 },
              { id:'l2', name:'Design systems',    count: 22 },
              { id:'l3', name:'Tools I have quit', count: 6  },
            ].map(l => (
              <button key={l.id} className="ag-row">
                <span className="ag-row__dot" style={{ background:'var(--space-notes)', opacity: 0.7 }}/>
                <span>{l.name}</span>
                <span className="ag-row__count tabular">{l.count}</span>
              </button>
            ))}

            <div className="ag-sec"><span className="ag-sec__label">Tags in view</span><span className="ag-sec__count">12</span></div>
            {['design','writing','linear','tools','design-systems','typography'].map(t => (
              <button key={t} className="ag-row">
                <Hash size={11}/>
                <span>{t}</span>
                <span className="ag-row__count tabular">{Math.round(2 + Math.random() * 14)}</span>
              </button>
            ))}
          </div>
        </aside>
      )}
      {!lensOpen && <button className="ag-edge ag-edge--lens" title="Show lens" onClick={() => setLensOpen(true)}><ChevronRight size={11}/></button>}

      {/* CANVAS */}
      <section className="ag-canvas">
        {/* Top bar */}
        <div className="ag-top">
          <Network size={14}/>
          <span className="ag-top__title">Investigative graph</span>
          <span className="ag-top__sub">— {visibleNodes.length} nodes · {AG_EDGES.length} edges · depth {depth}</span>
          <div className="ag-top__spacer"/>
          <div className="ag-top__group">
            <button className="ag-top__icb" title="Search"><Search size={12}/></button>
            <button className="ag-top__icb" title="Filter"><Filter size={12}/></button>
            <button className="ag-top__icb" title="Layers"><Layers size={12}/></button>
            <button className="ag-top__icb" title="Visibility"><Eye size={12}/></button>
          </div>
          <button className="ag-top__icb" data-active={railOpen} title="Inspector" onClick={() => setRailOpen(!railOpen)}>
            <Crosshair size={12}/>
          </button>
          <button className="ag-top__icb"><Settings size={12}/></button>
        </div>

        {/* Time scrubber */}
        <div className="ag-scrubber">
          <div className="ag-scrubber__head">
            <Play size={10}/>
            <span><b>TIMELINE</b></span>
            <span>· last 4 days</span>
            <span style={{ color:'var(--space-notes)' }}>· {visibleNodes.length} in window</span>
            <span style={{ marginLeft:'auto' }}>{timeWindow[0]}h — {timeWindow[1]}h</span>
          </div>
          <div className="ag-scrubber__rail">
            {histogram.map((v, i) => {
              const t = (i / histogram.length) * 96;
              return (
                <div key={i} className="ag-scrubber__bar"
                  data-in={t >= timeWindow[0] && t <= timeWindow[1]}
                  style={{ height: `${4 + (v/Math.max(...histogram))*36}px` }}/>
              );
            })}
            <div className="ag-scrubber__window" style={{
              left: `${(timeWindow[0]/96)*100}%`,
              right: `${100 - (timeWindow[1]/96)*100}%`,
            }}/>
            <div className="ag-scrubber__playhead" style={{ left: `${((timeWindow[0]+timeWindow[1])/2/96)*100}%` }}/>
          </div>
        </div>

        {/* SVG canvas */}
        <div className="ag-svg-wrap">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet">
            {/* edges */}
            <g>
              {AG_EDGES.map(([a,b], i) => {
                const A = byId[a], B = byId[b];
                if (!A || !B) return null;
                const visible = visibleSet.has(a) && visibleSet.has(b);
                const near = (hopsFrom[a] != null && hopsFrom[b] != null) && (hopsFrom[a] <= depth && hopsFrom[b] <= depth);
                return (
                  <line key={i}
                    x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                    className="ag-edge-line"
                    data-near={near}
                    style={{ opacity: visible ? undefined : 0.06 }}/>
                );
              })}
            </g>
            {/* nodes */}
            <g>
              {AG_NODES.map(n => {
                const visible = visibleSet.has(n.id);
                const isActive = n.id === activeId;
                const hops = hopsFrom[n.id];
                const inHop = hops != null;
                const fade = visible && !inHop;
                return (
                  <g key={n.id}
                    onMouseEnter={() => setHoverId(n.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onClick={() => setActiveId(n.id)}
                    style={{ cursor:'pointer' }}>
                    {isActive && (
                      <circle cx={n.x} cy={n.y} r={n.r + 8}
                        fill="none"
                        stroke={AG_TONE(n.tone)}
                        strokeWidth="1"
                        strokeDasharray="2 3"
                        opacity="0.5"/>
                    )}
                    <circle
                      className="ag-node-circle"
                      data-active={isActive}
                      cx={n.x} cy={n.y} r={n.r}
                      fill={AG_TONE(n.tone)}
                      stroke="var(--bg)"
                      strokeWidth="1.5"
                      opacity={visible ? (fade ? 0.25 : 1) : 0.06}/>
                    <text
                      className="ag-node-label"
                      data-faded={fade}
                      data-active={isActive}
                      x={n.x} y={n.y + n.r + 12}
                      textAnchor="middle"
                      opacity={visible ? (fade ? 0.3 : 1) : 0.05}>
                      {n.title.length > 28 ? n.title.slice(0, 26) + '…' : n.title}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* HUD */}
          <div className="ag-hud ag-hud--tl">
            <div className="ag-pill">
              <span className="ag-pill__label">FOCUS</span>
              <span style={{ color: AG_TONE(current.tone), fontWeight:600 }}>●</span>
              <span>{current.title.length > 24 ? current.title.slice(0,22)+'…' : current.title}</span>
            </div>
            <div className="ag-pill">
              <span className="ag-pill__label">HOPS</span>
              <span>{depth}</span>
              <span className="ag-pill__sep">·</span>
              <span className="ag-pill__label">REACH</span>
              <span>{Object.keys(hopsFrom).length}</span>
            </div>
          </div>

          <div className="ag-hud ag-hud--tr">
            <div className="ag-pill">
              <span className="ag-pill__label">LAYOUT</span>
              <span>{layout.toUpperCase()}</span>
            </div>
            <div className="ag-pill">
              <span className="ag-pill__label">FILTER</span>
              <span>{Object.entries(tonesOn).filter(([_,v]) => v).length}/4 tones</span>
            </div>
          </div>

          <div className="ag-hud ag-hud--bl">
            <div className="ag-pill">
              <span className="ag-pill__label">CURSOR</span>
              <span>{hoverId ? (byId[hoverId].title.slice(0,30)) : '—'}</span>
            </div>
          </div>

          <div className="ag-hud ag-hud--br">
            <div className="ag-zoom">
              <button title="Zoom out" onClick={() => setZoom(Math.max(50, zoom - 10))}><ZoomOut size={11}/></button>
              <span className="ag-zoom__val tabular">{zoom}%</span>
              <button title="Zoom in" onClick={() => setZoom(Math.min(200, zoom + 10))}><ZoomIn size={11}/></button>
              <button title="Fit" onClick={() => setZoom(100)} style={{ marginLeft: 2 }}><Maximize size={11}/></button>
            </div>
          </div>
        </div>
      </section>
      {!railOpen && <button className="ag-edge ag-edge--rail" title="Show inspector" onClick={() => setRailOpen(true)}><ChevronLeft size={11}/></button>}

      {/* RAIL */}
      {railOpen && (
        <aside className="ag-rail">
          <div className="ag-rail__head">
            <div className="ag-rail__head-text">
              <div className="ag-rail__id">N-{current.id.toUpperCase()} · {current.tone.toUpperCase()}</div>
              <div className="ag-rail__title">{current.title}</div>
            </div>
            <button className="ag-rail__close" title="Close" onClick={() => setRailOpen(false)}><ChevronRight size={13}/></button>
          </div>
          <div className="ag-rail__body">
            <div className="ag-rail__sec">
              <div className="ag-rail__sec-label"><span>Metrics</span></div>
              <div className="ag-meta-row"><label>Words</label><val>{current.wordCount.toLocaleString()}</val></div>
              <div className="ag-meta-row"><label>Out</label><val>{current.links}</val></div>
              <div className="ag-meta-row"><label>In</label><val>{current.backlinks}</val></div>
              <div className="ag-meta-row"><label>Tone</label><val style={{ color: AG_TONE(current.tone) }}>{current.tone}</val></div>
              <div className="ag-meta-row"><label>Updated</label><val>{current.t}h ago</val></div>
              <div className="ag-meta-row"><label>Reach@d{depth}</label><val>{Object.keys(hopsFrom).length}</val></div>
            </div>
            <div className="ag-rail__sec">
              <div className="ag-rail__sec-label"><span>Tags</span><b>{current.tags.length}</b></div>
              <div className="ag-chips">
                {current.tags.map(t => <span key={t} className="ag-chip">#{t}</span>)}
              </div>
            </div>
            <div className="ag-rail__sec">
              <div className="ag-rail__sec-label"><span>Neighbors</span><b>{neighbors.length}</b></div>
              <div className="ag-bl">
                {neighbors.slice(0, 8).map(n => (
                  <button key={n.id} className="ag-bl-item" onClick={() => setActiveId(n.id)}>
                    <span className="ag-bl-item__dot" style={{ background: AG_TONE(n.tone) }}/>
                    <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.title}</span>
                    <span className="ag-bl-item__hop">d{hopsFrom[n.id]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="ag-rail__sec">
              <div className="ag-rail__sec-label"><span>Path to top backlink</span></div>
              <div className="ag-bl">
                {[current, byId['n1'], byId['n9']].filter(Boolean).map((n, i, arr) => (
                  <div key={n.id} style={{ display:'flex', alignItems:'center', gap: 8 }}>
                    <button className="ag-bl-item" onClick={() => setActiveId(n.id)} style={{ flex: 1 }}>
                      <span className="ag-bl-item__dot" style={{ background: AG_TONE(n.tone) }}/>
                      <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.title}</span>
                    </button>
                    {i < arr.length - 1 && <span style={{ color:'var(--sidebar-muted)', fontSize: 11, fontFamily:'var(--font-mono)' }}>↓</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

window.AGraph = AGraph;
