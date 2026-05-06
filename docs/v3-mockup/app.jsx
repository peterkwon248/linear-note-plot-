/* @jsx React.createElement */
const { useState, useEffect, useMemo, useRef } = React;

const CATEGORIES = [
  "All",
  // Project domains
  "Plot", "Keystone", "FlowBase",
  // Linear-style semantic
  "Status", "Status type", "Priority", "Relations", "Dates", "Views",
  "Calendar", "Project", "Labels", "Workflow",
  // Generic UI
  "Navigation", "Arrows", "Actions", "Communication",
  "Files", "Media", "Time", "User", "Data", "Settings", "Search",
  "Format", "Devices", "Finance", "Misc",
];

const PROJECT_CATS = ["Plot", "Keystone", "FlowBase"];
const SEMANTIC_CATS = ["Status", "Status type", "Priority", "Relations", "Dates", "Views", "Calendar", "Project", "Labels", "Workflow"];
const GENERIC_CATS = ["Navigation", "Arrows", "Actions", "Communication", "Files", "Media", "Time", "User", "Data", "Settings", "Search", "Format", "Devices", "Finance", "Misc"];

const PROJECT_CHIP = { Plot: "imp-cat-chip-plot", Keystone: "imp-cat-chip-keystone", FlowBase: "imp-cat-chip-flowbase" };

function Toast(props) {
  return (
    <div className={"imp-toast " + (props.show ? "is-visible" : "")}>
      <ImperialMark size={14} />
      <span>{props.message}</span>
    </div>
  );
}

function CodeBlock(props) {
  return (
    <div className="imp-code">
      <div className="imp-code-head">
        <span className="text-label">{props.label}</span>
        <button className="imp-code-copy" onClick={function() {
          navigator.clipboard.writeText(props.code);
          if (props.onCopy) props.onCopy();
        }}>
          <Copy size={12} /> Copy
        </button>
      </div>
      <pre className={"imp-code-body " + (props.multiline ? "is-multiline" : "")}><code>{props.code}</code></pre>
    </div>
  );
}

function getSvgString(IconComp, opts) {
  opts = opts || {};
  return new Promise(function(resolve) {
    const div = document.createElement("div");
    div.style.cssText = "position:absolute;left:-9999px;";
    if (opts.color) div.style.color = opts.color;
    document.body.appendChild(div);
    const root = ReactDOM.createRoot(div);
    root.render(React.createElement(IconComp, { size: 24, strokeWidth: opts.strokeWidth }));
    setTimeout(function() {
      const svg = div.querySelector("svg");
      let result = "";
      if (svg) {
        // Inline computed color so the SVG carries it standalone
        if (opts.color) {
          svg.setAttribute("stroke", opts.color);
          // also update any child fills that are currentColor
          svg.querySelectorAll('[fill="currentColor"]').forEach(function(el) {
            el.setAttribute("fill", opts.color);
          });
        }
        result = svg.outerHTML;
      }
      root.unmount();
      div.remove();
      resolve(result);
    }, 10);
  });
}

function DetailPanel(props) {
  const icon = props.icon;
  const Comp = icon.c;
  const tone = icon.tone;
  const [customColor, setCustomColor] = useState(null);
  const [customAlpha, setCustomAlpha] = useState(1);
  const [showPicker, setShowPicker] = useState(false);
  const [svgStr, setSvgStr] = useState("");

  // Reset custom color when switching icons
  useEffect(function() {
    setCustomColor(null);
    setCustomAlpha(1);
    setShowPicker(false);
  }, [icon.name]);

  const effectiveColor = customColor
    ? (customAlpha < 1 ? "rgba(" + hexToRgb(customColor).join(",") + "," + customAlpha + ")" : customColor)
    : null;
  const toneStyle = effectiveColor
    ? { color: effectiveColor }
    : (tone ? { color: "var(--icon-" + tone + ")" } : null);

  useEffect(function() {
    getSvgString(Comp, { color: effectiveColor, strokeWidth: props.stroke }).then(function(s) {
      const cleaned = s
        .replace(/\swidth="\d+"/, "")
        .replace(/\sheight="\d+"/, "")
        .replace(/\sxmlns="[^"]+"/, "");
      setSvgStr(cleaned);
    });
  }, [icon, effectiveColor, props.stroke]);

  const pascalName = icon.name.split("-").map(function(p) {
    return p[0].toUpperCase() + p.slice(1);
  }).join("");

  return (
    <aside className="imp-detail">
      <div className="imp-detail-head">
        <button className="imp-icon-btn" onClick={props.onClose} aria-label="Close">
          <Close size={16} />
        </button>
        <span className="imp-detail-name">{icon.name}</span>
        <span className="imp-detail-cat">{icon.cat}</span>
      </div>

      <div className="imp-detail-preview">
        <div className="imp-preview-large" style={toneStyle}>
          <Comp size={props.size} strokeWidth={props.stroke} />
        </div>
        <div className="imp-preview-grid">
          {[12, 14, 16, 18, 20, 24, 32, 48].map(function(s) {
            return (
              <div key={s} className="imp-preview-cell" style={toneStyle}>
                <Comp size={s} strokeWidth={props.stroke} />
                <span>{s}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="imp-detail-controls">
        <div className="imp-control-row">
          <label className="text-label">Size</label>
          <input type="range" min="12" max="96" step="1" value={props.size}
            onChange={function(e) { props.setSize(+e.target.value); }} />
          <span className="imp-control-value">{props.size}px</span>
        </div>
        <div className="imp-control-row">
          <label className="text-label">Stroke</label>
          <input type="range" min="1" max="2.5" step="0.25" value={props.stroke}
            onChange={function(e) { props.setStroke(+e.target.value); }} />
          <span className="imp-control-value">{props.stroke}</span>
        </div>
      </div>

      <div className="imp-detail-color">
        <div className="imp-detail-color-head">
          <span className="text-label">Color</span>
          <button className="imp-detail-color-toggle" onClick={function() { setShowPicker(!showPicker); }}>
            <span className="imp-detail-color-swatch" style={{ background: effectiveColor || (tone ? "var(--icon-" + tone + ")" : "currentColor") }}></span>
            {customColor ? customColor.toUpperCase() : (tone ? "tone:" + tone : "default")}
          </button>
        </div>
        <p className="imp-detail-color-hint text-note">
          {customColor
            ? "Color is baked into the SVG and JSX below — copy or download to use it."
            : (tone
              ? "Uses semantic token (light/dark aware). Pick a custom color to override."
              : "Inherits from CSS color via currentColor. Pick a color to bake into the export.")}
        </p>
        {customColor ? (
          <button className="imp-btn" onClick={function() { setCustomColor(null); setCustomAlpha(1); }} style={{ alignSelf: "flex-start", fontSize: 11, padding: "4px 8px" }}>
            <Close size={11} />Reset to default
          </button>
        ) : null}
        {showPicker ? (
          <div className="imp-detail-color-popover">
            <ColorPicker value={customColor || "#3b82f6"} onChange={function(hex, alpha) { setCustomColor(hex); setCustomAlpha(alpha); }} />
          </div>
        ) : null}
      </div>

      <div className="imp-detail-codes">
        <CodeBlock
          label="React (JSX)"
          code={(function(){
            var attrs = ["size={" + props.size + "}"];
            if (props.stroke !== 1.5) attrs.push("strokeWidth={" + props.stroke + "}");
            if (effectiveColor) attrs.push('color="' + effectiveColor + '"');
            else if (tone) attrs.push('tone="' + tone + '"');
            return "<Imperial." + pascalName + " " + attrs.join(" ") + " />";
          })()}
          onCopy={function() { props.onCopy("JSX"); }}
        />
        <CodeBlock label="SVG" code={svgStr} onCopy={function() { props.onCopy("SVG"); }} multiline />
      </div>

      <div className="imp-detail-actions">
        <button className="imp-btn imp-btn-primary" onClick={function() { props.onDownload(icon, svgStr); }}>
          <Download size={14} />
          Download SVG
        </button>
        <button className="imp-btn" onClick={function() {
          navigator.clipboard.writeText(svgStr);
          props.onCopy("SVG");
        }}>
          <Copy size={14} />
          Copy SVG
        </button>
      </div>
    </aside>
  );
}

function IconCard(props) {
  const Comp = props.icon.c;
  const tone = props.icon.tone;
  return (
    <button
      className={"imp-card " + (props.selected ? "is-selected" : "") + (tone ? " imp-card-toned" : "")}
      onClick={function() { props.onClick(props.icon); }}
      title={props.icon.name}
    >
      <div className="imp-card-icon" style={tone ? { color: "var(--icon-" + tone + ")" } : null}>
        <Comp size={props.size} strokeWidth={props.stroke} />
      </div>
      <span className="imp-card-name">{props.icon.name}</span>
    </button>
  );
}

function NavRow(props) {
  return (
    <div className={"imp-nav-row " + (props.active ? "is-active" : "")}>
      <span className="imp-nav-icon">{props.icon}</span>
      <span className="imp-nav-label">{props.label}</span>
      {props.count ? <span className="imp-nav-count">{props.count}</span> : null}
    </div>
  );
}

function StatCard(props) {
  return (
    <div className="imp-stat">
      <div className="imp-stat-head">
        <span className="imp-stat-icon">{props.icon}</span>
        <span className="imp-stat-label">{props.label}</span>
      </div>
      <div className="imp-stat-value">{props.value}</div>
      <div className={"imp-stat-delta " + (props.up ? "is-up" : "is-down")}>
        {props.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {props.delta}
      </div>
    </div>
  );
}

function TaskRow(props) {
  const tone = props.tone || "default";
  return (
    <div className="imp-task">
      <span className={"imp-task-icon imp-tone-" + tone}>{props.icon}</span>
      <span className="imp-task-label">{props.label}</span>
      <span className={"imp-task-tag imp-tone-" + tone}>{props.tag}</span>
    </div>
  );
}

function FilterRow(props) {
  return (
    <div className={"imp-fr " + (props.active ? "is-active " : "") + (props.check ? "is-check " : "")}>
      {props.check ? <span className="imp-fr-check"></span> : null}
      <span className="imp-fr-icon">{props.icon}</span>
      <span className="imp-fr-label">{props.label}</span>
      {props.count ? <span className="imp-fr-count">{props.count}</span> : null}
      {props.arrow ? <span className="imp-fr-arrow">›</span> : null}
    </div>
  );
}

function StatusItem(props) {
  const Icon = props.Icon;
  return (
    <div className="imp-status-item">
      <span className="imp-status-icon" style={{ color: "var(--icon-" + props.tone + ")" }}>
        <Icon size={16} tone={props.tone} />
      </span>
      <span className="imp-status-label">{props.label}</span>
      <span className="imp-status-count">{props.count}</span>
    </div>
  );
}

const STATUS_MAP = {
  backlog: { Icon: () => <StatusBacklog tone="backlog" size={14} />, label: "Backlog" },
  todo: { Icon: () => <StatusTodo tone="todo" size={14} />, label: "Todo" },
  progress: { Icon: () => <StatusInProgress tone="progress" size={14} />, label: "In Progress" },
  review: { Icon: () => <StatusInReview tone="review" size={14} />, label: "In Review" },
  done: { Icon: () => <StatusDoneFilled tone="done" size={14} />, label: "Done" },
  canceled: { Icon: () => <StatusCanceledFilled tone="canceled" size={14} />, label: "Canceled" },
};

const PRIORITY_MAP = {
  urgent: () => <PriorityUrgent tone="priority-urgent" size={14} />,
  high: () => <PriorityHigh tone="priority-high" size={14} />,
  medium: () => <PriorityMedium tone="priority-medium" size={14} />,
  low: () => <PriorityLow tone="priority-low" size={14} />,
  none: () => <PriorityNone tone="priority-none" size={14} />,
};

function IssueRow(props) {
  const SIcon = STATUS_MAP[props.status].Icon;
  const PIcon = PRIORITY_MAP[props.priority];
  return (
    <div className="imp-issue-row">
      <span className="imp-issue-prio"><PIcon /></span>
      <span className="imp-issue-id">{props.id}</span>
      <span className="imp-issue-status"><SIcon /></span>
      <span className="imp-issue-title">{props.title}</span>
    </div>
  );
}

// ---- Interactive filter menu ----
const FILTER_SECTIONS = [
  [
    { key: "advanced", icon: "AdvancedFilter", label: "Advanced filter" },
    { key: "status", icon: "StatusBacklog", tone: "backlog", label: "Status" },
    { key: "statustype", icon: "StatusTypeStarted", tone: "progress", label: "Status type" },
    { key: "assignee", icon: "UserCircle", label: "Assignee" },
    { key: "agent", icon: "Agent", label: "Agent" },
    { key: "creator", icon: "User", label: "Creator" },
    { key: "priority", icon: "PriorityHigh", tone: "priority-high", label: "Priority" },
    { key: "labels", icon: "Label", label: "Labels" },
    { key: "relations", icon: "RelationBlocks", tone: "blocks", label: "Relations" },
    { key: "dates", icon: "DateDue", tone: "due", label: "Dates" },
  ],
  [
    { key: "project", icon: "Project", label: "Project" },
    { key: "projectprops", icon: "ProjectProperties", label: "Project properties" },
  ],
  [
    { key: "subscribers", icon: "Subscriber", label: "Subscribers" },
    { key: "external", icon: "ExternalSource", label: "External source" },
    { key: "autoclosed", icon: "AutoClosed", label: "Auto-closed" },
    { key: "content", icon: "Content", label: "Content" },
    { key: "links", icon: "Linked", label: "Links" },
    { key: "template", icon: "TemplateIcon", label: "Template" },
  ],
];

const SUBMENU_DATA = {
  status: [
    { icon: "StatusBacklog", tone: "backlog", label: "Backlog" },
    { icon: "StatusTodo", tone: "todo", label: "Todo", count: "5 issues" },
    { icon: "StatusInProgress", tone: "progress", label: "In Progress" },
    { icon: "StatusInReview", tone: "review", label: "In Review" },
    { icon: "StatusDoneFilled", tone: "done", label: "Done" },
    { icon: "StatusCanceledFilled", tone: "canceled", label: "Canceled" },
    { icon: "StatusDuplicateFilled", tone: "duplicate", label: "Duplicate" },
  ],
  priority: [
    { icon: "PriorityNone", tone: "priority-none", label: "No priority" },
    { icon: "PriorityUrgent", tone: "priority-urgent", label: "Urgent", count: "2" },
    { icon: "PriorityHigh", tone: "priority-high", label: "High", count: "11" },
    { icon: "PriorityMedium", tone: "priority-medium", label: "Medium", count: "24" },
    { icon: "PriorityLow", tone: "priority-low", label: "Low", count: "18" },
  ],
  statustype: [
    { icon: "StatusTypeTriage", label: "Triage" },
    { icon: "StatusTypeBacklog", label: "Backlog" },
    { icon: "StatusTypeUnstarted", label: "Unstarted" },
    { icon: "StatusTypeStarted", tone: "progress", label: "Started" },
    { icon: "StatusTypeCompleted", tone: "done", label: "Completed" },
    { icon: "StatusTypeCanceled", tone: "canceled", label: "Canceled" },
  ],
  dates: [
    { icon: "DateDue", tone: "due", label: "Due date" },
    { icon: "DateCreated", label: "Created" },
    { icon: "DateUpdated", label: "Updated" },
    { icon: "DateStarted", tone: "progress", label: "Started" },
    { icon: "DateCompleted", tone: "done", label: "Completed" },
  ],
  assignee: [
    { icon: "UserCircle", label: "Me" },
    { icon: "User", label: "Sarah Kim" },
    { icon: "User", label: "Alex Chen" },
    { icon: "User", label: "Riya Patel" },
  ],
  labels: [
    { icon: "Label", label: "Bug" },
    { icon: "Label", label: "Feature" },
    { icon: "Label", label: "Design" },
    { icon: "Label", label: "Docs" },
  ],
  relations: [
    { icon: "RelationBlocks", tone: "blocks", label: "Blocks" },
    { icon: "RelationBlockedBy", tone: "blocks", label: "Blocked by" },
    { icon: "RelationDuplicate", tone: "duplicate", label: "Duplicate" },
    { icon: "RelationRelated", label: "Related" },
    { icon: "RelationSubIssue", label: "Sub-issue" },
    { icon: "RelationParentIssue", label: "Parent issue" },
  ],
};

function FilterRowInteractive(props) {
  return (
    <div
      className={"imp-fr " + (props.active ? "is-active " : "") + (props.check ? "is-check " : "") + (props.selected ? "is-selected " : "")}
      onClick={props.onClick}
      onMouseEnter={props.onHover}
    >
      {props.check ? <span className="imp-fr-check"></span> : null}
      <span className="imp-fr-icon">{props.icon}</span>
      <span className="imp-fr-label">{props.label}</span>
      {props.count ? <span className="imp-fr-count">{props.count}</span> : null}
      {props.arrow ? <span className="imp-fr-arrow">›</span> : null}
    </div>
  );
}

function InteractiveFilterMenu() {
  const [activeKey, setActiveKey] = useState("status");
  const [selected, setSelected] = useState({ status: ["todo"] });

  function renderIcon(name, tone, sz) {
    const Comp = window[name];
    if (!Comp) return null;
    if (tone) return <Comp size={sz || 14} tone={tone} />;
    return <Comp size={sz || 14} />;
  }

  function toggle(menuKey, itemLabel) {
    setSelected(function(prev) {
      const list = prev[menuKey] || [];
      const next = list.indexOf(itemLabel) >= 0 ? list.filter(function(x){return x !== itemLabel;}) : list.concat([itemLabel]);
      return Object.assign({}, prev, (function(){var o={}; o[menuKey] = next; return o;})());
    });
  }

  const submenuItems = SUBMENU_DATA[activeKey];
  const activeSection = FILTER_SECTIONS[0].concat(FILTER_SECTIONS[1], FILTER_SECTIONS[2]).find(function(r) { return r.key === activeKey; });

  return (
    <div className="imp-mock-filter-wrap">
      <div className="imp-mock-filter-menu">
        {FILTER_SECTIONS.map(function(section, si) {
          return (
            <div key={si} className="imp-mock-filter-section">
              {section.map(function(row) {
                const hasSub = !!SUBMENU_DATA[row.key];
                return (
                  <FilterRowInteractive
                    key={row.key}
                    icon={renderIcon(row.icon, row.tone)}
                    label={row.label}
                    arrow={hasSub}
                    active={activeKey === row.key}
                    onClick={function() { if (hasSub) setActiveKey(row.key); }}
                    onHover={function() { if (hasSub) setActiveKey(row.key); }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {submenuItems ? (
        <div className="imp-mock-filter-submenu">
          <div className="imp-mock-filter-search">
            <span className="imp-mock-filter-search-text">Filter {activeSection ? activeSection.label.toLowerCase() : "…"}</span>
          </div>
          {submenuItems.map(function(item) {
            const isSel = (selected[activeKey] || []).indexOf(item.label) >= 0;
            return (
              <FilterRowInteractive
                key={item.label}
                check
                selected={isSel}
                icon={renderIcon(item.icon, item.tone)}
                label={item.label}
                count={item.count}
                onClick={function() { toggle(activeKey, item.label); }}
              />
            );
          })}
        </div>
      ) : (
        <div className="imp-mock-filter-submenu-empty">Select a filter type from the left to see options.</div>
      )}
    </div>
  );
}

function UsageExamples() {
  return (
    <section className="imp-examples">
      <div className="imp-examples-head">
        <h2>In context</h2>
        <p className="text-note">Imperial Icons feel at home in Linear-style dense, calm UI — the same opacity hierarchy and 1.5px stroke vocabulary throughout.</p>
      </div>

      <div className="imp-example-grid">
        <div className="imp-example-card imp-example-feature">
          <div className="imp-example-label">Linear-style filter menu — hover or click filter types on the left</div>
          <InteractiveFilterMenu />
        </div>

        <div className="imp-example-card">
          <div className="imp-example-label">Status workflow</div>
          <div className="imp-mock-status">
            <StatusItem Icon={StatusBacklog} tone="backlog" label="Backlog" count="42" />
            <StatusItem Icon={StatusTodo} tone="todo" label="Todo" count="8" />
            <StatusItem Icon={StatusInProgress} tone="progress" label="In Progress" count="3" />
            <StatusItem Icon={StatusInReview} tone="review" label="In Review" count="2" />
            <StatusItem Icon={StatusDoneFilled} tone="done" label="Done" count="124" />
            <StatusItem Icon={StatusCanceledFilled} tone="canceled" label="Canceled" count="7" />
          </div>
        </div>

        <div className="imp-example-card">
          <div className="imp-example-label">Priority breakdown</div>
          <div className="imp-mock-status">
            <StatusItem Icon={PriorityUrgent} tone="priority-urgent" label="Urgent" count="2" />
            <StatusItem Icon={PriorityHigh} tone="priority-high" label="High" count="11" />
            <StatusItem Icon={PriorityMedium} tone="priority-medium" label="Medium" count="24" />
            <StatusItem Icon={PriorityLow} tone="priority-low" label="Low" count="18" />
            <StatusItem Icon={PriorityNone} tone="priority-none" label="No priority" count="6" />
          </div>
        </div>

        <div className="imp-example-card">
          <div className="imp-example-label">Issue row</div>
          <div className="imp-mock-issues">
            <IssueRow priority="urgent" status="progress" id="ENG-241" title="Fix race condition in sync queue" />
            <IssueRow priority="high" status="review" id="ENG-238" title="Add roadmap export to PDF" />
            <IssueRow priority="medium" status="todo" id="DES-129" title="Audit Imperial icon stroke joins" />
            <IssueRow priority="low" status="backlog" id="OPS-44" title="Set up monitoring for billing webhook" />
            <IssueRow priority="medium" status="done" id="ENG-220" title="Speaker notes timing on slide deck" />
          </div>
        </div>

        <div className="imp-example-card">
          <div className="imp-example-label">Sidebar navigation</div>
          <div className="imp-mock-sidebar">
            <NavRow icon={<Inbox size={16} />} label="Inbox" count="12" active={true} />
            <NavRow icon={<FileText size={16} />} label="Notes" count="48" />
            <NavRow icon={<Briefcase size={16} />} label="Portfolio" count="3" />
            <NavRow icon={<Workflow size={16} />} label="Workflows" />
            <NavRow icon={<Calendar size={16} />} label="Calendar" />
            <div className="imp-nav-sep"></div>
            <NavRow icon={<Settings size={16} />} label="Settings" />
          </div>
        </div>

        <div className="imp-example-card">
          <div className="imp-example-label">Buttons & toolbar</div>
          <div className="imp-mock-buttons">
            <button className="imp-btn imp-btn-primary"><Plus size={14} />New note</button>
            <button className="imp-btn"><Upload size={14} />Import</button>
            <button className="imp-btn"><Share size={14} />Share</button>
            <button className="imp-icon-btn"><Filter size={16} /></button>
            <button className="imp-icon-btn"><SortAsc size={16} /></button>
            <button className="imp-icon-btn"><Settings size={16} /></button>
          </div>
        </div>

        <div className="imp-example-card">
          <div className="imp-example-label">Investment dashboard</div>
          <div className="imp-mock-stats">
            <StatCard icon={<Wallet size={18} />} label="Portfolio" value="$48,209" delta="+2.4%" up={true} />
            <StatCard icon={<TrendingUp size={18} />} label="24h gain" value="$1,128" delta="+1.1%" up={true} />
            <StatCard icon={<Target size={18} />} label="Goal" value="68%" delta="+4%" up={true} />
          </div>
        </div>

        <div className="imp-example-card">
          <div className="imp-example-label">Task list</div>
          <div className="imp-mock-tasks">
            <TaskRow icon={<CheckCircle size={14} />} label="Review Q1 portfolio" tag="done" tone="success" />
            <TaskRow icon={<Loader size={14} />} label="Build workflow template" tag="in progress" tone="warning" />
            <TaskRow icon={<AlertCircle size={14} />} label="Reconcile transactions" tag="needs attention" tone="danger" />
            <TaskRow icon={<Clock size={14} />} label="Weekly review" tag="scheduled" />
          </div>
        </div>

        <div className="imp-example-card">
          <div className="imp-example-label">Editor toolbar</div>
          <div className="imp-mock-editor">
            <button className="imp-editor-btn"><Bold size={14} /></button>
            <button className="imp-editor-btn"><Italic size={14} /></button>
            <button className="imp-editor-btn"><Underline size={14} /></button>
            <button className="imp-editor-btn"><Strikethrough size={14} /></button>
            <div className="imp-editor-sep"></div>
            <button className="imp-editor-btn"><Heading size={14} /></button>
            <button className="imp-editor-btn"><Quote size={14} /></button>
            <button className="imp-editor-btn"><Code size={14} /></button>
            <div className="imp-editor-sep"></div>
            <button className="imp-editor-btn"><ListUl size={14} /></button>
            <button className="imp-editor-btn"><ListOl size={14} /></button>
            <button className="imp-editor-btn"><ListCheck size={14} /></button>
            <div className="imp-editor-sep"></div>
            <button className="imp-editor-btn"><Link size={14} /></button>
            <button className="imp-editor-btn"><ImageIcon size={14} /></button>
          </div>
        </div>

        <div className="imp-example-card">
          <div className="imp-example-label">Logo lockup</div>
          <div className="imp-mock-logos">
            <div className="imp-logo-row">
              <ImperialMarkSolid size={48} />
              <div>
                <div className="imp-logo-title">Imperial</div>
                <div className="imp-logo-sub">Icon system</div>
              </div>
            </div>
            <div className="imp-logo-row imp-logo-row-mini">
              <ImperialMark size={20} />
              <span>Imperial</span>
            </div>
            <div className="imp-logo-marks">
              <ImperialMarkSolid size={32} />
              <ImperialMark size={32} />
              <div className="imp-logo-mono"><ImperialMark size={20} /></div>
            </div>
          </div>
        </div>
      </div>

      <UsageGuide />
    </section>
  );
}

function UsageGuide() {
  return (
    <section className="imp-usage">
      <div>
        <h2>Use Imperial Icons in your projects</h2>
        <p className="text-note">Plot, Keystone, FlowBase — and any future project — share the same icon vocabulary. Pick the workflow that fits.</p>
      </div>

      <div className="imp-usage-grid">
        <div className="imp-usage-card">
          <span className="imp-usage-step">Option A · simplest</span>
          <h3><Download size={14} />Download SVGs</h3>
          <p>Click any icon → "Download SVG" in the detail panel. Drop the file into your project's <code>assets/icons/</code> folder.</p>
          <pre><code>{'<img src="assets/icons/note.svg" width="16" />'}</code></pre>
        </div>

        <div className="imp-usage-card">
          <span className="imp-usage-step">Option B · React</span>
          <h3><Code size={14} />Copy as JSX</h3>
          <p>Click any icon → "Copy SVG" then paste into a <code>.jsx</code> component. Replace <code>stroke</code> with <code>currentColor</code> so it inherits parent text color.</p>
          <pre><code>{'function NoteIcon({size=16}) {\n  return <svg width={size} height={size}\n    stroke="currentColor" ...>...</svg>;\n}'}</code></pre>
        </div>

        <div className="imp-usage-card">
          <span className="imp-usage-step">Option C · GitHub</span>
          <h3><Workflow size={14} />Publish as a package</h3>
          <p>Push this project to GitHub. Other projects install via <code>npm install</code> from the repo URL. Single source of truth.</p>
          <pre><code>{'// package.json\n"dependencies": {\n  "imperial-icons":\n    "github:you/imperial-icons"\n}'}</code></pre>
        </div>

        <div className="imp-usage-card">
          <span className="imp-usage-step">Design tokens</span>
          <h3><Sliders size={14} />Semantic color tokens</h3>
          <p>Define once in <code>:root</code>, use everywhere. Change a single line and all 3 apps update.</p>
          <pre><code>{':root {\n  --icon-success: #22c55e;\n  --icon-danger:  #ef4444;\n  --icon-warning: #f59e0b;\n  --icon-info:    #3b82f6;\n}\n\n/* in component */\n.icon-success {\n  color: var(--icon-success);\n}'}</code></pre>
        </div>

        <div className="imp-usage-card">
          <span className="imp-usage-step">Magic trick</span>
          <h3><Sparkles size={14} />currentColor inheritance</h3>
          <p>Stroke = <code>currentColor</code> means the icon inherits the parent text color. No prop needed.</p>
          <pre><code>{'<button style={{color: "red"}}>\n  <NoteIcon /> Red\n</button>\n<button style={{color: "blue"}}>\n  <NoteIcon /> Blue\n</button>'}</code></pre>
        </div>

        <div className="imp-usage-card">
          <span className="imp-usage-step">Sizing convention</span>
          <h3><Type size={14} />When to use which size</h3>
          <p style={{lineHeight: 1.7}}>
            <strong>12px</strong> · badge, inline meta<br/>
            <strong>14px</strong> · dense list, issue row<br/>
            <strong>16px</strong> · standard UI (sidebar, button)<br/>
            <strong>18–20px</strong> · header, medium button<br/>
            <strong>24px</strong> · toolbar, content<br/>
            <strong>32–48px</strong> · empty state, illustration
          </p>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [theme, setTheme] = useState("dark");
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [size, setSize] = useState(24);
  const [stroke, setStroke] = useState(1.5);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: "" });

  useEffect(function() {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.body.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const filtered = useMemo(function() {
    const q = query.trim().toLowerCase();
    return ICONS.filter(function(i) {
      if (activeCat !== "All" && i.cat !== activeCat) return false;
      if (!q) return true;
      if (i.name.indexOf(q) >= 0) return true;
      if (i.cat.toLowerCase().indexOf(q) >= 0) return true;
      const kw = i.c.keywords || [];
      return kw.some(function(k) { return k.indexOf(q) >= 0; });
    });
  }, [query, activeCat]);

  const counts = useMemo(function() {
    const map = { All: ICONS.length };
    ICONS.forEach(function(i) { map[i.cat] = (map[i.cat] || 0) + 1; });
    return map;
  }, []);

  function showToast(msg) {
    setToast({ show: true, msg: msg });
    setTimeout(function() { setToast({ show: false, msg: msg }); }, 1600);
  }

  function handleCopy(kind) {
    showToast(kind + " copied to clipboard");
  }

  function handleDownload(icon, svgStr) {
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = icon.name + ".svg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(icon.name + ".svg downloaded");
  }

  const searchRef = useRef(null);
  useEffect(function() {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (searchRef.current) searchRef.current.focus();
      }
      if (e.key === "Escape" && selected) setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return function() { window.removeEventListener("keydown", onKey); };
  }, [selected]);

  return (
    <div className="imp-app">
      <header className="imp-topbar">
        <div className="imp-brand">
          <ImperialMarkSolid size={28} />
          <div className="imp-brand-text">
            <span className="imp-brand-title">Imperial</span>
            <span className="imp-brand-sub">Icons</span>
          </div>
        </div>

        <div className="imp-search">
          <Search size={14} className="imp-search-icon" />
          <input
            ref={searchRef}
            className="imp-search-input"
            placeholder={"Search " + ICONS.length + " icons by name, category, keyword…"}
            value={query}
            onChange={function(e) { setQuery(e.target.value); }}
          />
          <kbd className="kbd">⌘K</kbd>
        </div>

        <div className="imp-topbar-right">
          <div className="imp-seg">
            {[12, 14, 16, 18, 20, 24, 32].map(function(s) {
              return (
                <button
                  key={s}
                  className={"imp-seg-btn " + (size === s ? "is-active" : "")}
                  onClick={function() { setSize(s); }}
                >{s}</button>
              );
            })}
          </div>
          <button
            className="imp-icon-btn"
            onClick={function() { setTheme(theme === "dark" ? "light" : "dark"); }}
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <div className="imp-body">
        <nav className="imp-sidebar">
          <div className="imp-sidebar-section">
            <span className="text-label">Categories</span>
          </div>
          <ul className="imp-cat-list">
            <li>
              <button
                className={"imp-cat-row " + (activeCat === "All" ? "is-active" : "")}
                onClick={function() { setActiveCat("All"); }}
              >
                <span>All</span>
                <span className="imp-cat-count">{counts["All"] || 0}</span>
              </button>
            </li>
          </ul>

          <div className="imp-cat-section-label">My projects</div>
          <ul className="imp-cat-list">
            {PROJECT_CATS.map(function(cat) {
              return (
                <li key={cat}>
                  <button
                    className={"imp-cat-row " + (activeCat === cat ? "is-active" : "")}
                    onClick={function() { setActiveCat(cat); }}
                  >
                    <span style={{display:"inline-flex",alignItems:"center"}}>
                      <span className={"imp-cat-chip " + (PROJECT_CHIP[cat] || "")}></span>
                      {cat}
                    </span>
                    <span className="imp-cat-count">{counts[cat] || 0}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="imp-cat-section-label">Linear-style semantic</div>
          <ul className="imp-cat-list">
            {SEMANTIC_CATS.map(function(cat) {
              return (
                <li key={cat}>
                  <button
                    className={"imp-cat-row " + (activeCat === cat ? "is-active" : "")}
                    onClick={function() { setActiveCat(cat); }}
                  >
                    <span>{cat}</span>
                    <span className="imp-cat-count">{counts[cat] || 0}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="imp-cat-section-label">Generic UI</div>
          <ul className="imp-cat-list">
            {GENERIC_CATS.map(function(cat) {
              return (
                <li key={cat}>
                  <button
                    className={"imp-cat-row " + (activeCat === cat ? "is-active" : "")}
                    onClick={function() { setActiveCat(cat); }}
                  >
                    <span>{cat}</span>
                    <span className="imp-cat-count">{counts[cat] || 0}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="imp-sidebar-section" style={{ marginTop: 24 }}>
            <span className="text-label">About</span>
          </div>
          <div className="imp-about">
            <p>Linear-inspired icon set. 1.5px stroke, round caps, 24× viewBox, currentColor.</p>
            <p>Use as React components, copy as raw SVG, or download files.</p>
          </div>
        </nav>

        <main className="imp-main">
          <div className="imp-main-head">
            <h1>{activeCat === "All" ? "All icons" : activeCat}</h1>
            <span className="imp-result-count">{filtered.length} icons</span>
          </div>

          {filtered.length === 0 ? (
            <div className="imp-empty">
              <Search size={20} />
              <p>No icons match "{query}"</p>
              <button className="imp-btn" onClick={function() { setQuery(""); setActiveCat("All"); }}>Clear</button>
            </div>
          ) : (
            <div className="imp-grid">
              {filtered.map(function(i) {
                return (
                  <IconCard
                    key={i.name}
                    icon={i}
                    size={size}
                    stroke={stroke}
                    selected={selected && selected.name === i.name}
                    onClick={setSelected}
                  />
                );
              })}
            </div>
          )}

          {activeCat === "All" && !query ? <UsageExamples /> : null}
        </main>

        {selected ? (
          <DetailPanel
            icon={selected}
            onClose={function() { setSelected(null); }}
            onCopy={handleCopy}
            onDownload={handleDownload}
            size={size}
            setSize={setSize}
            stroke={stroke}
            setStroke={setStroke}
          />
        ) : null}
      </div>

      <Toast message={toast.msg} show={toast.show} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
