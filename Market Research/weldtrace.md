# Competitor deep-dive — WeldTrace

URL: https://www.weldtrace.com/

## What they sell (positioning)
- “Total welding project or job management” / “welding management ERP software”.
- Strong emphasis on **end-to-end lifecycle** + compliance + turnover packs.

## Key workflow modules (from public pages)
Source (features): https://www.weldtrace.com/weldmap_features
- **Weld mapping on drawings:** load drawings, create weld maps, generate welds from weld maps.
- **WPS / PQR authoring + libraries:** guided WPS/PQR creation, code checks, databases; supports ASME IX, AWS D1.1, API 1104, ISO 15614-1.
- **Welder qualifications + continuity:** WPQ/WQTR generation, continuity tracked; expiring qual warning emails.
- **Project QA/QC:** NDE requirements, visual inspection by stage, defects, pressure tests, PWHT.
- **Turnover/data book:** “Generate the turnover pack… with a few clicks.”
- **QR labels + mobile app:** print QR labels; scan/access weld data on mobile app.

## Key pages (for weekly monitoring)
- Overview/home: https://www.weldtrace.com/
- Features: https://www.weldtrace.com/weldmap_features
- Contact: https://www.weldtrace.com/contact
- Pricing/Plans: https://www.weldtrace.com/pricing (returns 404 via web_fetch, but page content still references segments like SMB fabricators vs large EPC contractors)

## Pricing signals
- Public “pricing” endpoint exists but was returning 404 via web_fetch; content suggests **segmented packaging** (small/medium fabricators vs large EPC contractors) rather than transparent prices.

## How they win (hypothesis)
- “All-in-one” platform narrative: compliance + traceability + turnover packs + collaboration.
- Bundles multiple adjacent pains (WPS, quals, NDE, pressure tests, reporting).

## MapWeld implications
- MapWeld should keep leaning on **drawing-first, tablet-fast** capture + minimal setup.
- Clear contrast: **MapWeld = weld-map → structured register → export-ready packs** (without adopting a full welding ERP).
- If we face them in deals: expect “we do everything” → respond with “you’ll pay + implement everything; we remove the bottleneck at the drawing + evidence capture layer and export cleanly into your stack.”
