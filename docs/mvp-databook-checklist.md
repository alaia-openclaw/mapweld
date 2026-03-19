# MVP Databook — Tracked Implementation Checklist

This checklist tracks the minimum feature set required to ship a first production MVP that can generate a complete databook PDF package from project data + uploaded documents.

---

## Tracking rules

- Status values: `todo` | `in_progress` | `blocked` | `done`
- Update only one row owner/status at a time when actively implemented.
- Every completed task must include:
  - Code merged to `cursor/overall-system-enhancements-c021`
  - Basic validation evidence (manual + lint/build where relevant)
  - Data migration impact reviewed

---

## MVP definition of done

`Generate Databook` produces a **single merged PDF** containing:

1. ITP (uploaded PDF, for now)
2. Summary of drawings + systems + lines (generated)
3. As-built drawings with weld overlays + drawing summary (generated)
4. Weld map (generated PDF table from weld data)
5. Visual & dimensional fit-up report (generated PDF, all welds)
6. Welder qualification (WQR PDFs linked to welders)
7. WPS PDFs linked to WPS references
8. Material certificate reconciliation output + linked MTC PDFs
9. NDT report section (generated + attachments)
10. NDT qualification (uploaded PDF)
11. NDT calibration (uploaded PDF)
12. Painting report (uploaded PDF)
13. Final release note / QC approval (uploaded PDF)

---

## Dependency map (high level)

- `FND-*` (foundation) blocks all generation and attachment work.
- `GEN-*` (generated sections) depends on `FND-*`.
- `DOC-*` (uploaded sections + linking) depends on `FND-*`.
- `MTC-*` depends on `FND-*` and `DOC-*`.
- `ASM-*` (assembly/export) depends on `GEN-*` + `DOC-*` + `MTC-*`.

---

## Master checklist

| ID | Phase | Task | Depends on | Status | Notes |
|---|---|---|---|---|---|
| FND-001 | Foundation | Add project schema v5 for databook docs/sections config | - | todo | Add migration from v4 in `lib/project-file.js` |
| FND-002 | Foundation | Implement unified document vault model (`documents[]`) | FND-001 | todo | Store PDF metadata + base64 payload |
| FND-003 | Foundation | Build generic PDF upload/list/remove component | FND-002 | todo | Reuse for ITP/NDT/Painting/Final release |
| FND-004 | Foundation | Create databook section manifest + validators | FND-001 | todo | Single source of truth for order/required sections |
| FND-005 | Foundation | Add Databook Builder screen (section order + readiness) | FND-004 | todo | Include required/missing indicators |
| FND-006 | Foundation | Persist databook config in project save/load/session | FND-001, FND-004 | todo | Ensure backward compatibility |
| GEN-001 | Generated | Generate project summary PDF (drawings/systems/lines) | FND-004 | todo | Include revision and counts |
| GEN-002 | Generated | Generate as-built drawing pages with overlays | FND-004 | todo | Support multi-drawing projects |
| GEN-003 | Generated | Add drawing list summary page for as-built section | GEN-002 | todo | Include drawing id/name/revision/linked lines |
| GEN-004 | Generated | Generate weld map PDF from existing weld export rows | FND-004 | todo | Align columns with Excel export |
| GEN-005 | Generated | Generate visual & dimensional fit-up report PDF | FND-004 | todo | One report containing all welds for MVP |
| DOC-001 | Uploaded docs | ITP upload slot (PDF) | FND-003, FND-004 | todo | For now uploaded-only section |
| DOC-002 | Uploaded docs | Extend welder/WQR model with WQR PDF attachment link | FND-002 | todo | Link per WQR entry |
| DOC-003 | Uploaded docs | Add WPS registry model + PDF attachment links | FND-002 | todo | WPS selection usable in weld forms |
| DOC-004 | Uploaded docs | NDT qualification upload slot | FND-003, FND-004 | todo | Uploaded PDF section |
| DOC-005 | Uploaded docs | NDT calibration upload slot | FND-003, FND-004 | todo | Uploaded PDF section |
| DOC-006 | Uploaded docs | Painting report upload slot | FND-003, FND-004 | todo | Uploaded PDF section |
| DOC-007 | Uploaded docs | Final release/QC approval upload slot | FND-003, FND-004 | todo | Uploaded PDF section |
| MTC-001 | Material | Add heat-number-centric certificate model | FND-002 | todo | `materialCertificates[]` with links to parts |
| MTC-002 | Material | Build MTC reconciliation page (two-way workflow) | MTC-001, FND-005 | todo | Upload->assign and part->assign workflows |
| MTC-003 | Material | Add unresolved heat-number validation checks | MTC-002, FND-004 | todo | Gate final databook generation |
| MTC-004 | Material | Generate material certificate summary page | MTC-002 | todo | Heat number -> part numbers -> cert file |
| NDT-001 | NDT | Generate NDT report section summary page | FND-004 | todo | Include request/report status matrix |
| NDT-002 | NDT | Include NDT report attachments in final databook | NDT-001, ASM-001 | todo | Append linked files after summary page |
| ASM-001 | Assembly | Implement PDF merge pipeline for section outputs | GEN-001, DOC-001 | todo | Merge generated + uploaded PDFs |
| ASM-002 | Assembly | Implement final ordered section composition | ASM-001, FND-004 | todo | Match databook canonical sequence |
| ASM-003 | Assembly | Add `Generate Databook` action + download UX | ASM-002 | todo | Disable when required sections missing |
| ASM-004 | Assembly | Add preflight validator modal (missing docs/data) | ASM-002, MTC-003 | todo | Clear actionable errors/warnings |
| QLT-001 | QA | Golden sample project + expected databook structure | ASM-003 | todo | Manual baseline for regression checks |
| QLT-002 | QA | Verify save/load roundtrip keeps all attachments | FND-006, ASM-003 | todo | Include session draft restore scenario |
| QLT-003 | QA | Verify lint/build and no critical console/runtime errors | ASM-003 | todo | Final ship gate |

---

## Suggested execution sequence

1. **Foundation**: FND-001 → FND-006  
2. **Generated sections**: GEN-001 → GEN-005  
3. **Uploaded docs**: DOC-001 → DOC-007  
4. **Material cert workflow**: MTC-001 → MTC-004  
5. **NDT section completion**: NDT-001 → NDT-002  
6. **Assembly/export**: ASM-001 → ASM-004  
7. **QA ship gate**: QLT-001 → QLT-003

---

## Release gate checklist (must be all true)

- [ ] All required section validators pass with no blocking error
- [ ] Databook generated as one merged PDF in canonical order
- [ ] Roundtrip save/load preserves all linked PDFs and metadata
- [ ] Material certificate reconciliation has no unresolved required heat numbers
- [ ] Lint/build pass on release branch

