/* @jsx React.createElement */
const { useState: useStateCC } = React;

// Articles — written as 2 short paragraphs each so column flow looks real
const CC_ARTICLES = [
  {
    id:'n1', tone:'permanent', cat:'Essays', page:'p. 04',
    title:'Spaced repetition for design <em>systems</em>',
    deck:'The Anki model is too rigid; the Roam model too passive. The middle path resurfaces an old note when you start writing a related one — without you asking.',
    body:[
      'There is a moment, midway through writing, when you reach for a fact that you know you have written down before. You can almost see the page. You search, you scroll; you find it three minutes later, half-buried in a daily note from a Tuesday in March. The cost is not the search itself; it is the drop in altitude. You came down out of the writing to fetch a thing, and getting back up is harder than the trip down.',
      'A second-brain that earns its name should rise to meet you. The retrieval should happen in the same gesture as the writing. Roam tried this with bidirectional links; Obsidian inherited it; both stopped short of doing the work for you. What you want is closer to a librarian who reads over your shoulder, slides the right book onto the desk, and steps out of frame.'
    ],
    tags:['notes','learning','systems'], updated:'2h', wordCount:1240, links:8, backlinks:14
  },
  {
    id:'n2', tone:'permanent', cat:'Studies', page:'p. 12',
    title:'Why <em>bento</em> layouts work for dashboards',
    deck:'A grid is a contract; a bento is a conversation. Each cell argues for its own size, and the page reads like a paragraph instead of a spreadsheet.',
    body:[
      'Strict grids tell you what to look at first by demanding equal weight from every cell. Bento layouts let one box swell, another shrink, a third recede into ornament. The eye finds rhythm without being marched.',
      'The trade-off is rigor. A bento that grows by accident becomes a junk drawer. The discipline is in the negative space and the arithmetic of widths — when one cell doubles, another must halve, or the column rule snaps. Done well, the page feels designed; done poorly, it feels arranged.'
    ],
    tags:['design','layout','dashboards'], updated:'4h', wordCount:890, links:5, backlinks:9
  },
  {
    id:'n3', tone:'capture', cat:'Notebook', page:'p. 22',
    title:'Plot v3 — <em>directions</em> from a Tuesday meeting',
    deck:'Two main directions on the table: a Linear-precision instrument (A), and a Studio operating system (C) with three tonal subdirections.',
    body:[
      'Direction A treats the app as a precision instrument: dense type, surgical color, every pixel intentional. Direction C treats it as a workspace — a personal operating system whose shape is set by the kind of work you happen to be doing that day.',
      'Within C the team sketched three tones — Atelier (warm and tactile), Pro Studio (instrument-grade), and Editorial (publication, columns, masthead). Each is the same product wearing a different attitude. The bet is that more than one of them will turn out to be defensible.'
    ],
    tags:['plot','meetings','strategy'], updated:'5h', wordCount:340, links:2, backlinks:3
  },
  {
    id:'n4', tone:'inbox', cat:'Margins', page:'p. 28',
    title:'Linear\'s command palette, briefly',
    deck:'Fuzzy match, recency boost, mode awareness, and a stack that collapses on Esc. The good parts you should steal.',
    body:[
      'The fuzzy ranker quietly weights commands you used recently, so the muscle-memory shortcut wins out over the alphabetically lucky one. Mode awareness is what keeps the palette legible: in an issue view, "assign" appears at the top; in the inbox, "archive" does.',
      'The stack of nested menus is built so you can always Esc back one step instead of losing your context entirely. It is a small thing that makes the palette feel like a tool rather than a search engine.'
    ],
    tags:['linear','engineering','palettes'], updated:'yesterday', wordCount:180, links:1, backlinks:0
  },
  {
    id:'n5', tone:'permanent', cat:'Studies', page:'p. 34',
    title:'Mercury — visual <em>hierarchy</em> in banking',
    deck:'Numbers are the protagonists. Captions whisper. Whitespace does the structural work that borders usually do in financial UI.',
    body:[
      'Most banking apps treat the number as data and the chrome as design. Mercury inverts this. The figure is set in tabular oldstyle at sixty-plus pixels; the label hangs beneath it as a small-caps caption. The eye reads what matters before it reads what it is.',
      'The company\'s product surface uses borders sparingly. Where another app would draw a card, Mercury uses a wider gutter and a denser cell — the geometry alone tells you where the boundary is. The result is a page that looks ordered but does not feel fenced in.'
    ],
    tags:['fintech','design','typography'], updated:'2d', wordCount:1820, links:12, backlinks:7
  },
  {
    id:'n6', tone:'permanent', cat:'Letters', page:'p. 42',
    title:'On rhythm in <em>long-form</em> writing',
    deck:'Sentences need varying length the way a song needs rests. Pace is rhythm, not speed.',
    body:[
      'A long sentence, taken alone, can become exhausting. A short one, alone, can read as glib. The trick of paced prose is the layering of the two, so the long ones earn the attention the short ones release.',
      'Many writing tools optimize for word count. They are measuring weight when they should be measuring rhythm. A page of fifteen-word sentences is heavier than a page that mixes a forty-word sentence with three of seven words, even if the totals match. Tools should make the mix visible.'
    ],
    tags:['writing','craft'], updated:'3d', wordCount:670, links:6, backlinks:4
  },
];

const CC_SECTIONS = [
  { num:'I',   label:'Essays',   ids:['n1'] },
  { num:'II',  label:'Studies',  ids:['n2','n5'] },
  { num:'III', label:'Notebook', ids:['n3'] },
  { num:'IV',  label:'Margins',  ids:['n4'] },
  { num:'V',   label:'Letters',  ids:['n6'] },
];

const CC_TONE_FILTERS = [
  { id:'all',       label:'All',       count: 247 },
  { id:'inbox',     label:'Notebook',  count: 12,  tone:'inbox' },
  { id:'capture',   label:'Notebook',  count: 28,  tone:'capture' },
  { id:'permanent', label:'Essays',    count: 184, tone:'permanent' },
];

function CCNotesEditorial({ theme }) {
  const [activeId, setActiveId] = useStateCC('n1');
  const [activeFilter, setActiveFilter] = useStateCC('all');
  const [idxOpen, setIdxOpen] = useStateCC(true);
  const [margOpen, setMargOpen] = useStateCC(true);
  const [panelMenuOpen, setPanelMenuOpen] = useStateCC(false);

  const F = (name, fb) => window[name] || (fb && window[fb]) || (() => null);
  const Search = F('Search');
  const Plus = F('Plus');
  const Filter = F('Filter');
  const Sliders = F('Sliders');
  const Settings = F('Settings');
  const Menu = F('Menu');
  const Check = F('Check');
  const ChevronLeft = F('ChevronLeft');
  const ChevronRight = F('ChevronRight');
  const Bell = F('Bell');
  const Info = F('Info');
  const Bookmark = F('Bookmark');
  const Eye = F('Eye');
  const Print = F('Printer', 'FileText');
  const MoreHorizontal = F('MoreHorizontal', 'MoreVertical');
  const Sun = F('Sun');
  const Moon = F('Moon');

  const byId = Object.fromEntries(CC_ARTICLES.map(n => [n.id, n]));
  const current = byId[activeId] || CC_ARTICLES[0];

  return (
    <div className="cc-app" style={{ position:'relative' }}>
      {/* INDEX (left) */}
      {idxOpen && (
        <aside className="cc-index">
          <div className="cc-index__head">
            <div className="cc-index__masthead">PLOT <em>Quarterly</em></div>
            <div className="cc-index__sub">Vol. III · No. 47</div>
          </div>
          <div className="cc-index__body">
            {CC_SECTIONS.map(sec => (
              <div key={sec.label}>
                <div className="cc-index__sec">
                  <span className="cc-index__sec-num">{sec.num}</span>
                  <span className="cc-index__sec-label">{sec.label}</span>
                  <span className="cc-index__sec-rule"/>
                </div>
                {sec.ids.map(id => {
                  const a = byId[id];
                  return (
                    <button key={id} className="cc-index__row" data-active={activeId === id} onClick={() => setActiveId(id)}>
                      <span className="cc-index__row__page">{a.page.replace('p. ','')}</span>
                      <span className="cc-index__row__title" dangerouslySetInnerHTML={{ __html: a.title }}/>
                      <span className="cc-index__row__dot" style={{ background: `var(--cc-${a.tone === 'permanent' ? 'red' : a.tone === 'capture' ? 'gold' : 'paper-rule-2'})` }}/>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>
      )}
      {!idxOpen && <button className="cc-edge cc-edge--idx" title="Show index" onClick={() => setIdxOpen(true)}><ChevronRight size={11}/></button>}

      {/* SPREAD (center) */}
      <section className="cc-spread">
        {/* Folio */}
        <div className="cc-folio">
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{position:'relative'}}>
              <button className="cc-folio__icb" title="Panels" data-active={panelMenuOpen} onClick={(e) => { e.stopPropagation(); setPanelMenuOpen(!panelMenuOpen); }}>
                <Menu size={13}/>
              </button>
              {panelMenuOpen && (
                <>
                  <div style={{position:'fixed', inset:0, zIndex:55}} onClick={() => setPanelMenuOpen(false)} />
                  <div className="cc-pop" style={{ left: 0 }}>
                    <div className="cc-pop__label">Panels</div>
                    <button className="cc-pop__row" onClick={() => setIdxOpen(!idxOpen)}><span>Index</span>{idxOpen && <Check size={12}/>}</button>
                    <button className="cc-pop__row" onClick={() => setMargOpen(!margOpen)}><span>Marginalia</span>{margOpen && <Check size={12}/>}</button>
                    <div className="cc-pop__sep"/>
                    <button className="cc-pop__row" onClick={() => { setIdxOpen(true); setMargOpen(true); setPanelMenuOpen(false); }}><span>Show all</span></button>
                    <button className="cc-pop__row" onClick={() => { setIdxOpen(false); setMargOpen(false); setPanelMenuOpen(false); }}><span>Hide all</span></button>
                  </div>
                </>
              )}
            </div>
            <span><b>PLOT QUARTERLY</b> · Vol. III · No. 47</span>
          </div>
          <div className="cc-folio__center">November 2025 · The Notebook Issue</div>
          <div className="cc-folio__right">
            <span>247 articles · 184 essays</span>
            <button className="cc-folio__icb" title="Subscribe"><Bell size={12}/></button>
            <button className="cc-folio__icb" title="Bookmarks"><Bookmark size={12}/></button>
            <button className="cc-folio__icb" title="Print"><Print size={12}/></button>
          </div>
        </div>

        {/* Masthead */}
        <header className="cc-mast">
          <div>
            <h1 className="cc-mast__title">The <em>Notebook</em><br/>Issue</h1>
            <div className="cc-mast__byline">An almanac of margins, fragments, and second thoughts</div>
          </div>
          <div className="cc-mast__meta">
            <div className="cc-mast__meta-row"><label>Folio</label><val>1 of 8</val></div>
            <div className="cc-mast__meta-row"><label>Established</label><val>MMXXIII</val></div>
            <div className="cc-mast__meta-row"><label>Editor</label><val>—</val></div>
            <div className="cc-mast__meta-row"><label>Issue</label><val>N°47</val></div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="cc-tools">
          <div className="cc-tools__group">
            {CC_TONE_FILTERS.map(f => (
              <button key={f.id} className="cc-pill" data-active={activeFilter === f.id} onClick={() => setActiveFilter(f.id)}>
                {f.label}
                <span className="cc-pill__count tabular">{f.count}</span>
              </button>
            ))}
          </div>
          <div className="cc-tools__spacer"/>
          <div className="cc-tools__search">
            <Search size={11}/>
            <span>Search the issue</span>
            <kbd>⌘K</kbd>
          </div>
          <button className="cc-folio__icb" data-active={margOpen} title="Marginalia" onClick={() => setMargOpen(!margOpen)}><Info size={13}/></button>
          <button className="cc-folio__icb"><MoreHorizontal size={13}/></button>
        </div>

        {/* Articles */}
        <div className="cc-scroll">
          {CC_ARTICLES
            .filter(a => activeFilter === 'all' ? true : a.tone === activeFilter)
            .map(a => (
              <article key={a.id} className="cc-article" data-active={activeId === a.id} onClick={() => setActiveId(a.id)}>
                <div className="cc-article__kicker">
                  <span className="cc-article__cat" data-tone={a.tone}>{a.cat}</span>
                  <span className="cc-article__rule"/>
                  <span className="cc-article__page">{a.page}</span>
                </div>
                <h2 className="cc-article__head" dangerouslySetInnerHTML={{ __html: a.title }}/>
                <p className="cc-article__deck">{a.deck}</p>
                <div className="cc-article__body">
                  {a.body.map((p, i) => <p key={i}>{p}</p>)}
                </div>
                <div className="cc-article__foot">
                  <span><b>{a.wordCount.toLocaleString()}</b> words</span>
                  <span className="cc-article__foot__sep"/>
                  <span><b>{a.links}</b> refs</span>
                  <span className="cc-article__foot__sep"/>
                  <span><b>{a.backlinks}</b> citations</span>
                  <span className="cc-article__foot__sep"/>
                  <div className="cc-article__foot__tags">
                    {a.tags.map(t => <span key={t} className="cc-article__foot__tag">#{t}</span>)}
                  </div>
                  <span style={{marginLeft:'auto'}}>filed {a.updated}</span>
                </div>
              </article>
            ))}
        </div>
      </section>

      {/* MARGINALIA (right) */}
      {margOpen && (
        <aside className="cc-marg">
          <div className="cc-marg__head">
            <div className="cc-marg__head-text">
              <div className="cc-marg__eyebrow">{current.cat} · {current.page}</div>
              <h3 className="cc-marg__title" dangerouslySetInnerHTML={{ __html: current.title }}/>
            </div>
            <button className="cc-marg__close" title="Close" onClick={() => setMargOpen(false)}><ChevronRight size={13}/></button>
          </div>

          <div className="cc-marg__body">
            <div className="cc-marg__sec">
              <div className="cc-marg__sec-label">Deck</div>
              <div className="cc-marg__quote">{current.deck}</div>
            </div>

            <div className="cc-marg__sec">
              <div className="cc-marg__sec-label">Colophon</div>
              <div className="cc-marg__line"><label>Filed</label><val>{current.updated}</val></div>
              <div className="cc-marg__line"><label>Words</label><val>{current.wordCount.toLocaleString()}</val></div>
              <div className="cc-marg__line"><label>Refs out</label><val>{current.links}</val></div>
              <div className="cc-marg__line"><label>Citations</label><val>{current.backlinks}</val></div>
              <div className="cc-marg__line"><label>Section</label><val>{current.cat}</val></div>
              <div className="cc-marg__line"><label>Page</label><val>{current.page.replace('p. ','')}</val></div>
            </div>

            <div className="cc-marg__sec">
              <div className="cc-marg__sec-label">Tags</div>
              <div className="cc-marg__chips">
                {current.tags.map(t => <span key={t} className="cc-marg__chip">{t}</span>)}
              </div>
            </div>

            <div className="cc-marg__sec">
              <div className="cc-marg__sec-label">Cited by</div>
              <div className="cc-marg__refs">
                {CC_ARTICLES.filter(a => a.id !== current.id).slice(0, 3).map((a, i) => (
                  <button key={a.id} className="cc-marg__ref" onClick={() => setActiveId(a.id)}>
                    <span className="cc-marg__ref-num">{String(i+1).padStart(2,'0')}.</span>
                    <span className="cc-marg__ref-title" dangerouslySetInnerHTML={{ __html: a.title }}/>
                  </button>
                ))}
              </div>
            </div>

            <div className="cc-marg__sec">
              <div className="cc-marg__sec-label">References</div>
              <div className="cc-marg__refs">
                {CC_ARTICLES.filter(a => a.id !== current.id).slice(2, 5).map((a, i) => (
                  <button key={a.id} className="cc-marg__ref" onClick={() => setActiveId(a.id)}>
                    <span className="cc-marg__ref-num">{String(i+1).padStart(2,'0')}.</span>
                    <span className="cc-marg__ref-title" dangerouslySetInnerHTML={{ __html: a.title }}/>
                  </button>
                ))}
              </div>
            </div>

            <div className="cc-marg__sec">
              <div className="cc-marg__sec-label">Errata</div>
              <div style={{ fontFamily:'var(--cc-serif)', fontStyle:'italic', fontSize:12.5, color:'var(--cc-ink-3)', lineHeight:1.5 }}>
                In the previous issue, the byline of <em>"On rhythm in long-form"</em> was incorrectly attributed. The author is the system; the editor regrets the error.
              </div>
            </div>
          </div>
        </aside>
      )}
      {!margOpen && <button className="cc-edge cc-edge--marg" title="Show marginalia" onClick={() => setMargOpen(true)}><ChevronLeft size={11}/></button>}
    </div>
  );
}

window.CCNotesEditorial = CCNotesEditorial;
