/* =============================================================================
 * cmb-emulator-tensor.js  (pages_model_tensor: tensor-to-scalar-ratio page)
 * -----------------------------------------------------------------------------
 * Same public API / shape as the other emulator modules, but NOT a neural net: a CLASS table.
 * emulator/data/tensor_bb.json holds, for every integer l = 2..2500, the 7 Chebyshev coefficients of the
 * lensed total D_l^BB(r) (lensed scalar + lensed tensor, CLASS v3.3.4) on r in [0, 0.01]:
 *     D_l^BB(r) = sum_{k=0}^{6} coef[k][l-2] T_k(x),   x = 2 r / r_max - 1,
 * evaluated with Clenshaw's recurrence (7 multiply-adds per l), exact at every slider position.
 * Values are already in 10^3 muK^2, the widget's display unit, so curveFrom ignores uK2/scale.
 *   - One slider input 'r100' = 10^2 r in [0, 1]; the table takes r = r100 / 100.
 *   - Physics: rounded Planck 2018 means with one 0.06 eV neutrino, HMcode-2020, inflation-consistent tensor
 *     tilt (CLASS scc), pivot 0.05 Mpc^-1. Fit error vs CLASS <= 7e-12.
 *   - No TensorFlow: the widget skips the tfjs backend for this model (BACKENDS.tensor.noTF).
 * Physics/design: /Users/chase/cosmology/pages_model_tensor/README.md
 * ===========================================================================*/
import { makeSpline } from './cmb-emulator-separate.js';

const ELL = Array.from({ length: 2499 }, (_, i) => i + 2);
export const META = {
  inputNames: ['r100'],                 // slider: 10^2 r
  ranges: { 'r100': [0.0, 1.0] },
  defaults: { 'r100': 0.0 },
  specs: ['bb'],
  derivedNames: [],
  ell: ELL,
};
const SPLINE_TO = 120;   // fractional l (dense sampling on log axes) is splined on l <= SPLINE_TO; integers above

export class CMBEmulatorTensor {
  constructor(table) {
    this.meta = META; this.table = table;
    this.coef = table.coef.map(row => Float64Array.from(row));
    this.rMax = table.meta.r_max;
  }

  /** Load the coefficient table. @param {{table:string}} urls  URL of tensor_bb.json */
  static async load(urls) {
    const res = await fetch(urls.table);
    if (!res.ok) throw new Error(`tensor table: HTTP ${res.status}`);
    const table = await res.json();
    if (table.meta.ell_min !== 2 || table.coef[0].length !== ELL.length) throw new Error('tensor table: unexpected l range');
    return new CMBEmulatorTensor(table);
  }

  /** D_l^BB (10^3 muK^2) at every l = 2..2500 for {r100}. */
  predict(params) {
    const r100 = params['r100'];
    if (r100 === undefined || Number.isNaN(r100)) throw new Error('Missing/NaN param: r100');
    const x = 2 * (r100 / 100) / this.rMax - 1, n = ELL.length, K = this.coef.length;
    const bb = new Array(n);
    for (let i = 0; i < n; i++) {             // Clenshaw: b_k = c_k + 2x b_{k+1} - b_{k+2}
      let b1 = 0, b2 = 0;
      for (let k = K - 1; k >= 1; k--) { const t = 2 * x * b1 - b2 + this.coef[k][i]; b2 = b1; b1 = t; }
      bb[i] = x * b1 - b2 + this.coef[0][i];
    }
    return { ell: ELL, Dl: { bb }, Cl: { bb }, derived: {} };
  }

  curve(params, spec, opts = {}) { return this.curveFrom(this.predict(params), spec, opts); }

  /** D_l on [lmin, lmax] (every integer), or at opts.ells (fractional l splined below SPLINE_TO). */
  curveFrom(result, spec, opts = {}) {
    const { lmin = 2, lmax = 2500 } = opts;
    const v = result.Dl[spec], ell = [], value = [];
    if (opts.ells) {
      const f = makeSpline(ELL.slice(0, SPLINE_TO - 1), v.slice(0, SPLINE_TO - 1));
      for (const l of opts.ells) {
        if (l < 2 || l > 2500) continue;
        ell.push(l); value.push(Number.isInteger(l) ? v[l - 2] : f(l));
      }
    } else for (let l = Math.max(2, lmin); l <= Math.min(2500, lmax); l++) { ell.push(l); value.push(v[l - 2]); }
    return { ell, value };
  }
}

export default CMBEmulatorTensor;
