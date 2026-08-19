/* =============================================================================
 * cmb-emulator.js
 * -----------------------------------------------------------------------------
 * Framework-agnostic browser inference for a CONNECT CMB emulator converted to
 * a TensorFlow.js graph model.
 *
 * Model: omega_lambda_sparse4100_stdlog
 *   - 6 inputs  : omega_b, omega_cdm, Omega_Lambda, ln10^{10}A_s, n_s, tau_reio
 *   - 351 raw outputs (Dl for spectra; derived params, all physical/raw):
 *       0:115    TT      115:230  TE      230:345 EE
 *       345 z_reio, 346 Omega_Lambda, 347 YHe, 348 A_s, 349 sigma8, 350 100*theta_s
 *   - Input standardisation AND output denormalisation are BAKED INTO the graph,
 *     including the log-space transform used for TT/EE (the network was trained
 *     on log-standardised TT/EE and standardised TE/derived; the exp() + clip
 *     that undoes the log transform is part of the exported graph itself).
 *   - Unlike the older `omega_lambda_divided` model, there is NO A_s
 *     preprocessing here: the training data itself is raw D_ell = l(l+1)Cl/2pi
 *     (see connect_public/source/calc_models_mpi.py), so the graph's raw
 *     output is ALREADY physical. Do NOT multiply by A_s.
 *
 * Requires @tensorflow/tfjs (or tfjs-core + tfjs-converter + a backend) on the
 * page as the global `tf`, or pass a tf reference to CMBEmulator.load().
 * ===========================================================================*/

// ---- Static metadata (extracted from the CONNECT model's info_dict) ---------
export const META = {
  // Input order the network expects. DO NOT reorder.
  inputNames: ['omega_b', 'omega_cdm', 'Omega_Lambda', 'ln10^{10}A_s', 'n_s', 'tau_reio'],

  // Slider bounds = training/sampling ranges from the .param file.
  ranges: {
    'omega_b':      [0.015, 0.03],
    'omega_cdm':    [1e-5,  0.25],
    'Omega_Lambda': [0.0,   0.90],
    'ln10^{10}A_s': [1.5,   4.5],
    'n_s':          [0.7,   1.3],
    'tau_reio':     [0.01,  0.2],
  },

  // Sensible Planck-ish defaults (within range; 3rd slot is Omega_Lambda).
  defaults: {
    'omega_b': 0.02237, 'omega_cdm': 0.12, 'Omega_Lambda': 0.685,
    'ln10^{10}A_s': 3.044, 'n_s': 0.9649, 'tau_reio': 0.0544,
  },

  // Output slicing.
  intervals: { tt: [0, 115], te: [115, 230], ee: [230, 345] },
  derivedIndex: { z_reio: 345, Omega_Lambda: 346, YHe: 347, A_s: 348, sigma8: 349, '100*theta_s': 350 },

  // The 115 emulated multipoles (l_max_scalars = 4030 for this model).
  ell: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,19,21,23,25,28,31,34,38,42,47,52,58,64,71,79,88,98,
        109,122,136,152,170,190,212,237,265,296,331,370,409,448,487,526,565,604,643,682,721,760,799,
        838,877,916,955,994,1033,1072,1111,1150,1189,1228,1267,1306,1345,1384,1423,1462,1501,1540,
        1579,1618,1657,1696,1735,1774,1813,1852,1891,1930,1969,2008,2047,2086,2125,2164,2203,2242,
        2281,2320,2359,2398,2437,2476,2530,2630,2730,2830,2930,3030,3130,3230,3330,3430,3530,3630,
        3730,3830,3930,4030],

  // CMB monopole temperature in microkelvin, for optional Dl conversion to uK^2.
  T_CMB_uK: 2.7255e6,
};

// ---- Natural cubic spline (handles the irregular, low-l-dense grid) ---------
// Returns an interpolator f(x). Linear extrapolation outside [xs[0], xs[n-1]].
function makeSpline(xs, ys) {
  const n = xs.length;
  const h = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) h[i] = xs[i + 1] - xs[i];

  // Solve tridiagonal system for second derivatives (natural BC: y''=0 at ends).
  const alpha = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    alpha[i] = (3 / h[i]) * (ys[i + 1] - ys[i]) - (3 / h[i - 1]) * (ys[i] - ys[i - 1]);
  }
  const l = new Array(n).fill(0), mu = new Array(n).fill(0), z = new Array(n).fill(0);
  l[0] = 1;
  for (let i = 1; i < n - 1; i++) {
    l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1];
    mu[i] = h[i] / l[i];
    z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
  }
  l[n - 1] = 1;
  const c = new Array(n).fill(0), b = new Array(n - 1).fill(0), d = new Array(n - 1).fill(0);
  for (let j = n - 2; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1];
    b[j] = (ys[j + 1] - ys[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3;
    d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
  }

  return function f(x) {
    // Locate interval (binary search); clamp to ends with linear extrapolation.
    if (x <= xs[0])       return ys[0] + b[0] * (x - xs[0]);
    if (x >= xs[n - 1])   return ys[n - 1] + b[n - 2] * (x - xs[n - 1]); // tangent at last knot
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] > x) hi = m; else lo = m; }
    const dx = x - xs[lo];
    return ys[lo] + b[lo] * dx + c[lo] * dx * dx + d[lo] * dx * dx * dx;
  };
}

// ---- Helpers ----------------------------------------------------------------
const PREF = (l) => (l * (l + 1)) / (2 * Math.PI);   // Dl prefactor l(l+1)/2pi

export class CMBEmulator {
  constructor(model, tf) { this.model = model; this.tf = tf; this.meta = META; }

  /** Load the converted graph model.
   *  @param {string} modelUrl  URL to model.json (shards must sit beside it).
   *  @param {object} tfRef     optional tf reference (defaults to global `tf`). */
  static async load(modelUrl, tfRef) {
    const tf = tfRef || (typeof window !== 'undefined' ? window.tf : globalThis.tf);
    if (!tf) throw new Error('TensorFlow.js (tf) not found on the page.');
    const model = await tf.loadGraphModel(modelUrl);
    return new CMBEmulator(model, tf);
  }

  /** Build the [1,6] input tensor from a params object, in the required order. */
  _inputVector(params) {
    return META.inputNames.map((name) => {
      const v = params[name];
      if (v === undefined || Number.isNaN(v)) throw new Error(`Missing/NaN param: ${name}`);
      return v;
    });
  }

  /**
   * Run inference and post-process.
   * @param {object} params  { omega_b, omega_cdm, Omega_Lambda, 'ln10^{10}A_s', n_s, tau_reio }
   * @returns {object} {
   *   ell:       number[115]           (emulated multipoles)
   *   Cl:        { tt, te, ee }        physical Cl at the 115 ell points
   *   Dl:        { tt, te, ee }        Dl = l(l+1)Cl/2pi at the 115 ell points (native units)
   *   derived:   { z_reio, Omega_Lambda, YHe, A_s, sigma8, '100*theta_s' }
   * }
   */
  predict(params) {
    const tf = this.tf;
    const raw = tf.tidy(() => {
      const x = tf.tensor2d([this._inputVector(params)], [1, 6], 'float32');
      const y = this.model.predict(x);                       // [1,351]
      return (Array.isArray(y) ? y[0] : y).dataSync();        // Float32Array(351)
    });

    // No A_s rescaling here: this model has no A_s preprocessing, and the
    // graph's output is already physical D_ell (the exp()/clip for the
    // log-standardised TT/EE columns is baked into the exported graph).
    const ell = META.ell;
    const sliceDl = ([a, b]) => raw.slice(a, b);

    const Dl = {
      tt: sliceDl(META.intervals.tt),
      te: sliceDl(META.intervals.te),
      ee: sliceDl(META.intervals.ee),
    };

    const toCl = (dl) => dl.map((d, i) => d / PREF(ell[i]));     // D_ell -> C_l
    const Cl = { tt: toCl(Dl.tt), te: toCl(Dl.te), ee: toCl(Dl.ee) };

    const derived = {};
    for (const [k, idx] of Object.entries(META.derivedIndex)) derived[k] = raw[idx];

    return { ell, Cl, Dl, derived };
  }

  /**
   * Dense, plot-ready curve for one spectrum, spline-interpolated from the 115
   * emulated points onto integer multipoles.
   * @param {object} params
   * @param {'tt'|'te'|'ee'} spec
   * @param {object} opts  { quantity:'Dl'|'Cl' (default 'Dl'),
   *                         lmin:2, lmax:4030, uK2:false, scale:1 }
   *   uK2   - multiply by T_CMB^2 to convert dimensionless -> uK^2
   *   scale - extra constant multiplier (e.g. 1e-3 to plot in 10^3 uK^2)
   * @returns {{ ell:number[], value:number[] }}
   */
  curve(params, spec, opts = {}) {
    const { quantity = 'Dl', lmin = 2, lmax = 4030, uK2 = false, scale = 1 } = opts;
    const r = this.predict(params);
    const ys = (quantity === 'Cl' ? r.Cl[spec] : r.Dl[spec]);

    // Spline in the plotted quantity (best peak fidelity for Dl).
    const f = makeSpline(META.ell, Array.from(ys));
    const ell = [], value = [];
    const unit = (uK2 ? META.T_CMB_uK * META.T_CMB_uK : 1) * scale;
    for (let l = lmin; l <= lmax; l++) { ell.push(l); value.push(f(l) * unit); }
    return { ell, value };
  }
}

export default CMBEmulator;
