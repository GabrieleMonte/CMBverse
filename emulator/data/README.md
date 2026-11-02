# CMB power-spectrum data (`emulator/data/`)

Binned CMB power-spectrum bandpowers (Planck, ACT, SPT) that the site overlays on the
theory curve. Each JSON has top-level keys `meta`, `tt`, `ee`, `te`; each spectrum holds
`planck`, `act`, and `spt` arrays of bandpower rows; `cmb_data.json` also has `tt.planck_lowl` and
`ee.planck_lowl` (Planck 2018 unbinned ℓ 2–29, below).

## Units and columns

All bandpowers are stored as **D_ℓ = ℓ(ℓ+1)C_ℓ/(2π) in units of 10³ μK²** — i.e. the
standard μK² value divided by 1000 (e.g. ACT TT 2223.86 μK² is stored as 2.22386). The
theory references (`lcdm_*.json`) use the same convention.

Row columns:

| dataset | columns |
|---------|---------|
| planck  | `[ℓ_eff, D_ℓ, σ_minus, σ_plus]` (asymmetric errors) |
| planck_lowl | `[ℓ, D_ℓ, σ_minus, σ_plus]` (as planck; `cmb_data.json` TT and EE only) |
| act     | `[ℓ_eff, D_ℓ, σ]` |
| spt     | `[ℓ_eff, D_ℓ, σ]` |

## The two data files

The two bandpower files differ **only in the ACT block**; Planck and SPT are identical between them.

### `cmb_data.json` — ACT at Δℓ=20 (plotting binning), trimmed  ← used by `home.html`

- **ACT DR6** CMB-only, **foreground-subtracted combined** spectrum at the **Δℓ=20 plotting
  binning**, **trimmed to bin center ℓ ≤ 4100** (122 bins each, ℓ 593–4084). The full
  release runs to ℓ=8319, but the high-ℓ bins are noise-dominated (D_ℓ scatters through
  zero / negative) and were dropped so the points sit against the theory curve cleanly.
  Source files: `binning_20/combined/fg_subtracted_{TT,TE,EE}.dat` inside
  [`act_dr6.02_spectra_and_cov_binning_20.tar.gz`](https://lambda.gsfc.nasa.gov/data/act/pspipe/spectra_and_cov/act_dr6.02_spectra_and_cov_binning_20.tar.gz)
  (LAMBDA). Native columns `[bin_center, D_ℓ (μK², fg-sub), σ (μK²)]`; D_ℓ and σ divided by
  1000 for the 10³ μK² convention.

### `cmb_data_dl50.json` — ACT at Δℓ=50 (likelihood binning), full range

(Used by the neutrino-mass graph for its light-green ACT DR6 TT and EE relative error bands, (D ± σ)/D, no points.)

- **ACT DR6** CMB-only (foreground-marginalized) bandpowers, **Δℓ=50** (widening to 400 at
  high ℓ). TT 598.5–6123.5 (45 bins), TE 598.5–4123.5 (40), EE 498.5–4123.5 (42).
  Source: `act_dr6_cmb_sacc.fits` from
  [ACTCollaboration/DR6-ACT-lite](https://github.com/ACTCollaboration/DR6-ACT-lite).
  Verified 2026-09-23, and again 2026-11-02 for TT, EE and TE (D_ℓ, σ = √diag(cov) and ℓ_eff on every bin, to
  machine precision): match the official SACC file exactly. TT starts at ℓ 600 and EE at 500 by the DR6 cuts.

Both ACT products trace to Louis et al. 2025, JCAP 11 (2025) 062
([arXiv:2503.14452](https://arxiv.org/abs/2503.14452)).

## Planck and SPT (in both files)

(The neutrino-mass graph also uses the Planck TT and EE blocks of `cmb_data.json` for its light-grey relative
error bands, (D ± σ)/D, with no data points drawn.)


- **Planck 2018** — PR3 Plik binned CMB bandpowers (asymmetric errors). TT 47.7–2499.0
  (83 bins), TE/EE 47.7–1988.0 (66 bins). Grid consistent with the PR3 Plik binned product;
  values not independently re-verified.
- **Planck 2018 low-ℓ** (`tt.planck_lowl`, `ee.planck_lowl`; `cmb_data.json` only) — the unbinned PR3 points
  at ℓ = 2–29 (28 per spectrum), the range the binned Plik product above does not cover. Source: rows ℓ 2–29 of
  `COM_PowerSpect_CMB-TT-full_R3.01.txt` and `COM_PowerSpect_CMB-EE-full_R3.01.txt` (columns ℓ, D_ℓ [μK²],
  −σ, +σ at 68%) from the PR3 cosmology-parameter ancillary data,
  [IRSA mirror](https://irsa.ipac.caltech.edu/data/Planck/release_3/ancillary-data/cosmoparams/); described on
  the [PLA wiki](https://wiki.cosmos.esa.int/planck-legacy-archive/index.php/CMB_spectrum_&_Likelihood_Code).
  **TT** is the Commander component-separated spectrum (30–857 GHz), asymmetric 68% limits that include the
  foreground uncertainty; **EE** is the SimAll estimate (the "lowE" likelihood, HFI 100×143), symmetric 68% errors
  from the Fisher matrix. These are the ℓ < 30 points of Planck 2018 results V/VI (A&A 641, A5/A6). All columns
  divided by 1000 for 10³ μK² and rounded to 6 significant figures; taken directly from the files 2026-11-02 (the
  raw files are not kept in the repo). 7 of the 28 EE values are negative (ℓ 10, 11, 12, 14, 20, 26, 29): on log-y
  panels they, and any lower error end ≤ 0, are drawn at the axis floor, as for every dataset. For plotting
  only. The widget draws them with the Planck points (same style, colour, checkbox and legend row) on panels
  whose ℓ axis is `log` or `loglin` only: curvature and dark_energy TT, photon_depth and ODSA TT and EE.
  Not in `cmb_data_dl50.json` (its one user, the neutrino-mass graph, starts at ℓ = 50).
- **SPT-3G D1** — CMB-cleaned (foreground- and nuisance-subtracted) bandpowers, Δℓ=50.
  TT ~425–2975 (52 bins, official 400<ℓ<3000), TE/EE ~425–3975 (72 bins, official
  400<ℓ<4000). Source: `spt3gd1_mv_cleaned_bandpowers.zip` from
  [pole.uchicago.edu/public/data/camphuis25](https://pole.uchicago.edu/public/data/camphuis25).
  Camphuis et al. 2025 ([arXiv:2506.20707](https://arxiv.org/abs/2506.20707)). Grid/binning
  match the official release; values visually confirmed against published figures.

## `lcdm_{s3,geo,matter,neutrino}.json` — the black ΛCDM reference curves

Not observational data: CLASS (lensed) at each emulator backend's site fiducial (its slider defaults) with
that backend's training settings (the training `.param`'s `extra_input`, `l_max_scalars` 4030, Ω_Λ → H₀ by
CONNECT's flat closure), stored **only at the backend's own ℓ nodes** (the `ell` list in its adapter), D_ℓ in
10³ μK² with T_CMB = 2.7255 K. The widget splines it exactly as it splines the model, so at default sliders
the black and purple curves differ only by the emulator's error at its nodes. Each file's `meta` records the
CLASS input and derived h, 100θ_s, YHe.

| file | backend / pages | fiducial |
|------|-----------------|----------|
| `lcdm_s3.json` | S3: `home`, `primordial_power_spectrum` | ω_b 0.02237, ω_cdm 0.12, Ω_Λ 0.685, ln10¹⁰A_s 3.044, n_s 0.9649, τ 0.0544, one 0.06 eV ν (h 0.67389) |
| `lcdm_geo.json` | geo: the four scheme pages (123 nodes, every ℓ ≤ 30) | as S3 with Ω_k = 0 |
| `lcdm_matter.json` | matter: `matter` | as S3 with YHe 0.245 |
| `lcdm_neutrino.json` | neutrino: `NHF`, `neutrinos` Graph 1 | N_eff 3.044 (massless), YHe 0.245640, ω_cdm 0.1201075, 100θ_s 1.041783 (h 0.67808) |

The first three use Planck 2018 means **rounded** to published precision (Ω_Λ 0.685 from 0.6847); the neutrino
file uses CLASS's **unrounded** defaults (Planck 2018 best fit, massless ν). Pages on different sets differ by
0.3–2%; the full comparison (and which values each model bakes in) is in the `pages_reference` README.

Made by `/Users/chase/cosmology/pages_reference/make_lcdm_reference.py` (see its README). These replace the
former `lcdm.json` (a notebook CLASS run at a different Planck cosmology, massless neutrinos, every other ℓ,
μK² from T = 2.726 K), which sat 0.3–2% off every emulator's fiducial.

## `matter_g2_omegal.json` — Ω_Λ(ω_b) for the matter page's Graph 2

Not observational data: the θ_s-fixed curve Ω_Λ(ω_b) that `matter.html` Graph 2 follows, loaded by
`loadMatterOmegaL()` in `emulator/cmb-emulator-matter.js` and interpolated linearly. It is exactly the curve
the matter model was trained on: rows 30000–49999 of
`/Users/chase/cosmology/connect_public/data/matter_schemes_sample.pkl` (built by
`pages_model_matter/make_production_pickle.py` — a cubic spline through 200 CLASS θ_s-shooting runs at the
fiducial 100·θ_s, YHe = 0.245, flat), every 20th row kept: 1000 log-spaced points, ω_b 0.005–0.14237,
Ω_Λ 0.511–0.976, max linear-interpolation error 6×10⁻⁷. Graph 2 sets ω_cdm = max(0.14237 − ω_b, 10⁻⁵),
as in training. Using this curve (not a live θ_s solve on the emulator) keeps Ω_Λ inside the trained range
at the all-baryon end.

## `neutrino_lines.json` — YHe(N_eff) lines for the neutrino page graphs

Not observational data: the two 1-D trajectories that `neutrinos.html` Graphs 1 and 2 follow through
the neutrino emulator's (N_eff, YHe) plane, loaded by `loadNeutrinoLines()` in
`emulator/cmb-emulator-neutrino.js` and interpolated **linearly** in N_eff (error < 1e-5 in YHe).
Copied verbatim from `/Users/chase/cosmology/pages_model_neutrino/tables/neutrino_lines.json`
(generator `make_page_lines.py`; full derivation and decisions in that arm's `README.md` §7, D7–D10).

- **`G1`** — standard-BBN helium: YHe from CLASS v3.3.4 with the **PRIMAT 2025** table
  (`sBBN_2025_primat.dat`, τ_n = 878.4 s), N_eff 0.10–6.90 (138 points).
- **`G2`** — YHe solved with CLASS so the photon damping angle
  θ_d = r_d(z_rec)/(2 r_a(z_rec)) stays at its fiducial value, N_eff 0.10–6.90 (70 points).
- Both pass through the shared fiducial (N_eff 3.044, YHe 0.245640). Every point uses the model's scheme:
  ω_b, A_s, n_s, τ fixed; 100·θ_s = 1.041783 (h solved); a_eq fixed via ω_cdm = f(N_eff).
- `meta` records the CLASS settings, table, grids and validation bounds.

## `bb_data.json` — B-mode data for `tensor_scalar_ratio.html`

Built by `/Users/chase/cosmology/pages_model_tensor/make_bb_data.py` from the files in that arm's
`investigation/data_candidates/` (selection rationale: its `INVESTIGATION.md` D1 and `investigation/01_datasets.md`).
Layout `{meta, bb: {bk18, act, sptpol, pb17, pb22, pr4}}`, read by the widget's `display.dataSets`. All values are
D_ℓ^BB in **10³ μK²** (published μK² × 10⁻³).

| key | dataset | rows | notes |
|---|---|---|---|
| `bk18` | BICEP/Keck 2018 CMB component (BK-XIII, arXiv:2110.00483), `BK18_components_20210607.txt` | `[ℓ_c, D, σ⁻, σ⁺, ℓmin, ℓmax]` | most-probable value with the 68% interval; the only foreground-separated BB; ℓmin/ℓmax are the file's window extents (they overlap) |
| `act` | ACT DR6 combined BB, wide bins (Louis et al. 2025), `combined_BB.dat` | `[ℓ_c, D, σ, σ, null, null]` | Galactic dust subtracted; bin edges not published (no x-bars); the ℓ 2664 bin (off-axis, negative) dropped |
| `sptpol` | SPTpol 500d combined (Sayre et al. 2020), `sayre19/bb_plotting.txt` | `[ℓ_c, D, σ, σ, ℓmin, ℓmax]` | not foreground-subtracted |
| `pb17` | POLARBEAR 2017 (arXiv:1705.02907, Table 4) | `[ℓ_c, D, σ⁻, σ⁺, ℓmin, ℓmax]` | statistical errors only (identical to the LAMBDA 2021apr rows) |
| `pb22` | POLARBEAR 2022 (Adachi et al., arXiv:2203.02495, Table 6, from the LaTeX source) | `[ℓ_mid, D, σ, σ, ℓmin, ℓmax]` | σ = stat ⊕ syst ⊕ cal; bands ℓmin−1 < ℓ ≤ ℓmax plotted at the midpoint; 3 negative bins |
| `pr4` | Planck PR4 low-ℓ BB (LoLLiPoP `cl_lolEB_NPIPE.dat` + covariance; Tristram et al. 2021/2022) | `[ℓmin, ℓmax, D₉₅]` | 95% upper limit = max(0, μ) + 2σ per bin (ℓ 2–7, 8–23, 24–35), μ weighted with the PR4 BB covariance |

Display rules (page decisions): values at or below the log axis floor — negative bandpowers and lower error ends
≤ 0 — are drawn at the floor (no arrows on points); the Planck PR4 limits are solid bars across their bins with a
downward arrow, the usual upper-limit glyph.

## `tensor_bb.json` — the tensor backend's CLASS table (not data)

Copied verbatim from `/Users/chase/cosmology/pages_model_tensor/tables/tensor_bb.json`. Per ℓ = 2…2500, the 7
Chebyshev coefficients of CLASS's lensed total D_ℓ^BB (10³ μK²) on r ∈ [0, 0.01] (`meta` records the cosmology,
physics, nodes and precision). Accuracy, decisions and rebuild steps: that arm's `README.md`.

