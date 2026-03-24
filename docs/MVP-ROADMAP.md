# MapWeld — MVP roadmap (markup & traceability)

**Commercial v1 focus:** structured weld traceability on PDF isometrics — markers, project data, export, and quality checks — running **fully client-side** (no server database). See [`lib/project-file.js`](../lib/project-file.js) for `PROJECT_FILE_VERSION`.

**Related:** product usage in [README.md](../README.md); AI/agent notes in [AGENTS.md](../AGENTS.md). This file is the **ship plan**; [ARCHITECTURE.md](./ARCHITECTURE.md) is the technical reference.

---

## 1. Product scope (v1)

| Area | In scope |
|------|------------|
| **Markup** | Edition vs Inspection; tools for weld, spool, part, and line markers on PDF pages (`components/MarkupToolbar.jsx`); select + drag handles on markers. |
| **Traceability** | Welds linked to drawings/spools/lines/systems; WPS resolution (weld → line → system); NDT requirements and selection (`lib/ndt-resolution.js`, `lib/weld-utils.js`). |
| **Project** | Load/save `.weldproject`; IndexedDB + session draft; project setup hub and wizard (`ProjectSetupHub`, `ProjectSetupWizard`). |
| **Outputs** | Excel weld register export (`lib/excel-export.js`); print modal; optional dashboard/analytics views. |
| **Quality** | Project health panel (`lib/project-health.js`); NDT workflow UI (`NdtKanbanPage`), status views. |
| **Settings** | Unified settings modal (`ModalParameters` / `ModalSettings`): personnel, NDT & spec, libraries, drawings, systems & lines, spools when applicable. |

---

## 2. Explicitly later / out of v1 commercial story

These may exist in code as **foundations** but are **not** required to sell v1:

- **Full databook compilation** — single merged PDF package (ITP, MTC reconciliation, section merge pipeline, etc.). See `lib/databook-pdf.js` / `lib/databook-sections.js` as non-blocking for traceability MVP.
- **Backend auth, multi-user sync, company-wide server** — product remains client-only unless explicitly replanned.

---

## 3. Current baseline (grounded in code)

- **Workspace:** [`app/app/page.jsx`](../app/app/page.jsx) — PDF viewer, marker state, side panels (drawings, lines, spools, welds, parts).
- **Persistence:** save/load project file, offline storage id, session draft.
- **Catalog:** separate routes under `/catalog` (optional module for demos and part picking).
- **Landing:** marketing site at `/` (see `app/page.jsx`).

---

## 4. Phased roadmap

Use checkboxes as you execute; add dates in the right column when known.

### Phase A — Ship (sellable v1)

| Item | Status | Notes / owner |
|------|--------|----------------|
| `npm run lint` + `npm run build` clean | ☐ | CI or pre-release gate |
| Manual QA: save/reload `.weldproject` with embedded PDFs | ☐ | Avoid blob-only drawing refs after reload |
| Manual QA: Excel export matches expected columns for one real project | ☐ | Spot-check WPS, line, spool, NDT columns |
| Manual QA: Health panel on a messy project | ☐ | No false sense of “green” — document known gaps |
| Production smoke: PWA/offline banner if applicable | ☐ | See AGENTS.md |
| Browser support statement (e.g. “last 2 Chrome/Edge”) | ☐ | Docs or site |

### Phase B — Harden

| Item | Status | Notes |
|------|--------|--------|
| Large-PDF performance pass | ☐ | Scroll/zoom + marker interaction |
| Mobile/tablet usability on `/app` | ☐ | Bottom sheet + toolbar |
| Copy/deep-link strategy for support | ☐ | e.g. export project + version string |

### Phase C — Grow

| Item | Status | Notes |
|------|--------|--------|
| Part catalog distribution story | ☐ | Images / `3CQC ref` optional |
| Databook or handover package (if product pivot) | ☐ | Separate milestone |

---

## 5. Release criteria (minimum)

1. **Build:** `npm run build` succeeds; no critical console errors on happy path.
2. **Data:** User can restore work via `.weldproject` after a **Save project**; no silent data loss on refresh when session draft works.
3. **Export:** Excel opens in Excel/LibreOffice with expected headers and row counts for a test project.
4. **Truth in marketing:** Landing and README claims match what works (no promised server feature).

---

## 6. Open questions (fill in for scheduling)

1. **Primary customer:** fab shop / QC / EPC / other — who is the first paid user?
2. **NDT Kanban / Status:** must ship in v1 or acceptable as “advanced”?
3. **Catalog (`/catalog`):** part of v1 SKU or companion?
4. **Distribution:** hosted URL only vs. air-gapped/offline install story?
5. **Licensing:** free beta vs. paid — alignment with terms on `/terms`?
6. **Target date** for “sellable v1” and definition of **done** (hours of QA, pilot customer, etc.).

---

## 7. Promotional video (future asset)

Use this as a **shot list** and **narrative spine**; not a script word-for-word.

### 7.1 Core message (30–90 s)

- **Hero line:** Weld data lives **on the isometric**, not in a spreadsheet that drifts.
- **Differentiators:** No install/login for core use; works in the browser; **Save project** file portable; Excel when the office needs it.
- **CTA:** Try MapWeld / open `/app` / save your first `.weldproject`.

### 7.2 Tone & look

- **Visual:** Real PDF isometric (blur or anonymize customer drawings); clear markers; calm industrial palette (match site).
- **Pacing:** Problem (2–3 s) → MapWeld (markup + form) 15–25 s → export/health 10–15 s → CTA 5 s.
- **Avoid:** Promising databook-in-one-PDF unless that feature is shipped and named.

### 7.3 Shot list (B-roll)

| # | Shot | Audio / overlay |
|---|------|------------------|
| 1 | Landing or logo → `/app` | “You’re still using spreadsheets next to the drawing.” |
| 2 | Load PDF | “Load your isometric.” |
| 3 | Markup toolbar: add weld, place marker | “Click to place welds — structured data, not ink.” |
| 4 | Side panel: weld form — WPS, welder, NDT | “WPS and traceability fields follow the weld.” |
| 5 | Edition → Inspection toggle | “Lock the map when you’re only reviewing.” |
| 6 | Save project / file download | “Everything in one `.weldproject` file.” |
| 7 | Export Excel | “Export a register for the office.” |
| 8 | Health panel (optional) | “Catch missing links before turnover.” |
| 9 | CTA | URL + tagline |

### 7.4 Formats

| Format | Length | Use |
|--------|--------|-----|
| **Hero** | 15–30 s | Social, ads, landing autoplay |
| **Explainer** | 60–90 s | Website, YouTube |
| **Tutorial** | 3–8 min | See §9 below |

---

## 8. Live demo (future runbook)

**Goal:** Repeatable 5–10 minute demo without a live customer drawing.

### 8.1 Prep

- [ ] Browser: Chrome or Edge, latest; clear unrelated tabs.
- [ ] **Sample project:** One anonymized `.weldproject` with a small PDF (2–5 pages), ~10 welds, 2 spools, 1–2 lines — **pre-saved** and tested same day.
- [ ] **Fallback:** If network fails, demo offline after first load (PWA prod build).
- [ ] Close notifications; hide desktop clutter; 1080p or higher for screen share.

### 8.2 Demo flow (happy path)

1. Open `/` → one sentence value prop → **Open app** (`/app`).
2. **Load project** (sample) *or* New project wizard → Load PDF.
3. **Edition mode:** Add weld → show form → mention WPS/NDT.
4. **Inspection mode:** lock → click weld (read-only positions).
5. **Save project** (show download).
6. **Export Excel** (open file briefly).
7. **Health** (one intentional finding if sample has it, or explain what it checks).
8. **Q&A** — tie back to “single source of truth on the drawing.”

### 8.3 Pitfalls to avoid

- Using a **huge** PDF (slow first paint).
- **Blob-only** drawings after reload — always use embedded PDF in saved project for demos.
- Going into **Settings** too deep unless the audience is power users.

---

## 9. Tutorial (future content outline)

**Audience:** First-time user on the shop floor or in QA.

| Lesson | Topic | Outcome |
|--------|--------|---------|
| 1 | Start: hub vs. resume | User opens `/app` and picks a path (new / open / saved). |
| 2 | Load PDF | Drawing appears; page thumbnails if multi-page. |
| 3 | Markup tools | Weld vs spool vs part vs line; Edition vs Inspection. |
| 4 | First weld | Minimum fields: identity, line/spool link, WPS if required. |
| 5 | Systems & lines | Link drawing to line; why it matters for NDT/export. |
| 6 | Save project | `.weldproject` as backup; when to save. |
| 7 | Export Excel | Who consumes the file; column tips. |
| 8 | Health | What “red” means; fix vs. ignore. |
| 9 | NDT (optional) | Kanban / status at high level only. |

**Formats:** short GIFs or Loom per lesson; optional single long “desk recording” for YouTube.

**Docs link:** Keep [README.md](../README.md) steps in sync with lesson 1–7; this roadmap holds the **curriculum** and **video** planning.

---

## 10. Revision history

| Date | Change |
|------|--------|
| 2026-03-22 | Initial roadmap; replaced databook-only MVP checklist; added video/demo/tutorial sections. |
