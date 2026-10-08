# CMB power-spectrum data (`emulator/data/`)

Binned CMB power-spectrum bandpowers (Planck, ACT, SPT) that the site overlays on the
theory curve. Each JSON has top-level keys `meta`, `tt`, `ee`, `te`; each spectrum holds
`planck`, `act`, and `spt` arrays of bandpower rows.

## Units and columns

All bandpowers are stored as **D_ℓ = ℓ(ℓ+1)C_ℓ/(2π) in units of 10³ μK²** — i.e. the
standard μK² value divided by 1000 (e.g. ACT TT 2223.86 μK² is stored as 2.22386). The
theory (`lcdm.json`) uses the same convention.

Row columns:

| dataset | columns |
|---------|---------|
| planck  | `[ℓ_eff, D_ℓ, σ_minus, σ_plus]` (asymmetric errors) |
| act     | `[ℓ_eff, D_ℓ, σ]` |
| spt     | `[ℓ_eff, D_ℓ, σ]` |

## The two data files

`lcdm.json` is the ΛCDM theory curve (ℓ = 2–4000). The two bandpower files differ **only
in the ACT block**; Planck and SPT are identical between them.

### `cmb_data.json` — ACT at Δℓ=20 (plotting binning), trimmed  ← used by `index.html`

- **ACT DR6** CMB-only, **foreground-subtracted combined** spectrum at the **Δℓ=20 plotting
  binning**, **trimmed to bin center ℓ ≤ 4100** (122 bins each, ℓ 593–4084). The full
  release runs to ℓ=8319, but the high-ℓ bins are noise-dominated (D_ℓ scatters through
  zero / negative) and were dropped so the points sit against the theory curve cleanly.
  Source files: `binning_20/combined/fg_subtracted_{TT,TE,EE}.dat` inside
  [`act_dr6.02_spectra_and_cov_binning_20.tar.gz`](https://lambda.gsfc.nasa.gov/data/act/pspipe/spectra_and_cov/act_dr6.02_spectra_and_cov_binning_20.tar.gz)
  (LAMBDA). Native columns `[bin_center, D_ℓ (μK², fg-sub), σ (μK²)]`; D_ℓ and σ divided by
  1000 for the 10³ μK² convention.

### `cmb_data_dl50.json` — ACT at Δℓ=50 (likelihood binning), full range

- **ACT DR6** CMB-only (foreground-marginalized) bandpowers, **Δℓ=50** (widening to 400 at
  high ℓ). TT 598.5–6123.5 (45 bins), TE 598.5–4123.5 (40), EE 498.5–4123.5 (42).
  Source: `act_dr6_cmb_sacc.fits` from
  [ACTCollaboration/DR6-ACT-lite](https://github.com/ACTCollaboration/DR6-ACT-lite).
  Verified 2026-09-23: D_ℓ and σ match the official SACC file exactly on every bin.

Both ACT products trace to Louis et al. 2025, JCAP 11 (2025) 062
([arXiv:2503.14452](https://arxiv.org/abs/2503.14452)).

## Planck and SPT (in both files)

(The neutrino-mass graph also uses the Planck TT block of `cmb_data.json` for its relative error band,
(D ± σ)/D, with no data points drawn.)


- **Planck 2018** — PR3 Plik binned CMB bandpowers (asymmetric errors). TT 47.7–2499.0
  (83 bins), TE/EE 47.7–1988.0 (66 bins). Grid consistent with the PR3 Plik binned product;
  values not independently re-verified.
- **SPT-3G D1** — CMB-cleaned (foreground- and nuisance-subtracted) bandpowers, Δℓ=50.
  TT ~425–2975 (52 bins, official 400<ℓ<3000), TE/EE ~425–3975 (72 bins, official
  400<ℓ<4000). Source: `spt3gd1_mv_cleaned_bandpowers.zip` from
  [pole.uchicago.edu/public/data/camphuis25](https://pole.uchicago.edu/public/data/camphuis25).
  Camphuis et al. 2025 ([arXiv:2506.20707](https://arxiv.org/abs/2506.20707)). Grid/binning
  match the official release; values visually confirmed against published figures.

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
