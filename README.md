# CMBverse

An interactive educational website showing how the six ΛCDM cosmological parameters shape the
Cosmic Microwave Background (CMB) power spectra. It is a **static site** (HTML/CSS/JS) with a
**TensorFlow.js CMB emulator** that predicts the TT/EE/TE spectra live in the browser as the user
moves parameter sliders, overlaid on binned Planck / ACT / SPT data.

---

## Repository layout

| Path | What it is |
|---|---|
| `index.html` | Home page — the full **six-parameter** live emulator explorer. |
| `matter.html` | "Baryons and Dark Matter" page — **two live emulator graphs** driven by the `omega_cdm` slider (see the physics/design docs in `/Users/chase/cosmology/pages_matter`). |
| `primordial_power_spectrum.html` | Live S3 emulator graphs (`ln10^{10}A_s`, `n_s`). |
| `dark_energy.html`, `photon_depth.html`, `curvature.html`, `ODSA.html` | Live **geo** emulator graphs (`model:'geo'`, log-linear ℓ-axis). |
| `neutrinos.html` | Graphs 1 & 2 live on the **neutrino** emulator (`model:'neutrino'`): Graph 1 varies N_eff with BBN helium; Graph 2 holds the damping angle fixed and shows the undamped, 4th-peak-normalized spectra. The **neutrino-mass** graph is still image-based (`imageSwitch.js`). |
| `NHF.html` | Live **neutrino** emulator with two sliders (N_eff, YHe) over the model's full plane. |
| `tensor_scalar_ratio.html` | Still image-based (`imageSwitch.js` flips precomputed PNGs in `class_figures/`). |
| `about.html`, `credits.html` | Static info pages. |
| `emulator/` | The emulator model, the shared plot widget, and the data overlays (below). |
| `class_figures/` | Precomputed CLASS figure image sets used by the image-based pages. |
| `figures/`, `style.css`, `imageSwitch.js` | Site assets, global styles, and the legacy image-flip driver. |

---

## The interactive emulator widget

Two pages (`index.html`, `matter.html`) share one engine:

- **Model** — `emulator/cmb-emulator-separate.js` loads **three separate single-spectrum MLPs**
  (`sep_tt_5000ep`, `sep_te_5000ep`, `sep_ee_5000ep`; the "S3" deployment). Public API:
  `CMBEmulator.load(urls, tf)`, `.predict(params)`, `.curve/.curveFrom(...)`, and a `META`
  (`inputNames`, `ranges`, `defaults`, `ell`, derived names).

  | | |
  |---|---|
  | **Inputs (6)** | `omega_b`, `omega_cdm`, `Omega_Lambda`, `ln10^{10}A_s`, `n_s`, `tau_reio` (note: **`Omega_Lambda`, not `h`** — the model is trained flat, so `Omega_k=0` and `h`/`H₀` are *derived*) |
  | **Defaults (Planck 2018)** | `0.02237, 0.12, 0.685, 3.044, 0.9649, 0.0544` |
  | **`omega_cdm` uses `log10`** internally (`_inputVector`); the slider is full-range (`[1e-5, 0.25]`). |
  | **Derived outputs** | `z_reio`, `Omega_Lambda`, `YHe`, `A_s`, `sigma8`, `100*theta_s` |
  | **ℓ-grid** | log-linear nodes to `l_max = 4030` |

- **Shared plot widget** — `emulator/cmb-plot.js` (+ `emulator/cmb-plot.css`) exposes
  `createCMBPlot(root, config)`, which builds the whole widget (3-panel TT/EE/TE canvas, sliders,
  legend, energy-density pie, derived-parameter readout, PNG/SVG export) inside `root`. Config
  controls which inputs get sliders, per-slider range overrides, a `derive(params)` hook for
  dependent parameters, and which sidebar sections show. Any number of instances can coexist on a
  page (`matter.html` runs two).

- **Derived `H₀`** — `H₀` is **not** a model output. `cmb-plot.js` computes it from the flat
  closure `h² = (ω_b + ω_cdm + ω_rad+ν) / (1 − Ω_Λ − Ω_k)` (the small radiation+neutrino term is
  calibrated so the Planck fiducial returns `h = 0.6736`) and displays `H₀ = 100·h` in km/s/Mpc.

---

## Neutrino pages (`neutrinos.html` Graphs 1–2, `NHF.html`)

- **Model** — `emulator/cmb-emulator-neutrino.js` loads `sep_{tt,te,ee}_neutrino` (TF.js, converted from
  `~/cosmology/connect_public/trained_models`; verified against Python to ≤2×10⁻⁶). Sliders see
  **`N_eff`, `YHe`**; the network input is `[N_ur, YHe, omega_cdm]` with `omega_cdm = f(N_eff)` computed
  in the module (holds matter–radiation equality fixed; the model was trained only on that line).
  `100*theta_s` is fixed at training, so **H₀ is a model output**. ℓ-grid = the S3 grid; linear axis.
  Defaults = the shared fiducial (N_eff 3.044, YHe 0.245640). The readout shows the *input* YHe.
- **Page lines** — `emulator/data/neutrino_lines.json` (see `emulator/data/README.md`), loaded with
  `loadNeutrinoLines()` and applied through each widget's `derive` hook: Graph 1 `YHe = g1(N_eff)`
  (standard BBN), Graph 2 `YHe = g2(N_eff)` (damping angle fixed). Both sliders span N_eff 0.1–6.9.
- **Graph 2 display** uses `cmb-plot.js`'s `display` option (below): undamping
  `K_ℓ = D_ℓ·exp(0.68 (θ_d ℓ)^κ)` with κ = 1.3 / 1.17 / 0.91 (TT/EE/TE), θ_d = 1.6144×10⁻³, each spectrum
  scaled so its 4th peak (7th extremum in ℓ 100–2500) matches the fiducial's; reference curve from the
  emulator at the fiducial; linear y, ℓ 0–2500, no data overlays.
- Physics/design and every decision: `/Users/chase/cosmology/pages_model_neutrino/README.md` (§7, D7–D10).
  Proposed prose fixes for both pages: `/Users/chase/cosmology/pages_model_neutrino/PAGE_TEXT_CHANGES.md`.

### `createCMBPlot` options added for these pages
- `model: 's3' | 'geo' | 'neutrino'` — backend lookup (`BACKENDS` in `cmb-plot.js`).
- `display: { transform, normalize:{extremum,lmin,lmax}, reference:'model', yLog, yRange, ySym, yTitle,
  letter, xRange, xTicks, xMinor }` — per-widget plot view; every field defaults to the standard D_ℓ figure.
- A widget with no `dataUrl` hides the data legend rows and draws no overlays.

---

## Data overlays (`emulator/data/`)

Full provenance is in **`emulator/data/README.md`**. In brief:

- **`cmb_data.json`** (loaded by the site) — Planck 2018 + **ACT DR6** (CMB-only, Δℓ=20 *plotting*
  binning, trimmed to ℓ ≤ 4100) + **SPT-3G D1**. Bandpowers stored as `Dₗ` in **10³ μK²**.
- **`cmb_data_dl50.json`** — companion with ACT DR6 at the Δℓ=50 *likelihood* binning (full range).
- **`lcdm.json`** — the ΛCDM theory curve (ℓ = 2–4000).

---

## Session changelog (2026-09-23 → 24)

- **Data provenance.** Verified the ACT block against the official ACT DR6 CMB-only release
  (`DR6-ACT-lite`), confirmed SPT-3G D1 (Camphuis et al. 2025), added machine-readable `meta` to the
  JSON, wrote `emulator/data/README.md`, removed the stale `cmb_data_1.json`. Switched the site's ACT
  overlay to the **Δℓ=20 plotting** bandpowers (trimmed ℓ ≤ 4100); kept the Δℓ=50 set as a companion.
- **Refactor.** Extracted the home page's inline emulator driver into the shared, multi-instance
  `emulator/cmb-plot.js` + `cmb-plot.css`; `index.html` now instantiates it. Added `H₀` to the
  derived-parameter readout.
- **`matter.html`.** Replaced the two image-flip graphs with two live emulator instances driven by
  the `omega_cdm` slider only, each with its pie and derived readout. The physics and design of these
  two graphs (what is fixed, the `Omega_Lambda`-fixed scheme, and the `theta_s`-fixed alternative) are
  documented separately in `/Users/chase/cosmology/pages_matter`.
