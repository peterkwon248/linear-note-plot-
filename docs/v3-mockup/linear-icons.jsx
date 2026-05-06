// =============================================================
// Linear-style semantic icons — Status, Priority, Relations, Dates, Views
// 24 viewBox · uses currentColor by default · supports `tone` prop for semantic color
// =============================================================

// Helper: stroked SVG with semantic color support
function lk(paths, opts) {
  opts = opts || {};
  var defaultTone = opts.tone || null;
  function Comp(props) {
    props = props || {};
    var size = props.size || 20;
    var sw = props.strokeWidth || 1.5;
    var tone = props.tone !== undefined ? props.tone : defaultTone;
    var color = tone ? "var(--icon-" + tone + ")" : (props.color || "currentColor");
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

// Helper: filled svg variant (mixed fill+stroke common in Linear)
function lkFill(render, opts) {
  opts = opts || {};
  var defaultTone = opts.tone || null;
  function Comp(props) {
    props = props || {};
    var size = props.size || 20;
    var tone = props.tone !== undefined ? props.tone : defaultTone;
    var color = tone ? "var(--icon-" + tone + ")" : (props.color || "currentColor");
    return (
      <svg viewBox="0 0 24 24" fill="none" width={size} height={size}
        className={props.className || ""} style={props.style}>
        {render(color)}
      </svg>
    );
  }
  Comp.keywords = opts.keywords || [];
  return Comp;
}

// =============================================================
// STATUS — workflow states (Linear's signature circular progress)
// =============================================================

// Backlog: dashed circle
const StatusBacklog = lk([
  <circle key="0" cx="12" cy="12" r="8" strokeDasharray="2 3"/>
], { tone: "backlog", keywords: ["backlog","queue"] });

const StatusBacklogFilled = lkFill(function(c) {
  return [
    <circle key="0" cx="12" cy="12" r="8" stroke={c} strokeWidth="1.5" strokeDasharray="2 3"/>,
    <circle key="1" cx="12" cy="12" r="3" fill={c}/>
  ];
}, { tone: "backlog" });

// Todo: empty circle
const StatusTodo = lk([
  <circle key="0" cx="12" cy="12" r="8"/>
], { tone: "todo", keywords: ["todo","unstarted","planned"] });

const StatusTodoFilled = lkFill(function(c) {
  return [
    <circle key="0" cx="12" cy="12" r="8" stroke={c} strokeWidth="1.5"/>,
    <circle key="1" cx="12" cy="12" r="3" fill={c}/>
  ];
}, { tone: "todo" });

// In Progress: half-filled pie (Linear's signature)
const StatusInProgress = lk([
  <circle key="0" cx="12" cy="12" r="8"/>,
  <path key="1" d="M12 4 A 8 8 0 0 1 20 12 L 12 12 Z" fill="currentColor" stroke="none"/>
], { tone: "progress", keywords: ["progress","working","active"] });

const StatusInProgressFilled = lkFill(function(c) {
  return [
    <circle key="0" cx="12" cy="12" r="8" stroke={c} strokeWidth="1.5"/>,
    <path key="1" d="M12 4 A 8 8 0 0 1 20 12 L 12 12 Z" fill={c}/>
  ];
}, { tone: "progress" });

// In Review: 3/4 filled
const StatusInReview = lk([
  <circle key="0" cx="12" cy="12" r="8"/>,
  <path key="1" d="M12 4 A 8 8 0 0 1 12 20 L 12 12 Z" fill="currentColor" stroke="none"/>
], { tone: "review", keywords: ["review","peer"] });

const StatusInReviewFilled = lkFill(function(c) {
  return [
    <circle key="0" cx="12" cy="12" r="8" stroke={c} strokeWidth="1.5"/>,
    <path key="1" d="M12 4 A 8 8 0 0 1 12 20 L 12 12 Z" fill={c}/>
  ];
}, { tone: "review" });

// Done: filled circle with check
const StatusDone = lk([
  <circle key="0" cx="12" cy="12" r="8"/>,
  <path key="1" d="m9 12 2.2 2.2L15.5 10"/>
], { tone: "done", keywords: ["done","completed","finished"] });

const StatusDoneFilled = lkFill(function(c) {
  return [
    <circle key="0" cx="12" cy="12" r="8" fill={c}/>,
    <path key="1" d="m9 12 2.2 2.2L15.5 10" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  ];
}, { tone: "done" });

// Canceled: filled circle with X
const StatusCanceled = lk([
  <circle key="0" cx="12" cy="12" r="8"/>,
  <path key="1" d="m9.5 9.5 5 5M14.5 9.5l-5 5"/>
], { tone: "canceled", keywords: ["canceled","cancelled","stopped"] });

const StatusCanceledFilled = lkFill(function(c) {
  return [
    <circle key="0" cx="12" cy="12" r="8" fill={c}/>,
    <path key="1" d="m9.5 9.5 5 5M14.5 9.5l-5 5" stroke="white" strokeWidth="1.75" strokeLinecap="round" fill="none"/>
  ];
}, { tone: "canceled" });

// Duplicate: filled circle with arrow
const StatusDuplicate = lk([
  <circle key="0" cx="12" cy="12" r="8"/>,
  <path key="1" d="M9 12h6M12 9l3 3-3 3"/>
], { tone: "duplicate", keywords: ["duplicate","copy"] });

const StatusDuplicateFilled = lkFill(function(c) {
  return [
    <circle key="0" cx="12" cy="12" r="8" fill={c}/>,
    <path key="1" d="M9 12h6M12 9l3 3-3 3" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  ];
}, { tone: "duplicate" });

// =============================================================
// STATUS TYPE — high-level workflow categories
// =============================================================

const StatusTypeTriage = lk([
  <circle key="0" cx="12" cy="12" r="8"/>,
  <path key="1" d="M12 16h.01M12 8v5"/>
], { tone: "triage", keywords: ["triage","attention","review"] });

const StatusTypeBacklog = StatusBacklog;
const StatusTypeUnstarted = StatusTodo;
const StatusTypeStarted = StatusInProgress;
const StatusTypeCompleted = StatusDone;
const StatusTypeCanceled = StatusCanceled;

// =============================================================
// PRIORITY — bar chart style (Linear signature)
// =============================================================

// No priority: three short dashes
const PriorityNone = lk([
  <path key="0" d="M5 12h2M11 12h2M17 12h2"/>
], { tone: "priority-none", keywords: ["nopriority","none","unset"] });

// Urgent: filled rounded square with !
const PriorityUrgent = lkFill(function(c) {
  return [
    <rect key="0" x="3.5" y="3.5" width="17" height="17" rx="3" fill={c}/>,
    <path key="1" d="M12 7v6M12 16.5h.01" stroke="white" strokeWidth="1.75" strokeLinecap="round" fill="none"/>
  ];
}, { tone: "priority-urgent", keywords: ["urgent","critical","p0"] });

// High: 3 bars (all filled)
const PriorityHigh = lkFill(function(c) {
  return [
    <rect key="0" x="3" y="13" width="4" height="6" rx="1" fill={c}/>,
    <rect key="1" x="10" y="9" width="4" height="10" rx="1" fill={c}/>,
    <rect key="2" x="17" y="5" width="4" height="14" rx="1" fill={c}/>
  ];
}, { tone: "priority-high", keywords: ["high","p1"] });

// Medium: 3 bars (2 filled)
const PriorityMedium = lkFill(function(c) {
  return [
    <rect key="0" x="3" y="13" width="4" height="6" rx="1" fill={c}/>,
    <rect key="1" x="10" y="9" width="4" height="10" rx="1" fill={c}/>,
    <rect key="2" x="17" y="5" width="4" height="14" rx="1" fill="currentColor" opacity="0.25"/>
  ];
}, { tone: "priority-medium", keywords: ["medium","p2"] });

// Low: 3 bars (1 filled)
const PriorityLow = lkFill(function(c) {
  return [
    <rect key="0" x="3" y="13" width="4" height="6" rx="1" fill={c}/>,
    <rect key="1" x="10" y="9" width="4" height="10" rx="1" fill="currentColor" opacity="0.25"/>,
    <rect key="2" x="17" y="5" width="4" height="14" rx="1" fill="currentColor" opacity="0.25"/>
  ];
}, { tone: "priority-low", keywords: ["low","p3"] });

// =============================================================
// RELATIONS — issue relationship arrows
// =============================================================

const RelationBlocks = lk([
  <circle key="0" cx="12" cy="12" r="8"/>,
  <path key="1" d="M7.5 7.5 16.5 16.5"/>
], { tone: "blocks", keywords: ["blocks","blocking"] });

const RelationBlockedBy = lk([
  <circle key="0" cx="12" cy="12" r="8"/>,
  <path key="1" d="M16.5 7.5 7.5 16.5"/>
], { tone: "blocks", keywords: ["blockedby","dependency"] });

const RelationDuplicate = lk([
  <rect key="0" x="3" y="7" width="10" height="14" rx="2"/>,
  <path key="1" d="M7 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2"/>
], { keywords: ["duplicate","copy","clone"] });

const RelationDuplicateOf = lk([
  <rect key="0" x="3" y="7" width="10" height="14" rx="2"/>,
  <path key="1" d="M7 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2"/>,
  <path key="2" d="m6 14 1.8 1.8L11 12.5"/>
], { keywords: ["duplicateof","original"] });

const RelationRelated = lk([
  <path key="0" d="M10 14a4 4 0 0 1 0-5.7l3-3a4 4 0 1 1 5.7 5.7l-1.5 1.5"/>,
  <path key="1" d="M14 10a4 4 0 0 1 0 5.7l-3 3a4 4 0 1 1-5.7-5.7l1.5-1.5"/>
], { tone: "related", keywords: ["related","linked"] });

const RelationSubIssue = lk([
  <path key="0" d="M5 4v8a3 3 0 0 0 3 3h11"/>,
  <path key="1" d="m16 12 3 3-3 3"/>
], { keywords: ["subissue","child","branch"] });

const RelationParentIssue = lk([
  <path key="0" d="M19 20v-8a3 3 0 0 0-3-3H5"/>,
  <path key="1" d="m8 12-3-3 3-3"/>
], { keywords: ["parent","epic"] });

// =============================================================
// DATES — calendar variants for date types
// =============================================================

const DateDue = lkFill(function(c) {
  return [
    <rect key="0" x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>,
    <path key="1" d="M3.5 9h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>,
    <circle key="2" cx="17" cy="15" r="2" fill={c}/>
  ];
}, { tone: "due", keywords: ["due","deadline","duedate"] });

const DateCreated = lk([
  <rect key="0" x="3.5" y="5" width="17" height="15" rx="2"/>,
  <path key="1" d="M3.5 9h17M8 3v4M16 3v4"/>,
  <path key="2" d="M12 12v4M10 14h4"/>
], { keywords: ["created","new","added"] });

const DateUpdated = lk([
  <rect key="0" x="3.5" y="5" width="17" height="15" rx="2"/>,
  <path key="1" d="M3.5 9h17M8 3v4M16 3v4"/>,
  <path key="2" d="M9 14a3 3 0 1 0 1-2.2"/>,
  <path key="3" d="M9 11.5v2.5h2.5"/>
], { keywords: ["updated","modified","edited"] });

const DateStarted = lk([
  <rect key="0" x="3.5" y="5" width="17" height="15" rx="2"/>,
  <path key="1" d="M3.5 9h17M8 3v4M16 3v4"/>,
  <path key="2" d="m11 12 3 2.5L11 17z" fill="currentColor"/>
], { keywords: ["started","begun"] });

const DateCompleted = lk([
  <rect key="0" x="3.5" y="5" width="17" height="15" rx="2"/>,
  <path key="1" d="M3.5 9h17M8 3v4M16 3v4"/>,
  <path key="2" d="m9.5 14 2 2 3.5-4"/>
], { keywords: ["completed","finished","done"] });

const DateTriaged = lk([
  <rect key="0" x="3.5" y="5" width="17" height="15" rx="2"/>,
  <path key="1" d="M3.5 9h17M8 3v4M16 3v4"/>,
  <circle key="2" cx="12" cy="14.5" r="2.5"/>,
  <path key="3" d="M12 13v1.5l1 1"/>
], { keywords: ["triaged","reviewed"] });

const TimeInStatus = lk([
  <circle key="0" cx="12" cy="13" r="7"/>,
  <path key="1" d="M12 9.5V13l2 1.5M9 3h6"/>
], { keywords: ["timeinstatus","duration","elapsed"] });

// =============================================================
// VIEWS — display modes
// =============================================================

const ViewList = lk([
  <path key="0" d="M3 6h18M3 12h18M3 18h18"/>,
  <circle key="1" cx="3.5" cy="6" r="0.5" fill="currentColor"/>,
  <circle key="2" cx="3.5" cy="12" r="0.5" fill="currentColor"/>,
  <circle key="3" cx="3.5" cy="18" r="0.5" fill="currentColor"/>
], { keywords: ["list","listview"] });

const ViewBoard = lk([
  <rect key="0" x="3" y="4" width="6" height="16" rx="1.5"/>,
  <rect key="1" x="11" y="4" width="6" height="11" rx="1.5"/>,
  <rect key="2" x="19" y="4" width="2" height="6" rx="1"/>
], { keywords: ["board","kanban","columns"] });

const ViewTimeline = lk([
  <path key="0" d="M3 6h12M3 12h18M3 18h8"/>,
  <circle key="1" cx="15" cy="6" r="2" fill="currentColor"/>,
  <circle key="2" cx="21" cy="12" r="2"/>,
  <circle key="3" cx="11" cy="18" r="2"/>
], { keywords: ["timeline","gantt","chrono"] });

const ViewCalendar = lk([
  <rect key="0" x="3.5" y="5" width="17" height="15" rx="2"/>,
  <path key="1" d="M3.5 10h17M8 3v4M16 3v4"/>,
  <rect key="2" x="7" y="13" width="2" height="2" fill="currentColor"/>,
  <rect key="3" x="11" y="13" width="2" height="2" fill="currentColor"/>,
  <rect key="4" x="15" y="13" width="2" height="2" fill="currentColor"/>
], { keywords: ["calendar","month","schedule"] });

const ViewRoadmap = lk([
  <path key="0" d="M3 7h6l2 3h4l2-3h4M3 17h6l2-3h4l2 3h4"/>,
  <circle key="1" cx="3" cy="7" r="1" fill="currentColor"/>,
  <circle key="2" cx="21" cy="7" r="1" fill="currentColor"/>
], { keywords: ["roadmap","plan","journey"] });

const ViewGantt = lk([
  <rect key="0" x="3" y="5" width="9" height="3" rx="1" fill="currentColor"/>,
  <rect key="1" x="7" y="10.5" width="11" height="3" rx="1" fill="currentColor" opacity="0.5"/>,
  <rect key="2" x="12" y="16" width="9" height="3" rx="1" fill="currentColor" opacity="0.7"/>
], { keywords: ["gantt","schedule","tasks"] });

const ViewKanban = ViewBoard;

// =============================================================
// CALENDAR variants
// =============================================================

const CalDay = lk([
  <rect key="0" x="3.5" y="5" width="17" height="15" rx="2"/>,
  <path key="1" d="M3.5 10h17M8 3v4M16 3v4"/>,
  <rect key="2" x="10" y="13" width="4" height="4" rx="0.5" fill="currentColor"/>
], { keywords: ["day","today"] });

const CalWeek = lk([
  <rect key="0" x="3.5" y="5" width="17" height="15" rx="2"/>,
  <path key="1" d="M3.5 10h17M8 3v4M16 3v4"/>,
  <rect key="2" x="6" y="13" width="12" height="4" rx="0.5" fill="currentColor"/>
], { keywords: ["week","weekly"] });

const CalMonth = ViewCalendar;

const CalYear = lk([
  <rect key="0" x="3.5" y="5" width="17" height="15" rx="2"/>,
  <path key="1" d="M3.5 10h17M8 3v4M16 3v4"/>,
  <path key="2" d="M9 16.5h6M10.5 14.5l3 4M13.5 14.5l-3 4"/>
], { keywords: ["year","annual"] });

const CalReminder = lk([
  <rect key="0" x="3.5" y="5" width="17" height="15" rx="2"/>,
  <path key="1" d="M3.5 10h17M8 3v4M16 3v4"/>,
  <path key="2" d="M12 12v3M12 17.5h.01"/>
], { keywords: ["reminder","alert"] });

const CalRecurring = lk([
  <rect key="0" x="3.5" y="5" width="17" height="15" rx="2"/>,
  <path key="1" d="M3.5 10h17M8 3v4M16 3v4"/>,
  <path key="2" d="M9 15.5a3 3 0 0 0 5.5 1.5M15 14a3 3 0 0 0-5.5-1.5"/>,
  <path key="3" d="M14 12.5h1.5V14M10 16.5H8.5V15"/>
], { keywords: ["recurring","repeat","cycle"] });

// =============================================================
// PROJECT — milestones, sprints, cycles, initiatives
// =============================================================

const Milestone = lkFill(function(c) {
  return [
    <path key="0" d="M12 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>,
    <path key="1" d="M12 5h7l-2 3 2 3h-7" fill={c} stroke="none"/>
  ];
}, { keywords: ["milestone","flag","marker"] });

const Sprint = lk([
  <path key="0" d="M5 19c0-3.5 1.5-7 7-7s7 3.5 7 7"/>,
  <path key="1" d="M12 12V8M9 5l3 3 3-3"/>
], { keywords: ["sprint","run","push"] });

const Cycle = lk([
  <path key="0" d="M21 12a9 9 0 1 1-3-6.7"/>,
  <path key="1" d="M21 4v5h-5"/>
], { tone: "cycle", keywords: ["cycle","iteration","sprint"] });

const Initiative = lkFill(function(c) {
  return [
    <path key="0" d="M12 3 4 7v6c0 4 3.5 7 8 8 4.5-1 8-4 8-8V7l-8-4z" fill={c} opacity="0.15" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>,
    <path key="1" d="m9 12 2 2 4-4" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  ];
}, { keywords: ["initiative","goal","strategic"] });

const Project = lk([
  <rect key="0" x="3" y="6" width="18" height="14" rx="2"/>,
  <path key="1" d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>,
  <path key="2" d="M3 12h18"/>
], { keywords: ["project","portfolio"] });

const ProjectProperties = lk([
  <rect key="0" x="3" y="6" width="18" height="14" rx="2"/>,
  <path key="1" d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>,
  <path key="2" d="M7 12h4M7 16h6"/>
], { keywords: ["properties","fields","metadata"] });

// =============================================================
// LABELS variants
// =============================================================

const Label = lk([
  <path key="0" d="M3 7v6.5c0 .8.3 1.5.9 2.1l5.5 5.5c1.2 1.2 3 1.2 4.2 0l5.9-5.9c1.2-1.2 1.2-3 0-4.2L13.6 5C13 4.4 12.3 4 11.5 4H5a2 2 0 0 0-2 2v1z"/>,
  <circle key="1" cx="7.5" cy="7.5" r="1.2" fill="currentColor"/>
], { keywords: ["label","tag"] });

const LabelGroup = lk([
  <path key="0" d="M5 9v4c0 .5.2 1 .6 1.4l5 5c.8.8 2 .8 2.8 0l4-4c.8-.8.8-2 0-2.8L12.4 7.6C12 7.2 11.5 7 11 7H7a2 2 0 0 0-2 2z"/>,
  <path key="1" d="M9 5v0M11 3l8 8c.8.8.8 2 0 2.8l-1 1"/>,
  <circle key="2" cx="8.5" cy="10.5" r="1" fill="currentColor"/>
], { keywords: ["labelgroup","tags"] });

const SuggestedLabel = lk([
  <path key="0" d="M3 7v6.5c0 .8.3 1.5.9 2.1l5.5 5.5c1.2 1.2 3 1.2 4.2 0l5.9-5.9c1.2-1.2 1.2-3 0-4.2L13.6 5C13 4.4 12.3 4 11.5 4H5a2 2 0 0 0-2 2v1z"/>,
  <circle key="1" cx="7.5" cy="7.5" r="1.2" fill="currentColor"/>,
  <path key="2" d="M16 5.5 17 4l1 1.5 1.5 1L18 7.5l-1 1.5-1-1.5L14.5 6.5z" fill="currentColor" stroke="none"/>
], { keywords: ["suggested","ai","recommend"] });

// =============================================================
// MISC product icons
// =============================================================

const AdvancedFilter = lk([
  <path key="0" d="M4 5h16M7 12h10M10 19h4"/>,
  <circle key="1" cx="9" cy="5" r="1.5" fill="currentColor"/>,
  <circle key="2" cx="15" cy="12" r="1.5" fill="currentColor"/>,
  <circle key="3" cx="12" cy="19" r="1.5" fill="currentColor"/>
], { keywords: ["advancedfilter","sliders"] });

const AIFilter = lk([
  <path key="0" d="M4 6h16l-6 8v5l-4 1v-6z"/>,
  <path key="1" d="m18 4 .8 1.5L20.5 6.3 18.8 7.2 18 9l-.8-1.8L15.5 6.3 17.2 5.5z" fill="currentColor" stroke="none"/>
], { keywords: ["aifilter","smart","ai"] });

const Agent = lk([
  <circle key="0" cx="12" cy="9" r="3.5"/>,
  <path key="1" d="M5 20a7 7 0 0 1 14 0"/>,
  <path key="2" d="m19 5 .5 1L20.5 6.5 19.5 7 19 8l-.5-1L17.5 6.5 18.5 6z" fill="currentColor" stroke="none"/>
], { keywords: ["agent","ai","assistant"] });

const Subscriber = lk([
  <path key="0" d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>,
  <path key="1" d="M10 21a2 2 0 0 0 4 0"/>
], { keywords: ["subscriber","follow","notify"] });

const ExternalSource = lk([
  <circle key="0" cx="12" cy="12" r="9"/>,
  <path key="1" d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>
], { keywords: ["external","source","web"] });

const AutoClosed = lkFill(function(c) {
  return [
    <circle key="0" cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" fill="none"/>,
    <path key="1" d="m9.5 9.5 5 5M14.5 9.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>,
    <path key="2" d="m18 4 .5 1L19.5 5.5 18.5 6 18 7l-.5-1L16.5 5.5 17.5 5z" fill={c || "currentColor"} stroke="none"/>
  ];
}, { keywords: ["autoclosed","auto","closed"] });

const Content = lk([
  <rect key="0" x="4" y="4" width="16" height="16" rx="2"/>,
  <path key="1" d="M9 8h6M8 12h8M8 16h6"/>
], { keywords: ["content","document"] });

const TemplateIcon = lk([
  <rect key="0" x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 2"/>,
  <path key="1" d="M8 9h8M8 13h6M8 17h4"/>
], { keywords: ["template","scaffold"] });

const Snooze = lk([
  <path key="0" d="M21 15.5A9 9 0 1 1 8.5 3"/>,
  <path key="1" d="M14 4h6l-6 6h6"/>
], { keywords: ["snooze","later","postpone"] });

const Linked = lk([
  <path key="0" d="M14 14H4a3 3 0 0 1 0-6h4M10 10h10a3 3 0 0 1 0 6h-4"/>
], { keywords: ["linked","link","attach"] });

// =============================================================
// REGISTRY — append to ICONS array
// =============================================================

var LINEAR_ICONS = [
  // Status
  { name: "status-backlog", c: StatusBacklog, cat: "Status", tone: "backlog" },
  { name: "status-backlog-filled", c: StatusBacklogFilled, cat: "Status", tone: "backlog" },
  { name: "status-todo", c: StatusTodo, cat: "Status", tone: "todo" },
  { name: "status-todo-filled", c: StatusTodoFilled, cat: "Status", tone: "todo" },
  { name: "status-in-progress", c: StatusInProgress, cat: "Status", tone: "progress" },
  { name: "status-in-progress-filled", c: StatusInProgressFilled, cat: "Status", tone: "progress" },
  { name: "status-in-review", c: StatusInReview, cat: "Status", tone: "review" },
  { name: "status-in-review-filled", c: StatusInReviewFilled, cat: "Status", tone: "review" },
  { name: "status-done", c: StatusDone, cat: "Status", tone: "done" },
  { name: "status-done-filled", c: StatusDoneFilled, cat: "Status", tone: "done" },
  { name: "status-canceled", c: StatusCanceled, cat: "Status", tone: "canceled" },
  { name: "status-canceled-filled", c: StatusCanceledFilled, cat: "Status", tone: "canceled" },
  { name: "status-duplicate", c: StatusDuplicate, cat: "Status", tone: "duplicate" },
  { name: "status-duplicate-filled", c: StatusDuplicateFilled, cat: "Status", tone: "duplicate" },
  // Status type
  { name: "status-type-triage", c: StatusTypeTriage, cat: "Status type", tone: "triage" },
  { name: "status-type-backlog", c: StatusTypeBacklog, cat: "Status type", tone: "backlog" },
  { name: "status-type-unstarted", c: StatusTypeUnstarted, cat: "Status type", tone: "todo" },
  { name: "status-type-started", c: StatusTypeStarted, cat: "Status type", tone: "progress" },
  { name: "status-type-completed", c: StatusTypeCompleted, cat: "Status type", tone: "done" },
  { name: "status-type-canceled", c: StatusTypeCanceled, cat: "Status type", tone: "canceled" },
  // Priority
  { name: "priority-none", c: PriorityNone, cat: "Priority", tone: "priority-none" },
  { name: "priority-urgent", c: PriorityUrgent, cat: "Priority", tone: "priority-urgent" },
  { name: "priority-high", c: PriorityHigh, cat: "Priority", tone: "priority-high" },
  { name: "priority-medium", c: PriorityMedium, cat: "Priority", tone: "priority-medium" },
  { name: "priority-low", c: PriorityLow, cat: "Priority", tone: "priority-low" },
  // Relations
  { name: "relation-blocks", c: RelationBlocks, cat: "Relations", tone: "blocks" },
  { name: "relation-blocked-by", c: RelationBlockedBy, cat: "Relations", tone: "blocks" },
  { name: "relation-duplicate", c: RelationDuplicate, cat: "Relations" },
  { name: "relation-duplicate-of", c: RelationDuplicateOf, cat: "Relations" },
  { name: "relation-related", c: RelationRelated, cat: "Relations", tone: "related" },
  { name: "relation-sub-issue", c: RelationSubIssue, cat: "Relations" },
  { name: "relation-parent-issue", c: RelationParentIssue, cat: "Relations" },
  // Dates
  { name: "date-due", c: DateDue, cat: "Dates", tone: "due" },
  { name: "date-created", c: DateCreated, cat: "Dates" },
  { name: "date-updated", c: DateUpdated, cat: "Dates" },
  { name: "date-started", c: DateStarted, cat: "Dates" },
  { name: "date-completed", c: DateCompleted, cat: "Dates" },
  { name: "date-triaged", c: DateTriaged, cat: "Dates" },
  { name: "time-in-status", c: TimeInStatus, cat: "Dates" },
  // Views
  { name: "view-list", c: ViewList, cat: "Views" },
  { name: "view-board", c: ViewBoard, cat: "Views" },
  { name: "view-timeline", c: ViewTimeline, cat: "Views" },
  { name: "view-calendar", c: ViewCalendar, cat: "Views" },
  { name: "view-roadmap", c: ViewRoadmap, cat: "Views" },
  { name: "view-gantt", c: ViewGantt, cat: "Views" },
  // Calendar
  { name: "cal-day", c: CalDay, cat: "Calendar" },
  { name: "cal-week", c: CalWeek, cat: "Calendar" },
  { name: "cal-month", c: CalMonth, cat: "Calendar" },
  { name: "cal-year", c: CalYear, cat: "Calendar" },
  { name: "cal-reminder", c: CalReminder, cat: "Calendar" },
  { name: "cal-recurring", c: CalRecurring, cat: "Calendar" },
  // Project
  { name: "milestone", c: Milestone, cat: "Project" },
  { name: "sprint", c: Sprint, cat: "Project" },
  { name: "cycle", c: Cycle, cat: "Project", tone: "cycle" },
  { name: "initiative", c: Initiative, cat: "Project" },
  { name: "project", c: Project, cat: "Project" },
  { name: "project-properties", c: ProjectProperties, cat: "Project" },
  // Labels
  { name: "label", c: Label, cat: "Labels" },
  { name: "label-group", c: LabelGroup, cat: "Labels" },
  { name: "suggested-label", c: SuggestedLabel, cat: "Labels" },
  // Workflow
  { name: "advanced-filter", c: AdvancedFilter, cat: "Workflow" },
  { name: "ai-filter", c: AIFilter, cat: "Workflow" },
  { name: "agent", c: Agent, cat: "Workflow" },
  { name: "subscriber", c: Subscriber, cat: "Workflow" },
  { name: "external-source", c: ExternalSource, cat: "Workflow" },
  { name: "auto-closed", c: AutoClosed, cat: "Workflow" },
  { name: "content", c: Content, cat: "Workflow" },
  { name: "template", c: TemplateIcon, cat: "Workflow" },
  { name: "snooze", c: Snooze, cat: "Workflow" },
  { name: "linked", c: Linked, cat: "Workflow" }
];

// Expose components to window so app.jsx can access them by string name
LINEAR_ICONS.forEach(function(entry) {
  // Convert kebab-case name to PascalCase: "status-backlog" -> "StatusBacklog"
  var key = entry.name.split("-").map(function(p){ return p[0].toUpperCase() + p.slice(1); }).join("");
  // But we have hand-named components, so also map specific names
});

// Direct mapping (component name -> component)
Object.assign(window, {
  StatusBacklog: StatusBacklog, StatusBacklogFilled: StatusBacklogFilled,
  StatusTodo: StatusTodo, StatusTodoFilled: StatusTodoFilled,
  StatusInProgress: StatusInProgress, StatusInProgressFilled: StatusInProgressFilled,
  StatusInReview: StatusInReview, StatusInReviewFilled: StatusInReviewFilled,
  StatusDone: StatusDone, StatusDoneFilled: StatusDoneFilled,
  StatusCanceled: StatusCanceled, StatusCanceledFilled: StatusCanceledFilled,
  StatusDuplicate: StatusDuplicate, StatusDuplicateFilled: StatusDuplicateFilled,
  StatusTypeTriage: StatusTypeTriage, StatusTypeBacklog: StatusTypeBacklog,
  StatusTypeUnstarted: StatusTypeUnstarted, StatusTypeStarted: StatusTypeStarted,
  StatusTypeCompleted: StatusTypeCompleted, StatusTypeCanceled: StatusTypeCanceled,
  PriorityNone: PriorityNone, PriorityUrgent: PriorityUrgent,
  PriorityHigh: PriorityHigh, PriorityMedium: PriorityMedium, PriorityLow: PriorityLow,
  RelationBlocks: RelationBlocks, RelationBlockedBy: RelationBlockedBy,
  RelationDuplicate: RelationDuplicate, RelationDuplicateOf: RelationDuplicateOf,
  RelationRelated: RelationRelated, RelationSubIssue: RelationSubIssue,
  RelationParentIssue: RelationParentIssue,
  DateDue: DateDue, DateCreated: DateCreated, DateUpdated: DateUpdated,
  DateStarted: DateStarted, DateCompleted: DateCompleted, DateTriaged: DateTriaged,
  TimeInStatus: TimeInStatus,
  ViewList: ViewList, ViewBoard: ViewBoard, ViewTimeline: ViewTimeline,
  ViewCalendar: ViewCalendar, ViewRoadmap: ViewRoadmap, ViewGantt: ViewGantt,
  CalDay: CalDay, CalWeek: CalWeek, CalMonth: CalMonth, CalYear: CalYear,
  CalReminder: CalReminder, CalRecurring: CalRecurring,
  Milestone: Milestone, Sprint: Sprint, Cycle: Cycle, Initiative: Initiative,
  Project: Project, ProjectProperties: ProjectProperties,
  Label: Label, LabelGroup: LabelGroup, SuggestedLabel: SuggestedLabel,
  AdvancedFilter: AdvancedFilter, AIFilter: AIFilter, Agent: Agent,
  Subscriber: Subscriber, ExternalSource: ExternalSource, AutoClosed: AutoClosed,
  Content: Content, TemplateIcon: TemplateIcon, Snooze: Snooze, Linked: Linked,
  LINEAR_ICONS: LINEAR_ICONS
});
