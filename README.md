# Weld Dashboard MVP

A minimal weld tracking app: load a PDF drawing, add weld points by clicking on it, capture weld info (welder, date, parts), and export to Excel. No database – all state is in memory; save to a `.weldproject` file to continue later.

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
