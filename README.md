# Dry-type transformer design calculator — v1.2.1

A web app with two design modules:

- **Rectangular core, LV/LV:** follows the RECT CORE TYPE CAL1 sheet.
- **Round stepped core, HV distribution:** follows the 45-step method (500 / 600 / 1600 kVA references).

Both modules include:
- automatic design
- IEC 60076-1 / -5 / -11 checks
- guarantees and FAT comparison with calibration
- dimensioned drawings
- PDF and Excel export

## Project layout

```
src/                 ← edit these files
  page.html            page structure, styles, round-core screens and exports
  rect-form.html       rectangular-core form
  standards.js         IEC / IS values and formulas shared by both modules
  engine-round.js      round-core calculation
  engine-rect.js       rectangular-core calculation
  guarantees.js        guarantees and FAT test comparison
  drawing.js           dimensioned drawings, drawing page in the PDF
  validation.js        input checks (limits and messages for every field)
  ui-rect.js           rectangular-core screens, library, exports
lib/                 PDF and Excel libraries (jsPDF 2.5.1, jsPDF-AutoTable 3.8.2, SheetJS 0.18.5), built into index.html
tools/build.py       joins src/ and lib/ into index.html
index.html           the built app, works offline (do not edit by hand)
tests/regression.js  45 checks against the reference designs
supabase.sql         optional shared design library
```

**The one rule: edit `src/`, never `index.html`.**

`index.html` contains everything, including the PDF and Excel libraries, so it also works with no internet: copy it to a laptop and double-click it. Only the web font needs the internet; without it the page uses Arial. `python tools/build.py --cdn` makes a smaller file that loads the libraries from the internet instead.

1. Change a file in `src/`.
2. Run `python tools/build.py`. It rewrites `index.html`.
3. Run `node tests/regression.js`. All checks must pass.
4. Open `index.html` in the browser (VS Code: right-click → Open with Live Server) and check the change.
5. Commit **both** the `src/` change and the new `index.html`.

CI runs `python tools/build.py --check` first. If someone edited `index.html` directly, or forgot to rebuild, the pipeline stops and the site is not updated. This keeps everyone's edits in one place.

## Hosting

**GitLab Pages (recommended, can be private)**
1. Push everything.
2. The pipeline runs: build check → 45 reference checks → publish.
3. Find the link under **Deploy → Pages**.
4. To make it private: **Settings → General → Visibility → Pages → Only project members**.

**GitHub Pages**
1. Push everything and set **Settings → Pages → Source = GitHub Actions**.
2. Free accounts need a public repository.

After a deploy, press Ctrl+F5 on the live site to skip the browser's cached old version.

## Shared design library

| Where the page is opened | Where "Save" stores designs |
|---|---|
| The claude.ai link | Shared live between everyone who opens that link |
| GitLab / GitHub with Supabase configured | Shared Supabase table (refreshed every 20 s and on focus) |
| GitLab / GitHub without Supabase | This browser only. Share with **Export** or the downloaded Excel |

**To switch on Supabase:**
1. Create a free project at supabase.com.
2. Run `supabase.sql` in its SQL editor.
3. In `src/ui-rect.js`, fill in `SHARED_LIBRARY` with the URL and anon key.
4. Rebuild.
5. Tighten the sample security policies before sharing outside your team.

## Downloads

File names: `{work order or party}_{RECT|ROUND}_{kVA}kVA_{HV}-{LV}V_{revision}_{date}.pdf` (and `.xlsx`), for example `WO1234_RECT_70kVA_433-400V_R1_2026-09-23.pdf`.

| | Rectangular core | Round core |
|---|---|---|
| PDF | 1 design sheet · 2 general arrangement drawing · 3 compliance · 4 checks, build-up, bill of materials · 5 guarantees, tests, steps | 1 design sheet · 2 general arrangement drawing · 3 checks, guarantees · 4–5 steps, core steps, taps, clearances |
| Excel | CAL1, Compliance, BOM, Steps, Values (numbers), Guarantees & tests, Inputs (reloadable) | Design sheet, Steps, Core steps, Taps, Checks, Values, Guarantees & tests, Inputs |

## What changed

**v1.2.1**
- **Input checks:** every field has limits. Impossible entries (0 kVA, negative clearances, a strip with only one dimension, more layers than turns, HV not above LV in the round core, a missing supplier conductivity) are outlined in red with a plain message; the results are dimmed and PDF/Excel downloads wait until they are fixed.
- **Unusual but valid entries** are shown as warnings and the design still runs, for example:
  - equal voltages, which are normal for isolation transformers
  - flux above 1.6 T
  - a strip that looks swapped
  - tap ranges that are not whole steps
  - odd core proportions
- **Works offline:** the PDF and Excel libraries are built into `index.html`.

**v1.2.0**
- **IEC 60076-5 Table 1:** warns when impedance is below the recognised minimum (4 % up to 630 kVA): short-circuit withstand is then by agreement, and a duration below 2 s may be agreed when the fault current exceeds 25 × rated.
- **Inner-winding compressive hoop stress check:** 0.35 × Rp0.2, or 0.6 × Rp0.2 for resin-bonded conductors (IS 2026-5 Annex A); 1.1 × mean for 3+ layers.
- **Round core:** the system fault level defaults to IS 2026-5 Table 2 (500 MVA up to Um 24 kV, 1000 MVA at 36 kV) instead of an infinite bus.
- **LV/LV compliance wording:** states that IEC 60076-11 is applied by agreement, because its scope is windings above 1.1 kV.
- **File names:** consistent for both modules, with order reference, revision and date.
- **Drawings:**
  - Rectangular core: front section of all three limbs with every winding layer and duct, plus a dimensioned plan and radial build.
  - Round core: plan through the windings with the real stepped core, plus a limb section with LV layers, HV coils and ducts.
  - Both are added to the PDF as a general arrangement page.
- **Project structure:** source files and build script in the repo; CI build check.

**v1.1.1:** PDF sections fitted to the fewest pages, no orphan rows; sidebar redesign.

**v1.1.0:**
- **Checks and conductivity:** IEC ratio tolerance; conductivity choice.
- **Short circuit, guarantees and tests:** IEC 60076-5 short-circuit checks; guarantees and tests tab.
- **Automatic design:** flux density search and background search.
- **Library and site data:** shared library; altitude, K-factor, E/C/F classes.

## What you can edit

In VS Code press **Ctrl+Shift+F**, search for the text in the middle column, edit, then rebuild.

### Standards and shared rules
| What | Search for | File |
|---|---|---|
| Tool version shown on sheets | `APP_VERSION=` | `src/standards.js` |
| Resistivity at 20 °C (Cu, Al) | `STD.RHO=` | `src/standards.js` |
| Reference temperature by class | `STD.REF_TEMP=` | `src/standards.js` |
| Rise limits by class, altitude derating | `STD.RISE=` | `src/standards.js` |
| Test tolerances (+10 %, +15 %, +30 %, ±10 / ±7.5 %) | `STD.TOL=` | `src/standards.js` |
| Short-circuit temperature limits (IS 2026-5 Table 3) | `STD.SC_LIMIT=` | `src/standards.js` |
| Minimum impedance (Table 1), system MVA (Table 2) | `STD.zMin=` | `src/standards.js` |
| Hoop stress limits (0.9 / 0.35 / 0.6 × Rp0.2) | `STD.compLimit=` | `src/standards.js` |
| Short-circuit calculation | `STD.shortCircuit=` | `src/standards.js` |
| Noise estimate | `STD.noise=` | `src/standards.js` |
| Frequency and harmonic factors | `STD.fLoss=` | `src/standards.js` |

### Rectangular core
| What | Search for | File |
|---|---|---|
| Core-loss table (CORELOSS sheet) | `RC.CORELOSS=` | `src/engine-rect.js` |
| VA/kg table (VA sheet) | `RC.VAKG=` | `src/engine-rect.js` |
| Design-sheet conductivity, density, stray factor | `RC.COND=` | `src/engine-rect.js` |
| Lamination widths for auto design | `RC.LAM=` | `src/engine-rect.js` |
| Main calculation | `function rectDesign` | `src/engine-rect.js` |
| Temperature-rise rule | `const rise1=` | `src/engine-rect.js` |
| Design checks list | `const chk=(name,req,got,ok)=>o.checks` | `src/engine-rect.js` |
| Auto-design scoring | `function rcScore` | `src/engine-rect.js` |
| Auto-design search ranges | `function rectAuto1` | `src/engine-rect.js` |
| Engine defaults | `const RC_DEFAULTS=` | `src/engine-rect.js` |
| Built-in requirement rows | `const REQ_DEFAULT=` | `src/ui-rect.js` |
| Form defaults, prices, names | `const RBASE=` | `src/ui-rect.js` |
| Preset buttons (definitions) | `const RPRESETS=` | `src/ui-rect.js` |
| Preset buttons (on screen) | `data-rpreset="auto70"` | `src/rect-form.html` |
| Which rows are declarations | `const R_DECL=` | `src/ui-rect.js` |
| Compliance wording | `function compRows` | `src/ui-rect.js` |
| Drawing | `function rDrawing` | `src/ui-rect.js` |
| PDF layout | `$('#rPdf')` | `src/ui-rect.js` |
| Form fields | `name="kVA"` | `src/rect-form.html` |

**Adding a preset button** (for example 8 kVA):
1. Download Excel for the design and copy the field names and values from its **Inputs** sheet.
2. Add `kva8:{...RBASE, kVA:8, ...},` to `RPRESETS`.
3. Add `<button class="btn sm" data-rpreset="kva8">8 kVA</button>` next to the other preset buttons.
4. Rebuild.

### Round core
| What | Search for | File |
|---|---|---|
| Core-loss tables | `CORE_GRADES = {` | `src/engine-round.js` |
| Clearances and test voltages by HV class | `function hvClass` | `src/engine-round.js` |
| Main calculation | `function design(p)` | `src/engine-round.js` |
| Ratio, no-load current, short circuit, checks | `Phase 2: ratio tolerance` | `src/engine-round.js` |
| Auto optimiser | `function designAuto` | `src/engine-round.js` |
| Reference presets | `const PRESETS=` | `src/page.html` |
| Drawing | `function roundDrawing` | `src/page.html` |
| PDF layout | `$('#dlPdf')` | `src/page.html` |
| File names (both modules) | `function designFileName` | `src/page.html` |

### Input checks
| What | Search for | File |
|---|---|---|
| Limits for rectangular-core fields | `const RECT_RULES=` | `src/validation.js` |
| Cross-field checks, rectangular core | `function rectCross` | `src/validation.js` |
| Limits for round-core fields | `const ROUND_RULES=` | `src/validation.js` |
| Cross-field checks, round core | `function roundCross` | `src/validation.js` |

Each rule is one line: `POS('kVA','Rating','kVA',{req:true,max:5000})` means "required, above 0, at most 5000". Add `warn:v=>...` to show a warning without blocking.

### Shared
| What | Search for | File |
|---|---|---|
| Guarantee tolerances and pass/fail | `function gtRows` | `src/guarantees.js` |
| Calibration factors | `function gtCal` | `src/guarantees.js` |
| Dimension lines, colours, drawing to PDF | `function drwPal` | `src/drawing.js` |
| Colours and fonts of the page | `:root{` | `src/page.html` |
| Page title and intro | `<header class="top">` | `src/page.html` |

## Checking a change
- **Automatic:** `python tools/build.py --check` and `node tests/regression.js` (45 checks). Both run in CI on every push.
- **Manual:** **Your 70 kVA sheet** must show 2.91 %, 268 W, 1,384 W and 298 kg.
- **Intentional rule change** (for example after calibration): update the expected value in `tests/regression.js` in the same commit, with the test report reference.

## To verify against your copy of the standards
- Loss reference temperatures by class in `STD.REF_TEMP` (F 120 °C, H 145 °C), IEC 60076-11 Annex D.
- Hoop-stress Rp0.2 of your conductor (defaults: Cu 80 MPa, Al 35 MPa as the 0.9 × Rp0.2 tensile limit).

## Known limits (next phase)
- Foil, zigzag and HV disc windings, and single-phase units, are not modelled.
- Rectangular-coil corner stresses (the hoop stress is a circular-equivalent value).
- Axial short-circuit force is an estimate.
- Noise needs one measured unit to calibrate.
- The temperature-rise rule is the design sheet's empirical rule. Calibrate it from heat-run results in the Tests tab.
