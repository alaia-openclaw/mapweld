---
name: Edition and Inspection mode with drag markers
overview: Replace button-based marker repositioning with an Edition/Inspection mode switch. Edition mode gets an Adobe Acrobat-style markup toolbar and direct drag-and-drop for weld points and indicator bubbles. Inspection mode is read-only for positions but allows opening welds to update info.
todos:
  - id: mode-switch
    content: Add appMode state (edition|inspection) and mode switch UI
    status: pending
  - id: markup-toolbar
    content: Create Edition toolbar with Add weld and Select tools (Adobe Acrobat style)
    status: pending
  - id: drag-handles
    content: Add draggable handles on weld point and indicator when selected in Edition mode
    status: pending
  - id: drag-logic
    content: Implement drag handlers to update xPercent/yPercent and indicatorXPercent/indicatorYPercent
    status: pending
  - id: remove-buttons
    content: Remove Move/Reposition buttons from ModalWeldForm; hide in Inspection mode
    status: pending
isProject: false
---

# Edition and Inspection Mode Plan

## Problem

The current "Move weld on map" and "Reposition indicator" buttons require: open modal -> click button -> click on drawing. This flow is awkward and doesn't support direct manipulation. Users want to grab markers and drag them, like Adobe Acrobat markup tools.

## Solution Overview

1. **Mode switch**: Edition (full markup) vs Inspection (view + edit weld info only)
2. **Edition mode**: Toolbar with Add weld + Select tools; selected markers show drag handles
3. **Direct drag**: Grab weld point or indicator handle and drag to reposition
4. **Remove** the Move/Reposition buttons from the weld form

---

## 1. Mode Switch

**File**: [app/app/page.jsx](d:\Workspace\Weld Dashboard\app\app\page.jsx)

- Add state: `appMode: "edition" | "inspection"` (default: `"edition"`)
- Add a toggle or segmented control in the header/toolbar: "Edition" | "Inspection"
- When switching to Inspection: clear `isRelocating`, `isRepositioningIndicator`, `spoolMarkerToPlace`

**File**: [components/Toolbar.jsx](d:\Workspace\Weld Dashboard\components\Toolbar.jsx) or new header area

- Add `appMode`, `onModeChange` props
- Render toggle: two buttons or a `join` group for "Edition" / "Inspection"

---

## 2. Markup Toolbar (Edition Mode Only)

**New component**: [components/MarkupToolbar.jsx](d:\Workspace\Weld Dashboard\components\MarkupToolbar.jsx)

Adobe Acrobat-style horizontal toolbar, shown below the main Toolbar when `appMode === "edition"` and PDF is loaded.

**Tools**:
- **Add weld** (cursor: crosshair): Click on drawing to add weld. Same as current `handlePageClick` when no spool marker placement.
- **Select** (cursor: default): Click weld to select; selected weld shows drag handles. Click empty area to deselect.

**State** (lift to page or PDFViewer):
- `markupTool: "add" | "select"` (default: `"select"`)
- When `add`: page click adds weld (unless spool marker placement active)
- When `select`: page click selects weld or deselects; no add on empty click

**Integration**:
- The main Toolbar stays for Load PDF, Save, Export, Settings, Spools, Projects
- MarkupToolbar appears between main Toolbar and PDF viewer when in Edition mode with PDF loaded
- MarkupToolbar can be a slim bar: `[ Add weld ] [ Select ]` with active tool highlighted

---

## 3. Drag Handles on Selected Marker

**File**: [components/WeldPointMarker.jsx](d:\Workspace\Weld Dashboard\components\WeldPointMarker.jsx)

When `isSelected` and `appMode === "edition"` (pass `canDrag` or `isEditionMode`):

- Render **two draggable handles** (small circles, e.g. 12px):
  1. **Weld point handle**: Overlaid on the weld location (cross/dot). Dragging updates `xPercent`, `yPercent`.
  2. **Indicator handle**: Overlaid on the indicator bubble. Dragging updates `indicatorXPercent`, `indicatorYPercent`.

- Handles: `cursor: grab` when idle, `cursor: grabbing` when dragging
- Use `pointer-events` so handles capture drag; the main marker body still opens the form on click (or we could make click-on-marker open form, drag-on-handle move – need to distinguish)
- **Alternative**: Make the entire marker draggable by region:
  - Drag from **indicator** (bullet area) -> moves indicator
  - Drag from **weld point** (cross/dot area) -> moves weld point
  - **Click** (without drag) -> opens form
  - This avoids separate handle UI; user grabs the part they want to move. Requires hit-testing which part was clicked.

**Recommended**: Use explicit handles (small circles) when selected, like the blue circles in the reference image. Clearer affordance.

**Handle styling**: Small circle, `ring-2 ring-primary` or `ring-base-content`, `bg-base-100`, visible on both light and dark backgrounds.

---

## 4. Drag Implementation

**Coordinate conversion**: The page wrapper (`pageWrapperRef`) has `getBoundingClientRect()`. On pointer move:
- `xPercent = ((clientX - rect.left) / rect.width) * 100`
- `yPercent = ((clientY - rect.top) / rect.height) * 100`
- Clamp to 0–100 if needed

**Event flow**:
1. `onPointerDown` on weld handle -> start drag, set `draggingWeldPoint`
2. `onPointerDown` on indicator handle -> start drag, set `draggingIndicator`
3. `onPointerMove` (window/document) -> if dragging, compute new %, call `onMoveWeld` or `onMoveIndicator`
4. `onPointerUp` / `onPointerLeave` -> end drag

**Props for WeldPointMarker**:
- `onMoveWeldPoint(weldId, { xPercent, yPercent })`
- `onMoveIndicator(weldId, { indicatorXPercent, indicatorYPercent })`
- `canDrag` (boolean) – true in Edition mode when selected

**Lift state**: Drag state can live in WeldPointMarker (which weld, which handle) with callbacks to parent. Or in a wrapper that captures pointer events.

**Page number**: Weld has `pageNumber`. Dragging stays on same page; no cross-page drag for now.

---

## 5. Inspection Mode Behavior

- **No Add weld**: Markup toolbar hidden or Add weld disabled. Click on empty area does nothing (or could zoom/pan).
- **No drag**: `canDrag` false. Selected weld shows no handles. Click still opens form.
- **Form**: ModalWeldForm in Inspection mode – hide "Move weld on map" and "Reposition indicator". Keep Save, Delete (or hide Delete per product decision; TODO says "cannot add or modify point" – modifying position is the key; deleting might be allowed in inspection for corrections).
- **Spool marker placement**: Disable in Inspection mode.

---

## 6. Remove Old Reposition Flow

**File**: [app/app/page.jsx](d:\Workspace\Weld Dashboard\app\app\page.jsx)

- Remove `isRelocating`, `isRepositioningIndicator` state and related alert banner
- Remove `handleRelocateWeld`, `handleRepositionIndicator` (replace with drag callbacks)
- Remove `handleMoveWeld` (no longer needed – drag replaces it)

**File**: [components/PDFViewer.jsx](d:\Workspace\Weld Dashboard\components\PDFViewer.jsx)

- Remove `onRelocateClick`, `onRepositionIndicator`, `isRelocating`, `isRepositioningIndicator` from click handler
- Simplify `handleClick`: only `onPageClick` for add weld (when tool is add and no spool placement)
- Pass `onWeldClick` for select tool – click on marker selects it (or opens form; need to decide: select-only vs open-form. For drag workflow: select first, then drag. Click to open form can be a double-click or a separate "Edit" action. Simpler: click = select + show handles; double-click or "Edit" button in toolbar = open form. Or: click = open form; when form has "Edit" we could show handles on the drawing. Actually, common UX: click marker = select (show handles), click again or button = open form. Or: single click = open form, and when form is open the marker is selected and shows handles. Let's go with: **click = select and show handles; selected marker has an "Edit" affordance or we add "Edit selected" in toolbar to open form. Or we keep click = open form** for backward compatibility, and when form is open the marker is selected. So: click marker -> open form. When in Edition mode and a marker is selected (form open or not), show handles. So we need "selected" to be independent: either from clicking (which opens form) or from having form open. Current: `selectedWeldId` is set when we open form. So when form is open, we have selectedWeldId. We could show handles whenever selectedWeldId is set and we're in Edition mode. So the flow: click marker -> setSelectedWeldId -> open form. Handles appear. User can drag handles without closing form. Good.
- So we don't need a separate "select" tool that doesn't open form. The select tool could mean: clicking on drawing doesn't add weld, it only selects/deselects. When you click a marker, you select it (and open form). When you click empty, you deselect. The "Add weld" tool: click on drawing adds weld. So the tools are: Add (click to add) vs Select (click to select/deselect, no add). In both cases, clicking a marker opens the form and selects it. The difference is what happens when you click empty space: Add -> add weld there; Select -> deselect.

**File**: [components/ModalWeldForm.jsx](d:\Workspace\Weld Dashboard\components\ModalWeldForm.jsx)

- Remove "Move weld on map" and "Reposition indicator" buttons
- Pass `appMode` or `canEditPositions` – in Inspection mode, we might hide Delete too (per TODO: "cannot add or modify point"). For now, hide Move and Reposition; keep Delete in Edition mode. Inspection: no Delete? Or allow Delete for data correction? Plan says "cannot add or modify point" – so no position change. Delete removes a point, so that's a modification. We'll hide Delete in Inspection to be safe. User can clarify.

---

## 7. Files to Create/Modify

| File | Action |
|------|--------|
| `app/app/page.jsx` | Add appMode, mode switch; remove isRelocating/isRepositioningIndicator; add onMoveWeldPoint, onMoveIndicator; conditionally pass canDrag |
| `components/Toolbar.jsx` | Add mode switch (Edition/Inspection) |
| `components/MarkupToolbar.jsx` | **Create** – Add weld / Select tools |
| `components/PDFViewer.jsx` | Simplify click handler; pass markupTool, appMode; remove relocate/reposition props |
| `components/WeldPointMarker.jsx` | Add drag handles when selected + canDrag; onPointerDown/Move/Up for drag; call onMoveWeldPoint, onMoveIndicator |
| `components/WeldOverlay.jsx` | Pass canDrag, onMoveWeldPoint, onMoveIndicator to WeldPointMarker |
| `components/ModalWeldForm.jsx` | Remove Move and Reposition buttons; optionally hide Delete in Inspection mode |

---

## 8. Visual Summary

```
Edition mode:
  [Edition] [Inspection]  <- mode switch
  [ Add weld ] [ Select ]  <- markup toolbar
  PDF with markers. Selected marker shows:
    [SW1]──●──•  (handles on indicator and weld point; drag either)

Inspection mode:
  [Edition] [Inspection]
  (no markup toolbar)
  PDF with markers. Click opens form; no handles, no drag.
```

---

## 9. Edge Cases

- **Touch devices**: Use pointer events (they unify mouse and touch). Consider touch-action: none on handles to prevent scroll during drag.
- **Multi-page**: Dragging stays on current page. If user switches page while dragging, cancel drag.
- **Spool marker placement**: In Edition mode, when placing spool marker, Add weld tool is temporarily overridden (current behavior).
