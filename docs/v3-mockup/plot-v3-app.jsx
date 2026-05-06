/* @jsx React.createElement */
const { useState, useEffect, useMemo, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "defaultMode": "table",
  "density": "regular",
  "accent": "#5e6ad2"
}/*EDITMODE-END*/;

function PlotV3App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const theme = t.theme;

  React.useEffect(() => {
    document.documentElement.style.setProperty('--plot-accent', t.accent);
  }, [t.accent]);

  return (
    <div className={theme === 'dark' ? 'dark' : ''}
         data-density={t.density}
         style={{ width:'100%', height:'100%' }}>
      <DesignCanvas
        title="Plot v3 — Direction explorations"
        subtitle="Unified · A · C-A Atelier · C-B Pro Studio · C-C Editorial"
      >
        <DCSection id="dir-unified" title="Unified Display Modes" subtitle="Same data, 5 view modes. Switch between Table · Gallery · Studio · Editorial · Graph from one shell.">
          <DCArtboard id="u-table" label="Unified · Table" width={1320} height={840}>
            <PlotUnified theme={theme} defaultMode="table" />
          </DCArtboard>
          <DCArtboard id="u-gallery" label="Unified · Gallery" width={1320} height={840}>
            <PlotUnified theme={theme} defaultMode="gallery" />
          </DCArtboard>
          <DCArtboard id="u-studio" label="Unified · Studio" width={1320} height={840}>
            <PlotUnified theme={theme} defaultMode="studio" />
          </DCArtboard>
          <DCArtboard id="u-editorial" label="Unified · Editorial" width={1320} height={840}>
            <PlotUnified theme={theme} defaultMode="editorial" />
          </DCArtboard>
          <DCArtboard id="u-graph" label="Unified · Graph" width={1320} height={840}>
            <PlotUnified theme={theme} defaultMode="graph" />
          </DCArtboard>
        </DCSection>

        <DCSection id="dir-a" title="Direction A — Linear × Obsidian Hybrid" subtitle="Precision + connectivity. Information-dense, keyboard-first, graph as first-class citizen.">
          <DCArtboard id="a1" label="A1 · Notes Table" width={1320} height={840}>
            <ANotesTable theme={theme} />
          </DCArtboard>
          <DCArtboard id="a2" label="A2 · Browse Mode" width={1320} height={840}>
            <ABrowseMode theme={theme} />
          </DCArtboard>
          <DCArtboard id="a3" label="A3 · Investigative Graph" width={1320} height={840}>
            <AGraph theme={theme} />
          </DCArtboard>
        </DCSection>

        <DCSection id="dir-ca" title="Direction C-A — Atelier" subtitle="Workshop metaphor. Notes as physical cards on a warm canvas, vertical tool tray, serif headlines.">
          <DCArtboard id="ca1" label="C-A1 · Notes Canvas" width={1320} height={840}>
            <CANotesCanvas theme={theme} />
          </DCArtboard>
          <DCArtboard id="ca2" label="C-A2 · Browse" width={1320} height={840}>
            <CABrowse theme={theme} />
          </DCArtboard>
          <DCArtboard id="ca3" label="C-A3 · Graph" width={1320} height={840}>
            <CAGraph theme={theme} />
          </DCArtboard>
        </DCSection>

        <DCSection id="dir-cb" title="Direction C-B — Pro Studio" subtitle="Pro media tool. Dark workspace, dockable inspectors, transport bar, mini-timeline.">
          <DCArtboard id="cb1" label="C-B1 · Studio Workspace" width={1320} height={840}>
            <CBNotesStudio theme={theme} />
          </DCArtboard>
          <DCArtboard id="cb2" label="C-B2 · Browse" width={1320} height={840}>
            <CBBrowse theme={theme} />
          </DCArtboard>
          <DCArtboard id="cb3" label="C-B3 · Graph" width={1320} height={840}>
            <CBGraph theme={theme} />
          </DCArtboard>
        </DCSection>

        <DCSection id="dir-cc" title="Direction C-C — Editorial" subtitle="Newsroom metaphor. Big serif body, marginalia, masthead, issue-based navigation.">
          <DCArtboard id="cc1" label="C-C1 · Editorial Notes" width={1320} height={840}>
            <CCNotesEditorial theme={theme} />
          </DCArtboard>
          <DCArtboard id="cc2" label="C-C2 · Browse" width={1320} height={840}>
            <CCBrowse theme={theme} />
          </DCArtboard>
          <DCArtboard id="cc3" label="C-C3 · Graph" width={1320} height={840}>
            <CCGraph theme={theme} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Plot v3 — Tweaks">
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme}
          options={['light', 'dark']}
          onChange={(v) => setTweak('theme', v)} />
        <TweakColor label="Accent" value={t.accent}
          options={['#5e6ad2', '#c79634', '#2dd4bf', '#b8412e', '#7a5ae0']}
          onChange={(v) => setTweak('accent', v)} />

        <TweakSection label="Default view" />
        <TweakSelect label="Mode" value={t.defaultMode}
          options={['table', 'gallery', 'studio', 'editorial', 'graph']}
          onChange={(v) => setTweak('defaultMode', v)} />
        <TweakRadio label="Density" value={t.density}
          options={['compact', 'regular', 'comfy']}
          onChange={(v) => setTweak('density', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PlotV3App />);
