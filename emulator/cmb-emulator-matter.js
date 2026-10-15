/* =============================================================================
 * cmb-emulator-matter.js  (pages_model_matter: the Baryons & Dark Matter page model)
 * -----------------------------------------------------------------------------
 * Same public API / shape as cmb-emulator-separate.js, backed by the THREE matter
 * single-spectrum graph models (sep_{tt,te,ee}_matter):
 *   sep_tt_matter : 122 outputs -> TT[0:115] + 7 derived[115:122]
 *   sep_te_matter : 115 outputs -> TE[0:115]
 *   sep_ee_matter : 115 outputs -> EE[0:115]
 *
 * DIFFERENCES from the S3 module:
 *   - 3 inputs [omega_b, omega_cdm, Omega_Lambda], all LINEAR (no log10). n_s, tau_reio,
 *     ln10^{10}A_s are fixed at Planck and YHe = 0.245 is fixed (that is what lets omega_b run
 *     past the BBN table, up to omega_m). Flat: H0 comes from the closure baked into training,
 *     and is a model OUTPUT (derived.H0).
 *   - Box: omega_b [0.005, 0.14237], omega_cdm [1e-5, 0.25], Omega_Lambda [0.50, 0.98]; the model
 *     was trained only along the page's two graphs (Graph 1: omega_cdm at fixed omega_b and
 *     Omega_Lambda; Graph 2: omega_b with omega_cdm = omega_m - omega_b and Omega_Lambda on the
 *     theta_s-fixed curve from loadMatterOmegaL()).
 *   - ell grid = the S3 grid (115 nodes); linear display axis.
 * Output is dimensionless Dl = Cl*l(l+1)/2pi (multiply by T_CMB_uK^2 for uK^2).
 * Physics/design: /Users/chase/cosmology/pages_model_matter/README.md
 * ===========================================================================*/

export const META = {
  inputNames: ['omega_b', 'omega_cdm', 'Omega_Lambda'],
  ranges: {
    'omega_b':      [0.005, 0.14237],
    'omega_cdm':    [1e-5,  0.25],
    'Omega_Lambda': [0.50,  0.98],
  },
  defaults: { 'omega_b': 0.02237, 'omega_cdm': 0.12, 'Omega_Lambda': 0.685 },
  perModel: {
    tt: { dl: [0, 115], derived: [115, 122] },
    te: { dl: [0, 115] },
    ee: { dl: [0, 115] },
  },
  derivedNames: ['H0', 'z_reio', 'Omega_Lambda', 'YHe', 'A_s', 'sigma8', '100*theta_s'],
  ell: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,19,21,23,25,28,31,34,38,42,47,52,58,64,71,79,88,98,
        109,122,136,152,170,190,212,237,265,296,331,370,409,448,487,526,565,604,643,682,721,760,799,
        838,877,916,955,994,1033,1072,1111,1150,1189,1228,1267,1306,1345,1384,1423,1462,1501,1540,
        1579,1618,1657,1696,1735,1774,1813,1852,1891,1930,1969,2008,2047,2086,2125,2164,2203,2242,
        2281,2320,2359,2398,2437,2476,2530,2630,2730,2830,2930,3030,3130,3230,3330,3430,3530,3630,
        3730,3830,3930,4030],
  T_CMB_uK: 2.7255e6,
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

export class CMBEmulatorMatter {
  constructor(models, tf) { this.models = models; this.tf = tf; this.meta = META; }

  /** Load the three converted matter graph models.
   *  @param {{tt:string, te:string, ee:string}} urls  URLs to each model.json (or tf IOHandlers) */
  static async load(urls, tfRef) {
    const tf = tfRef || (typeof window !== 'undefined' ? window.tf : globalThis.tf);
    if (!tf) throw new Error('TensorFlow.js (tf) not found on the page.');
    const [tt, te, ee] = await Promise.all([
      tf.loadGraphModel(urls.tt), tf.loadGraphModel(urls.te), tf.loadGraphModel(urls.ee),
    ]);
    return new CMBEmulatorMatter({ tt, te, ee }, tf);
  }

  /** Build the [1,3] input vector. Linear inputs (NO log10). */
  _inputVector(params) {
    return META.inputNames.map((name) => {
      const v = params[name];
      if (v === undefined || Number.isNaN(v)) throw new Error(`Missing/NaN param: ${name}`);
      return v;
    });
  }

  /** Run all three models once and assemble {ell, Cl, Dl, derived}. */
  predict(params) {
    const tf = this.tf;
    const vec = this._inputVector(params);
    const raw = tf.tidy(() => {
      const x = tf.tensor2d([vec], [1, META.inputNames.length], 'float32');
      const run = (m) => { const y = m.predict(x); return (Array.isArray(y) ? y[0] : y).dataSync(); };
      return { tt: run(this.models.tt), te: run(this.models.te), ee: run(this.models.ee) };
    });
    const ell = META.ell;
    const sl = (arr, [a, b]) => arr.slice(a, b);
    const Dl = { tt: sl(raw.tt, META.perModel.tt.dl), te: sl(raw.te, META.perModel.te.dl), ee: sl(raw.ee, META.perModel.ee.dl) };
    const toCl = (dl) => dl.map((d, i) => d / PREF(ell[i]));
    const Cl = { tt: toCl(Dl.tt), te: toCl(Dl.te), ee: toCl(Dl.ee) };
    const [ds] = META.perModel.tt.derived;          // derived ride on the TT model
    const derived = {};
    META.derivedNames.forEach((k, i) => { derived[k] = raw.tt[ds + i]; });
    return { ell, Cl, Dl, derived };
  }

  curve(params, spec, opts = {}) { return this.curveFrom(this.predict(params), spec, opts); }

  curveFrom(result, spec, opts = {}) {
    const { quantity = 'Dl', lmin = 2, lmax = 4030, uK2 = false, scale = 1 } = opts;
    const ys = (quantity === 'Cl' ? result.Cl[spec] : result.Dl[spec]);
    const f = makeSpline(META.ell, Array.from(ys));
    const ell = [], value = [];
    const unit = (uK2 ? META.T_CMB_uK * META.T_CMB_uK : 1) * scale;
    // opts.ells: explicit l values to evaluate (fractional allowed, e.g. dense sampling for log l axes);
    // default every integer in [lmin, lmax]
    if (opts.ells) for (const l of opts.ells) { ell.push(l); value.push(f(l) * unit); }
    else for (let l = lmin; l <= lmax; l++) { ell.push(l); value.push(f(l) * unit); }
    return { ell, value };
  }
}

/** Load Graph 2's Omega_Lambda(omega_b) curve (data/matter_g2_omegal.json): the theta_s-fixed curve the
 *  model was trained on. Returns { omegaL(omega_b), meta }; linear interpolation (max error 6e-7). */
export async function loadMatterOmegaL(url) {
  const j = await (await fetch(url)).json();
  const xs = j.omega_b, ys = j.Omega_Lambda;
  const omegaL = (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
    let lo = 0, hi = xs.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] > x) hi = m; else lo = m; }
    return ys[lo] + (ys[hi] - ys[lo]) * (x - xs[lo]) / (xs[hi] - xs[lo]);
  };
  return { omegaL, meta: j.meta };
}

export default CMBEmulatorMatter;
