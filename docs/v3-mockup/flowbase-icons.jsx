// =============================================================
// FlowBase — realtime database app domain icons (~40)
// 24 viewBox · 1.5px stroke · currentColor
// =============================================================

function fk(paths, opts) {
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

// ---------- Tables ----------
const FbTable = fk([
  <rect key="a" x="3" y="5" width="18" height="14" rx="1.5"/>,
  <path key="b" d="M3 9h18M3 14h18M9 5v14M15 5v14"/>,
], { keywords: ["table", "grid"] });

const FbTableNew = fk([
  <path key="a" d="M3 5h18v9"/>,
  <path key="b" d="M3 5v14h11"/>,
  <path key="c" d="M3 9h18M9 5v14"/>,
  <path key="d" d="M18 17h6M21 14v6"/>,
], { keywords: ["table", "new", "create"] });

const FbSchema = fk([
  <rect key="a" x="3" y="3" width="8" height="6" rx="1"/>,
  <rect key="b" x="13" y="3" width="8" height="6" rx="1"/>,
  <rect key="c" x="3" y="15" width="8" height="6" rx="1"/>,
  <rect key="d" x="13" y="15" width="8" height="6" rx="1"/>,
  <path key="e" d="M11 6h2M11 18h2M7 9v6M17 9v6"/>,
], { keywords: ["schema", "diagram", "erd"] });

const FbColumn = fk([
  <rect key="a" x="9" y="3" width="6" height="18" rx="1"/>,
  <path key="b" d="M9 9h6M9 15h6"/>,
  <path key="c" d="M3 5v14M21 5v14" strokeOpacity=".4"/>,
], { keywords: ["column", "field"] });

const FbRow = fk([
  <rect key="a" x="3" y="9" width="18" height="6" rx="1"/>,
  <path key="b" d="M9 9v6M15 9v6"/>,
  <path key="c" d="M5 3h14M5 21h14" strokeOpacity=".4"/>,
], { keywords: ["row", "record"] });

const FbCell = fk([
  <rect key="a" x="9" y="9" width="6" height="6" rx="1" fill="currentColor" fillOpacity=".15"/>,
  <rect key="b" x="3" y="5" width="18" height="14" rx="1"/>,
  <path key="c" d="M3 9h18M3 15h18M9 5v14M15 5v14" strokeOpacity=".4"/>,
], { keywords: ["cell", "value"] });

const FbPrimaryKey = fk([
  <circle key="a" cx="8" cy="12" r="3"/>,
  <path key="b" d="M11 12h7M16 12v3M19 12v2"/>,
  <circle key="c" cx="8" cy="12" r="1" fill="currentColor"/>,
], { keywords: ["primary", "key", "pk"] });

const FbForeignKey = fk([
  <circle key="a" cx="8" cy="12" r="3"/>,
  <circle key="b" cx="16" cy="12" r="3"/>,
  <path key="c" d="M11 12h2"/>,
], { keywords: ["foreign", "key", "fk", "relation"] });

const FbIndex = fk([
  <rect key="a" x="3" y="5" width="18" height="14" rx="1.5"/>,
  <path key="b" d="M3 10h18"/>,
  <path key="c" d="M6 13v3M6 13l-1 1M6 13l1 1"/>,
  <path key="d" d="M11 13h7M11 16h5"/>,
], { keywords: ["index", "btree"] });

const FbUnique = fk([
  <circle key="a" cx="12" cy="12" r="9"/>,
  <path key="b" d="M9 9.5a3 3 0 0 1 6 0c0 1.5-1.5 2.5-3 2.5v2"/>,
  <circle key="c" cx="12" cy="17" r=".8" fill="currentColor"/>,
], { keywords: ["unique", "constraint"] });

// ---------- Queries ----------
const FbQuery = fk([
  <circle key="a" cx="11" cy="11" r="6"/>,
  <path key="b" d="m16 16 5 5"/>,
  <path key="c" d="M9 11h4M11 9v4"/>,
], { keywords: ["query", "search"] });

const FbSql = fk([
  <ellipse key="a" cx="12" cy="6" rx="8" ry="2.5"/>,
  <path key="b" d="M4 6v12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V6"/>,
  <path key="c" d="M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"/>,
], { keywords: ["sql", "query"] });

const FbView = fk([
  <ellipse key="a" cx="12" cy="6" rx="8" ry="2.5"/>,
  <path key="b" d="M4 6v12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V6"/>,
  <circle key="c" cx="12" cy="14" r="2.5"/>,
  <circle key="d" cx="12" cy="14" r=".8" fill="currentColor"/>,
], { keywords: ["view", "lens"] });

const FbMaterializedView = fk([
  <ellipse key="a" cx="12" cy="6" rx="8" ry="2.5"/>,
  <path key="b" d="M4 6v12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V6"/>,
  <path key="c" d="M8 13h8M8 16h6" strokeWidth="1.5"/>,
  <circle key="d" cx="18" cy="18" r="1.5" fill="currentColor"/>,
], { keywords: ["materialized", "view", "cached"] });

// ---------- Realtime ----------
const FbRealtime = fk([
  <circle key="a" cx="12" cy="12" r="2.5" fill="currentColor"/>,
  <path key="b" d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7"/>,
  <path key="c" d="M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13"/>,
], { keywords: ["realtime", "live", "stream"] });

const FbSync = fk([
  <path key="a" d="M5 9a7 7 0 0 1 12-3"/>,
  <path key="b" d="M19 15a7 7 0 0 1-12 3"/>,
  <path key="c" d="M14 6h3V3M10 18H7v3"/>,
], { keywords: ["sync", "refresh"] });

const FbReplicate = fk([
  <ellipse key="a" cx="7" cy="7" rx="4" ry="1.5"/>,
  <path key="b" d="M3 7v8c0 .8 1.8 1.5 4 1.5s4-.7 4-1.5V7"/>,
  <ellipse key="c" cx="17" cy="17" rx="4" ry="1.5"/>,
  <path key="d" d="M13 17v-8c0-.8 1.8-1.5 4-1.5s4 .7 4 1.5v8"/>,
  <path key="e" d="m9 11 6 2" strokeDasharray="2 2"/>,
], { keywords: ["replicate", "copy"] });

const FbStream = fk([
  <path key="a" d="M3 7c5 0 5 4 10 4s5-4 8-4"/>,
  <path key="b" d="M3 12c5 0 5 4 10 4s5-4 8-4"/>,
  <path key="c" d="M3 17c5 0 5 4 10 4"/>,
], { keywords: ["stream", "flow"] });

const FbWebhook = fk([
  <circle key="a" cx="6" cy="17" r="2.5"/>,
  <circle key="b" cx="18" cy="17" r="2.5"/>,
  <circle key="c" cx="12" cy="6" r="2.5"/>,
  <path key="d" d="m11 8-3 6M13 8l3 6M9 17h6"/>,
], { keywords: ["webhook", "trigger"] });

const FbEdgeFunction = fk([
  <circle key="a" cx="12" cy="12" r="9"/>,
  <path key="b" d="M12 3a9 9 0 0 0 0 18M3 12h18M7 5a9 9 0 0 1 0 14"/>,
  <path key="c" d="m9 11 2 2 4-4" stroke="currentColor" strokeWidth="2"/>,
], { keywords: ["edge", "function", "serverless"] });

const FbFunction = fk([
  <path key="a" d="M14 4c-3 0-3 4-3 8s0 8-3 8"/>,
  <path key="b" d="M8 12h8"/>,
], { keywords: ["function", "fn"] });

const FbTrigger = fk([
  <path key="a" d="M13 3 5 14h6l-2 7 8-11h-6z" fill="currentColor" fillOpacity=".15"/>,
  <path key="b" d="M13 3 5 14h6l-2 7 8-11h-6z"/>,
], { keywords: ["trigger", "event"] });

// ---------- Auth & Security ----------
const FbAuthUser = fk([
  <circle key="a" cx="12" cy="9" r="3.5"/>,
  <path key="b" d="M5 20c1-4 4-6 7-6s6 2 7 6"/>,
  <path key="c" d="m17 4 1.5 1.5L21 3"/>,
], { keywords: ["auth", "user", "verified"] });

const FbRole = fk([
  <path key="a" d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>,
  <path key="b" d="M9 12h6M12 9v6"/>,
], { keywords: ["role", "permission"] });

const FbPolicy = fk([
  <path key="a" d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>,
  <path key="b" d="m9 12 2 2 4-4"/>,
], { keywords: ["policy", "rule"] });

const FbRls = fk([
  <rect key="a" x="3" y="5" width="18" height="14" rx="1.5"/>,
  <path key="b" d="M3 10h18M3 14h18"/>,
  <rect key="c" x="14" y="11" width="6" height="6" rx="1"/>,
  <path key="d" d="M16 11V9.5a1.5 1.5 0 0 1 3 0V11"/>,
], { keywords: ["rls", "row-level", "security"] });

const FbJwt = fk([
  <path key="a" d="M5 12h14"/>,
  <path key="b" d="M9 7v10M15 7v10M5 8v8M19 8v8"/>,
  <circle key="c" cx="5" cy="12" r="1" fill="currentColor"/>,
  <circle key="d" cx="19" cy="12" r="1" fill="currentColor"/>,
], { keywords: ["jwt", "token"] });

// ---------- Storage ----------
const FbBucket = fk([
  <path key="a" d="m4 7 1.5 13a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1L20 7"/>,
  <path key="b" d="M3 7h18"/>,
  <path key="c" d="M9 4h6l1 3H8z"/>,
], { keywords: ["bucket", "storage"] });

const FbStorage = fk([
  <ellipse key="a" cx="12" cy="6" rx="8" ry="2.5"/>,
  <path key="b" d="M4 6v5c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V6"/>,
  <path key="c" d="M4 11v5c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-5"/>,
  <path key="d" d="M4 16v2c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-2"/>,
], { keywords: ["storage", "disk"] });

const FbBackup = fk([
  <ellipse key="a" cx="12" cy="6" rx="8" ry="2.5"/>,
  <path key="b" d="M4 6v12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V6"/>,
  <path key="c" d="m9 14 3 3 3-3M12 11v6"/>,
], { keywords: ["backup", "save"] });

const FbRestore = fk([
  <ellipse key="a" cx="12" cy="6" rx="8" ry="2.5"/>,
  <path key="b" d="M4 6v12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V6"/>,
  <path key="c" d="m9 14 3-3 3 3M12 17v-6"/>,
], { keywords: ["restore", "recover"] });

const FbSnapshot = fk([
  <ellipse key="a" cx="12" cy="6" rx="8" ry="2.5"/>,
  <path key="b" d="M4 6v12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V6"/>,
  <circle key="c" cx="12" cy="14" r="3"/>,
  <path key="d" d="M9 12h6"/>,
], { keywords: ["snapshot", "point-in-time"] });

// ---------- Operations ----------
const FbMigration = fk([
  <ellipse key="a" cx="6" cy="7" rx="3.5" ry="1.5"/>,
  <path key="b" d="M2.5 7v8c0 .8 1.5 1.5 3.5 1.5s3.5-.7 3.5-1.5V7"/>,
  <ellipse key="c" cx="18" cy="17" rx="3.5" ry="1.5"/>,
  <path key="d" d="M14.5 17V9c0-.8 1.5-1.5 3.5-1.5s3.5.7 3.5 1.5v8"/>,
  <path key="e" d="m10 10 4 4M11 14l-1 1V13z" fill="currentColor"/>,
], { keywords: ["migration", "move"] });

const FbRollback = fk([
  <path key="a" d="M5 12a7 7 0 1 1 14 0 7 7 0 0 1-12.6 4.2"/>,
  <path key="b" d="M5 8v4h4"/>,
], { keywords: ["rollback", "undo"] });

const FbCluster = fk([
  <ellipse key="a" cx="6" cy="6" rx="3" ry="1.2"/>,
  <path key="b" d="M3 6v3c0 .7 1.3 1.2 3 1.2s3-.5 3-1.2V6"/>,
  <ellipse key="c" cx="18" cy="6" rx="3" ry="1.2"/>,
  <path key="d" d="M15 6v3c0 .7 1.3 1.2 3 1.2s3-.5 3-1.2V6"/>,
  <ellipse key="e" cx="12" cy="17" rx="3" ry="1.2"/>,
  <path key="f" d="M9 17v3c0 .7 1.3 1.2 3 1.2s3-.5 3-1.2v-3"/>,
  <path key="g" d="M7 11 11 16M17 11 13 16"/>,
], { keywords: ["cluster", "nodes"] });

const FbShard = fk([
  <ellipse key="a" cx="12" cy="6" rx="8" ry="2.5"/>,
  <path key="b" d="M4 6v12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V6"/>,
  <path key="c" d="M9 6v14M15 6v14"/>,
], { keywords: ["shard", "partition"] });

const FbPartition = fk([
  <rect key="a" x="3" y="5" width="18" height="14" rx="1.5"/>,
  <path key="b" d="M9 5v14M15 5v14"/>,
  <path key="c" d="M3 12h6M15 12h6"/>,
], { keywords: ["partition", "split"] });

const FbVacuum = fk([
  <ellipse key="a" cx="12" cy="6" rx="8" ry="2.5"/>,
  <path key="b" d="M4 6v12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V6"/>,
  <path key="c" d="m9 13 3 3 6-6"/>,
], { keywords: ["vacuum", "cleanup"] });

const FbConnection = fk([
  <circle key="a" cx="6" cy="12" r="3"/>,
  <circle key="b" cx="18" cy="12" r="3"/>,
  <path key="c" d="M9 12h6"/>,
  <circle key="d" cx="6" cy="12" r="1" fill="currentColor"/>,
  <circle key="e" cx="18" cy="12" r="1" fill="currentColor"/>,
], { keywords: ["connection", "pool"] });

const FbLatency = fk([
  <path key="a" d="M3 18h18"/>,
  <path key="b" d="m6 18 3-7 3 4 3-9 3 12"/>,
  <circle key="c" cx="6" cy="18" r="1" fill="currentColor"/>,
  <circle key="d" cx="18" cy="18" r="1" fill="currentColor"/>,
], { keywords: ["latency", "ping"] });

const FbLog = fk([
  <rect key="a" x="3" y="4" width="18" height="16" rx="1.5"/>,
  <path key="b" d="M7 8h2M11 8h6M7 12h2M11 12h7M7 16h2M11 16h5"/>,
], { keywords: ["log", "audit"] });

const FbMonitoring = fk([
  <rect key="a" x="3" y="5" width="18" height="14" rx="1.5"/>,
  <path key="b" d="m6 14 3-4 3 2 3-5 3 4"/>,
  <circle key="c" cx="9" cy="10" r=".8" fill="currentColor"/>,
  <circle key="d" cx="15" cy="9" r=".8" fill="currentColor"/>,
], { keywords: ["monitor", "metrics"] });

// ---------- Registry ----------
const FLOWBASE_ICONS = [
  { name: "fb-table", c: FbTable, cat: "FlowBase" },
  { name: "fb-table-new", c: FbTableNew, cat: "FlowBase" },
  { name: "fb-schema", c: FbSchema, cat: "FlowBase" },
  { name: "fb-column", c: FbColumn, cat: "FlowBase" },
  { name: "fb-row", c: FbRow, cat: "FlowBase" },
  { name: "fb-cell", c: FbCell, cat: "FlowBase" },
  { name: "fb-primary-key", c: FbPrimaryKey, cat: "FlowBase" },
  { name: "fb-foreign-key", c: FbForeignKey, cat: "FlowBase" },
  { name: "fb-index", c: FbIndex, cat: "FlowBase" },
  { name: "fb-unique", c: FbUnique, cat: "FlowBase" },
  { name: "fb-query", c: FbQuery, cat: "FlowBase" },
  { name: "fb-sql", c: FbSql, cat: "FlowBase" },
  { name: "fb-view", c: FbView, cat: "FlowBase" },
  { name: "fb-mat-view", c: FbMaterializedView, cat: "FlowBase" },
  { name: "fb-realtime", c: FbRealtime, cat: "FlowBase" },
  { name: "fb-sync", c: FbSync, cat: "FlowBase" },
  { name: "fb-replicate", c: FbReplicate, cat: "FlowBase" },
  { name: "fb-stream", c: FbStream, cat: "FlowBase" },
  { name: "fb-webhook", c: FbWebhook, cat: "FlowBase" },
  { name: "fb-edge-function", c: FbEdgeFunction, cat: "FlowBase" },
  { name: "fb-function", c: FbFunction, cat: "FlowBase" },
  { name: "fb-trigger", c: FbTrigger, cat: "FlowBase" },
  { name: "fb-auth-user", c: FbAuthUser, cat: "FlowBase" },
  { name: "fb-role", c: FbRole, cat: "FlowBase" },
  { name: "fb-policy", c: FbPolicy, cat: "FlowBase" },
  { name: "fb-rls", c: FbRls, cat: "FlowBase" },
  { name: "fb-jwt", c: FbJwt, cat: "FlowBase" },
  { name: "fb-bucket", c: FbBucket, cat: "FlowBase" },
  { name: "fb-storage", c: FbStorage, cat: "FlowBase" },
  { name: "fb-backup", c: FbBackup, cat: "FlowBase" },
  { name: "fb-restore", c: FbRestore, cat: "FlowBase" },
  { name: "fb-snapshot", c: FbSnapshot, cat: "FlowBase" },
  { name: "fb-migration", c: FbMigration, cat: "FlowBase" },
  { name: "fb-rollback", c: FbRollback, cat: "FlowBase" },
  { name: "fb-cluster", c: FbCluster, cat: "FlowBase" },
  { name: "fb-shard", c: FbShard, cat: "FlowBase" },
  { name: "fb-partition", c: FbPartition, cat: "FlowBase" },
  { name: "fb-vacuum", c: FbVacuum, cat: "FlowBase" },
  { name: "fb-connection", c: FbConnection, cat: "FlowBase" },
  { name: "fb-latency", c: FbLatency, cat: "FlowBase" },
  { name: "fb-log", c: FbLog, cat: "FlowBase" },
  { name: "fb-monitoring", c: FbMonitoring, cat: "FlowBase" },
];
