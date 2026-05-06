// =============================================================
// Plot — note-taking app domain icons (~40)
// 24 viewBox · 1.5px stroke · currentColor
// =============================================================

function pk(paths, opts) {
  opts = opts || {};
  function Comp(props) {
    props = props || {};
    var size = props.size || 20;
    var sw = props.strokeWidth || 1.5;
    var color = props.color || "currentColor";
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke={color}
        strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
        width={size} height={size}
        className={props.className || ""} style={props.style}>
        {paths}
      </svg>
    );
  }
  Comp.keywords = opts.keywords || [];
  return Comp;
}

// ---------- Pages & notes ----------
const PlotNote = pk([
  <path key="a" d="M5 4h11l3 3v13H5z"/>,
  <path key="b" d="M16 4v3h3"/>,
  <path key="c" d="M8 11h8M8 14h8M8 17h5"/>,
], { keywords: ["note", "page", "doc"] });

const PlotNotebook = pk([
  <path key="a" d="M5 4h13a1 1 0 0 1 1 1v15H5z"/>,
  <path key="b" d="M5 4v16"/>,
  <path key="c" d="M3 8h2M3 12h2M3 16h2"/>,
], { keywords: ["notebook", "binder"] });

const PlotPageNew = pk([
  <path key="a" d="M5 4h8l5 5v11H5z"/>,
  <path key="b" d="M13 4v5h5"/>,
  <path key="c" d="M9 14h6M12 11v6"/>,
], { keywords: ["new", "create", "page"] });

const PlotDailyNote = pk([
  <rect key="a" x="4" y="5" width="16" height="15" rx="1.5"/>,
  <path key="b" d="M4 10h16"/>,
  <path key="c" d="M9 3v4M15 3v4"/>,
  <circle key="d" cx="12" cy="15" r="2.5"/>,
], { keywords: ["daily", "today", "journal"] });

const PlotPageHistory = pk([
  <path key="a" d="M5 4h11l3 3v13H5z"/>,
  <path key="b" d="M16 4v3h3"/>,
  <circle key="c" cx="12" cy="14" r="3"/>,
  <path key="d" d="M12 12.5V14l1 1"/>,
], { keywords: ["version", "history", "revision"] });

const PlotDraft = pk([
  <path key="a" d="M5 4h11l3 3v13H5z" strokeDasharray="2 2"/>,
  <path key="b" d="M9 12h6M9 15h4"/>,
], { keywords: ["draft", "wip"] });

const PlotPublish = pk([
  <path key="a" d="M5 4h11l3 3v13H5z"/>,
  <path key="b" d="M16 4v3h3"/>,
  <path key="c" d="m9 14 3-3 3 3M12 11v6"/>,
], { keywords: ["publish", "share", "upload"] });

const PlotSharePage = pk([
  <path key="a" d="M5 4h11l3 3v8"/>,
  <path key="b" d="M5 4v16h8"/>,
  <circle key="c" cx="17.5" cy="18" r="2"/>,
  <circle key="d" cx="13" cy="14" r="1.5"/>,
  <circle key="e" cx="20" cy="14" r="1.5"/>,
  <path key="f" d="m14.4 14.5 1.7 2.5M18.7 16.7l1-1.5"/>,
], { keywords: ["share", "collaborate"] });

const PlotArchive = pk([
  <rect key="a" x="3" y="5" width="18" height="4" rx="1"/>,
  <path key="b" d="M5 9v11h14V9"/>,
  <path key="c" d="M10 13h4"/>,
], { keywords: ["archive", "store"] });

const PlotPin = pk([
  <path key="a" d="M14 4 20 10l-3 1-3 5-2-2-4 4 4-4-2-2 5-3z"/>,
], { keywords: ["pin", "fix"] });

const PlotFavorite = pk([
  <path key="a" d="m12 4 2.4 5 5.6.8-4 4 1 5.6-5-2.6-5 2.6 1-5.6-4-4 5.6-.8z"/>,
], { keywords: ["favorite", "star"] });

// ---------- Hierarchy ----------
const PlotHeading1 = pk([
  <path key="a" d="M4 6v12M12 6v12M4 12h8"/>,
  <path key="b" d="M16 9h2v9M16 18h4"/>,
], { keywords: ["h1", "heading", "title"] });

const PlotHeading2 = pk([
  <path key="a" d="M4 6v12M12 6v12M4 12h8"/>,
  <path key="b" d="M16 9.5a1.5 1.5 0 0 1 3 0c0 1-3 2.5-3 4.5h3M16 18h3"/>,
], { keywords: ["h2", "heading"] });

const PlotHeading3 = pk([
  <path key="a" d="M4 6v12M12 6v12M4 12h8"/>,
  <path key="b" d="M16 9.5a1.5 1.5 0 0 1 3 0c0 1-1 1.5-2 1.5 1 0 2 .5 2 1.5a1.5 1.5 0 0 1-3 1.5"/>,
], { keywords: ["h3", "heading"] });

const PlotParagraph = pk([
  <path key="a" d="M16 4v16M11 4v16"/>,
  <path key="b" d="M16 4h-4.5a3.5 3.5 0 0 0 0 7H16"/>,
], { keywords: ["paragraph", "text"] });

const PlotBlockquote = pk([
  <path key="a" d="M7 8h2.5a1.5 1.5 0 0 1 0 3H8c0 2 1 3 2 3M14 8h2.5a1.5 1.5 0 0 1 0 3H15c0 2 1 3 2 3"/>,
  <path key="b" d="M3 5v14"/>,
], { keywords: ["quote", "blockquote"] });

const PlotCodeInline = pk([
  <path key="a" d="m8 9-3 3 3 3M16 9l3 3-3 3M14 7l-4 10"/>,
], { keywords: ["code", "inline", "snippet"] });

const PlotCodeBlock = pk([
  <rect key="a" x="3" y="5" width="18" height="14" rx="2"/>,
  <path key="b" d="m9 10-2 2 2 2M15 10l2 2-2 2M13 9l-2 6"/>,
], { keywords: ["code", "block"] });

const PlotCallout = pk([
  <rect key="a" x="3" y="5" width="18" height="14" rx="2"/>,
  <path key="b" d="M3 5v14" strokeWidth="3"/>,
  <circle key="c" cx="9" cy="12" r="1"/>,
  <path key="d" d="M12 12h6M12 15h4"/>,
], { keywords: ["callout", "info"] });

const PlotDivider = pk([
  <path key="a" d="M3 12h2M9 12h6M19 12h2"/>,
], { keywords: ["divider", "separator", "rule"] });

// ---------- Lists ----------
const PlotListBullet = pk([
  <circle key="a" cx="5" cy="7" r="1"/>,
  <circle key="b" cx="5" cy="12" r="1"/>,
  <circle key="c" cx="5" cy="17" r="1"/>,
  <path key="d" d="M9 7h11M9 12h11M9 17h11"/>,
], { keywords: ["list", "bullet", "ul"] });

const PlotListOrdered = pk([
  <path key="a" d="M4 5h1v3M4 8h2M5 13h-1l1-2h-1M4 13h2M4 16h2v1l-1 1 1 1v1H4"/>,
  <path key="b" d="M9 7h11M9 13h11M9 18h11"/>,
], { keywords: ["list", "ordered", "ol", "numbered"] });

const PlotListTodo = pk([
  <rect key="a" x="3" y="5" width="4" height="4" rx=".5"/>,
  <path key="b" d="m4 7 1 1 1.5-2"/>,
  <rect key="c" x="3" y="11" width="4" height="4" rx=".5"/>,
  <rect key="d" x="3" y="17" width="4" height="4" rx=".5"/>,
  <path key="e" d="M10 7h11M10 13h11M10 19h11"/>,
], { keywords: ["todo", "task", "checklist"] });

const PlotIndent = pk([
  <path key="a" d="M4 6h16M10 12h10M10 18h10"/>,
  <path key="b" d="m4 10 3 2-3 2"/>,
], { keywords: ["indent"] });

// ---------- Embeds ----------
const PlotImageBlock = pk([
  <rect key="a" x="3" y="5" width="18" height="14" rx="2"/>,
  <circle key="b" cx="9" cy="11" r="1.5"/>,
  <path key="c" d="m4 18 5-5 4 4 3-2 4 3"/>,
], { keywords: ["image", "photo", "embed"] });

const PlotTable = pk([
  <rect key="a" x="3" y="5" width="18" height="14" rx="1.5"/>,
  <path key="b" d="M3 10h18M3 15h18M9 5v14M15 5v14"/>,
], { keywords: ["table", "grid"] });

const PlotEmbed = pk([
  <rect key="a" x="3" y="5" width="18" height="14" rx="1.5"/>,
  <path key="b" d="m9 10-2 2 2 2M15 10l2 2-2 2"/>,
], { keywords: ["embed", "iframe"] });

const PlotLinkInternal = pk([
  <path key="a" d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1"/>,
  <path key="b" d="M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1"/>,
  <circle key="c" cx="12" cy="12" r="1"/>,
], { keywords: ["backlink", "internal", "ref"] });

// ---------- Navigation ----------
const PlotToc = pk([
  <path key="a" d="M4 6h7M4 10h11M4 14h8M4 18h12"/>,
  <path key="b" d="M19 6h2M19 10h2M19 14h2M19 18h2"/>,
], { keywords: ["toc", "outline", "contents"] });

const PlotOutline = pk([
  <path key="a" d="M4 6h16"/>,
  <path key="b" d="M8 11h12"/>,
  <path key="c" d="M12 16h8"/>,
  <path key="d" d="M16 21h4"/>,
], { keywords: ["outline", "tree"] });

const PlotBreadcrumb = pk([
  <circle key="a" cx="4" cy="12" r="1.5"/>,
  <path key="b" d="m7 12 2 0M11 9l3 3-3 3M16 12h2M21 12h-1"/>,
], { keywords: ["breadcrumb", "path"] });

const PlotBacklink = pk([
  <path key="a" d="M14 7v10"/>,
  <path key="b" d="M9 12h11"/>,
  <path key="c" d="m13 8 1 1-1 1M13 14l1 1-1 1"/>,
  <path key="d" d="M4 12h5"/>,
], { keywords: ["backlink", "reference"] });

const PlotGraphView = pk([
  <circle key="a" cx="6" cy="6" r="2"/>,
  <circle key="b" cx="18" cy="6" r="2"/>,
  <circle key="c" cx="12" cy="14" r="2.5"/>,
  <circle key="d" cx="5" cy="18" r="1.5"/>,
  <circle key="e" cx="19" cy="18" r="1.5"/>,
  <path key="f" d="M7 7.5 11 13M17 7.5 13 13M11 16l-5 1.5M13 16l5 1.5"/>,
], { keywords: ["graph", "network", "links"] });

const PlotTagPage = pk([
  <path key="a" d="M3 12V5h7l11 11-7 7z"/>,
  <circle key="b" cx="8" cy="9" r="1.2"/>,
], { keywords: ["tag", "label"] });

// ---------- Layout ----------
const PlotSidebarToggle = pk([
  <rect key="a" x="3" y="5" width="18" height="14" rx="1.5"/>,
  <path key="b" d="M9 5v14"/>,
  <path key="c" d="m13 10 2 2-2 2"/>,
], { keywords: ["sidebar", "toggle", "panel"] });

const PlotPanelRight = pk([
  <rect key="a" x="3" y="5" width="18" height="14" rx="1.5"/>,
  <path key="b" d="M15 5v14"/>,
], { keywords: ["panel", "right", "side"] });

const PlotFocusMode = pk([
  <path key="a" d="M4 8V5h3M4 16v3h3M20 8V5h-3M20 16v3h-3"/>,
  <path key="b" d="M9 11h6M9 14h4"/>,
], { keywords: ["focus", "zen", "fullscreen"] });

const PlotWordCount = pk([
  <path key="a" d="M3 8h3l1 6 1-6h3l1 6 1-6h3"/>,
  <path key="b" d="M16 16h5"/>,
  <circle key="c" cx="18.5" cy="13" r="2.5"/>,
], { keywords: ["word", "count", "stats"] });

const PlotLastEdited = pk([
  <circle key="a" cx="12" cy="12" r="8"/>,
  <path key="b" d="M12 8v4l2 2"/>,
  <path key="c" d="m16 4 3 3-1 1-3-3z"/>,
], { keywords: ["edited", "modified", "updated"] });

const PlotPinIt = pk([
  <path key="a" d="M12 3v6"/>,
  <path key="b" d="M8 9h8l-1 6h-6z"/>,
  <path key="c" d="M12 15v6"/>,
], { keywords: ["pin", "stick"] });

const PlotTrash = pk([
  <path key="a" d="M4 7h16M9 7V5h6v2"/>,
  <path key="b" d="M6 7v13h12V7"/>,
  <path key="c" d="M10 11v6M14 11v6"/>,
], { keywords: ["trash", "delete"] });

// ---------- Registry ----------
const PLOT_ICONS = [
  { name: "plot-note", c: PlotNote, cat: "Plot" },
  { name: "plot-notebook", c: PlotNotebook, cat: "Plot" },
  { name: "plot-page-new", c: PlotPageNew, cat: "Plot" },
  { name: "plot-daily-note", c: PlotDailyNote, cat: "Plot" },
  { name: "plot-page-history", c: PlotPageHistory, cat: "Plot" },
  { name: "plot-draft", c: PlotDraft, cat: "Plot" },
  { name: "plot-publish", c: PlotPublish, cat: "Plot" },
  { name: "plot-share-page", c: PlotSharePage, cat: "Plot" },
  { name: "plot-archive", c: PlotArchive, cat: "Plot" },
  { name: "plot-pin", c: PlotPin, cat: "Plot" },
  { name: "plot-favorite", c: PlotFavorite, cat: "Plot" },
  { name: "plot-h1", c: PlotHeading1, cat: "Plot" },
  { name: "plot-h2", c: PlotHeading2, cat: "Plot" },
  { name: "plot-h3", c: PlotHeading3, cat: "Plot" },
  { name: "plot-paragraph", c: PlotParagraph, cat: "Plot" },
  { name: "plot-blockquote", c: PlotBlockquote, cat: "Plot" },
  { name: "plot-code-inline", c: PlotCodeInline, cat: "Plot" },
  { name: "plot-code-block", c: PlotCodeBlock, cat: "Plot" },
  { name: "plot-callout", c: PlotCallout, cat: "Plot" },
  { name: "plot-divider", c: PlotDivider, cat: "Plot" },
  { name: "plot-list-bullet", c: PlotListBullet, cat: "Plot" },
  { name: "plot-list-ordered", c: PlotListOrdered, cat: "Plot" },
  { name: "plot-list-todo", c: PlotListTodo, cat: "Plot" },
  { name: "plot-indent", c: PlotIndent, cat: "Plot" },
  { name: "plot-image-block", c: PlotImageBlock, cat: "Plot" },
  { name: "plot-table", c: PlotTable, cat: "Plot" },
  { name: "plot-embed", c: PlotEmbed, cat: "Plot" },
  { name: "plot-link-internal", c: PlotLinkInternal, cat: "Plot" },
  { name: "plot-toc", c: PlotToc, cat: "Plot" },
  { name: "plot-outline", c: PlotOutline, cat: "Plot" },
  { name: "plot-breadcrumb", c: PlotBreadcrumb, cat: "Plot" },
  { name: "plot-backlink", c: PlotBacklink, cat: "Plot" },
  { name: "plot-graph-view", c: PlotGraphView, cat: "Plot" },
  { name: "plot-tag-page", c: PlotTagPage, cat: "Plot" },
  { name: "plot-sidebar-toggle", c: PlotSidebarToggle, cat: "Plot" },
  { name: "plot-panel-right", c: PlotPanelRight, cat: "Plot" },
  { name: "plot-focus-mode", c: PlotFocusMode, cat: "Plot" },
  { name: "plot-word-count", c: PlotWordCount, cat: "Plot" },
  { name: "plot-last-edited", c: PlotLastEdited, cat: "Plot" },
  { name: "plot-trash", c: PlotTrash, cat: "Plot" },
];
