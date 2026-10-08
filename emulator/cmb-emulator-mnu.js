/* =============================================================================
 * cmb-emulator-mnu.js  (pages_model_massive_neutrino Model B: total neutrino mass)
 * -----------------------------------------------------------------------------
 * Same public API / shape as the other emulator modules, backed by the THREE
 * neutrino-mass graph models (sep_{tt,ee,pp}_mnu_reparam):
 *   sep_tt_mnu_reparam : 132 outputs -> R_TT[0:123] + 9 derived[123:132]
 *   sep_ee_mnu_reparam : 123 outputs -> R_EE[0:123]
 *   sep_pp_mnu_reparam : 123 outputs -> R_pp[0:123]   (lensing potential, phi-phi)
 *
 * DIFFERENCES from the other modules:
 *   - The outputs are RATIOS R = C_l(M_nu) / C_l(M_nu = 0), dimensionless, for TT, EE and phi-phi
 *     (no TE). The model was trained as R = 1 + m_ncdm*g, which is baked into the saved graph, so
 *     R(M_nu = 0) = 1 exactly. Result fields are named Dl/Cl like the other modules so the shared
 *     widget can draw them; both hold R (the l(l+1)/2pi prefactor cancels in a ratio).
 *   - One slider input M_nu (total mass, eV); the network takes m_ncdm = M_nu/3 (three degenerate
 *     massive neutrinos). omega_b, omega_cdm, A_s, n_s, tau and 100*theta_s were fixed at training
 *     (CLASS solved for h), so H0 is a model output.
 *   - ell grid = the geo grid (every integer 2..30, then sparse to 4030), 123 nodes.
 *   - derived also reports the physical densities omega_b, omega_cdm (fixed) and
 *     omega_nu = M_nu / 93.14 eV, for the matter-density pie.
 * Physics/design: /Users/chase/cosmology/pages_model_massive_neutrino/README.md
 * ===========================================================================*/

const OMEGA_B = 0.0223828, OMEGA_CDM = 0.1201075, EV_PER_OMEGA_NU = 93.14;

export const META = {
  inputNames: ['M_nu'],                 // slider: total neutrino mass [eV]
  modelInputs: ['m_ncdm'],              // network: per-species mass = M_nu / 3
  ranges: { 'M_nu': [0.0, 1.0] },
  defaults: { 'M_nu': 0.0 },
  specs: ['tt', 'ee', 'pp'],
  perModel: {
    tt: { dl: [0, 123], derived: [123, 132] },
    ee: { dl: [0, 123] },
    pp: { dl: [0, 123] },
  },
  derivedNames: ['H0', 'z_reio', 'Omega_m', 'Omega_Lambda', 'YHe', 'A_s', 'sigma8', '100*theta_s', 'Neff'],
  ell: [
        2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,
        22,23,24,25,26,27,28,29,30,31,34,38,42,47,52,58,64,71,79,88,
        98,109,122,136,152,170,190,212,237,265,296,331,370,409,448,487,526,565,604,643,
        682,721,760,799,838,877,916,955,994,1033,1072,1111,1150,1189,1228,1267,1306,1345,1384,1423,
        1462,1501,1540,1579,1618,1657,1696,1735,1774,1813,1852,1891,1930,1969,2008,2047,2086,2125,2164,2203,
        2242,2281,2320,2359,2398,2437,2476,2530,2630,2730,2830,2930,3030,3130,3230,3330,3430,3530,3630,3730,
        3830,3930,4030],
  T_CMB_uK: 2.7255e6,
};

// ---- Natural cubic spline (identical to the other emulator modules) ----------
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

export class CMBEmulatorMnu {
  constructor(models, tf) { this.models = models; this.tf = tf; this.meta = META; }

  /** Load the three converted neutrino-mass graph models.
   *  @param {{tt:string, ee:string, pp:string}} urls  URLs to each model.json (or tf IOHandlers) */
  static async load(urls, tfRef) {
    const tf = tfRef || (typeof window !== 'undefined' ? window.tf : globalThis.tf);
    if (!tf) throw new Error('TensorFlow.js (tf) not found on the page.');
    const [tt, ee, pp] = await Promise.all([
      tf.loadGraphModel(urls.tt), tf.loadGraphModel(urls.ee), tf.loadGraphModel(urls.pp),
    ]);
    return new CMBEmulatorMnu({ tt, ee, pp }, tf);
  }

  /** Build the [1,1] network input [m_ncdm] from {M_nu}. */
  _inputVector(params) {
    const M = params['M_nu'];
    if (M === undefined || Number.isNaN(M)) throw new Error('Missing/NaN param: M_nu');
    return [M / 3];
  }

  /** Run all three models once and assemble {ell, Cl, Dl, derived}; Cl and Dl both hold the ratio R. */
  predict(params) {
    const tf = this.tf;
    const vec = this._inputVector(params);
    const raw = tf.tidy(() => {
      const x = tf.tensor2d([vec], [1, META.modelInputs.length], 'float32');
      const run = (m) => { const y = m.predict(x); return (Array.isArray(y) ? y[0] : y).dataSync(); };
      return { tt: run(this.models.tt), ee: run(this.models.ee), pp: run(this.models.pp) };
    });
    const sl = (arr, [a, b]) => Array.from(arr.slice(a, b));
    const R = { tt: sl(raw.tt, META.perModel.tt.dl), ee: sl(raw.ee, META.perModel.ee.dl), pp: sl(raw.pp, META.perModel.pp.dl) };

    const [ds] = META.perModel.tt.derived;
    const derived = {};
    META.derivedNames.forEach((k, i) => { derived[k] = raw.tt[ds + i]; });
    derived.omega_b = OMEGA_B; derived.omega_cdm = OMEGA_CDM;
    derived.omega_nu = params['M_nu'] / EV_PER_OMEGA_NU;

    return { ell: META.ell, Cl: R, Dl: R, derived };
  }

  curve(params, spec, opts = {}) { return this.curveFrom(this.predict(params), spec, opts); }

  /** Ratio on every integer l in [lmin, lmax]. uK2/scale are ignored (ratios are dimensionless). */
  curveFrom(result, spec, opts = {}) {
    const { lmin = 2, lmax = 4030 } = opts;
    const f = makeSpline(META.ell, result.Dl[spec]);
    const ell = [], value = [];
    for (let l = lmin; l <= lmax; l++) { ell.push(l); value.push(f(l)); }
    return { ell, value };
  }
}

export default CMBEmulatorMnu;
