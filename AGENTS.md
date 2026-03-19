# AGENTS.md

## Cursor Cloud specific instructions

### Overview

MapWeld is a fully client-side weld traceability web app built with Next.js 14 (App Router), React 18, Tailwind CSS, and DaisyUI. There is **no database, no authentication, and no external services** — all state lives in the browser (IndexedDB / sessionStorage) and in `.weldproject` files.

### Services

| Service | Command | Port | Notes |
|---|---|---|---|
| Next.js dev server | `npm run dev` | 3000 | The only service needed |

### Running

- **Dev server:** `npm run dev` — starts on http://localhost:3000
- **Lint:** `npm run lint` (ESLint via `next lint`)
- **Build:** `npm run build`
- See `README.md` for full usage instructions.

### Non-obvious caveats

- The `postinstall` script (`node scripts/copy-worker.cjs`) copies the PDF.js worker file to `public/`. If `node_modules` is cleared without running `npm install`, PDF rendering will break.
- The `/api/pipedata-image` route serves images from a gitignored `3CQC ref/` folder. The app works fine without this folder; flange catalog images will simply return 404.
- PWA service worker is only active in production builds; in dev mode it is disabled.
- The app page (`/app`) is a large client-side bundle (~670 kB First Load JS). Hot reload works but may take a moment on first load.
- No `.env` file is needed — no environment variables are required.
- If **IndexedDB** or **sessionStorage** fails (private mode, quota), the UI shows a dismissible warning; **Save project** (`.weldproject`) remains reliable.
- **Project health** (toolbar **Health** when a PDF is loaded) runs pure checks in `lib/project-health.js` over the in-memory snapshot (drawings/PDFs, lines, welds, spools, parts, library links, NDT). It is display-only — no auto-fix.
