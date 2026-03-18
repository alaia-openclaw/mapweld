# MapWeld — Architecture Reference

> Living document. Updated as features are designed and implemented.

---

## 1. Vision

MapWeld is a fully client-side weld-traceability and fabrication-documentation app.
The long-term goal is to cover the full fabrication lifecycle:

1. **Project setup** — ITP, kick-off, drawing upload.
2. **Materials & personnel** — MTCs, WPS, WQR, welder/fitter management.
3. **Fabrication** — Weld mapping, spool tracking, part tracking.
4. **Inspection & testing** — NDT, pressure tests, heat treatment.
5. **Compilation** — Single PDF documentation package.

All data lives in the browser (IndexedDB, sessionStorage) and in `.weldproject` files.
There is no backend, no database, and no authentication.

---

## 2. Entity Hierarchy

```
Company (separate file — future)
├── Personnel (welders, fitters, QC)
├── WQR (Welder Qualification Records)
├── PQR (Procedure Qualification Records)
├── WPS (Welding Procedure Specifications)
├── General settings & templates
└── Project presets

Project (.weldproject file — runs independently or linked to Company)
├── Project metadata (name, client, spec, revision, date)
├── Project settings / ITP (inspection steps by category)
├── Systems
│   └── Lines (fluid, pressure, diameter, thickness, material)
│       └── Drawings (PDF, revision) — many-to-many with Lines
│           ├── Spools (dimensions, weight, pressure test, heat treatment)
│           │   ├── Welds (type, location, welder, electrode, WPS, NDT…)
│           │   └── Parts (type, NPS, thickness, material, heat number, MTC link)
│           ├── Spool markers (position on drawing)
│           ├── Part markers (position on drawing)
│           └── Weld markers (position on drawing)
├── NDT requests & reports
└── Documents (ITP, kick-off, MTC, WPS, WQR — future)
```

### Key relationships

| From | To | Cardinality | Notes |
|------|----|-------------|-------|
| System | Line | 1 → many | System groups lines by domain (fire, mud…) |
| Line | Drawing | many ↔ many | One line can span drawings; one drawing can hold multiple lines |
| Line | Spool | 1 → many | Optional — spools can exist without a line |
| Spool | Weld | 1 → many | Weld inherits line from spool |
| Spool | Part | 1 → many | Part inherits line from spool |
| Drawing | Weld/Spool/Part markers | 1 → many | Markers are positioned on a specific drawing |
| Welder | WQR | 1 → many | Future |
| WPS | WQR | many ↔ many | Future — WQR proves welder can weld per WPS |
| Part | MTC | many → 1 | Via heat number; future |

---

## 3. Data Model

### 3.1 Project file (`.weldproject`)

```
version: 4

Top-level keys:
  drawings[]          — PDF drawings (replaces single pdfFilename/pdfBase64)
  systems[]           — system groupings
  lines[]             — piping lines under systems
  weldPoints[]        — weld data (with drawingId)
  spools[]            — spool data (with lineId)
  spoolMarkers[]      — spool marker positions (with drawingId)
  parts[]             — part data
  partMarkers[]       — part marker positions (with drawingId)
  personnel           — { fitters[], welders[], wqrs[] }
  drawingSettings     — { ndtRequirements[], weldingSpec }
  addDefaults         — defaults bar state
  ndtRequests[]       — NDT request records
  ndtReports[]        — NDT report records
  projectSettings     — { steps[] } — ITP configuration
  projectMeta         — { projectName, client, spec, revision, date }
```

### 3.2 Entity shapes

#### Drawing

```javascript
{
  id: "dwg-...",
  filename: "P-001-ISO.pdf",
  pdfBase64: "...",          // base64-encoded PDF
  revision: "A",
  lineIds: ["line-1"],       // explicit line–drawing links
}
```

#### System

```javascript
{
  id: "sys-...",
  name: "Fire line",
  description: "",
}
```

#### Line

```javascript
{
  id: "line-...",
  systemId: "sys-...",       // parent system (optional)
  name: "Return line",
  fluidType: "",
  pressure: "",
  diameterRange: "",
  thickness: "",
  material: "",
  drawingIds: [],            // explicit drawing links (many-to-many)
}
```

#### Spool (existing + lineId)

```javascript
{
  id: "spool-...",
  lineId: null,              // optional link to line
  name: "",
  dimX: "", dimY: "", dimZ: "",
  weight: "",
  pressureTestValue: "",
  pressureTestUnit: "bar",
  lifecycleStage: "not_started",
}
```

#### Weld point (existing + drawingId)

```javascript
{
  id: "...",
  drawingId: "dwg-...",     // which drawing this weld is on
  spoolId: null,
  weldType: "butt",
  weldLocation: "shop",
  // ... all existing fields
}
```

#### Project settings (ITP)

```javascript
{
  steps: [
    {
      id: "step-...",
      category: "general",   // general | fitup | cuttings | welding | final_inspection
      label: "Visual inspection before welding",
      required: true,
      clientSignOff: false,
      requestInspection: false,
    },
  ],
}
```

#### Project metadata

```javascript
{
  projectName: "",
  client: "",
  spec: "",
  revision: "",
  date: "",
}
```

---

## 4. Navigation & UI Structure

### 4.1 App layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Toolbar: Load PDF / Open / Save / Excel / Print / Params / NDT / …    │
├──────┬──────────────────────────────────┬───────────────────────────────┤
│ Page │         PDF Viewer               │  Side panels (right)          │
│ thumb│  + Markup toolbar (edition mode) │  Drawings | Lines | Spools   │
│ nails│  + Defaults bar (add mode)       │  | Welds | Parts             │
│      │                                  │  (mutually exclusive expand)  │
└──────┴──────────────────────────────────┴───────────────────────────────┘
```

### 4.2 Side panels (right sidebar)

Five panels stacked vertically, mutually exclusive (only one expanded at a time):

| Panel | Component | Purpose |
|-------|-----------|---------|
| Drawings | `SidePanelDrawings.jsx` | List drawings, switch active, upload, revision, delete |
| Lines | `SidePanelLines.jsx` | Systems tree, lines under systems, line fields |
| Spools | `SidePanelSpools.jsx` | Spool list, dimensions, pressure test, line selector |
| Welds | `SidePanelWeldForm.jsx` | Weld list + detail form |
| Parts | `SidePanelPartForm.jsx` | Part list + detail form |

When all panels are collapsed the sidebar is 56px wide (icon headers).
When one panel is open the sidebar uses the user-resizable `sidePanelWidth`.

### 4.3 Mobile

Bottom sheet with tabs: Drawings | Lines | Spools | Welds | Parts.

### 4.4 Full-page views

- **Status / Progress** — weld & spool Kanban boards
- **NDT** — NDT request/report management
- **Catalog** — part catalog browser (separate route `/catalog`)

### 4.5 Settings (Parameters modal)

Tabs inside the Parameters modal:

| Tab | Content |
|-----|---------|
| Default NDT | NDT methods & percentages (existing) |
| Personnel | Fitters, welders, WQR (existing) |
| ITP | Inspection steps by category (new) |
| Project | Project metadata — name, client, spec (new) |

---

## 5. Document Types (Future)

| Type | Purpose | Linked to |
|------|---------|-----------|
| ITP | Inspection & test plan | Project |
| Kick-off minutes | Meeting record | Project |
| Isometric / drawing | Weld map PDF | Drawing entity |
| MTC | Material test certificate | Part (via heat number) |
| WPS | Welding procedure specification | Project, welds |
| WQR | Welder qualification record | Welder, WPS |
| NDT report | Inspection results | Welds |

Documents will be stored as blobs in IndexedDB with metadata in the project file.

---

## 6. ITP Configuration Model

ITP defines which fabrication/inspection steps are applicable to the project.

### Step categories

1. **General** — project-level checks (document review, material verification)
2. **Fit-up** — pre-weld fit-up inspection, client sign-off
3. **Cuttings** — cutting inspection, bevel checks
4. **Welding** — in-process welding checks, visual before/after
5. **Final inspection** — NDT, pressure test, heat treatment, final release

### Per-step configuration

- `label` — description of the step
- `required` — is this step mandatory?
- `clientSignOff` — does the client need to approve?
- `requestInspection` — must an inspection request be sent?

Steps can be added, removed, and reordered within each category.

---

## 7. PDF Package Output (Future)

Generated from project data, the package includes:

1. **Cover** — project name, client, spec, date, revision
2. **ITP summary** — steps by category, hold/witness/review points
3. **Drawing index** — list of drawings with thumbnails
4. **Weld map** — per-page weld locations and numbers
5. **Weld log** — tabular weld data (driven by ITP field visibility)
6. **Spool summary** — dimensions, pressure test, heat treatment
7. **Part / material tracking** — parts with heat numbers, MTC links
8. **NDT summary** — per-method selection and results
9. **Document index** — ITP, kick-off, MTCs, WPS, WQR
10. **Appendices** — personnel list, full NDT details

---

## 8. Implementation Phases

### Phase 1 — Multi-drawing support
- `drawings[]` array replaces single PDF
- `drawingId` on markers
- Side panel for drawing management
- Multi-file upload

### Phase 2 — Systems & Lines
- `systems[]` and `lines[]` in project data
- Side panel for system/line management
- `spool.lineId` linkage
- Line–drawing many-to-many links

### Phase 3 — ITP configuration
- `projectSettings.steps` in project data
- ITP tab in Parameters modal
- 5 category sections with step CRUD

### Phase 4 — Project metadata
- `projectMeta` in project data
- Project tab in Parameters modal

### Phase 5 — Document registry (future)
- `documents[]` in project data
- Upload/classify documents (ITP, kick-off, MTC, WPS, WQR)
- Blob storage in IndexedDB

### Phase 6 — Linking (future)
- MTC → Part (heat number)
- WQR → Welder
- WPS → WQR (many-to-many)

### Phase 7 — PDF package (future)
- Section builders for each package section
- Configurable output (which sections to include)
- Single combined PDF download

### Phase 8 — Company file (future)
- Separate `.weldcompany` file
- Personnel, WQR, PQR, WPS at company level
- Project presets and templates
- Link company file to project

---

## 9. Standards Alignment

| Standard aspect | Implementation |
|-----------------|----------------|
| Traceability | Weld → Parts (heat) → MTC; Weld → Welder → WQR |
| WPS / WQR | WPS defines procedure; WQR proves welder qualification |
| Hold / witness points | ITP steps with `clientSignOff` flag |
| MTC linkage | Part heat number → MTC document |
| NDT % | Drawing-level NDT % (shop/field) — already supported |

---

## 10. Technical Stack

| Area | Technology |
|------|------------|
| Framework | Next.js 14 (App Router) |
| UI | React 18, Tailwind CSS, DaisyUI |
| Storage | IndexedDB (idb), sessionStorage |
| PDF viewing | react-pdf, pdfjs-dist |
| PDF generation | html2canvas, print-utils (HTML → PDF) |
| Excel export | xlsx-js-style |
| File format | `.weldproject` (JSON) |
| Routing | `/` (landing), `/app` (main), `/catalog` (parts) |
