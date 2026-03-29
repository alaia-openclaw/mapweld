# AGENTS.md

## Cursor Cloud specific instructions

### Overview

MapWeld is a weld traceability web app built with Next.js 14 (App Router), React 18, Tailwind CSS, and DaisyUI. **Project data** stays in the browser (IndexedDB / sessionStorage) and in `.weldproject` files. **Accounts** use **NextAuth v5** ([`auth.js`](auth.js): email/password + optional Google), MongoDB for users, optional Resend for welcome email — see `.env.example`. Route handlers are re-exported from [`app/api/auth/[...nextauth]/route.js`](app/api/auth/[...nextauth]/route.js).

**Commercial MVP scope and ship plan:** [docs/MVP-ROADMAP.md](docs/MVP-ROADMAP.md). **Architecture reference:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### Markup / workspace UI

- **`MarkupToolbar`** ([`components/MarkupToolbar.jsx`](components/MarkupToolbar.jsx)): **Edition** vs **Inspection** (lock); tools **Weld** (add), **Select** (move markers), **Spool**, **Part**, **Line** — wired from [`app/app/page.jsx`](app/app/page.jsx) (`appMode`, `markupTool`).
- **Auth / export:** Sign in via [`app/login/page.jsx`](app/login/page.jsx) (and [`app/register/page.jsx`](app/register/page.jsx)). **Export** (toolbar and Excel / drawing export handlers) requires an authenticated session; other workspace features work while signed out.
- **Settings** modal: `ModalSettings` in [`components/ModalParameters.jsx`](components/ModalParameters.jsx) (left section tree).

### Services

| Service | Command | Port | Notes |
|---|---|---|---|
| Next.js dev server | `npm run dev` | 3000 | Primary dev server |
| MongoDB | Atlas or local | — | Required for sign-in / register (set `MONGODB_URI`) |
| Resend | (API) | — | Optional; `RESEND_API_KEY` + `EMAIL_FROM` for welcome email |

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
- **Auth env:** copy `.env.example` to `.env.local` and set at least `MONGODB_URI`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` for login and **export** on `/app`. Without them, the workspace still loads but export stays gated and auth API routes will error.
- If **IndexedDB** or **sessionStorage** fails (private mode, quota), the UI shows a dismissible warning; **Save project** (`.weldproject`) remains reliable.
- **Settings** (toolbar **Settings**, component `ModalSettings` in `components/ModalParameters.jsx`) replaces the old Parameters modal: left-hand section tree (project NDT & spec, personnel, project info & libraries, and when a PDF is loaded — drawings, systems & lines, spools). NDT sampling uses **project → system → line** resolution when `NdtScopeProvider` (`contexts/NdtScopeContext.jsx`) supplies systems/lines/spools (`lib/ndt-resolution.js`, `computeNdtSelection` in `lib/weld-utils.js`). Optional **`ndtRequirements`** arrays on each **system** and **line** (same shape as project: method + shop/field %) **merge per method** with project defaults; line overrides system. UI: project table in **Project NDT & spec**; compact override tables on each system (Project info) and each line (Lines panel / Settings → Systems & lines). Shared editor: `components/NdtRequirementsOverrideTable.jsx` + `lib/ndt-requirements-rows.js`. **WPS** can be set on each **system** and **line** (`wps` field); effective code for a weld is **weld → line → system** (`lib/wps-resolution.js`, used by `getWeldSectionCompletion` / export when scope is passed).
- **`.weldproject` version** is `PROJECT_FILE_VERSION` in [`lib/project-file.js`](lib/project-file.js) (currently **v6**). Weld `jointDimensions` (NPS/schedule per side, part inheritance) are normalized via [`lib/joint-dimensions.js`](lib/joint-dimensions.js) on load/save.
- **Part catalog UX:** `components/CatalogHierarchyStepSelects.jsx` + `lib/catalog-category-labels.js` share cascading catalog steps between the part form and add-defaults bar; wall/step labels differ for pipe vs flanges.
- **Project health** (toolbar **Health** when a PDF is loaded) runs pure checks in `lib/project-health.js` over the in-memory snapshot (drawings/PDFs, lines, welds, spools, parts, library links, NDT). It is display-only — no auto-fix.
- **First visit to `/app`** without a restorable session draft (no embedded PDF in session): **`ProjectSetupHub`** offers open file / saved projects / **New project** wizard (`ProjectSetupWizard.jsx`: identity → personnel → NDT & spec → systems → WPS). Session draft with PDF still restores straight into the workspace (no forced hub).
