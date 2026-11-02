# CMBverse

An interactive educational website showing how cosmological parameters shape the Cosmic Microwave
Background (CMB) power spectra — the six ΛCDM parameters on the home page, and one effect at a time on the
parameter pages (matter, primordial spectrum, dark energy, optical depth, curvature, neutrino number,
helium and mass, tensor-to-scalar ratio). It is a **static site** (HTML/CSS/JS) with **TensorFlow.js CMB emulators**
(and, for the tensor page, a CLASS coefficient table) that predict the spectra live in the browser as the user moves
sliders, overlaid on binned Planck / ACT / SPT data.

---

## Repository layout

| Path | What it is |
|---|---|
| `index.html` | Home page — the full **six-parameter** live emulator explorer. |
| `matter.html` | "Baryons and Dark Matter" page — **two live graphs on the dedicated matter emulator** (`model:'matter'`): Graph 1 slides `omega_cdm` 10⁻⁵–0.25 (ω_b, Ω_Λ fixed); Graph 2 slides `omega_b` 0.005–0.14237 (up to an all-baryon universe) with `omega_cdm` compensating (ω_m fixed) and θ_s held fixed via the trained Ω_Λ(ω_b) curve. Physics/design: `/Users/chase/cosmology/pages_model_matter`. |
| `primordial_power_spectrum.html` | One live S3 emulator graph with two sliders (`ln10^{10}A_s`, `n_s`). |
| `dark_energy.html`, `photon_depth.html`, `curvature.html`, `ODSA.html` | Live **geo** emulator graphs (`model:'geo'`, per-panel ℓ axes). |
| `neutrinos.html` | Three live graphs. Graphs 1 & 2 on the **neutrino** emulator (`model:'neutrino'`): Graph 1 varies N_eff with BBN helium; Graph 2 holds the damping angle fixed and shows the undamped, 4th-peak-normalized spectra with a zoom column. The **neutrino-mass** graph on the **mnu** emulator (`model:'mnu'`): ratios to the massless case for TT/EE/φφ. |
| `NHF.html` | Live **neutrino** emulator with two sliders (N_eff, YHe) over the model's full plane. |
| `tensor_scalar_ratio.html` | One live **BB** graph on the **tensor** backend (`model:'tensor'`, a CLASS table, no TF.js): lensed D_ℓ^BB on log-log axes, 10²r slider, six B-mode datasets, compact legend top left. Physics/design: `/Users/chase/cosmology/pages_model_tensor`. |
| `about.html` | About page: summary, future goals, contact, and Acknowledgments (the former Credits page). |
| `credits.html` | Redirect stub to `about.html#acknowledgments`, so old Credits links keep working (GitHub Pages has no server-side redirects). |
| `emulator/` | The emulator model, the shared plot widget, and the data overlays (below). |
| `figures/`, `style.css` | Site assets and global styles. (The precomputed `class_figures/` image sets and their `imageSwitch.js` driver were removed on 2026-10-20: every page is now live.) |
| `site.js` | Site chrome: the light/dark theme and its toggle (**Theming**), and the phone menu (**Navigation**). |
| `mathjax.js` | Loads MathJax 4 with the STIX2 math font; the one place its version and options are set (see **Typography**). |
| `fonts/` | STIX Two Text web fonts (Regular, Italic, SemiBold; unmodified v2.13 files) and their SIL OFL license. |
| `dark_mode_instructions.md` | Dark-mode spec: behavior, the full light→dark color map, implementation footprint. |

---

## The interactive emulator widget

Every live graph is one instance of a shared widget driving one of six emulator backends.

### Emulator backends (`emulator/cmb-emulator-*.js`)
Each module loads three single-spectrum TF.js graph models (converted from
`~/cosmology/connect_public/trained_models`) and exposes the same API: `Emulator.load(urls, tf)`,
`.predict(params)` → `{ell, Cl, Dl, derived}`, `.curve/.curveFrom(...)`, and a `META` (`inputNames`,
`ranges`, `defaults`, `ell`, `derivedNames`). `cmb-plot.js` picks one with `config.model`.

| `model` | Module / models | Inputs (sliders) | ℓ-grid / axis | Used by |
|---|---|---|---|---|
| `s3` (default) | `cmb-emulator-separate.js` / `sep_*_5000ep` | 6: `omega_b, omega_cdm, Omega_Lambda, ln10^{10}A_s, n_s, tau_reio` (`omega_cdm` fed as `log10`; full range, no clamp) | 115 nodes, linear axis | `index.html`, `primordial_power_spectrum.html` |
| `matter` | `cmb-emulator-matter.js` / `sep_*_matter` | 3: `omega_b, omega_cdm, Omega_Lambda` (linear; YHe = 0.245, n_s, τ, A_s fixed) | S3 grid, linear axis | `matter.html` |
| `geo` | `cmb-emulator-geo.js` / `sep_*_curv` | 4: `Omega_Lambda, Omega_k, tau_reio, ln10^{10}A_s` (ω_b, ω_cdm, n_s fixed) | 123 nodes (every ℓ ≤ 30), log-linear axis | `dark_energy`, `photon_depth`, `curvature`, `ODSA` |
| `neutrino` | `cmb-emulator-neutrino.js` / `sep_*_neutrino` | 2: `N_eff, YHe` (ω_cdm = f(N_eff) inside; θ_s fixed) | S3 grid, linear axis | `NHF.html`, `neutrinos.html` Graphs 1–2 |
| `mnu` | `cmb-emulator-mnu.js` / `sep_{tt,ee,pp}_mnu_reparam` | 1: `M_nu` (eV) | geo grid, log axis | `neutrinos.html` mass graph |
| `tensor` | `cmb-emulator-tensor.js` / `data/tensor_bb.json` (CLASS table, **not** a NN; `BACKENDS.tensor.noTF`, so the page loads no TF.js) | 1: `r100` = 10²r ∈ [0, 1] | every integer ℓ 2–2500, log axis | `tensor_scalar_ratio.html` |

S3 defaults (Planck 2018): `omega_b 0.02237, omega_cdm 0.12, Omega_Lambda 0.685, ln10^{10}A_s 3.044,
n_s 0.9649, tau_reio 0.0544`. All models output dimensionless `Dl = Cl·ℓ(ℓ+1)/2π` (the widget converts to
10³ μK²), except `mnu`, which outputs ratios, and `tensor`, which outputs D_ℓ^BB already in 10³ μK² (its `curveFrom`
ignores `uK2`/`scale`). The tensor table holds 7 Chebyshev coefficients per ℓ of the lensed total BB in
x = 2r/0.01 − 1; `predict` evaluates them with Clenshaw's recurrence (matches CLASS to 7×10⁻¹²).

**H₀.** For `geo`, `matter`, `neutrino` and `mnu`, H₀ is a **model output** (their training fixed θ_s or used a
closure). S3 takes `Omega_Lambda`, not `h`, and is trained flat, so `cmb-plot.js` computes H₀ from
`h² = (ω_b + ω_cdm + ω_rad+ν) / (1 − Ω_Λ − Ω_k)` (the radiation+neutrino term is calibrated so the Planck
fiducial returns h = 0.6736).

### Shared plot widget (`emulator/cmb-plot.js` + `cmb-plot.css`)
`createCMBPlot(root, config)` builds one widget inside `root`: the panel canvas (TT/EE/TE by default),
sliders, legend, pie(s), derived-parameter readout, Reset and Save (PNG/SVG). Any number of instances can
coexist on a page. Type size and line weights scale with the canvas width (`figScale`), capped at the
standard 660 px plot width, so every graph renders at the same size.

**Sizing.** The widget is one unit at its design size: figure 660 px wide (800 px for the zoom figure) and a
300 px sidebar (220 px). The canvas fills its container (`.emu-plot-wrap`), keeps the figure's aspect
(height/width: 1.19 by default, `display.aspect` per widget) and redraws on window resize. `cmb-plot.css`
declares the design size per widget (`--emu-design`, `--emu-floor`, `--emu-side`) and uses one rule:
- **Every layout:** the figure's width is at most `fit = min(design, max(floor, (100svh − 3rem) / aspect))`,
  so it keeps its shape and fits the visible window height, as Bokeh's `scale_both`. The floor (420 px, or
  610 px for the zoom figure, which keeps it out of its stacked layout) keeps short windows readable.
- **Side by side (> 980 px):** the figure is also at most the room beside the *design-width* sidebar, never
  the sidebar's actual width, so the two can't feed back. The sidebar scales with the figure by CSS
  `zoom: k`, with `k = figure width / design width` (`--emu-k`, set in `resize()`), so it stays as tall as
  the figure. Zoomed sliders hit-test normally.
- **Stacked (≤ 980 px, tablets and phones):** the sidebar drops below as a grid and the figure, fitted the
  same way, is centered above it. On phones the figure is width-limited; in landscape the floor applies.
- **Saved figures are universal:** PNG (×3) and SVG always render at the figure's design size (660 px wide,
  800 px for the zoom figure) with that size's type scale, never the on-screen size, so a figure saved on a
  phone, a laptop or a desktop is byte-identical.

**How curves are drawn.** Each adapter fits a natural cubic spline through the model's ℓ nodes
(`curveFrom`). On linear ℓ axes the curve is evaluated at every integer ℓ. On log and log-linear axes,
where integer ℓ would be 15–50 px apart at low ℓ, it is evaluated on a dense grid (log-spaced at 0.005 dex
up to ℓ ≈ 90, integers above). The black ΛCDM reference (`lcdmUrl`, `emulator/data/lcdm_<backend>.json`) is
CLASS at the backend's fiducial stored on the backend's own ℓ nodes, so it gets the same spline and the same
sampling; at default sliders the two curves differ only by the emulator's error at its nodes. The full option
list is in **"`createCMBPlot` config reference"** below.

### Scheme pages (`geo`)
Dark Energy slides Ω_Λ (flat), Photon Optical Depth slides τ, Curvature slides Ω_k (Ω_Λ fixed), and ODSA
slides τ with A_s coupled by the degeneracy `A_s·e^{−2τ} = const` (`derive`). No pie. Each panel's axes
follow the original figures (`display.xBySpec`; references in `cosmology/pages_model_geo/old_site_plot_ref/`):

| Page | TT | EE | TE |
|---|---|---|---|
| Dark Energy, Curvature | linear y, **log ℓ** (own axis) | log y, linear ℓ | linear y, linear ℓ (shared with EE) |
| Photon optical depth | log y, **log-linear ℓ** (log part ¼ of the width, dashed divider at ℓ = 30) | log y, same axis as TT | linear y, linear ℓ (own axis) |
| ODSA | log y, **log ℓ** (legend bottom left) | log y, same axis as TT | linear y, linear ℓ (own axis) |

ℓ runs 2–4000 on log axes and 0–4000 on linear ones. The log and log-linear TT/EE panels also show Planck 2018's
unbinned low-ℓ points (ℓ 2–29) as part of the Planck 2018 points. Physics/design: `/Users/chase/cosmology/pages_model_geo/README.md`.

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
  emulator at the fiducial; linear y, ℓ 0–3000, no data overlays. A **zoom column** (ℓ 950–1250, as on the
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
  (TT/EE 0.96–1.04, φφ 0.65–1.03), dotted line at R = 1, relative data errors (D ± σ)/D as opaque filled envelopes
  with darker edge lines (legend: outlined boxes): Planck 2018 on TT and EE (light grey; on EE it fills the panel above ℓ ≈ 1050, where
  Planck's EE errors pass 4%) and ACT DR6 Δℓ=50 on TT and EE (opaque light green, from `cmb_data_dl50.json`), long ratio titles on screen and in exports. Opens (and resets) at **M_ν = 0.06 eV**, Planck
  2018's baseline, drawn as the solid **ΛCDM** reference; the dotted line is massless (M_ν = 0).
  Sidebar: a **matter-density pie** (ω_c, ω_b, ω_ν —
  neutrinos joining the matter today) and the usual derived values.
- Physics/design: `/Users/chase/cosmology/pages_model_massive_neutrino/README.md` (§4 deploy contract).

## `createCMBPlot` config reference

Every option defaults to the standard D_ℓ figure, so a page sets only what it changes.

**Top level**
- `modelUrls` (required; `{table}` for `tensor`), `model: 's3' | 'geo' | 'matter' | 'neutrino' | 'mnu' | 'tensor'`, `dataUrl`, `lcdmUrl`.
- `sliders` (which inputs get sliders), `ranges` (per-slider overrides), `fixed` (params pinned to
  non-default values), `start` (initial and Reset values of slider params, e.g. `{ M_nu: 0.06 }`),
  `derive(params)` (recompute dependent params on every update), `constrainThetaS` (solve Ω_Λ live to
  hold the model's θ_s; used by the earlier S3 matter Graph 2, kept for S3 widgets).
- `xaxis: 'linear' | 'loglin' | 'log'` — the widget's ℓ axis. `loglin` = log below ℓ 30, linear above; `log` =
  pure log, powers of ten labelled 10ⁿ with log minor ticks.
- `showPie`, `showMatterPie`, `showDerived`, `showSave`, `showLegend`, `showDataToggles` (booleans). On touch
  devices ≤ 980 px the on-plot legend is hidden and data selection moves to the "Data shown" row
  (`showDataToggles`); saved PNG/SVG figures always include the legend.

**`display: { … }`** (per-widget plot view)
- *Curves:* `specs` (panel spectra, e.g. `['tt','ee','pp']`); `transform(spec, ell, value)` (applied to every
  displayed curve); `normalize: {extremum, lmin, lmax}` (scale each curve so its n-th extremum matches the
  reference's).
- *References:* `reference: 'model'` (black curve = the emulator at the defaults) or `'unity'` (dotted line
  at 1) with `referenceLabel`; `extraReference: {label, params}` (a second, solid curve from the emulator at
  `params`).
- *Data:* the fixed Planck/ACT/SPT points; on a panel whose ℓ axis is `log` or `loglin` the Planck points also
  include `OBS[spec].planck_lowl` (unbinned ℓ 2–29, same style and checkbox). `dataPoints: false` (load `dataUrl` without drawing points); `errorBand: {specs, source, label,
  shade, url}` or a list of them (filled envelope (D+σ⁺)/D … (D−σ⁻)/D of that dataset on those panels,
  `shade: 'light'` grey or `'act'` light green, both opaque with a darker edge line on each side drawn over all the
  fills so overlapping bands stay visible (`'dark'`: translucent grey, no edge), drawn in list order; `url` = another local data file in the `dataUrl`
  layout, default `dataUrl`'s; one legend row and checkbox per band). The single-object `{spec, …}` form
  still works.
  `dataSets: [{key, label, color, colorDark, kind: 'points' | 'limit'}]` replaces the fixed Planck/ACT/SPT points with a
  per-widget list read from `OBS[spec][key]` of `dataUrl`. `points` rows are `[l, D, err_lo, err_hi, lmin, lmax]`
  (asymmetric errors; x-bar from lmin to lmax, none when null); `limit` rows are `[lmin, lmax, D95]`, drawn as a
  solid bar across the bin with a downward arrow at its centre (the usual upper-limit glyph). On a log axis every value at or below the axis floor (a negative D, or a lower error
  end ≤ 0) is drawn at the floor. Each set gets a legend row/checkbox (mark `dot`, or `limit` = bar with arrow).
- *Legend:* `legendPos: 'top-right'` (default) `| 'top-left' | 'bottom-right' | 'bottom-left'` of the top panel (on
  screen and in exports). ODSA and the neutrino-mass graph use bottom-left, the tensor page top-left.
  `legendCompact: true` draws a tighter legend (less padding and row spacing, smaller type, closer to the corner) on
  screen and in exports, for long legends (the tensor page's seven rows).
- *Axes:* `yLog`, `yRange`, `ySym`, `yFixed`, `yTicks`, `yTickDigits`, `yHideLabels` (ticks drawn without a
  number), `yTitle` (MathJax), `exportTitle` (rich-text titles `[{t, it, sub, sup}]` for PNG/SVG), `letter`
  (title symbol), `xRange`, `xTicks`, `xMinor`, `aspect` (canvas height/width, default 1.19).
- *Per-panel ℓ axes:* `xBySpec: { spec: { xaxis, xRange, xTicks, xMinor, logFrac, xDivider } }` gives a panel its
  own ℓ axis (`logFrac` = share of the width for the log part of `loglin`, default ⅓; `xDivider` = dashed grey
  line at ℓ = 30). Adjacent panels with the same axis share it, with tick numbers under the last of them; a
  gap separates axis groups; the ℓ label sits under the bottom panel.
- *Layout:* `zoom: {range, xTicks, xMinor, width, band}` — a narrower zoom column beside the panels with a
  y-range fixed across the slider, the window shaded on the main panels, and the `.emu-widget--zoom` CSS
  hook (wider plot, 220 px sidebar); stacks below the main panels under ~610 px canvas width.
- *Sidebar:* `pie: {title, symbol, wedges(result, params)}` — an extra pie computed from the model result
  (`PIE_COLOR`, incl. `nu`, is exported for page configs).

The HTML legend and both exports share one entry list (`legendRows()`), with marks `line`, `dotted`, `dot`
`fill` or `limit`. A widget without data points hides the data legend rows.

---

## Typography

The site follows the look of a typeset *Physical Review* article. Published PRD PDFs set text in Times and
math in STIX (verified from the fonts embedded in the PDFs). The site uses the open STIX Two family, which
APS co-developed.

- **Fonts by role** (tokens at the top of `style.css`):
  - `--font-text` (STIX Two Text, self-hosted from `fonts/`): body, headings, paragraphs, lists, bios.
  - `--font-ui`: the nav and every widget control (slider labels, buttons, the save menu, the sidebar
    panels, status text). It uses the article serif (`var(--font-text)`; UI bold resolves to STIX Semibold),
    so the whole site is set in STIX Two. Helvetica Neue / Helvetica / Arial (PRD's running-head face) was
    considered and not chosen; switching back would be a one-line change.
  - Plot text (tick labels, legends, pie labels) stays in generic `serif`, like matplotlib-style figures.
    It's drawn on canvas, and exports depend on it. Power-of-ten ticks are typeset rather than written in
    Unicode superscripts: "10", then the exponent in ordinary digits with a true minus (U+2212) at 70% size,
    raised 0.36 em, as in the axis titles (`fillTickLabel` / `svgTickLabel`). Fonts like Times lack ⁻, ⁰ and
    ⁴–⁹, and the browser's fallback font draws them at a different height than ¹²³, which misaligned the
    exponents.
  - Math is MathJax 4 with its `mathjax-stix2` font, loaded by `mathjax.js` (version pinned there). In-line
    line breaking is off (`linebreaks.inline: false`, the v3 behavior). Otherwise v4 splits the rotated plot
    axis titles across lines.
- **Weights:** text 400. Headings, About names and citation links 600 (STIX bold reads heavy at title
  sizes). Bold resolves to the 600 face, so no 700 file ships.
- **Sizes:** paragraphs 1.25rem (STIX runs smaller than Arial) and 1rem under 768px.
- **Justification:** `.section-body` and the About bios are `text-align: justify` at every width, with
  `hyphens: auto` (needs the `lang="en"` every page has) to keep word spacing even on phones.

---

## Navigation

The nav markup is the same `<ul>` on every page; `style.css` and `site.js` adapt it by width:

- **Above ~1000px:** one line. **601–1000px:** each top-level link is a centered flex box, so a wrapped
  label ("Cosmological / Parameters") keeps one rounded highlight. Only the two submenu headings may wrap.
  Submenus open on hover.
- **≤ 600px (phones):** `site.js` adds a "☰ Menu" button (`aria-expanded`, closes on Escape) and the class
  `has-menu`, which folds the list into a 48px bar. Open, the list pushes the page down: 44px rows, the two
  `href="#"` headings shown as small section labels, sub-pages always visible and indented under a thin
  rule. The logo header hugs the logo (`aspect-ratio`). Without JavaScript the list simply stays open.
- **Current page:** `site.js` sets `aria-current="page"` on the matching link (extensionless hrefs such as
  `neutrinos` and `index.html` both match). The phone menu tints it.

---

## Theming (light / dark)

The full spec and color map are in `dark_mode_instructions.md`. In brief:

- **`site.js`** is loaded synchronously in every page's `<head>` (one line), before the stylesheets. It
  sets `<html data-theme="light|dark">` before first paint, using the saved choice
  (`localStorage['cmbverse-theme']`) or else the OS setting, followed live. It injects the toggle button at
  the right end of `<nav>` and syncs open tabs through the `storage` event.
- **CSS colors are tokens.** `style.css` defines every color as a custom property on `:root` (light) and
  overrides them under `:root[data-theme="dark"]`. `cmb-plot.css` uses the same tokens. To change a
  color, edit the token, not the rule.
- **Plots** (`cmb-plot.js`): the existing color constants are the light palette and `DARK` is the dark
  one. The module global `PAL` is chosen at the start of every `render()` (the same pattern as `VIEW`).
  A data set's dark color comes from `DARK_OF` (keyed by its light hex) unless it passes `colorDark`.
  Each widget watches `data-theme` with a `MutationObserver` and redraws, so it doesn't depend on
  `site.js`.
- **Exports are always light.** PNG pins `PAL = LIGHT` around `drawExport`; the SVG builder draws with the
  light constants directly.
- Slider fills set only a `--fill` percentage (the gradient is in CSS). Legend and touch-toggle swatches
  are painted by `paintSwatches()`. Pie separators and labels are colored by CSS classes.

---

## Data overlays (`emulator/data/`)

Full provenance is in **`emulator/data/README.md`**. In brief:

- **`cmb_data.json`** (loaded by the site) — Planck 2018 + **ACT DR6** (CMB-only, Δℓ=20 *plotting*
  binning, trimmed to ℓ ≤ 4100) + **SPT-3G D1**. Bandpowers stored as `Dₗ` in **10³ μK²**. Also the unbinned
  Planck 2018 low-ℓ points (ℓ 2–29, `tt`/`ee.planck_lowl`: TT Commander, EE SimAll), drawn only on log and
  log-linear ℓ panels.
- **`cmb_data_dl50.json`** — companion with ACT DR6 at the Δℓ=50 *likelihood* binning (full range).
- **`lcdm_{s3,geo,matter,neutrino}.json`** — the black ΛCDM reference per backend: CLASS at that backend's
  fiducial and training settings, on its own ℓ nodes (made by `~/cosmology/pages_reference/make_lcdm_reference.py`).
- **`bb_data.json`** — the tensor page's B-mode data (BK18 CMB component, ACT DR6, SPTpol 500d, POLARBEAR 2017 and
  2022, Planck PR4 95% upper limits), made by `~/cosmology/pages_model_tensor/make_bb_data.py`.
- **`tensor_bb.json`** — the tensor backend's CLASS coefficient table (not data), copied from
  `~/cosmology/pages_model_tensor/tables/`.

---

## Open follow-ups

- **Pie labels at zero-size wedges** — the built-in energy and matter pies print a label for every wedge, so
  at extreme slider values (e.g. matter Graph 2's all-baryon end) labels of empty wedges overlap. The mass
  graph's custom pie avoids it by dropping zero wedges in its page config; the built-in pies would need the
  same filter in `updatePie()` (shared code).
- **Page prose** — proposed text fixes for `neutrinos.html` / `NHF.html` are in
  `/Users/chase/cosmology/pages_model_neutrino/PAGE_TEXT_CHANGES.md` (applied by hand). `matter.html`'s text
  predates Graph 2's extension to the all-baryon end and could mention it.
- **Low-ℓ EE on the geo pages** — the geo model's EE is off by up to ~15% at ℓ < 30 (up to ~28% along the τ
  range), visible against the ΛCDM reference on ODSA and photon depth's log ℓ axes. It is the model's own
  error (its cosmic-variance loss gives ℓ < 30 little weight); fixing it needs a retrain.
- **Drag-able zoom window** on neutrinos Graph 2 (paused).



The commit messages are the detailed changelog (`git log --stat`). Milestones:

- **2026-09-03** — performance: WASM backend (WebGL/CPU fallback), rAF-gated sliders, one inference per render.
- **2026-09-06** — the S3 deployment: three separate 5000-epoch spectrum models, full-range ω_cdm slider.
- **2026-09-23/24** — data provenance (ACT DR6 Δℓ=20 plotting bandpowers verified, SPT-3G D1, machine-readable
  `meta`, `emulator/data/README.md`); the shared multi-instance widget `cmb-plot.js`; live `matter.html`.
- **2026-09-25** — `matter.html` Graph 2 θ_s-fixed with an ω_b slider and the matter-density pie; live
  primordial page (S3); the `geo` backend and the four scheme pages.
- **2026-10-07** — the `neutrino` backend (`NHF.html`, `neutrinos.html` Graphs 1–2, with CLASS-computed YHe
  lines and Graph 2's zoom column) and the `mnu` backend (the neutrino-mass graph); the `display` options;
  text/line scale capped at the standard plot width; the `matter` backend on `matter.html` (Graph 2 up to
  the all-baryon end); sliders reach their exact maxima.
- **2026-10-19** — the `tensor` backend (a CLASS Chebyshev table for D_ℓ^BB(r)) and the live
  `tensor_scalar_ratio.html`; widget `display.dataSets` (asymmetric errors, x-bars, axis-floor values, limit bars),
  `legendCompact`, `legendPos: 'top-left'`.
