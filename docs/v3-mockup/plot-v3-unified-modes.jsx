/* @jsx React.createElement */
/* Plot v3 — Mode adapters
 * Each mode receives the same props from PlotUnified:
 *   { notes, allNotes, activeNoteId, setActiveNoteId, grouped, setGrouped, theme }
 */

const { useMemo: useMemoU } = React;

const F_M = (name, fb) => window[name] || (fb && window[fb]) || window.Circle || (() => null);

/* ─── GALLERY MODE — Atelier cards on warm canvas ──────────────────── */
function UGalleryMode({ notes, activeNoteId, setActiveNoteId }) {
  const D = window.PlotData;
  const groups = D.groupByTime(notes);

  return (
    <div className="u-gallery">
      <div className="u-gallery__head">
        <div className="u-gallery__title">The Workshop</div>
        <div className="u-gallery__meta">{notes.length} cards · sorted by recency</div>
      </div>

      {groups.map(g => (
        <section key={g.id}>
          <header className="u-gallery__section-head">
            <div className="u-gallery__section-label">{g.label}</div>
            <div className="u-gallery__section-count">{g.range || ''} · {g.rows.length}</div>
          </header>
          <div className="u-gallery__grid">
            {g.rows.map(n => (
              <UGalleryCard key={n.id} note={n}
                active={activeNoteId === n.id}
                onClick={() => setActiveNoteId(n.id)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function UGalleryCard({ note, active, onClick }) {
  const Icon = F_M(note.icon);
  const Hash = F_M('Hash');
  // Cover gradient from tone hue
  const cover = `linear-gradient(135deg, oklch(72% 0.13 ${note.hue}) 0%, oklch(58% 0.16 ${(note.hue + 25) % 360}) 100%)`;

  return (
    <article className="u-card" data-active={active} data-spread={note.spread} onClick={onClick}>
      <div className="u-card__cover" style={{ background: cover }}>
        <div className="u-card__icon-bg"><Icon size={32} /></div>
      </div>
      <h3 className="u-card__title">{note.title}</h3>
      <p className="u-card__excerpt">{note.excerpt}</p>
      <footer className="u-card__foot">
        <div className="u-card__tags">
          {note.tags.slice(0,2).map(t => (
            <span key={t} className="u-card__tag">{t}</span>
          ))}
        </div>
        <div className="u-card__meta">
          <span>{note.wordCount.toLocaleString()}w</span>
          <span>·</span>
          <span>{note.updated}</span>
        </div>
      </footer>
    </article>
  );
}

/* ─── TABLE MODE — reuse A1 row look in unified shell ──────────────── */
function UTableMode({ notes, activeNoteId, setActiveNoteId, grouped, setGrouped }) {
  const D = window.PlotData;
  const Hash = F_M('Hash'); const Link2 = F_M('Link');
  const ChevronDown = F_M('ChevronDown'); const Filter = F_M('Filter');
  const Layers = F_M('Layers'); const ArrowUpDown = F_M('Move', 'Layers');
  const Sliders = F_M('Sliders', 'Settings');

  const Row = ({ n }) => {
    const active = activeNoteId === n.id;
    const Icon = F_M(n.icon);
    return (
      <div className="a-row" data-active={active} onClick={() => setActiveNoteId(n.id)}>
        <div className="a-row__lead">
          <span className="a-row__pri" style={{ background:`var(--priority-${n.priority})` }} />
          <span className="a-row__icon" data-tone={n.tone}><Icon size={14} /></span>
          <span className="a-row__title">{n.title}</span>
        </div>
        <div className="a-row__cell a-row__tags">
          {n.tags.slice(0,2).map(t => <span key={t} className="a-tag"><Hash size={9}/>{t}</span>)}
          {n.tags.length > 2 && <span className="a-tag a-tag--more">+{n.tags.length - 2}</span>}
        </div>
        <div className="a-row__cell">
          <span className="a-stchip" data-st={n.status}>
            <span className="a-stchip__dot" />
            {D.statusLabel(n.tone)}
          </span>
        </div>
        <div className="a-row__cell a-row__links mono tabular">
          {n.links > 0 ? (
            <span className="a-links"><Link2 size={10}/> {n.links}<span className="a-links__sep">·</span>{n.backlinks}</span>
          ) : <span className="a-links a-links--zero">—</span>}
        </div>
        <div className="a-row__cell a-row__words mono tabular">{n.wordCount.toLocaleString()}</div>
        <div className="a-row__cell a-row__updated mono tabular">{n.updated}</div>
      </div>
    );
  };

  const groups = grouped ? D.groupByTime(notes) : null;

  return (
    <div style={{ position:'absolute', inset:0, overflow:'auto' }}>
      <div className="a-tabs-row">
        <div className="a-tabs">
          {D.TABS.map(t => (
            <button key={t.id} className="a-tab" data-active={t.id === 'all'}>
              {t.dot && <span className="a-tab__dot" style={{ background:`var(--status-${t.dot})` }} />}
              <span>{t.label}</span>
              <span className="a-tab__count tabular">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="a-tabs__right">
          <button className="a-tool"><Filter size={12}/> Filter</button>
          <button className="a-tool" data-active={grouped} onClick={() => setGrouped(!grouped)}>
            <Layers size={12}/> {grouped ? 'Grouped' : 'Flat'}
          </button>
          <button className="a-tool"><ArrowUpDown size={12}/> Updated</button>
          <button className="a-tool"><Sliders size={12}/> Display</button>
        </div>
      </div>

      <div className="a-table">
        <div className="a-th">
          <div className="a-th__cell" style={{ gridColumn:'1 / 2' }}>Title</div>
          <div className="a-th__cell">Tags</div>
          <div className="a-th__cell">Status</div>
          <div className="a-th__cell">Links</div>
          <div className="a-th__cell">Words</div>
          <div className="a-th__cell">Updated</div>
        </div>

        {grouped ? groups.map(g => (
          <div key={g.id}>
            <div className="a-tg">
              <ChevronDown size={11}/>
              <span className="a-tg__label">{g.label}</span>
              {g.range && <span className="a-tg__range mono">{g.range}</span>}
              <span className="a-tg__count tabular">{g.rows.length}</span>
              <div className="a-tg__line" />
            </div>
            {g.rows.map(n => <Row key={n.id} n={n} />)}
          </div>
        )) : notes.map(n => <Row key={n.id} n={n} />)}
      </div>
    </div>
  );
}

/* ─── STUBS for Studio / Editorial / Graph (Step 3 fills these) ────── */
function UStudioMode({ notes, activeNoteId, setActiveNoteId }) {
  const D = window.PlotData;
  const Play = F_M('Play'); const Pause = F_M('Pause');
  const Skip = F_M('Skip', 'ChevronRight'); const Back = F_M('SkipBack', 'ChevronLeft');
  const Plus = F_M('Plus'); const Settings = F_M('Settings');
  const Filter = F_M('Filter'); const Search = F_M('Search');
  const active = D.NOTES.find(n => n.id === activeNoteId) || notes[0];
  const ActiveIcon = F_M(active?.icon || 'FileText');
  const Hash = F_M('Hash');

  // Random-ish stable bar heights for waveform
  const barHeights = useMemoU(() => {
    const arr = []; let s = 0.42;
    for (let i = 0; i < 120; i++) {
      s = (Math.sin(i * 0.31) + Math.sin(i * 0.13) + 2.4) / 4.8;
      arr.push(Math.max(0.08, Math.min(0.95, s + (i === 60 ? 0.1 : 0))));
    }
    return arr;
  }, []);

  const playheadPct = 32; // visual

  return (
    <div className="u-studio">
      {/* Transport bar */}
      <div className="u-studio__transport">
        <button className="u-studio__transport-btn"><Back size={13} /></button>
        <button className="u-studio__transport-btn" data-primary="true" title="Play"><Play size={13} /></button>
        <button className="u-studio__transport-btn"><Skip size={13} /></button>
        <div className="u-studio__readout">00:14:22 / 00:42:18</div>
        <button className="u-studio__transport-btn" style={{marginLeft:8}} title="Filter"><Filter size={12} /></button>
        <button className="u-studio__transport-btn" title="Search"><Search size={12} /></button>
        <div className="u-studio__transport-meta">
          <span><b>BPM</b> 124</span>
          <span><b>Key</b> A♭ maj</span>
          <span><b>Notes</b> {notes.length} / 247</span>
        </div>
      </div>

      {/* Track list */}
      <div className="u-studio__canvas">
        {notes.map(n => {
          const Icon = F_M(n.icon);
          const bg = `oklch(58% 0.16 ${n.hue})`;
          return (
            <div key={n.id} className="u-studio__rail"
              data-active={activeNoteId === n.id}
              onClick={() => setActiveNoteId(n.id)}>
              <div className="u-studio__rail-head">
                <span className="u-studio__rail-icon" style={{ background: bg, color:'#fff' }}>
                  <Icon size={15} />
                </span>
                <div className="u-studio__rail-info">
                  <div className="u-studio__rail-title">{n.title}</div>
                  <div className="u-studio__rail-meta">{n.wordCount.toLocaleString()}w · {n.tone} · {n.updated}</div>
                </div>
              </div>
              <div className="u-studio__rail-track">
                {n.tracks.map((fill, i) => (
                  <div key={i} className="u-studio__seg" data-fill={fill} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspector */}
      <aside className="u-studio__inspector">
        <div className="u-studio__inspector-head">
          <span className="u-studio__inspector-icon" style={{ background:`oklch(58% 0.16 ${active.hue})`, color:'#fff' }}>
            <ActiveIcon size={17} />
          </span>
          <div>
            <div className="u-studio__inspector-title">{active.title}</div>
            <div className="u-studio__inspector-sub">TRACK · {active.id.toUpperCase()}</div>
          </div>
        </div>
        <div className="u-studio__inspector-section">
          <div className="u-studio__inspector-label">Stats</div>
          <div className="u-studio__pair"><span>Words</span><span>{active.wordCount.toLocaleString()}</span></div>
          <div className="u-studio__pair"><span>Links</span><span>{active.links} / {active.backlinks}</span></div>
          <div className="u-studio__pair"><span>Updated</span><span>{active.updated}</span></div>
          <div className="u-studio__pair"><span>Priority</span><span style={{textTransform:'capitalize'}}>{active.priority}</span></div>
        </div>
        <div className="u-studio__inspector-section">
          <div className="u-studio__inspector-label">Tags</div>
          <div className="u-studio__chip-row">
            {active.tags.map(t => <span key={t} className="u-studio__chip">{t}</span>)}
          </div>
        </div>
        <div className="u-studio__inspector-section">
          <div className="u-studio__inspector-label">Excerpt</div>
          <div style={{ fontSize:11.5, color:'#9aa0a8', lineHeight:1.45, fontStyle:'italic' }}>
            "{active.excerpt}"
          </div>
        </div>
      </aside>

      {/* Timeline */}
      <div className="u-studio__timeline">
        <div className="u-studio__timeline-head">
          <span>Master · {active.title}</span>
          <span style={{fontFamily:'Geist Mono, monospace', fontVariantNumeric:'tabular-nums'}}>00 — 16 — 32 — 48 — 64</span>
        </div>
        <div className="u-studio__timeline-track">
          <div className="u-studio__waveform">
            {barHeights.map((h, i) => (
              <div key={i} className="u-studio__bar" style={{ height: `${h * 100}%`, opacity: 0.35 + h * 0.5 }} />
            ))}
          </div>
          <div className="u-studio__playhead" style={{ left: `${playheadPct}%` }} />
        </div>
      </div>
    </div>
  );
}

function UEditorialMode({ notes, activeNoteId, setActiveNoteId }) {
  const D = window.PlotData;
  const active = D.NOTES.find(n => n.id === activeNoteId) || notes[0];
  const others = notes.filter(n => n.id !== active.id).slice(0, 6);

  return (
    <div className="u-edit">
      <div className="u-edit__masthead">
        <div className="u-edit__masthead-l">Vol. III · Plot Press</div>
        <div className="u-edit__title">The Marginalia</div>
        <div className="u-edit__masthead-r">Wed · Nov 6, 2025</div>
      </div>
      <div className="u-edit__strip">
        <span>{active.issue || 'No. 47'} — Feature</span>
        <span>{notes.length} entries · {active.tone}</span>
      </div>

      <div className="u-edit__spread">
        <article className="u-edit__feature">
          <div className="u-edit__kicker">{active.tags[0]?.replace('-', ' ') || 'Notes'}</div>
          <h1 className="u-edit__headline">{active.title}</h1>
          <p className="u-edit__deck">{active.subtitle || active.excerpt}</p>
          <div className="u-edit__byline">
            <span>By <b>{active.author || 'You'}</b></span>
            <span>·</span>
            <span>{active.wordCount.toLocaleString()} words</span>
            <span>·</span>
            <span>{active.updated} ago</span>
          </div>
          <div className="u-edit__body">
            {(active.body || [active.excerpt]).map((p, i) => <p key={i}>{p}</p>)}
            <p style={{color:'#8a7f6c', fontStyle:'italic'}}>— Continued on the next spread.</p>
          </div>
        </article>

        <aside className="u-edit__rail">
          <div className="u-edit__rail-head">In this issue</div>
          {others.map(n => (
            <div key={n.id} className="u-edit__entry"
              data-active={false}
              onClick={() => setActiveNoteId(n.id)}>
              <div className="u-edit__entry-kicker">{n.tags[0]?.replace('-', ' ') || 'Notes'}</div>
              <div className="u-edit__entry-title">{n.title}</div>
              <div className="u-edit__entry-deck">{n.subtitle || n.excerpt.slice(0, 80) + '…'}</div>
              <div className="u-edit__entry-meta">
                <span>{n.wordCount.toLocaleString()}w</span>
                <span>·</span>
                <span>{n.updated}</span>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function UGraphMode({ notes, activeNoteId, setActiveNoteId }) {
  const D = window.PlotData;
  const W = 1100, H = 700;

  // Position nodes deterministically in a soft circular fan
  const positions = useMemoU(() => {
    const map = {};
    const cx = W / 2, cy = H / 2;
    notes.forEach((n, i) => {
      const angle = (i / notes.length) * Math.PI * 2 - Math.PI / 2;
      // wiki/permanent stay closer to center; inbox/capture drift out
      const r = (n.tone === 'permanent' ? 200 : n.tone === 'wiki' ? 170 : 280)
              + ((i % 3) - 1) * 28;
      map[n.id] = { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    });
    return map;
  }, [notes]);

  const visible = new Set(notes.map(n => n.id));
  const edges = D.EDGES.filter(([a, b]) => visible.has(a) && visible.has(b));

  const toneColor = {
    inbox: 'oklch(62% 0.18 250)',
    capture: 'oklch(70% 0.18 50)',
    permanent: 'oklch(58% 0.14 145)',
    wiki: 'oklch(60% 0.16 290)',
  };

  return (
    <div className="u-graph">
      <svg className="u-graph__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        {/* Edges */}
        {edges.map(([a, b], i) => {
          const p1 = positions[a], p2 = positions[b];
          if (!p1 || !p2) return null;
          const isActive = a === activeNoteId || b === activeNoteId;
          return (
            <line key={i}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={isActive ? 'oklch(60% 0.18 28)' : 'rgba(120,120,140,0.22)'}
              strokeWidth={isActive ? 1.8 : 1}
            />
          );
        })}
        {/* Nodes */}
        {notes.map(n => {
          const p = positions[n.id];
          if (!p) return null;
          const r = n.tone === 'permanent' ? 12 : n.tone === 'wiki' ? 10 : 8;
          const isActive = n.id === activeNoteId;
          return (
            <g key={n.id} style={{ cursor:'pointer' }}
              onClick={() => setActiveNoteId(n.id)}>
              <circle cx={p.x} cy={p.y} r={r + (isActive ? 4 : 0)}
                fill={toneColor[n.tone]}
                stroke={isActive ? '#fff' : 'rgba(255,255,255,0.5)'}
                strokeWidth={isActive ? 2.5 : 1.2}
                opacity={isActive ? 1 : 0.85}
              />
              <text
                x={p.x}
                y={p.y + r + 14}
                textAnchor="middle"
                className={isActive ? 'u-graph__node-label' : 'u-graph__node-label u-graph__node-label--muted'}>
                {n.title.length > 28 ? n.title.slice(0, 26) + '…' : n.title}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="u-graph__legend">
        <div className="u-graph__legend-title">Tones</div>
        <div className="u-graph__legend-item"><span className="u-graph__legend-dot" style={{background:toneColor.permanent}} />Permanent</div>
        <div className="u-graph__legend-item"><span className="u-graph__legend-dot" style={{background:toneColor.wiki}} />Wiki</div>
        <div className="u-graph__legend-item"><span className="u-graph__legend-dot" style={{background:toneColor.capture}} />Fleeting</div>
        <div className="u-graph__legend-item"><span className="u-graph__legend-dot" style={{background:toneColor.inbox}} />Inbox</div>
      </div>
      <div className="u-graph__hud">
        <span><b>{notes.length}</b> nodes</span>
        <span><b>{edges.length}</b> edges</span>
        <span>density <b>{(edges.length / Math.max(1, notes.length)).toFixed(2)}</b></span>
      </div>
    </div>
  );
}

/* ─── Detail panel (mode-agnostic) ─────────────────────────────────── */
function UDetailPanel({ note, onClose }) {
  const D = window.PlotData;
  const NoteIcon = F_M(note.icon);
  const Hash = F_M('Hash');
  const ChevronRight = F_M('ChevronRight');

  return (
    <aside className="a-detail">
      <div className="a-detail__head">
        <div className="a-detail__title">
          <span className="a-row__icon" data-tone={note.tone} style={{width:22, height:22}}>
            <NoteIcon size={13} />
          </span>
          Details
        </div>
        <button className="a-icb" title="Close" onClick={onClose}>
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
              {D.statusLabel(note.tone)}
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
          <div className="a-detail__label">Excerpt</div>
          <div className="a-detail__excerpt">"{note.excerpt}"</div>
        </div>
      </div>
    </aside>
  );
}

window.UTableMode = UTableMode;
window.UGalleryMode = UGalleryMode;
window.UStudioMode = UStudioMode;
window.UEditorialMode = UEditorialMode;
window.UGraphMode = UGraphMode;
window.UDetailPanel = UDetailPanel;
