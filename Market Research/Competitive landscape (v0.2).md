# MapWeld – Competitive landscape (v0.3)

Date: 2026-03-14

Goal of this doc: make the landscape *actionable for GTM*: clearer buckets, who buys, how they sell, and what wedge MapWeld can own.

MapWeld wedge (working): **tablet-first ISO/PDF weld marking → structured weld/joint/spool register → export-ready turnover pack artifacts**.

---

## 0) “Top 5” competitors to track weekly (deep-dive shortlist)

### 1) WeldTrace — https://www.weldtrace.com/
- **Category:** end-to-end welding management (platform)
- **Key pages:**
  - Overview: https://www.weldtrace.com/
  - Features (weld mapping + platform modules): https://www.weldtrace.com/weldmap_features
  - Contact: https://www.weldtrace.com/contact
  - Pricing/Plans: https://www.weldtrace.com/pricing *(endpoint exists; returned 404 via web_fetch but still contained plan/segment copy)*
- **What they emphasize (public copy):** “welding ERP” with WPS/PQR authoring, welder qualifications/continuity, drawings + weld maps, NDE modules, pressure testing/PWHT, QR labels, mobile apps, and **turnover/data book packs**.
- **How they sell:** “everything platform” + compliance/traceability narrative.
- **Implication for MapWeld:** win on **speed + simplicity** and being **drawing-first** (capture workflow) vs “ERP for welding”.

### 2) WeldEye (Kemppi) — https://www.weldeye.com/
- **Category:** welding production + quality management (modular)
- **Key pages:**
  - Overview: https://www.weldeye.com/
  - Pricing: https://www.weldeye.com/pricing
  - Quality Management (module detail): https://www.weldeye.com/solutions/quality-management
  - Contact: https://www.weldeye.com/contact-us
- **What they emphasize:** standards compliance (ISO/ASME/AWS), parameter capture (voltage/current/etc.), heat input calculations, deviation alerts, traceability “down to individual welds”.
- **Pricing signal (public):** mix of fixed-price modules + request-pricing modules.
  - ArcVision €490/yr; Welding Procedures €1290/yr; Welding Procedures+Qualifications €89/mo/user (also shows €2990 one-time licence); Quality Management request pricing.
- **Implication for MapWeld:** they’re *welding-process-data-platform-first* (equipment/process/quality). MapWeld can be the **fastest “iso → weld map → register → pack” tool** without needing a full welding ecosystem.

### 3) PipeCloud — https://pipecloud.fi/
- **Category:** pipe prefabrication MES / production management (outcome competitor)
- **Key pages:**
  - Overview: https://pipecloud.fi/
  - FAQ (ICP + pricing model signals): https://pipecloud.fi/faq/
  - Welding traceability feature page: https://pipecloud.fi/features/welding-traceability/
  - Contacts / book demo: https://pipecloud.fi/contacts/
- **What they emphasize:** automation + capacity planning + shopfloor execution + quantified outcomes; includes **digital weld traceability** inside a broader prefabrication system.
- **Pricing model (per FAQ):** quote-based, based on **feature package + number of user licenses**.
- **Implication for MapWeld:** when prospects want a full MES, MapWeld loses. Position MapWeld as the **lightweight weld-map + turnover layer** that can run alongside ERP/MES.

### 4) Weldy (OnCore S&T) — http://www.oncore.co.kr/eng/weldy/
- **Category:** ISO-driven weld mapping + joint/spool numbering (direct-ish; enterprise/project licensing)
- **Key page:** http://www.oncore.co.kr/eng/weldy/
- **Public signal:** page is mostly project references; repeatedly mentions “Welding map”, “Weldy S/W Site License / Project License”, and at least one explicit item: **“Joint & Spool No. Generation”**.
- **Pricing/contact:** no public pricing found; likely enterprise / licensed / customized.
- **Implication for MapWeld:** validate demand for **assisted tagging/extraction** and joint/spool numbering as a killer feature.

### 5) Weldmap Pro — https://weldmappro.com/
- **Category:** lightweight weld mapping on ISO PDFs (direct)
- **Public signal (metadata):** positioned as **“completely free”**; focused on QC inspectors; explicitly mentions adding mappings like **shop joints, field joints, spool numbers, pipe supports, flange joints**.
- **Contact route:** email string present in site JS bundle: **info@weldmappro.com**.
- **Implication for MapWeld:** the “free alternative” objection.
  - Counter: MapWeld is not just markup — it produces **structured data + QA workflow + export-ready packs** (and can own accountability for completeness).

---

## 1) Landscape buckets (normalized)

### A) Direct: weld mapping on drawings (PDF/isometrics)
**Buyer:** QC inspector / welding coordinator / fabrication QC manager
- WeldTrace — https://www.weldtrace.com/
- Weldmap Pro — https://weldmappro.com/
- Weldy — http://www.oncore.co.kr/eng/weldy/
- Smart Welding Manager (legacy / folded into WeldTrace) — https://www.smartweldingmanager.com/

**What these tools teach us:** the core job is *“turn an iso into a weld map + status + evidence trail”*. The UX battle is on **tablet speed**, not dashboards.

### B) Substitute: generic PDF + drawing workflows
**Buyer:** field engineer / doc control / construction PM
- Bluebeam — https://www.bluebeam.com/
- Drawboard — https://www.drawboard.com/
- Acrobat — https://www.adobe.com/acrobat.html
- Autodesk Build — https://construction.autodesk.com/
- Procore — https://www.procore.com/
- Fieldwire — https://www.fieldwire.com/

**MapWeld angle:** “You’re already marking PDFs — MapWeld keeps the *data* and makes turnover packs automatic.”

### C) Outcome competitors: pipe prefabrication / spool tracking suites
**Buyer:** production manager / planning / operations
- PipeCloud — https://pipecloud.fi/
- SpoolFab — https://www.spoolfab.com/
- PypeServer — https://pypeserver.com/
- SPOOLCAD — https://spoolcad.com/product/
- EPCPROMAN (SpoolMan/ErMan) — https://epcproman.com/products/epcproman-suite-epc-project-management-control-software/spoolman-erman-pipe-spool-fabrication-erection-software/

**MapWeld angle:** “We’re not replacing your MES. We’re making weld evidence + pack readiness reliable.”

### D) Welding/QC enterprise platforms (traceability + compliance)
**Buyer:** QA leadership / engineering manager
- WeldEye — https://www.weldeye.com/
- TWI Welding Coordinator — https://www.twisoftware.com/software/welding-software/welding-coordinator/
- Prometheus Group (Weld-Console) — https://www.prometheusgroup.com/solutions/weld-fabrication-inspection-management-software
- Pinnacle MatriX traceability — https://matrixbypinnacle.com/products/welding-traceability
- Codeware Shopfloor — https://www.codeware.com/products/shopfloor/

**MapWeld angle:** “Bring-your-own QMS: MapWeld captures weld-map data at source and exports cleanly into your existing system.”

### E) Big-bucket displacers (BIM-to-fab / enterprise suites)
**Buyer:** digital transformation / enterprise PMO
- Stratus — https://www.stratus.build/stratus
- Autodesk/Trimble/Hexagon/Bentley ecosystems

---

## 2) What changed vs v0.2 (new patterns)
1) **PipeCloud frames traceability as “root-cause + blast-radius control”** (welder/filler batch/heat number → find all affected welds). That’s strong copy for MapWeld.
2) **PipeCloud explicitly integrates with WeldEye** (Kemppi) → the “stack” reality: buyers assemble systems.
3) **Free competitor is real** (Weldmap Pro) and “free + easy” is explicit in public metadata.

## 3) Suggested MapWeld positioning tweak (minor)
Keep the existing wedge but add the “blast radius” framing:

> **“The fastest way to turn an isometric PDF into a structured weld map and turnover-ready register — on a tablet — and instantly trace what else is at risk when something fails.”**

…and keep the enterprise-compat line:

> “Exports cleanly to your existing QA/QC / MES / ERP — no rip-and-replace.”
