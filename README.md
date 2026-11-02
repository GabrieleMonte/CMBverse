# CMBverse

[**CMBverse**](https://gabrielemontefalcone.com/CMBverse/) is an interactive website for learning
how the cosmological parameters shape the temperature and polarization anisotropies of the cosmic
microwave background (CMB). Each page pairs a short physical explanation with live plots of the CMB
power spectra that update as the reader moves a slider. We overlay these spectra on current
measurements from *Planck*, the Atacama Cosmology Telescope (ACT), and the South Pole Telescope
(SPT), making the imprint of each parameter on the data directly visible.

## Pages

The site mirrors its menu: a home page exploring the full six-parameter ΛCDM model, a set of pages
that isolate one cosmological parameter at a time, and two pages illustrating degeneracies between
parameters.

| Page | Sliders | Source |
|---|---|---|
| [Home](https://gabrielemontefalcone.com/CMBverse/home) | $\omega_b$, $\omega_c$, $\Omega_\Lambda$, $\ln(10^{10}A_s)$, $n_s$, $\tau_{\rm reio}$ | [`home.html`](home.html) |
| ***Cosmological Parameters*** | | |
| [Dark and Baryonic Matter](https://gabrielemontefalcone.com/CMBverse/matter) | $\omega_c$; $\omega_b$ at fixed $\omega_m$ | [`matter.html`](matter.html) |
| [Primordial Power Spectrum](https://gabrielemontefalcone.com/CMBverse/primordial_power_spectrum) | $\ln(10^{10}A_s)$ and $n_s$ | [`primordial_power_spectrum.html`](primordial_power_spectrum.html) |
| [Dark Energy](https://gabrielemontefalcone.com/CMBverse/dark_energy) | $\Omega_\Lambda$ | [`dark_energy.html`](dark_energy.html) |
| [Photon Optical Depth](https://gabrielemontefalcone.com/CMBverse/photon_depth) | $\tau_{\rm reio}$ | [`photon_depth.html`](photon_depth.html) |
| [Neutrinos](https://gabrielemontefalcone.com/CMBverse/neutrinos) | $N_{\rm eff}$ (damping and phase shift) and $M_\nu$ | [`neutrinos.html`](neutrinos.html) |
| [Curvature](https://gabrielemontefalcone.com/CMBverse/curvature) | $\Omega_k$ | [`curvature.html`](curvature.html) |
| [Tensor to Scalar Ratio](https://gabrielemontefalcone.com/CMBverse/tensor_scalar_ratio) | $r$, on the B-mode spectrum | [`tensor_scalar_ratio.html`](tensor_scalar_ratio.html) |
| ***Relevant Degeneracies*** | | |
| [Optical Depth and Scalar Amplitude](https://gabrielemontefalcone.com/CMBverse/ODSA) | $\tau_{\rm reio}$ at fixed $A_s e^{-2\tau_{\rm reio}}$ | [`ODSA.html`](ODSA.html) |
| [Neutrinos and Helium Fraction](https://gabrielemontefalcone.com/CMBverse/NHF) | $N_{\rm eff}$ and $Y_{\rm He}$ | [`NHF.html`](NHF.html) |
| [About](https://gabrielemontefalcone.com/CMBverse/about) | project description, contact, and acknowledgments | [`about.html`](about.html) |

## How it works

CMBverse is a static website served by GitHub Pages, so every calculation runs in the reader's
browser. Instead of displaying a precomputed grid of figures, we drive each plot with neural-network
emulators of the Einstein–Boltzmann solver [CLASS](https://github.com/lesgourg/class_public), which
we trained with [our modified version](https://github.com/ChaseE-17/connect_public) of
[CONNECT](https://github.com/AarhusCosmology/connect_public) and evaluate with TensorFlow.js, fast
enough to redraw the spectra continuously as a slider moves. Specifically, we use five emulators,
each trained only over the parameters its pages vary: (i) the six ΛCDM parameters, for Home and
Primordial Power Spectrum; (ii) $\omega_c$, $\omega_b$, and $\Omega_\Lambda$, for Dark and Baryonic
Matter; (iii) $\Omega_\Lambda$, $\Omega_k$, $\tau_{\rm reio}$, and $A_s$, for Dark Energy, Photon
Optical Depth, Curvature, and Optical Depth and Scalar Amplitude; (iv) $N_{\rm eff}$ and
$Y_{\rm He}$, for Neutrinos and Helium Fraction and the two $N_{\rm eff}$ graphs on Neutrinos; and
(v) $M_\nu$, for the neutrino-mass graph. The Tensor to Scalar Ratio page instead evaluates a
precomputed CLASS table of the B-mode spectrum as a function of $r$, which reproduces the CLASS
spectra to numerical precision.

On the TT, TE, and EE panels, we show the binned bandpowers of *Planck* 2018, ACT DR6, and SPT-3G
D1, while on the B-mode page we show the BICEP/Keck 2018, ACT DR6, SPTpol 500d, and POLARBEAR 2017
and 2022 bandpowers, together with the *Planck* PR4 upper limits. We document the source of each
dataset and how we processed it in [`emulator/data/README.md`](emulator/data/README.md).

## Repository layout

| Path | Contents |
|---|---|
| `*.html` | One file per page, listed above. |
| [`emulator/cmb-plot.js`](emulator/cmb-plot.js), [`cmb-plot.css`](emulator/cmb-plot.css) | The interactive plot widget shared by every page: panels, sliders, legend, derived parameters, and PNG/SVG export. |
| `emulator/cmb-emulator-*.js` | One module per emulator, which loads its trained models and returns the spectra for a set of parameters. |
| `emulator/sep_*/` | The trained TensorFlow.js models, one per spectrum and emulator. |
| [`emulator/data/`](emulator/data/) | Observational bandpowers, the ΛCDM reference curves, and the tensor table. |
| [`site.js`](site.js) | Light and dark mode and the phone menu, shared by every page. |
| [`style.css`](style.css) | Site-wide styles and the color tokens for both themes. |
| [`mathjax.js`](mathjax.js) | Loads MathJax, which typesets the equations. |
| [`figures/`](figures/), [`fonts/`](fonts/) | The logo and favicon, and the STIX Two Text web fonts with their SIL Open Font License. |

## Light and dark mode

The site follows the reader's operating-system theme unless they pick one with the toggle at the
right end of the menu, in which case the choice is saved in the browser and applied on every page.
[`site.js`](site.js) sets the theme before the page is drawn, avoiding a flash of the wrong colors.
In addition, every color is a token defined once in [`style.css`](style.css), with the light values
under `:root` and the dark overrides under `:root[data-theme="dark"]`, so changing a color means
editing its token rather than the individual rules. The plots switch to a matching dark palette on
screen, while saved PNG and SVG figures always use the light palette, so that a figure looks the
same regardless of the theme it was saved from.

## Running locally

Since the pages load the emulators as JavaScript modules, which browsers block when a file is opened
directly from disk, the site has to be served over HTTP from the repository root:

```sh
python3 -m http.server 8000
```

The home page is then at <http://localhost:8000/home.html>. Note that the menu uses the
extensionless URLs of GitHub Pages (e.g. `matter`), which this simple server does not resolve, so
locally each page is opened by its file name (e.g. <http://localhost:8000/matter.html>).

## Credits

CMBverse is developed by Chase Enlowsmith under the mentorship of Gabriele Montefalcone. Questions,
comments, and bug reports are welcome at cenlowsmith@utexas.edu, and the full acknowledgments,
including the codes, datasets, and references we relied on, are on the
[About](https://gabrielemontefalcone.com/CMBverse/about) page.