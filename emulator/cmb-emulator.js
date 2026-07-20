/* =============================================================================
 * cmb-emulator.js
 * -----------------------------------------------------------------------------
 * Framework-agnostic browser inference for a CONNECT CMB emulator converted to
 * a TensorFlow.js graph model.
 *
 * Model: omega_lambda_divided
 *   - 6 inputs  : omega_b, omega_cdm, Omega_Lambda, ln10^{10}A_s, n_s, tau_reio
 *   - 300 raw outputs (Cl/A_s for spectra; derived params raw):
 *       0:98    TT      98:196  TE      196:294 EE
 *       294 z_reio, 295 Omega_Lambda, 296 YHe, 297 A_s, 298 sigma8, 299 100*theta_s
 *   - Input standardisation + output denormalisation are BAKED INTO the graph.
 *   - Spectra were trained on Cl / A_s, so they MUST be multiplied back by
 *       A_s = 1e-10 * exp(ln10^{10}A_s)
 *     to recover physical Cl. Derived parameters are NOT rescaled.
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
  intervals: { tt: [0, 98], te: [98, 196], ee: [196, 294] },
  derivedIndex: { z_reio: 294, Omega_Lambda: 295, YHe: 296, A_s: 297, sigma8: 298, '100*theta_s': 299 },

  // The 98 emulated multipoles.
  ell: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,19,21,23,25,28,31,34,38,42,47,52,58,64,71,79,88,98,
        109,122,136,152,170,190,212,237,265,296,331,370,410,450,490,530,570,610,650,690,730,770,810,
        850,890,930,970,1010,1050,1090,1130,1170,1210,1250,1290,1330,1370,1410,1450,1490,1530,1570,
        1610,1650,1690,1730,1770,1810,1850,1890,1930,1970,2010,2050,2090,2130,2170,2210,2250,2290,
        2330,2370,2410,2450,2490],

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
   *   ell:       number[98]            (emulated multipoles)
   *   Cl:        { tt, te, ee }        physical Cl at the 98 ell points
   *   Dl:        { tt, te, ee }        Dl = l(l+1)Cl/2pi at the 98 ell points (native units)
   *   derived:   { z_reio, Omega_Lambda, YHe, A_s, sigma8, '100*theta_s' }
   *   A_s:       number                value used for rescaling (from the slider)
   * }
   */
  predict(params) {
    const tf = this.tf;
    const raw = tf.tidy(() => {
      const x = tf.tensor2d([this._inputVector(params)], [1, 6], 'float32');
      const y = this.model.predict(x);                       // [1,300]
      return (Array.isArray(y) ? y[0] : y).dataSync();        // Float32Array(300)
    });

    // A_s comes from the slider value, not the network.
    const A_s = 1e-10 * Math.exp(params['ln10^{10}A_s']);

    // IMPORTANT: this CONNECT model was trained on D_ell = l(l+1)C_l/2pi
    // (dimensionless), NOT bare C_l. So raw * A_s IS physical D_ell already.
    // Do NOT multiply by the l(l+1)/2pi prefactor again. C_l is obtained by
    // dividing it back out.
    const ell = META.ell;
    const sliceDl = ([a, b]) => {
      const out = new Float64Array(b - a);
      for (let i = a; i < b; i++) out[i - a] = raw[i] * A_s;   // D_ell/A_s -> physical D_ell
      return out;
    };

    const Dl = {
      tt: sliceDl(META.intervals.tt),
      te: sliceDl(META.intervals.te),
      ee: sliceDl(META.intervals.ee),
    };

    const toCl = (dl) => dl.map((d, i) => d / PREF(ell[i]));     // D_ell -> C_l
    const Cl = { tt: toCl(Dl.tt), te: toCl(Dl.te), ee: toCl(Dl.ee) };

    const derived = {};
    for (const [k, idx] of Object.entries(META.derivedIndex)) derived[k] = raw[idx];

    return { ell, Cl, Dl, derived, A_s };
  }

  /**
   * Dense, plot-ready curve for one spectrum, spline-interpolated from the 98
   * emulated points onto integer multipoles.
   * @param {object} params
   * @param {'tt'|'te'|'ee'} spec
   * @param {object} opts  { quantity:'Dl'|'Cl' (default 'Dl'),
   *                         lmin:2, lmax:2490, uK2:false, scale:1 }
   *   uK2   - multiply by T_CMB^2 to convert dimensionless -> uK^2
   *   scale - extra constant multiplier (e.g. 1e-3 to plot in 10^3 uK^2)
   * @returns {{ ell:number[], value:number[] }}
   */
  curve(params, spec, opts = {}) {
    const { quantity = 'Dl', lmin = 2, lmax = 2490, uK2 = false, scale = 1 } = opts;
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
