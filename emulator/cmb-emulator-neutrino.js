/* =============================================================================
 * cmb-emulator-neutrino.js  (pages_model_neutrino Model A: the N_eff / YHe plane)
 * -----------------------------------------------------------------------------
 * Same public API / shape as cmb-emulator-separate.js, backed by the THREE
 * neutrino single-spectrum graph models (sep_{tt,te,ee}_neutrino):
 *   sep_tt_neutrino : 121 outputs -> TT[0:115] + 6 derived[115:121]
 *   sep_te_neutrino : 115 outputs -> TE[0:115]
 *   sep_ee_neutrino : 115 outputs -> EE[0:115]
 *
 * DIFFERENCES from the S3 module:
 *   - The page sees 2 inputs [N_eff, YHe]; the network takes 3 [N_ur, YHe, omega_cdm] with
 *     N_ur = N_eff (massless neutrinos only) and omega_cdm = f(N_eff), which holds the
 *     matter-radiation equality a_eq fixed. The model was trained ONLY on that omega_cdm(N_eff)
 *     line, so it is always computed here, never a free input.
 *   - Fixed at training time: omega_b, A_s, n_s, tau_reio, and 100*theta_s = 1.041783
 *     (CLASS solved for h), so H0 is a derived output of the model.
 *   - All inputs linear (no log10). ell grid = the S3 grid (115 nodes), linear display axis.
 *   - derived.YHe is replaced by the INPUT YHe (the network's emulated echo is ~1e-3 off).
 * Output is dimensionless Dl = Cl*l(l+1)/2pi (multiply by T_CMB_uK^2 for uK^2).
 *
 * Page lines (YHe as a function of N_eff for neutrinos.html Graphs 1 & 2) come from
 * data/neutrino_lines.json via loadNeutrinoLines(); see emulator/data/README.md.
 * Physics/design: /Users/chase/cosmology/pages_model_neutrino/README.md
 * ===========================================================================*/

// a_eq-fixing tie (must match pages_model_neutrino/make_production_pickle.py)
const OMC_FID = 0.1201075, A_EQ = 0.000293534798833, OMEGA_GAMMA = 2.47297928086e-5;
const A_NU = (8 / 7) * Math.pow(11 / 4, 4 / 3);
export const omegaCdmOf = (neff) => OMC_FID + (neff - 3.044) * OMEGA_GAMMA / (A_NU * A_EQ);

export const META = {
  inputNames: ['N_eff', 'YHe'],                 // what the page/sliders see
  modelInputs: ['N_ur', 'YHe', 'omega_cdm'],    // what the network takes
  ranges: {
    'N_eff': [0.1,   6.9],
    'YHe':   [0.015, 0.483],
  },
  // shared fiducial: N_eff = 3.044, YHe = standard-BBN (PRIMAT 2025) value at 3.044
  defaults: { 'N_eff': 3.044, 'YHe': 0.245640 },
  perModel: {
    tt: { dl: [0, 115], derived: [115, 121] },
    te: { dl: [0, 115] },
    ee: { dl: [0, 115] },
  },
  derivedNames: ['H0', 'z_reio', 'YHe', 'A_s', 'sigma8', '100*theta_s'],
  ell: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,19,21,23,25,28,31,34,38,42,47,52,58,64,71,79,88,98,
        109,122,136,152,170,190,212,237,265,296,331,370,409,448,487,526,565,604,643,682,721,760,799,
        838,877,916,955,994,1033,1072,1111,1150,1189,1228,1267,1306,1345,1384,1423,1462,1501,1540,
        1579,1618,1657,1696,1735,1774,1813,1852,1891,1930,1969,2008,2047,2086,2125,2164,2203,2242,
        2281,2320,2359,2398,2437,2476,2530,2630,2730,2830,2930,3030,3130,3230,3330,3430,3530,3630,
        3730,3830,3930,4030],
  T_CMB_uK: 2.7255e6,
};

// ---- Natural cubic spline (identical to cmb-emulator-separate.js) ------------
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

export class CMBEmulatorNeutrino {
  constructor(models, tf) { this.models = models; this.tf = tf; this.meta = META; }

  /** Load the three converted neutrino graph models.
   *  @param {{tt:string, te:string, ee:string}} urls  URLs to each model.json (or tf IOHandlers) */
  static async load(urls, tfRef) {
    const tf = tfRef || (typeof window !== 'undefined' ? window.tf : globalThis.tf);
    if (!tf) throw new Error('TensorFlow.js (tf) not found on the page.');
    const [tt, te, ee] = await Promise.all([
      tf.loadGraphModel(urls.tt), tf.loadGraphModel(urls.te), tf.loadGraphModel(urls.ee),
    ]);
    return new CMBEmulatorNeutrino({ tt, te, ee }, tf);
  }

  /** Build the [1,3] network input [N_ur, YHe, omega_cdm] from {N_eff, YHe}. Linear (no log10). */
  _inputVector(params) {
    const neff = params['N_eff'], yhe = params['YHe'];
    if (neff === undefined || Number.isNaN(neff)) throw new Error('Missing/NaN param: N_eff');
    if (yhe === undefined || Number.isNaN(yhe)) throw new Error('Missing/NaN param: YHe');
    return [neff, yhe, omegaCdmOf(neff)];
  }

  /** Run all three models once and assemble {ell, Cl, Dl, derived}. */
  predict(params) {
    const tf = this.tf;
    const vec = this._inputVector(params);
    const raw = tf.tidy(() => {
      const x = tf.tensor2d([vec], [1, META.modelInputs.length], 'float32');
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

    const [ds] = META.perModel.tt.derived;          // derived ride on the TT model
    const derived = {};
    META.derivedNames.forEach((k, i) => { derived[k] = raw.tt[ds + i]; });
    derived['YHe'] = params['YHe'];                 // report the exact input, not the emulated echo
    derived['omega_cdm'] = vec[2];

    return { ell, Cl, Dl, derived };
  }

  curve(params, spec, opts = {}) { return this.curveFrom(this.predict(params), spec, opts); }

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

/** Load the page lines (YHe as a function of N_eff) from data/neutrino_lines.json.
 *  Returns { g1(neff), g2(neff), meta }: linear interpolation between CLASS-computed points.
 *   g1 = standard-BBN YHe (CLASS + PRIMAT 2025 table)              -> neutrinos.html Graph 1
 *   g2 = YHe holding the damping angle theta_d at its fiducial value -> neutrinos.html Graph 2 */
export async function loadNeutrinoLines(url) {
  const j = await (await fetch(url)).json();
  const mk = (rows) => {
    const xs = rows.map((r) => r.N_eff), ys = rows.map((r) => r.YHe);
    return (x) => {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
      let lo = 0, hi = xs.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] > x) hi = m; else lo = m; }
      return ys[lo] + (ys[hi] - ys[lo]) * (x - xs[lo]) / (xs[hi] - xs[lo]);
    };
  };
  return { g1: mk(j.G1), g2: mk(j.G2), meta: j.meta };
}

export default CMBEmulatorNeutrino;
