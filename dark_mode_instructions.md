# Dark Mode — Functional Specification

This spec covers how CMBverse's dark mode **behaves** and **which colors change**. The visual
design of the toggle (the last-scattering / Dark Ages / Cosmic Dawn idea) is still open. This
document only fixes where the toggle sits and how it works.

Decisions below were confirmed with Chase on 2026-10-20. **Status: implemented 2026-10-20**
(everything except the final toggle design; a sun/moon placeholder stands in).

---

## 1. Behavior

### 1.1 Which theme is shown

| Situation | Theme |
|---|---|
| Visitor has used the toggle before | Their saved choice (`localStorage['cmbverse-theme']` = `"light"` or `"dark"`) |
| No saved choice | Follows the OS setting (`prefers-color-scheme`) |
| No saved choice and the OS setting changes while the page is open | Page follows the OS live |
| Visitor toggles in one tab | Other open CMBverse tabs switch too (`storage` event) |
| JavaScript disabled, or `localStorage` blocked | Light mode (no-JS); OS setting with no persistence (storage blocked). Never an error. |

The choice is site-wide and persists across all 12 pages.

### 1.2 How the theme is applied

- The active theme is a single attribute on the root element: `<html data-theme="dark">` or `data-theme="light"`.
- All colors are CSS custom properties defined on `:root` (light) and overridden under
  `:root[data-theme="dark"]`. No page has inline styles, so `style.css` and
  `emulator/cmb-plot.css` are the only stylesheets to convert.
- The dark block also sets `color-scheme: dark`, so native controls (legend checkboxes,
  scrollbars, focus rings) match. Light mode leaves `color-scheme` at its default (`normal`), which
  already renders light.
- **No flash of light mode, one line per page.** Everything theme-related lives in one shared
  file, `site.js` (site root), loaded *synchronously* in each page's `<head>` before the
  stylesheets:

  ```html
  <script src="site.js"></script>
  ```

  Its first statement sets `data-theme` before first paint. The rest waits for
  `DOMContentLoaded`: it injects the toggle into `<nav>` and wires the OS listener and cross-tab
  sync. The file is a few hundred bytes and is cached after the first page, so blocking on it
  costs nothing noticeable. This avoids duplicating an inline script and the toggle markup
  across 12 pages.
- **The switch is instant.** No site-wide color transition. Any animation belongs to the
  toggle itself (design TBD) and must be skipped under `prefers-reduced-motion: reduce`.

### 1.3 The toggle

- **Placement:** the far right of the `<nav>` bar, vertically centered. It is absolutely
  positioned inside `nav` (which is already `position: relative`), so the centered link list
  doesn't shift.
- **Mid widths (601–1000px):** the links span the whole bar there, wrapping onto two lines, so the
  nav reserves `3.5rem` on the right and the gap between links tightens to `0.25rem` (button side padding
  `0.6rem` below 700px). Each top-level link is a centered flex box (2026-11-01). A wrapped label stays
  centered under one rounded highlight, and only the two submenu headings may wrap. A test confirmed
  the toggle clears all link text from 320 to 1600px. Above 1000px the nav is unchanged.
- **Mobile (≤ 600px):** the nav is a 48px bar with "☰ Menu" on the left (see the README's
  **Navigation**) and the toggle at its right end, vertically centered in the bar (`top: 0.4rem`).
- **Markup** (created by `site.js`, not written into the pages): `<button class="theme-toggle" role="switch" aria-checked="true|false" aria-label="Dark mode">`.
  It is keyboard-focusable and toggles with Enter or Space, with a visible focus ring in both themes.
- Tooltip (`title`) text to be written with the toggle design. Placeholder: "Switch to dark mode" / "Switch to light mode".
- Until the cosmology design is chosen, use a plain sun/moon icon as a stand-in.

### 1.4 Interactive plots (`emulator/cmb-plot.js`)

- The canvas is transparent (`clearRect`) and draws on the page background. Its strokes and
  fills are hard-coded in JS, so CSS alone can't theme them.
- `cmb-plot.js` keeps two palettes (§2.7). A module-level `PAL` is chosen from
  `document.documentElement.dataset.theme` at the start of every `render()`. This is the same
  pattern the file already uses for `VIEW` ("a module global set at the start of every draw"),
  so several widgets on one page can't clash.
- Each plot instance watches `<html data-theme>` with a `MutationObserver` and calls its
  existing `scheduleRender()`. `cmb-plot.js` therefore doesn't depend on `site.js`, and the
  emulator still works on a page without it.
- DOM pieces built in JS:
  - **slider fill gradient:** `setFill()` sets only a `--fill` percentage, and the gradient
    lives in CSS using `var(--accent)` / `var(--track)`. It then needs no refresh.
  - **HTML legend and mobile "Data shown" swatches:** painted by one `paintSwatches()` helper,
    called at build time and again on theme change.
  - **pie SVGs:** separator stroke and text colors move to CSS classes (§2.8). They're redrawn
    every `render()` anyway.
- **Exports are always light.** Download PNG, Open PNG in new tab and SVG always use
  `PALETTE.light` on a white background (`EXPORT_BG = '#ffffff'`), whatever theme is on screen.
  Figures mainly go into papers, slides and homework. The SVG builder already hard-codes the
  light colors and needs no change. The PNG path reuses the on-screen `drawFigure`, so it pins
  `PAL` to light for the duration of the export.

### 1.5 Data-set colors from page configs

The tensor page passes its own `color:` per data set, and the default CMB sets come from `COLOR`
in `cmb-plot.js`. To avoid editing every page, `cmb-plot.js` holds a **light→dark lookup**
(§2.7) keyed by the light hex. A data set may also pass an explicit `colorDark:` that overrides
the lookup. A color with no mapping passes through unchanged, so a new data set needs either a
`DARK_OF` entry or its own `colorDark`.

### 1.6 Unchanged

- The logo (`figures/cmbverse_logo.png`) has a transparent background, so its CMB-filled letters sit directly on the navy. No dark variant is needed.
- About-page photos, the favicon and the analytics tag.
- MathJax output inherits `color`, so equations and the parameter tables follow the text color automatically (including `\hline` rules).
- Pie wedge fill colors (§2.8).

---

## 2. Color map

Contrast ratios are WCAG against the surface named (4.5:1 is the readable-text minimum).

### 2.1 Core tokens

| Token | Role | Light | Dark | Dark contrast |
|---|---|---|---|---|
| `--bg` | page body | `#FAFAF7` paper (was lilac `#E0E7FF` until 2026-11-01) | `#0E1424` deep navy | — |
| `--surface` | cards, menus | `#F4F4F4` / `#FFFFFF` | `#182033` | — |
| `--surface-2` | hover rows, inset areas | `#F3EEF8` | `#22304A` | — |
| `--text` | body text, headings | `#2C3E50` | `#E2E8F5` | 14.9 on bg |
| `--text-muted` | small caps headings, `=` signs, status | `#6B7280` / `#9AA3B2` | `#9AA6BD` | 7.5 on bg |
| `--border` | dividers, menu borders | `#D7D2E0` | `#2A3550` | — |
| `--accent` | sliders, numbers, buttons, citation links | `#7B4397` | `#B48AD6` | 6.6 on bg (old purple: 2.7) |
| `--accent-hover` | solid-button hover | `#6A3A83` | `#C9A8E6` | — |
| `--on-accent` | text on a solid accent fill | `#FFFFFF` | `#0E1424` | 6.6 on accent |
| `--danger` | error status text | `#C0392B` | `#FF8A80` | 8.0 on bg |

### 2.2 Page chrome (`style.css`)

| Element | Property | Light | Dark |
|---|---|---|---|
| `body` | background | `#FAFAF7` | `#0E1424` |
| `body`, `.section-title`, `.section-body`, `.slider-value`, list items | color | `#2C3E50` | `#E2E8F5` |
| `nav`, `nav ul li ul` (dropdown) | background | `#3465A2` (was `#4A90E2` until 2026-11-01) | `#1F3A63` |
| nav links | color | `#FFFFFF` | `#E2E8F5` (9.3 on nav) |
| nav link hover | background | `#7B4397` | `#5B3A7A` (link text goes to `#FFFFFF`) |
| dropdown | box-shadow | `rgba(0,0,0,.2)` | `rgba(0,0,0,.5)` |
| `header.main-header` | background | logo over body | logo over body (no change) |

### 2.3 Links and inline text

| Element | Light | Dark |
|---|---|---|
| `.citation-link` | `#7B4397`, hover `#2C3E50` | `#B48AD6`, hover `#E2E8F5` |
| Plain links (Bootstrap default, e.g. "public fork", `.credit-button` on Credits, which has no CSS rule) | `#007BFF`, hover `#0056B3` | `#8AB4F8` (8.7), hover `#B3CDFB` |
| `<code>` | inherits the surrounding text (link purple inside links) | same (inherits) |

### 2.4 Legacy sliders: removed

The old image-page sliders (`.slider-container`, `.new-slider-container`, `.slider-value`,
`.new-slider-value`) were dead CSS and were deleted on 2026-11-01, along with `main`, `footer`, `h2`,
`header.page-header`, `.mt-2`, `.emphasized-text`, the `*-container` image wrappers and the list classes.
A computed-style comparison of every element on every page (both widths, both themes) showed no change.
The live widget sliders are in §2.6.

### 2.5 About page

The light design shows the page color through the bio box, like a window cut into the gray card.
Dark mode keeps that relationship.

| Element | Light | Dark |
|---|---|---|
| `.about-container` card | `#F4F4F4`, shadow `rgba(0,0,0,.1)` | `#182033`, shadow `rgba(0,0,0,.4)` |
| `.about-description` bio box | `#FAFAF7` (= page bg) | `#0E1424` (= page bg) |
| `.about-name`, `.about-description` text | `#2C3E50` | `#E2E8F5` |
| `.about-picture` ring | `#7B4397` | `#B48AD6` |

### 2.6 Emulator widget chrome (`emulator/cmb-plot.css`)

| Element | Light | Dark |
|---|---|---|
| `.emu-slider` track filled / unfilled (JS gradient) | `#7B4397` / `#E0E0E0` | `#B48AD6` / `#2A3550` |
| `.emu-slider` thumb | `#7B4397` | `#B48AD6` |
| `.emu-slider-value` label / `.emu-num` | `#2C3E50` / `#7B4397` | `#E2E8F5` / `#B48AD6` |
| `.emu-reset` (outline button) | text + border `#7B4397`; hover fill `#7B4397`, text `#FFF` | text + border `#B48AD6`; hover fill `#B48AD6`, text `#0E1424` |
| `.emu-save-main`, `.emu-save-caret` (solid) | fill `#7B4397`, text `#FFF`, hover `#6A3A83` | fill `#B48AD6`, text `#0E1424`, hover `#C9A8E6` |
| `.emu-save-caret` divider | `#EEBFE0` | `#8E6AB0` |
| `.emu-save-menu` | bg `#FFF`, border `#D7D2E0`, shadow `rgba(0,0,0,.12)` | bg `#182033`, border `#2A3550`, shadow `rgba(0,0,0,.5)` |
| `.emu-save-menu button` | bg `#FFF`, text `#2C3E50`; hover bg `#F3EEF8`, text `#7B4397` | bg `#182033`, text `#E2E8F5`; hover bg `#22304A`, text `#B48AD6` |
| `.emu-status` / `.emu-status.err` | `#9AA3B2` / `#C0392B` | `#9AA6BD` / `#FF8A80` |
| `.emu-ylabel`, `.emu-xlabel` (MathJax axis titles) | `#000` | `#D0D6E2` |
| `.emu-legend` text | `#000` | `#D0D6E2` |
| `.emu-derived`, `.emu-pie`, `.emu-mobile-toggles` top border | `#D7D2E0` | `#2A3550` |
| their `h4` headings, `.cell .eq` | `#6B7280` | `#9AA6BD` |
| `.emu-derived-grid .cell` / `.cell b` | `#2C3E50` / `#7B4397` | `#E2E8F5` / `#B48AD6` |
| `.emu-mobile-toggles label` | `#2C3E50` | `#E2E8F5` |

### 2.7 Plot canvas (`emulator/cmb-plot.js`): `PALETTE.light` → `PALETTE.dark`

| Constant / use | Light | Dark |
|---|---|---|
| frame, ticks, tick labels (`'#000'` literals in `drawFigure`) | `#000000` | `#D0D6E2` (12.6) |
| `COLOR_MODEL`, the live emulator curve | `#7B4397` | `#C39BE8` (8.0) |
| `COLOR_LCDM`, the ΛCDM / reference curve (incl. `extraReference`) | `#000000` | `#E2E8F5` |
| `BAND_FILL`, zoom-window shading | `rgba(0,0,0,0.07)` | `rgba(226,232,245,0.07)` |
| `DIVIDER_COLOR`, dashed ℓ=30 divider | `#999999` | `#6B7894` |
| `ERRBAND_FILL.light`, opaque faint envelope (e.g. Planck ±1σ; the old translucent grey over the page background) | `#D3D3D1` | `#2C3241` |
| `ERRBAND_FILL.dark`, strong envelope | `rgba(40,40,40,0.42)` | `rgba(226,232,245,0.30)` |
| `ERRBAND_FILL.act`, opaque ACT DR6 ±1σ envelope (ACT green 35% over the page background) | `#B2DAB0` | `#295737` |
| `ERRBAND_EDGE.light` (`errbandEdge`), Planck envelope edge lines and legend-box border | `#8C8C8A` | `#6B7387` |
| `ERRBAND_EDGE.act` (`errbandEdge`), ACT envelope edge lines and legend-box border | `#2ca02c` | `#5BD25B` |

On dark, "strong" means a *brighter* fill, so the `light`/`dark` shade names keep their meaning
(faint vs. strong) while the actual colors invert.

**Data-set lookup** (§1.5). Same hue, brightened, so "ACT is green" holds in both themes:

| Data set | Light | Dark | Dark contrast |
|---|---|---|---|
| Planck (`COLOR.planck`), BICEP/Keck 2018 | `#000000` | `#E2E8F5` | 14.9 |
| ACT (`COLOR.act`, tensor `act`) | `#2CA02C` | `#5BD25B` | 9.5 |
| SPT / SPTpol (`COLOR.spt`, tensor `sptpol`) | `#D62728` | `#FF6B6B` | 6.6 |
| POLARBEAR 2017 | `#FF7F0E` | `#FFA552` | 9.4 |
| POLARBEAR 2022 | `#8C564B` | `#C99A8C` | 7.4 |
| Planck PR4 95% upper limit | `#1F77B4` | `#6BB3F0` | 8.2 |

### 2.8 Energy-density / matter-density pies (SVG built in `renderPieSVG`)

| Element | Light | Dark |
|---|---|---|
| wedge fills (`PIE_COLOR`: Ω_Λ `#E6AF2E`, CDM `#B0C4DE`, b `#46B1C9`, ν `#D98C6C`) | as listed | **unchanged** |
| wedge separators (`stroke="#fff"`) | `#FFFFFF` | `#0E1424` (page bg) |
| % text *inside* wedges | `#1A1A1A` | `#1A1A1A` (unchanged; sits on pastel) |
| labels *outside* the pie | `#1A1A1A` | `#E2E8F5` |

Implementation note: today one rule (`.emu-pie svg text { fill:#1a1a1a }`) colors both kinds of
text. Give the in-wedge percentages and the outer labels separate classes, and move the separator
stroke into CSS (`.emu-pie svg path { stroke: var(--pie-sep) }`), since an SVG presentation
attribute can't read `var()`.

### 2.9 Exports (unchanged by theme)

PNG and SVG exports always use the light column of §2.7 on a white background, with black
titles, black legend text and white pie separators.

---

## 3. Implementation footprint (how the change ripples)

### 3.1 Dependency map

```
site.js ──sets──▶ <html data-theme>
                       │
       ┌───────────────┼────────────────────────────┐
       ▼               ▼                            ▼
  style.css       cmb-plot.css              cmb-plot.js (MutationObserver)
  (CSS vars)      (CSS vars)                       │ scheduleRender()
  page, nav,      widget chrome, sliders,          ▼
  links, about    legend text, pie text      PAL = LIGHT | DARK
                                                   │
                     ┌─────────────────────────────┼──────────────────────┐
                     ▼                             ▼                      ▼
              drawPanel / drawDataSet       legendRows()            paintSwatches()
              (canvas, on screen)           shared by 3 consumers   HTML legend +
                     │                             │                mobile toggles
                     ▼                             ▼
              drawExport (PNG) ◀── pins PAL = LIGHT ──▶ buildSVG (SVG)
```

`site.js` and `cmb-plot.js` are coupled only through the `data-theme` attribute, never by
importing each other.

### 3.2 What changes, file by file

| File | Change | Size |
|---|---|---|
| `site.js` *(new)* | set `data-theme`; inject toggle; `localStorage` (try/catch); OS listener; `storage` sync | ~35 lines |
| 12 × `*.html` | one `<script src="site.js">` line in `<head>` | +1 line each |
| `style.css` | token blocks for light + dark; swap ~30 hex literals for `var(--…)` in place; toggle styles; link/`code` overrides | +~60, ~30 edited |
| `emulator/cmb-plot.css` | swap ~25 hex literals for `var(--…)` in place; slider gradient rule; pie text/stroke classes | +~5, ~25 edited |
| `emulator/cmb-plot.js` | see §3.3 | +~30, ~15 edited |
| `README.md` | short "Theming" section | +~15 |

**About +160 lines in total.** Most of the CSS work is replacing a color with a variable
in place, which adds no lines.

### 3.3 Inside `cmb-plot.js`: every color touch point

The light colors stay exactly where they are. The existing constants (`COLOR_MODEL`,
`COLOR_LCDM`, `COLOR`, `BAND_FILL`, `DIVIDER_COLOR`, `ERRBAND_FILL`) *are* the light palette.
The additions are:

1. a `DARK` palette object, plus a `LIGHT` object that just points at those constants (~14 lines)
2. a light→dark data-set lookup and a `dsColor(ds)` helper honoring `ds.colorDark` (~8 lines)
3. `let PAL`, set in `render()`, and save/restore around `drawExport` and `buildSVG` (~4 lines)
4. one `MutationObserver` per instance (~3 lines)
5. `paintSwatches()` replacing two inline `sw.style.background = color` sites (~6 lines, net)

| Call site (current line) | Used by | Edit? |
|---|---|---|
| `drawPanel` frame/ticks/labels `'#000'`, divider, zoom band, error bands, ΛCDM, model curve, Planck/ACT/SPT (710–804) | screen + PNG | yes, read `PAL.*` (~12 lines) |
| `drawDataSet` `ds.color` (848) | screen + PNG | yes, `dsColor(ds)` |
| `legendRows()` colors (891–902) | HTML legend, PNG legend, SVG legend | yes, read `PAL`; exports already pin light |
| mobile toggle swatches (596–605) and HTML legend swatches (918–923) | screen | yes, `paintSwatches()` |
| `setFill` slider gradient (518) | screen | yes, becomes a `--fill` percentage; colors move to CSS |
| `renderPieSVG` `stroke="#fff"`, text (970–982) | screen | yes, `class=` attributes; colors in CSS |
| `buildSVG` literals: `#000`, `ds.color`, `COLOR_*` (1183–1290) | SVG export | **no**: already light |
| `drawTitlesCanvas`, `drawLegendCanvas` text `'#000'` (1130, 1159), `EXPORT_BG` | PNG export | **no**: export only |
| `PIE_COLOR` (exported to pages) | pies | **no**: unchanged by design |

### 3.4 What doesn't change at all

- **Page configs:** every `createCMBPlot({...})` call in the 12 pages, including the tensor
  page's six `color:` entries, which resolve through the lookup.
- **Model and data:** `cmb-emulator-*.js`, all model weights, and `emulator/data/*`.
- **SVG export path:** none of its ~100 lines are touched.
- **Images:** logo, favicon, photos.

### 3.5 Risks to watch

- **A missed hard-coded color shows up as black-on-navy.** The touch-point table above is
  meant to cover all of them. The test checklist (§4) visits every widget type, and
  `grep -n "#000\|#fff" emulator/cmb-plot.js` should afterwards match only export-only code.
- **Exports must restore `PAL`.** If an export didn't put `PAL` back, the next screen draw
  would briefly be wrong. Save/restore makes this impossible, and `render()` reassigns `PAL`
  anyway.
- **Three widgets on one page** (neutrinos) share the module-level `PAL`. That's safe for the
  same reason `VIEW` is: every draw sets it first, and JS is single-threaded.
- **Synchronous `site.js`:** if the file fails to load, pages render in light mode without a
  toggle. Nothing else breaks.

### 3.6 Cleanup found along the way — done in `86f495f5`

`style.css` contains the entire About-page block twice. Lines 434–510 and 511–587 are
byte-for-byte identical, so deleting one copy removes **77 lines** with no visual change. Done
first, it also halves the About-page literals to convert, and with it the dark-mode work leaves
`style.css` only slightly larger than it is today.

---

## 4. Test checklist

- [ ] Every page in both themes: index, matter, primordial_power_spectrum, dark_energy, photon_depth, neutrinos (3 widgets, incl. zoom column), curvature, tensor_scalar_ratio (6 data sets incl. upper-limit arrows), ODSA, NHF, about, credits.
- [ ] Hard reload in dark mode: no flash of light.
- [ ] Toggle works by mouse, keyboard (Tab → Enter/Space) and touch; `aria-checked` updates.
- [ ] With no saved choice, changing the OS appearance flips the page live; after toggling once, it no longer does.
- [ ] Two tabs open: toggling one flips the other.
- [ ] Private window / storage blocked: follows the OS, no console errors.
- [ ] Plots redraw immediately on toggle (curves, data points, error bands, zoom band, ℓ=30 divider, legends, slider fills, pies).
- [ ] PNG / SVG export in dark mode comes out white-background, black-axis, identical to a light-mode export.
- [ ] Nav dropdowns, the save menu and hover states are readable in dark mode.
- [ ] Mobile widths (≤ 600px nav stack, ≤ 980px widget stack, touch "Data shown" row): toggle placement and colors.
- [ ] `prefers-reduced-motion`: the toggle animation is skipped.

---

## 5. Open items

- **Toggle visual design.** Candidates are in the 2026-10-20 discussion: a blackbody-cooling
  knob (3000 K orange → Dark Ages black), optionally with a Cosmic Dawn star ignition on the
  return to light. Functionality above doesn't depend on that choice.
