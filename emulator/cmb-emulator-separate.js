/* =============================================================================
 * cmb-emulator-separate.js  (S3 deployment: three single-spectrum models)
 * -----------------------------------------------------------------------------
 * Same public API as cmb-emulator.js (load / predict / curve / curveFrom, and a
 * META with inputNames/ranges/defaults), but backed by THREE separate CONNECT
 * graph models — one per spectrum:
 *   sep_tt_5000ep : 121 outputs -> TT[0:115] + 6 derived[115:121]
 *   sep_te_5000ep : 115 outputs -> TE[0:115]
 *   sep_ee_5000ep : 115 outputs -> EE[0:115]
 * predict() runs the three models ONCE and assembles the same
 * {ell, Cl, Dl, derived} shape the joint emulator returns, so the page's
 * render()/curveFrom() path is unchanged. Derived params come from the TT model.
 *
 * IMPORTANT — input basis: these models were trained with log10(omega_cdm) as
 * the network input (the other 5 inputs stay physical), with a deployment clamp
 * omega_cdm >= 0.005 applied underneath a full-range slider. That transform is
 * applied here in _inputVector(). (The older joint model on this site used a
 * LINEAR omega_cdm input and no clamp — do not copy that behavior here.)
 * ===========================================================================*/

export const META = {
  inputNames: ['omega_b', 'omega_cdm', 'Omega_Lambda', 'ln10^{10}A_s', 'n_s', 'tau_reio'],
  ranges: {
    'omega_b':      [0.015, 0.03],
    'omega_cdm':    [1e-5,  0.25],
    'Omega_Lambda': [0.0,   0.90],
    'ln10^{10}A_s': [1.5,   4.5],
    'n_s':          [0.7,   1.3],
    'tau_reio':     [0.01,  0.2],
  },
  defaults: {
    'omega_b': 0.02237, 'omega_cdm': 0.12, 'Omega_Lambda': 0.685,
    'ln10^{10}A_s': 3.044, 'n_s': 0.9649, 'tau_reio': 0.0544,
  },
  // Per-model output layout.
  perModel: {
    tt: { dl: [0, 115], derived: [115, 121] },
    te: { dl: [0, 115] },
    ee: { dl: [0, 115] },
  },
  derivedNames: ['z_reio', 'Omega_Lambda', 'YHe', 'A_s', 'sigma8', '100*theta_s'],
  ell: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,19,21,23,25,28,31,34,38,42,47,52,58,64,71,79,88,98,
        109,122,136,152,170,190,212,237,265,296,331,370,409,448,487,526,565,604,643,682,721,760,799,
        838,877,916,955,994,1033,1072,1111,1150,1189,1228,1267,1306,1345,1384,1423,1462,1501,1540,
        1579,1618,1657,1696,1735,1774,1813,1852,1891,1930,1969,2008,2047,2086,2125,2164,2203,2242,
        2281,2320,2359,2398,2437,2476,2530,2630,2730,2830,2930,3030,3130,3230,3330,3430,3530,3630,
        3730,3830,3930,4030],
  T_CMB_uK: 2.7255e6,
  OMEGA_CDM_CLAMP: 0.005,   // deployment clamp applied underneath the slider
};

// ---- Natural cubic spline (identical to cmb-emulator.js) --------------------
function makeSpline(xs, ys) {
  const n = xs.length, h = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) h[i] = xs[i + 1] - xs[i];
  const alpha = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) alpha[i] = (3 / h[i]) * (ys[i + 1] - ys[i]) - (3 / h[i - 1]) * (ys[i] - ys[i - 1]);
  const l = new Array(n).fill(0), mu = new Array(n).fill(0), z = new Array(n).fill(0); l[0] = 1;
  for (let i = 1; i < n - 1; i++) { l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1]; mu[i] = h[i] / l[i]; z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i]; }
  l[n - 1] = 1; const c = new Array(n).fill(0), b = new Array(n - 1).fill(0), d = new Array(n - 1).fill(0);
  for (let j = n - 2; j >= 0; j--) { c[j] = z[j] - mu[j] * c[j + 1]; b[j] = (ys[j + 1] - ys[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3; d[j] = (c[j + 1] - c[j]) / (3 * h[j]); }
  return function f(x) {
    if (x <= xs[0]) return ys[0] + b[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + b[n - 2] * (x - xs[n - 1]);
    let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] > x) hi = m; else lo = m; }
    const dx = x - xs[lo]; return ys[lo] + b[lo] * dx + c[lo] * dx * dx + d[lo] * dx * dx * dx;
  };
}
const PREF = (l) => (l * (l + 1)) / (2 * Math.PI);

export class CMBEmulatorSeparate {
  constructor(models, tf) { this.models = models; this.tf = tf; this.meta = META; }

  /** Load the three converted graph models.
   *  @param {{tt:string, te:string, ee:string}} urls  URLs to each model.json
   *  @param {object} tfRef  optional tf reference (defaults to global `tf`) */
  static async load(urls, tfRef) {
    const tf = tfRef || (typeof window !== 'undefined' ? window.tf : globalThis.tf);
    if (!tf) throw new Error('TensorFlow.js (tf) not found on the page.');
    const [tt, te, ee] = await Promise.all([
      tf.loadGraphModel(urls.tt), tf.loadGraphModel(urls.te), tf.loadGraphModel(urls.ee),
    ]);
    return new CMBEmulatorSeparate({ tt, te, ee }, tf);
  }

  /** Build the [1,6] input vector: physical inputs, with omega_cdm -> log10 and
   *  the deployment clamp applied (this is what the network was trained on). */
  _inputVector(params) {
    return META.inputNames.map((name) => {
      let v = params[name];
      if (v === undefined || Number.isNaN(v)) throw new Error(`Missing/NaN param: ${name}`);
      if (name === 'omega_cdm') v = Math.log10(Math.max(v, META.OMEGA_CDM_CLAMP));
      return v;
    });
  }

  /** Run all three models once and assemble {ell, Cl, Dl, derived}. */
  predict(params) {
    const tf = this.tf;
    const vec = this._inputVector(params);
    const raw = tf.tidy(() => {
      const x = tf.tensor2d([vec], [1, 6], 'float32');
      const run = (m) => { const y = m.predict(x); return (Array.isArray(y) ? y[0] : y).dataSync(); };
      return { tt: run(this.models.tt), te: run(this.models.te), ee: run(this.models.ee) };
    });

    const ell = META.ell;
    const sl = (arr, [a, b]) => arr.slice(a, b);
    const Dl = {
      tt: sl(raw.tt, META.perModel.tt.dl),
      te: sl(raw.te, META.perModel.te.dl),
      ee: sl(raw.ee, META.perModel.ee.dl),
    };
    const toCl = (dl) => dl.map((d, i) => d / PREF(ell[i]));
    const Cl = { tt: toCl(Dl.tt), te: toCl(Dl.te), ee: toCl(Dl.ee) };

    const [ds, de] = META.perModel.tt.derived;      // derived ride on the TT model
    const derived = {};
    META.derivedNames.forEach((k, i) => { derived[k] = raw.tt[ds + i]; });
    void de;

    return { ell, Cl, Dl, derived };
  }

  /** Dense plot-ready curve for one spectrum (runs one predict). */
  curve(params, spec, opts = {}) { return this.curveFrom(this.predict(params), spec, opts); }

  /** Like curve() but reuses a precomputed predict() result (identical to the joint module). */
  curveFrom(result, spec, opts = {}) {
    const { quantity = 'Dl', lmin = 2, lmax = 4030, uK2 = false, scale = 1 } = opts;
    const ys = (quantity === 'Cl' ? result.Cl[spec] : result.Dl[spec]);
    const f = makeSpline(META.ell, Array.from(ys));
    const ell = [], value = [];
    const unit = (uK2 ? META.T_CMB_uK * META.T_CMB_uK : 1) * scale;
    for (let l = lmin; l <= lmax; l++) { ell.push(l); value.push(f(l) * unit); }
    return { ell, value };
  }
}

export default CMBEmulatorSeparate;
