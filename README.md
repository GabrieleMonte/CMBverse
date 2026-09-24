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
| `dark_energy.html`, `curvature.html`, `neutrinos.html`, `photon_depth.html`, `primordial_power_spectrum.html`, `tensor_scalar_ratio.html`, `ODSA.html`, `NHF.html` | Other parameter pages — **still image-based** (`imageSwitch.js` flips through precomputed PNGs in `class_figures/`). Not yet ported to the live emulator. |
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
