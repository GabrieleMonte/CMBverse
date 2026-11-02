/* ============================================================
 * cmb-plot.js — reusable CMB-emulator plot widget.
 *
 * Extracted from index.html's inline driver so the SAME engine powers both
 * index.html (all six sliders) and matter.html (two instances, omega_cdm only).
 * createCMBPlot(root, config) builds the whole widget inside `root` and returns
 * a small controller. All per-widget state lives in the closure, so any number
 * of instances can coexist on one page.
 *
 * config = {
 *   modelUrls : {tt, te, ee},           // required
 *   model     : 's3' | 'geo' | 'neutrino' | 'mnu' | 'matter',  // emulator backend (default 's3'; see BACKENDS)
 *   xaxis     : 'linear' | 'loglin',    // multipole axis (default 'linear')
 *   dataUrl, lcdmUrl,                   // optional overlays
 *   sliders   : ['omega_cdm', ...],     // which inputs get sliders (default: all six)
 *   ranges    : { omega_cdm:[lo,hi] },  // per-slider range overrides
 *   fixed     : { omega_b:0.02237 },    // params pinned to non-default values
 *   start     : { M_nu:0.06 },          // initial + Reset values of slider params
 *   derive    : (params) => {...},      // recompute dependent params each update
 *   showPie, showDerived, showSave, showLegend : booleans (default true)
 * }
 * ============================================================ */
import CMBEmulatorS3, { META as META_S3, makeSpline } from './cmb-emulator-separate.js';
import CMBEmulatorGeo, { META as META_GEO } from './cmb-emulator-geo.js';
import CMBEmulatorNeutrino, { META as META_NEU } from './cmb-emulator-neutrino.js';
import CMBEmulatorMnu, { META as META_MNU } from './cmb-emulator-mnu.js';
import CMBEmulatorMatter, { META as META_MAT } from './cmb-emulator-matter.js';
import CMBEmulatorTensor, { META as META_TEN } from './cmb-emulator-tensor.js';

// Emulator backends, selected per widget by config.model (default 's3'). noTF: no TensorFlow.js needed.
const BACKENDS = {
  tensor:   { Emulator: CMBEmulatorTensor,   META: META_TEN, noTF: true },  // tensor page: CLASS table D_l^BB(r), 10^2 r slider
  s3:       { Emulator: CMBEmulatorS3,       META: META_S3  },   // deployed 6-input flat model
  geo:      { Emulator: CMBEmulatorGeo,      META: META_GEO },   // 4-input curvature model (scheme pages)
  neutrino: { Emulator: CMBEmulatorNeutrino, META: META_NEU },   // (N_eff, YHe) plane, theta_s fixed (neutrino pages)
  mnu:      { Emulator: CMBEmulatorMnu,      META: META_MNU },   // neutrino mass: ratios C_l(M_nu)/C_l(0), TT/EE/phi-phi
  matter:   { Emulator: CMBEmulatorMatter,   META: META_MAT },   // matter page: omega_b, omega_cdm, Omega_Lambda (YHe fixed)
};

// ---- parameter display config (MathJax labels + value formatting) ----------
const LABELS = {
  'omega_b':      '\\(\\omega_b\\)',
  'omega_cdm':    '\\(\\omega_c\\)',
  'Omega_Lambda': '\\(\\Omega_\\Lambda\\)',
  'Omega_k':      '\\(\\Omega_k\\)',
  'ln10^{10}A_s': '\\(\\ln(10^{10}A_s)\\)',
  'n_s':          '\\(n_s\\)',
  'tau_reio':     '\\(\\tau_{\\rm reio}\\)',
  'N_eff':        '\\(N_{\\rm eff}\\)',
  'YHe':          '\\(Y_{p}\\)',
  'M_nu':         '\\(M_\\nu\\,[\\mathrm{eV}]\\)',
  'r100':         '\\(10^{2}\\,r\\)',
};
const fmt = (name, v) =>
  name === 'omega_b'      ? v.toFixed(4) :
  name === 'r100'         ? v.toFixed(2) :
  name === 'omega_cdm'    ? v.toFixed(3) :
  name === 'tau_reio'     ? v.toFixed(3) :
  name === 'YHe'          ? v.toFixed(3) :
  name === 'M_nu'         ? v.toFixed(2) :
  name.includes('A_s')    ? v.toFixed(2) :
                            v.toFixed(2);

// ---- plot constants (match the python figures) -----------------------------
const SPECS = ['tt','ee','te'];                 // panel order: TT top, EE mid, TE bottom
const Y_LOG   = { tt:true,  ee:true,  te:false };
const Y_RANGE = { tt:[2e-3, 2e1], ee:[1e-6, 1e-1], te:[-0.25, 0.25] };
const XMIN = 0, XMAX = 4000;
const XTICKS = [0,1000,2000,3000,4000];
const X_MINOR = 100;          // minor x-tick spacing (all panels)

const COLOR_MODEL = '#7B4397';   // emulator (live) curve
const COLOR_LCDM  = '#000000';   // reference
const COLOR = { planck:'#000000', act:'#2ca02c', spt:'#d62728' };
const FONT = 'serif';
export const PIE_COLOR = { OmegaL:'#E6AF2E', cdm:'#B0C4DE', b:'#46B1C9', nu:'#D98C6C' };

const Y_TITLE = {
  tt:'\\(\\mathcal{D}_\\ell^{\\mathrm{TT}}\\,[10^3\\,\\mu\\mathrm{K}^2]\\)',
  ee:'\\(\\mathcal{D}_\\ell^{\\mathrm{EE}}\\,[10^3\\,\\mu\\mathrm{K}^2]\\)',
  te:'\\(\\mathcal{D}_\\ell^{\\mathrm{TE}}\\,[10^3\\,\\mu\\mathrm{K}^2]\\)',
  bb:'\\(\\mathcal{D}_\\ell^{\\mathrm{BB}}\\,[10^3\\,\\mu\\mathrm{K}^2]\\)',
};
const TITLE_SPEC = { tt:'TT', ee:'EE', te:'TE', pp:'φφ', bb:'BB' };
const LETTER_D = '\u{1D49F}';          // script D, used in exported axis titles
const BAND_FILL = 'rgba(0,0,0,0.07)';  // zoom-window band on the main panels
const DIVIDER_COLOR = '#999999';       // dashed l=30 divider on log-linear panels (display.xBySpec.*.xDivider)
// data error envelopes, filled (display.errorBand shade 'light' grey | 'dark' grey | 'act' light ACT green). 'light'
// and 'act' are opaque (the old translucent grey, and #2ca02c at 35%, over the page background) and get a darker
// edge line (ERRBAND_EDGE) on both sides, so a band drawn over another still shows the one beneath
const ERRBAND_FILL = { light:'#D3D3D1', dark:'rgba(40,40,40,0.42)', act:'#B2DAB0' };
const ERRBAND_EDGE = { light:'#8C8C8A', act:'#2ca02c' };

// Plot palettes. The constants above are the light one; DARK is used on screen when <html data-theme="dark">
// (dark_mode_instructions.md §2.7). PAL is a module global set at the start of every draw, like VIEW;
// exports pin it to LIGHT. The SVG export body draws with the constants directly (always light).
const LIGHT = { ink:'#000', model:COLOR_MODEL, lcdm:COLOR_LCDM, data:COLOR, band:BAND_FILL, divider:DIVIDER_COLOR, errband:ERRBAND_FILL,
  errbandEdge:ERRBAND_EDGE };
const DARK  = { ink:'#D0D6E2', model:'#C39BE8', lcdm:'#E2E8F5', data:{ planck:'#E2E8F5', act:'#5BD25B', spt:'#FF6B6B' },
  band:'rgba(226,232,245,0.07)', divider:'#6B7894', errband:{ light:'#2C3241', dark:'rgba(226,232,245,0.30)', act:'#295737' },
  errbandEdge:{ light:'#6B7387', act:'#5BD25B' } };
// dark variants of the data-set colors pages pass in display.dataSets (a data set's colorDark overrides)
const DARK_OF = { '#000000':'#E2E8F5', '#2ca02c':'#5BD25B', '#d62728':'#FF6B6B', '#ff7f0e':'#FFA552', '#8c564b':'#C99A8C', '#1f77b4':'#6BB3F0' };
let PAL = LIGHT;
const themePal = () => document.documentElement.dataset.theme === 'dark' ? DARK : LIGHT;
const dsColor = (ds) => PAL === LIGHT ? ds.color : (ds.colorDark || DARK_OF[ds.color.toLowerCase()] || ds.color);

// Per-instance plot view: y-axis log/linear, ranges and titles, x range/ticks, title letter.
// Defaults are the standard D_l figure above; config.display overrides per widget. VIEW is a module
// global set at the start of every draw (applyView(), and per panel), so instances never clash.
const VIEW_DEFAULT = {
  xaxis: 'linear',
  yLog: Y_LOG, yRange: Y_RANGE, ySym: { tt:false, ee:false, te:true },
  xmin: XMIN, xmax: XMAX, xticks: XTICKS, xminor: X_MINOR, letter: LETTER_D, yTitle: Y_TITLE,
};
let VIEW = VIEW_DEFAULT;
const UNIT_STR = ' [10³ μK²]';

// visual weights (calibrated to the python figure), scaled by SS at render
const STYLE = {
  markerR:2.5, errWidth:1.1, modelWidth:2.6, lcdmWidth:1.6,
  tickFont:14, legendFont:13, frameWidth:1.0,
};

// ---- derived Hubble h from the flatness closure ----------------------------
// The emulator's basis is (omega_b, omega_cdm, Omega_Lambda, ...): it takes
// Omega_Lambda, NOT h, and is trained flat (Omega_k = 0). So h is a DERIVED
// quantity fixed by  h^2 = (omega_b + omega_cdm + omega_rad+nu) / (1 - Omega_Lambda - Omega_k).
// RAD_NU lumps the (fixed) radiation + massive-neutrino density; it is calibrated
// so the Planck fiducial (0.02237, 0.12, 0.685) returns h = 0.6736.
const OMEGA_K = 0;
const RAD_NU  = 0.0005571;
function hubbleH(p){
  const denom = 1 - p['Omega_Lambda'] - OMEGA_K;
  if (denom <= 0) return NaN;
  return Math.sqrt((p['omega_b'] + p['omega_cdm'] + RAD_NU) / denom);
}

// ---- pure helpers ----------------------------------------------------------
function dynRange(spec, curveVals){
  const [dLo, dHi] = VIEW.yRange[spec];
  if (VIEW.yFixed) return [dLo, dHi];          // zoom panels: fixed range, no auto-expansion
  if (VIEW.yLog[spec]){
    let mx=-Infinity, mn=Infinity;
    for (const v of curveVals){ if (v>0 && v>mx) mx=v; if (v>0 && v<mn) mn=v; }
    return [Math.min(dLo, mn/1.15), Math.max(dHi, mx*1.15)];
  } else if (VIEW.ySym[spec]){
    let a=0; for (const v of curveVals) a=Math.max(a, Math.abs(v));
    const hi = Math.max(dHi, a*1.10);
    return [-hi, hi];
  } else {                       // linear, non-symmetric: expand the default range to fit the curve
    let mx=-Infinity, mn=Infinity;
    for (const v of curveVals){ if (v>mx) mx=v; if (v<mn) mn=v; }
    const pad = 0.05*(mx - mn);
    return [Math.min(dLo, mn - pad), Math.max(dHi, mx + pad)];
  }
}
function logTicks(lo, hi){
  const t=[]; for (let e=Math.ceil(Math.log10(lo)); e<=Math.floor(Math.log10(hi)); e++) t.push(Math.pow(10,e));
  return t;
}
function linStep(lo, hi){
  const span = hi - lo, steps = [0.01,0.02,0.05,0.1,0.2,0.5,1,2];
  return steps.find(s => span/s <= 8) || 2;
}
function linTicks(lo, hi){
  const step = linStep(lo, hi), t=[]; const start=Math.ceil(lo/step)*step;
  for (let v=start; v<=hi+1e-9; v+=step) t.push(Math.abs(v)<1e-9?0:+v.toFixed(4));
  return t;
}
// l-axis mode of the panel being drawn (VIEW.xaxis): 'linear', 'log' (pure log l), or 'loglin' (log
// for l <= 30, linear above; VIEW.logFrac = share of the width given to the log part, default 1/3).
const XTICKS_LL = [2,5,10,20,30,500,1000,2000,3000,4000];
const LL_L0 = 30, LL_TB = Math.log10(30), LL_MIN = 2, LL_MAX = 4030;
// log-linear map for a view (cached on it): log10(l) up to l=30, then linear with a slope chosen so
// the log part fills logFrac of the axis width.
function llMap(v){
  if (v._ll) return v._ll;
  const frac = v.logFrac || 1/3, logW = LL_TB - Math.log10(LL_MIN);
  const A = logW*(1 - frac)/frac/(LL_MAX - LL_L0);
  const fwd = (l) => { l = Math.max(LL_MIN, l); return l <= LL_L0 ? Math.log10(l) : LL_TB + (l - LL_L0)*A; };
  return (v._ll = { fwd, F0: fwd(LL_MIN), F1: fwd(LL_MAX) });
}
const xPix = (l, X0, X1) => {
  if (VIEW.xaxis === 'loglin'){ const m = llMap(VIEW); return X0 + (m.fwd(l) - m.F0)/(m.F1 - m.F0) * (X1 - X0); }
  if (VIEW.xaxis === 'log')
    return X0 + (Math.log10(Math.max(l, 1e-6)) - Math.log10(VIEW.xmin))/(Math.log10(VIEW.xmax) - Math.log10(VIEW.xmin)) * (X1 - X0);
  return X0 + (l - VIEW.xmin)/(VIEW.xmax - VIEW.xmin) * (X1 - X0);
};
// Sampling grid for curves on log / log-linear l axes. Integer l (one point per multipole) is too sparse
// where a log axis stretches low l (l 2->3 spans ~20-30 px), so curves showed straight-segment elbows.
// Below ~90 sample log-spaced at 0.005 dex (fractional l; the spline is continuous); above, integers are
// already finer than that. Linear axes keep integer sampling.
const DENSE_DEX = 0.005, DENSE_TO = 90;
function denseElls(lmin, lmax){
  const out = [];
  for (let e = Math.log10(lmin); e < Math.log10(Math.min(DENSE_TO, lmax)); e += DENSE_DEX) out.push(Math.pow(10, e));
  for (let l = Math.max(Math.ceil(lmin), DENSE_TO); l <= lmax; l++) out.push(l);
  return out;
}
// x ticks for the current panel: majors (labelled) and minors, per axis mode. 'log' labels powers of
// ten as 10^n with minors at 2..9 x 10^n; 'loglin' uses VIEW.xticksLL (default XTICKS_LL) and, when
// VIEW.llMinors, log minors below l=30 and minors every 100 above.
function xMajorTicks(){ return VIEW.xaxis === 'loglin' ? (VIEW.xticksLL || XTICKS_LL) : VIEW.xticks; }
function xMinorTicks(){
  const out = [];
  if (VIEW.xaxis === 'loglin'){
    if (!VIEW.llMinors) return [];
    const maj = xMajorTicks();
    for (let v = 2; v < 10; v++) out.push(v);
    for (let v = 20; v <= 30; v += 10) out.push(v);
    for (let v = 100; v <= LL_MAX; v += 100) out.push(v);
    return out.filter(v => !maj.includes(v));
  }
  if (VIEW.xaxis === 'log'){
    for (let e = Math.floor(Math.log10(VIEW.xmin)); e <= Math.ceil(Math.log10(VIEW.xmax)); e++)
      for (let k = 2; k <= 9; k++){ const v = k*Math.pow(10, e); if (v >= VIEW.xmin && v <= VIEW.xmax) out.push(v); }
    return out.filter(v => !VIEW.xticks.includes(v));
  }
  for (let xv = VIEW.xmin; xv <= VIEW.xmax; xv += VIEW.xminor) if (!VIEW.xticks.includes(xv)) out.push(xv);
  return out;
}
function xTickLabel(xt){
  if (VIEW.xaxis === 'log'){ const e = Math.log10(xt); if (Math.abs(e - Math.round(e)) < 1e-9) return powLabel(Math.round(e)); }
  return String(xt);
}
// y ticks: explicit display.yTicks per spectrum, else the automatic log/linear ticks
function yMajorTicks(spec, rLo, rHi){
  if (VIEW.yTicks && VIEW.yTicks[spec]) return VIEW.yTicks[spec];
  return VIEW.yLog[spec] ? logTicks(rLo, rHi) : linTicks(rLo, rHi);
}
// a y tick whose number is suppressed (display.yHideLabels); the tick mark is still drawn
const yLabelHidden = (spec, v) => !!(VIEW.yHideLabels && VIEW.yHideLabels[spec] && VIEW.yHideLabels[spec].some(h => Math.abs(h - v) < 1e-9));
function yMinorStep(spec, rLo, rHi){
  const t = VIEW.yTicks && VIEW.yTicks[spec];
  return t && t.length > 1 ? (t[1] - t[0]) / 3 : linStep(rLo, rHi) / 5;
}
function makeYPix(spec, Y0, Y1, range){
  const [a,b] = range;
  if (VIEW.yLog[spec]){
    const la=Math.log10(a), lb=Math.log10(b);
    return (v) => { const vv = Math.max(a, Math.min(b, Math.abs(v))); return Y1 - (Math.log10(vv)-la)/(lb-la)*(Y1-Y0); };
  }
  return (v) => { const vv = Math.max(a, Math.min(b, v)); return Y1 - (vv-a)/(b-a)*(Y1-Y0); };
}
function fmtYTick(spec, v){
  if (!VIEW.yLog[spec] && VIEW.yTickDigits != null) return v.toFixed(VIEW.yTickDigits);
  if (!VIEW.yLog[spec]){ if (Math.abs(v) < 1e-9) return '0'; return (+v.toFixed(3)).toString(); }
  const e = Math.round(Math.log10(v));
  return e===0 ? '1' : powLabel(e);
}
// Power-of-ten tick labels are typeset rather than written with Unicode superscripts: "10" at full size, the
// exponent in ordinary digits with a true minus (U+2212), smaller and raised, as in the axis titles
// (drawTitleParts). Text fonts such as Times lack most superscript characters (⁻, ⁰, ⁴-⁹); browsers substitute
// those from a fallback font at a different height, so the minus and ¹²³ drifted out of line.
const SUP_SCALE = 0.70, SUP_RAISE = 0.36;      // exponent size and baseline raise, in units of the label size
const powLabel = (e) => ({ base:'10', exp:String(e).replace('-', '−') });
// canvas: draw a tick label (a string, or a powLabel) honoring the context's textAlign / textBaseline; `size` is
// the font size in px. The "10" lands exactly where the whole label used to be anchored.
function fillTickLabel(g, label, x, y, size){
  if (typeof label === 'string'){ g.fillText(label, x, y); return; }
  const font = g.font, align = g.textAlign, mode = g.textBaseline, supFont = `${size*SUP_SCALE}px ${FONT}`;
  const topAtMode = g.measureText(label.base).actualBoundingBoxAscent;
  g.textBaseline = 'alphabetic';
  const yb = y - topAtMode + g.measureText(label.base).actualBoundingBoxAscent;   // alphabetic baseline of the "10"
  const wB = g.measureText(label.base).width;
  g.font = supFont; const wE = g.measureText(label.exp).width;
  const x0 = align === 'right' || align === 'end' ? x - wB - wE : align === 'center' ? x - (wB + wE)/2 : x;
  g.textAlign = 'left';
  g.font = font;    g.fillText(label.base, x0, yb);
  g.font = supFont; g.fillText(label.exp, x0 + wB, yb - size*SUP_RAISE);
  g.font = font; g.textAlign = align; g.textBaseline = mode;
}
// SVG: the same label as one <text> (so text-anchor positions the whole thing) with a raised, smaller <tspan>
function svgTickLabel(label, x, y, size, anchor){
  const open = `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}">`;
  if (typeof label === 'string') return `${open}${svgEsc(label)}</text>`;
  return `${open}${label.base}<tspan dy="${(-size*SUP_RAISE).toFixed(2)}" font-size="${(size*SUP_SCALE).toFixed(2)}">${label.exp}</tspan></text>`;
}
const polar = (cx,cy,r,deg) => { const a = deg*Math.PI/180; return { x:+(cx + r*Math.cos(a)).toFixed(2), y:+(cy + r*Math.sin(a)).toFixed(2) }; };
function svgEsc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function tstamp(){ const d=new Date(), p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }
function downloadBlob(blob, name){
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}

// ---- backend selection: shared across all instances ------------------------
let _backendPromise = null;
function initBackend(){
  if (_backendPromise) return _backendPromise;
  _backendPromise = (async () => {
    const WASM_PATHS = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.15.0/dist/';
    try {
      if (window.tf?.wasm?.setWasmPaths) tf.wasm.setWasmPaths(WASM_PATHS);
      await tf.setBackend('wasm'); await tf.ready();
      if (tf.getBackend() !== 'wasm') throw new Error('wasm backend did not activate');
    } catch (e) {
      console.warn('[emulator] WASM backend unavailable, falling back:', e);
      for (const b of ['webgl', 'cpu']) { try { await tf.setBackend(b); await tf.ready(); if (tf.getBackend() === b) break; } catch (e2) {} }
    }
    console.info('[emulator] tfjs backend:', tf.getBackend());
  })();
  return _backendPromise;
}

// ============================================================================
export function createCMBPlot(root, config){
  // Select the emulator backend + its metadata BEFORE building cfg (cfg reads META).
  const backend = BACKENDS[config.model || 's3'];
  if (!backend) throw new Error(`createCMBPlot: unknown model '${config.model}'`);
  const CMBEmulator = backend.Emulator, META = backend.META;
  const cfg = {
    modelUrls: config.modelUrls,
    dataUrl:   config.dataUrl || null,
    lcdmUrl:   config.lcdmUrl || null,
    sliders:   config.sliders || META.inputNames.slice(),
    ranges:    config.ranges || {},
    derive:    config.derive || null,
    model:     config.model || 's3',
    xaxis:     config.xaxis || 'linear',
    constrainThetaS: config.constrainThetaS || false,
    showMatterPie: config.showMatterPie || false,
    showPie:       config.showPie       !== false,
    showDerived:   config.showDerived   !== false,
    showSave:      config.showSave       !== false,
    showLegend:    config.showLegend     !== false,
    showDataToggles: config.showDataToggles !== false,
  };

  // ---- per-instance state --------------------------------------------------
  let SS = 1;
  // text/line scale for a figure W px wide, relative to the standard 600-660px figure (render and exports)
  const figScale = (W) => Math.max(0.8, Math.min(1.6, Math.min(W, 660)/600));
  let emulator = null, OBS = null, LCDM = null;
  // config.start: initial (and Reset) values for slider params, e.g. { M_nu: 0.06 } (Planck's baseline)
  const params = Object.assign({}, META.defaults, config.fixed || {}, config.start || {});
  if (cfg.derive) cfg.derive(params);
  const disp = config.display || {};
  const specs = disp.specs || META.specs || SPECS;     // panels, top to bottom
  const VIS = { ref2:true, lcdm:true, planck:true, act:true, spt:true };
  // data points: drawn when a dataUrl is given, unless display.dataPoints === false (data loaded only for
  // display.errorBand)
  const showPoints = !!cfg.dataUrl && disp.dataPoints !== false && !disp.dataSets;
  if (!showPoints){ VIS.planck = VIS.act = VIS.spt = false; }
  // display.dataSets: a per-widget list of datasets in dataUrl's OBS[spec][key], replacing the fixed Planck/ACT/SPT
  // points. Each { key, label, color, kind:'points'|'limit' }. 'points' rows: [l, D, err_lo, err_hi, lmin, lmax]
  // (lmin/lmax null = no x-bar); 'limit' rows: [lmin, lmax, D95] drawn as a solid bar across the bin with a downward arrow. On a log
  // axis any value <= the axis floor (negative D, or a lower error end <= 0) is drawn at the floor.
  const dsets = (cfg.dataUrl && disp.dataSets) || [];
  for (const ds of dsets) VIS[ds.key] = true;
  const refLabel = disp.referenceLabel || 'ΛCDM';
  // display.errorBand: one band or a list, each { specs (or spec), source, url, label, shade }; drawn in list
  // order, each with its own legend checkbox (VIS.band0, band1, ...)
  const bands = [].concat(disp.errorBand || []).map((b, i) =>
    Object.assign({ key:`band${i}`, specs: b.specs || [b.spec], source:'planck', shade:'light' }, b));
  for (const b of bands) VIS[b.key] = true;
  const BAND_OBS = {};                                  // band.url -> its loaded data file
  const legendPos = disp.legendPos || 'top-right';
  const extraRef = disp.extraReference || null;         // { label, params } second reference curve
  let REF2 = null;

  // ---- per-instance view (config.display) ----------------------------------
  // display = {
  //   transform : (spec, ell[], value[]) => value[],   // applied to every displayed curve (model + reference)
  //   normalize : { extremum:n, lmin, lmax },           // scale each curve so its n-th extremum (0-based,
  //                                                     //  in [lmin,lmax]) matches the reference's
  //   reference : 'model',                              // reference curve = this emulator at the defaults
  //                                                     //  (+ fixed, derive), not lcdmUrl
  //   yLog, yRange, ySym, yTitle : per-spectrum overrides; letter : export title symbol
  //   xRange:[lo,hi], xTicks:[...], xMinor
  //   specs     : ['tt','ee','pp'] panel spectra (default META.specs or TT/EE/TE)
  //   reference : 'unity' draws a dotted line at 1 (ratio plots); referenceLabel names it in the legend
  //   yFixed    : true keeps yRange exactly; yTicks:{spec:[...]}, yTickDigits for fixed tick labels
  //   yHideLabels: {spec:[values]} y ticks drawn without a number (main panels only), e.g. a label that
  //               would collide with the neighbouring panel's
  //   dataPoints: false loads dataUrl without drawing points (for errorBand only)
  //   errorBand : { specs:['tt','ee'], source:'planck', label, shade:'light', url } fills the envelope
  //               between (D+s+)/D and (D-s-)/D of that dataset (shade 'light' | 'dark' grey, 'act' light
  //               green; 'light' and 'act' are opaque with darker edge lines; legend: a shaded box). url: a local data file with the same layout as dataUrl
  //               (default: dataUrl's). A list draws several bands in order, e.g. Planck light then ACT on top.
  //   legendPos : 'top-right' (default) | 'top-left' | 'bottom-right' | 'bottom-left' of the top panel
  //   legendCompact: true draws the legend tighter (less padding and row spacing, smaller type, closer to the
  //               panel corner), on screen and in exports, for long legends (the tensor page's seven rows)
  //   extraReference: { label, params } a second black reference curve: this emulator at params (+ fixed,
  //               derive), e.g. the LCDM baseline M_nu = 0.06 eV on the mass graph
  //   exportTitle: { spec: [ {t, it, sub, sup}, ... ] } rich-text y titles for PNG/SVG export
  //   pie       : { title, symbol, wedges:(result, params) => [{sub, color, frac}] } an extra pie
  //   aspect    : canvas height / width (default 1.19)
  //   zoom      : { range:[lo,hi], xTicks, xMinor, width:0.36, band:true }
  //               adds a narrower zoom column beside the three panels (same spectra, l in range,
  //               y-range fixed across the slider) and shades the range on the main panels.
  //               Below ~610 px canvas width the zoom panels stack under the main ones instead.
  // }
  const view = {
    yLog:   Object.assign({}, VIEW_DEFAULT.yLog,   disp.yLog),
    yRange: Object.assign({}, VIEW_DEFAULT.yRange, disp.yRange),
    ySym:   Object.assign({}, VIEW_DEFAULT.ySym,   disp.ySym),
    yTitle: Object.assign({}, VIEW_DEFAULT.yTitle, disp.yTitle),
    xmin:   disp.xRange ? disp.xRange[0] : VIEW_DEFAULT.xmin,
    xmax:   disp.xRange ? disp.xRange[1] : VIEW_DEFAULT.xmax,
    xticks: disp.xTicks || VIEW_DEFAULT.xticks,
    xminor: disp.xMinor || VIEW_DEFAULT.xminor,
    letter: disp.letter || VIEW_DEFAULT.letter,
    yFixed: !!disp.yFixed, yTicks: disp.yTicks || null, yTickDigits: disp.yTickDigits ?? null,
    refDash: disp.reference === 'unity',
    yHideLabels: disp.yHideLabels || null,
    xaxis: cfg.xaxis,
  };
  function applyView(){ VIEW = view; }
  // display.xBySpec: { spec: { xaxis, xRange, xTicks, xMinor, logFrac, xDivider } } gives a panel its own
  // l axis. Adjacent panels with the same axis share it (tick numbers under the last of them); a gap
  // separates panels with different axes. Without it every panel uses the widget's axis (unchanged).
  const specView = {};
  for (const spec of specs){
    const o = disp.xBySpec && disp.xBySpec[spec];
    if (!o){ specView[spec] = view; continue; }
    const xaxis = o.xaxis || view.xaxis;
    specView[spec] = Object.assign({}, view, {
      xaxis,
      xmin: o.xRange ? o.xRange[0] : view.xmin, xmax: o.xRange ? o.xRange[1] : view.xmax,
      xticks: o.xTicks || view.xticks, xminor: o.xMinor || view.xminor,
      xticksLL: xaxis === 'loglin' ? (o.xTicks || null) : null, llMinors: xaxis === 'loglin',
      logFrac: o.logFrac || null, xDivider: !!o.xDivider, _ll: null,
    });
  }
  const axisKey = (v) => [v.xaxis, v.xmin, v.xmax, v.logFrac, String(v.xticksLL || v.xticks)].join('|');
  const zoom = disp.zoom || null;
  const ASPECT = disp.aspect || 1.19, ASPECT_STACKED = 2.6, STACK_BELOW_W = 610;
  // the zoom column's own view: same spectra/scales, its l window, a y-range fixed by buildZoomRanges()
  const zoomView = zoom ? Object.assign({}, view, {
    xaxis: 'linear', xmin: zoom.range[0], xmax: zoom.range[1],
    xticks: zoom.xTicks || [zoom.range[0], zoom.range[1]], xminor: zoom.xMinor || 50,
    yRange: Object.assign({}, view.yRange), yFixed: true, yHideLabels: null,
  }) : null;
  const isStacked = (W) => !!zoom && W < STACK_BELOW_W;
  const REF_EXT = {};   // reference curve's normalization extremum, per spectrum

  // n-th local extremum of a sampled curve within [lmin, lmax] (extrema closer than 15 in l are merged).
  function extremumValue(c, n, lmin, lmax){
    let count = 0, lastL = -Infinity;
    for (let i = 1; i < c.ell.length - 1; i++){
      const l = c.ell[i]; if (l < lmin || l > lmax) continue;
      const d1 = c.value[i] - c.value[i-1], d2 = c.value[i+1] - c.value[i];
      if (d1 * d2 < 0){
        if (l - lastL < 15) continue;
        if (count === n) return c.value[i];
        count++; lastL = l;
      }
    }
    return null;
  }
  // The curve actually drawn for one spectrum: D_l in 10^3 uK^2 on [2, xmax], then the optional
  // display transform and normalization.
  const isLogAxis = (v) => v.xaxis === 'log' || v.xaxis === 'loglin';
  const denseSpec = (spec) => isLogAxis(specView[spec] || view);
  function displayCurve(result, spec, { normalize = true } = {}){
    const lmax = Math.min(4030, view.xmax);
    const c = emulator.curveFrom(result, spec, { quantity:'Dl', lmin:2, lmax, uK2:true, scale:1e-3,
                                                 ells: denseSpec(spec) ? denseElls(2, lmax) : undefined });
    if (disp.transform) c.value = disp.transform(spec, c.ell, c.value);
    const nm = disp.normalize;
    if (normalize && nm && REF_EXT[spec] != null){
      const e = extremumValue(c, nm.extremum, nm.lmin, nm.lmax);
      if (e) { const k = REF_EXT[spec] / e; c.value = c.value.map(v => v * k); }
    }
    return c;
  }
  // The lcdmUrl reference (emulator/data/lcdm_<backend>.json) holds CLASS at the backend's fiducial on the
  // backend's own l grid, so it gets the model curve's treatment: the same natural spline, sampled at the same
  // l (dense on log / log-linear panels, every integer otherwise). At default sliders the two curves then
  // differ only by the emulator's error at its l values.
  let LCDM_REF = {};
  function buildLCDMReference(){
    const lmax = Math.min(4030, view.xmax);
    LCDM_REF = {};
    for (const spec of specs){
      if (!LCDM[spec]) continue;
      const f = makeSpline(LCDM.ell, LCDM[spec]);
      const ell = denseSpec(spec) ? denseElls(2, lmax) : Array.from({ length: lmax - 1 }, (_, i) => i + 2);
      LCDM_REF[spec] = { ell, value: ell.map(f) };
    }
  }
  const refCurve = (spec) => LCDM_REF[spec] || { ell: LCDM.ell, value: LCDM[spec] };
  // Reference = a flat line at 1 (ratio plots), drawn dotted.
  function buildUnityReference(){
    const ell = []; for (let l = 2; l <= 4030; l++) ell.push(l);
    const ref = { ell }; for (const spec of specs) ref[spec] = ell.map(() => 1);
    LCDM = ref;
  }
  function buildExtraReference(){
    applyView();
    const p = Object.assign({}, META.defaults, config.fixed || {}, extraRef.params);
    if (cfg.derive) cfg.derive(p);
    const r = emulator.predict(p), ref = {};
    for (const spec of specs){ const c = displayCurve(r, spec, { normalize:false }); ref.ell = c.ell; ref[spec] = c.value; }
    REF2 = ref;
  }
  // Reference drawn as the black 'LCDM' curve when display.reference === 'model'.
  function buildModelReference(){
    applyView();
    const fid = Object.assign({}, META.defaults, config.fixed || {});
    if (cfg.derive) cfg.derive(fid);
    const r = emulator.predict(fid);
    const ref = {};
    for (const spec of specs){
      const c = displayCurve(r, spec, { normalize:false });
      ref.ell = c.ell; ref[spec] = c.value;
      if (disp.normalize) REF_EXT[spec] = extremumValue(c, disp.normalize.extremum, disp.normalize.lmin, disp.normalize.lmax);
    }
    LCDM = ref;
  }
  // Fixed zoom y-ranges: extent of every displayed curve inside the zoom window across each slider's
  // range (21 samples, other params at defaults) plus the reference, padded 5%. Fixed so the zoom axes
  // never jump while the slider moves.
  function buildZoomRanges(){
    applyView();
    const lo = {}, hi = {};
    for (const spec of specs){ lo[spec] = Infinity; hi[spec] = -Infinity; }
    const take = (c, spec) => {
      for (let i = 0; i < c.ell.length; i++){
        const l = c.ell[i]; if (l < zoom.range[0] || l > zoom.range[1]) continue;
        lo[spec] = Math.min(lo[spec], c.value[i]); hi[spec] = Math.max(hi[spec], c.value[i]);
      }
    };
    if (LCDM) for (const spec of specs) take(refCurve(spec), spec);
    for (const name of cfg.sliders){
      const [a, b] = cfg.ranges[name] || META.ranges[name];
      for (let k = 0; k <= 20; k++){
        const p = Object.assign({}, META.defaults, config.fixed || {}); p[name] = a + (b - a)*k/20;
        if (cfg.derive) cfg.derive(p);
        const r = emulator.predict(p);
        for (const spec of specs) take(displayCurve(r, spec), spec);
      }
    }
    for (const spec of specs){ const pad = 0.05*(hi[spec] - lo[spec]); zoomView.yRange[spec] = [lo[spec] - pad, hi[spec] + pad]; }
  }
  const numEls = {}, ylabelEls = {}, zlabelEls = {}, derEls = {};
  let extraPieSvgEl = null;
  let xlabelEl = null, zxlabelEl = null, pieSvgEl = null, matterPieSvgEl = null, legendEl = null;

  // ---- build DOM inside root ----------------------------------------------
  root.innerHTML = '';
  const widget = document.createElement('div'); widget.className = zoom ? 'emu-widget emu-widget--zoom' : 'emu-widget';
  const wrap   = document.createElement('div'); wrap.className='emu-plot-wrap';
  const cv     = document.createElement('canvas');
  const axisOverlay = document.createElement('div'); axisOverlay.className='emu-axis-overlay';
  const statusEl    = document.createElement('div'); statusEl.className='emu-status'; statusEl.textContent='loading model…';
  wrap.append(cv, axisOverlay, statusEl);
  wrap.style.setProperty('--emu-aspect', ASPECT);   // the CSS height fit (side-by-side layout) needs the shape
  const slidersHost = document.createElement('div'); slidersHost.className='emu-sliders';
  widget.append(wrap, slidersHost);
  root.append(widget);
  const ctx = cv.getContext('2d');

  // ---- sliders + sidebar ---------------------------------------------------
  function setFill(input){
    const lo = +input.min, hi = +input.max, v = +input.value;
    const pct = ((v - lo) / (hi - lo)) * 100;
    input.style.setProperty('--fill', pct + '%');   // the gradient itself is in cmb-plot.css
  }
  function buildSliders(){
    for (const name of cfg.sliders){
      const [lo,hi] = cfg.ranges[name] || META.ranges[name];
      const w = document.createElement('div'); w.className='emu-slider';
      const val = document.createElement('div'); val.className='emu-slider-value';
      const lab = document.createElement('span'); lab.innerHTML = LABELS[name] + ' =';
      const num = document.createElement('span'); num.className='emu-num';
      num.textContent = fmt(name, params[name]);
      val.append(lab, num);
      const r = document.createElement('input');
      // 500 steps. Round the step to 12 significant digits: (hi-lo)/500 can come out a hair too large in
      // binary (e.g. 6.8/500 = 0.013600000000000001), so 500 steps overshoot hi and the browser stops the
      // thumb one step short of the maximum (N_eff ended at 6.8864 instead of 6.9).
      r.type='range'; r.min=lo; r.max=hi; r.step=Number(((hi-lo)/500).toPrecision(12)); r.value=params[name];
      setFill(r);
      r.addEventListener('input', () => {
        params[name] = parseFloat(r.value);
        num.textContent = fmt(name, params[name]);
        setFill(r);
        scheduleRender();
      });
      w.append(val, r); slidersHost.append(w);
      numEls[name] = { num, input:r };
    }

    // button row: Reset (+ optional Save split-button)
    const row = document.createElement('div'); row.className='emu-btn-row';
    const btn = document.createElement('button');
    btn.className='emu-reset'; btn.textContent='Reset to Planck ΛCDM';
    btn.addEventListener('click', () => {
      Object.assign(params, META.defaults, config.fixed || {}, config.start || {});
      if (cfg.derive) cfg.derive(params);
      for (const name of cfg.sliders){
        numEls[name].input.value = params[name];
        numEls[name].num.textContent = fmt(name, params[name]);
        setFill(numEls[name].input);
      }
      render();
    });
    row.append(btn);

    if (cfg.showSave){
      const save = document.createElement('div'); save.className='emu-save';
      const main = document.createElement('button'); main.className='emu-save-main'; main.textContent='Save plot';
      main.addEventListener('click', () => savePNG(false));
      const caret = document.createElement('button'); caret.className='emu-save-caret'; caret.innerHTML='▾';
      const menu = document.createElement('div'); menu.className='emu-save-menu';
      const item = (label, fn) => { const b=document.createElement('button'); b.textContent=label;
        b.addEventListener('click', () => { menu.classList.remove('open'); fn(); }); return b; };
      menu.append(
        item('Download PNG', () => savePNG(false)),
        item('Download SVG (vector)', () => saveSVG()),
        item('Open PNG in new tab', () => savePNG(true)),
      );
      caret.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('open'); });
      document.addEventListener('click', () => menu.classList.remove('open'));
      save.append(main, caret, menu);
      row.append(save);
    }
    slidersHost.append(row);

    // mobile-only data toggles: the legend's entries as a "Data shown" row (touch devices hide the on-plot
    // legend; cmb-plot.css), so everything the legend controls stays selectable
    if (cfg.showDataToggles){
      const mtog = document.createElement('div'); mtog.className='emu-mobile-toggles';
      mtog.innerHTML = '<h4>Data shown</h4>';
      const mkTog = (key, label, mark) => {
        const l = document.createElement('label');
        const cb = document.createElement('input'); cb.type='checkbox'; cb.checked=VIS[key]; cb.dataset.key=key;
        cb.addEventListener('change', () => {
          VIS[key] = cb.checked;
          const lg = legendEl && legendEl.querySelector(`input[data-key="${key}"]`);
          if (lg) lg.checked = cb.checked;
          render();
        });
        const sw = document.createElement('span'); sw.className = legSwatchClass(mark);
        swatches.push([sw, key, mark]);
        const tx = document.createElement('span'); tx.textContent=label;
        l.append(cb, sw, tx); return l;
      };
      mtog.append(...legendRows().map(([key, label, , mark]) => mkTog(key, label, mark)));
      slidersHost.append(mtog);
    }

    if (cfg.showPie){
      const pies = document.createElement('div'); pies.className='emu-pies';
      const pie = document.createElement('div'); pie.className='emu-pie';
      pie.innerHTML = '<h4>Energy densities</h4><div class="emu-pie-svg"></div>';
      pies.append(pie);
      pieSvgEl = pie.querySelector('.emu-pie-svg');
      if (cfg.showMatterPie){
        const mpie = document.createElement('div'); mpie.className='emu-pie';
        mpie.innerHTML = '<h4>Matter density</h4><div class="emu-pie-svg"></div>';
        pies.append(mpie);
        matterPieSvgEl = mpie.querySelector('.emu-pie-svg');
      }
      slidersHost.append(pies);
    }

    if (disp.pie){                       // an extra pie computed from the model result (display.pie)
      const pies = document.createElement('div'); pies.className='emu-pies';
      const pie = document.createElement('div'); pie.className='emu-pie';
      pie.innerHTML = `<h4>${svgEsc(disp.pie.title || '')}</h4><div class="emu-pie-svg"></div>`;
      pies.append(pie); slidersHost.append(pies);
      extraPieSvgEl = pie.querySelector('.emu-pie-svg');
    }

    if (cfg.showDerived){
      const der = document.createElement('div'); der.className='emu-derived';
      const cell = (label, key) => `<div class="cell"><span>${label}</span><span class="eq">=</span><b data-der="${key}">–</b></div>`;
      der.innerHTML = '<h4>Derived parameters</h4><div class="emu-derived-grid">' +
        cell('\\(\\sigma_8\\)','sigma8') +
        cell('\\(100\\,\\theta_s\\)','theta') +
        cell('\\(Y_{\\rm He}\\)','yhe') +
        cell('\\(z_{\\rm reio}\\)','zreio') +
        cell('\\(H_0\\)','h') +
        '</div>';
      slidersHost.append(der);
      der.querySelectorAll('[data-der]').forEach(el => { derEls[el.dataset.der] = el; });
    }

    if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([slidersHost]);
  }

  // ---- axis-title overlays (real LaTeX via MathJax) -----------------------
  function buildOverlays(){
    for (const spec of specs){
      const d = document.createElement('div'); d.className='emu-ylabel';
      const s = document.createElement('span'); s.innerHTML = view.yTitle[spec];
      d.append(s); axisOverlay.append(d); ylabelEls[spec] = d;
    }
    xlabelEl = document.createElement('div'); xlabelEl.className='emu-xlabel';
    xlabelEl.innerHTML = '\\(\\ell\\)'; axisOverlay.append(xlabelEl);
    if (zoom){
      for (const spec of specs){              // y-titles for the zoom panels (shown only when stacked)
        const d = document.createElement('div'); d.className='emu-ylabel';
        const s = document.createElement('span'); s.innerHTML = view.yTitle[spec];
        d.append(s); axisOverlay.append(d); zlabelEls[spec] = d;
      }
      zxlabelEl = document.createElement('div'); zxlabelEl.className='emu-xlabel';
      zxlabelEl.innerHTML = '\\(\\ell\\)'; axisOverlay.append(zxlabelEl);
    }
    if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([axisOverlay]);
  }
  function placeOverlays(geoms, W, H, padL){
    const stacked = isStacked(W);
    for (const g of geoms){
      if (g.col === 'zoom' && !stacked){ zlabelEls[g.spec].style.display = 'none'; continue; }
      const el = g.col === 'zoom' ? zlabelEls[g.spec] : ylabelEls[g.spec];
      el.style.display = '';
      el.style.top = g.Y0 + 'px'; el.style.height = (g.Y1 - g.Y0) + 'px'; el.style.width = '24px';
    }
    const main = geoms.filter(g => g.col !== 'zoom'), zm = geoms.filter(g => g.col === 'zoom');
    if (xlabelEl){
      xlabelEl.style.left = padL + 'px';
      xlabelEl.style.width = (zoom ? main[0].X1 - padL : W - padL - 12) + 'px';
      if (stacked){ xlabelEl.style.bottom = 'auto'; xlabelEl.style.top = (main[main.length-1].Y1 + 18*SS) + 'px'; }
      else { xlabelEl.style.top = 'auto'; xlabelEl.style.bottom = '-12px'; }
    }
    if (zxlabelEl){
      zxlabelEl.style.left = zm[0].X0 + 'px'; zxlabelEl.style.width = (zm[0].X1 - zm[0].X0) + 'px';
      zxlabelEl.style.bottom = '-12px';
    }
  }

  // ---- canvas sizing (portrait, retina) -----------------------------------
  function resize(){
    const cssW = wrap.clientWidth;
    widget.style.setProperty('--emu-k', Math.min(1, cssW / FIG_W).toFixed(4));   // sidebar scale (side by side)
    const cssH = Math.round(cssW * (isStacked(cssW) ? ASPECT_STACKED : ASPECT));
    const dpr = window.devicePixelRatio || 1;
    cv.style.height = cssH + 'px';
    cv.width  = cssW * dpr; cv.height = cssH * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return { W:cssW, H:cssH };
  }
  window.addEventListener('resize', () => { if (emulator) render(); });

  // ---- draw one panel -----------------------------------------------------
  function drawPanel(g, spec, geom, isBottom, range, curve){
    const { X0, X1, Y0, Y1 } = geom;
    const yPix = makeYPix(spec, Y0, Y1, range);
    const [rLo, rHi] = range;
    const majorY = yMajorTicks(spec, rLo, rHi);

    g.strokeStyle = PAL.ink; g.lineWidth = STYLE.frameWidth*SS;
    g.strokeRect(X0, Y0, X1-X0, Y1-Y0);

    const tickLen = 6*SS, minorLen = 3.2*SS;
    g.fillStyle=PAL.ink; g.strokeStyle=PAL.ink; g.lineWidth=STYLE.frameWidth*SS;

    for (const xv of xMinorTicks()){
      const x=xPix(xv,X0,X1);
      g.beginPath(); g.moveTo(x,Y1); g.lineTo(x,Y1-minorLen); g.stroke();
      g.beginPath(); g.moveTo(x,Y0); g.lineTo(x,Y0+minorLen); g.stroke();
    }
    g.textAlign='center'; g.font = `${STYLE.tickFont*SS}px ${FONT}`;
    for (const xt of xMajorTicks()){
      const x = xPix(xt, X0, X1);
      g.beginPath(); g.moveTo(x,Y1); g.lineTo(x,Y1-tickLen); g.stroke();
      g.beginPath(); g.moveTo(x,Y0); g.lineTo(x,Y0+tickLen); g.stroke();
      if (isBottom){ g.textBaseline='top'; fillTickLabel(g, xTickLabel(xt), x, Y1+6*SS, STYLE.tickFont*SS); }
    }

    g.textAlign='right'; g.textBaseline='middle';
    for (const yt of majorY){
      if (yt<rLo-1e-12 || yt>rHi+1e-12) continue;
      const y = yPix(yt);
      g.strokeStyle=PAL.ink; g.beginPath(); g.moveTo(X0,y); g.lineTo(X0+tickLen,y); g.stroke();
      if (!yLabelHidden(spec, yt)){ g.fillStyle=PAL.ink; fillTickLabel(g, fmtYTick(spec, yt), X0-6*SS, y, STYLE.tickFont*SS); }
    }

    g.strokeStyle=PAL.ink; g.lineWidth=STYLE.frameWidth*SS;
    if (VIEW.yLog[spec]){
      for (let e=Math.floor(Math.log10(rLo)); e<=Math.ceil(Math.log10(rHi)); e++){
        for (const s of [0.3,0.6,0.9]){
          const v=s*Math.pow(10,e+1); if (v<rLo||v>rHi) continue;
          const y=yPix(v); g.beginPath(); g.moveTo(X0,y); g.lineTo(X0+minorLen,y); g.stroke();
        }
      }
    } else {
      const minorStep = yMinorStep(spec, rLo, rHi);
      for (let v=Math.ceil(rLo/minorStep)*minorStep; v<=rHi+1e-9; v+=minorStep){
        if (majorY.some(mt=>Math.abs(mt-v)<1e-9)) continue;
        const y=yPix(v); g.beginPath(); g.moveTo(X0,y); g.lineTo(X0+minorLen,y); g.stroke();
      }
    }

    g.save();
    g.beginPath(); g.rect(X0,Y0,X1-X0,Y1-Y0); g.clip();
    if (VIEW.xDivider && VIEW.xaxis === 'loglin'){   // dashed line where the l axis turns log -> linear
      const xd = xPix(LL_L0, X0, X1);
      g.strokeStyle = PAL.divider; g.lineWidth = 1.0*SS; g.setLineDash([4*SS, 3*SS]);
      g.beginPath(); g.moveTo(xd, Y0); g.lineTo(xd, Y1); g.stroke(); g.setLineDash([]);
    }
    if (geom.band){                       // shade the zoom column's l window on the main panels
      const bx0 = xPix(geom.band[0],X0,X1), bx1 = xPix(geom.band[1],X0,X1);
      g.fillStyle = PAL.band; g.fillRect(bx0, Y0, bx1-bx0, Y1-Y0);
    }
    for (const b of bands){                      // relative data errors, e.g. Planck (D +/- sigma)/D, filled
      const env = errBandPolygon(spec, b);
      if (!env) continue;
      g.fillStyle = PAL.errband[b.shade]; g.beginPath();
      env.forEach(([l, v], k) => { const x=xPix(l,X0,X1), y=yPix(v); k ? g.lineTo(x,y) : g.moveTo(x,y); });
      g.closePath(); g.fill();
    }
    for (const b of bands){                      // then every band's upper and lower edge, over all the fills
      const edge = PAL.errbandEdge[b.shade];
      if (!edge) continue;
      g.strokeStyle = edge; g.lineWidth = 1.0*SS;
      for (const line of errBandLines(spec, b)){
        g.beginPath(); line.forEach(([l, v], k) => { const x=xPix(l,X0,X1), y=yPix(v); k ? g.lineTo(x,y) : g.moveTo(x,y); }); g.stroke();
      }
    }

    if (LCDM && VIS.lcdm){
      g.strokeStyle=PAL.lcdm; g.lineWidth=STYLE.lcdmWidth*SS; g.globalAlpha=0.9;
      if (VIEW.refDash) g.setLineDash([2*SS, 3*SS]);
      g.beginPath(); let started=false;
      const ref = refCurve(spec);
      for (let i=0;i<ref.ell.length;i++){
        const l=ref.ell[i]; if (l<VIEW.xmin||l>VIEW.xmax) continue;
        const x=xPix(l,X0,X1), y=yPix(ref.value[i]);
        started ? g.lineTo(x,y) : (g.moveTo(x,y), started=true);
      }
      g.stroke(); g.setLineDash([]); g.globalAlpha=1;
    }
    if (REF2 && VIS.ref2){                         // second reference curve (solid), e.g. LCDM at M_nu = 0.06 eV
      g.strokeStyle=PAL.lcdm; g.lineWidth=STYLE.lcdmWidth*SS; g.globalAlpha=0.9;
      g.beginPath(); let started=false;
      for (let i=0;i<REF2.ell.length;i++){
        const l=REF2.ell[i]; if (l<VIEW.xmin||l>VIEW.xmax) continue;
        const x=xPix(l,X0,X1), y=yPix(REF2[spec][i]);
        started ? g.lineTo(x,y) : (g.moveTo(x,y), started=true);
      }
      g.stroke(); g.globalAlpha=1;
    }

    g.strokeStyle=PAL.model; g.lineWidth=STYLE.modelWidth*SS; g.lineJoin='round'; g.globalAlpha=0.95;
    g.beginPath();
    for (let i=0;i<curve.ell.length;i++){ const x=xPix(curve.ell[i],X0,X1), y=yPix(curve.value[i]); i? g.lineTo(x,y) : g.moveTo(x,y); }
    g.stroke(); g.globalAlpha=1;

    const logFloor = VIEW.yLog[spec] ? rLo : null;
    if (OBS && OBS[spec]){
      if (VIS.planck) drawData(g, OBS[spec].planck, PAL.data.planck, yPix, X0, X1, true,  logFloor);
      if (VIS.act)    drawData(g, OBS[spec].act,    PAL.data.act,    yPix, X0, X1, false, logFloor);
      if (VIS.spt)    drawData(g, OBS[spec].spt,    PAL.data.spt,    yPix, X0, X1, false, logFloor);
      for (const ds of dsets) if (VIS[ds.key]) drawDataSet(g, OBS[spec][ds.key], ds, yPix, X0, X1, logFloor);
    }
    g.restore();
  }

  // display.dataSets geometry, shared by the canvas and the SVG export: line segments [x0,y0,x1,y1], markers
  // [x,y] and limit arrows [x,y] (downward from the bar) in pixels. Values at or below the log-axis floor
  // (negative D, lower error ends <= 0) sit on the floor.
  function dataSetMarks(rows, ds, yPix, X0, X1, logFloor){
    const segs = [], dots = [], arrows = [];
    const atFloor = (v) => logFloor !== null && v <= logFloor ? logFloor : v;
    for (const row of rows || []){
      if (ds.kind === 'limit'){
        const [a, b, v] = row; if (b < VIEW.xmin || a > VIEW.xmax) continue;
        const y = yPix(atFloor(v)), xa = xPix(a,X0,X1), xb = xPix(b,X0,X1);
        segs.push([xa, y, xb, y]); arrows.push([(xa + xb)/2, y]); continue;
      }
      const [l, v, eLo, eHi, a, b] = row; if (l < VIEW.xmin || l > VIEW.xmax) continue;
      const x = xPix(l,X0,X1), y = yPix(atFloor(v));
      segs.push([x, yPix(atFloor(v + eHi)), x, yPix(atFloor(v - eLo))]);
      if (a != null && b != null) segs.push([xPix(a,X0,X1), y, xPix(b,X0,X1), y]);
      dots.push([x, y]);
    }
    return { segs, dots, arrows };
  }
  // upper-limit arrow: shaft down from (x, y), filled head; sizes in px (scaled by SS)
  const ARROW = { len:15, head:5.5, half:3.5 };
  function arrowShape(x, y, len = ARROW.len*SS){
    const h = ARROW.head*SS, w = ARROW.half*SS, yb = y + len;
    return { shaft: [x, y, x, yb - h], head: [[x - w, yb - h], [x + w, yb - h], [x, yb]] };
  }
  function drawArrow(g, x, y, len){
    const a = arrowShape(x, y, len);
    g.beginPath(); g.moveTo(a.shaft[0], a.shaft[1]); g.lineTo(a.shaft[2], a.shaft[3]); g.stroke();
    g.beginPath(); a.head.forEach(([px, py], k) => k ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath(); g.fill();
  }
  function svgArrow(x, y, color, sw, len){
    const a = arrowShape(x, y, len), f = (v) => v.toFixed(1);
    return `<line x1="${f(a.shaft[0])}" y1="${f(a.shaft[1])}" x2="${f(a.shaft[2])}" y2="${f(a.shaft[3])}" stroke="${color}" stroke-width="${sw}"/>`
         + `<polygon fill="${color}" points="${a.head.map(([px, py]) => `${f(px)},${f(py)}`).join(' ')}"/>`;
  }
  function drawDataSet(g, rows, ds, yPix, X0, X1, logFloor){
    const { segs, dots, arrows } = dataSetMarks(rows, ds, yPix, X0, X1, logFloor);
    const color = dsColor(ds);
    g.strokeStyle = color; g.fillStyle = color; g.globalAlpha = 0.85;
    g.lineWidth = (ds.kind === 'limit' ? STYLE.lcdmWidth*1.2 : STYLE.errWidth)*SS;
    for (const [x0,y0,x1,y1] of segs){ g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke(); }
    for (const [x,y] of arrows) drawArrow(g, x, y);
    for (const [x,y] of dots){ g.beginPath(); g.arc(x, y, STYLE.markerR*SS, 0, 2*Math.PI); g.fill(); }
    g.globalAlpha = 1;
  }

  // Error envelope for display.errorBand: a closed polygon, upper edge (D+s+)/D left to right then the
  // lower edge (D-s-)/D back, in l (null when not shown on this panel).
  function errBandPolygon(spec, band){
    const [up, lo] = errBandLines(spec, band);
    return up && up.length ? up.concat(lo.slice().reverse()) : null;
  }
  function errBandLines(spec, band){
    const data = band.url ? BAND_OBS[band.url] : OBS;
    if (!VIS[band.key] || !band.specs.includes(spec) || !data || !data[spec]) return [];
    // keep one bin beyond each edge of the l window so the lines reach the panel edges (clipped there)
    const all = (data[spec][band.source] || []).filter(r => r[1] > 0);
    const i0 = Math.max(0, all.findIndex(r => r[0] >= VIEW.xmin) - 1);
    let i1 = all.findIndex(r => r[0] > VIEW.xmax); i1 = i1 < 0 ? all.length : i1 + 1;
    const rows = all.slice(i0, i1);
    const asym = rows.length && rows[0].length > 3;
    return [ rows.map(r => [r[0], (r[1] + (asym ? r[3] : r[2])) / r[1]]), rows.map(r => [r[0], (r[1] - r[2]) / r[1]]) ];
  }
  function drawData(g, arr, color, yPix, X0, X1, asym, logFloor){
    if (!arr) return;
    g.strokeStyle=color; g.fillStyle=color; g.globalAlpha=0.85; g.lineWidth=STYLE.errWidth*SS;
    const R = STYLE.markerR*SS;
    for (const row of arr){
      const l=row[0]; if (l<VIEW.xmin||l>VIEW.xmax) continue;
      const x=xPix(l,X0,X1); const v=row[1]; const y=yPix(v);
      const eLo = row[2]; const eHi = asym ? row[3] : row[2];
      const vLo = logFloor!==null && (v-eLo) <= logFloor ? logFloor : (v-eLo);
      const vHi = logFloor!==null && (v+eHi) <= logFloor ? logFloor : (v+eHi);
      g.beginPath(); g.moveTo(x,yPix(vHi)); g.lineTo(x,yPix(vLo)); g.stroke();
      g.beginPath(); g.arc(x,y,R,0,2*Math.PI); g.fill();
    }
    g.globalAlpha=1;
  }

  // ---- legend entries (HTML legend, PNG and SVG export share this list) --------
  // [key, label, color, mark, edge]; mark: 'line' | 'dotted' | 'dot' | 'fill' (shaded box, edge: its border)
  function legendRows(){
    return [
      ...(extraRef ? [['ref2', extraRef.label || 'ΛCDM', PAL.lcdm, 'line']] : []),
      ['lcdm',  refLabel,    PAL.lcdm, VIEW.refDash || view.refDash ? 'dotted' : 'line'],
      ...bands.map(b => [b.key, b.label || 'Planck 2018 ±1σ', PAL.errband[b.shade], 'fill', PAL.errbandEdge[b.shade]]),
      ...(showPoints ? [
        ['planck','Planck 2018',    PAL.data.planck, 'dot'],
        ['act',   'ACT DR6',        PAL.data.act,    'dot'],
        ['spt',   'SPT-3g D1',      PAL.data.spt,    'dot'],
      ] : []),
      ...dsets.map(ds => [ds.key, ds.label, dsColor(ds), ds.kind === 'limit' ? 'limit' : 'dot']),
    ];
  }
  const legSwatchClass = (mark) => mark==='dot' ? 'emu-leg-dot' : mark==='fill' ? 'emu-leg-box' : mark==='limit' ? 'emu-leg-limit' : 'emu-leg-line';
  // HTML legend and mobile-toggle swatches, [element, key, mark]; painted at boot and on a theme change
  const swatches = [];
  function paintSwatches(){
    PAL = themePal();
    const colorOf = Object.fromEntries(legendRows().map(([key, , color]) => [key, color]));
    const edgeOf = Object.fromEntries(legendRows().map(([key, , , , edge]) => [key, edge]));
    for (const [sw, key, mark] of swatches){
      const color = colorOf[key] || PAL.data[key];
      if (mark==='dotted'){ sw.style.background = 'none'; sw.style.borderTop = `2px dotted ${color}`; sw.style.height = '0'; }
      else if (mark==='limit')   // bar with a downward arrow (upper limit)
        sw.innerHTML = `<svg viewBox="0 0 16 12" width="16" height="12"><line x1="1" y1="1.5" x2="15" y2="1.5" stroke="${color}" stroke-width="2"/>`
                     + `<line x1="8" y1="1.5" x2="8" y2="7" stroke="${color}" stroke-width="1.6"/><polygon fill="${color}" points="5,7 11,7 8,11.5"/></svg>`;
      else { sw.style.background = color;
        if (edgeOf[key]){ sw.style.boxSizing = 'border-box'; sw.style.border = `1px solid ${edgeOf[key]}`; } }
    }
  }
  // ---- HTML legend with dataset checkboxes (over the TT panel) ------------
  function buildLegend(){
    if (!cfg.showLegend) return;
    const box = document.createElement('div'); box.className='emu-legend';
    for (const [key,label,,mark] of legendRows()){
      const row = document.createElement('label'); row.className='emu-leg-row';
      const cb = document.createElement('input'); cb.type='checkbox'; cb.checked=VIS[key]; cb.dataset.key=key;
      cb.addEventListener('change', () => {
        VIS[key]=cb.checked;
        const mt = slidersHost.querySelector(`.emu-mobile-toggles input[data-key="${key}"]`);
        if (mt) mt.checked = cb.checked;
        render();
      });
      const sw = document.createElement('span');
      sw.className = legSwatchClass(mark);
      swatches.push([sw, key, mark]);
      const tx = document.createElement('span'); tx.textContent=label;
      row.append(cb, sw, tx); box.append(row);
    }
    if (disp.legendCompact) box.classList.add('emu-legend--compact');
    wrap.append(box); legendEl = box;
  }
  const LEG_INSET = disp.legendCompact ? 6 : 10, LEG_TOP = disp.legendCompact ? 4 : 6;   // px from the panel frame
  const LEG_ROW = disp.legendCompact ? 1.25 : 1.35;                                     // export row spacing (x font)
  const LEG_FONT = disp.legendCompact ? 0.94 : 1;                                       // export font scale
  function placeLegend(ttGeom, W){
    if (!legendEl) return;
    const left = legendPos.endsWith('left'), bottom = legendPos.startsWith('bottom');
    if (left){ legendEl.style.right = 'auto'; legendEl.style.left = (ttGeom.X0 + LEG_INSET) + 'px'; }
    else     { legendEl.style.left = 'auto';  legendEl.style.right = ((W - ttGeom.X1) + LEG_INSET) + 'px'; }
    legendEl.style.top = (bottom ? ttGeom.Y1 - legendEl.offsetHeight - LEG_TOP : ttGeom.Y0 + LEG_TOP) + 'px';
  }
  // exported legend (PNG and SVG): [x of the swatch, y of the first row's centre], rows LEG_ROW f apart
  function legendOrigin(ttGeom, nRows, f){
    const x = legendPos.endsWith('left') ? ttGeom.X0 + (LEG_INSET + 4)*SS : ttGeom.X1 - 8.8*f;
    const y = legendPos.startsWith('bottom') ? ttGeom.Y1 - LEG_TOP*SS - 0.5*f - (nRows - 1)*LEG_ROW*f : ttGeom.Y0 + 0.6*f + (LEG_TOP + 3)*SS;
    return [x, y];
  }

  // ---- derived-parameter readout ------------------------------------------
  function updateDerived(result){
    if (!cfg.showDerived) return;
    const d = (result || emulator.predict(params)).derived;
    const set = (key, v, p=4) => { const el=derEls[key]; if (el) el.textContent = (+v).toPrecision(p); };
    set('sigma8', d.sigma8, 3);
    set('theta',  d['100*theta_s'], 4);
    set('yhe',    d.YHe, 3);
    set('zreio',  d.z_reio, 3);
    if (META.derivedNames.includes('H0')) set('h', d['H0'], 4);  // geo model outputs H0 directly
    else set('h', 100*hubbleH(params), 4);                       // S3: flat closure, h derived
  }

  // ---- pie renderer (ratio method, always sums to 100%) -------------------
  function renderPieSVG(el, wedges, symbol){
    if (!el) return;
    const cx=130, cy=112, R=80;
    let start=-90, paths='', pcts='', names='';
    for (const w of wedges){
      const ang = w.frac*360, end = start+ang, large = ang>180?1:0;
      if (w.frac >= 0.9995){ paths += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${w.color}"/>`; }
      else if (w.frac > 0){
        const p1=polar(cx,cy,R,start), p2=polar(cx,cy,R,end);
        paths += `<path d="M${cx},${cy} L${p1.x},${p1.y} A${R},${R} 0 ${large} 1 ${p2.x},${p2.y} Z" fill="${w.color}" stroke-width="1.5"/>`;   // stroke: cmb-plot.css
      }
      const mid = start + ang/2;
      if (w.frac > 0.035){ const c = polar(cx,cy,R*0.58,mid);
        pcts += `<text class="emu-pct" x="${c.x}" y="${c.y}" font-size="17" text-anchor="middle" dominant-baseline="middle">${(w.frac*100).toFixed(1)}</text>`; }
      const o = polar(cx,cy,R*1.24,mid);
      const anchor = o.x < cx-3 ? 'end' : o.x > cx+3 ? 'start' : 'middle';
      names += `<text x="${o.x}" y="${o.y}" font-size="17" text-anchor="${anchor}" dominant-baseline="middle">${symbol}<tspan dy="5" font-size="12">${w.sub}</tspan></text>`;
      start = end;
    }
    el.innerHTML = `<svg viewBox="0 0 260 232" width="100%" style="max-width:260px" overflow="visible">${paths}${pcts}${names}</svg>`;
  }

  function updatePie(){
    // Energy densities: Lambda + the (cdm, baryon) split of the remaining (1 - Omega_Lambda).
    if (pieSvgEl){
      const fL = Math.max(0, Math.min(1, params['Omega_Lambda']));
      const rem = 1 - fL;
      const ob = params['omega_b'], oc = params['omega_cdm'];
      const sum = ob + oc || 1;
      renderPieSVG(pieSvgEl, [
        { sub:'Λ', color:PIE_COLOR.OmegaL, frac:fL },
        { sub:'c', color:PIE_COLOR.cdm,    frac:rem * oc/sum },
        { sub:'b', color:PIE_COLOR.b,      frac:rem * ob/sum },
      ], 'Ω');
    }
    // Matter density: baryon vs cold dark matter as fractions of omega_m = omega_b + omega_cdm.
    if (matterPieSvgEl){
      const ob = params['omega_b'], oc = params['omega_cdm'];
      const sum = ob + oc || 1;
      renderPieSVG(matterPieSvgEl, [
        { sub:'c', color:PIE_COLOR.cdm, frac:oc/sum },
        { sub:'b', color:PIE_COLOR.b,   frac:ob/sum },
      ], 'ω');
    }
  }

  // ---- layout + figure ----------------------------------------------------
  // Panel boxes. Each carries the view it is drawn with (geom.view), its column ('main'/'zoom') and
  // whether it is the bottom of its column (x tick labels). Main panels always come first.
  function layout(W, H){
    const padL=64, padR=26, padT=10*SS, padB=34*SS, gap=4*SS;
    const plotW = W - padL - padR;
    if (!zoom){
      // panels sharing an l axis sit `gap` apart; a group boundary leaves room for tick numbers
      const groupGap = 26*SS;
      const newGroup = specs.map((spec, i) => i > 0 && axisKey(specView[spec]) !== axisKey(specView[specs[i-1]]));
      const nGroupGaps = newGroup.filter(Boolean).length;
      const panelH = (H - padT - padB - (specs.length - 1 - nGroupGaps)*gap - nGroupGaps*groupGap) / specs.length;
      let y = padT;
      const geoms = specs.map((spec, i) => {
        if (i > 0) y += newGroup[i] ? groupGap : gap;
        const g = { spec, col:'main', view: specView[spec], X0: padL, X1: padL + plotW, Y0: y, Y1: y + panelH,
          isBottom: i === specs.length - 1 || newGroup[i+1], lastInCol: i === specs.length - 1 };
        y += panelH; return g;
      });
      return { padL, padR, padT, padB, gap, plotW, panelH, geoms };
    }
    const band = zoom.band ? zoom.range : null;
    if (isStacked(W)){                     // narrow: zoom panels in a second block below the main one
      const midGap = 46*SS;
      const panelH = (H - padT - padB - midGap - 4*gap) / 6;
      const row = (i, top) => [top + i*(panelH+gap), top + i*(panelH+gap) + panelH];
      const zTop = padT + 3*panelH + 2*gap + midGap;
      const geoms = [
        ...specs.map((spec,i) => { const [Y0,Y1] = row(i, padT);
          return { spec, col:'main', view, band, isBottom: i===2, lastInCol: i===2, X0: padL, X1: padL + plotW, Y0, Y1 }; }),
        ...specs.map((spec,i) => { const [Y0,Y1] = row(i, zTop);
          return { spec, col:'zoom', view: zoomView, isBottom: i===2, lastInCol: i===2, X0: padL, X1: padL + plotW, Y0, Y1 }; }),
      ];
      return { padL, padR, padT, padB, gap, plotW, panelH, geoms };
    }
    const colGap = 46*SS;                  // room for the zoom panels' y tick labels
    const zoomW = (plotW - colGap) * (zoom.width || 0.36), mainW = plotW - colGap - zoomW;
    const panelH = (H - padT - padB - 2*gap) / 3;
    const geoms = [];
    for (const [col, X0, X1, v] of [['main', padL, padL + mainW, view], ['zoom', padL + mainW + colGap, padL + plotW, zoomView]])
      specs.forEach((spec,i) => geoms.push({ spec, col, view: v, band: col === 'main' ? band : null,
        isBottom: i===specs.length-1, lastInCol: i===specs.length-1, X0, X1, Y0: padT + i*(panelH+gap), Y1: padT + i*(panelH+gap) + panelH }));
    return { padL, padR, padT, padB, gap, plotW, panelH, geoms };
  }
  function drawFigure(g, W, H, result){
    const r = result || emulator.predict(params);
    const { geoms } = layout(W, H);
    const curves = {};
    for (const spec of specs) curves[spec] = displayCurve(r, spec);
    for (const gm of geoms){
      VIEW = gm.view;                     // this panel's x window / y scale
      const c = curves[gm.spec];
      drawPanel(g, gm.spec, gm, gm.isBottom, dynRange(gm.spec, c.value), c);
    }
    VIEW = view;
    return geoms;
  }

  // ---- export -------------------------------------------------------------
  const EXPORT_BG = '#ffffff', PNG_SCALE = 3;
  function drawTitleParts(g, spec, base){
    const sF = base*0.70, subY = base*0.26, supY = -base*0.36, kern = base*0.15;
    g.textAlign='left'; g.textBaseline='alphabetic';
    g.font = `italic ${base}px ${FONT}`; const wD = g.measureText(VIEW.letter).width;
    g.font = `italic ${sF}px ${FONT}`;   const wL = g.measureText('ℓ').width;
    g.font = `${sF}px ${FONT}`;          const wX = g.measureText(TITLE_SPEC[spec]).width;
    g.font = `${base}px ${FONT}`;        const wU = g.measureText(UNIT_STR).width;
    const scriptW = Math.max(wL, wX), total = wD + kern + scriptW + wU;
    let x = -total/2;
    g.font = `italic ${base}px ${FONT}`; g.fillText(VIEW.letter, x, 0); x += wD + kern;
    g.font = `italic ${sF}px ${FONT}`;   g.fillText('ℓ', x, subY);
    g.font = `${sF}px ${FONT}`;          g.fillText(TITLE_SPEC[spec], x, supY); x += scriptW;
    g.font = `${base}px ${FONT}`;        g.fillText(UNIT_STR, x, 0);
  }
  function svgTitle(spec, cx, cy, base){
    const sF = base*0.70, subY = base*0.26, supY = -base*0.36, kern = base*0.15;
    ctx.font = `italic ${base}px ${FONT}`;  const wD = ctx.measureText(VIEW.letter).width;
    ctx.font = `italic ${sF}px ${FONT}`;    const wL = ctx.measureText('ℓ').width;
    ctx.font = `${sF}px ${FONT}`;           const wX = ctx.measureText(TITLE_SPEC[spec]).width;
    ctx.font = `${base}px ${FONT}`;         const wU = ctx.measureText(UNIT_STR).width;
    const scriptW = Math.max(wL, wX), total = wD + kern + scriptW + wU;
    let x = -total/2;
    let s = `<g transform="translate(${cx.toFixed(2)} ${cy.toFixed(2)}) rotate(-90)">`;
    s += `<text x="${x.toFixed(2)}" y="0" font-size="${base.toFixed(2)}" font-style="italic">${VIEW.letter}</text>`; x += wD + kern;
    s += `<text x="${x.toFixed(2)}" y="${subY.toFixed(2)}" font-size="${sF.toFixed(2)}" font-style="italic">ℓ</text>`;
    s += `<text x="${x.toFixed(2)}" y="${supY.toFixed(2)}" font-size="${sF.toFixed(2)}">${TITLE_SPEC[spec]}</text>`; x += scriptW;
    s += `<text x="${x.toFixed(2)}" y="0" font-size="${base.toFixed(2)}">${svgEsc(UNIT_STR)}</text>`;
    return s + '</g>';
  }
  // display.exportTitle rich text: runs [{t, it, sub, sup}] laid out left to right, centred on the
  // origin (callers rotate). sub/sup are stacked after their run, like the default D_l title.
  function richRuns(gctx, runs, base){
    const sF = base*0.70, out = []; let w = 0;
    for (const r of runs){
      gctx.font = `${r.it ? 'italic ' : ''}${base}px ${FONT}`; const wt = gctx.measureText(r.t || '').width;
      gctx.font = `${sF}px ${FONT}`;
      const ws = Math.max(r.sub ? gctx.measureText(r.sub).width : 0, r.sup ? gctx.measureText(r.sup).width : 0);
      out.push({ r, x: w, wt }); w += wt + (ws ? ws + base*0.08 : 0);
    }
    return { out, total: w, sF, subY: base*0.26, supY: -base*0.36 };
  }
  function drawRichTitle(g, runs, base){
    const L = richRuns(g, runs, base); g.textAlign='left'; g.textBaseline='alphabetic';
    for (const { r, x, wt } of L.out){
      const x0 = x - L.total/2;
      g.font = `${r.it ? 'italic ' : ''}${base}px ${FONT}`; g.fillText(r.t || '', x0, 0);
      g.font = `${L.sF}px ${FONT}`;
      if (r.sub) g.fillText(r.sub, x0 + wt, L.subY);
      if (r.sup) g.fillText(r.sup, x0 + wt, L.supY);
    }
  }
  function svgRichTitle(runs, cx, cy, base){
    const L = richRuns(ctx, runs, base);
    let s = `<g transform="translate(${cx.toFixed(2)} ${cy.toFixed(2)}) rotate(-90)">`;
    for (const { r, x, wt } of L.out){
      const x0 = x - L.total/2;
      s += `<text x="${x0.toFixed(2)}" y="0" font-size="${base.toFixed(2)}"${r.it ? ' font-style="italic"' : ''}>${svgEsc(r.t || '')}</text>`;
      if (r.sub) s += `<text x="${(x0+wt).toFixed(2)}" y="${L.subY.toFixed(2)}" font-size="${L.sF.toFixed(2)}">${svgEsc(r.sub)}</text>`;
      if (r.sup) s += `<text x="${(x0+wt).toFixed(2)}" y="${L.supY.toFixed(2)}" font-size="${L.sF.toFixed(2)}">${svgEsc(r.sup)}</text>`;
    }
    return s + '</g>';
  }
  function drawTitlesCanvas(g, geoms, padL, W, H){
    g.save(); g.fillStyle='#000';
    const base = 13.5*SS;
    for (const gm of geoms){
      if (gm.col === 'zoom' && !isStacked(W)) continue;
      g.save(); g.translate(15*SS, (gm.Y0+gm.Y1)/2); g.rotate(-Math.PI/2);
      if (disp.exportTitle && disp.exportTitle[gm.spec]) drawRichTitle(g, disp.exportTitle[gm.spec], base); else drawTitleParts(g, gm.spec, base);
      g.restore();
    }
    g.font = `italic ${16*SS}px ${FONT}`; g.textAlign='center'; g.textBaseline='alphabetic';
    for (const [x, y] of xLabelSpots(geoms, W, H, padL)) g.fillText('ℓ', x, y);
    g.restore();
  }
  // where the l axis labels go in exports: centred under each column's bottom panel
  function xLabelSpots(geoms, W, H, padL){
    const bottoms = geoms.filter(g => g.lastInCol);
    return bottoms.map(b => [(b.X0 + b.X1)/2, (b.col === 'main' && isStacked(W)) ? b.Y1 + 30*SS : H - 2*SS]);
  }
  function drawLegendCanvas(g, ttGeom, W){
    const items = legendRows().filter(r => VIS[r[0]]).map(([, label, color, mark, edge]) => [mark, color, label, edge]);
    const f = STYLE.legendFont*SS*LEG_FONT;
    g.save(); g.font=`${f}px ${FONT}`; g.textAlign='left'; g.textBaseline='middle';
    let [x, y] = legendOrigin(ttGeom, items.length, f);
    for (const [type,color,text,edge] of items){
      g.strokeStyle=color; g.fillStyle=color; g.lineWidth=STYLE.lcdmWidth*SS;
      if (type==='fill'){ g.fillRect(x, y-0.4*f, 1.4*f, 0.8*f);
        if (edge){ g.strokeStyle=edge; g.lineWidth=1.0*SS; g.strokeRect(x, y-0.4*f, 1.4*f, 0.8*f); } }
      else if (type==='limit'){ g.beginPath(); g.moveTo(x, y-0.4*f); g.lineTo(x+1.4*f, y-0.4*f); g.stroke(); drawArrow(g, x+0.7*f, y-0.4*f, 0.85*f); }
      else if (type!=='dot'){ if (type==='dotted') g.setLineDash([2*SS, 3*SS]);
        g.beginPath(); g.moveTo(x,y); g.lineTo(x+1.4*f,y); g.stroke(); g.setLineDash([]); }
      else { g.beginPath(); g.arc(x+0.7*f,y,STYLE.markerR*SS,0,2*Math.PI); g.fill(); }
      g.fillStyle='#000'; g.fillText(text, x+1.8*f, y); y += f*LEG_ROW;
    }
    g.restore();
  }
  function drawExport(g, W, H){
    const pal = PAL, ss = SS; PAL = LIGHT; SS = figScale(W);   // exports: light, and the design size's scale
    applyView();
    g.fillStyle = EXPORT_BG; g.fillRect(0,0,W,H);
    const { padL, geoms } = layout(W, H);
    drawFigure(g, W, H);
    drawTitlesCanvas(g, geoms, padL, W, H);
    drawLegendCanvas(g, geoms[0], W);
    PAL = pal; SS = ss;
  }
  // Saved figures are universal: always the figure's design size (the CSS width caps), never the on-screen
  // size, so a PNG/SVG is identical whichever device or window it was saved from.
  const FIG_W = zoom ? 800 : 660;
  function exportSize(){ return { W: FIG_W, H: Math.round(FIG_W * (isStacked(FIG_W) ? ASPECT_STACKED : ASPECT)) }; }
  function savePNG(openInTab){
    const { W, H } = exportSize();
    const oc = document.createElement('canvas'); oc.width = W*PNG_SCALE; oc.height = H*PNG_SCALE;
    const octx = oc.getContext('2d'); octx.scale(PNG_SCALE, PNG_SCALE);
    drawExport(octx, W, H);
    oc.toBlob((blob) => {
      if (!blob) return;
      if (openInTab){ window.open(URL.createObjectURL(blob), '_blank'); }
      else { downloadBlob(blob, `cmbverse_${tstamp()}.png`); }
    }, 'image/png');
  }
  function buildSVG(W, H){
    const pal = PAL, ss = SS; PAL = LIGHT; SS = figScale(W);   // exports: light (legendRows reads PAL), design scale
    applyView();
    const svgResult = emulator.predict(params);
    const { padL, geoms } = layout(W, H);
    const P = [];
    P.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="serif">`);
    P.push(`<rect width="${W}" height="${H}" fill="${EXPORT_BG}"/>`);
    const tf = STYLE.tickFont*SS;
    const svgCurves = {};
    for (const spec of specs) svgCurves[spec] = displayCurve(svgResult, spec);
    geoms.forEach((gm,i) => {
      const { X0, X1, Y0, Y1, spec } = gm;
      const isBottom = gm.isBottom;
      VIEW = gm.view;
      const c = svgCurves[spec];
      const range = dynRange(spec, c.value); const [rLo,rHi] = range;
      const yPix = makeYPix(spec, Y0, Y1, range);
      const majorY = yMajorTicks(spec, rLo, rHi);
      const tickLen=6*SS, minorLen=3.2*SS;
      P.push(`<rect x="${X0}" y="${Y0}" width="${X1-X0}" height="${Y1-Y0}" fill="none" stroke="#000" stroke-width="${STYLE.frameWidth*SS}"/>`);
      for (const xv of xMinorTicks()){
        const x=xPix(xv,X0,X1);
        P.push(`<line x1="${x}" y1="${Y1}" x2="${x}" y2="${Y1-minorLen}" stroke="#000" stroke-width="${STYLE.frameWidth*SS}"/>`);
        P.push(`<line x1="${x}" y1="${Y0}" x2="${x}" y2="${Y0+minorLen}" stroke="#000" stroke-width="${STYLE.frameWidth*SS}"/>`);
      }
      for (const xt of xMajorTicks()){
        const x=xPix(xt,X0,X1);
        P.push(`<line x1="${x}" y1="${Y1}" x2="${x}" y2="${Y1-tickLen}" stroke="#000" stroke-width="${STYLE.frameWidth*SS}"/>`);
        P.push(`<line x1="${x}" y1="${Y0}" x2="${x}" y2="${Y0+tickLen}" stroke="#000" stroke-width="${STYLE.frameWidth*SS}"/>`);
        if (isBottom) P.push(svgTickLabel(xTickLabel(xt), x, Y1+6*SS+tf, tf, 'middle'));
      }
      for (const yt of majorY){
        if (yt<rLo-1e-12||yt>rHi+1e-12) continue; const y=yPix(yt);
        P.push(`<line x1="${X0}" y1="${y}" x2="${X0+tickLen}" y2="${y}" stroke="#000" stroke-width="${STYLE.frameWidth*SS}"/>`);
        if (!yLabelHidden(spec, yt)) P.push(svgTickLabel(fmtYTick(spec,yt), X0-6*SS, y+tf*0.34, tf, 'end'));
      }
      if (VIEW.yLog[spec]){
        for (let e=Math.floor(Math.log10(rLo)); e<=Math.ceil(Math.log10(rHi)); e++)
          for (const s of [0.3,0.6,0.9]){ const v=s*Math.pow(10,e+1); if(v<rLo||v>rHi)continue;
            const y=yPix(v); P.push(`<line x1="${X0}" y1="${y}" x2="${X0+minorLen}" y2="${y}" stroke="#000" stroke-width="${STYLE.frameWidth*SS}"/>`); }
      } else {
        const ms=yMinorStep(spec, rLo, rHi);
        for (let v=Math.ceil(rLo/ms)*ms; v<=rHi+1e-9; v+=ms){ if(majorY.some(mt=>Math.abs(mt-v)<1e-9))continue;
          const y=yPix(v); P.push(`<line x1="${X0}" y1="${y}" x2="${X0+minorLen}" y2="${y}" stroke="#000" stroke-width="${STYLE.frameWidth*SS}"/>`); }
      }
      P.push(`<clipPath id="clip${i}"><rect x="${X0}" y="${Y0}" width="${X1-X0}" height="${Y1-Y0}"/></clipPath>`);
      P.push(`<g clip-path="url(#clip${i})">`);
      if (VIEW.xDivider && VIEW.xaxis === 'loglin'){ const xd = xPix(LL_L0,X0,X1).toFixed(1);
        P.push(`<line x1="${xd}" y1="${Y0}" x2="${xd}" y2="${Y1}" stroke="${DIVIDER_COLOR}" stroke-width="${1.0*SS}" stroke-dasharray="${4*SS} ${3*SS}"/>`); }
      if (gm.band){ const bx0 = xPix(gm.band[0],X0,X1), bx1 = xPix(gm.band[1],X0,X1);
        P.push(`<rect x="${bx0.toFixed(1)}" y="${Y0}" width="${(bx1-bx0).toFixed(1)}" height="${Y1-Y0}" fill="${BAND_FILL}"/>`); }
      const svgLogFloor = VIEW.yLog[spec] ? rLo : null;
      const drawPts = (arr,color,asym) => { if(!arr)return;
        for (const row of arr){ const l=row[0]; if(l<VIEW.xmin||l>VIEW.xmax)continue;
          const x=xPix(l,X0,X1), v=row[1], y=yPix(v); const eLo=row[2], eHi=asym?row[3]:row[2];
          const vLo = svgLogFloor!==null && (v-eLo)<=svgLogFloor ? svgLogFloor : (v-eLo);
          const vHi = svgLogFloor!==null && (v+eHi)<=svgLogFloor ? svgLogFloor : (v+eHi);
          P.push(`<line x1="${x}" y1="${yPix(vHi)}" x2="${x}" y2="${yPix(vLo)}" stroke="${color}" stroke-width="${STYLE.errWidth*SS}" opacity="0.85"/>`);
          P.push(`<circle cx="${x}" cy="${y}" r="${STYLE.markerR*SS}" fill="${color}" opacity="0.85"/>`);
        } };
      if (OBS && OBS[spec]){
        if (VIS.planck) drawPts(OBS[spec].planck, COLOR.planck, true);
        if (VIS.act)    drawPts(OBS[spec].act,    COLOR.act,    false);
        if (VIS.spt)    drawPts(OBS[spec].spt,    COLOR.spt,    false);
        for (const ds of dsets){
          if (!VIS[ds.key]) continue;
          const { segs, dots, arrows } = dataSetMarks(OBS[spec][ds.key], ds, yPix, X0, X1, svgLogFloor);
          const sw = ((ds.kind === 'limit' ? STYLE.lcdmWidth*1.2 : STYLE.errWidth)*SS).toFixed(2);
          for (const [x0,y0,x1,y1] of segs) P.push(`<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${ds.color}" stroke-width="${sw}" opacity="0.85"/>`);
          for (const [x,y] of arrows) P.push(`<g opacity="0.85">${svgArrow(x, y, ds.color, sw)}</g>`);
          for (const [x,y] of dots) P.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${STYLE.markerR*SS}" fill="${ds.color}" opacity="0.85"/>`);
        }
      }
      const poly = (xs,ys,pred) => { let pts=''; for(let k=0;k<xs.length;k++){ const l=xs[k]; if(pred&&(l<VIEW.xmin||l>VIEW.xmax))continue;
          pts += `${xPix(l,X0,X1).toFixed(1)},${ys(k).toFixed(1)} `; } return pts.trim(); };
      for (const b of bands){
        const env = errBandPolygon(spec, b);
        if (env) P.push(`<polygon fill="${ERRBAND_FILL[b.shade]}" stroke="none" points="${env.map(([l,v]) => `${xPix(l,X0,X1).toFixed(1)},${yPix(v).toFixed(1)}`).join(' ')}"/>`);
      }
      for (const b of bands){                    // band edges over all the fills, as on the canvas
        if (!ERRBAND_EDGE[b.shade]) continue;
        for (const line of errBandLines(spec, b))
          P.push(`<polyline fill="none" stroke="${ERRBAND_EDGE[b.shade]}" stroke-width="${SS}" points="${line.map(([l,v]) => `${xPix(l,X0,X1).toFixed(1)},${yPix(v).toFixed(1)}`).join(' ')}"/>`);
      }
      if (LCDM && VIS.lcdm)
        P.push(`<polyline fill="none" stroke="${COLOR_LCDM}" stroke-width="${STYLE.lcdmWidth*SS}" opacity="0.9"${VIEW.refDash ? ` stroke-dasharray="${2*SS} ${3*SS}"` : ''} points="${(r => poly(r.ell, k=>yPix(r.value[k]), true))(refCurve(spec))}"/>`);
      if (REF2 && VIS.ref2)
        P.push(`<polyline fill="none" stroke="${COLOR_LCDM}" stroke-width="${STYLE.lcdmWidth*SS}" opacity="0.9" points="${poly(REF2.ell, k=>yPix(REF2[spec][k]), true)}"/>`);
      P.push(`<polyline fill="none" stroke="${COLOR_MODEL}" stroke-width="${STYLE.modelWidth*SS}" stroke-linejoin="round" opacity="0.95" points="${poly(c.ell, k=>yPix(c.value[k]), false)}"/>`);
      P.push(`</g>`);
      const cx2=15*SS, cy2=(Y0+Y1)/2, bf=13.5*SS;
      if (gm.col !== 'zoom' || isStacked(W))
        P.push(disp.exportTitle && disp.exportTitle[spec] ? svgRichTitle(disp.exportTitle[spec], cx2, cy2, bf) : svgTitle(spec, cx2, cy2, bf));
    });
    VIEW = view;
    for (const [x, y] of xLabelSpots(geoms, W, H, padL))
      P.push(`<text x="${x}" y="${y}" font-size="${16*SS}" font-style="italic" text-anchor="middle">ℓ</text>`);
    const items = legendRows().filter(r => VIS[r[0]]).map(([, label, color, mark, edge]) => [mark, color, label, edge]);
    const f=STYLE.legendFont*SS*LEG_FONT, tt=geoms[0];
    let [lx, ly] = legendOrigin(tt, items.length, f);
    for (const [type,color,text,edge] of items){
      if (type==='fill') P.push(`<rect x="${lx}" y="${ly-0.4*f}" width="${1.4*f}" height="${0.8*f}" fill="${color}"${edge ? ` stroke="${edge}" stroke-width="${SS}"` : ''}/>`);
      else if (type==='limit') P.push(`<line x1="${lx}" y1="${ly-0.4*f}" x2="${lx+1.4*f}" y2="${ly-0.4*f}" stroke="${color}" stroke-width="${STYLE.lcdmWidth*SS}"/>` + svgArrow(lx+0.7*f, ly-0.4*f, color, STYLE.lcdmWidth*SS, 0.85*f));
      else if (type!=='dot') P.push(`<line x1="${lx}" y1="${ly}" x2="${lx+1.4*f}" y2="${ly}" stroke="${color}" stroke-width="${STYLE.lcdmWidth*SS}"${type==='dotted' ? ` stroke-dasharray="${2*SS} ${3*SS}"` : ''}/>`);
      else P.push(`<circle cx="${lx+0.7*f}" cy="${ly}" r="${STYLE.markerR*SS}" fill="${color}"/>`);
      P.push(`<text x="${lx+1.8*f}" y="${ly+f*0.34}" font-size="${f}">${svgEsc(text)}</text>`);
      ly += f*LEG_ROW;
    }
    P.push('</svg>');
    PAL = pal; SS = ss;
    return P.join('');
  }
  function saveSVG(){ const { W, H } = exportSize(); downloadBlob(new Blob([buildSVG(W,H)], { type:'image/svg+xml' }), `cmbverse_${tstamp()}.svg`); }

  // ---- theta_s constraint (Graph 2 "fix the acoustic scale" scheme) --------
  // Solve Omega_Lambda so the emulator's 100*theta_s matches its fiducial value,
  // instead of pinning Omega_Lambda. Bisection on Omega_Lambda in [0, 0.9];
  // theta_s increases monotonically with Omega_Lambda (more Lambda -> larger H0
  // -> smaller D_A -> larger theta_s). Uses the model's OWN theta_s so the plotted
  // (emulated) peaks genuinely stay put. ~20 predicts/update; real-time on WASM.
  let _thetaTarget = null;
  function solveThetaS(){
    if (!emulator) return;
    if (_thetaTarget == null)
      _thetaTarget = emulator.predict(Object.assign({}, META.defaults)).derived['100*theta_s'];
    let lo = 0.0, hi = 0.9;
    for (let i = 0; i < 20; i++){
      const mid = 0.5 * (lo + hi);
      params['Omega_Lambda'] = mid;
      if (emulator.predict(params).derived['100*theta_s'] < _thetaTarget) lo = mid;
      else hi = mid;
    }
    params['Omega_Lambda'] = 0.5 * (lo + hi);
  }

  // ---- rAF-gated render ---------------------------------------------------
  let _renderPending = false;
  function scheduleRender(){
    if (_renderPending) return; _renderPending = true;
    requestAnimationFrame(() => { _renderPending = false; render(); });
  }
  function render(){
    if (!emulator) return;
    applyView();
    PAL = themePal();
    if (cfg.derive) cfg.derive(params);       // refresh dependent params first
    if (cfg.constrainThetaS) solveThetaS();   // then solve Omega_Lambda to hold theta_s
    const { W, H } = resize();
    ctx.clearRect(0,0,W,H);
    // text/line scale from the standard figure width (the 660px .emu-plot-wrap max): a widget made wider
    // for extra columns (display.zoom) keeps the same type size and line weights as every other graph.
    SS = figScale(W);
    const { padL, geoms } = layout(W, H);
    const result = emulator.predict(params);  // ONE inference per update
    drawFigure(ctx, W, H, result);
    placeOverlays(geoms, W, H, padL);
    placeLegend(geoms[0], W);
    updateDerived(result);
    updatePie();
    if (extraPieSvgEl) renderPieSVG(extraPieSvgEl, disp.pie.wedges(result, params), disp.pie.symbol || 'ω');
    statusEl.textContent = '';
  }

  // ---- boot ---------------------------------------------------------------
  buildSliders();
  buildOverlays();
  buildLegend();
  paintSwatches();
  new MutationObserver(() => { paintSwatches(); scheduleRender(); })   // light/dark switch (site.js)
    .observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });
  (async () => {
    try {
      if (!backend.noTF) await initBackend();
      const tasks = [ CMBEmulator.load(cfg.modelUrls, window.tf) ];
      tasks.push(cfg.dataUrl ? fetch(cfg.dataUrl).then(r=>r.ok?r.json():null).then(d=>OBS=d).catch(()=>OBS=null) : Promise.resolve());
      for (const url of new Set(bands.map(b => b.url).filter(Boolean)))   // local data files for errorBand
        tasks.push(fetch(url).then(r=>r.ok?r.json():null).then(d=>BAND_OBS[url]=d).catch(()=>BAND_OBS[url]=null));
      tasks.push(cfg.lcdmUrl ? fetch(cfg.lcdmUrl).then(r=>r.ok?r.json():null).then(d=>LCDM=d).catch(()=>LCDM=null) : Promise.resolve());
      const [emu] = await Promise.all(tasks);
      emulator = emu;
      if (LCDM && !disp.reference) buildLCDMReference();
      if (disp.reference === 'model') buildModelReference();
      if (disp.reference === 'unity') buildUnityReference();
      if (extraRef) buildExtraReference();
      if (zoom) buildZoomRanges();
      render();
    } catch(e){
      statusEl.className='emu-status err';
      statusEl.textContent = 'model load failed: ' + e.message;
      console.error(e);
    }
  })();

  return { render, get params(){ return params; }, get emulator(){ return emulator; } };
}

export default createCMBPlot;
