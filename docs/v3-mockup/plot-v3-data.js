/* Plot v3 — Unified data model
 *
 * One source of truth for notes, used by all 5 view modes:
 *   Table · Gallery · Studio · Editorial · Graph
 *
 * Exposes window.PlotData = { NOTES, TONES, SPACES, TAGS, helpers }
 */
(function () {
  // ─── Tone enum ──────────────────────────────────────────────────────────
  // tone drives status color, icon backdrop, and editorial/studio accents
  const TONES = {
    inbox:     { label: 'Inbox',     hint: 'Newly captured, not yet processed' },
    capture:   { label: 'Fleeting',  hint: 'Quick thoughts to revisit' },
    permanent: { label: 'Permanent', hint: 'Distilled, evergreen' },
    wiki:      { label: 'Wiki',      hint: 'Reference / structural' },
  };

  // ─── Spaces (left-rail destinations) ────────────────────────────────────
  const SPACES = [
    { id: 'home',     label: 'Home',     icon: 'Home' },
    { id: 'notes',    label: 'Notes',    icon: 'FileText' },
    { id: 'wiki',     label: 'Wiki',     icon: 'WikiBook' },
    { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
    { id: 'ontology', label: 'Ontology', icon: 'OntologyWide' },
    { id: 'library',  label: 'Library',  icon: 'Bookshelf' },
    { id: 'books',    label: 'Books',    icon: 'Bookmarks' },
  ];

  // ─── Tags (with counts) ─────────────────────────────────────────────────
  const TAGS = [
    { id: 'design-systems', count: 42 },
    { id: 'writing',        count: 38 },
    { id: 'tools',          count: 29 },
    { id: 'typography',     count: 21 },
    { id: 'second-brain',   count: 17 },
    { id: 'design',         count: 16 },
    { id: 'engineering',    count: 12 },
    { id: 'productivity',   count: 11 },
  ];

  // ─── Notes ──────────────────────────────────────────────────────────────
  // Each note is rich enough to render in any of the 5 modes.
  // Fields:
  //   id          — stable
  //   icon        — Imperial icon name (window[icon])
  //   tone        — drives accent color & status chip
  //   title       — short headline
  //   subtitle    — editorial deck / 1-line summary
  //   excerpt     — 1–2 sentence pull
  //   body        — paragraphs[] for Editorial / Studio reader
  //   tags        — string[]
  //   updated     — humanized ('2h', 'yesterday', '2d', '1w')
  //   updatedDate — ISO for sort
  //   wordCount, links, backlinks, priority
  //   author      — for editorial byline
  //   issue       — editorial issue number
  //   spread      — gallery cover ratio hint ('square'|'tall'|'wide')
  //   hue         — gallery card stripe hue (deg, oklch)
  //   tracks      — studio mode: bool segments [intro, body, refs, draft]
  //   status      — same as tone for now (kept for back-compat)
  const NOTES = [
    {
      id: 'n1',
      icon: 'Brain',
      tone: 'permanent',
      title: 'Spaced repetition for design systems',
      subtitle: 'Why teams forget their own primitives, and how to build muscle memory back.',
      excerpt: 'The value of a note is not in the moment of capture, but in the moment of return. The system that helps you return is the one worth keeping.',
      body: [
        'Most design systems die not from neglect but from forgetting. A team adopts tokens, ships two products, and three quarters later half the surface is using ad-hoc values again.',
        'The fix is not stricter linting. It is a return ritual — a reason to look at the system that is shorter than the gap between products.',
        'Spaced repetition gives us this for free. Not for the components, but for the principles that hold them together.',
      ],
      tags: ['design-systems', 'learning', 'writing'],
      updated: '2h', updatedDate: '2025-11-06T09:14:00Z',
      wordCount: 1240, links: 8, backlinks: 14, priority: 'high',
      author: 'You',
      issue: 'No. 47',
      spread: 'tall',
      hue: 28,
      tracks: [1, 1, 1, 0.6],
      status: 'permanent',
    },
    {
      id: 'n2',
      icon: 'Layers',
      tone: 'wiki',
      title: 'Why Bento layouts work for dashboards',
      subtitle: 'Spatial chunking, modular density, and the limits of the grid.',
      excerpt: 'Bento layouts compress the grid until each cell is a unit of meaning. The trick is choosing what cannot be split.',
      body: [
        'A dashboard is a wall of glances. Bento layouts give each glance a frame, which sounds trivial but changes how the eye reads density.',
        'The risk is a checkerboard of charts that all feel equally important. The cure is rhythm — making one cell larger than the others, on purpose.',
      ],
      tags: ['design', 'layout', 'design-systems'],
      updated: '4h', updatedDate: '2025-11-06T07:02:00Z',
      wordCount: 890, links: 5, backlinks: 9, priority: 'medium',
      author: 'You',
      issue: 'No. 46',
      spread: 'wide',
      hue: 195,
      tracks: [1, 1, 0.8, 0],
      status: 'permanent',
    },
    {
      id: 'n3',
      icon: 'Target',
      tone: 'capture',
      title: 'Plot v3 design directions — meeting notes',
      subtitle: 'Notes from the kickoff. Three directions on the table, no decision yet.',
      excerpt: 'Atelier feels alive. Pro Studio feels capable. Editorial feels considered. We need to decide what the product wants to be when you stop using it.',
      body: [
        'Three directions on the table: Atelier (warm, physical), Pro Studio (dark, professional), Editorial (typographic, considered).',
        'Open question: do we pick one or do we let the same data render in any of them?',
      ],
      tags: ['plot', 'meetings'],
      updated: '5h', updatedDate: '2025-11-06T06:00:00Z',
      wordCount: 340, links: 2, backlinks: 3, priority: 'medium',
      author: 'You',
      issue: 'No. 45',
      spread: 'square',
      hue: 48,
      tracks: [1, 0.5, 0, 0],
      status: 'capture',
    },
    {
      id: 'n4',
      icon: 'Beaker',
      tone: 'inbox',
      title: "Linear's command palette implementation details",
      subtitle: 'Ranking, scoping, and the surprisingly hard problem of \"recent\".',
      excerpt: 'A good command palette is not a search field with shortcuts. It is a context machine that knows what you almost wanted.',
      body: [
        'Linear ranks results by a mix of recency, frequency, and current view scope. The interesting part is the scope decay.',
        'You almost always want the thing in front of you, until you very specifically do not. Modeling that flip is the whole game.',
      ],
      tags: ['linear', 'engineering', 'tools'],
      updated: 'yesterday', updatedDate: '2025-11-05T11:00:00Z',
      wordCount: 180, links: 1, backlinks: 0, priority: 'low',
      author: 'You',
      issue: 'No. 44',
      spread: 'square',
      hue: 270,
      tracks: [0.6, 0, 0, 0],
      status: 'inbox',
    },
    {
      id: 'n5',
      icon: 'Sitemap',
      tone: 'permanent',
      title: 'Mercury banking — visual hierarchy breakdown',
      subtitle: 'A quiet interface that earns its color by spending none of it.',
      excerpt: 'Mercury earns color by refusing it elsewhere. The screen is paper until something asks to be read.',
      body: [
        'The dashboard is essentially monochrome until a balance, an alert, or a category demands attention. That restraint is the entire design language.',
        'Compared to Brex, which uses purple as a wallpaper, Mercury treats color as punctuation.',
      ],
      tags: ['fintech', 'design', 'design-systems'],
      updated: '2d', updatedDate: '2025-11-04T10:00:00Z',
      wordCount: 1820, links: 12, backlinks: 7, priority: 'medium',
      author: 'You',
      issue: 'No. 43',
      spread: 'wide',
      hue: 145,
      tracks: [1, 1, 1, 1],
      status: 'permanent',
    },
    {
      id: 'n6',
      icon: 'Bold',
      tone: 'permanent',
      title: 'Graphic Anonymous on type pairing',
      subtitle: 'Two voices, never three. A working theory of contrast.',
      excerpt: 'Two voices, never three. Pair a workhorse with a soloist and let the page decide which is speaking.',
      body: [
        'The simplest type pairing is a workhorse for the running text and a soloist for the display. Three voices is one too many.',
        'When in doubt, vary weight before you vary family.',
      ],
      tags: ['typography', 'reference', 'writing'],
      updated: '3d', updatedDate: '2025-11-03T14:00:00Z',
      wordCount: 670, links: 6, backlinks: 4, priority: 'low',
      author: 'You',
      issue: 'No. 42',
      spread: 'tall',
      hue: 8,
      tracks: [1, 1, 0.9, 0],
      status: 'permanent',
    },
    {
      id: 'n7',
      icon: 'Zap',
      tone: 'capture',
      title: 'Why I quit Notion (again)',
      subtitle: 'On performance, opinionation, and the cost of being a database.',
      excerpt: 'Notion asked me to model my world before letting me write in it. The blank page should never have a schema.',
      body: [
        'The pattern that finally drove me out: every time I wanted to write, I had to first decide which database it belonged to.',
        'A note app that asks for a schema before a sentence has lost the plot.',
      ],
      tags: ['tools', 'productivity'],
      updated: '4d', updatedDate: '2025-11-02T16:00:00Z',
      wordCount: 520, links: 3, backlinks: 2, priority: 'medium',
      author: 'You',
      issue: 'No. 41',
      spread: 'square',
      hue: 18,
      tracks: [1, 1, 0, 0],
      status: 'capture',
    },
    {
      id: 'n8',
      icon: 'Network',
      tone: 'inbox',
      title: 'Obsidian graph view — what it gets wrong',
      subtitle: 'Pretty, but not useful. A note on what the visualization is actually for.',
      excerpt: 'Obsidian shows you that you have notes. A useful graph would show you which ones are starting to think together.',
      body: [
        'The Obsidian graph is gorgeous and almost useless. It tells you the topology of your vault, not what it means.',
        'A useful graph view would highlight emerging clusters and flag isolated capture as a temperature, not a layout.',
      ],
      tags: ['obsidian', 'graph', 'critique'],
      updated: '1w', updatedDate: '2025-10-30T10:00:00Z',
      wordCount: 90, links: 0, backlinks: 0, priority: 'low',
      author: 'You',
      issue: 'No. 40',
      spread: 'wide',
      hue: 220,
      tracks: [0.4, 0, 0, 0],
      status: 'inbox',
    },
    {
      id: 'n9',
      icon: 'Eye',
      tone: 'permanent',
      title: "IA Writer's focus mode philosophy",
      subtitle: 'A manifesto disguised as a feature.',
      excerpt: 'The cursor is the camera. Everything else is parallax.',
      body: [
        'IA Writer treats the current sentence as the only thing that exists. The rest of the document is parallax.',
        'It works because the camera moves with the writer, not the other way around.',
      ],
      tags: ['writing', 'tools'],
      updated: '1w', updatedDate: '2025-10-29T10:00:00Z',
      wordCount: 1100, links: 7, backlinks: 5, priority: 'low',
      author: 'You',
      issue: 'No. 39',
      spread: 'tall',
      hue: 38,
      tracks: [1, 1, 1, 0.4],
      status: 'permanent',
    },
    {
      id: 'n10',
      icon: 'Sunrise',
      tone: 'capture',
      title: 'Reflect.app — daily note pattern study',
      subtitle: 'How AI changes the calendar metaphor.',
      excerpt: "Reflect treats the day as the schema. Everything else is just where in time you wrote it.",
      body: [
        'Daily notes only work if the day is meaningful. Reflect leans into this — the date is the schema.',
        'The AI features mostly serve the daily note. They surface what you already know you said but forgot when.',
      ],
      tags: ['ai', 'daily-notes', 'tools'],
      updated: '1w', updatedDate: '2025-10-28T10:00:00Z',
      wordCount: 740, links: 4, backlinks: 2, priority: 'medium',
      author: 'You',
      issue: 'No. 38',
      spread: 'wide',
      hue: 60,
      tracks: [1, 0.7, 0, 0],
      status: 'capture',
    },
    {
      id: 'n11',
      icon: 'Sparkles',
      tone: 'permanent',
      title: 'On rhythm in long-form writing',
      subtitle: 'Sentences are music. The paragraph is the bar line.',
      excerpt: 'Sentences are music. The paragraph is the bar line. The page is the song.',
      body: [
        'Read your draft aloud. The places you stumble are where the rhythm broke.',
        'Variation matters more than length. A short sentence after three long ones is the surprise that earns the rest.',
      ],
      tags: ['writing', 'craft'],
      updated: '2w', updatedDate: '2025-10-21T10:00:00Z',
      wordCount: 2300, links: 9, backlinks: 11, priority: 'high',
      author: 'You',
      issue: 'No. 37',
      spread: 'tall',
      hue: 340,
      tracks: [1, 1, 1, 1],
      status: 'permanent',
    },
    {
      id: 'n12',
      icon: 'Building',
      tone: 'inbox',
      title: 'Architecture of second brains — IndieWeb',
      subtitle: 'Federated thought, owned at the edge.',
      excerpt: 'Second brains should be portable. The IndieWeb pattern is the closest we have to a real answer.',
      body: [
        'The promise of the IndieWeb is ownership at the edge. The cost is everything else.',
        'A federated second brain is technically possible and socially exhausting.',
      ],
      tags: ['second-brain', 'reading'],
      updated: '2w', updatedDate: '2025-10-20T10:00:00Z',
      wordCount: 60, links: 0, backlinks: 0, priority: 'low',
      author: 'You',
      issue: 'No. 36',
      spread: 'square',
      hue: 200,
      tracks: [0.3, 0, 0, 0],
      status: 'inbox',
    },
  ];

  // ─── Time grouping helper ───────────────────────────────────────────────
  function groupFor(updated) {
    if (['2h', '4h', '5h'].includes(updated)) return 'today';
    if (updated === 'yesterday') return 'yesterday';
    if (['2d', '3d', '4d'].includes(updated)) return 'thisweek';
    return 'older';
  }

  const GROUPS = [
    { id: 'today',     label: 'Today',     range: 'Wed · Nov 6' },
    { id: 'yesterday', label: 'Yesterday', range: 'Tue · Nov 5' },
    { id: 'thisweek',  label: 'This week', range: 'Nov 1–4' },
    { id: 'older',     label: 'Older' },
  ];

  // ─── Tabs (top filters) ─────────────────────────────────────────────────
  const TABS = [
    { id: 'all',       label: 'All notes',  count: 247 },
    { id: 'inbox',     label: 'Inbox',      count: 12,  dot: 'inbox' },
    { id: 'capture',   label: 'Fleeting',   count: 28,  dot: 'capture' },
    { id: 'permanent', label: 'Permanent',  count: 184, dot: 'permanent' },
    { id: 'orphan',    label: 'Orphans',    count: 6 },
  ];

  // ─── Filter helper ──────────────────────────────────────────────────────
  function filterNotes(notes, { tab, query, tag } = {}) {
    let out = notes;
    if (tab && tab !== 'all') {
      if (tab === 'orphan') out = out.filter(n => n.links === 0 && n.backlinks === 0);
      else out = out.filter(n => n.tone === tab);
    }
    if (tag) out = out.filter(n => n.tags.includes(tag));
    if (query) {
      const q = query.toLowerCase();
      out = out.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return out;
  }

  // ─── Group by time ──────────────────────────────────────────────────────
  function groupByTime(notes) {
    return GROUPS
      .map(g => ({ ...g, rows: notes.filter(n => groupFor(n.updated) === g.id) }))
      .filter(g => g.rows.length);
  }

  // ─── Status chip label ──────────────────────────────────────────────────
  function statusLabel(tone) {
    return ({
      inbox: 'Inbox',
      capture: 'Fleeting',
      permanent: 'Permanent',
      wiki: 'Wiki',
    })[tone] || tone;
  }

  // ─── Edges (graph mode) ─────────────────────────────────────────────────
  // Synthetic but consistent — same ids referenced across modes
  const EDGES = [
    ['n1', 'n11'], ['n1', 'n6'], ['n1', 'n9'],
    ['n2', 'n5'], ['n2', 'n9'],
    ['n5', 'n2'], ['n5', 'n6'],
    ['n6', 'n11'], ['n6', 'n9'],
    ['n9', 'n11'], ['n9', 'n7'],
    ['n11', 'n1'], ['n11', 'n9'],
    ['n7', 'n10'], ['n10', 'n7'],
    ['n3', 'n4'], ['n4', 'n3'],
  ];

  // ─── View modes ─────────────────────────────────────────────────────────
  const VIEW_MODES = [
    { id: 'table',     label: 'Table',     icon: 'Table',    hint: 'Dense rows, all metadata' },
    { id: 'gallery',   label: 'Gallery',   icon: 'Grid',     hint: 'Atelier — warm cards' },
    { id: 'studio',    label: 'Studio',    icon: 'Layers',   hint: 'Pro Studio — dark, dockable' },
    { id: 'editorial', label: 'Editorial', icon: 'BookOpen', hint: 'Newsroom spread' },
    { id: 'graph',     label: 'Graph',     icon: 'Network',  hint: 'Connections between notes' },
  ];

  window.PlotData = {
    NOTES, EDGES, TONES, SPACES, TAGS, GROUPS, TABS, VIEW_MODES,
    groupFor, filterNotes, groupByTime, statusLabel,
  };
})();
