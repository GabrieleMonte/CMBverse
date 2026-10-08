# CMBverse

An interactive educational website showing how cosmological parameters shape the Cosmic Microwave
Background (CMB) power spectra — the six ΛCDM parameters on the home page, and one effect at a time on the
parameter pages (matter, primordial spectrum, dark energy, optical depth, curvature, neutrino number,
helium and mass). It is a **static site** (HTML/CSS/JS) with **TensorFlow.js CMB emulators** that predict
the spectra live in the browser as the user moves sliders, overlaid on binned Planck / ACT / SPT data.

---

## Repository layout

| Path | What it is |
|---|---|
| `index.html` | Home page — the full **six-parameter** live emulator explorer. |
| `matter.html` | "Baryons and Dark Matter" page — **two live S3 emulator graphs**: Graph 1 slides `omega_cdm` (ω_b, Ω_Λ fixed); Graph 2 slides `omega_b` with `omega_cdm` compensating (ω_m fixed) and θ_s held fixed (`constrainThetaS`). Physics/design: `/Users/chase/cosmology/pages_matter`. The dedicated matter model (`pages_model_matter`) is trained but **not yet deployed**. |
| `primordial_power_spectrum.html` | Live S3 emulator graphs (`ln10^{10}A_s`, `n_s`). |
| `dark_energy.html`, `photon_depth.html`, `curvature.html`, `ODSA.html` | Live **geo** emulator graphs (`model:'geo'`, log-linear ℓ-axis). |
| `neutrinos.html` | Three live graphs. Graphs 1 & 2 on the **neutrino** emulator (`model:'neutrino'`): Graph 1 varies N_eff with BBN helium; Graph 2 holds the damping angle fixed and shows the undamped, 4th-peak-normalized spectra with a zoom column. The **neutrino-mass** graph on the **mnu** emulator (`model:'mnu'`): ratios to the massless case for TT/EE/φφ. |
| `NHF.html` | Live **neutrino** emulator with two sliders (N_eff, YHe) over the model's full plane. |
| `tensor_scalar_ratio.html` | Still image-based (`imageSwitch.js` flips precomputed PNGs in `class_figures/`). |
| `about.html`, `credits.html` | Static info pages. |
| `emulator/` | The emulator model, the shared plot widget, and the data overlays (below). |
| `class_figures/` | Precomputed CLASS figure image sets used by the image-based pages. |
| `figures/`, `style.css`, `imageSwitch.js` | Site assets, global styles, and the legacy image-flip driver. |

---

## The interactive emulator widget

Every live graph is one instance of a shared widget driving one of four emulator backends.

### Emulator backends (`emulator/cmb-emulator-*.js`)
Each module loads three single-spectrum TF.js graph models (converted from
`~/cosmology/connect_public/trained_models`) and exposes the same API: `Emulator.load(urls, tf)`,
`.predict(params)` → `{ell, Cl, Dl, derived}`, `.curve/.curveFrom(...)`, and a `META` (`inputNames`,
`ranges`, `defaults`, `ell`, `derivedNames`). `cmb-plot.js` picks one with `config.model`.

| `model` | Module / models | Inputs (sliders) | ℓ-grid / axis | Used by |
|---|---|---|---|---|
| `s3` (default) | `cmb-emulator-separate.js` / `sep_*_5000ep` | 6: `omega_b, omega_cdm, Omega_Lambda, ln10^{10}A_s, n_s, tau_reio` (`omega_cdm` fed as `log10`; full range, no clamp) | 115 nodes, linear axis | `index.html`, `matter.html`, `primordial_power_spectrum.html` |
| `geo` | `cmb-emulator-geo.js` / `sep_*_curv` | 4: `Omega_Lambda, Omega_k, tau_reio, ln10^{10}A_s` (ω_b, ω_cdm, n_s fixed) | 123 nodes (every ℓ ≤ 30), log-linear axis | `dark_energy`, `photon_depth`, `curvature`, `ODSA` |
| `neutrino` | `cmb-emulator-neutrino.js` / `sep_*_neutrino` | 2: `N_eff, YHe` (ω_cdm = f(N_eff) inside; θ_s fixed) | S3 grid, linear axis | `NHF.html`, `neutrinos.html` Graphs 1–2 |
| `mnu` | `cmb-emulator-mnu.js` / `sep_{tt,ee,pp}_mnu_reparam` | 1: `M_nu` (eV) | geo grid, log axis | `neutrinos.html` mass graph |

S3 defaults (Planck 2018): `omega_b 0.02237, omega_cdm 0.12, Omega_Lambda 0.685, ln10^{10}A_s 3.044,
n_s 0.9649, tau_reio 0.0544`. All models output dimensionless `Dl = Cl·ℓ(ℓ+1)/2π` (the widget converts to
10³ μK²), except `mnu`, which outputs ratios.

**H₀.** For `geo`, `neutrino` and `mnu`, H₀ is a **model output** (their training fixed θ_s or used a
closure). S3 takes `Omega_Lambda`, not `h`, and is trained flat, so `cmb-plot.js` computes H₀ from
`h² = (ω_b + ω_cdm + ω_rad+ν) / (1 − Ω_Λ − Ω_k)` (the radiation+neutrino term is calibrated so the Planck
fiducial returns h = 0.6736).

### Shared plot widget (`emulator/cmb-plot.js` + `cmb-plot.css`)
`createCMBPlot(root, config)` builds one widget inside `root`: the panel canvas (TT/EE/TE by default),
sliders, legend, pie(s), derived-parameter readout, Reset and Save (PNG/SVG). Any number of instances can
coexist on a page. Type size and line weights scale with the canvas width, capped at the standard 660 px
plot width, so every graph renders at the same size. The full option list is in **"`createCMBPlot`
config reference"** below.

### Scheme pages (`geo`)
Dark Energy slides Ω_Λ (flat), Photon Optical Depth slides τ, Curvature slides Ω_k (Ω_Λ fixed), and ODSA
slides τ with A_s coupled by the degeneracy `A_s·e^{−2τ} = const` (`derive`). All use the log-linear ℓ-axis
(`xaxis:'loglin'`) and no pie. Physics/design: `/Users/chase/cosmology/pages_model_geo/README.md`.

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
  emulator at the fiducial; linear y, ℓ 0–4000, no data overlays. A **zoom column** (ℓ 950–1250, as on the
  original figure) sits beside each spectrum with a y-range fixed across the slider, and the window is
  shaded on the main panels; below ~610 px canvas width the zoom panels stack under the main ones.
  Save PNG/SVG exports all six panels.
- Physics/design and every decision: `/Users/chase/cosmology/pages_model_neutrino/README.md` (§7, D7–D10).
  Proposed prose fixes for both pages: `/Users/chase/cosmology/pages_model_neutrino/PAGE_TEXT_CHANGES.md`.

## Neutrino-mass graph (`neutrinos.html`, third graph)

- **Model** — `emulator/cmb-emulator-mnu.js` loads `sep_{tt,ee,pp}_mnu_reparam` (TF.js from
  `~/cosmology/connect_public/trained_models`; matches Python to ≤1.2×10⁻⁷). One slider **`M_nu`**
  (0–1 eV, three degenerate massive neutrinos); network input `m_ncdm = M_ν/3`. Outputs are **ratios**
  `R = C_ℓ(M_ν)/C_ℓ(M_ν=0)` for **TT, EE, φφ** (no TE), returned in the `Dl`/`Cl` fields so the widget can
  draw them; the model's `R = 1 + m·g` form makes **R(0) = 1 exactly**. ℓ-grid = the geo grid (123 nodes).
  H₀, σ8, Ω_m, … are model outputs; `derived` also carries ω_b, ω_cdm (fixed) and ω_ν = M_ν/93.14 eV.
- **Display** (matches the original figure): log ℓ-axis 50–3000 with 10² / 10³ labels, fixed y-bands
  (TT/EE 0.96–1.04, φφ 0.65–1.03), dotted line at R = 1, Planck 2018 TT relative errors (D ± σ)/D as a
  light-grey filled envelope (legend: a shaded box), long ratio titles on screen and in exports. Opens (and resets) at **M_ν = 0.06 eV**, Planck
  2018's baseline, drawn as the solid **ΛCDM** reference; the dotted line is massless (M_ν = 0).
  Sidebar: a **matter-density pie** (ω_c, ω_b, ω_ν —
  neutrinos joining the matter today) and the usual derived values.
- Physics/design: `/Users/chase/cosmology/pages_model_massive_neutrino/README.md` (§4 deploy contract).

## `createCMBPlot` config reference

Every option defaults to the standard D_ℓ figure, so a page sets only what it changes.

**Top level**
- `modelUrls` (required), `model: 's3' | 'geo' | 'neutrino' | 'mnu'`, `dataUrl`, `lcdmUrl`.
- `sliders` (which inputs get sliders), `ranges` (per-slider overrides), `fixed` (params pinned to
  non-default values), `start` (initial and Reset values of slider params, e.g. `{ M_nu: 0.06 }`),
  `derive(params)` (recompute dependent params on every update), `constrainThetaS` (matter Graph 2).
- `xaxis: 'linear' | 'loglin' | 'log'` — `loglin` = log below ℓ 30, linear above; `log` = pure log, powers of
  ten labelled 10ⁿ with log minor ticks.
- `showPie`, `showMatterPie`, `showDerived`, `showSave`, `showLegend`, `showDataToggles` (booleans).

**`display: { … }`** (per-widget plot view)
- *Curves:* `specs` (panel spectra, e.g. `['tt','ee','pp']`); `transform(spec, ell, value)` (applied to every
  displayed curve); `normalize: {extremum, lmin, lmax}` (scale each curve so its n-th extremum matches the
  reference's).
- *References:* `reference: 'model'` (black curve = the emulator at the defaults) or `'unity'` (dotted line
  at 1) with `referenceLabel`; `extraReference: {label, params}` (a second, solid curve from the emulator at
  `params`).
- *Data:* `dataPoints: false` (load `dataUrl` without drawing points); `errorBand: {spec, source, label}`
  (light-grey filled envelope (D+σ⁺)/D … (D−σ⁻)/D, legend shows a shaded box).
- *Axes:* `yLog`, `yRange`, `ySym`, `yFixed`, `yTicks`, `yTickDigits`, `yHideLabels` (ticks drawn without a
  number), `yTitle` (MathJax), `exportTitle` (rich-text titles `[{t, it, sub, sup}]` for PNG/SVG), `letter`
  (title symbol), `xRange`, `xTicks`, `xMinor`, `aspect` (canvas height/width, default 1.19).
- *Layout:* `zoom: {range, xTicks, xMinor, width, band}` — a narrower zoom column beside the panels with a
  y-range fixed across the slider, the window shaded on the main panels, and the `.emu-widget--zoom` CSS
  hook (wider plot, 220 px sidebar); stacks below the main panels under ~610 px canvas width.
- *Sidebar:* `pie: {title, symbol, wedges(result, params)}` — an extra pie computed from the model result
  (`PIE_COLOR`, incl. `nu`, is exported for page configs).

The HTML legend and both exports share one entry list (`legendRows()`), with marks `line`, `dotted`, `dot`
or `fill`. A widget without data points hides the data legend rows.

---

## Data overlays (`emulator/data/`)

Full provenance is in **`emulator/data/README.md`**. In brief:

- **`cmb_data.json`** (loaded by the site) — Planck 2018 + **ACT DR6** (CMB-only, Δℓ=20 *plotting*
  binning, trimmed to ℓ ≤ 4100) + **SPT-3G D1**. Bandpowers stored as `Dₗ` in **10³ μK²**.
- **`cmb_data_dl50.json`** — companion with ACT DR6 at the Δℓ=50 *likelihood* binning (full range).
- **`lcdm.json`** — the ΛCDM theory curve (ℓ = 2–4000).

---

## History

The commit messages are the detailed changelog (`git log --stat`). Milestones:

- **2026-09-03** — performance: WASM backend (WebGL/CPU fallback), rAF-gated sliders, one inference per render.
- **2026-09-06** — the S3 deployment: three separate 5000-epoch spectrum models, full-range ω_cdm slider.
- **2026-09-23/24** — data provenance (ACT DR6 Δℓ=20 plotting bandpowers verified, SPT-3G D1, machine-readable
  `meta`, `emulator/data/README.md`); the shared multi-instance widget `cmb-plot.js`; live `matter.html`.
- **2026-09-25** — `matter.html` Graph 2 θ_s-fixed with an ω_b slider and the matter-density pie; live
  primordial page (S3); the `geo` backend and the four scheme pages.
- **2026-10-07** — the `neutrino` backend (`NHF.html`, `neutrinos.html` Graphs 1–2, with CLASS-computed YHe
  lines and Graph 2's zoom column) and the `mnu` backend (the neutrino-mass graph); the `display` options;
  text/line scale capped at the standard plot width.
