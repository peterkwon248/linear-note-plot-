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

window.ColorPicker = ColorPicker;
window.hexToRgb = hexToRgb;
window.rgbToHex = rgbToHex;
