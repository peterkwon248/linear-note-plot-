/* @jsx React.createElement */
/* Plot v3 — Linear-style filter menu (Plot-flavored)
 *
 * <PlotFilterMenu open anchor onClose />
 * Renders a 2-column popover:
 *   left  — filter types (Status, Tags, Priority, Dates, Links, Author)
 *   right — checkbox options for the active type
 */
const { useState: useStateF } = React;

const F_PF = (name, fb) => window[name] || (fb && window[fb]) || (() => null);

const PF_SECTIONS = [
  // Section 1 — primary
  [
    { key: 'status',   icon: 'Brain',    label: 'Status' },
    { key: 'tags',     icon: 'Hash',     label: 'Tags' },
    { key: 'priority', icon: 'BarChart', label: 'Priority' },
  ],
  // Section 2 — meta
  [
    { key: 'dates',    icon: 'Calendar', label: 'Dates' },
    { key: 'links',    icon: 'Link',     label: 'Links' },
    { key: 'author',   icon: 'User',     label: 'Author' },
  ],
  // Section 3 — quick filters (no submenu)
  [
    { key: 'starred',     icon: 'Star',  label: 'Starred only',  flag: true },
    { key: 'orphans',     icon: 'AlertCircle', label: 'Orphans (no links)', flag: true },
    { key: 'has-excerpt', icon: 'Quote', label: 'Has excerpt',   flag: true },
  ],
];

const PF_OPTIONS = {
  status: [
    { id: 'inbox',     label: 'Inbox',     count: 12,  toneVar: 'var(--status-inbox)' },
    { id: 'capture',   label: 'Fleeting',  count: 28,  toneVar: 'var(--status-capture)' },
    { id: 'permanent', label: 'Permanent', count: 184, toneVar: 'var(--status-permanent)' },
    { id: 'wiki',      label: 'Wiki',      count: 23,  toneVar: 'var(--space-wiki)' },
  ],
  tags: [
    { id: 'design-systems', label: 'design-systems', count: 42 },
    { id: 'writing',        label: 'writing',        count: 38 },
    { id: 'tools',          label: 'tools',          count: 29 },
    { id: 'typography',     label: 'typography',     count: 21 },
    { id: 'second-brain',   label: 'second-brain',   count: 17 },
  ],
  priority: [
    { id: 'high',   label: 'High',   count: 6,   toneVar: 'var(--priority-high)' },
    { id: 'medium', label: 'Medium', count: 18,  toneVar: 'var(--priority-medium)' },
    { id: 'low',    label: 'Low',    count: 42,  toneVar: 'var(--priority-low)' },
    { id: 'none',   label: 'No priority', count: 181 },
  ],
  dates: [
    { id: 'today',    label: 'Today',     count: 3 },
    { id: 'week',     label: 'This week', count: 9 },
    { id: 'month',    label: 'This month', count: 24 },
    { id: 'stale',    label: 'Stale > 30d', count: 19 },
  ],
  links: [
    { id: 'orphans',  label: 'Orphans (0 links)',   count: 6 },
    { id: 'fewlinks', label: '1–2 links',           count: 38 },
    { id: 'rich',     label: 'Highly linked (5+)',  count: 47 },
  ],
  author: [
    { id: 'me',     label: 'Me',          count: 247 },
    { id: 'shared', label: 'Shared with me', count: 0 },
  ],
};

function PlotFilterMenu({ open, onClose, anchorRect }) {
  const [activeKey, setActiveKey] = useStateF('status');
  const [selected, setSelected] = useStateF({ status: ['permanent'] });

  if (!open) return null;

  const Icon = (name) => F_PF(name, 'Circle');
  const opts = PF_OPTIONS[activeKey];
  const isFlag = !opts;

  const toggle = (key, id) => {
    setSelected(prev => {
      const list = prev[key] || [];
      const next = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
      return { ...prev, [key]: next };
    });
  };

  // Anchor under the Filter button
  const top = anchorRect ? anchorRect.bottom + 6 : 60;
  const left = anchorRect ? anchorRect.left : 200;

  return (
    <>
      <div style={{ position:'fixed', inset:0, zIndex:79 }} onClick={onClose} />
      <div className="pf-popover" style={{ top, left }}>
        {/* LEFT — filter types */}
        <div className="pf-col">
          {PF_SECTIONS.map((section, si) => (
            <div key={si} className="pf-section">
              {section.map(row => {
                const Comp = Icon(row.icon);
                const selCount = (selected[row.key] || []).length;
                return (
                  <div key={row.key} className="pf-row"
                    data-active={activeKey === row.key}
                    onClick={() => setActiveKey(row.key)}
                    onMouseEnter={() => setActiveKey(row.key)}>
                    <span className="pf-row__icon"><Comp size={13} /></span>
                    <span className="pf-row__label">{row.label}</span>
                    {selCount > 0 && <span className="pf-row__count">{selCount}</span>}
                    {!row.flag && <span className="pf-row__arrow">›</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* RIGHT — options */}
        {isFlag ? (
          <div className="pf-empty">Toggle the quick filter on the left to apply.</div>
        ) : (
          <div className="pf-col">
            <div className="pf-search">
              Filter {activeKey}…
            </div>
            {opts.map(opt => {
              const checked = (selected[activeKey] || []).includes(opt.id);
              return (
                <div key={opt.id} className="pf-row"
                  data-checked={checked}
                  onClick={() => toggle(activeKey, opt.id)}>
                  <span className="pf-row__check" />
                  {opt.toneVar && <span className="pf-tone-dot" style={{ background: opt.toneVar }} />}
                  <span className="pf-row__label">{opt.label}</span>
                  {opt.count > 0 && <span className="pf-row__count">{opt.count}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

window.PlotFilterMenu = PlotFilterMenu;
