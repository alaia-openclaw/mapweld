"use client";

import Link from "next/link";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Toolbar from "@/components/Toolbar";
import MarkupToolbar from "@/components/MarkupToolbar";
import SidePanelWeldForm from "@/components/SidePanelWeldForm";
import SidePanelSpools from "@/components/SidePanelSpools";
import SidePanelPartForm from "@/components/SidePanelPartForm";
import SidePanelDrawings from "@/components/SidePanelDrawings";
import SidePanelLines from "@/components/SidePanelLines";
import AddDefaultsBar from "@/components/AddDefaultsBar";
import DashboardAnalytics from "@/components/DashboardAnalytics";
import ModalSettings from "@/components/ModalParameters";
import ModalProjects from "@/components/ModalProjects";
import NdtKanbanPage from "@/components/NdtKanbanPage";
import StatusPage from "@/components/StatusPage";
import ProjectHealthPage from "@/components/ProjectHealthPage";
import PageThumbnailPanel from "@/components/PageThumbnailPanel";
import OfflineBanner from "@/components/OfflineBanner";
import BottomSheet from "@/components/BottomSheet";
import {
  saveProject,
  loadProject,
  PROJECT_FILE_VERSION,
  migrateDrawingSettings,
  normalizeSystemRecord,
  normalizeLineRecord,
} from "@/lib/project-file";
import {
  saveProject as saveToIndexedDB,
  generateProjectId,
} from "@/lib/offline-storage";
import { createDefaultWeld, createDefaultSpool, createDefaultPart, createDefaultDrawing } from "@/lib/defaults";
import { normalizeJointDimensions } from "@/lib/joint-dimensions";
import { findCatalogEntry } from "@/lib/part-catalog";
import { getMergedCatalogEntries, leafIdToCatalogCategory } from "@/lib/catalog-leaf-resolve";
import { findEntryByHierarchy } from "@/lib/catalog-hierarchy";
import { assignPartDisplayNumbersForAllDrawings } from "@/lib/part-display-number";
import {
  getWeldName,
  getWeldOverallStatus,
  computeNdtSelection,
  assignWeldNumbersPerDrawing,
} from "@/lib/weld-utils";
import { formatNdtRequirements, NDT_REPORT_STATUS } from "@/lib/constants";
import { exportWeldsToExcel } from "@/lib/excel-export";
import { applyReportToWelds } from "@/lib/ndt-utils";
import { saveDraftToSession, loadDraftFromSession, clearDraftFromSession } from "@/lib/session-draft";
import ProjectSetupHub from "@/components/ProjectSetupHub";
import ProjectSetupWizard from "@/components/ProjectSetupWizard";
import { createDefaultDatabookConfig, normalizeDatabookConfig } from "@/lib/databook-sections";
import { getNextUniqueLineName } from "@/lib/line-utils";
import { syncWpsLibraryOnWeldSave } from "@/lib/wps-resolution";
import { NdtScopeProvider } from "@/contexts/NdtScopeContext";

const PDFViewerDynamic = dynamic(() => import("@/components/PDFViewer"), {
  ssr: false,
  loading: () => <div className="p-8">Loading viewer...</div>,
});

const ModalPrintDynamic = dynamic(() => import("@/components/ModalPrint"), {
  ssr: false,
});

function generateId() {
  return `wp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function applyCompletedReportsToWelds(weldPoints, ndtReports) {
  if (!Array.isArray(ndtReports) || !Array.isArray(weldPoints)) return weldPoints || [];
  let points = weldPoints;
  const completed = ndtReports.filter((r) => r.status === NDT_REPORT_STATUS.COMPLETED);
  completed.forEach((report) => {
    points = applyReportToWelds(report, points);
  });
  return points;
}

function createPdfBlobUrlFromBase64(base64) {
  if (typeof base64 !== "string" || !base64) return null;
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

function SidePanelTabButton({ label, title, active, onClick }) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      onClick={onClick}
      className={`btn btn-ghost btn-sm shrink-0 min-h-0 h-auto rounded-none border-0 shadow-none py-2 px-0.5 w-full text-[10px] font-semibold uppercase leading-tight tracking-tight ${
        active ? "bg-primary/20 text-primary" : "text-base-content/65 hover:bg-base-200"
      }`}
    >
      <span className="block text-center [overflow-wrap:anywhere]">{label}</span>
    </button>
  );
}

export default function WeldTrackerApp() {
  const containerRef = useRef(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfFilename, setPdfFilename] = useState("");
  const [weldPoints, setWeldPoints] = useState([]);
  const [spools, setSpools] = useState([]);
  const [drawingSettings, setDrawingSettings] = useState({
    ndtRequirements: [],
    weldingSpec: "",
  });
  const [appMode, setAppMode] = useState("edition");
  const [markupTool, setMarkupTool] = useState("select");
  const [selectedWeldId, setSelectedWeldId] = useState(null);
  const [selectedSpoolMarkerId, setSelectedSpoolMarkerId] = useState(null);
  const [formWeld, setFormWeld] = useState(null);
  const [activeSidePanel, setActiveSidePanel] = useState(
    /** @type {null | 'drawings' | 'lines' | 'spools' | 'welds' | 'parts'} */ (null)
  );
  const [storageAlerts, setStorageAlerts] = useState({
    indexeddb: null,
    sessionDraft: null,
  });
  const [showParameters, setShowParameters] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showNdtPanel, setShowNdtPanel] = useState(false);
  const [showStatusPage, setShowStatusPage] = useState(false);
  const [showHealthPage, setShowHealthPage] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [showProjectHub, setShowProjectHub] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [spoolMarkers, setSpoolMarkers] = useState([]);
  const [lineMarkers, setLineMarkers] = useState([]);
  const [parts, setParts] = useState([]);
  const [partMarkers, setPartMarkers] = useState([]);
  const [selectedLineMarkerId, setSelectedLineMarkerId] = useState(null);
  const [selectedPartMarkerId, setSelectedPartMarkerId] = useState(null);
  const anySidePanelOpen = activeSidePanel != null;
  const [personnel, setPersonnel] = useState({ fitters: [], welders: [], wqrs: [] });
  const [ndtRequests, setNdtRequests] = useState([]);
  const [ndtReports, setNdtReports] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [activeDrawingId, setActiveDrawingId] = useState(null);
  const [systems, setSystems] = useState([]);
  const [lines, setLines] = useState([]);
  const [projectSettings, setProjectSettings] = useState({ steps: [] });
  const [projectMeta, setProjectMeta] = useState({ projectName: "", client: "", spec: "", revision: "", date: "" });
  const [documents, setDocuments] = useState([]);
  const [databookConfig, setDatabookConfig] = useState(createDefaultDatabookConfig());
  const [wpsLibrary, setWpsLibrary] = useState([]);
  const [electrodeLibrary, setElectrodeLibrary] = useState([]);
  const [materialCertificates, setMaterialCertificates] = useState([]);
  const [addDefaults, setAddDefaults] = useState({
    spoolId: null,
    spoolLineId: null,
    weldLocation: "shop",
    lineId: "__new__",
    lineSystemId: null,
    catalogCategory: "",
    catalogLeafId: "",
    hierarchyState: {},
    partType: "",
    nps: "",
    thickness: "",
    materialGrade: "",
  });
  const [pendingLabelId, setPendingLabelIdState] = useState(null);
  const pendingLabelRef = useRef(null);
  const setPendingLabelId = useCallback((value) => {
    pendingLabelRef.current = value;
    setPendingLabelIdState(value);
  }, []);
  const [markerLayers, setMarkerLayers] = useState({
    welds: true,
    spools: true,
    parts: true,
    lines: true,
  });
  const [showPagePanel, setShowPagePanel] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileSheetTab, setMobileSheetTab] = useState("drawings");
  const [pdfScale, setPdfScale] = useState(1.2);
  const [pdfPage, setPdfPage] = useState(1);
  const [numPdfPages, setNumPdfPages] = useState(null);
  const [sidePanelWidth, setSidePanelWidth] = useState(320);
  const sidePanelResizeRef = useRef(null);
  const emptyStatePdfInputRef = useRef(null);
  const emptyStateProjectInputRef = useRef(null);
  const hubProjectFileInputRef = useRef(null);
  const [floatingToolbarPos, setFloatingToolbarPos] = useState({ x: 8, y: 8 });
  const [isFloatingToolbarCollapsed, setIsFloatingToolbarCollapsed] = useState(false);
  const floatingToolbarDragRef = useRef(null);

  const handleManualPageSelect = useCallback((nextPageOrUpdater) => {
    setPdfPage((prev) => {
      const nextValue =
        typeof nextPageOrUpdater === "function" ? nextPageOrUpdater(prev) : nextPageOrUpdater;
      return Math.max(1, nextValue || 1);
    });
    // Manual page navigation should not be blocked by selection-based auto-focus.
    setSelectedWeldId(null);
    setSelectedSpoolMarkerId(null);
    setSelectedPartMarkerId(null);
    setSelectedLineMarkerId(null);
    setFormWeld(null);
  }, []);

  useEffect(() => {
    const move = (e) => {
      if (!sidePanelResizeRef.current) return;
      const { startX, startWidth } = sidePanelResizeRef.current;
      const delta = e.clientX - startX;
      setSidePanelWidth(Math.min(800, Math.max(200, startWidth - delta)));
    };
    const up = () => {
      sidePanelResizeRef.current = null;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  useEffect(() => {
    const onPointerMove = (e) => {
      const drag = floatingToolbarDragRef.current;
      if (!drag) return;
      const nextX = Math.max(4, Math.min(window.innerWidth - 220, drag.startX + (e.clientX - drag.pointerStartX)));
      const nextY = Math.max(4, Math.min(window.innerHeight - 48, drag.startY + (e.clientY - drag.pointerStartY)));
      setFloatingToolbarPos({ x: nextX, y: nextY });
    };
    const onPointerUp = () => {
      floatingToolbarDragRef.current = null;
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setPendingLabelId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPendingLabelId]);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (pdfBlob) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [pdfBlob]);

  const loadPdfFile = useCallback((file) => {
    if (!file) return;
    const isFirstDrawing = drawings.length === 0 && !pdfBlob;
    const blobUrl = URL.createObjectURL(file);
    const dwg = createDefaultDrawing({ filename: file.name, blobUrl });
    setDrawings((prev) => [...prev, dwg]);
    setActiveDrawingId(dwg.id);
    setPdfBlob(blobUrl);
    setPdfFilename(file.name);
    setPdfPage(1);
    setNumPdfPages(null);
    if (isFirstDrawing) {
      // Only clear data tied to the drawing canvas. Do not reset project setup (personnel,
      // NDT defaults, WPS library, etc.) — e.g. after the setup wizard, the first PDF load must keep that.
      setWeldPoints([]);
      setSpools([]);
      setSpoolMarkers([]);
      setLineMarkers([]);
      setParts([]);
      setPartMarkers([]);
      setSelectedPartMarkerId(null);
      setNdtRequests([]);
      setNdtReports([]);
    }
    setSelectedWeldId(null);
    setSelectedSpoolMarkerId(null);
    setSelectedPartMarkerId(null);
    setSelectedLineMarkerId(null);
    setFormWeld(null);
  }, [pdfBlob, drawings]);

  /** Stable key for PDF viewer remount — avoid undefined access on Blob without name */
  const pdfViewerKey =
    !pdfBlob ? "no-pdf" : typeof pdfBlob === "string" ? pdfBlob : `${pdfBlob.name || "file"}-${pdfBlob.lastModified || 0}`;

  const handleModeChange = useCallback((mode) => {
    setAppMode(mode);
    if (mode === "inspection") {
      setFormWeld(null);
      setIsFloatingToolbarCollapsed(true);
      setMarkupTool("select");
    }
  }, []);

  const handleToolChange = useCallback((tool) => {
    setMarkupTool(tool);
  }, []);

  const pdfToBase64 = useCallback(async (source) => {
    const url =
      typeof source === "string" ? source : URL.createObjectURL(source);
    try {
      const blob = await fetch(url).then((r) => r.blob());
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () =>
          resolve(reader.result.replace(/^data:.*?;base64,/, ""));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } finally {
      if (typeof source !== "string") URL.revokeObjectURL(url);
    }
  }, []);

  const handleAddWeld = useCallback(
    ({ xPercent, yPercent, pageNumber }) => {
      let newWeld;
      const loc = addDefaults?.weldLocation || "shop";
      setWeldPoints((prev) => {
        const did = activeDrawingId ?? null;
        const maxNum = prev.reduce((m, w) => {
          if ((w.drawingId ?? null) !== did) return m;
          return Math.max(m, w.weldNumber ?? 0);
        }, 0);
        newWeld = {
          ...createDefaultWeld(),
          id: generateId(),
          drawingId: activeDrawingId ?? null,
          weldLocation: loc,
          spoolId: addDefaults?.spoolId ?? null,
          xPercent,
          yPercent,
          indicatorXPercent: xPercent,
          indicatorYPercent: yPercent,
          pageNumber: pageNumber ?? 0,
          weldNumber: maxNum + 1,
        };
        return [...prev, newWeld];
      });
      setPendingLabelId({ type: "weld", id: newWeld?.id });
    },
    [addDefaults, activeDrawingId, setPendingLabelId]
  );

  const handleAddSpoolMarker = useCallback(
    ({ xPercent, yPercent, pageNumber }) => {
      const t = Date.now();
      const rand = () => Math.random().toString(36).slice(2, 9);
      const newSpoolId = `spool-${t}-${rand()}`;
      const newMarkerId = `spm-${t}-${rand()}`;
      setSpools((prev) => {
        const used = prev
          .map((s) => s.name?.match(/^SP-([A-Z]+)$/i)?.[1])
          .filter(Boolean);
        let nextLetter = "A";
        if (used.length > 0) {
          const max = used.reduce((m, c) =>
            c.length > m.length || (c.length === m.length && c > m) ? c : m
          );
          if (max.length === 1) {
            const code = max.charCodeAt(0);
            nextLetter = code < 90 ? String.fromCharCode(code + 1) : "AA";
          } else {
            const last = max.charCodeAt(max.length - 1);
            nextLetter =
              last < 90
                ? max.slice(0, -1) + String.fromCharCode(last + 1)
                : max + "A";
          }
        }
        const newSpool = createDefaultSpool({
          id: newSpoolId,
          name: `SP-${nextLetter}`,
          lineId: addDefaults?.spoolLineId ?? null,
        });
        return [...prev, newSpool];
      });
      setSpoolMarkers((prev) => [
        ...prev,
        {
          id: newMarkerId,
          spoolId: newSpoolId,
          drawingId: activeDrawingId ?? null,
          xPercent,
          yPercent,
          indicatorXPercent: xPercent,
          indicatorYPercent: yPercent,
          pageNumber: pageNumber ?? 0,
        },
      ]);
      setPendingLabelId({ type: "spool", id: newMarkerId });
    },
    [activeDrawingId, addDefaults?.spoolLineId, setPendingLabelId]
  );

  const handleDeleteSpoolMarker = useCallback((markerId) => {
    setSpoolMarkers((prev) => prev.filter((m) => m.id !== markerId));
    setSelectedSpoolMarkerId(null);
  }, []);

  const handleSpoolMarkerClick = useCallback((marker) => {
    setSelectedSpoolMarkerId(marker.id);
    setSelectedWeldId(null);
    setSelectedPartMarkerId(null);
    setSelectedLineMarkerId(null);
    if (window.innerWidth < 768) {
      setMobileSheetTab("spools");
      setMobileSheetOpen(true);
    } else {
      setActiveSidePanel("spools");
    }
  }, []);

  const handleMoveSpoolMarker = useCallback((markerId, { xPercent, yPercent }) => {
    setSpoolMarkers((prev) =>
      prev.map((m) =>
        m.id === markerId ? { ...m, xPercent, yPercent } : m
      )
    );
  }, []);

  const handleMoveSpoolIndicator = useCallback(
    (markerId, { indicatorXPercent, indicatorYPercent }) => {
      setSpoolMarkers((prev) =>
        prev.map((m) =>
          m.id === markerId
            ? { ...m, indicatorXPercent, indicatorYPercent }
            : m
        )
      );
    },
    []
  );

  const handleAddPartMarker = useCallback(
    ({ xPercent, yPercent, pageNumber }) => {
      const leafId = addDefaults?.catalogLeafId ?? "";
      const cat =
        addDefaults?.catalogCategory || (leafId ? leafIdToCatalogCategory(leafId) : "") || "";
      const hierarchyState = addDefaults?.hierarchyState ?? {};
      const entriesForCat = cat ? getMergedCatalogEntries(cat, leafId) : [];
      const catalogEntryByHierarchy =
        cat && Object.keys(hierarchyState).length > 0
          ? findEntryByHierarchy(entriesForCat, hierarchyState, cat)
          : null;
      const pt = addDefaults?.partType ?? "";
      const n = addDefaults?.nps ?? "";
      const th = addDefaults?.thickness ?? "";
      const catalogEntry =
        catalogEntryByHierarchy ??
        (cat && pt && n && th ? findCatalogEntry(cat, pt, n, th) : null);
      const partType = catalogEntry?.partTypeLabel ?? pt;
      const nps = catalogEntry?.nps ?? n;
      const thickness = catalogEntry?.thickness ?? th;
      const newPart = createDefaultPart({
        spoolId: addDefaults?.spoolId ?? null,
        partType,
        nps,
        thickness,
        materialGrade: addDefaults?.materialGrade ?? "",
        catalogCategory: cat ?? "",
        catalogLeafId: leafId || "",
        catalogPartId: catalogEntry?.catalogPartId ?? null,
        weightKg: catalogEntry?.weightKg ?? null,
      });
      const newMarkerId = `pm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newMarker = {
        id: newMarkerId,
        partId: newPart.id,
        drawingId: activeDrawingId ?? null,
        xPercent,
        yPercent,
        indicatorXPercent: xPercent,
        indicatorYPercent: yPercent,
        pageNumber: pageNumber ?? 0,
      };
      setPartMarkers((prevMarkers) => {
        const nextMarkers = [...prevMarkers, newMarker];
        setParts((prevParts) => {
          const nextParts = [...prevParts, newPart];
          return assignPartDisplayNumbersForAllDrawings(nextParts, nextMarkers);
        });
        return nextMarkers;
      });
      setPendingLabelId({ type: "part", id: newMarkerId });
    },
    [addDefaults, activeDrawingId, setPendingLabelId]
  );

  const handleAddLineMarker = useCallback(
    ({ xPercent, yPercent, pageNumber }) => {
      const chosenLineId = addDefaults?.lineId;
      const selectedSystemId = addDefaults?.lineSystemId ?? null;
      let targetLineId = chosenLineId;
      if (!targetLineId || targetLineId === "__new__") {
        const id = `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        targetLineId = id;
        setLines((prev) => {
          const name = getNextUniqueLineName(prev);
          return [
            ...prev,
            {
              id,
              systemId: selectedSystemId || null,
              name,
              fluidType: "",
              pressure: "",
              diameterRange: "",
              thickness: "",
              material: "",
              drawingIds: activeDrawingId ? [activeDrawingId] : [],
            },
          ];
        });
      } else if (activeDrawingId) {
        setLines((prev) =>
          prev.map((line) =>
            line.id === targetLineId
              ? {
                  ...line,
                  drawingIds: Array.isArray(line.drawingIds)
                    ? line.drawingIds.includes(activeDrawingId)
                      ? line.drawingIds
                      : [...line.drawingIds, activeDrawingId]
                    : [activeDrawingId],
                }
              : line
          )
        );
      }

      if (!targetLineId) return;

      if (activeDrawingId) {
        setDrawings((prev) =>
          prev.map((drawing) => {
            if (drawing.id !== activeDrawingId) return drawing;
            const currentLineIds = Array.isArray(drawing.lineIds) ? drawing.lineIds : [];
            if (currentLineIds.includes(targetLineId)) return drawing;
            return { ...drawing, lineIds: [...currentLineIds, targetLineId] };
          })
        );
      }

      const page = pageNumber ?? 0;
      let markerId = null;
      setLineMarkers((prev) => {
        const existing = prev.find(
          (marker) =>
            marker.lineId === targetLineId &&
            marker.drawingId === (activeDrawingId ?? null) &&
            (marker.pageNumber ?? 0) === page
        );
        if (existing) {
          markerId = existing.id;
          return prev.map((marker) =>
            marker.id === existing.id
              ? {
                  ...marker,
                  xPercent,
                  yPercent,
                }
              : marker
          );
        }
        markerId = `lpm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const newMarker = {
          id: markerId,
          lineId: targetLineId,
          drawingId: activeDrawingId ?? null,
          xPercent,
          yPercent,
          indicatorXPercent: Math.min(100, Math.max(0, xPercent + 4)),
          indicatorYPercent: Math.min(100, Math.max(0, yPercent - 4)),
          pageNumber: page,
        };
        return [...prev, newMarker];
      });
      if (markerId) setPendingLabelId({ type: "line", id: markerId });
    },
    [addDefaults, activeDrawingId, setPendingLabelId]
  );

  const handlePartMarkerClick = useCallback((marker) => {
    setSelectedPartMarkerId(marker.id);
    setSelectedWeldId(null);
    setSelectedSpoolMarkerId(null);
    setSelectedLineMarkerId(null);
    if (window.innerWidth < 768) {
      setMobileSheetTab("parts");
      setMobileSheetOpen(true);
    } else {
      setActiveSidePanel("parts");
    }
  }, []);

  const handleMovePartMarker = useCallback((markerId, { xPercent, yPercent }) => {
    setPartMarkers((prev) =>
      prev.map((m) => (m.id === markerId ? { ...m, xPercent, yPercent } : m))
    );
  }, []);

  const handleMovePartIndicator = useCallback(
    (markerId, { indicatorXPercent, indicatorYPercent }) => {
      setPartMarkers((prev) =>
        prev.map((m) =>
          m.id === markerId
            ? { ...m, indicatorXPercent, indicatorYPercent }
            : m
        )
      );
    },
    []
  );

  const handleLineMarkerClick = useCallback((marker) => {
    setSelectedLineMarkerId(marker.id);
    setSelectedWeldId(null);
    setSelectedSpoolMarkerId(null);
    setSelectedPartMarkerId(null);
    if (window.innerWidth < 768) {
      setMobileSheetTab("lines");
      setMobileSheetOpen(true);
    } else {
      setActiveSidePanel("lines");
    }
  }, []);

  const handleMoveLineMarker = useCallback((markerId, { xPercent, yPercent }) => {
    setLineMarkers((prev) =>
      prev.map((marker) => (marker.id === markerId ? { ...marker, xPercent, yPercent } : marker))
    );
  }, []);

  const handleMoveLineIndicator = useCallback((markerId, { indicatorXPercent, indicatorYPercent }) => {
    setLineMarkers((prev) =>
      prev.map((marker) =>
        marker.id === markerId ? { ...marker, indicatorXPercent, indicatorYPercent } : marker
      )
    );
  }, []);

  const handleSavePart = useCallback((updatedPart) => {
    setPartMarkers((currentMarkers) => {
      setParts((prevParts) => {
        const nextParts = prevParts.map((p) => (p.id === updatedPart.id ? updatedPart : p));
        return assignPartDisplayNumbersForAllDrawings(nextParts, currentMarkers);
      });
      return currentMarkers;
    });
  }, []);

  const handleUpdatePartHeat = useCallback((partId, newHeatNumber) => {
    setParts((prev) =>
      prev.map((p) =>
        p.id === partId ? { ...p, heatNumber: newHeatNumber } : p
      )
    );
  }, []);

  const handleAssignPartToSpool = useCallback((partId, spoolId) => {
    setParts((prev) =>
      prev.map((p) => (p.id === partId ? { ...p, spoolId } : p))
    );
  }, []);

  const handleDeletePart = useCallback((partId) => {
    setPartMarkers((prevMarkers) => {
      const nextMarkers = prevMarkers.filter((m) => m.partId !== partId);
      setParts((prevParts) => {
        const nextParts = prevParts.filter((p) => p.id !== partId);
        return assignPartDisplayNumbersForAllDrawings(nextParts, nextMarkers);
      });
      return nextMarkers;
    });
    setWeldPoints((prev) =>
      prev.map((w) => ({
        ...w,
        partId1: w.partId1 === partId ? null : w.partId1,
        partId2: w.partId2 === partId ? null : w.partId2,
      }))
    );
    setSelectedPartMarkerId(null);
  }, []);

  const handleDeletePartMarker = useCallback((markerId) => {
    const marker = partMarkers.find((m) => m.id === markerId);
    if (marker?.partId) handleDeletePart(marker.partId);
  }, [partMarkers, handleDeletePart]);

  const handlePendingLabelMove = useCallback(
    ({ xPercent, yPercent }) => {
      const pending = pendingLabelRef.current;
      if (!pending) return;
      const { type, id } = pending;
      if (type === "weld") {
        setWeldPoints((prev) =>
          prev.map((w) =>
            w.id === id ? { ...w, indicatorXPercent: xPercent, indicatorYPercent: yPercent } : w
          )
        );
      } else if (type === "spool") {
        setSpoolMarkers((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, indicatorXPercent: xPercent, indicatorYPercent: yPercent } : m
          )
        );
      } else if (type === "part") {
        setPartMarkers((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, indicatorXPercent: xPercent, indicatorYPercent: yPercent } : m
          )
        );
      } else if (type === "line") {
        setLineMarkers((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, indicatorXPercent: xPercent, indicatorYPercent: yPercent } : m
          )
        );
      }
    },
    []
  );

  const handlePageClick = useCallback(
    ({ xPercent, yPercent, pageNumber }) => {
      if (pendingLabelRef.current) {
        handlePendingLabelMove({ xPercent, yPercent });
        setPendingLabelId(null);
        return;
      }
      if (appMode === "edition" && markupTool === "addSpool") {
        handleAddSpoolMarker({ xPercent, yPercent, pageNumber });
      } else if (appMode === "edition" && markupTool === "addPart") {
        handleAddPartMarker({ xPercent, yPercent, pageNumber });
      } else if (appMode === "edition" && markupTool === "addLine") {
        handleAddLineMarker({ xPercent, yPercent, pageNumber });
      } else if (appMode === "edition" && markupTool === "add") {
        handleAddWeld({ xPercent, yPercent, pageNumber });
      } else if (markupTool === "select") {
        setSelectedWeldId(null);
        setSelectedSpoolMarkerId(null);
        setSelectedPartMarkerId(null);
        setSelectedLineMarkerId(null);
        setFormWeld(null);
      }
    },
    [handleAddSpoolMarker, handleAddPartMarker, handleAddLineMarker, handleAddWeld, handlePendingLabelMove, appMode, markupTool, setPendingLabelId]
  );

  const handleWeldClick = useCallback((weld) => {
    setSelectedWeldId(weld.id);
    setSelectedSpoolMarkerId(null);
    setSelectedPartMarkerId(null);
    setSelectedLineMarkerId(null);
    if (window.innerWidth < 768) {
      setFormWeld(weld);
      setMobileSheetTab("welds");
      setMobileSheetOpen(true);
    }
  }, []);

  const handleWeldDoubleClick = useCallback((weld) => {
    setFormWeld(weld);
    setSelectedWeldId(weld.id);
    setSelectedLineMarkerId(null);
    if (window.innerWidth < 768) {
      setMobileSheetTab("welds");
      setMobileSheetOpen(true);
    } else {
      setActiveSidePanel("welds");
    }
  }, []);

  const handleSaveWeld = useCallback((updatedWeld) => {
    setWpsLibrary((prevLib) => {
      const { mergedWeld, nextWpsLibrary } = syncWpsLibraryOnWeldSave(updatedWeld, prevLib);
      setWeldPoints((prev) => prev.map((w) => (w.id === mergedWeld.id ? mergedWeld : w)));
      setFormWeld(mergedWeld);
      return nextWpsLibrary;
    });
  }, []);

  const handleClosePanel = useCallback(() => {
    setFormWeld(null);
    setSelectedWeldId(null);
    setSelectedLineMarkerId(null);
    setActiveSidePanel((p) => (p === "welds" ? null : p));
  }, []);

  const handleBackToList = useCallback(() => {
    setFormWeld(null);
    setSelectedWeldId(null);
    setSelectedLineMarkerId(null);
  }, []);

  const handleAssignWeldToSpool = useCallback((weldId, spoolId) => {
    setWeldPoints((prev) =>
      prev.map((w) => (w.id === weldId ? { ...w, spoolId } : w))
    );
  }, []);

  const handleMoveWeldPoint = useCallback((weldId, { xPercent, yPercent }) => {
    setWeldPoints((prev) =>
      prev.map((w) =>
        w.id === weldId ? { ...w, xPercent, yPercent } : w
      )
    );
  }, []);

  const handleMoveIndicator = useCallback(
    (weldId, { indicatorXPercent, indicatorYPercent }) => {
      setWeldPoints((prev) =>
        prev.map((w) =>
          w.id === weldId
            ? { ...w, indicatorXPercent, indicatorYPercent }
            : w
        )
      );
    },
    []
  );

  const handleResizeLabel = useCallback((weldId, { labelFontSize }) => {
    setWeldPoints((prev) =>
      prev.map((w) => (w.id === weldId ? { ...w, labelFontSize } : w))
    );
  }, []);

  const handleMoveLineBend = useCallback(
    (weldId, { lineBendXPercent, lineBendYPercent }) => {
      setWeldPoints((prev) =>
        prev.map((w) =>
          w.id === weldId
            ? { ...w, lineBendXPercent, lineBendYPercent }
            : w
        )
      );
    },
    []
  );

  const handleDeleteWeld = useCallback((weld) => {
    setWeldPoints((prev) => prev.filter((w) => w.id !== weld.id));
    setFormWeld(null);
    setSelectedWeldId(null);
    setSelectedLineMarkerId(null);
    setActiveSidePanel((p) => (p === "welds" ? null : p));
  }, []);

  /** Settings → Structure → Welds: update weld without touching canvas selection state. */
  const handleSaveWeldFromSettings = useCallback((updatedWeld) => {
    setWpsLibrary((prevLib) => {
      const { mergedWeld, nextWpsLibrary } = syncWpsLibraryOnWeldSave(updatedWeld, prevLib);
      setWeldPoints((prev) => prev.map((w) => (w.id === mergedWeld.id ? mergedWeld : w)));
      return nextWpsLibrary;
    });
  }, []);

  const handleDeleteWeldFromSettings = useCallback((weld) => {
    setWeldPoints((prev) => prev.filter((w) => w.id !== weld.id));
  }, []);

  const draftSaveTimeoutRef = useRef(null);
  const persistSessionDraftRef = useRef(async () => ({ ok: true, skipped: true }));

  const normalizeLoadedData = useCallback((rawData, { fallbackDrawingId = null, drawingIds = [] } = {}) => {
    const data = rawData && typeof rawData === "object" ? rawData : {};
    const knownDrawingIds = drawingIds.length > 0
      ? drawingIds.filter(Boolean)
      : (Array.isArray(data.drawings) ? data.drawings.map((d) => d?.id).filter(Boolean) : []);
    const drawingIdSet = new Set(knownDrawingIds);
    const firstDrawingId = fallbackDrawingId || knownDrawingIds[0] || null;
    const normalizeDrawingId = (drawingId) => {
      if (drawingId && drawingIdSet.has(drawingId)) return drawingId;
      return firstDrawingId;
    };

    const normalizedSpools = Array.isArray(data.spools)
      ? data.spools
          .filter((sp) => sp && typeof sp === "object")
          .map((sp) => ({
            ...createDefaultSpool(),
            ...sp,
            lineId: sp.lineId ?? null,
          }))
      : [];
    const spoolIdSet = new Set(normalizedSpools.map((s) => s.id).filter(Boolean));

    const normalizedParts = Array.isArray(data.parts)
      ? data.parts
          .filter((part) => part && typeof part === "object")
          .map((part) => ({
            ...part,
            spoolId: spoolIdSet.has(part.spoolId) ? part.spoolId : null,
          }))
      : [];
    const partIdSet = new Set(normalizedParts.map((p) => p.id).filter(Boolean));

    const normalizedWelds = Array.isArray(data.weldPoints)
      ? data.weldPoints
          .filter((w) => w && typeof w === "object")
          .map((w) => ({
            ...createDefaultWeld(),
            ...w,
            drawingId: normalizeDrawingId(w.drawingId),
            spoolId: spoolIdSet.has(w.spoolId) ? w.spoolId : null,
            partId1: partIdSet.has(w.partId1) ? w.partId1 : null,
            partId2: partIdSet.has(w.partId2) ? w.partId2 : null,
            jointDimensions: normalizeJointDimensions(w.jointDimensions),
          }))
      : [];

    const normalizedSpoolMarkers = Array.isArray(data.spoolMarkers)
      ? data.spoolMarkers
          .filter((m) => m && typeof m === "object" && (!m.spoolId || spoolIdSet.has(m.spoolId)))
          .map((m) => ({
            ...m,
            drawingId: normalizeDrawingId(m.drawingId),
          }))
      : [];

    const lineIdSet = new Set(
      (Array.isArray(data.lines) ? data.lines : [])
        .filter((line) => line && typeof line === "object")
        .map((line) => line.id)
        .filter(Boolean)
    );
    const normalizedLineMarkers = Array.isArray(data.lineMarkers)
      ? data.lineMarkers
          .filter((marker) => marker && typeof marker === "object" && (!marker.lineId || lineIdSet.has(marker.lineId)))
          .map((marker) => ({
            ...marker,
            drawingId: normalizeDrawingId(marker.drawingId),
          }))
      : [];

    const normalizedPartMarkers = Array.isArray(data.partMarkers)
      ? data.partMarkers
          .filter((m) => m && typeof m === "object" && (!m.partId || partIdSet.has(m.partId)))
          .map((m) => ({
            ...m,
            drawingId: normalizeDrawingId(m.drawingId),
          }))
      : [];

    const normalizedDocuments = Array.isArray(data.documents)
      ? data.documents
          .filter((doc) => doc && typeof doc === "object")
          .map((doc) => ({
            id: doc.id || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            title: doc.title || doc.fileName || "",
            category: doc.category || "other",
            fileName: doc.fileName || doc.title || "document.pdf",
            mimeType: doc.mimeType || "application/pdf",
            base64: doc.base64 || "",
            createdAt: doc.createdAt || new Date().toISOString(),
          }))
          .filter((doc) => !!doc.base64)
      : [];

    assignWeldNumbersPerDrawing(normalizedWelds);

    return {
      ...data,
      weldPoints: normalizedWelds,
      spools: normalizedSpools,
      spoolMarkers: normalizedSpoolMarkers,
      lineMarkers: normalizedLineMarkers,
      parts: normalizedParts,
      partMarkers: normalizedPartMarkers,
      personnel: data.personnel || { fitters: [], welders: [], wqrs: [] },
      drawingSettings: migrateDrawingSettings(data.drawingSettings) || { ndtRequirements: [], weldingSpec: "" },
      ndtRequests: Array.isArray(data.ndtRequests) ? data.ndtRequests : [],
      ndtReports: Array.isArray(data.ndtReports) ? data.ndtReports : [],
      addDefaults:
        data.addDefaults && typeof data.addDefaults === "object"
          ? {
              spoolId: null,
              spoolLineId: null,
              weldLocation: "shop",
              lineId: "__new__",
              lineSystemId: null,
              catalogCategory: "",
              catalogLeafId: "",
              hierarchyState: {},
              partType: "",
              nps: "",
              thickness: "",
              materialGrade: "",
              ...data.addDefaults,
            }
          : {
              spoolId: null,
              spoolLineId: null,
              weldLocation: "shop",
              lineId: "__new__",
              lineSystemId: null,
              catalogCategory: "",
              catalogLeafId: "",
              hierarchyState: {},
              partType: "",
              nps: "",
              thickness: "",
              materialGrade: "",
            },
      systems: Array.isArray(data.systems)
        ? data.systems.filter((s) => s && typeof s === "object").map(normalizeSystemRecord)
        : [],
      lines: Array.isArray(data.lines)
        ? data.lines.filter((ln) => ln && typeof ln === "object").map(normalizeLineRecord)
        : [],
      projectSettings:
        data.projectSettings && typeof data.projectSettings === "object"
          ? data.projectSettings
          : { steps: [] },
      projectMeta:
        data.projectMeta && typeof data.projectMeta === "object"
          ? data.projectMeta
          : { projectName: "", client: "", spec: "", revision: "", date: "" },
      documents: normalizedDocuments,
      databookConfig: normalizeDatabookConfig(data.databookConfig),
      wpsLibrary: Array.isArray(data.wpsLibrary) ? data.wpsLibrary : [],
      electrodeLibrary: Array.isArray(data.electrodeLibrary) ? data.electrodeLibrary : [],
      materialCertificates: Array.isArray(data.materialCertificates) ? data.materialCertificates : [],
    };
  }, []);

  const restoreDrawingsFromData = useCallback((data) => {
    const dwgs = Array.isArray(data?.drawings) ? data.drawings : [];
    const runtimeDrawings = dwgs
      .map((d) => {
        const blobUrl = createPdfBlobUrlFromBase64(d?.pdfBase64 || "");
        if (!blobUrl) return null;
        return { ...d, blobUrl };
      })
      .filter(Boolean);

    if (runtimeDrawings.length > 0) {
      setDrawings((prev) => {
        prev.forEach((d) => {
          if (typeof d?.blobUrl === "string") URL.revokeObjectURL(d.blobUrl);
        });
        return runtimeDrawings;
      });
      const first = runtimeDrawings[0];
      setActiveDrawingId(first.id);
      setPdfBlob(first.blobUrl);
      setPdfFilename(first.filename || "drawing.pdf");
      setPdfPage(1);
      setNumPdfPages(null);
      return runtimeDrawings;
    }

    if (data?.pdfBase64) {
      const url = createPdfBlobUrlFromBase64(data.pdfBase64);
      if (url) {
        const dwg = createDefaultDrawing({ filename: data.pdfFilename || "drawing.pdf", blobUrl: url });
        setDrawings((prev) => {
          prev.forEach((d) => {
            if (typeof d?.blobUrl === "string") URL.revokeObjectURL(d.blobUrl);
          });
          return [dwg];
        });
        setActiveDrawingId(dwg.id);
        setPdfBlob(url);
        setPdfFilename(data.pdfFilename || "drawing.pdf");
        setPdfPage(1);
        setNumPdfPages(null);
        return [dwg];
      }
    }

    setDrawings((prev) => {
      prev.forEach((d) => {
        if (typeof d?.blobUrl === "string") URL.revokeObjectURL(d.blobUrl);
      });
      return [];
    });
    setActiveDrawingId(null);
    setPdfBlob(null);
    setPdfFilename("");
    setPdfPage(1);
    setNumPdfPages(null);
    return [];
  }, []);

  const applyLoadedProjectData = useCallback(
    (rawData, { forcedProjectId = undefined } = {}) => {
      const runtimeDrawings = restoreDrawingsFromData(rawData);
      const normalized = normalizeLoadedData(rawData, {
        fallbackDrawingId: runtimeDrawings[0]?.id ?? null,
        drawingIds: runtimeDrawings.map((d) => d.id),
      });
      const loadedReports = normalized.ndtReports;
      setWeldPoints(applyCompletedReportsToWelds(normalized.weldPoints, loadedReports));
      setSpools(normalized.spools);
      setSpoolMarkers(normalized.spoolMarkers);
      setLineMarkers(normalized.lineMarkers);
      setParts(normalized.parts);
      setPartMarkers(normalized.partMarkers);
      setPersonnel(normalized.personnel);
      setDrawingSettings(normalized.drawingSettings);
      setNdtRequests(normalized.ndtRequests);
      setNdtReports(loadedReports);
      setAddDefaults(normalized.addDefaults);
      setSystems(normalized.systems);
      setLines(normalized.lines);
      setProjectSettings(normalized.projectSettings);
      setProjectMeta(normalized.projectMeta);
      setDocuments(normalized.documents);
      setDatabookConfig(normalized.databookConfig);
      setWpsLibrary(normalized.wpsLibrary);
      setElectrodeLibrary(normalized.electrodeLibrary);
      setMaterialCertificates(normalized.materialCertificates);
      setFormWeld(null);
      setSelectedWeldId(null);
      setSelectedSpoolMarkerId(null);
      setSelectedPartMarkerId(null);
      setProjectId(forcedProjectId !== undefined ? forcedProjectId : normalized.id || generateProjectId());
    },
    [normalizeLoadedData, restoreDrawingsFromData]
  );

  const handleOpenProjectFromStorage = useCallback((data) => {
    applyLoadedProjectData(data, { forcedProjectId: data?.id || generateProjectId() });
    setShowProjectHub(false);
  }, [applyLoadedProjectData]);

  const handleSwitchDrawing = useCallback((dwgId) => {
    const dwg = drawings.find((d) => d.id === dwgId);
    if (!dwg) return;
    setActiveDrawingId(dwgId);
    if (dwg.blobUrl) setPdfBlob(dwg.blobUrl);
    setPdfFilename(dwg.filename || "drawing.pdf");
    setPdfPage(1);
    setNumPdfPages(null);
    setSelectedWeldId(null);
    setSelectedSpoolMarkerId(null);
    setSelectedPartMarkerId(null);
      setSelectedLineMarkerId(null);
    setFormWeld(null);
  }, [drawings]);

  const handleDeleteDrawing = useCallback((dwgId) => {
    const removedSpoolIds = new Set(
      spoolMarkers
        .filter((m) => m.drawingId === dwgId)
        .map((m) => m.spoolId)
        .filter(Boolean)
    );
    const survivingSpoolIds = new Set(
      spoolMarkers
        .filter((m) => m.drawingId !== dwgId)
        .map((m) => m.spoolId)
        .filter(Boolean)
    );
    const spoolIdsToRemove = new Set(
      [...removedSpoolIds].filter((spoolId) => !survivingSpoolIds.has(spoolId))
    );

    const removedPartIds = new Set(
      partMarkers
        .filter((m) => m.drawingId === dwgId)
        .map((m) => m.partId)
        .filter(Boolean)
    );
    const survivingPartIds = new Set(
      partMarkers
        .filter((m) => m.drawingId !== dwgId)
        .map((m) => m.partId)
        .filter(Boolean)
    );
    const partIdsToRemove = new Set(
      [...removedPartIds].filter((partId) => !survivingPartIds.has(partId))
    );

    setSpoolMarkers((prev) => prev.filter((m) => m.drawingId !== dwgId));
    setLineMarkers((prev) => prev.filter((m) => m.drawingId !== dwgId));
    setPartMarkers((prev) => prev.filter((m) => m.drawingId !== dwgId));
    setSpools((prev) => prev.filter((s) => !spoolIdsToRemove.has(s.id)));
    setParts((prev) =>
      prev
        .filter((p) => !partIdsToRemove.has(p.id))
        .map((p) =>
          spoolIdsToRemove.has(p.spoolId) ? { ...p, spoolId: null } : p
        )
    );
    setWeldPoints((prev) =>
      prev
        .filter((w) => w.drawingId !== dwgId)
        .map((w) => ({
          ...w,
          spoolId: spoolIdsToRemove.has(w.spoolId) ? null : w.spoolId,
          partId1: partIdsToRemove.has(w.partId1) ? null : w.partId1,
          partId2: partIdsToRemove.has(w.partId2) ? null : w.partId2,
        }))
    );
    setFormWeld(null);
    setSelectedWeldId(null);
    setSelectedSpoolMarkerId(null);
    setSelectedPartMarkerId(null);
    setSelectedLineMarkerId(null);

    setDrawings((prev) => {
      const toDelete = prev.find((d) => d.id === dwgId);
      if (typeof toDelete?.blobUrl === "string") URL.revokeObjectURL(toDelete.blobUrl);

      const next = prev.filter((d) => d.id !== dwgId);
      if (dwgId === activeDrawingId && next.length > 0) {
        const fallback = next[0];
        setActiveDrawingId(fallback.id);
        setPdfBlob(fallback.blobUrl || null);
        setPdfFilename(fallback.filename || "drawing.pdf");
        setPdfPage(1);
        setNumPdfPages(null);
      } else if (next.length === 0) {
        setActiveDrawingId(null);
        setPdfBlob(null);
        setPdfFilename("");
        setPdfPage(1);
        setNumPdfPages(null);
      }
      return next;
    });
  }, [activeDrawingId, partMarkers, spoolMarkers]);

  const handleSaveProject = useCallback(async () => {
    if (!pdfBlob) return;
    const serializedDrawings = await Promise.all(
      drawings.map(async (d) => {
        const source = d.blobUrl || (d.id === activeDrawingId ? pdfBlob : null);
        const b64 = source ? await pdfToBase64(source) : d.pdfBase64 || "";
        return { id: d.id, filename: d.filename, pdfBase64: b64, revision: d.revision || "", lineIds: d.lineIds || [] };
      })
    );
    if (serializedDrawings.length === 0) {
      const b64 = await pdfToBase64(pdfBlob);
      serializedDrawings.push({ id: activeDrawingId || createDefaultDrawing().id, filename: pdfFilename, pdfBase64: b64, revision: "", lineIds: [] });
    }
    const payload = {
      version: PROJECT_FILE_VERSION,
      drawings: serializedDrawings,
      weldPoints,
      spools,
      spoolMarkers,
      lineMarkers,
      parts,
      partMarkers,
      personnel,
      drawingSettings,
      addDefaults,
      ndtRequests,
      ndtReports,
      systems,
      lines,
      projectSettings,
      projectMeta,
      documents,
      databookConfig,
      wpsLibrary,
      electrodeLibrary,
      materialCertificates,
    };
    if (projectId) {
      try {
        await saveToIndexedDB(projectId, payload);
        setStorageAlerts((s) => (s.indexeddb ? { ...s, indexeddb: null } : s));
      } catch {
        setStorageAlerts((s) => ({
          ...s,
          indexeddb:
            "Could not save to browser storage (private window, blocked storage, or quota). Your .weldproject file still downloaded — keep that copy safe.",
        }));
      }
    }
    saveProject(payload);
  }, [
    pdfBlob,
    projectId,
    pdfFilename,
    drawings,
    activeDrawingId,
    weldPoints,
    spools,
    spoolMarkers,
    lineMarkers,
    parts,
    partMarkers,
    personnel,
    drawingSettings,
    ndtRequests,
    ndtReports,
    addDefaults,
    systems,
    lines,
    projectSettings,
    projectMeta,
    documents,
    databookConfig,
    wpsLibrary,
    electrodeLibrary,
    materialCertificates,
    pdfToBase64,
  ]);

  const persistSessionDraftToStorage = useCallback(
    async ({ updateAlerts = true } = {}) => {
      if (!pdfBlob) return { ok: true, skipped: true };
      try {
        const serializedDrawings = await Promise.all(
          drawings.map(async (d) => {
            const source = d.blobUrl || (d.id === activeDrawingId ? pdfBlob : null);
            const b64 = source ? await pdfToBase64(source) : d.pdfBase64 || "";
            return { id: d.id, filename: d.filename, pdfBase64: b64, revision: d.revision || "", lineIds: d.lineIds || [] };
          })
        );
        if (serializedDrawings.length === 0) {
          const b64 = await pdfToBase64(pdfBlob);
          serializedDrawings.push({
            id: activeDrawingId || "dwg-draft",
            filename: pdfFilename,
            pdfBase64: b64,
            revision: "",
            lineIds: [],
          });
        }
        const draftResult = saveDraftToSession({
          version: PROJECT_FILE_VERSION,
          id: projectId || generateProjectId(),
          drawings: serializedDrawings,
          weldPoints,
          spools,
          spoolMarkers,
          lineMarkers,
          parts,
          partMarkers,
          personnel,
          drawingSettings,
          addDefaults,
          ndtRequests,
          ndtReports,
          systems,
          lines,
          projectSettings,
          projectMeta,
          documents,
          databookConfig,
          wpsLibrary,
          electrodeLibrary,
          materialCertificates,
        });
        if (updateAlerts) {
          if (draftResult.ok && !draftResult.skipped) {
            setStorageAlerts((s) => (s.sessionDraft ? { ...s, sessionDraft: null } : s));
          }
          if (!draftResult.ok) {
            const msg =
              draftResult.reason === "quota"
                ? "Could not auto-save your session: browser storage is full. Save a .weldproject file regularly so you don't lose work."
                : draftResult.reason === "blocked"
                  ? "Could not write to session storage. Save a .weldproject file to keep your work."
                  : `Session auto-save failed: ${draftResult.message || "unknown error"}`;
            setStorageAlerts((s) => ({ ...s, sessionDraft: msg }));
          }
        }
        return draftResult;
      } catch (err) {
        if (updateAlerts) {
          setStorageAlerts((s) => ({
            ...s,
            sessionDraft: `Session auto-save failed: ${err?.message || "unknown error"}`,
          }));
        }
        return { ok: false };
      }
    },
    [
      pdfBlob,
      projectId,
      pdfFilename,
      drawings,
      activeDrawingId,
      weldPoints,
      spools,
      spoolMarkers,
      lineMarkers,
      parts,
      partMarkers,
      personnel,
      drawingSettings,
      addDefaults,
      ndtRequests,
      ndtReports,
      systems,
      lines,
      projectSettings,
      projectMeta,
      documents,
      databookConfig,
      wpsLibrary,
      electrodeLibrary,
      materialCertificates,
      pdfToBase64,
    ]
  );

  persistSessionDraftRef.current = persistSessionDraftToStorage;

  useEffect(() => {
    const draft = loadDraftFromSession();
    const canRestoreSession =
      (Array.isArray(draft?.drawings) && draft.drawings.length > 0) || !!draft?.pdfBase64;
    if (canRestoreSession && draft) {
      applyLoadedProjectData(draft, { forcedProjectId: draft.id || generateProjectId() });
      setShowProjectHub(false);
    } else {
      setShowProjectHub(true);
    }
    setAppReady(true);
  }, [applyLoadedProjectData]);

  useEffect(() => {
    if (!pdfBlob) return;
    if (draftSaveTimeoutRef.current) clearTimeout(draftSaveTimeoutRef.current);
    draftSaveTimeoutRef.current = setTimeout(() => {
      draftSaveTimeoutRef.current = null;
      void persistSessionDraftToStorage({ updateAlerts: true });
    }, 500);
    return () => {
      if (draftSaveTimeoutRef.current) clearTimeout(draftSaveTimeoutRef.current);
    };
  }, [pdfBlob, persistSessionDraftToStorage]);

  useEffect(() => {
    const flush = () => {
      void persistSessionDraftRef.current({ updateAlerts: false });
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  const handleLoadProject = useCallback(async (file) => {
    try {
      const data = await loadProject(file);
      const hasDrawings = Array.isArray(data.drawings) && data.drawings.length > 0;
      if (!hasDrawings && !data.pdfBase64) throw new Error("No PDF in project file");
      applyLoadedProjectData(data, { forcedProjectId: generateProjectId() });
      setShowProjectHub(false);
    } catch (err) {
      alert(err.message || "Failed to load project");
    }
  }, [applyLoadedProjectData]);

  const handleBeginNewProject = useCallback(() => {
    if (pdfBlob || weldPoints.length > 0) {
      if (
        !confirm(
          "Discard the current project in this tab and start fresh? Unsaved work in this session may be lost."
        )
      )
        return;
    }
    clearDraftFromSession();
    applyLoadedProjectData({}, { forcedProjectId: generateProjectId() });
    setShowProjectHub(false);
    setShowSetupWizard(true);
  }, [applyLoadedProjectData, pdfBlob, weldPoints.length]);

  const handleWizardComplete = useCallback((payload) => {
    if (payload?.projectMeta != null) setProjectMeta(payload.projectMeta);
    if (payload?.personnel != null) setPersonnel(payload.personnel);
    if (payload?.drawingSettings != null) setDrawingSettings(migrateDrawingSettings(payload.drawingSettings));
    if (payload?.systems != null) setSystems(payload.systems);
    if (payload?.wpsLibrary != null) setWpsLibrary(payload.wpsLibrary);
    setShowSetupWizard(false);
  }, []);

  const handleWizardClose = useCallback(() => {
    setShowSetupWizard(false);
    setShowProjectHub(true);
  }, []);

  const handleRequestWizardLoadPdf = useCallback(() => {
    requestAnimationFrame(() => emptyStatePdfInputRef.current?.click());
  }, []);

  const ndtContext = useMemo(
    () => ({ systems, lines, spools, parts }),
    [systems, lines, spools, parts]
  );

  const handleExportExcel = useCallback(() => {
    exportWeldsToExcel(weldPoints, {
      pdfFilename,
      projectMeta,
      spools,
      parts,
      personnel,
      drawingSettings,
      ndtContext,
      drawings,
    });
  }, [weldPoints, pdfFilename, spools, parts, personnel, drawingSettings, projectMeta, ndtContext, drawings]);

  const weldStatusByWeldId = useMemo(() => {
    const map = new Map();
    weldPoints.forEach((w) => {
      const ndtSel = computeNdtSelection(w, drawingSettings, weldPoints, ndtContext);
      map.set(w.id, getWeldOverallStatus(w, ndtSel, ndtContext));
    });
    return map;
  }, [weldPoints, drawingSettings, ndtContext]);

  const handlePrint = useCallback(
    async (options) => {
      const { runPrint } = await import("@/lib/print-utils");
      const includeMarkers =
        options.pdfDrawing &&
        options.markers &&
        (options.markers.welds || options.markers.spools || options.markers.parts || options.markers.lines);
      const prevLayers = { ...markerLayers };
      if (includeMarkers) {
        setMarkerLayers({
          welds: !!options.markers.welds,
          spools: !!options.markers.spools,
          parts: !!options.markers.parts,
          lines: !!options.markers.lines,
        });
        await new Promise((r) => setTimeout(r, 200));
      }
      try {
        await runPrint({
          pdfDrawing: options.pdfDrawing,
          markers: options.markers,
          weldMap: options.weldMap,
          projectProgress: options.projectProgress,
          projectSummary: options.projectSummary,
          pdfBlob,
          pdfFilename,
          weldPoints,
          spools,
          parts,
          personnel,
          drawingSettings,
          weldStatusByWeldId,
          getWeldName,
          ndtContext,
          drawings,
        });
      } finally {
        if (includeMarkers) setMarkerLayers(prevLayers);
      }
    },
    [
      markerLayers,
      pdfBlob,
      pdfFilename,
      weldPoints,
      spools,
      parts,
      personnel,
      drawingSettings,
      weldStatusByWeldId,
      ndtContext,
      drawings,
    ]
  );

  const currentPage0 = pdfPage - 1;

  const hasMultipleDrawings = drawings.length > 1;
  const isOnActiveDrawing = useCallback(
    (entityDrawingId) => {
      if (!activeDrawingId) return true;
      if (!entityDrawingId) return !hasMultipleDrawings;
      return entityDrawingId === activeDrawingId;
    },
    [activeDrawingId, hasMultipleDrawings]
  );

  const weldPointsOnActiveDrawing = useMemo(
    () => weldPoints.filter((w) => isOnActiveDrawing(w.drawingId)),
    [weldPoints, isOnActiveDrawing]
  );

  const spoolMarkersOnActiveDrawing = useMemo(
    () => spoolMarkers.filter((m) => isOnActiveDrawing(m.drawingId)),
    [spoolMarkers, isOnActiveDrawing]
  );

  const partMarkersOnActiveDrawing = useMemo(
    () => partMarkers.filter((m) => isOnActiveDrawing(m.drawingId)),
    [partMarkers, isOnActiveDrawing]
  );

  const lineMarkersOnActiveDrawing = useMemo(
    () => lineMarkers.filter((marker) => isOnActiveDrawing(marker.drawingId)),
    [lineMarkers, isOnActiveDrawing]
  );

  const linesLinkedToActiveDrawing = useMemo(() => {
    if (!activeDrawingId) return [];
    const activeDwg = drawings.find((d) => d.id === activeDrawingId);
    const idsFromDrawing = new Set(
      Array.isArray(activeDwg?.lineIds) ? activeDwg.lineIds.filter(Boolean) : []
    );
    const matched = lines.filter((ln) => {
      const viaLine =
        Array.isArray(ln.drawingIds) && ln.drawingIds.includes(activeDrawingId);
      const viaDrawing = idsFromDrawing.has(ln.id);
      return viaLine || viaDrawing;
    });
    return matched
      .slice()
      .sort((a, b) =>
        (a.name || a.id || "").localeCompare(b.name || b.id || "", undefined, {
          sensitivity: "base",
        })
      );
  }, [lines, activeDrawingId, drawings]);

  const weldsOnCurrentPage = useMemo(
    () => weldPointsOnActiveDrawing.filter((w) => (w.pageNumber ?? 0) === currentPage0),
    [weldPointsOnActiveDrawing, currentPage0]
  );

  const spoolMarkersOnCurrentPage = useMemo(
    () => spoolMarkersOnActiveDrawing.filter((m) => (m.pageNumber ?? 0) === currentPage0),
    [spoolMarkersOnActiveDrawing, currentPage0]
  );

  const partMarkersOnCurrentPage = useMemo(
    () => partMarkersOnActiveDrawing.filter((m) => (m.pageNumber ?? 0) === currentPage0),
    [partMarkersOnActiveDrawing, currentPage0]
  );

  const lineMarkersOnCurrentPage = useMemo(
    () => lineMarkersOnActiveDrawing.filter((marker) => (marker.pageNumber ?? 0) === currentPage0),
    [lineMarkersOnActiveDrawing, currentPage0]
  );

  const spoolIdsOnCurrentPage = useMemo(
    () => [...new Set(spoolMarkersOnCurrentPage.map((m) => m.spoolId).filter(Boolean))],
    [spoolMarkersOnCurrentPage]
  );

  const partIdsOnCurrentPage = useMemo(
    () => [...new Set(partMarkersOnCurrentPage.map((m) => m.partId).filter(Boolean))],
    [partMarkersOnCurrentPage]
  );

  const spoolsOnCurrentPage = useMemo(
    () => spools.filter((s) => spoolIdsOnCurrentPage.includes(s.id)),
    [spools, spoolIdsOnCurrentPage]
  );

  const lineIdsOnCurrentPage = useMemo(
    () =>
      [...new Set([
        ...lineMarkersOnCurrentPage.map((marker) => marker.lineId),
        ...spoolsOnCurrentPage.map((spool) => spool.lineId),
      ].filter(Boolean))],
    [lineMarkersOnCurrentPage, spoolsOnCurrentPage]
  );

  const linesOnCurrentPage = useMemo(
    () => lines.filter((line) => lineIdsOnCurrentPage.includes(line.id)),
    [lines, lineIdsOnCurrentPage]
  );

  const partsOnCurrentPage = useMemo(
    () => parts.filter((p) => partIdsOnCurrentPage.includes(p.id)),
    [parts, partIdsOnCurrentPage]
  );

  const selectedLineIdFromMarker = useMemo(() => {
    if (!selectedLineMarkerId) return null;
    return lineMarkers.find((marker) => marker.id === selectedLineMarkerId)?.lineId || null;
  }, [selectedLineMarkerId, lineMarkers]);

  const handleSaveVisibleSpools = useCallback((newSpools) => {
    const existingVisibleIds = new Set(spoolsOnCurrentPage.map((s) => s.id));
    const nextVisibleIds = new Set((newSpools || []).map((s) => s.id));
    const deletedSpoolIds = [...existingVisibleIds].filter((id) => !nextVisibleIds.has(id));

    setSpools((prev) => {
      const preserved = prev.filter((s) => !existingVisibleIds.has(s.id));
      return [...preserved, ...(newSpools || [])];
    });

    if (deletedSpoolIds.length === 0) return;
    const deletedSet = new Set(deletedSpoolIds);
    setSpoolMarkers((prev) => prev.filter((m) => !deletedSet.has(m.spoolId)));
    setWeldPoints((prev) =>
      prev.map((w) =>
        deletedSet.has(w.spoolId) ? { ...w, spoolId: null } : w
      )
    );
    setParts((prev) =>
      prev.map((p) =>
        deletedSet.has(p.spoolId) ? { ...p, spoolId: null } : p
      )
    );
  }, [spoolsOnCurrentPage]);

  const handleSaveVisibleLines = useCallback((newLines) => {
    const existingVisibleIds = new Set(linesOnCurrentPage.map((line) => line.id));
    const nextVisibleIds = new Set((newLines || []).map((line) => line.id));
    const deletedLineIds = [...existingVisibleIds].filter((id) => !nextVisibleIds.has(id));

    setLines((prev) => {
      const preserved = prev.filter((line) => !existingVisibleIds.has(line.id));
      return [...preserved, ...(newLines || [])];
    });

    if (deletedLineIds.length === 0) return;
    const deletedSet = new Set(deletedLineIds);
    setLineMarkers((prev) => prev.filter((marker) => !deletedSet.has(marker.lineId)));
    setSpools((prev) =>
      prev.map((spool) => (deletedSet.has(spool.lineId) ? { ...spool, lineId: null } : spool))
    );
    setDrawings((prev) =>
      prev.map((drawing) => ({
        ...drawing,
        lineIds: Array.isArray(drawing.lineIds)
          ? drawing.lineIds.filter((lineId) => !deletedSet.has(lineId))
          : [],
      }))
    );
  }, [linesOnCurrentPage]);

  const handleSaveAllSpools = useCallback((newSpools) => {
    const next = newSpools || [];
    const prevIds = new Set(spools.map((s) => s.id));
    const nextIds = new Set(next.map((s) => s.id));
    const deletedSpoolIds = [...prevIds].filter((id) => !nextIds.has(id));

    setSpools(next);

    if (deletedSpoolIds.length === 0) return;
    const deletedSet = new Set(deletedSpoolIds);
    setSpoolMarkers((prev) => prev.filter((m) => !deletedSet.has(m.spoolId)));
    setWeldPoints((prev) =>
      prev.map((w) => (deletedSet.has(w.spoolId) ? { ...w, spoolId: null } : w))
    );
    setParts((prev) =>
      prev.map((p) => (deletedSet.has(p.spoolId) ? { ...p, spoolId: null } : p))
    );
  }, [spools]);

  const handleSaveAllLines = useCallback((newLines) => {
    const next = newLines || [];
    const prevIds = new Set(lines.map((l) => l.id));
    const nextIds = new Set(next.map((l) => l.id));
    const deletedLineIds = [...prevIds].filter((id) => !nextIds.has(id));

    setLines(next);

    if (deletedLineIds.length === 0) return;
    const deletedSet = new Set(deletedLineIds);
    setLineMarkers((prev) => prev.filter((marker) => !deletedSet.has(marker.lineId)));
    setSpools((prev) =>
      prev.map((spool) => (deletedSet.has(spool.lineId) ? { ...spool, lineId: null } : spool))
    );
    setDrawings((prev) =>
      prev.map((drawing) => ({
        ...drawing,
        lineIds: Array.isArray(drawing.lineIds)
          ? drawing.lineIds.filter((lineId) => !deletedSet.has(lineId))
          : [],
      }))
    );
  }, [lines]);

  const handleUpdateDrawing = useCallback((dwgId, updates) => {
    setDrawings((prev) => prev.map((drawing) => (drawing.id === dwgId ? { ...drawing, ...updates } : drawing)));
  }, []);

  const ensureLineLinkedToCurrentDrawing = useCallback((lineId) => {
    if (!activeDrawingId || !lineId) return;
    setDrawings((prev) =>
      prev.map((drawing) => {
        if (drawing.id !== activeDrawingId) return drawing;
        const nextLineIds = Array.isArray(drawing.lineIds) ? drawing.lineIds : [];
        if (nextLineIds.includes(lineId)) return drawing;
        return { ...drawing, lineIds: [...nextLineIds, lineId] };
      })
    );
    setLines((prev) =>
      prev.map((line) =>
        line.id === lineId
          ? {
              ...line,
              drawingIds: Array.isArray(line.drawingIds)
                ? line.drawingIds.includes(activeDrawingId)
                  ? line.drawingIds
                  : [...line.drawingIds, activeDrawingId]
                : [activeDrawingId],
            }
          : line
      )
    );
  }, [activeDrawingId]);

  const addOrMoveLineMarkerOnCurrentPage = useCallback((lineId, coords = null) => {
    if (!lineId) return null;
    const xPercent = coords?.xPercent ?? 50;
    const yPercent = coords?.yPercent ?? 50;
    const pageNumber = currentPage0;
    let markerId = null;
    setLineMarkers((prev) => {
      const existing = prev.find(
        (marker) =>
          marker.lineId === lineId &&
          marker.drawingId === (activeDrawingId ?? null) &&
          (marker.pageNumber ?? 0) === pageNumber
      );
      if (existing) {
        markerId = existing.id;
        return prev.map((marker) =>
          marker.id === existing.id
            ? {
                ...marker,
                xPercent,
                yPercent,
              }
            : marker
        );
      }
      markerId = `lpm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      return [
        ...prev,
        {
          id: markerId,
          lineId,
          drawingId: activeDrawingId ?? null,
          xPercent,
          yPercent,
          indicatorXPercent: Math.min(100, Math.max(0, xPercent + 4)),
          indicatorYPercent: Math.min(100, Math.max(0, yPercent - 4)),
          pageNumber,
        },
      ];
    });
    if (markerId) setPendingLabelId({ type: "line", id: markerId });
    return markerId;
  }, [activeDrawingId, currentPage0, setPendingLabelId]);

  const handleLinkLineToCurrentDrawing = useCallback((lineId) => {
    if (!lineId) return;
    ensureLineLinkedToCurrentDrawing(lineId);
    addOrMoveLineMarkerOnCurrentPage(lineId, null);
  }, [ensureLineLinkedToCurrentDrawing, addOrMoveLineMarkerOnCurrentPage]);

  const selectionScrollKey = [
    selectedWeldId,
    selectedSpoolMarkerId,
    selectedPartMarkerId,
    selectedLineMarkerId,
  ]
    .filter(Boolean)
    .join("|");

  const scrollToTarget = useMemo(() => {
    if (selectedWeldId) {
      const w = weldPoints.find((x) => x.id === selectedWeldId);
      if (w && w.pageNumber != null) return { pageNumber: w.pageNumber, xPercent: w.xPercent ?? 50, yPercent: w.yPercent ?? 50 };
    }
    if (selectedSpoolMarkerId) {
      const m = spoolMarkers.find((x) => x.id === selectedSpoolMarkerId);
      if (m && m.pageNumber != null) return { pageNumber: m.pageNumber, xPercent: m.xPercent ?? 50, yPercent: m.yPercent ?? 50 };
    }
    if (selectedPartMarkerId) {
      const m = partMarkers.find((x) => x.id === selectedPartMarkerId);
      if (m && m.pageNumber != null) return { pageNumber: m.pageNumber, xPercent: m.xPercent ?? 50, yPercent: m.yPercent ?? 50 };
    }
    if (selectedLineMarkerId) {
      const marker = lineMarkers.find((item) => item.id === selectedLineMarkerId);
      if (marker && marker.pageNumber != null) return { pageNumber: marker.pageNumber, xPercent: marker.xPercent ?? 50, yPercent: marker.yPercent ?? 50 };
    }
    return null;
  }, [selectionScrollKey]); // eslint-disable-line react-hooks/exhaustive-deps -- scroll only when selection id changes, not when dragging markers

  const settingsStructureIntegration = useMemo(
    () => ({
      ...(pdfBlob
        ? {
            drawings: {
              drawings,
              activeDrawingId,
              lines,
              onSwitchDrawing: handleSwitchDrawing,
              onAddDrawing: loadPdfFile,
              onUpdateDrawing: handleUpdateDrawing,
              onDeleteDrawing: handleDeleteDrawing,
            },
            lines: {
              lines,
              allLines: lines,
              spools,
              drawingSettings,
              onSaveLines: handleSaveAllLines,
              onSaveSpools: handleSaveAllSpools,
              onLinkLineToCurrentPage: handleLinkLineToCurrentDrawing,
              appMode,
            },
            spools: {
              spools,
              parts,
              spoolMarkers,
              weldPoints,
              weldStatusByWeldId,
              getWeldName,
              lines,
              onSave: handleSaveAllSpools,
              onAssignWeldToSpool: handleAssignWeldToSpool,
              onAssignPartToSpool: handleAssignPartToSpool,
              appMode,
            },
          }
        : {}),
      welds: {
        weldPoints,
        weldStatusByWeldId,
        getWeldName,
        spools,
        parts,
        lines,
        personnel,
        wpsLibrary,
        electrodeLibrary,
        drawingSettings,
        appMode,
        ndtAutoLabel: formatNdtRequirements(drawingSettings.ndtRequirements),
        onSave: handleSaveWeldFromSettings,
        onDelete: handleDeleteWeldFromSettings,
        onUpdatePartHeat: handleUpdatePartHeat,
      },
    }),
    [
      pdfBlob,
      drawings,
      activeDrawingId,
      lines,
      handleSwitchDrawing,
      loadPdfFile,
      handleUpdateDrawing,
      handleDeleteDrawing,
      spools,
      handleSaveAllLines,
      handleSaveAllSpools,
      handleLinkLineToCurrentDrawing,
      appMode,
      parts,
      spoolMarkers,
      weldPoints,
      weldStatusByWeldId,
      handleAssignWeldToSpool,
      handleAssignPartToSpool,
      drawingSettings,
      personnel,
      wpsLibrary,
      electrodeLibrary,
      handleSaveWeldFromSettings,
      handleDeleteWeldFromSettings,
      handleUpdatePartHeat,
    ]
  );

  return (
    <NdtScopeProvider systems={systems} lines={lines} spools={spools} parts={parts}>
    <div className="md:container md:mx-auto p-0 md:p-4">
      <>
        <OfflineBanner />
        {(storageAlerts.indexeddb || storageAlerts.sessionDraft) && (
          <div className="space-y-2 mb-2" role="status">
            {storageAlerts.indexeddb ? (
              <div className="alert alert-warning shadow-sm py-2 px-3 text-sm flex flex-row flex-wrap items-center gap-2">
                <span className="flex-1 min-w-0">{storageAlerts.indexeddb}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs shrink-0"
                  onClick={() =>
                    setStorageAlerts((s) => (s.indexeddb ? { ...s, indexeddb: null } : s))
                  }
                >
                  Dismiss
                </button>
              </div>
            ) : null}
            {storageAlerts.sessionDraft ? (
              <div className="alert alert-warning shadow-sm py-2 px-3 text-sm flex flex-row flex-wrap items-center gap-2">
                <span className="flex-1 min-w-0">{storageAlerts.sessionDraft}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs shrink-0"
                  onClick={() =>
                    setStorageAlerts((s) => (s.sessionDraft ? { ...s, sessionDraft: null } : s))
                  }
                >
                  Dismiss
                </button>
              </div>
            ) : null}
          </div>
        )}
        <Toolbar
          hasPdf={!!pdfBlob}
          hasWelds={weldPoints.length > 0}
          onLoadPdf={loadPdfFile}
          onLoadProject={handleLoadProject}
          onSaveProject={handleSaveProject}
          onExportExcel={handleExportExcel}
          onOpenParameters={() => setShowParameters(true)}
          onOpenProjects={() => setShowProjects(true)}
          onOpenNdt={() => {
            setShowStatusPage(false);
            setShowHealthPage(false);
            setShowNdtPanel(true);
          }}
          onOpenStatus={() => {
            setShowNdtPanel(false);
            setShowHealthPage(false);
            setShowStatusPage(true);
          }}
          onOpenHealth={() => {
            setShowNdtPanel(false);
            setShowStatusPage(false);
            setShowHealthPage(true);
          }}
          onPrint={() => setShowPrintModal(true)}
          onPersistSessionDraft={persistSessionDraftToStorage}
        />
      </>

      {!appReady ? (
        <div className="flex min-h-[50vh] w-full items-center justify-center rounded-lg border border-base-300/50 bg-base-100">
          <span className="loading loading-lg loading-spinner text-primary" aria-label="Loading" />
        </div>
      ) : showStatusPage ? (
        <div className="flex-1 min-h-0 flex flex-col rounded-lg overflow-hidden shadow bg-base-100">
          <StatusPage
            weldPoints={weldPoints}
            drawingSettings={drawingSettings}
            spools={spools}
            onSpoolsChange={setSpools}
            getWeldName={getWeldName}
            onSelectWeld={(weldId) => {
              setSelectedWeldId(weldId);
              setSelectedSpoolMarkerId(null);
              setSelectedPartMarkerId(null);
              setSelectedLineMarkerId(null);
              setFormWeld(weldPoints.find((w) => w.id === weldId) ?? null);
              setActiveSidePanel("welds");
              setShowStatusPage(false);
            }}
            onClose={() => setShowStatusPage(false)}
          />
        </div>
      ) : showHealthPage ? (
        <div className="flex-1 min-h-0 flex flex-col rounded-lg overflow-hidden shadow bg-base-100">
          <ProjectHealthPage
            weldPoints={weldPoints}
            drawings={drawings}
            spools={spools}
            parts={parts}
            lines={lines}
            systems={systems}
            personnel={personnel}
            wpsLibrary={wpsLibrary}
            electrodeLibrary={electrodeLibrary}
            drawingSettings={drawingSettings}
            projectMeta={projectMeta}
            partMarkers={partMarkers}
            spoolMarkers={spoolMarkers}
            lineMarkers={lineMarkers}
            getWeldName={getWeldName}
            onOpenParameters={() => setShowParameters(true)}
            onSelectWeld={(weldId) => {
              setSelectedWeldId(weldId);
              setSelectedSpoolMarkerId(null);
              setSelectedPartMarkerId(null);
              setSelectedLineMarkerId(null);
              setFormWeld(weldPoints.find((w) => w.id === weldId) ?? null);
              setActiveSidePanel("welds");
              setShowHealthPage(false);
            }}
            onClose={() => setShowHealthPage(false)}
          />
        </div>
      ) : showNdtPanel ? (
        <div className="flex-1 min-h-0 flex flex-col rounded-lg overflow-hidden shadow bg-base-100">
          <NdtKanbanPage
            ndtRequests={ndtRequests}
            ndtReports={ndtReports}
            setNdtRequests={setNdtRequests}
            setNdtReports={setNdtReports}
            weldPoints={weldPoints}
            setWeldPoints={setWeldPoints}
            drawingSettings={drawingSettings}
            getWeldName={getWeldName}
            onClose={() => setShowNdtPanel(false)}
          />
        </div>
      ) : (
        <>
          {pdfBlob && (
            <div className="hidden md:block">
              <DashboardAnalytics
                weldPoints={weldPoints}
                weldStatusByWeldId={weldStatusByWeldId}
                spools={spools}
                drawings={drawings}
                lines={lines}
                systems={systems}
                parts={parts}
              />
            </div>
          )}

          <div className="relative flex gap-0 items-stretch md:rounded-lg overflow-hidden md:shadow bg-base-100 h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-10rem)] min-h-0">
            {showProjectHub && !pdfBlob ? (
              <ProjectSetupHub
                onNewProject={handleBeginNewProject}
                onOpenSavedProjects={() => setShowProjects(true)}
                onLoadProjectFile={handleLoadProject}
                onSkipToWorkspace={() => setShowProjectHub(false)}
                projectFileInputRef={hubProjectFileInputRef}
              />
            ) : pdfBlob ? (
              <>
                {pdfBlob && (
                  <div
                    className="absolute z-20 flex flex-col gap-3 pointer-events-none items-start"
                    style={{ left: `${floatingToolbarPos.x}px`, top: `${floatingToolbarPos.y}px` }}
                  >
                    <div className="pointer-events-auto shrink-0 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-base-200/70 backdrop-blur-md border border-base-300/50 shadow-sm w-fit">
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost h-7 min-h-7 w-7 p-0 cursor-grab active:cursor-grabbing"
                        title="Drag toolbar"
                        aria-label="Drag toolbar"
                        onPointerDown={(e) => {
                          if (e.button !== 0 && e.pointerType === "mouse") return;
                          e.preventDefault();
                          floatingToolbarDragRef.current = {
                            startX: floatingToolbarPos.x,
                            startY: floatingToolbarPos.y,
                            pointerStartX: e.clientX,
                            pointerStartY: e.clientY,
                          };
                        }}
                      >
                        ::
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost h-7 min-h-7 w-7 p-0"
                        onClick={() => setIsFloatingToolbarCollapsed((value) => !value)}
                        aria-label={isFloatingToolbarCollapsed ? "Expand toolbar" : "Collapse toolbar"}
                        title={isFloatingToolbarCollapsed ? "Expand toolbar" : "Collapse toolbar"}
                      >
                        {isFloatingToolbarCollapsed ? "▸" : "▾"}
                      </button>
                      {isFloatingToolbarCollapsed ? (
                        <button
                          type="button"
                          className={`btn btn-xs ${appMode === "inspection" ? "btn-warning" : "btn-ghost"}`}
                          onClick={() => handleModeChange(appMode === "inspection" ? "edition" : "inspection")}
                          title={appMode === "inspection" ? "Locked (inspection)" : "Unlocked (edition)"}
                        >
                          {appMode === "inspection" ? "Locked" : "Tools"}
                        </button>
                      ) : (
                        <>
                          <MarkupToolbar
                            markupTool={markupTool}
                            onToolChange={handleToolChange}
                            appMode={appMode}
                            onModeChange={handleModeChange}
                            className="!p-0 !bg-transparent !border-0 !shadow-none"
                          />
                          <span className="w-px h-5 bg-base-300/60 shrink-0 hidden md:block" aria-hidden />
                          <div className="hidden md:flex items-center gap-0">
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost h-7 min-h-7 w-7 p-0"
                              onClick={() => setPdfScale((s) => Math.max(0.5, s - 0.25))}
                              disabled={pdfScale <= 0.5}
                              aria-label="Zoom out"
                              title="Zoom out"
                            >
                              −
                            </button>
                            <span className="text-xs tabular-nums min-w-[2.5rem] text-center text-base-content/70">
                              {Math.round(pdfScale * 100)}%
                            </span>
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost h-7 min-h-7 w-7 p-0"
                              onClick={() => setPdfScale((s) => Math.min(2.5, s + 0.25))}
                              disabled={pdfScale >= 2.5}
                              aria-label="Zoom in"
                              title="Zoom in"
                            >
                              +
                            </button>
                          </div>
                          <details className="dropdown dropdown-end hidden md:block">
                            <summary className="btn btn-xs btn-ghost h-7 min-h-7 gap-1 list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                              Markers
                              {markerLayers.welds &&
                              markerLayers.spools &&
                              markerLayers.parts &&
                              markerLayers.lines
                                ? ""
                                : "…"}
                            </summary>
                            <div className="dropdown-content z-[100] mt-1 w-52 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
                              <p className="px-1 pb-1 text-[10px] font-medium uppercase tracking-wide text-base-content/50">
                                Show on drawing
                              </p>
                              {(
                                [
                                  ["welds", "Welds"],
                                  ["spools", "Spools"],
                                  ["parts", "Parts"],
                                  ["lines", "Lines"],
                                ]
                              ).map(([key, label]) => (
                                <label
                                  key={key}
                                  className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs hover:bg-base-200"
                                >
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-xs"
                                    checked={markerLayers[key]}
                                    onChange={() =>
                                      setMarkerLayers((prev) => ({ ...prev, [key]: !prev[key] }))
                                    }
                                  />
                                  {label}
                                </label>
                              ))}
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs mt-2 w-full"
                                onClick={() =>
                                  setMarkerLayers({
                                    welds: true,
                                    spools: true,
                                    parts: true,
                                    lines: true,
                                  })
                                }
                              >
                                Show all
                              </button>
                            </div>
                          </details>
                          {numPdfPages != null && numPdfPages > 1 && (
                            <>
                              <span className="w-px h-5 bg-base-300/60 shrink-0 ml-1" aria-hidden />
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-ghost h-7 min-h-7 w-7 p-0"
                                  onClick={() => handleManualPageSelect((p) => Math.max(1, p - 1))}
                                  disabled={pdfPage <= 1}
                                  aria-label="Previous page"
                                >
                                  ‹
                                </button>
                                <span className="text-xs tabular-nums min-w-[2.5rem] text-center">
                                  {pdfPage}/{numPdfPages}
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-ghost h-7 min-h-7 w-7 p-0"
                                  onClick={() => handleManualPageSelect((p) => Math.min(numPdfPages, p + 1))}
                                  disabled={pdfPage >= numPdfPages}
                                  aria-label="Next page"
                                >
                                  ›
                                </button>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    {!isFloatingToolbarCollapsed && appMode === "edition" && markupTool !== "select" && (
                      <div className="pointer-events-auto shrink-0">
                        <AddDefaultsBar
                          markupTool={markupTool}
                          addDefaults={addDefaults}
                          onAddDefaultsChange={setAddDefaults}
                          spools={spoolsOnCurrentPage}
                          lines={lines}
                          linesForSpoolDefault={linesOnCurrentPage}
                          systems={systems}
                          className="shadow-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
                <div className="flex">
                  <PageThumbnailPanel
                    pdfBlob={pdfBlob}
                    numPages={numPdfPages}
                    currentPage={pdfPage}
                    onPageSelect={handleManualPageSelect}
                    weldPoints={weldPointsOnActiveDrawing}
                    spoolMarkers={spoolMarkersOnActiveDrawing}
                    partMarkers={partMarkersOnActiveDrawing}
                    isOpen={showPagePanel}
                    onToggle={() => setShowPagePanel((v) => !v)}
                  />
                </div>
                <div className="flex-1 min-w-0 min-h-0 relative">
                  <PDFViewerDynamic
                    key={pdfViewerKey}
                    pdfBlob={pdfBlob}
                    scale={pdfScale}
                    currentPage={pdfPage}
                    onScaleChange={setPdfScale}
                    onPageChange={setPdfPage}
                    onNumPages={setNumPdfPages}
                    onPageClick={handlePageClick}
                    containerRef={containerRef}
                    weldPoints={weldPointsOnActiveDrawing}
                    selectedWeldId={selectedWeldId}
                    onWeldClick={handleWeldClick}
                    onWeldDoubleClick={handleWeldDoubleClick}
                    appMode={appMode}
                    markupTool={markupTool}
                    onMoveWeldPoint={handleMoveWeldPoint}
                    onMoveIndicator={handleMoveIndicator}
                    onResizeLabel={handleResizeLabel}
                    onMoveLineBend={handleMoveLineBend}
                    lineMarkers={lineMarkersOnActiveDrawing}
                    lines={lines}
                    selectedLineMarkerId={selectedLineMarkerId}
                    onLineMarkerClick={handleLineMarkerClick}
                    onMoveLineMarker={handleMoveLineMarker}
                    onMoveLineIndicator={handleMoveLineIndicator}
                    spoolMarkers={spoolMarkersOnActiveDrawing}
                    spools={spools}
                    selectedSpoolMarkerId={selectedSpoolMarkerId}
                    onSpoolMarkerClick={handleSpoolMarkerClick}
                    onMoveSpoolMarker={handleMoveSpoolMarker}
                    onMoveSpoolIndicator={handleMoveSpoolIndicator}
                    onDeleteSpoolMarker={handleDeleteSpoolMarker}
                    weldStatusByWeldId={weldStatusByWeldId}
                    partMarkers={partMarkersOnActiveDrawing}
                    parts={parts}
                    selectedPartMarkerId={selectedPartMarkerId}
                    onPartMarkerClick={handlePartMarkerClick}
                    onMovePartMarker={handleMovePartMarker}
                    onMovePartIndicator={handleMovePartIndicator}
                    onDeletePartMarker={handleDeletePartMarker}
                    scrollToTarget={scrollToTarget}
                    markerLayers={markerLayers}
                    pendingLabelId={pendingLabelId}
                    onPendingLabelMove={handlePendingLabelMove}
                  />
                </div>
                {/* Resize handle - visible splitter between content and side panel */}
                {!anySidePanelOpen ? null : (
                  <div
                    className="hidden md:flex w-3 flex-shrink-0 cursor-col-resize flex-col items-center justify-center bg-base-300 hover:bg-primary/40 active:bg-primary/60 transition-colors select-none border-l border-base-300"
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      e.preventDefault();
                      try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch (_) {}
                      sidePanelResizeRef.current = {
                        startX: e.clientX,
                        startWidth: sidePanelWidth,
                      };
                    }}
                    onPointerUp={(e) => {
                      try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch (_) {}
                    }}
                    role="separator"
                    aria-label="Resize side panel"
                    title="Drag to resize side panel"
                  >
                    <div className="flex flex-col gap-1 py-2">
                      <span className="w-0.5 h-1 rounded-full bg-base-content/30" />
                      <span className="w-0.5 h-1 rounded-full bg-base-content/30" />
                      <span className="w-0.5 h-1 rounded-full bg-base-content/30" />
                    </div>
                  </div>
                )}
                {/* Desktop side panel */}
                <div
                  className="hidden md:flex flex-shrink-0 flex-col h-full min-h-0 overflow-hidden transition-[width] duration-200 ease-out border-l border-base-300"
                  data-print-hide
                  style={{
                    width: anySidePanelOpen ? sidePanelWidth : 56,
                    minWidth: anySidePanelOpen ? undefined : 56,
                  }}
                >
                  <div
                    className={`flex flex-1 min-w-0 min-h-0 h-full overflow-hidden transition-all duration-300 ease-out ${
                      anySidePanelOpen ? "flex-row items-stretch" : "flex-col"
                    }`}
                    style={{ minHeight: 0 }}
                  >
                    <nav
                      className={`flex flex-col shrink-0 border-r border-base-300 bg-base-100 divide-y divide-base-300/60 overflow-y-auto overflow-x-hidden ${
                        anySidePanelOpen ? "w-11" : "w-full"
                      }`}
                      aria-label="Side panels"
                    >
                      <SidePanelTabButton
                        label="Dwg"
                        title="Drawings"
                        active={activeSidePanel === "drawings"}
                        onClick={() =>
                          setActiveSidePanel((p) => (p === "drawings" ? null : "drawings"))
                        }
                      />
                      <SidePanelTabButton
                        label="Line"
                        title="Lines"
                        active={activeSidePanel === "lines"}
                        onClick={() =>
                          setActiveSidePanel((p) => (p === "lines" ? null : "lines"))
                        }
                      />
                      <SidePanelTabButton
                        label="Spool"
                        title="Spools"
                        active={activeSidePanel === "spools"}
                        onClick={() =>
                          setActiveSidePanel((p) => (p === "spools" ? null : "spools"))
                        }
                      />
                      <SidePanelTabButton
                        label="Weld"
                        title="Welds"
                        active={activeSidePanel === "welds"}
                        onClick={() =>
                          setActiveSidePanel((p) => (p === "welds" ? null : "welds"))
                        }
                      />
                      <SidePanelTabButton
                        label="Part"
                        title="Parts"
                        active={activeSidePanel === "parts"}
                        onClick={() =>
                          setActiveSidePanel((p) => (p === "parts" ? null : "parts"))
                        }
                      />
                    </nav>
                    {anySidePanelOpen ? (
                      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-base-200">
                        {activeSidePanel === "drawings" ? (
                          <SidePanelDrawings
                            hideHeader
                            drawings={drawings}
                            activeDrawingId={activeDrawingId}
                            lines={lines}
                            isOpen
                            onToggle={() => {}}
                            onSwitchDrawing={handleSwitchDrawing}
                            onAddDrawing={loadPdfFile}
                            onUpdateDrawing={handleUpdateDrawing}
                            onDeleteDrawing={handleDeleteDrawing}
                          />
                        ) : null}
                        {activeSidePanel === "lines" ? (
                          <SidePanelLines
                            hideHeader
                            systems={systems}
                            lines={linesOnCurrentPage}
                            selectedLineId={selectedLineIdFromMarker}
                            allLines={lines}
                            spools={spoolsOnCurrentPage}
                            drawingSettings={drawingSettings}
                            isOpen
                            onToggle={() => {}}
                            onSaveLines={handleSaveVisibleLines}
                            onLinkLineToCurrentPage={handleLinkLineToCurrentDrawing}
                            onSaveSpools={handleSaveVisibleSpools}
                            appMode={appMode}
                            systemsManagedExternally
                          />
                        ) : null}
                        {activeSidePanel === "spools" ? (
                          <SidePanelSpools
                            hideHeader
                            spools={spoolsOnCurrentPage}
                            isOpen
                            onToggle={() => {}}
                            onSave={handleSaveVisibleSpools}
                            onAssignWeldToSpool={handleAssignWeldToSpool}
                            onAssignPartToSpool={handleAssignPartToSpool}
                            parts={partsOnCurrentPage}
                            spoolMarkers={spoolMarkersOnCurrentPage}
                            appMode={appMode}
                            weldPoints={weldsOnCurrentPage}
                            weldStatusByWeldId={weldStatusByWeldId}
                            getWeldName={getWeldName}
                            lines={linesOnCurrentPage}
                          />
                        ) : null}
                        {activeSidePanel === "welds" ? (
                          <SidePanelWeldForm
                            hideHeader
                            weldPoints={weldsOnCurrentPage}
                            weldStatusByWeldId={weldStatusByWeldId}
                            weld={formWeld}
                            selectedWeldId={selectedWeldId}
                            isOpen
                            onToggle={() => {}}
                            onSelectWeld={(w) => {
                              setFormWeld(w);
                              setSelectedWeldId(w.id);
                            }}
                            onBackToList={handleBackToList}
                            onSave={handleSaveWeld}
                            onDelete={handleDeleteWeld}
                            appMode={appMode}
                            spools={spoolsOnCurrentPage}
                            parts={parts}
                            onUpdatePartHeat={handleUpdatePartHeat}
                            personnel={personnel}
                            wpsLibrary={wpsLibrary}
                            electrodeLibrary={electrodeLibrary}
                            ndtAutoLabel={formatNdtRequirements(drawingSettings.ndtRequirements)}
                            drawingSettings={drawingSettings}
                          />
                        ) : null}
                        {activeSidePanel === "parts" ? (
                          <SidePanelPartForm
                            hideHeader
                            parts={partsOnCurrentPage}
                            partMarkers={partMarkersOnCurrentPage}
                            spools={spoolsOnCurrentPage}
                            documents={documents}
                            materialCertificates={materialCertificates}
                            selectedPartMarkerId={selectedPartMarkerId}
                            isOpen
                            onToggle={() => {}}
                            onSelectPartMarker={setSelectedPartMarkerId}
                            onSavePart={handleSavePart}
                            onSaveDocuments={setDocuments}
                            onSaveMaterialCertificates={setMaterialCertificates}
                            onDeletePart={handleDeletePart}
                            appMode={appMode}
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 w-full min-h-0 flex-col items-center justify-center py-16 px-4">
                <input
                  ref={emptyStatePdfInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) loadPdfFile(file);
                    e.target.value = "";
                  }}
                />
                <input
                  ref={emptyStateProjectInputRef}
                  type="file"
                  accept=".weldproject,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLoadProject(file);
                    e.target.value = "";
                  }}
                />
                <div className="max-w-md w-full text-center space-y-8">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-base-content">
                      {projectMeta?.projectName?.trim()
                        ? `${projectMeta.projectName.trim()} — load a drawing`
                        : "No drawing loaded"}
                    </h2>
                    <p className="text-base-content/70 text-sm leading-relaxed">
                      Load a PDF drawing or open a saved project to start marking weld points and recording details.
                    </p>
                    <button
                      type="button"
                      className="link link-hover text-sm text-primary/90"
                      onClick={() => setShowProjectHub(true)}
                    >
                      Project setup — open file, saved projects, or new wizard
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      type="button"
                      className="btn btn-primary gap-2"
                      onClick={() => emptyStatePdfInputRef.current?.click()}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Load PDF
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline gap-2"
                      onClick={() => emptyStateProjectInputRef.current?.click()}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                      </svg>
                      Open project
                    </button>
                  </div>
                  <p className="text-xs text-base-content/50">
                    Then click on the drawing to add weld points, spools, and parts.
                  </p>
                  <Link
                    href="/catalog"
                    className="link link-hover text-sm text-primary/90"
                  >
                    Browse part catalog →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Mobile bottom sheet for welds/spools/parts */}
      {pdfBlob && !showStatusPage && !showHealthPage && !showNdtPanel && (
        <>
          {!mobileSheetOpen && (
            <button
              type="button"
              className="md:hidden fixed bottom-5 right-5 z-40 btn btn-circle btn-primary shadow-lg w-14 h-14"
              onClick={() => setMobileSheetOpen(true)}
              aria-label="Open welds panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <BottomSheet
            isOpen={mobileSheetOpen}
            onClose={() => setMobileSheetOpen(false)}
            activeTab={mobileSheetTab}
            onTabChange={setMobileSheetTab}
          >
            {mobileSheetTab === "drawings" && (
              <SidePanelDrawings
                drawings={drawings}
                activeDrawingId={activeDrawingId}
                lines={lines}
                isOpen={true}
                onToggle={() => {}}
                onSwitchDrawing={handleSwitchDrawing}
                onAddDrawing={loadPdfFile}
                onUpdateDrawing={handleUpdateDrawing}
                onDeleteDrawing={handleDeleteDrawing}
                isStacked={false}
                hideHeader
              />
            )}
            {mobileSheetTab === "lines" && (
              <SidePanelLines
                systems={systems}
                lines={linesOnCurrentPage}
                selectedLineId={selectedLineIdFromMarker}
                allLines={lines}
                spools={spoolsOnCurrentPage}
                drawingSettings={drawingSettings}
                isOpen={true}
                onToggle={() => {}}
                onSaveLines={handleSaveVisibleLines}
                onLinkLineToCurrentPage={handleLinkLineToCurrentDrawing}
                onSaveSpools={handleSaveVisibleSpools}
                appMode={appMode}
                systemsManagedExternally
                isStacked={false}
                hideHeader
              />
            )}
            {mobileSheetTab === "spools" && (
              <SidePanelSpools
                spools={spoolsOnCurrentPage}
                isOpen={true}
                onToggle={() => {}}
                isStacked={false}
                hideHeader
                onSave={handleSaveVisibleSpools}
                onAssignWeldToSpool={handleAssignWeldToSpool}
                onAssignPartToSpool={handleAssignPartToSpool}
                parts={partsOnCurrentPage}
                spoolMarkers={spoolMarkersOnCurrentPage}
                appMode={appMode}
                weldPoints={weldsOnCurrentPage}
                weldStatusByWeldId={weldStatusByWeldId}
                getWeldName={getWeldName}
                lines={linesOnCurrentPage}
              />
            )}
            {mobileSheetTab === "welds" && (
              <SidePanelWeldForm
                weldPoints={weldsOnCurrentPage}
                weldStatusByWeldId={weldStatusByWeldId}
                weld={formWeld}
                selectedWeldId={selectedWeldId}
                isOpen={true}
                onToggle={() => {}}
                onSelectWeld={(w) => {
                  setFormWeld(w);
                  setSelectedWeldId(w.id);
                }}
                onBackToList={handleBackToList}
                onSave={handleSaveWeld}
                onDelete={handleDeleteWeld}
                appMode={appMode}
                spools={spoolsOnCurrentPage}
                parts={parts}
                onUpdatePartHeat={handleUpdatePartHeat}
                personnel={personnel}
                wpsLibrary={wpsLibrary}
                electrodeLibrary={electrodeLibrary}
                ndtAutoLabel={formatNdtRequirements(drawingSettings.ndtRequirements)}
                drawingSettings={drawingSettings}
                isStacked={false}
                hideHeader
              />
            )}
            {mobileSheetTab === "parts" && (
              <SidePanelPartForm
                parts={partsOnCurrentPage}
                partMarkers={partMarkersOnCurrentPage}
                spools={spoolsOnCurrentPage}
                documents={documents}
                materialCertificates={materialCertificates}
                selectedPartMarkerId={selectedPartMarkerId}
                isOpen={true}
                onToggle={() => {}}
                onSelectPartMarker={setSelectedPartMarkerId}
                onSavePart={handleSavePart}
                onSaveDocuments={setDocuments}
                onSaveMaterialCertificates={setMaterialCertificates}
                onDeletePart={handleDeletePart}
                appMode={appMode}
                isStacked={false}
                hideHeader
              />
            )}
          </BottomSheet>
        </>
      )}

      <ModalSettings
        isOpen={showParameters}
        onClose={() => setShowParameters(false)}
        settings={drawingSettings}
        personnel={personnel}
        systems={systems}
        projectSettings={projectSettings}
        projectMeta={projectMeta}
        wpsLibrary={wpsLibrary}
        electrodeLibrary={electrodeLibrary}
        documents={documents}
        materialCertificates={materialCertificates}
        ndtReports={ndtReports}
        ndtRequests={ndtRequests}
        lines={lines}
        spools={spools}
        parts={parts}
        drawings={drawings}
        weldPoints={weldPoints}
        structureIntegration={settingsStructureIntegration}
        onSave={({
          drawingSettings: s,
          personnel: p,
          projectSettings: ps,
          projectMeta: pm,
          systems: sys,
          wpsLibrary: wps,
          electrodeLibrary: electrodes,
          documents: docs,
          materialCertificates: mc,
          ndtReports: nr,
          ndtRequests: nreq,
          weldPoints: wp,
        }) => {
          if (s != null) setDrawingSettings(s);
          if (p != null) setPersonnel(p);
          if (ps != null) setProjectSettings(ps);
          if (pm != null) setProjectMeta(pm);
          if (sys != null) setSystems(sys);
          if (wps != null) setWpsLibrary(wps);
          if (electrodes != null) setElectrodeLibrary(electrodes);
          if (docs != null) setDocuments(docs);
          if (mc != null) setMaterialCertificates(mc);
          if (nr != null) setNdtReports(nr);
          if (nreq != null) setNdtRequests(nreq);
          if (wp != null) setWeldPoints(wp);
        }}
      />

      <ModalProjects
        isOpen={showProjects}
        onClose={() => setShowProjects(false)}
        onOpenProject={handleOpenProjectFromStorage}
      />

      <ModalPrintDynamic
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        onPrint={handlePrint}
        hasPdf={!!pdfBlob}
        hasWelds={weldPoints.length > 0}
        hasSpools={spools.length > 0}
        hasParts={parts.length > 0}
      />

      <ProjectSetupWizard
        isOpen={showSetupWizard}
        onClose={handleWizardClose}
        onComplete={handleWizardComplete}
        onRequestLoadPdf={handleRequestWizardLoadPdf}
      />
    </div>
    </NdtScopeProvider>
  );
}
