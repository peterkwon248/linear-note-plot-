/* @jsx React.createElement */
// C-series placeholders — will be filled in iteration

function CAPlaceholder(label, tone) {
  return function() {
    return (
      <div className="plot-app" style={{ display:'grid', placeItems:'center', width:'100%', height:'100%', color:'var(--whisper-fg)', fontSize:13, letterSpacing:'0.04em', textTransform:'uppercase', fontFamily:'var(--font-mono)' }}>
        <div style={{ textAlign:'center', display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ fontSize:11, opacity:0.6 }}>{tone}</div>
          <div>{label}</div>
          <div style={{ fontSize:10, opacity:0.4 }}>coming next iteration</div>
        </div>
      </div>
    );
  };
}

window.CABrowse  = CAPlaceholder('C-A Browse',  'Atelier');
window.CAGraph   = CAPlaceholder('C-A Graph',   'Atelier');
window.CBBrowse  = CAPlaceholder('C-B Browse',  'Pro Studio');
window.CBGraph   = CAPlaceholder('C-B Graph',   'Pro Studio');
window.CCBrowse  = CAPlaceholder('C-C Browse',  'Editorial');
window.CCGraph   = CAPlaceholder('C-C Graph',   'Editorial');

// Old C placeholders — keep CNotesTable etc. defined just in case anything references them
window.CNotesTable = window.CNotesTable || CAPlaceholder('Legacy', 'C-old');
window.CBrowseMode = window.CBrowseMode || CAPlaceholder('Legacy', 'C-old');
window.CGraph = window.CGraph || CAPlaceholder('Legacy', 'C-old');
