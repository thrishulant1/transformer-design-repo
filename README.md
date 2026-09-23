# Dry-type transformer design calculator — v1.1.0

A single-page web app with two design modules:

- **Rectangular core, LV/LV:** follows the RECT CORE TYPE CAL1 sheet. It includes:
  - requirement-sheet import, automatic design and a compliance table with designer confirmations
  - IEC short-circuit and tolerance checks
  - guarantees and FAT test comparison with calibration
  - a shared design library
  - PDF and Excel export
- **Round stepped core, HV distribution:** follows the 45-step method used for the 500 / 600 / 1600 kVA references. It has the same checks and the guarantees and tests tab.

Everything runs from `index.html`: calculations, screens and exports. There is no server and no build step. `tests/regression.js` re-checks the reference designs.

## Hosting

**GitLab Pages (recommended, can be private)**
1. Push all files to the default branch.
2. The pipeline runs `tests/regression.js` first. **The site is only updated if every reference check passes.**
3. Find the link under **Deploy → Pages**.
4. To keep it private, go to **Settings → General → Visibility → Pages → Only project members**, then add users under **Manage → Members**.

**GitHub Pages**
1. Push all files and set **Settings → Pages → Source = GitHub Actions**.
2. The workflow in `.github/workflows/pages.yml` tests first, then deploys `main`.
3. On free accounts the repository and page must be public.

## Shared design library

| Where the page is opened | Where "Save" stores designs |
|---|---|
| The claude.ai link | Shared live between everyone who opens that link (Claude shared storage) |
| GitLab / GitHub with Supabase configured | Shared Supabase table; refreshed every 20 s and when the tab regains focus |
| GitLab / GitHub without Supabase | This browser only. Use **Export designs** or the downloaded Excel to share |

**To switch on Supabase:**
1. Create a free project at supabase.com.
2. Run `supabase.sql` in its SQL editor.
3. In `index.html`, search for `SHARED_LIBRARY=` (~line 1610) and fill in `supabaseUrl` and `supabaseAnonKey` (Project Settings → API).
4. The sample policies let anyone with the link read and write. Tighten them before sharing outside your team.

Designs saved in a browser before the library was switched on can be moved with **Copy this browser's designs to the shared library**.

## Checking a change (automatic and manual)

- **Automatic:** `node tests/regression.js` runs 40 checks against the reference designs. CI runs it on every push.
- **Manual:** press **70 kVA — your design sheet**. It must show 2.91 %, 268 W, 1,384 W and 298 kg.
- **Intentional change:** if you change a design rule on purpose (for example after calibration), update the expected value in `tests/regression.js` in the same commit, with a note of the test report behind it.

## What changed in v1.1.0

| Area | Change |
|---|---|
| Ratio tolerance | IEC 60076-1: the lower of 0.5 % and Z/10. Refined basis picks turns that meet it |
| Conductivity | Choice of IEC standard (default for new designs), design-sheet values, or supplier certificate |
| Axial length | Fullest layer rounded up to whole turns, then + extra turn per layer |
| Loss reference temperature | Round core defaults by class per IEC 60076-11 (F 120 °C, H 145 °C) |
| Zigzag | Dzn0 removed until zigzag windings are modelled |
| Compliance | Rows the tool cannot calculate stay "To confirm" until ticked |
| Header | Revision, checked by, PO, drawing no., tool version on every PDF page |
| Short circuit | IEC 60076-5 thermal (2 s default), radial force, hoop stress, axial estimate; fault level and duration inputs; optional "required" in auto design |
| Guarantees and tests | IEC 60076-1 tolerances, FAT comparison, calibration with Apply |
| Auto design | Flux density searched when blank; runs in a background worker |
| Other | Altitude derating, K-factor, E/C/F classes, PD note ≥ 3.6 kV, 60 Hz loss correction, noise estimate, IS 1180 / customer loss limits, round-core no-load current and cost, Excel "Values" sheet |

## What you can edit

Open `index.html`, search for the text shown, change it, run `node tests/regression.js`, then commit. Line numbers are approximate.

### Standards and shared rules
| What | Search for |
|---|---|
| Tool version shown on sheets | `APP_VERSION=` (~415) |
| Resistivity at 20 °C (Cu, Al) | `STD.RHO=` (~418) |
| Reference temperature by class | `STD.REF_TEMP=` (~421) |
| Rise limits by class, altitude derating | `STD.RISE=`, `STD.altitudeFactor` (~423) |
| Test tolerances (+10 %, +15 %, +30 %, ±10 / ±7.5 %) | `STD.TOL=` (~429) |
| Short-circuit temperature limits | `STD.SC_LIMIT=` (~432) |
| Short-circuit calculation | `STD.shortCircuit=` (~438) |
| Noise estimate formula | `STD.noise=` (~452) |
| Frequency and harmonic factors | `STD.fLoss=`, `STD.kEddy=` (~454) |

### Rectangular core
| What | Search for |
|---|---|
| Core-loss table (CORELOSS sheet) | `RC.CORELOSS=` (~729) |
| VA/kg table (VA sheet) | `RC.VAKG=` (~734) |
| Design-sheet conductivity, density, stray factor | `RC.COND=` (~736) |
| Lamination widths for auto design | `RC.LAM=` (~737) |
| Main calculation | `function rectDesign` (~758) |
| Temperature-rise rule | `const rise1=` (~839) |
| Design checks list | `const chk=(name,req,got,ok)=>o.checks` (~874) |
| Auto-design scoring | `function rcScore` (~906) |
| Auto-design search ranges | `function rectAuto1` (~919) |
| Engine defaults | `const RC_DEFAULTS=` (~967) |
| Built-in requirement rows | `const REQ_DEFAULT=` (~1264) |
| Form defaults, prices, names | `const RBASE=` (~1279) |
| Preset buttons | `const RPRESETS=` (~1284) |
| Which rows are declarations | `const R_DECL=` (~1402) |
| Compliance wording | `function compRows` (~1414) |

**Adding a preset button**, for example 8 kVA:
1. Download Excel for the design and copy the field names and values from its **Inputs** sheet.
2. Add an entry to `RPRESETS`, for example `kva8:{...RBASE, kVA:8, ...}`.
3. Add `<button class="btn sm" data-rpreset="kva8">8 kVA</button>` next to `data-rpreset="auto70"`.

### Round core
| What | Search for |
|---|---|
| Core-loss tables | `CORE_GRADES = {` (~463) |
| Clearances and test voltages by HV class | `function hvClass` (~475) |
| Main calculation | `function design(p)` (~498) |
| Ratio, no-load current, short circuit, checks | `Phase 2: ratio tolerance` (~654) |
| Auto optimiser | `function designAuto` (~693) |
| Reference presets | `const PRESETS=` (~1034) |

### Guarantees and tests (both modules)
| What | Search for |
|---|---|
| Tolerances table and pass/fail logic | `function gtRows` (~986) |
| Calibration factors | `function gtCal` (~1008) |

## Known limits (next phase)
- Hoop stress uses a circular-equivalent formula. Rectangular coils have higher corner stresses, so verify critical designs separately.
- Axial short-circuit force is an estimate.
- The noise formula needs one measured unit to calibrate its constant: use the Tests tab, then Apply.
- Foil windings, zigzag windings and HV disc windings are not modelled.
- The temperature-rise rule is the design sheet's empirical rule. Calibrate it with heat-run results in the Tests tab.
