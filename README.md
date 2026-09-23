# Dry-type transformer design calculator

A single-page web app with two design modules:

- **Rectangular core, LV/LV (Class H):** follows the RECT CORE TYPE CAL1 sheet. It can import a requirement sheet, auto-design, check compliance, save designs, and export to PDF and Excel.
- **Round stepped core (distribution, HV):** follows the 45-step method used for the 500 / 600 / 1600 kVA reference sheets.

Everything is in `index.html`: HTML, CSS, calculation engines and UI. There is no build step and no server. Open the file in a browser, or host it on GitLab Pages or GitHub Pages.

## Hosting

**GitLab Pages (recommended for company data)**
1. Create a project and push `index.html`, `.gitlab-ci.yml` and this README to the default branch.
2. The pipeline publishes the page to `https://<group>.gitlab.io/<project>/`. Check **Deploy → Pages** for the exact link.
3. To keep it private, go to **Settings → General → Visibility → Pages** and choose *Only project members*. Then add each user under **Manage → Members**.

**GitHub Pages**
1. Push the same files. `.nojekyll` is included.
2. Go to **Settings → Pages → Deploy from a branch → main / root**.
3. The page appears at `https://<user>.github.io/<repo>/`.
4. On a free GitHub account the repository and page must be **public**. Private Pages need GitHub Enterprise.

## How it behaves outside Claude

| Feature | Behaviour on GitLab / GitHub |
|---|---|
| Calculations, auto design, drawings | Identical |
| PDF / Excel download | Normal browser download |
| Import requirement sheet (.xlsx) | Identical |
| Saved designs | Stored in **each person's own browser** (localStorage), not shared |
| Sharing a design with someone else | Use **Export designs (.json)** or the downloaded Excel (it has an *Inputs* sheet); the other person loads it with **Load design file** |
| Internet needed | Yes, once per visit, for the PDF/Excel libraries (jsDelivr) and fonts (Google Fonts) |

Real-time sharing, where one person saves and everyone else sees it instantly, needs a small backend such as a Supabase or Firebase table. The saved-designs code is in one block (search `Saved designs`), so that is where it would be connected.

## What you can edit

Open `index.html` in any editor, search for the text shown, change it, then commit. Line numbers are approximate and move as you edit, so the search text is the reliable reference.

### Rectangular core (LV/LV)

| What | Search for | Notes |
|---|---|---|
| Core-loss table W/kg vs B (CRNO-35, M4-27, MOH-23) | `RC.CORELOSS=` (~line 611) | From the CORELOSS sheet. Add a grade by adding a list of the same length and an `<option>` in the *Core grade* select |
| VA/kg table for no-load current | `RC.VAKG=` (~615) | From the VA sheet |
| Conductor data: conductivity at 90/115 °C, density, stray factor | `RC.COND=` (~616) | Cu 44.7 / 42.76, Al 28 / 26.73 |
| Lamination widths tried by auto design | `RC.LAM=` (~618) | Standard core widths, mm |
| Main calculation (CAL1 logic) | `function rectDesign` (~636) | Each block is commented: V/t, core, windings, build-up, resistance, stray, impedance, core loss, NL current, thermal, mechanical, BOM |
| Temperature-rise rule | `const rise1=15` (~706) | Inner `15 + W/m²/5`, outer `15 + W/m²/7` |
| Auto-design search | `function rectAuto` (~759) | K range (`const Ks=`), winding length range (`for(let Lt=100`), scoring weights (`s+=` lines) |
| Engine defaults (clearances, factors, insulation) | `const RC_DEFAULTS=` (~792) | Also settable from the form |
| Built-in requirement rows | `const REQ_DEFAULT=` (~1001) | The TRX 70 kVA sheet; replaced when you import one |
| Form defaults, prices, designer names | `const RBASE=` (~1016) | Prices `pCore`, `pCond` and the rest; party, designed/approved by |
| Preset buttons (70 kVA sheet, auto 70) | `const RPRESETS=` (~1019) | **Add your own designs here** (see below) |
| Compliance wording | `function compRows` (~1105) | "Offered" text for each requirement row |
| Step-by-step text | `function rSteps` (~1123) | Wording of each calculation step |

**Adding a permanent preset button**, for example your 8 kVA design:
1. In the page, enter the design and press **Download Excel**. Open its **Inputs** sheet: it lists every field name and value.
2. In `index.html`, add an entry to `RPRESETS`, for example
   `kva8:{...RBASE, kVA:8, priV:433, secV:400, K:79, W:50, hvType:'round', hvB:2.5, hvRad:1, hvAx:1, N2:104, hvLayers:2, roundLen:'0', ... },`
3. Add a button next to the others: `<button class="btn sm" data-rpreset="kva8">8 kVA</button>` (search `data-rpreset="auto70"`).

### Round stepped core (distribution)

| What | Search for |
|---|---|
| Core-loss tables by grade | `CORE_GRADES = {` (~378) |
| Temperature-rise limits by class | `const CLASS_RISE` (~383) |
| Clearances and test voltages by HV class | `function hvClass` (~390) |
| Main 45-step calculation | `function design(p)` (~413) |
| Auto optimiser (window height, ducts) | `function designAuto` (~577) |
| Reference presets (500 / 600 / 1600 kVA) | `const PRESETS=` (~808) |

### Look and text
- Colours and fonts are at the top of the `<style>` block (`:root{ --bg: … }`).
- Page title and intro are in `<header class="top">`.

## Checking a change

1. Open `index.html` locally in a browser before committing.
2. Press **70 kVA — your design sheet**. It should still show impedance 2.91 %, core loss 268 W, load loss 1,384 W and total mass 298 kg, matching the CAL1 sheet.
3. For the round core, **500 kVA Cu ref.** should give core Ø219 mm, core loss 1,537 W and 1,750 × 830 mm enclosure.
4. If those still match, commit. The pipeline redeploys in about a minute.
