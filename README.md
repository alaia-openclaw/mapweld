# Weld Dashboard MVP

A minimal weld tracking app: load a PDF drawing, add weld points by clicking on it, capture weld info (welder, date, parts), and export to Excel. **No server database** — state stays in the browser and in `.weldproject` files.

## Data & persistence

| Mechanism | Purpose |
|-----------|---------|
| **`.weldproject` file** | Full project export/import (PDFs + welds + metadata). Use **Save project** regularly. |
| **IndexedDB** | When a project has an id, saves are mirrored locally so **Projects** can reopen recent work. |
| **sessionStorage** | Auto-draft while you work (survives refresh in the same tab; cleared when the tab closes). |
| **Memory** | Active session until you close the tab or clear site data. |

If the browser blocks storage or hits quota, the app shows a warning; your downloaded `.weldproject` is still the source of truth.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. **Load PDF** – Upload a PDF drawing
2. **Add weld points** – Click on the drawing where welds are located
3. **Edit weld info** – Click a weld marker to open the form (welder name, date, part numbers)
4. **Save Project** – Downloads a `.weldproject` file (PDF + welds)
5. **Load Project** – Upload a `.weldproject` file to restore your session
6. **Export Excel** – Export weld data to `.xlsx`

## Run Locally (Production)

```bash
npm run build
npm start
```

Serves on port 3000 by default. Use `npm start -- -p 3001` for a different port.
