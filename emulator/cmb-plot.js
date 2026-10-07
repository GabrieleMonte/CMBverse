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
 *   model     : 's3' | 'geo' | 'neutrino',  // emulator backend (default 's3'; see BACKENDS)
 *   xaxis     : 'linear' | 'loglin',    // multipole axis (default 'linear')
 *   dataUrl, lcdmUrl,                   // optional overlays
 *   sliders   : ['omega_cdm', ...],     // which inputs get sliders (default: all six)
 *   ranges    : { omega_cdm:[lo,hi] },  // per-slider range overrides
 *   fixed     : { omega_b:0.02237 },    // params pinned to non-default values
 *   derive    : (params) => {...},      // recompute dependent params each update
 *   showPie, showDerived, showSave, showLegend : booleans (default true)
 * }
 * ============================================================ */
import CMBEmulatorS3, { META as META_S3 } from './cmb-emulator-separate.js';
import CMBEmulatorGeo, { META as META_GEO } from './cmb-emulator-geo.js';
import CMBEmulatorNeutrino, { META as META_NEU } from './cmb-emulator-neutrino.js';

// Emulator backends, selected per widget by config.model (default 's3').
const BACKENDS = {
  s3:       { Emulator: CMBEmulatorS3,       META: META_S3  },   // deployed 6-input flat model
  geo:      { Emulator: CMBEmulatorGeo,      META: META_GEO },   // 4-input curvature model (scheme pages)
  neutrino: { Emulator: CMBEmulatorNeutrino, META: META_NEU },   // (N_eff, YHe) plane, theta_s fixed (neutrino pages)
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
};
const fmt = (name, v) =>
  name === 'omega_b'      ? v.toFixed(4) :
  name === 'omega_cdm'    ? v.toFixed(3) :
  name === 'tau_reio'     ? v.toFixed(3) :
  name === 'YHe'          ? v.toFixed(3) :
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
const PIE_COLOR = { OmegaL:'#E6AF2E', cdm:'#B0C4DE', b:'#46B1C9' };

const Y_TITLE = {
  tt:'\\(\\mathcal{D}_\\ell^{\\mathrm{TT}}\\,[10^3\\,\\mu\\mathrm{K}^2]\\)',
  ee:'\\(\\mathcal{D}_\\ell^{\\mathrm{EE}}\\,[10^3\\,\\mu\\mathrm{K}^2]\\)',
  te:'\\(\\mathcal{D}_\\ell^{\\mathrm{TE}}\\,[10^3\\,\\mu\\mathrm{K}^2]\\)',
};
const TITLE_SPEC = { tt:'TT', ee:'EE', te:'TE' };
const LETTER_D = '\u{1D49F}';
const BAND_FILL = 'rgba(0,0,0,0.07)';  // zoom-window band on the main panels   // script D, used in exported axis titles

// Per-instance plot view: y-axis log/linear, ranges and titles, x range/ticks, title letter.
// Defaults are the standard D_l figure above; config.display overrides per widget. Like XAXIS,
// VIEW is a module global set at the start of every draw (applyView()), so instances never clash.
const VIEW_DEFAULT = {
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
// x-axis mode: 'linear' (default) or 'loglin' (log for l<=30, linear above — the geo
// scheme pages). XAXIS is set per-instance at the start of render()/buildSVG().
let XAXIS = 'linear';
const XTICKS_LL = [2,5,10,20,30,500,1000,2000,3000,4000];
const LL_L0 = 30, LL_TB = Math.log10(30), LL_MIN = 2, LL_MAX = 4030;
const LL_A  = 2*(LL_TB - Math.log10(LL_MIN))/(LL_MAX - LL_L0);   // linear region ~2x the log region
const _fwdLL = (l) => { l = Math.max(LL_MIN, l); return l <= LL_L0 ? Math.log10(l) : LL_TB + (l - LL_L0)*LL_A; };
const LL_F0 = _fwdLL(LL_MIN), LL_F1 = _fwdLL(LL_MAX);
const xPix = (l, X0, X1) => XAXIS === 'loglin'
  ? X0 + (_fwdLL(l) - LL_F0)/(LL_F1 - LL_F0) * (X1 - X0)
  : X0 + (l - VIEW.xmin)/(VIEW.xmax - VIEW.xmin) * (X1 - X0);
function makeYPix(spec, Y0, Y1, range){
  const [a,b] = range;
  if (VIEW.yLog[spec]){
    const la=Math.log10(a), lb=Math.log10(b);
    return (v) => { const vv = Math.max(a, Math.min(b, Math.abs(v))); return Y1 - (Math.log10(vv)-la)/(lb-la)*(Y1-Y0); };
  }
  return (v) => { const vv = Math.max(a, Math.min(b, v)); return Y1 - (vv-a)/(b-a)*(Y1-Y0); };
}
function fmtYTick(spec, v){
  if (!VIEW.yLog[spec]){ if (Math.abs(v) < 1e-9) return '0'; return (+v.toFixed(3)).toString(); }
  const e = Math.round(Math.log10(v));
  return e===0 ? '1' : `10${sup(e)}`;
}
function sup(e){
  const map={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³',
             '4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
  return String(e).split('').map(c=>map[c]||c).join('');
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
  let emulator = null, OBS = null, LCDM = null;
  const params = Object.assign({}, META.defaults, config.fixed || {});
  if (cfg.derive) cfg.derive(params);
  const VIS = { lcdm:true, planck:true, act:true, spt:true };
  if (!cfg.dataUrl){ VIS.planck = VIS.act = VIS.spt = false; }   // no data overlays on this widget

  // ---- per-instance view (config.display) ----------------------------------
  // display = {
  //   transform : (spec, ell[], value[]) => value[],   // applied to every displayed curve (model + reference)
  //   normalize : { extremum:n, lmin, lmax },           // scale each curve so its n-th extremum (0-based,
  //                                                     //  in [lmin,lmax]) matches the reference's
  //   reference : 'model',                              // reference curve = this emulator at the defaults
  //                                                     //  (+ fixed, derive), not lcdmUrl
  //   yLog, yRange, ySym, yTitle : per-spectrum overrides; letter : export title symbol
  //   xRange:[lo,hi], xTicks:[...], xMinor
  //   aspect    : canvas height / width (default 1.19)
  //   zoom      : { range:[lo,hi], xTicks, xMinor, width:0.36, band:true }
  //               adds a narrower zoom column beside the three panels (same spectra, l in range,
  //               y-range fixed across the slider) and shades the range on the main panels.
  //               Below ~610 px canvas width the zoom panels stack under the main ones instead.
  // }
  const disp = config.display || {};
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
  };
  function applyView(){ XAXIS = cfg.xaxis; VIEW = view; }
  const zoom = disp.zoom || null;
  const ASPECT = disp.aspect || 1.19, ASPECT_STACKED = 2.6, STACK_BELOW_W = 610;
  // the zoom column's own view: same spectra/scales, its l window, a y-range fixed by buildZoomRanges()
  const zoomView = zoom ? Object.assign({}, view, {
    xmin: zoom.range[0], xmax: zoom.range[1],
    xticks: zoom.xTicks || [zoom.range[0], zoom.range[1]], xminor: zoom.xMinor || 50,
    yRange: Object.assign({}, view.yRange), yFixed: true,
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
  function displayCurve(result, spec, { normalize = true } = {}){
    const c = emulator.curveFrom(result, spec, { quantity:'Dl', lmin:2, lmax:Math.min(4030, view.xmax), uK2:true, scale:1e-3 });
    if (disp.transform) c.value = disp.transform(spec, c.ell, c.value);
    const nm = disp.normalize;
    if (normalize && nm && REF_EXT[spec] != null){
      const e = extremumValue(c, nm.extremum, nm.lmin, nm.lmax);
      if (e) { const k = REF_EXT[spec] / e; c.value = c.value.map(v => v * k); }
    }
    return c;
  }
  // Reference drawn as the black 'LCDM' curve when display.reference === 'model'.
  function buildModelReference(){
    applyView();
    const fid = Object.assign({}, META.defaults, config.fixed || {});
    if (cfg.derive) cfg.derive(fid);
    const r = emulator.predict(fid);
    const ref = {};
    for (const spec of SPECS){
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
    for (const spec of SPECS){ lo[spec] = Infinity; hi[spec] = -Infinity; }
    const take = (c, spec) => {
      for (let i = 0; i < c.ell.length; i++){
        const l = c.ell[i]; if (l < zoom.range[0] || l > zoom.range[1]) continue;
        lo[spec] = Math.min(lo[spec], c.value[i]); hi[spec] = Math.max(hi[spec], c.value[i]);
      }
    };
    if (LCDM) for (const spec of SPECS) take({ ell: LCDM.ell, value: LCDM[spec] }, spec);
    for (const name of cfg.sliders){
      const [a, b] = cfg.ranges[name] || META.ranges[name];
      for (let k = 0; k <= 20; k++){
        const p = Object.assign({}, META.defaults, config.fixed || {}); p[name] = a + (b - a)*k/20;
        if (cfg.derive) cfg.derive(p);
        const r = emulator.predict(p);
        for (const spec of SPECS) take(displayCurve(r, spec), spec);
      }
    }
    for (const spec of SPECS){ const pad = 0.05*(hi[spec] - lo[spec]); zoomView.yRange[spec] = [lo[spec] - pad, hi[spec] + pad]; }
  }
  const numEls = {}, ylabelEls = {}, zlabelEls = {}, derEls = {};
  let xlabelEl = null, zxlabelEl = null, pieSvgEl = null, matterPieSvgEl = null, legendEl = null;

  // ---- build DOM inside root ----------------------------------------------
  root.innerHTML = '';
  const widget = document.createElement('div'); widget.className = zoom ? 'emu-widget emu-widget--zoom' : 'emu-widget';
  const wrap   = document.createElement('div'); wrap.className='emu-plot-wrap';
  const cv     = document.createElement('canvas');
  const axisOverlay = document.createElement('div'); axisOverlay.className='emu-axis-overlay';
  const statusEl    = document.createElement('div'); statusEl.className='emu-status'; statusEl.textContent='loading model…';
  wrap.append(cv, axisOverlay, statusEl);
  const slidersHost = document.createElement('div'); slidersHost.className='emu-sliders';
  widget.append(wrap, slidersHost);
  root.append(widget);
  const ctx = cv.getContext('2d');

  // ---- sliders + sidebar ---------------------------------------------------
  function setFill(input){
    const lo = +input.min, hi = +input.max, v = +input.value;
    const pct = ((v - lo) / (hi - lo)) * 100;
    input.style.background = `linear-gradient(to right,#7B4397 0%,#7B4397 ${pct}%,#e0e0e0 ${pct}%,#e0e0e0 100%)`;
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
      r.type='range'; r.min=lo; r.max=hi; r.step=(hi-lo)/500; r.value=params[name];
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
      Object.assign(params, META.defaults, config.fixed || {});
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

    // mobile-only data toggles (above the pie on mobile)
    if (cfg.showDataToggles){
      const mtog = document.createElement('div'); mtog.className='emu-mobile-toggles';
      mtog.innerHTML = '<h4>Data shown</h4>';
      const mkTog = (key, label, color, kind) => {
        const l = document.createElement('label');
        const cb = document.createElement('input'); cb.type='checkbox'; cb.checked=VIS[key]; cb.dataset.key=key;
        cb.addEventListener('change', () => {
          VIS[key] = cb.checked;
          const lg = legendEl && legendEl.querySelector(`input[data-key="${key}"]`);
          if (lg) lg.checked = cb.checked;
          render();
        });
        const sw = document.createElement('span');
        sw.className = kind==='line' ? 'emu-swatch emu-swatch-line' : 'emu-swatch';
        sw.style.background = color;
        const tx = document.createElement('span'); tx.textContent=label;
        l.append(cb, sw, tx); return l;
      };
      mtog.append(
        mkTog('lcdm','ΛCDM', COLOR_LCDM, 'line'),
        mkTog('planck','Planck 2018', COLOR.planck, 'dot'),
        mkTog('act','ACT DR6', COLOR.act, 'dot'),
        mkTog('spt','SPT-3g D1', COLOR.spt, 'dot'),
      );
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
    for (const spec of SPECS){
      const d = document.createElement('div'); d.className='emu-ylabel';
      const s = document.createElement('span'); s.innerHTML = view.yTitle[spec];
      d.append(s); axisOverlay.append(d); ylabelEls[spec] = d;
    }
    xlabelEl = document.createElement('div'); xlabelEl.className='emu-xlabel';
    xlabelEl.innerHTML = '\\(\\ell\\)'; axisOverlay.append(xlabelEl);
    if (zoom){
      for (const spec of SPECS){              // y-titles for the zoom panels (shown only when stacked)
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
    const majorY = VIEW.yLog[spec] ? logTicks(rLo, rHi) : linTicks(rLo, rHi);

    g.strokeStyle = '#000'; g.lineWidth = STYLE.frameWidth*SS;
    g.strokeRect(X0, Y0, X1-X0, Y1-Y0);

    const tickLen = 6*SS, minorLen = 3.2*SS;
    g.fillStyle='#000'; g.strokeStyle='#000'; g.lineWidth=STYLE.frameWidth*SS;

    if (XAXIS !== 'loglin') for (let xv=VIEW.xmin; xv<=VIEW.xmax; xv+=VIEW.xminor){
      if (VIEW.xticks.includes(xv)) continue;
      const x=xPix(xv,X0,X1);
      g.beginPath(); g.moveTo(x,Y1); g.lineTo(x,Y1-minorLen); g.stroke();
      g.beginPath(); g.moveTo(x,Y0); g.lineTo(x,Y0+minorLen); g.stroke();
    }
    g.textAlign='center'; g.font = `${STYLE.tickFont*SS}px ${FONT}`;
    for (const xt of (XAXIS==='loglin'?XTICKS_LL:VIEW.xticks)){
      const x = xPix(xt, X0, X1);
      g.beginPath(); g.moveTo(x,Y1); g.lineTo(x,Y1-tickLen); g.stroke();
      g.beginPath(); g.moveTo(x,Y0); g.lineTo(x,Y0+tickLen); g.stroke();
      if (isBottom){ g.textBaseline='top'; g.fillText(String(xt), x, Y1+6*SS); }
    }

    g.textAlign='right'; g.textBaseline='middle';
    for (const yt of majorY){
      if (yt<rLo-1e-12 || yt>rHi+1e-12) continue;
      const y = yPix(yt);
      g.strokeStyle='#000'; g.beginPath(); g.moveTo(X0,y); g.lineTo(X0+tickLen,y); g.stroke();
      g.fillStyle='#000'; g.fillText(fmtYTick(spec, yt), X0-6*SS, y);
    }

    g.strokeStyle='#000'; g.lineWidth=STYLE.frameWidth*SS;
    if (VIEW.yLog[spec]){
      for (let e=Math.floor(Math.log10(rLo)); e<=Math.ceil(Math.log10(rHi)); e++){
        for (const s of [0.3,0.6,0.9]){
          const v=s*Math.pow(10,e+1); if (v<rLo||v>rHi) continue;
          const y=yPix(v); g.beginPath(); g.moveTo(X0,y); g.lineTo(X0+minorLen,y); g.stroke();
        }
      }
    } else {
      const minorStep = linStep(rLo, rHi) / 5;
      for (let v=Math.ceil(rLo/minorStep)*minorStep; v<=rHi+1e-9; v+=minorStep){
        if (majorY.some(mt=>Math.abs(mt-v)<1e-9)) continue;
        const y=yPix(v); g.beginPath(); g.moveTo(X0,y); g.lineTo(X0+minorLen,y); g.stroke();
      }
    }

    g.save();
    g.beginPath(); g.rect(X0,Y0,X1-X0,Y1-Y0); g.clip();
    if (geom.band){                       // shade the zoom column's l window on the main panels
      const bx0 = xPix(geom.band[0],X0,X1), bx1 = xPix(geom.band[1],X0,X1);
      g.fillStyle = BAND_FILL; g.fillRect(bx0, Y0, bx1-bx0, Y1-Y0);
    }

    if (LCDM && VIS.lcdm){
      g.strokeStyle=COLOR_LCDM; g.lineWidth=STYLE.lcdmWidth*SS; g.globalAlpha=0.9;
      g.beginPath(); let started=false;
      for (let i=0;i<LCDM.ell.length;i++){
        const l=LCDM.ell[i]; if (l<VIEW.xmin||l>VIEW.xmax) continue;
        const x=xPix(l,X0,X1), y=yPix(LCDM[spec][i]);
        started ? g.lineTo(x,y) : (g.moveTo(x,y), started=true);
      }
      g.stroke(); g.globalAlpha=1;
    }

    g.strokeStyle=COLOR_MODEL; g.lineWidth=STYLE.modelWidth*SS; g.lineJoin='round'; g.globalAlpha=0.95;
    g.beginPath();
    for (let i=0;i<curve.ell.length;i++){ const x=xPix(curve.ell[i],X0,X1), y=yPix(curve.value[i]); i? g.lineTo(x,y) : g.moveTo(x,y); }
    g.stroke(); g.globalAlpha=1;

    const logFloor = VIEW.yLog[spec] ? rLo : null;
    if (OBS && OBS[spec]){
      if (VIS.planck) drawData(g, OBS[spec].planck, COLOR.planck, yPix, X0, X1, true,  logFloor);
      if (VIS.act)    drawData(g, OBS[spec].act,    COLOR.act,    yPix, X0, X1, false, logFloor);
      if (VIS.spt)    drawData(g, OBS[spec].spt,    COLOR.spt,    yPix, X0, X1, false, logFloor);
    }
    g.restore();
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

  // ---- HTML legend with dataset checkboxes (over the TT panel) ------------
  function buildLegend(){
    if (!cfg.showLegend) return;
    const box = document.createElement('div'); box.className='emu-legend';
    const rows = [
      ['lcdm',  'ΛCDM',      COLOR_LCDM, 'line'],
      ['planck','Planck 2018',    COLOR.planck, 'dot'],
      ['act',   'ACT DR6',        COLOR.act,    'dot'],
      ['spt',   'SPT-3g D1',      COLOR.spt,    'dot'],
    ];
    for (const [key,label,color,mark] of rows.filter(r => r[0] === 'lcdm' || cfg.dataUrl)){
      const row = document.createElement('label'); row.className='emu-leg-row';
      const cb = document.createElement('input'); cb.type='checkbox'; cb.checked=VIS[key]; cb.dataset.key=key;
      cb.addEventListener('change', () => {
        VIS[key]=cb.checked;
        const mt = slidersHost.querySelector(`.emu-mobile-toggles input[data-key="${key}"]`);
        if (mt) mt.checked = cb.checked;
        render();
      });
      const sw = document.createElement('span');
      sw.className = mark==='line' ? 'emu-leg-line' : 'emu-leg-dot'; sw.style.background = color;
      const tx = document.createElement('span'); tx.textContent=label;
      row.append(cb, sw, tx); box.append(row);
    }
    wrap.append(box); legendEl = box;
  }
  function placeLegend(ttGeom, W){
    if (!legendEl) return;
    legendEl.style.top = (ttGeom.Y0 + 6) + 'px';
    legendEl.style.right = ((W - ttGeom.X1) + 10) + 'px';
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
        paths += `<path d="M${cx},${cy} L${p1.x},${p1.y} A${R},${R} 0 ${large} 1 ${p2.x},${p2.y} Z" fill="${w.color}" stroke="#fff" stroke-width="1.5"/>`;
      }
      const mid = start + ang/2;
      if (w.frac > 0.035){ const c = polar(cx,cy,R*0.58,mid);
        pcts += `<text x="${c.x}" y="${c.y}" font-size="17" text-anchor="middle" dominant-baseline="middle">${(w.frac*100).toFixed(1)}</text>`; }
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
      const panelH = (H - padT - padB - 2*gap) / 3;
      const geoms = SPECS.map((spec,i) => ({
        spec, col:'main', view, isBottom: i===SPECS.length-1, X0: padL, X1: padL + plotW,
        Y0: padT + i*(panelH+gap), Y1: padT + i*(panelH+gap) + panelH,
      }));
      return { padL, padR, padT, padB, gap, plotW, panelH, geoms };
    }
    const band = zoom.band ? zoom.range : null;
    if (isStacked(W)){                     // narrow: zoom panels in a second block below the main one
      const midGap = 46*SS;
      const panelH = (H - padT - padB - midGap - 4*gap) / 6;
      const row = (i, top) => [top + i*(panelH+gap), top + i*(panelH+gap) + panelH];
      const zTop = padT + 3*panelH + 2*gap + midGap;
      const geoms = [
        ...SPECS.map((spec,i) => { const [Y0,Y1] = row(i, padT);
          return { spec, col:'main', view, band, isBottom: i===2, X0: padL, X1: padL + plotW, Y0, Y1 }; }),
        ...SPECS.map((spec,i) => { const [Y0,Y1] = row(i, zTop);
          return { spec, col:'zoom', view: zoomView, isBottom: i===2, X0: padL, X1: padL + plotW, Y0, Y1 }; }),
      ];
      return { padL, padR, padT, padB, gap, plotW, panelH, geoms };
    }
    const colGap = 46*SS;                  // room for the zoom panels' y tick labels
    const zoomW = (plotW - colGap) * (zoom.width || 0.36), mainW = plotW - colGap - zoomW;
    const panelH = (H - padT - padB - 2*gap) / 3;
    const geoms = [];
    for (const [col, X0, X1, v] of [['main', padL, padL + mainW, view], ['zoom', padL + mainW + colGap, padL + plotW, zoomView]])
      SPECS.forEach((spec,i) => geoms.push({ spec, col, view: v, band: col === 'main' ? band : null,
        isBottom: i===SPECS.length-1, X0, X1, Y0: padT + i*(panelH+gap), Y1: padT + i*(panelH+gap) + panelH }));
    return { padL, padR, padT, padB, gap, plotW, panelH, geoms };
  }
  function drawFigure(g, W, H, result){
    const r = result || emulator.predict(params);
    const { geoms } = layout(W, H);
    const curves = {};
    for (const spec of SPECS) curves[spec] = displayCurve(r, spec);
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
  function drawTitlesCanvas(g, geoms, padL, W, H){
    g.save(); g.fillStyle='#000';
    const base = 13.5*SS;
    for (const gm of geoms){
      if (gm.col === 'zoom' && !isStacked(W)) continue;
      g.save(); g.translate(15*SS, (gm.Y0+gm.Y1)/2); g.rotate(-Math.PI/2); drawTitleParts(g, gm.spec, base); g.restore();
    }
    g.font = `italic ${16*SS}px ${FONT}`; g.textAlign='center'; g.textBaseline='alphabetic';
    for (const [x, y] of xLabelSpots(geoms, W, H, padL)) g.fillText('ℓ', x, y);
    g.restore();
  }
  // where the l axis labels go in exports: centred under each column's bottom panel
  function xLabelSpots(geoms, W, H, padL){
    const bottoms = geoms.filter(g => g.isBottom);
    return bottoms.map(b => [(b.X0 + b.X1)/2, (b.col === 'main' && isStacked(W)) ? b.Y1 + 30*SS : H - 2*SS]);
  }
  function drawLegendCanvas(g, ttGeom, W){
    const items = [];
    if (VIS.lcdm)   items.push(['line', COLOR_LCDM,  'ΛCDM']);
    if (VIS.planck) items.push(['dot',  COLOR.planck,'Planck 2018']);
    if (VIS.act)    items.push(['dot',  COLOR.act,   'ACT DR6']);
    if (VIS.spt)    items.push(['dot',  COLOR.spt,   'SPT-3g D1']);
    const f = STYLE.legendFont*SS;
    g.save(); g.font=`${f}px ${FONT}`; g.textAlign='left'; g.textBaseline='middle';
    let y = ttGeom.Y0 + f + 5*SS; const x = ttGeom.X1 - 8.8*f;
    for (const [type,color,text] of items){
      g.strokeStyle=color; g.fillStyle=color; g.lineWidth=STYLE.lcdmWidth*SS;
      if (type==='line'){ g.beginPath(); g.moveTo(x,y); g.lineTo(x+1.4*f,y); g.stroke(); }
      else { g.beginPath(); g.arc(x+0.7*f,y,STYLE.markerR*SS,0,2*Math.PI); g.fill(); }
      g.fillStyle='#000'; g.fillText(text, x+1.8*f, y); y += f*1.35;
    }
    g.restore();
  }
  function drawExport(g, W, H){
    applyView();
    g.fillStyle = EXPORT_BG; g.fillRect(0,0,W,H);
    const { padL, geoms } = layout(W, H);
    drawFigure(g, W, H);
    drawTitlesCanvas(g, geoms, padL, W, H);
    drawLegendCanvas(g, geoms[0], W);
  }
  function exportSize(){ const W = wrap.clientWidth; return { W, H: Math.round(W * (isStacked(W) ? ASPECT_STACKED : ASPECT)) }; }
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
    applyView();
    const svgResult = emulator.predict(params);
    const { padL, geoms } = layout(W, H);
    const P = [];
    P.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="serif">`);
    P.push(`<rect width="${W}" height="${H}" fill="${EXPORT_BG}"/>`);
    const tf = STYLE.tickFont*SS;
    const svgCurves = {};
    for (const spec of SPECS) svgCurves[spec] = displayCurve(svgResult, spec);
    geoms.forEach((gm,i) => {
      const { X0, X1, Y0, Y1, spec } = gm;
      const isBottom = gm.isBottom;
      VIEW = gm.view;
      const c = svgCurves[spec];
      const range = dynRange(spec, c.value); const [rLo,rHi] = range;
      const yPix = makeYPix(spec, Y0, Y1, range);
      const majorY = VIEW.yLog[spec] ? logTicks(rLo,rHi) : linTicks(rLo,rHi);
      const tickLen=6*SS, minorLen=3.2*SS;
      P.push(`<rect x="${X0}" y="${Y0}" width="${X1-X0}" height="${Y1-Y0}" fill="none" stroke="#000" stroke-width="${STYLE.frameWidth*SS}"/>`);
      if (XAXIS !== 'loglin') for (let xv=VIEW.xmin; xv<=VIEW.xmax; xv+=VIEW.xminor){
        if (VIEW.xticks.includes(xv)) continue; const x=xPix(xv,X0,X1);
        P.push(`<line x1="${x}" y1="${Y1}" x2="${x}" y2="${Y1-minorLen}" stroke="#000" stroke-width="${STYLE.frameWidth*SS}"/>`);
        P.push(`<line x1="${x}" y1="${Y0}" x2="${x}" y2="${Y0+minorLen}" stroke="#000" stroke-width="${STYLE.frameWidth*SS}"/>`);
      }
      for (const xt of (XAXIS==='loglin'?XTICKS_LL:VIEW.xticks)){
        const x=xPix(xt,X0,X1);
        P.push(`<line x1="${x}" y1="${Y1}" x2="${x}" y2="${Y1-tickLen}" stroke="#000" stroke-width="${STYLE.frameWidth*SS}"/>`);
        P.push(`<line x1="${x}" y1="${Y0}" x2="${x}" y2="${Y0+tickLen}" stroke="#000" stroke-width="${STYLE.frameWidth*SS}"/>`);
        if (isBottom) P.push(`<text x="${x}" y="${Y1+6*SS+tf}" font-size="${tf}" text-anchor="middle">${xt}</text>`);
      }
      for (const yt of majorY){
        if (yt<rLo-1e-12||yt>rHi+1e-12) continue; const y=yPix(yt);
        P.push(`<line x1="${X0}" y1="${y}" x2="${X0+tickLen}" y2="${y}" stroke="#000" stroke-width="${STYLE.frameWidth*SS}"/>`);
        P.push(`<text x="${X0-6*SS}" y="${y+tf*0.34}" font-size="${tf}" text-anchor="end">${svgEsc(fmtYTick(spec,yt))}</text>`);
      }
      if (VIEW.yLog[spec]){
        for (let e=Math.floor(Math.log10(rLo)); e<=Math.ceil(Math.log10(rHi)); e++)
          for (const s of [0.3,0.6,0.9]){ const v=s*Math.pow(10,e+1); if(v<rLo||v>rHi)continue;
            const y=yPix(v); P.push(`<line x1="${X0}" y1="${y}" x2="${X0+minorLen}" y2="${y}" stroke="#000" stroke-width="${STYLE.frameWidth*SS}"/>`); }
      } else {
        const ms=linStep(rLo,rHi)/5;
        for (let v=Math.ceil(rLo/ms)*ms; v<=rHi+1e-9; v+=ms){ if(majorY.some(mt=>Math.abs(mt-v)<1e-9))continue;
          const y=yPix(v); P.push(`<line x1="${X0}" y1="${y}" x2="${X0+minorLen}" y2="${y}" stroke="#000" stroke-width="${STYLE.frameWidth*SS}"/>`); }
      }
      P.push(`<clipPath id="clip${i}"><rect x="${X0}" y="${Y0}" width="${X1-X0}" height="${Y1-Y0}"/></clipPath>`);
      P.push(`<g clip-path="url(#clip${i})">`);
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
      }
      const poly = (xs,ys,pred) => { let pts=''; for(let k=0;k<xs.length;k++){ const l=xs[k]; if(pred&&(l<VIEW.xmin||l>VIEW.xmax))continue;
          pts += `${xPix(l,X0,X1).toFixed(1)},${ys(k).toFixed(1)} `; } return pts.trim(); };
      if (LCDM && VIS.lcdm)
        P.push(`<polyline fill="none" stroke="${COLOR_LCDM}" stroke-width="${STYLE.lcdmWidth*SS}" opacity="0.9" points="${poly(LCDM.ell, k=>yPix(LCDM[spec][k]), true)}"/>`);
      P.push(`<polyline fill="none" stroke="${COLOR_MODEL}" stroke-width="${STYLE.modelWidth*SS}" stroke-linejoin="round" opacity="0.95" points="${poly(c.ell, k=>yPix(c.value[k]), false)}"/>`);
      P.push(`</g>`);
      const cx2=15*SS, cy2=(Y0+Y1)/2, bf=13.5*SS;
      if (gm.col !== 'zoom' || isStacked(W)) P.push(svgTitle(spec, cx2, cy2, bf));
    });
    VIEW = view;
    for (const [x, y] of xLabelSpots(geoms, W, H, padL))
      P.push(`<text x="${x}" y="${y}" font-size="${16*SS}" font-style="italic" text-anchor="middle">ℓ</text>`);
    const items=[];
    if (VIS.lcdm)   items.push(['line',COLOR_LCDM,'ΛCDM']);
    if (VIS.planck) items.push(['dot',COLOR.planck,'Planck 2018']);
    if (VIS.act)    items.push(['dot',COLOR.act,'ACT DR6']);
    if (VIS.spt)    items.push(['dot',COLOR.spt,'SPT-3g D1']);
    const f=STYLE.legendFont*SS, tt=geoms[0];
    let ly=tt.Y0+f+5*SS; const lx=tt.X1-8.8*f;
    for (const [type,color,text] of items){
      if (type==='line') P.push(`<line x1="${lx}" y1="${ly}" x2="${lx+1.4*f}" y2="${ly}" stroke="${color}" stroke-width="${STYLE.lcdmWidth*SS}"/>`);
      else P.push(`<circle cx="${lx+0.7*f}" cy="${ly}" r="${STYLE.markerR*SS}" fill="${color}"/>`);
      P.push(`<text x="${lx+1.8*f}" y="${ly+f*0.34}" font-size="${f}">${svgEsc(text)}</text>`);
      ly += f*1.35;
    }
    P.push('</svg>');
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
    if (cfg.derive) cfg.derive(params);       // refresh dependent params first
    if (cfg.constrainThetaS) solveThetaS();   // then solve Omega_Lambda to hold theta_s
    const { W, H } = resize();
    ctx.clearRect(0,0,W,H);
    SS = Math.max(0.8, Math.min(1.6, W/600));
    const { padL, geoms } = layout(W, H);
    const result = emulator.predict(params);  // ONE inference per update
    drawFigure(ctx, W, H, result);
    placeOverlays(geoms, W, H, padL);
    placeLegend(geoms[0], W);
    updateDerived(result);
    updatePie();
    statusEl.textContent = '';
  }

  // ---- boot ---------------------------------------------------------------
  buildSliders();
  buildOverlays();
  buildLegend();
  (async () => {
    try {
      await initBackend();
      const tasks = [ CMBEmulator.load(cfg.modelUrls, window.tf) ];
      tasks.push(cfg.dataUrl ? fetch(cfg.dataUrl).then(r=>r.ok?r.json():null).then(d=>OBS=d).catch(()=>OBS=null) : Promise.resolve());
      tasks.push(cfg.lcdmUrl ? fetch(cfg.lcdmUrl).then(r=>r.ok?r.json():null).then(d=>LCDM=d).catch(()=>LCDM=null) : Promise.resolve());
      const [emu] = await Promise.all(tasks);
      emulator = emu;
      if (disp.reference === 'model') buildModelReference();
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
