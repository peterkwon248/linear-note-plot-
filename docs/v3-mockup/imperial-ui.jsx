// =============================================================================
// Imperial UI — single-file bundle
// Icons (80+) · Color Picker · Color utilities
// 1.5px stroke · 24 viewBox · currentColor · React 18+
// =============================================================================
//
// Usage:
//   <link rel="stylesheet" href="imperial-ui.css">
//   <script src="https://unpkg.com/react@18.3.1/umd/react.development.js"></script>
//   <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"></script>
//   <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
//   <script type="text/babel" src="imperial-ui.jsx"></script>
//
//   <Imperial.Icon name="search" size={20} />
//   <Imperial.icons.Search size={20} />
//   <Imperial.ColorPicker value="#3b82f6" onChange={(hex) => console.log(hex)} />
//
// All exports are also attached to window for convenience:
//   <Search />, <ColorPicker />, hexToRgb(), rgbToHex(), etc.
// =============================================================================

// Imperial Icons — Linear-inspired stroked SVGs
// 24 viewBox · 1.5px stroke · round caps & joins · currentColor

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function mk(paths, keywords) {
  var Comp = function(props) {
    props = props || {};
    var size = props.size || 20;
    var sw = props.strokeWidth || 1.5;
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        width={size}
        height={size}
        className={props.className || ""}
        style={props.style}
      >
        {paths.map(function(p, i) { return React.cloneElement(p, { key: i }); })}
      </svg>
    );
  };
  Comp.keywords = keywords || [];
  return Comp;
}

// ============ NAVIGATION ============
const Home = mk([<path d="M3 9.5 12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-4v-7h-7v7h-4A1.5 1.5 0 0 1 3 20Z"/>], ["house","main","start"]);
const Compass = mk([<circle cx="12" cy="12" r="9"/>, <path d="m15.5 8.5-2 5.5-5.5 2 2-5.5z"/>], ["explore","direction","navigate"]);
const MapIcon = mk([<path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2z"/>, <path d="M9 4v16M15 6v16"/>], ["location","route"]);
const Layout = mk([<rect x="3" y="3" width="18" height="18" rx="2"/>, <path d="M3 9h18M9 21V9"/>], ["dashboard","grid","panels"]);
const Sidebar = mk([<rect x="3" y="3" width="18" height="18" rx="2"/>, <path d="M9 3v18"/>], ["panel","drawer"]);
const Menu = mk([<path d="M4 6h16M4 12h16M4 18h16"/>], ["hamburger","navigation"]);
const Grid = mk([<rect x="3" y="3" width="7" height="7" rx="1"/>, <rect x="14" y="3" width="7" height="7" rx="1"/>, <rect x="3" y="14" width="7" height="7" rx="1"/>, <rect x="14" y="14" width="7" height="7" rx="1"/>], ["apps","tiles"]);
const Globe = mk([<circle cx="12" cy="12" r="9"/>, <path d="M3 12h18M12 3a13.5 13.5 0 0 1 0 18M12 3a13.5 13.5 0 0 0 0 18"/>], ["world","internet","language"]);
const ExternalLink = mk([<path d="M14 4h6v6"/>, <path d="M20 4 10 14"/>, <path d="M19 13v6a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 19V7a1.5 1.5 0 0 1 1.5-1.5h6"/>], ["open","new-tab","launch"]);

// ============ ARROWS & CHEVRONS ============
const ArrowUp = mk([<path d="M12 19V5M5 12l7-7 7 7"/>], ["up"]);
const ArrowDown = mk([<path d="M12 5v14M5 12l7 7 7-7"/>], ["down"]);
const ArrowLeft = mk([<path d="M19 12H5M12 5l-7 7 7 7"/>], ["back","previous"]);
const ArrowRight = mk([<path d="M5 12h14M12 5l7 7-7 7"/>], ["forward","next"]);
const ArrowUpRight = mk([<path d="M7 17 17 7M8 7h9v9"/>], ["diagonal","outgoing"]);
const ChevronUp = mk([<path d="m6 15 6-6 6 6"/>], ["caret","collapse"]);
const ChevronDown = mk([<path d="m6 9 6 6 6-6"/>], ["caret","expand","dropdown"]);
const ChevronLeft = mk([<path d="m15 18-6-6 6-6"/>], []);
const ChevronRight = mk([<path d="m9 18 6-6-6-6"/>], ["next"]);
const ChevronsUpDown = mk([<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>], ["sort","reorder"]);
const CornerDownRight = mk([<path d="m15 10 5 5-5 5M4 4v7a4 4 0 0 0 4 4h12"/>], ["enter","reply"]);
const Refresh = mk([<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/>, <path d="M21 3v5h-5"/>], ["reload","sync","retry"]);
const RotateCw = mk([<path d="M21 12a9 9 0 1 1-3-6.7"/>, <path d="M21 4v5h-5"/>], ["rotate","cw"]);
const Move = mk([<path d="M5 9 2 12l3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>], ["drag","reposition"]);

// ============ ACTIONS ============
const Plus = mk([<path d="M12 5v14M5 12h14"/>], ["add","new","create"]);
const Minus = mk([<path d="M5 12h14"/>], ["remove","subtract"]);
const Close = mk([<path d="M18 6 6 18M6 6l12 12"/>], ["x","cancel","dismiss"]);
const Check = mk([<path d="m4 12 5 5L20 6"/>], ["done","confirm","tick"]);
const Edit = mk([<path d="M12 20h9"/>, <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/>], ["pencil","write","modify"]);
const Trash = mk([<path d="M3 6h18M8 6V4a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 16 4v2M5.5 6l1 13.5A1.5 1.5 0 0 0 8 21h8a1.5 1.5 0 0 0 1.5-1.5L18.5 6"/>, <path d="M10 11v6M14 11v6"/>], ["delete","remove","bin"]);
const Copy = mk([<rect x="8" y="8" width="13" height="13" rx="2"/>, <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>], ["duplicate","clone"]);
const Save = mk([<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/>, <path d="M17 21v-8H7v8M7 3v5h8"/>], ["disk","store"]);
const Share = mk([<circle cx="6" cy="12" r="3"/>, <circle cx="18" cy="6" r="3"/>, <circle cx="18" cy="18" r="3"/>, <path d="m8.6 10.5 6.8-3M8.6 13.5l6.8 3"/>], ["send","distribute"]);
const Download = mk([<path d="M12 3v13M7 11l5 5 5-5M5 21h14"/>], ["save","import"]);
const Upload = mk([<path d="M12 16V3M7 8l5-5 5 5M5 21h14"/>], ["send","export"]);
const Send = mk([<path d="M22 2 11 13"/>, <path d="M22 2 15 22l-4-9-9-4Z"/>], ["paper-plane","submit"]);
const Bookmark = mk([<path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/>], ["save","favorite"]);
const Pin = mk([<path d="M9 3h6M12 3v8M5 13l7-2 7 2-3 3v3h-8v-3Z"/>, <path d="M12 19v3"/>], ["thumbtack","stick"]);
const Star = mk([<path d="M12 3 14.5 9.5 21.5 10l-5.5 4.5L17.5 21 12 17.5 6.5 21l1.5-6.5L2.5 10l7-.5Z"/>], ["favorite","rating"]);
const Heart = mk([<path d="M12 21s-7-4.5-9.5-9.5C1 8 3.5 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 3.5 0 6 4 4.5 7.5C19 16.5 12 21 12 21Z"/>], ["like","love","favorite"]);
const Flag = mk([<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>], ["report","mark","priority"]);

// ============ STATUS & FEEDBACK ============
const CheckCircle = mk([<circle cx="12" cy="12" r="9"/>, <path d="m8 12 3 3 5-6"/>], ["success","done","verified"]);
const XCircle = mk([<circle cx="12" cy="12" r="9"/>, <path d="m15 9-6 6M9 9l6 6"/>], ["error","cancel","fail"]);
const AlertCircle = mk([<circle cx="12" cy="12" r="9"/>, <path d="M12 8v4"/>, <circle cx="12" cy="16" r="0.5" fill="currentColor"/>], ["warning","caution"]);
const AlertTriangle = mk([<path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>, <path d="M12 9v4"/>, <circle cx="12" cy="17" r="0.5" fill="currentColor"/>], ["danger","warning"]);
const Info = mk([<circle cx="12" cy="12" r="9"/>, <path d="M12 16v-4"/>, <circle cx="12" cy="8" r="0.5" fill="currentColor"/>], ["info","detail"]);
const Help = mk([<circle cx="12" cy="12" r="9"/>, <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8v.5"/>, <circle cx="12" cy="17" r="0.5" fill="currentColor"/>], ["question","support","faq"]);
const Loader = mk([<path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>], ["loading","spinner"]);
const Zap = mk([<path d="M13 2 3 14h7l-1 8L19 10h-7Z"/>], ["lightning","fast","action"]);
const Shield = mk([<path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6Z"/>], ["security","protect"]);
const Lock = mk([<rect x="4" y="11" width="16" height="10" rx="2"/>, <path d="M8 11V7a4 4 0 0 1 8 0v4"/>], ["secure","private","locked"]);
const Unlock = mk([<rect x="4" y="11" width="16" height="10" rx="2"/>, <path d="M8 11V7a4 4 0 0 1 7.5-2"/>], ["open","unlocked"]);

// ============ COMMUNICATION ============
const Mail = mk([<rect x="3" y="5" width="18" height="14" rx="2"/>, <path d="m3 7 9 6 9-6"/>], ["email","envelope","message"]);
const Inbox = mk([<path d="M22 12h-6l-2 3h-4l-2-3H2"/>, <path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6L18.5 5.1A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z"/>], ["mail","tray"]);
const Message = mk([<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5A8.5 8.5 0 0 1 21 11Z"/>], ["chat","conversation"]);
const Messages = mk([<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Z"/>, <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>], ["chat","threads"]);
const Bell = mk([<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>, <path d="M13.7 21a2 2 0 0 1-3.4 0"/>], ["notification","alert","ring"]);
const BellOff = mk([<path d="M13.7 21a2 2 0 0 1-3.4 0M18.6 13.4A14 14 0 0 1 18 8a6 6 0 0 0-9.3-5M6.3 6.3A6 6 0 0 0 6 8c0 7-3 9-3 9h15M3 3l18 18"/>], ["mute","silent"]);
const Phone = mk([<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 3a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2-.4c1 .3 2 .6 3 .7a2 2 0 0 1 1.7 2Z"/>], ["call","contact"]);
const Video = mk([<path d="m23 7-7 5 7 5Z"/>, <rect x="1" y="5" width="15" height="14" rx="2"/>], ["camera","record"]);
const Mic = mk([<rect x="9" y="2" width="6" height="12" rx="3"/>, <path d="M19 10a7 7 0 0 1-14 0M12 19v3"/>], ["microphone","record","voice"]);
const Megaphone = mk([<path d="M3 11v2a2 2 0 0 0 2 2h1l3 5 2-1-2-4h2l8 4V5l-8 4H5a2 2 0 0 0-2 2Z"/>], ["announce","broadcast"]);

// ============ FILES & DOCUMENTS ============
const FileIcon = mk([<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>, <path d="M14 2v6h6"/>], ["document","page"]);
const FileText = mk([<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>, <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2"/>], ["document","note"]);
const FilePlus = mk([<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>, <path d="M14 2v6h6M12 12v6M9 15h6"/>], ["new-file","add"]);
const Folder = mk([<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z"/>], ["directory"]);
const FolderOpen = mk([<path d="M6 14 4 21h17l2-9H7Z"/>, <path d="M2 5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v3"/>], ["expanded"]);
const Notebook = mk([<rect x="4" y="3" width="16" height="18" rx="2"/>, <path d="M8 3v18M4 8h4M4 12h4M4 16h4"/>], ["note","journal"]);
const Book = mk([<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v17H6.5a2.5 2.5 0 0 0 0 3H20"/>], ["read","library"]);
const Bookmarks = mk([<path d="M15 2H6a2 2 0 0 0-2 2v18l5-3 5 3V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v15"/>], ["saved"]);
// Bookshelf — two-shelf bookcase: top and bottom shelves with books on each,
// reads instantly as "library" rather than just "books".
const Bookshelf = mk([
  // cabinet outline (sides + top + middle shelf + bottom shelf)
  <path d="M4 3v18"/>,
  <path d="M20 3v18"/>,
  <path d="M4 3h16"/>,
  <path d="M4 12h16"/>,
  <path d="M4 21h16"/>,
  // top shelf — three books, middle one with a horizontal band
  <path d="M7 12V5h2v7"/>,
  <path d="M11 12V6h2v6"/>,
  <path d="M15 12V5.5h2V12"/>,
  <path d="M11 8.5h2"/>,
  // bottom shelf — two standing + one leaning
  <path d="M7 21v-7h2v7"/>,
  <path d="M11 21v-6h2v6"/>,
  <path d="m14.6 21 1-6.5 1.8.3-1 6.2"/>,
], ["library","books","shelf","bookcase","reading-room"]);
// WikiBook — open reference book with a center spine and a small ribbon bookmark.
const WikiBook = mk([
  <path d="M3 6c3-1 6-1 9 1v13c-3-2-6-2-9-1z"/>,
  <path d="M21 6c-3-1-6-1-9 1v13c3-2 6-2 9-1z"/>,
  <path d="M15 5.6V11l1.5-1.2L18 11V5.9"/>,
], ["wiki","reference","encyclopedia","open-book"]);
// OntologyWide — diamond knowledge graph: four corner nodes with a center hub,
// edges forming a diamond + cross. Reads as "graph" with dynamic horizontal width.
const OntologyWide = mk([
  // outer diamond edges
  <path d="m12 12-6-7"/>,
  <path d="m12 12 6-7"/>,
  <path d="m12 12-9 7"/>,
  <path d="m12 12 9 7"/>,
  // perimeter (top-left → top-right → bottom-right → bottom-left)
  <path d="M6 5h12"/>,
  <path d="m18 5 3 14"/>,
  <path d="M3 19h18"/>,
  <path d="M3 19 6 5"/>,
  // nodes
  <circle cx="6" cy="5" r="1.6"/>,
  <circle cx="18" cy="5" r="1.6"/>,
  <circle cx="3" cy="19" r="1.6"/>,
  <circle cx="21" cy="19" r="1.6"/>,
  <circle cx="12" cy="12" r="1.4"/>,
], ["ontology","graph","network","knowledge-graph","wide"]);
const Clipboard = mk([<rect x="8" y="3" width="8" height="4" rx="1"/>, <path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/>], ["paste","tasks"]);
const Archive = mk([<rect x="2" y="3" width="20" height="5" rx="1"/>, <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>], ["box","store"]);
const Paperclip = mk([<path d="m21 12-9 9a5.5 5.5 0 0 1-7.8-7.8l9-9a3.7 3.7 0 0 1 5.2 5.2L9.4 18.6a1.8 1.8 0 0 1-2.6-2.6L15 7.8"/>], ["attach","clip"]);
const Layers = mk([<path d="M12 2 2 7l10 5 10-5Z"/>, <path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>], ["stack","levels"]);

// ============ MEDIA ============
const ImageIcon = mk([<rect x="3" y="3" width="18" height="18" rx="2"/>, <circle cx="9" cy="9" r="2"/>, <path d="m21 15-5-5L5 21"/>], ["picture","photo"]);
const Camera = mk([<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/>, <circle cx="12" cy="13" r="4"/>], ["photo","capture"]);
const Play = mk([<path d="m6 4 14 8-14 8z"/>], ["start","video"]);
const Pause = mk([<rect x="6" y="4" width="4" height="16" rx="1"/>, <rect x="14" y="4" width="4" height="16" rx="1"/>], ["stop","wait"]);
const Stop = mk([<rect x="5" y="5" width="14" height="14" rx="1"/>], ["end","halt"]);
const SkipForward = mk([<path d="m5 4 10 8-10 8Z"/>, <path d="M19 5v14"/>], ["next","fast-forward"]);
const SkipBack = mk([<path d="M19 20 9 12l10-8Z"/>, <path d="M5 19V5"/>], ["previous","rewind"]);
const Volume = mk([<path d="M11 5 6 9H2v6h4l5 4Z"/>, <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>], ["sound","audio"]);
const VolumeOff = mk([<path d="M11 5 6 9H2v6h4l5 4Z"/>, <path d="m23 9-6 6M17 9l6 6"/>], ["mute","silent"]);
const Music = mk([<path d="M9 18V5l12-2v13"/>, <circle cx="6" cy="18" r="3"/>, <circle cx="18" cy="16" r="3"/>], ["audio","song"]);
const Headphones = mk([<path d="M3 18v-6a9 9 0 0 1 18 0v6"/>, <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z"/>], ["audio","listen"]);

// ============ TIME ============
const Clock = mk([<circle cx="12" cy="12" r="9"/>, <path d="M12 7v5l3 2"/>], ["time","watch"]);
const Calendar = mk([<rect x="3" y="4" width="18" height="17" rx="2"/>, <path d="M16 2v4M8 2v4M3 10h18"/>], ["date","schedule"]);
const CalendarDays = mk([<rect x="3" y="4" width="18" height="17" rx="2"/>, <path d="M16 2v4M8 2v4M3 10h18"/>, <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>], ["agenda","events"]);
const Hourglass = mk([<path d="M6 2h12M6 22h12M6 2v4a6 6 0 0 0 6 6 6 6 0 0 0 6-6V2M6 22v-4a6 6 0 0 1 6-6 6 6 0 0 1 6 6v4"/>], ["timer","wait"]);
const Timer = mk([<circle cx="12" cy="13" r="8"/>, <path d="M12 9v4l2 2M9 2h6M12 13"/>], ["stopwatch","countdown"]);
const HistoryIcon = mk([<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/>, <path d="M3 3v5h5M12 8v4l3 2"/>], ["recent","past"]);

// ============ USER & PEOPLE ============
const User = mk([<circle cx="12" cy="8" r="4"/>, <path d="M4 21a8 8 0 0 1 16 0"/>], ["person","profile","account"]);
const UserPlus = mk([<circle cx="9" cy="8" r="4"/>, <path d="M3 21a6 6 0 0 1 12 0M19 8v6M16 11h6"/>], ["add-friend","invite"]);
const Users = mk([<circle cx="9" cy="8" r="4"/>, <path d="M2 21a7 7 0 0 1 14 0"/>, <path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-6-7"/>], ["team","group"]);
const UserCircle = mk([<circle cx="12" cy="12" r="9"/>, <circle cx="12" cy="10" r="3"/>, <path d="M6.2 18.5a6 6 0 0 1 11.6 0"/>], ["avatar","profile"]);
const At = mk([<circle cx="12" cy="12" r="4"/>, <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>], ["mention","email"]);

// ============ DATA & CHARTS ============
const BarChart = mk([<path d="M3 21h18M7 17V9M12 17V5M17 17v-6"/>], ["stats","graph"]);
const LineChart = mk([<path d="M3 3v18h18"/>, <path d="m7 14 4-4 4 4 5-7"/>], ["trend","analytics"]);
const PieChart = mk([<path d="M12 3a9 9 0 1 0 9 9h-9Z"/>, <path d="M12 3a9 9 0 0 1 9 9"/>], ["chart","share"]);
const TrendingUp = mk([<path d="m23 6-9.5 9.5-5-5L1 18"/>, <path d="M16 6h7v7"/>], ["growth","up","increase"]);
const TrendingDown = mk([<path d="m23 18-9.5-9.5-5 5L1 6"/>, <path d="M16 18h7v-7"/>], ["decline","down","decrease"]);
const Activity = mk([<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>], ["pulse","heartbeat"]);
const Database = mk([<ellipse cx="12" cy="5" rx="8" ry="3"/>, <path d="M4 5v14a8 3 0 0 0 16 0V5M4 12a8 3 0 0 0 16 0"/>], ["data","storage"]);
const Server = mk([<rect x="2" y="3" width="20" height="8" rx="2"/>, <rect x="2" y="13" width="20" height="8" rx="2"/>, <circle cx="6" cy="7" r="0.5" fill="currentColor"/>, <circle cx="6" cy="17" r="0.5" fill="currentColor"/>], ["host","cloud"]);

// ============ SETTINGS & TOOLS ============
const Settings = mk([<circle cx="12" cy="12" r="3"/>, <path d="M19.4 15a1.65 1.65 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.65 1.65 0 0 0-1.8-.3 1.65 1.65 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.65 1.65 0 0 0-1-1.5 1.65 1.65 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.65 1.65 0 0 0 .3-1.8 1.65 1.65 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.65 1.65 0 0 0 1.5-1 1.65 1.65 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.65 1.65 0 0 0 1.8.3H9a1.65 1.65 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.65 1.65 0 0 0 1 1.5 1.65 1.65 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.65 1.65 0 0 0-.3 1.8V9a1.65 1.65 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.65 1.65 0 0 0-1.5 1Z"/>], ["gear","preferences","config"]);
const Sliders = mk([<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>], ["controls","adjust"]);
const Toggle = mk([<rect x="2" y="7" width="20" height="10" rx="5"/>, <circle cx="8" cy="12" r="3"/>], ["switch","on-off"]);
const Tool = mk([<path d="M14.7 6.3a4 4 0 0 1 5.4 5.4l-9.7 9.7-5.4 1 1-5.4Z"/>], ["wrench","fix"]);
const Wrench = mk([<path d="M14.7 6.3a4 4 0 0 0-5.7 5.7l-7 7a2 2 0 1 0 2.8 2.8l7-7a4 4 0 0 0 5.7-5.7l-3.5 3.5-2.5-.5-.5-2.5Z"/>], ["fix","tool","repair"]);
const Cog = mk([<circle cx="12" cy="12" r="3"/>, <circle cx="12" cy="12" r="9"/>, <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>], ["gear","settings"]);

// ============ SEARCH & FILTER ============
const Search = mk([<circle cx="11" cy="11" r="7"/>, <path d="m21 21-4.3-4.3"/>], ["find","magnifier"]);
const Filter = mk([<path d="M22 3H2l8 9.5V20l4 1V12.5Z"/>], ["sift","funnel"]);
const SortAsc = mk([<path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 4v16"/>], ["sort","ascending"]);
const SortDesc = mk([<path d="M11 13h10M11 17h7M11 9h4M3 7l3-3 3 3M6 4v16"/>], ["sort","descending"]);
const Hash = mk([<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>], ["tag","number","channel"]);
const Tag = mk([<path d="M2 12V2h10l10 10-10 10Z"/>, <circle cx="7.5" cy="7.5" r="1.5"/>], ["label","category"]);

// ============ EDIT & FORMAT ============
const Bold = mk([<path d="M6 4h7a4 4 0 0 1 0 8H6Z"/>, <path d="M6 12h8a4 4 0 0 1 0 8H6Z"/>], ["text","format"]);
const Italic = mk([<path d="M19 4h-8M14 20H6M15 4 9 20"/>], ["text","format"]);
const Underline = mk([<path d="M6 4v8a6 6 0 0 0 12 0V4M4 21h16"/>], ["text","format"]);
const Strikethrough = mk([<path d="M16 4H9a3 3 0 0 0-2 5M14 12a4 4 0 0 1 0 8H6M3 12h18"/>], ["text","cross-out"]);
const Heading = mk([<path d="M6 4v16M18 4v16M6 12h12"/>], ["title","h1"]);
const Quote = mk([<path d="M3 21c4 0 6-2 6-7V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h2c0 4-2 5-3 5M14 21c4 0 6-2 6-7V6a2 2 0 0 0-2-2h-3a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h2c0 4-2 5-3 5"/>], ["blockquote","citation"]);
const Code = mk([<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>], ["dev","brackets"]);
const Terminal = mk([<path d="m4 17 6-6-6-6M12 19h8"/>], ["console","cli"]);
const ListUl = mk([<path d="M8 6h13M8 12h13M8 18h13"/>, <circle cx="3.5" cy="6" r="0.5" fill="currentColor"/>, <circle cx="3.5" cy="12" r="0.5" fill="currentColor"/>, <circle cx="3.5" cy="18" r="0.5" fill="currentColor"/>], ["bullets","list"]);
const ListOl = mk([<path d="M10 6h11M10 12h11M10 18h11M4 4h1v4M4 11h2L4 14h2M4 16.5a1.5 1.5 0 0 1 3 0c0 .8-1 1-3 2.5h3"/>], ["numbered","list"]);
const ListCheck = mk([<path d="M11 6h10M11 12h10M11 18h10m-17-12 1 1 2-2m-3 6 1 1 2-2m-3 6 1 1 2-2"/>], ["todo","checklist"]);
const Indent = mk([<path d="M3 8h13M3 12h13M3 16h13M3 20h13M3 4h18M21 12l-4-3v6Z"/>], ["tab","format"]);
const AlignLeft = mk([<path d="M3 6h18M3 12h12M3 18h15"/>], ["text","format"]);
const AlignCenter = mk([<path d="M3 6h18M6 12h12M4 18h16"/>], ["text","format"]);
const Type = mk([<path d="M4 7V4h16v3M9 20h6M12 4v16"/>], ["text","font"]);
const Link = mk([<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 1 0-7-7l-1.7 1.7"/>, <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 1 0 7 7l1.7-1.7"/>], ["url","attach"]);
const Unlink = mk([<path d="m18 9 3-3a3.5 3.5 0 0 0-5-5l-3 3M6 15l-3 3a3.5 3.5 0 0 0 5 5l3-3M3 3l18 18M9 8l3 3M12 13l3 3"/>], ["disconnect"]);

// ============ DEVICES & APPS ============
const Phone2 = mk([<rect x="6" y="2" width="12" height="20" rx="3"/>, <path d="M11 18h2"/>], ["mobile","device"]);
const Tablet = mk([<rect x="4" y="2" width="16" height="20" rx="2"/>, <path d="M11 18h2"/>], ["device","ipad"]);
const Laptop = mk([<rect x="4" y="4" width="16" height="11" rx="2"/>, <path d="M2 19h20"/>], ["computer","macbook"]);
const Monitor = mk([<rect x="2" y="3" width="20" height="14" rx="2"/>, <path d="M8 21h8M12 17v4"/>], ["screen","display"]);
const Cloud = mk([<path d="M17 19a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.5A4 4 0 0 0 6 19Z"/>], ["sync","upload"]);
const CloudUp = mk([<path d="M17 19a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.5A4 4 0 0 0 6 19h2"/>, <path d="M12 21v-9M9 15l3-3 3 3"/>], ["upload","sync"]);
const CloudDown = mk([<path d="M17 19a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.5A4 4 0 0 0 6 19h2"/>, <path d="M12 12v9M9 18l3 3 3-3"/>], ["download","sync"]);
const Wifi = mk([<path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8.5 15.5a6 6 0 0 1 7 0"/>, <circle cx="12" cy="19" r="0.5" fill="currentColor"/>], ["network","internet"]);
const Bluetooth = mk([<path d="m6 7 12 10-6 5V2l6 5L6 17"/>], ["wireless","connect"]);
const Battery = mk([<rect x="2" y="7" width="18" height="10" rx="2"/>, <path d="M22 11v2M6 10v4M9 10v4"/>], ["power","charge"]);
const Power = mk([<path d="M18.4 6.6a9 9 0 1 1-12.8 0M12 2v10"/>], ["on-off","shutdown"]);

// ============ FINANCE & BUSINESS (for investment app) ============
const DollarSign = mk([<path d="M12 2v20M17 6H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H6"/>], ["money","price","cost"]);
const CreditCard = mk([<rect x="2" y="5" width="20" height="14" rx="2"/>, <path d="M2 10h20M6 15h2"/>], ["payment","card"]);
const Wallet = mk([<path d="M21 12V8a2 2 0 0 0-2-2H5a2 2 0 0 1 0-4h13v4"/>, <path d="M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6"/>, <circle cx="17" cy="13" r="1.5"/>], ["money","balance"]);
const Coin = mk([<circle cx="12" cy="12" r="9"/>, <path d="M14 9.5a2.5 2.5 0 0 0-2.5-1.5h-1A2 2 0 0 0 10 12h2.5a2 2 0 0 1-.5 4h-1A2.5 2.5 0 0 1 9 14.5M12 6v2M12 16v2"/>], ["currency","money"]);
const PiggyBank = mk([<path d="M19 5h-1.4A8 8 0 0 0 4 8c0 1.5.5 3 1.4 4.2L4 14v3h2l1.5-1.5A8 8 0 0 0 14 17a8 8 0 0 0 7-3.5L23 14v-3l-2-1c-.4-1.7-1-3.4-2-5Z"/>, <circle cx="16" cy="10" r="0.5" fill="currentColor"/>], ["save","savings"]);
const Receipt = mk([<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2-2-2Z"/>, <path d="M9 8h6M9 12h6M9 16h4"/>], ["bill","invoice"]);
const Briefcase = mk([<rect x="2" y="7" width="20" height="14" rx="2"/>, <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>], ["work","business"]);
const Building = mk([<rect x="4" y="2" width="16" height="20" rx="1"/>, <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>], ["office","company"]);
const Target = mk([<circle cx="12" cy="12" r="9"/>, <circle cx="12" cy="12" r="5"/>, <circle cx="12" cy="12" r="1.5"/>], ["goal","aim","focus"]);
const Award = mk([<circle cx="12" cy="9" r="6"/>, <path d="m8.2 13.5-2 7L12 17l5.8 3.5-2-7"/>], ["medal","achievement"]);

// ============ WORKFLOW & PRODUCTIVITY ============
const Workflow = mk([<rect x="3" y="3" width="7" height="6" rx="1"/>, <rect x="14" y="3" width="7" height="6" rx="1"/>, <rect x="9" y="15" width="7" height="6" rx="1"/>, <path d="M6 9v3h6.5M17.5 9v3H12.5"/>], ["flow","process"]);
const Branch = mk([<circle cx="6" cy="3" r="2"/>, <circle cx="6" cy="21" r="2"/>, <circle cx="18" cy="9" r="2"/>, <path d="M6 5v14M18 11v3a3 3 0 0 1-3 3H6"/>], ["fork","git"]);
const Network = mk([<circle cx="12" cy="3" r="2"/>, <circle cx="5" cy="21" r="2"/>, <circle cx="19" cy="21" r="2"/>, <circle cx="12" cy="12" r="2"/>, <path d="M12 5v5M11 13l-5 6M13 13l5 6"/>], ["graph","tree"]);
const Sitemap = mk([<rect x="9" y="2" width="6" height="6" rx="1"/>, <rect x="2" y="16" width="6" height="6" rx="1"/>, <rect x="16" y="16" width="6" height="6" rx="1"/>, <path d="M12 8v4M5 16v-4h14v4"/>], ["hierarchy","structure"]);
const Sparkles = mk([<path d="m12 3 1.7 4.7L18 9.5l-4.3 1.8L12 16l-1.7-4.7L6 9.5l4.3-1.8Z"/>, <path d="M19 14v3M19 20v3M21 17h-3M16 17h-3"/>], ["ai","magic","new"]);
const Beaker = mk([<path d="M9 3v8L3 21h18l-6-10V3M9 3h6"/>], ["lab","experiment"]);
const Lightbulb = mk([<path d="M9 21h6"/>, <path d="M10 17h4"/>, <path d="M12 3a6 6 0 0 0-4 10.5c1 1 2 2 2 3.5h4c0-1.5 1-2.5 2-3.5A6 6 0 0 0 12 3Z"/>], ["idea","insight","tip"]);
const Eye = mk([<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/>, <circle cx="12" cy="12" r="3"/>], ["view","show","watch"]);
const EyeOff = mk([<path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4 4M9 5.5A11 11 0 0 1 22 12s-1 1.7-3 3.5M6 7C3.5 8.7 2 12 2 12s4 7 10 7c1.5 0 3-.4 4.3-1"/>], ["hide","invisible"]);

// ============ MISC ============
const Zap2 = mk([<path d="M12 3v6M12 21v-3M5.6 5.6 8 8M16 16l2.5 2.5M3 12h3M18 12h3M5.6 18.4 8 16M16 8l2.5-2.5"/>], ["sparkle","shine"]);
const Gift = mk([<rect x="3" y="8" width="18" height="13" rx="2"/>, <path d="M3 12h18M12 8v13"/>, <path d="M16 8a3 3 0 0 0 0-6c-2 0-4 6-4 6s2-6-4-6a3 3 0 0 0 0 6"/>], ["present","reward"]);
const Coffee = mk([<path d="M17 8h1a4 4 0 0 1 0 8h-1"/>, <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>, <path d="M6 2v3M10 2v3M14 2v3"/>], ["break","cafe"]);
const Sun = mk([<circle cx="12" cy="12" r="4"/>, <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>], ["light","day","theme"]);
const Sunrise = mk([<path d="M12 2v6M5.6 8.6l1.4 1.4M17 10l1.4-1.4M2 18h2M20 18h2M22 22H2M8 18a4 4 0 0 1 8 0"/>], ["morning","dawn","daily"]);
const Moon = mk([<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>], ["dark","night","theme"]);
const Flame = mk([<path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-7 1-10Z"/>], ["fire","streak","hot","trending"]);
const Brain = mk([<path d="M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0-3 3v1a3 3 0 0 0 1 2 3 3 0 0 0 0 4 3 3 0 0 0 3 3 3 3 0 0 0 3 0V3Z"/>, <path d="M15 3a3 3 0 0 1 3 3v1a3 3 0 0 1 3 3v1a3 3 0 0 1-1 2 3 3 0 0 1 0 4 3 3 0 0 1-3 3 3 3 0 0 1-3 0V3Z"/>], ["mind","second-brain","intelligence","thinking"]);
const Wand = mk([<path d="m15 4 1 2 2 1-2 1-1 2-1-2-2-1 2-1ZM4 20l11-11 2 2L6 22Z"/>, <path d="M19 11l1 1.5L21.5 13 20 13.5 19 15l-1-1.5L16.5 13 18 12.5Z"/>], ["magic","ai","auto","suggestion"]);
const Anchor = mk([<circle cx="12" cy="5" r="2.5"/>, <path d="M12 22V7.5M5 12a7 7 0 0 0 14 0M2 12h3M19 12h3"/>], ["pin","fix"]);
const Box = mk([<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>, <path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>], ["package","cube"]);
const Gauge = mk([<path d="M12 14 18 8"/>, <circle cx="12" cy="14" r="0.5" fill="currentColor"/>, <path d="M3 14a9 9 0 1 1 18 0"/>], ["speed","meter"]);

// =============================================================
// IMPERIAL LOGO MARK — works as both app icon & logo
// Two interlocking arcs forming an "I" — the imperial signature
// =============================================================
function ImperialMark(props) {
  var size = props.size || 24;
  var sw = props.strokeWidth || 1.5;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={props.className || ""} style={props.style}>
      <path d="M5 4h14"/>
      <path d="M5 20h14"/>
      <path d="M12 4v16"/>
      <path d="M8 12h8"/>
    </svg>
  );
}

function ImperialMarkSolid(props) {
  var size = props.size || 24;
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} className={props.className || ""} style={props.style}>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor"/>
      <path d="M7 6h10M7 18h10M12 6v12M9.5 12h5" stroke="var(--background)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// =============================================================
// REGISTRY — name, component, category, keywords
// =============================================================
const ICONS = [
  // Navigation
  { name: "home", c: Home, cat: "Navigation" },
  { name: "compass", c: Compass, cat: "Navigation" },
  { name: "map", c: MapIcon, cat: "Navigation" },
  { name: "layout", c: Layout, cat: "Navigation" },
  { name: "sidebar", c: Sidebar, cat: "Navigation" },
  { name: "menu", c: Menu, cat: "Navigation" },
  { name: "grid", c: Grid, cat: "Navigation" },
  { name: "globe", c: Globe, cat: "Navigation" },
  { name: "external-link", c: ExternalLink, cat: "Navigation" },

  // Arrows
  { name: "arrow-up", c: ArrowUp, cat: "Arrows" },
  { name: "arrow-down", c: ArrowDown, cat: "Arrows" },
  { name: "arrow-left", c: ArrowLeft, cat: "Arrows" },
  { name: "arrow-right", c: ArrowRight, cat: "Arrows" },
  { name: "arrow-up-right", c: ArrowUpRight, cat: "Arrows" },
  { name: "chevron-up", c: ChevronUp, cat: "Arrows" },
  { name: "chevron-down", c: ChevronDown, cat: "Arrows" },
  { name: "chevron-left", c: ChevronLeft, cat: "Arrows" },
  { name: "chevron-right", c: ChevronRight, cat: "Arrows" },
  { name: "chevrons-up-down", c: ChevronsUpDown, cat: "Arrows" },
  { name: "corner-down-right", c: CornerDownRight, cat: "Arrows" },
  { name: "refresh", c: Refresh, cat: "Arrows" },
  { name: "rotate-cw", c: RotateCw, cat: "Arrows" },
  { name: "move", c: Move, cat: "Arrows" },

  // Actions
  { name: "plus", c: Plus, cat: "Actions" },
  { name: "minus", c: Minus, cat: "Actions" },
  { name: "close", c: Close, cat: "Actions" },
  { name: "check", c: Check, cat: "Actions" },
  { name: "edit", c: Edit, cat: "Actions" },
  { name: "trash", c: Trash, cat: "Actions" },
  { name: "copy", c: Copy, cat: "Actions" },
  { name: "save", c: Save, cat: "Actions" },
  { name: "share", c: Share, cat: "Actions" },
  { name: "download", c: Download, cat: "Actions" },
  { name: "upload", c: Upload, cat: "Actions" },
  { name: "send", c: Send, cat: "Actions" },
  { name: "bookmark", c: Bookmark, cat: "Actions" },
  { name: "pin", c: Pin, cat: "Actions" },
  { name: "star", c: Star, cat: "Actions" },
  { name: "heart", c: Heart, cat: "Actions" },
  { name: "flag", c: Flag, cat: "Actions" },

  // Status
  { name: "check-circle", c: CheckCircle, cat: "Status" },
  { name: "x-circle", c: XCircle, cat: "Status" },
  { name: "alert-circle", c: AlertCircle, cat: "Status" },
  { name: "alert-triangle", c: AlertTriangle, cat: "Status" },
  { name: "info", c: Info, cat: "Status" },
  { name: "help", c: Help, cat: "Status" },
  { name: "loader", c: Loader, cat: "Status" },
  { name: "zap", c: Zap, cat: "Status" },
  { name: "shield", c: Shield, cat: "Status" },
  { name: "lock", c: Lock, cat: "Status" },
  { name: "unlock", c: Unlock, cat: "Status" },

  // Communication
  { name: "mail", c: Mail, cat: "Communication" },
  { name: "inbox", c: Inbox, cat: "Communication" },
  { name: "message", c: Message, cat: "Communication" },
  { name: "messages", c: Messages, cat: "Communication" },
  { name: "bell", c: Bell, cat: "Communication" },
  { name: "bell-off", c: BellOff, cat: "Communication" },
  { name: "phone", c: Phone, cat: "Communication" },
  { name: "video", c: Video, cat: "Communication" },
  { name: "mic", c: Mic, cat: "Communication" },
  { name: "megaphone", c: Megaphone, cat: "Communication" },

  // Files
  { name: "file", c: FileIcon, cat: "Files" },
  { name: "file-text", c: FileText, cat: "Files" },
  { name: "file-plus", c: FilePlus, cat: "Files" },
  { name: "folder", c: Folder, cat: "Files" },
  { name: "folder-open", c: FolderOpen, cat: "Files" },
  { name: "notebook", c: Notebook, cat: "Files" },
  { name: "book", c: Book, cat: "Files" },
  { name: "bookmarks", c: Bookmarks, cat: "Files" },
  { name: "bookshelf", c: Bookshelf, cat: "Files" },
  { name: "wiki-book", c: WikiBook, cat: "Files" },
  { name: "ontology-wide", c: OntologyWide, cat: "Workflow" },
  { name: "clipboard", c: Clipboard, cat: "Files" },
  { name: "archive", c: Archive, cat: "Files" },
  { name: "paperclip", c: Paperclip, cat: "Files" },
  { name: "layers", c: Layers, cat: "Files" },

  // Media
  { name: "image", c: ImageIcon, cat: "Media" },
  { name: "camera", c: Camera, cat: "Media" },
  { name: "play", c: Play, cat: "Media" },
  { name: "pause", c: Pause, cat: "Media" },
  { name: "stop", c: Stop, cat: "Media" },
  { name: "skip-forward", c: SkipForward, cat: "Media" },
  { name: "skip-back", c: SkipBack, cat: "Media" },
  { name: "volume", c: Volume, cat: "Media" },
  { name: "volume-off", c: VolumeOff, cat: "Media" },
  { name: "music", c: Music, cat: "Media" },
  { name: "headphones", c: Headphones, cat: "Media" },

  // Time
  { name: "clock", c: Clock, cat: "Time" },
  { name: "calendar", c: Calendar, cat: "Time" },
  { name: "calendar-days", c: CalendarDays, cat: "Time" },
  { name: "hourglass", c: Hourglass, cat: "Time" },
  { name: "timer", c: Timer, cat: "Time" },
  { name: "history", c: HistoryIcon, cat: "Time" },

  // User
  { name: "user", c: User, cat: "User" },
  { name: "user-plus", c: UserPlus, cat: "User" },
  { name: "users", c: Users, cat: "User" },
  { name: "user-circle", c: UserCircle, cat: "User" },
  { name: "at", c: At, cat: "User" },

  // Data
  { name: "bar-chart", c: BarChart, cat: "Data" },
  { name: "line-chart", c: LineChart, cat: "Data" },
  { name: "pie-chart", c: PieChart, cat: "Data" },
  { name: "trending-up", c: TrendingUp, cat: "Data" },
  { name: "trending-down", c: TrendingDown, cat: "Data" },
  { name: "activity", c: Activity, cat: "Data" },
  { name: "database", c: Database, cat: "Data" },
  { name: "server", c: Server, cat: "Data" },

  // Settings
  { name: "settings", c: Settings, cat: "Settings" },
  { name: "sliders", c: Sliders, cat: "Settings" },
  { name: "toggle", c: Toggle, cat: "Settings" },
  { name: "tool", c: Tool, cat: "Settings" },
  { name: "wrench", c: Wrench, cat: "Settings" },
  { name: "cog", c: Cog, cat: "Settings" },

  // Search
  { name: "search", c: Search, cat: "Search" },
  { name: "filter", c: Filter, cat: "Search" },
  { name: "sort-asc", c: SortAsc, cat: "Search" },
  { name: "sort-desc", c: SortDesc, cat: "Search" },
  { name: "hash", c: Hash, cat: "Search" },
  { name: "tag", c: Tag, cat: "Search" },

  // Format
  { name: "bold", c: Bold, cat: "Format" },
  { name: "italic", c: Italic, cat: "Format" },
  { name: "underline", c: Underline, cat: "Format" },
  { name: "strikethrough", c: Strikethrough, cat: "Format" },
  { name: "heading", c: Heading, cat: "Format" },
  { name: "quote", c: Quote, cat: "Format" },
  { name: "code", c: Code, cat: "Format" },
  { name: "terminal", c: Terminal, cat: "Format" },
  { name: "list-ul", c: ListUl, cat: "Format" },
  { name: "list-ol", c: ListOl, cat: "Format" },
  { name: "list-check", c: ListCheck, cat: "Format" },
  { name: "indent", c: Indent, cat: "Format" },
  { name: "align-left", c: AlignLeft, cat: "Format" },
  { name: "align-center", c: AlignCenter, cat: "Format" },
  { name: "type", c: Type, cat: "Format" },
  { name: "link", c: Link, cat: "Format" },
  { name: "unlink", c: Unlink, cat: "Format" },

  // Devices
  { name: "phone-device", c: Phone2, cat: "Devices" },
  { name: "tablet", c: Tablet, cat: "Devices" },
  { name: "laptop", c: Laptop, cat: "Devices" },
  { name: "monitor", c: Monitor, cat: "Devices" },
  { name: "cloud", c: Cloud, cat: "Devices" },
  { name: "cloud-up", c: CloudUp, cat: "Devices" },
  { name: "cloud-down", c: CloudDown, cat: "Devices" },
  { name: "wifi", c: Wifi, cat: "Devices" },
  { name: "bluetooth", c: Bluetooth, cat: "Devices" },
  { name: "battery", c: Battery, cat: "Devices" },
  { name: "power", c: Power, cat: "Devices" },

  // Finance
  { name: "dollar-sign", c: DollarSign, cat: "Finance" },
  { name: "credit-card", c: CreditCard, cat: "Finance" },
  { name: "wallet", c: Wallet, cat: "Finance" },
  { name: "coin", c: Coin, cat: "Finance" },
  { name: "piggy-bank", c: PiggyBank, cat: "Finance" },
  { name: "receipt", c: Receipt, cat: "Finance" },
  { name: "briefcase", c: Briefcase, cat: "Finance" },
  { name: "building", c: Building, cat: "Finance" },
  { name: "target", c: Target, cat: "Finance" },
  { name: "award", c: Award, cat: "Finance" },

  // Workflow
  { name: "workflow", c: Workflow, cat: "Workflow" },
  { name: "branch", c: Branch, cat: "Workflow" },
  { name: "network", c: Network, cat: "Workflow" },
  { name: "sitemap", c: Sitemap, cat: "Workflow" },
  { name: "sparkles", c: Sparkles, cat: "Workflow" },
  { name: "beaker", c: Beaker, cat: "Workflow" },
  { name: "lightbulb", c: Lightbulb, cat: "Workflow" },
  { name: "eye", c: Eye, cat: "Workflow" },
  { name: "eye-off", c: EyeOff, cat: "Workflow" },

  // Misc
  { name: "shine", c: Zap2, cat: "Misc" },
  { name: "gift", c: Gift, cat: "Misc" },
  { name: "coffee", c: Coffee, cat: "Misc" },
  { name: "sun", c: Sun, cat: "Misc" },
  { name: "sunrise", c: Sunrise, cat: "Misc" },
  { name: "moon", c: Moon, cat: "Misc" },
  { name: "flame", c: Flame, cat: "Misc" },
  { name: "brain", c: Brain, cat: "Workflow" },
  { name: "wand", c: Wand, cat: "Workflow" },
  { name: "anchor", c: Anchor, cat: "Misc" },
  { name: "box", c: Box, cat: "Misc" },
  { name: "gauge", c: Gauge, cat: "Misc" },
];

// Export all individual icon components to window so app.jsx can use them as JSX tags
Object.assign(window, { ICONS, ImperialMark, ImperialMarkSolid });
ICONS.forEach(({ c }) => {
  // c is the React component; we need a stable name. Get from registry mapping below.
});

// Map of name → component for direct global access
const ICON_MAP = {
  Home, Compass, MapIcon, Layout, Sidebar, Menu, Grid, Globe, ExternalLink,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown,
  CornerDownRight, Refresh, RotateCw, Move,
  Plus, Minus, Close, Check, Edit, Trash, Copy, Save, Share,
  Download, Upload, Send, Bookmark, Pin, Star, Heart, Flag,
  CheckCircle, XCircle, AlertCircle, AlertTriangle, Info, Help,
  Loader, Zap, Shield, Lock, Unlock,
  Mail, Inbox, Message, Messages, Bell, BellOff, Phone, Video, Mic, Megaphone,
  FileIcon, FileText, FilePlus, Folder, FolderOpen, Notebook, Book, Bookmarks,
  Bookshelf, WikiBook, OntologyWide,
  Clipboard, Archive, Paperclip, Layers,
  ImageIcon, Camera, Play, Pause, Stop, SkipForward, SkipBack,
  Volume, VolumeOff, Music, Headphones,
  Clock, Calendar, CalendarDays, Hourglass, Timer, HistoryIcon,
  User, UserPlus, Users, UserCircle, At,
  BarChart, LineChart, PieChart, TrendingUp, TrendingDown,
  Activity, Database, Server,
  Settings, Sliders, Toggle, Tool, Wrench, Cog,
  Search, Filter, SortAsc, SortDesc, Hash, Tag,
  Bold, Italic, Underline, Strikethrough, Heading, Quote, Code, Terminal,
  ListUl, ListOl, ListCheck, Indent, AlignLeft, AlignCenter, Type, Link, Unlink,
  Phone2, Tablet, Laptop, Monitor, Cloud, CloudUp, CloudDown,
  Wifi, Bluetooth, Battery, Power,
  DollarSign, CreditCard, Wallet, Coin, PiggyBank, Receipt,
  Briefcase, Building, Target, Award,
  Workflow, Branch, Network, Sitemap, Sparkles, Beaker, Lightbulb, Brain, Wand, Eye, EyeOff,
  Zap2, Gift, Coffee, Sun, Sunrise, Moon, Flame, Anchor, Box, Gauge,
};

// =============================================================
// Imperial Color Picker — Photoshop/Figma-style color picker
// HSL canvas + hue + alpha + hex/rgb + eyedropper + recent + presets
// =============================================================

const { useState: cpUseState, useEffect: cpUseEffect, useRef: cpUseRef, useMemo: cpUseMemo, useCallback: cpUseCallback } = React;

// ---- Color math ----
function hsvToRgb(h, s, v) {
  h = h / 360; s = s / 100; v = v / 100;
  var i = Math.floor(h * 6), f = h * 6 - i;
  var p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  var r, g, b;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    default: r = v; g = p; b = q;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, v = max;
  var d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) { h = 0; }
  else {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      default: h = ((r - g) / d + 4);
    }
    h *= 60;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(v * 100)];
}

function rgbToHex(r, g, b) {
  function toHex(c) { var h = c.toString(16); return h.length === 1 ? "0" + h : h; }
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map(function(c){return c+c;}).join("");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return [parseInt(hex.slice(0,2), 16), parseInt(hex.slice(2,4), 16), parseInt(hex.slice(4,6), 16)];
}

function rgbaCss(r, g, b, a) {
  return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}

// ---- Tailwind-style preset palette ----
const PRESETS = [
  // Grays
  ["#f8fafc","#e2e8f0","#cbd5e1","#94a3b8","#64748b","#475569","#334155","#1e293b","#0f172a"],
  // Reds
  ["#fee2e2","#fecaca","#fca5a5","#f87171","#ef4444","#dc2626","#b91c1c","#991b1b","#7f1d1d"],
  // Oranges
  ["#ffedd5","#fed7aa","#fdba74","#fb923c","#f97316","#ea580c","#c2410c","#9a3412","#7c2d12"],
  // Yellows
  ["#fef9c3","#fef08a","#fde047","#facc15","#eab308","#ca8a04","#a16207","#854d0e","#713f12"],
  // Greens
  ["#dcfce7","#bbf7d0","#86efac","#4ade80","#22c55e","#16a34a","#15803d","#166534","#14532d"],
  // Teals
  ["#ccfbf1","#99f6e4","#5eead4","#2dd4bf","#14b8a6","#0d9488","#0f766e","#115e59","#134e4a"],
  // Blues
  ["#dbeafe","#bfdbfe","#93c5fd","#60a5fa","#3b82f6","#2563eb","#1d4ed8","#1e40af","#1e3a8a"],
  // Indigos
  ["#e0e7ff","#c7d2fe","#a5b4fc","#818cf8","#6366f1","#4f46e5","#4338ca","#3730a3","#312e81"],
  // Violets
  ["#ede9fe","#ddd6fe","#c4b5fd","#a78bfa","#8b5cf6","#7c3aed","#6d28d9","#5b21b6","#4c1d95"],
  // Pinks
  ["#fce7f3","#fbcfe8","#f9a8d4","#f472b6","#ec4899","#db2777","#be185d","#9d174d","#831843"],
];

// ---- Saturation/Value canvas ----
function SVCanvas(props) {
  var hue = props.hue;
  var sat = props.sat;
  var val = props.val;
  var canvasRef = cpUseRef(null);
  var dragRef = cpUseRef(false);

  cpUseEffect(function() {
    var canvas = canvasRef.current;
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var w = canvas.width, h = canvas.height;
    // Base hue
    var rgb = hsvToRgb(hue, 100, 100);
    ctx.fillStyle = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
    ctx.fillRect(0, 0, w, h);
    // White → transparent (left → right)
    var wgrad = ctx.createLinearGradient(0, 0, w, 0);
    wgrad.addColorStop(0, "rgba(255,255,255,1)");
    wgrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = wgrad;
    ctx.fillRect(0, 0, w, h);
    // Black → transparent (bottom → top)
    var bgrad = ctx.createLinearGradient(0, h, 0, 0);
    bgrad.addColorStop(0, "rgba(0,0,0,1)");
    bgrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bgrad;
    ctx.fillRect(0, 0, w, h);
  }, [hue]);

  function pick(e) {
    var rect = canvasRef.current.getBoundingClientRect();
    var x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    var y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    var newSat = (x / rect.width) * 100;
    var newVal = 100 - (y / rect.height) * 100;
    props.onChange(newSat, newVal);
  }

  function onMouseDown(e) {
    dragRef.current = true;
    pick(e);
    function onMove(ev) { if (dragRef.current) pick(ev); }
    function onUp() {
      dragRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  var dotX = (sat / 100) * 240;
  var dotY = (1 - val / 100) * 160;

  return (
    <div className="cp-sv" onMouseDown={onMouseDown}>
      <canvas ref={canvasRef} width="240" height="160" />
      <div className="cp-sv-dot" style={{ left: dotX, top: dotY }}></div>
    </div>
  );
}

// ---- Hue slider ----
function HueSlider(props) {
  var trackRef = cpUseRef(null);
  var dragRef = cpUseRef(false);

  function pick(e) {
    var rect = trackRef.current.getBoundingClientRect();
    var x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    var newHue = (x / rect.width) * 360;
    props.onChange(newHue);
  }
  function onMouseDown(e) {
    dragRef.current = true;
    pick(e);
    function onMove(ev) { if (dragRef.current) pick(ev); }
    function onUp() {
      dragRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }
  var thumbX = (props.hue / 360) * 240;
  return (
    <div className="cp-hue" ref={trackRef} onMouseDown={onMouseDown}>
      <div className="cp-hue-thumb" style={{ left: thumbX }}></div>
    </div>
  );
}

// ---- Alpha slider ----
function AlphaSlider(props) {
  var trackRef = cpUseRef(null);
  var dragRef = cpUseRef(false);
  var rgb = props.rgb;
  function pick(e) {
    var rect = trackRef.current.getBoundingClientRect();
    var x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    props.onChange(x / rect.width);
  }
  function onMouseDown(e) {
    dragRef.current = true;
    pick(e);
    function onMove(ev) { if (dragRef.current) pick(ev); }
    function onUp() {
      dragRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }
  var thumbX = props.alpha * 240;
  var bg = "linear-gradient(to right, rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",0), rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",1))";
  return (
    <div className="cp-alpha" ref={trackRef} onMouseDown={onMouseDown}>
      <div className="cp-alpha-checker"></div>
      <div className="cp-alpha-grad" style={{ background: bg }}></div>
      <div className="cp-alpha-thumb" style={{ left: thumbX }}></div>
    </div>
  );
}

// ---- Main ColorPicker ----
function ColorPicker(props) {
  // value: hex string (with or without alpha)
  // onChange: (hex8) => void
  var initial = props.value || "#3b82f6";
  var initialRgb = hexToRgb(initial.slice(0, 7)) || [59, 130, 246];
  var initialHsv = rgbToHsv(initialRgb[0], initialRgb[1], initialRgb[2]);

  var [hue, setHue] = cpUseState(initialHsv[0]);
  var [sat, setSat] = cpUseState(initialHsv[1]);
  var [val, setVal] = cpUseState(initialHsv[2]);
  var [alpha, setAlpha] = cpUseState(1);
  var [hexInput, setHexInput] = cpUseState(initial.slice(0, 7));
  var [recent, setRecent] = cpUseState(function() {
    try { return JSON.parse(localStorage.getItem("imp-cp-recent") || "[]"); } catch(e) { return []; }
  });

  var rgb = cpUseMemo(function() { return hsvToRgb(hue, sat, val); }, [hue, sat, val]);
  var hex = cpUseMemo(function() { return rgbToHex(rgb[0], rgb[1], rgb[2]); }, [rgb]);

  cpUseEffect(function() {
    setHexInput(hex);
    if (props.onChange) props.onChange(hex, alpha, rgb);
  }, [hex, alpha]);

  function commitColor() {
    setRecent(function(prev) {
      var next = [hex].concat(prev.filter(function(c){ return c !== hex; })).slice(0, 12);
      try { localStorage.setItem("imp-cp-recent", JSON.stringify(next)); } catch(e){}
      return next;
    });
  }

  function applyHex(h) {
    var rgb = hexToRgb(h);
    if (!rgb) return;
    var hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
    setHue(hsv[0]); setSat(hsv[1]); setVal(hsv[2]);
  }

  function onHexInput(e) {
    var v = e.target.value;
    setHexInput(v);
    if (/^#?[0-9a-f]{6}$/i.test(v)) {
      applyHex(v);
    }
  }

  async function pickEyedropper() {
    if (!window.EyeDropper) {
      alert("EyeDropper API is not supported in this browser. Try Chrome/Edge.");
      return;
    }
    try {
      var ed = new window.EyeDropper();
      var result = await ed.open();
      applyHex(result.sRGBHex);
    } catch(e) { /* user canceled */ }
  }

  var swatchStyle = { background: rgbaCss(rgb[0], rgb[1], rgb[2], alpha) };

  return (
    <div className="cp-root">
      <SVCanvas hue={hue} sat={sat} val={val} onChange={function(s, v) { setSat(s); setVal(v); }} />
      <HueSlider hue={hue} onChange={setHue} />
      <AlphaSlider alpha={alpha} rgb={rgb} onChange={setAlpha} />

      <div className="cp-row">
        <div className="cp-swatch-wrap">
          <div className="cp-swatch-checker"></div>
          <div className="cp-swatch" style={swatchStyle}></div>
        </div>
        <button className="cp-eyedrop" onClick={pickEyedropper} title="Pick color from screen">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m17 3 4 4-3 3-2-2-7 7-4 1 1-4 7-7-2-2z"/>
          </svg>
        </button>
        <input className="cp-hex" value={hexInput} onChange={onHexInput} onBlur={commitColor} maxLength="7" />
      </div>

      <div className="cp-row cp-row-rgb">
        <label>R<input type="number" min="0" max="255" value={rgb[0]} onChange={function(e){
          applyHex(rgbToHex(+e.target.value || 0, rgb[1], rgb[2]));
        }} /></label>
        <label>G<input type="number" min="0" max="255" value={rgb[1]} onChange={function(e){
          applyHex(rgbToHex(rgb[0], +e.target.value || 0, rgb[2]));
        }} /></label>
        <label>B<input type="number" min="0" max="255" value={rgb[2]} onChange={function(e){
          applyHex(rgbToHex(rgb[0], rgb[1], +e.target.value || 0));
        }} /></label>
        <label>A<input type="number" min="0" max="100" value={Math.round(alpha*100)} onChange={function(e){
          setAlpha(Math.max(0, Math.min(100, +e.target.value || 0)) / 100);
        }} /></label>
      </div>

      {recent.length > 0 ? (
        <div className="cp-section">
          <div className="cp-section-label">Recent</div>
          <div className="cp-recent">
            {recent.map(function(c) {
              return <button key={c} className="cp-recent-chip" style={{background: c}} onClick={function(){ applyHex(c); }} title={c}></button>;
            })}
          </div>
        </div>
      ) : null}

      <div className="cp-section">
        <div className="cp-section-label">Presets</div>
        <div className="cp-presets">
          {PRESETS.map(function(row, i) {
            return (
              <div key={i} className="cp-preset-row">
                {row.map(function(c) {
                  return <button key={c} className="cp-preset-chip" style={{background: c}} onClick={function(){ applyHex(c); commitColor(); }} title={c}></button>;
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Imperial namespace — preferred entry point
// =============================================================================
const Imperial = {
  // Icons by name (lowercase keys for lookup)
  icons: ICON_MAP,
  // <Imperial.Icon name="search" /> — string-name lookup
  Icon: function(props) {
    var name = props.name || "";
    var key = Object.keys(ICON_MAP).find(function(k) {
      return k.toLowerCase() === name.toLowerCase();
    });
    var Comp = key ? ICON_MAP[key] : null;
    if (!Comp) {
      console.warn('[Imperial.Icon] Unknown icon: "' + name + '"');
      return null;
    }
    var rest = Object.assign({}, props);
    delete rest.name;
    return React.createElement(Comp, rest);
  },
  // Color picker
  ColorPicker: ColorPicker,
  // Color utils
  hexToRgb: hexToRgb,
  rgbToHex: rgbToHex,
  hsvToRgb: hsvToRgb,
  rgbToHsv: rgbToHsv,
};

// Attach everything to window
Object.assign(window, ICON_MAP);
window.Imperial = Imperial;
window.ColorPicker = ColorPicker;
window.hexToRgb = hexToRgb;
window.rgbToHex = rgbToHex;
window.hsvToRgb = hsvToRgb;
window.rgbToHsv = rgbToHsv;
