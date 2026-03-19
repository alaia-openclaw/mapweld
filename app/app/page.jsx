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
import ModalParameters from "@/components/ModalParameters";
import ModalProjects from "@/components/ModalProjects";
import NdtKanbanPage from "@/components/NdtKanbanPage";
import StatusPage from "@/components/StatusPage";
import PageThumbnailPanel from "@/components/PageThumbnailPanel";
import OfflineBanner from "@/components/OfflineBanner";
import BottomSheet from "@/components/BottomSheet";
import {
  saveProject,
  loadProject,
  PROJECT_FILE_VERSION,
  migrateDrawingSettings,
} from "@/lib/project-file";
import {
  saveProject as saveToIndexedDB,
  generateProjectId,
} from "@/lib/offline-storage";
import { createDefaultWeld, createDefaultSpool, createDefaultPart, createDefaultDrawing } from "@/lib/defaults";
import { partCatalog, findCatalogEntry } from "@/lib/part-catalog";
import { findEntryByHierarchy } from "@/lib/catalog-hierarchy";
import { getWeldName, getWeldOverallStatus, computeNdtSelection } from "@/lib/weld-utils";
import { formatNdtRequirements, NDT_REPORT_STATUS } from "@/lib/constants";
import { exportWeldsToExcel } from "@/lib/excel-export";
import { applyReportToWelds } from "@/lib/ndt-utils";
import { saveDraftToSession, loadDraftFromSession } from "@/lib/session-draft";

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
  const [showWeldPanel, setShowWeldPanel] = useState(false);
  const [showSpoolPanel, setShowSpoolPanel] = useState(false);
  const [showParameters, setShowParameters] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showNdtPanel, setShowNdtPanel] = useState(false);
  const [showStatusPage, setShowStatusPage] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [spoolMarkers, setSpoolMarkers] = useState([]);
  const [parts, setParts] = useState([]);
  const [partMarkers, setPartMarkers] = useState([]);
  const [selectedPartMarkerId, setSelectedPartMarkerId] = useState(null);
  const [showPartPanel, setShowPartPanel] = useState(false);
  const [showDrawingPanel, setShowDrawingPanel] = useState(false);
  const [showLinePanel, setShowLinePanel] = useState(false);
  const [personnel, setPersonnel] = useState({ fitters: [], welders: [], wqrs: [] });
  const [ndtRequests, setNdtRequests] = useState([]);
  const [ndtReports, setNdtReports] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [activeDrawingId, setActiveDrawingId] = useState(null);
  const [systems, setSystems] = useState([]);
  const [lines, setLines] = useState([]);
  const [projectSettings, setProjectSettings] = useState({ steps: [] });
  const [projectMeta, setProjectMeta] = useState({ projectName: "", client: "", spec: "", revision: "", date: "" });
  const [addDefaults, setAddDefaults] = useState({
    spoolId: null,
    weldLocation: "shop",
    catalogCategory: "",
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
  const [showOverlay, setShowOverlay] = useState(true);
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
      setWeldPoints([]);
      setSpools([]);
      setSpoolMarkers([]);
      setParts([]);
      setPartMarkers([]);
      setSelectedPartMarkerId(null);
      setPersonnel({ fitters: [], welders: [], wqrs: [] });
      setDrawingSettings({ ndtRequirements: [], weldingSpec: "" });
      setNdtRequests([]);
      setNdtReports([]);
      setProjectId(generateProjectId());
    }
    setSelectedWeldId(null);
    setSelectedSpoolMarkerId(null);
    setSelectedPartMarkerId(null);
    setFormWeld(null);
  }, [pdfBlob, drawings]);

  /** Stable key for PDF viewer remount — avoid undefined access on Blob without name */
  const pdfViewerKey =
    !pdfBlob ? "no-pdf" : typeof pdfBlob === "string" ? pdfBlob : `${pdfBlob.name || "file"}-${pdfBlob.lastModified || 0}`;

  const handleModeChange = useCallback((mode) => {
    setAppMode(mode);
    if (mode === "inspection") setFormWeld(null);
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
        const sameType = prev.filter((w) => (w.weldLocation || "shop") === loc);
        const maxNum = sameType.reduce((m, w) => Math.max(m, w.weldNumber ?? 0), 0);
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
      let newSpool;
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
        newSpool = createDefaultSpool({ name: `SP-${nextLetter}` });
        return [...prev, newSpool];
      });
      const newMarkerId = `spm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newMarker = {
        id: newMarkerId,
        spoolId: null,
        drawingId: activeDrawingId ?? null,
        xPercent,
        yPercent,
        indicatorXPercent: xPercent,
        indicatorYPercent: yPercent,
        pageNumber: pageNumber ?? 0,
      };
      setSpoolMarkers((prev) => [
        ...prev,
        { ...newMarker, spoolId: newSpool.id },
      ]);
      setPendingLabelId({ type: "spool", id: newMarkerId });
    },
    [activeDrawingId, setPendingLabelId]
  );

  const handleDeleteSpoolMarker = useCallback((markerId) => {
    setSpoolMarkers((prev) => prev.filter((m) => m.id !== markerId));
    setSelectedSpoolMarkerId(null);
  }, []);

  const handleSpoolMarkerClick = useCallback((marker) => {
    setSelectedSpoolMarkerId(marker.id);
    setSelectedWeldId(null);
    setSelectedPartMarkerId(null);
    if (window.innerWidth < 768) {
      setMobileSheetTab("spools");
      setMobileSheetOpen(true);
    } else {
      setShowSpoolPanel(true);
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
      const labelOffset = 4;
      const nextNum = parts.length === 0 ? 1 : Math.max(...parts.map((p) => p.displayNumber ?? 0), 0) + 1;
      const cat = addDefaults?.catalogCategory;
      const hierarchyState = addDefaults?.hierarchyState ?? {};
      const entriesForCat = cat ? partCatalog.entries.filter((e) => e.catalogCategory === cat) : [];
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
        displayNumber: nextNum,
        spoolId: addDefaults?.spoolId ?? null,
        partType,
        nps,
        thickness,
        materialGrade: addDefaults?.materialGrade ?? "",
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
      setParts((prev) => [...prev, newPart]);
      setPartMarkers((prev) => [...prev, newMarker]);
      setPendingLabelId({ type: "part", id: newMarkerId });
    },
    [parts, addDefaults, activeDrawingId, setPendingLabelId]
  );

  const handlePartMarkerClick = useCallback((marker) => {
    setSelectedPartMarkerId(marker.id);
    setSelectedWeldId(null);
    setSelectedSpoolMarkerId(null);
    if (window.innerWidth < 768) {
      setMobileSheetTab("parts");
      setMobileSheetOpen(true);
    } else {
      setShowPartPanel(true);
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

  const handleSavePart = useCallback((updatedPart) => {
    setParts((prev) =>
      prev.map((p) => (p.id === updatedPart.id ? updatedPart : p))
    );
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
    setParts((prev) => prev.filter((p) => p.id !== partId));
    setPartMarkers((prev) => prev.filter((m) => m.partId !== partId));
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
      } else if (appMode === "edition" && markupTool === "add") {
        handleAddWeld({ xPercent, yPercent, pageNumber });
      } else if (markupTool === "select") {
        setSelectedWeldId(null);
        setSelectedSpoolMarkerId(null);
        setSelectedPartMarkerId(null);
        setFormWeld(null);
      }
    },
    [handleAddSpoolMarker, handleAddPartMarker, handleAddWeld, handlePendingLabelMove, appMode, markupTool, setPendingLabelId]
  );

  const handleWeldClick = useCallback((weld) => {
    setSelectedWeldId(weld.id);
    setSelectedSpoolMarkerId(null);
    setSelectedPartMarkerId(null);
    if (window.innerWidth < 768) {
      setFormWeld(weld);
      setMobileSheetTab("welds");
      setMobileSheetOpen(true);
    }
  }, []);

  const handleWeldDoubleClick = useCallback((weld) => {
    setFormWeld(weld);
    setSelectedWeldId(weld.id);
    if (window.innerWidth < 768) {
      setMobileSheetTab("welds");
      setMobileSheetOpen(true);
    } else {
      setShowWeldPanel(true);
    }
  }, []);

  const handleSaveWeld = useCallback((updatedWeld) => {
    setWeldPoints((prev) =>
      prev.map((w) => (w.id === updatedWeld.id ? updatedWeld : w))
    );
    setFormWeld(updatedWeld);
  }, []);

  const handleClosePanel = useCallback(() => {
    setFormWeld(null);
    setSelectedWeldId(null);
    setShowWeldPanel(false);
  }, []);

  const handleBackToList = useCallback(() => {
    setFormWeld(null);
    setSelectedWeldId(null);
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
    setShowWeldPanel(false);
  }, []);

  const draftSaveTimeoutRef = useRef(null);

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
            ...w,
            drawingId: normalizeDrawingId(w.drawingId),
            spoolId: spoolIdSet.has(w.spoolId) ? w.spoolId : null,
            partId1: partIdSet.has(w.partId1) ? w.partId1 : null,
            partId2: partIdSet.has(w.partId2) ? w.partId2 : null,
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

    const normalizedPartMarkers = Array.isArray(data.partMarkers)
      ? data.partMarkers
          .filter((m) => m && typeof m === "object" && (!m.partId || partIdSet.has(m.partId)))
          .map((m) => ({
            ...m,
            drawingId: normalizeDrawingId(m.drawingId),
          }))
      : [];

    return {
      ...data,
      weldPoints: normalizedWelds,
      spools: normalizedSpools,
      spoolMarkers: normalizedSpoolMarkers,
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
              weldLocation: "shop",
              catalogCategory: "",
              hierarchyState: {},
              partType: "",
              nps: "",
              thickness: "",
              materialGrade: "",
              ...data.addDefaults,
            }
          : {
              spoolId: null,
              weldLocation: "shop",
              catalogCategory: "",
              hierarchyState: {},
              partType: "",
              nps: "",
              thickness: "",
              materialGrade: "",
            },
      systems: Array.isArray(data.systems) ? data.systems : [],
      lines: Array.isArray(data.lines) ? data.lines : [],
      projectSettings:
        data.projectSettings && typeof data.projectSettings === "object"
          ? data.projectSettings
          : { steps: [] },
      projectMeta:
        data.projectMeta && typeof data.projectMeta === "object"
          ? data.projectMeta
          : { projectName: "", client: "", spec: "", revision: "", date: "" },
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
    };
    if (projectId) {
      try {
        await saveToIndexedDB(projectId, payload);
      } catch {
        // Ignore (e.g. private window)
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
    pdfToBase64,
  ]);

  useEffect(() => {
    const draft = loadDraftFromSession();
    const hasDraftDrawings = Array.isArray(draft?.drawings) && draft.drawings.length > 0;
    if (!hasDraftDrawings && !draft?.pdfBase64) return;
    applyLoadedProjectData(draft, { forcedProjectId: draft.id || generateProjectId() });
  }, [applyLoadedProjectData]);

  useEffect(() => {
    if (!pdfBlob) return;
    if (draftSaveTimeoutRef.current) clearTimeout(draftSaveTimeoutRef.current);
    draftSaveTimeoutRef.current = setTimeout(async () => {
      draftSaveTimeoutRef.current = null;
      const serializedDrawings = await Promise.all(
        drawings.map(async (d) => {
          const source = d.blobUrl || (d.id === activeDrawingId ? pdfBlob : null);
          const b64 = source ? await pdfToBase64(source) : d.pdfBase64 || "";
          return { id: d.id, filename: d.filename, pdfBase64: b64, revision: d.revision || "", lineIds: d.lineIds || [] };
        })
      );
      if (serializedDrawings.length === 0) {
        const b64 = await pdfToBase64(pdfBlob);
        serializedDrawings.push({ id: activeDrawingId || "dwg-draft", filename: pdfFilename, pdfBase64: b64, revision: "", lineIds: [] });
      }
      saveDraftToSession({
        version: PROJECT_FILE_VERSION,
        id: projectId || generateProjectId(),
        drawings: serializedDrawings,
        weldPoints,
        spools,
        spoolMarkers,
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
      });
    }, 500);
    return () => {
      if (draftSaveTimeoutRef.current) clearTimeout(draftSaveTimeoutRef.current);
    };
  }, [
    pdfBlob,
    projectId,
    pdfFilename,
    drawings,
    activeDrawingId,
    weldPoints,
    spools,
    spoolMarkers,
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
    pdfToBase64,
  ]);

  const handleLoadProject = useCallback(async (file) => {
    try {
      const data = await loadProject(file);
      const hasDrawings = Array.isArray(data.drawings) && data.drawings.length > 0;
      if (!hasDrawings && !data.pdfBase64) throw new Error("No PDF in project file");
      applyLoadedProjectData(data, { forcedProjectId: generateProjectId() });
    } catch (err) {
      alert(err.message || "Failed to load project");
    }
  }, [applyLoadedProjectData]);

  const handleExportExcel = useCallback(() => {
    exportWeldsToExcel(weldPoints, {
      pdfFilename: projectMeta?.projectName?.trim() || pdfFilename,
      spools,
      parts,
      personnel,
      drawingSettings,
    });
  }, [weldPoints, pdfFilename, spools, parts, personnel, drawingSettings, projectMeta]);

  const weldStatusByWeldId = useMemo(() => {
    const map = new Map();
    weldPoints.forEach((w) => {
      const ndtSel = computeNdtSelection(w, drawingSettings, weldPoints);
      map.set(w.id, getWeldOverallStatus(w, ndtSel));
    });
    return map;
  }, [weldPoints, drawingSettings]);

  const handlePrint = useCallback(
    async (options) => {
      const { runPrint } = await import("@/lib/print-utils");
      const prevOverlay = showOverlay;
      const includeMarkers = options.pdfDrawing && options.markers && (options.markers.welds || options.markers.spools || options.markers.parts);
      if (includeMarkers !== prevOverlay) {
        setShowOverlay(!!includeMarkers);
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
        });
      } finally {
        if (includeMarkers !== prevOverlay) setShowOverlay(prevOverlay);
      }
    },
    [
      showOverlay,
      pdfBlob,
      pdfFilename,
      weldPoints,
      spools,
      parts,
      personnel,
      drawingSettings,
      weldStatusByWeldId,
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

  const partsOnCurrentPage = useMemo(
    () => parts.filter((p) => partIdsOnCurrentPage.includes(p.id)),
    [parts, partIdsOnCurrentPage]
  );

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
    return null;
  }, [selectedWeldId, selectedSpoolMarkerId, selectedPartMarkerId, weldPoints, spoolMarkers, partMarkers]);

  return (
    <div className="md:container md:mx-auto p-0 md:p-4">
      <>
        <OfflineBanner />
        <Toolbar
          hasPdf={!!pdfBlob}
          hasWelds={weldPoints.length > 0}
          onLoadPdf={loadPdfFile}
          onLoadProject={handleLoadProject}
          onSaveProject={handleSaveProject}
          onExportExcel={handleExportExcel}
          onOpenParameters={() => setShowParameters(true)}
          onOpenProjects={() => setShowProjects(true)}
          onOpenNdt={() => setShowNdtPanel(true)}
          onOpenStatus={() => setShowStatusPage(true)}
          onPrint={() => setShowPrintModal(true)}
        />
      </>

      {showStatusPage ? (
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
              setFormWeld(weldPoints.find((w) => w.id === weldId) ?? null);
              setShowWeldPanel(true);
              setShowStatusPage(false);
            }}
            onClose={() => setShowStatusPage(false)}
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
                drawingSettings={drawingSettings}
                spools={spools}
              />
            </div>
          )}

          <div className="relative flex gap-0 items-stretch md:rounded-lg overflow-hidden md:shadow bg-base-100 h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-10rem)] min-h-0">
            {pdfBlob ? (
              <>
                {pdfBlob && (
                  <div className="absolute top-2 left-2 z-20 flex flex-col gap-3 pointer-events-none items-start">
                    <div className="pointer-events-auto shrink-0 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-base-200/70 backdrop-blur-md border border-base-300/50 shadow-sm w-fit">
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
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost h-7 min-h-7 gap-1 hidden md:flex"
                        onClick={() => setShowOverlay((v) => !v)}
                        aria-label={showOverlay ? "Hide markers" : "Show markers"}
                        title={showOverlay ? "Hide markers" : "Show markers"}
                      >
                        {showOverlay ? "Hide markers" : "Show markers"}
                      </button>
                      {numPdfPages != null && numPdfPages > 1 && (
                        <>
                          <span className="w-px h-5 bg-base-300/60 shrink-0 ml-1" aria-hidden />
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost h-7 min-h-7 w-7 p-0"
                              onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
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
                              onClick={() => setPdfPage((p) => Math.min(numPdfPages, p + 1))}
                              disabled={pdfPage >= numPdfPages}
                              aria-label="Next page"
                            >
                              ›
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {appMode === "edition" && markupTool !== "select" && (
                      <div className="pointer-events-auto shrink-0">
                        <AddDefaultsBar
                          markupTool={markupTool}
                          addDefaults={addDefaults}
                          onAddDefaultsChange={setAddDefaults}
                          spools={spoolsOnCurrentPage}
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
                    onPageSelect={setPdfPage}
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
                    showOverlay={showOverlay}
                    onToggleOverlay={() => setShowOverlay((v) => !v)}
                    pendingLabelId={pendingLabelId}
                    onPendingLabelMove={handlePendingLabelMove}
                  />
                </div>
                {/* Resize handle - visible splitter between content and side panel */}
                {(!showDrawingPanel && !showLinePanel && !showWeldPanel && !showSpoolPanel && !showPartPanel) ? null : (
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
                    width: !showDrawingPanel && !showLinePanel && !showWeldPanel && !showSpoolPanel && !showPartPanel ? 56 : sidePanelWidth,
                    minWidth: !showDrawingPanel && !showLinePanel && !showWeldPanel && !showSpoolPanel && !showPartPanel ? 56 : undefined,
                  }}
                >
                  <div
                    className={`flex flex-1 min-w-0 min-h-0 h-full overflow-hidden transition-all duration-300 ease-out ${
                      !showDrawingPanel && !showLinePanel && !showWeldPanel && !showSpoolPanel && !showPartPanel ? "flex-col" : "flex-row items-stretch"
                    }`}
                    style={{ minHeight: 0 }}
                  >
                  <SidePanelDrawings
                    drawings={drawings}
                    activeDrawingId={activeDrawingId}
                    lines={lines}
                    isOpen={showDrawingPanel}
                    onToggle={() => {
                      setShowLinePanel(false);
                      setShowWeldPanel(false);
                      setShowSpoolPanel(false);
                      setShowPartPanel(false);
                      setShowDrawingPanel((v) => !v);
                    }}
                    onSwitchDrawing={handleSwitchDrawing}
                    onAddDrawing={loadPdfFile}
                    onUpdateDrawing={(dwgId, updates) => {
                      setDrawings((prev) => prev.map((d) => (d.id === dwgId ? { ...d, ...updates } : d)));
                    }}
                    onDeleteDrawing={handleDeleteDrawing}
                    isStacked={!showDrawingPanel && !showLinePanel && !showWeldPanel && !showSpoolPanel && !showPartPanel}
                  />
                  <SidePanelLines
                    systems={systems}
                    lines={lines}
                    isOpen={showLinePanel}
                    onToggle={() => {
                      setShowDrawingPanel(false);
                      setShowWeldPanel(false);
                      setShowSpoolPanel(false);
                      setShowPartPanel(false);
                      setShowLinePanel((v) => !v);
                    }}
                    onSaveSystems={setSystems}
                    onSaveLines={setLines}
                    isStacked={!showDrawingPanel && !showLinePanel && !showWeldPanel && !showSpoolPanel && !showPartPanel}
                  />
                  <SidePanelSpools
                    spools={spoolsOnCurrentPage}
                    isOpen={showSpoolPanel}
                    onToggle={() => {
                      setShowDrawingPanel(false);
                      setShowLinePanel(false);
                      setShowWeldPanel(false);
                      setShowPartPanel(false);
                      setShowSpoolPanel((v) => !v);
                    }}
                    isStacked={!showDrawingPanel && !showLinePanel && !showWeldPanel && !showSpoolPanel && !showPartPanel}
                    onSave={handleSaveVisibleSpools}
                    onAssignWeldToSpool={handleAssignWeldToSpool}
                    onAssignPartToSpool={handleAssignPartToSpool}
                    parts={partsOnCurrentPage}
                    spoolMarkers={spoolMarkersOnCurrentPage}
                    appMode={appMode}
                    weldPoints={weldsOnCurrentPage}
                    weldStatusByWeldId={weldStatusByWeldId}
                    getWeldName={getWeldName}
                    lines={lines}
                  />
                  <SidePanelWeldForm
                    weldPoints={weldsOnCurrentPage}
                    weldStatusByWeldId={weldStatusByWeldId}
                    weld={formWeld}
                    selectedWeldId={selectedWeldId}
                    isOpen={showWeldPanel}
                    onToggle={() => {
                      setShowDrawingPanel(false);
                      setShowLinePanel(false);
                      setShowSpoolPanel(false);
                      setShowPartPanel(false);
                      setShowWeldPanel((v) => !v);
                    }}
                    onSelectWeld={(w) => {
                      setFormWeld(w);
                      setSelectedWeldId(w.id);
                    }}
                    onBackToList={handleBackToList}
                    onSave={handleSaveWeld}
                    onDelete={handleDeleteWeld}
                    appMode={appMode}
                    spools={spoolsOnCurrentPage}
                    parts={partsOnCurrentPage}
                    onUpdatePartHeat={handleUpdatePartHeat}
                    personnel={personnel}
                    ndtAutoLabel={formatNdtRequirements(drawingSettings.ndtRequirements)}
                    drawingSettings={drawingSettings}
                    isStacked={!showDrawingPanel && !showLinePanel && !showWeldPanel && !showSpoolPanel && !showPartPanel}
                  />
                  <SidePanelPartForm
                    parts={partsOnCurrentPage}
                    partMarkers={partMarkersOnCurrentPage}
                    spools={spoolsOnCurrentPage}
                    selectedPartMarkerId={selectedPartMarkerId}
                    isOpen={showPartPanel}
                    onToggle={() => {
                      setShowDrawingPanel(false);
                      setShowLinePanel(false);
                      setShowWeldPanel(false);
                      setShowSpoolPanel(false);
                      setShowPartPanel((v) => !v);
                    }}
                    onSelectPartMarker={setSelectedPartMarkerId}
                    onSavePart={handleSavePart}
                    onDeletePart={handleDeletePart}
                    appMode={appMode}
                    isStacked={!showDrawingPanel && !showLinePanel && !showWeldPanel && !showSpoolPanel && !showPartPanel}
                  />
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
                      No drawing loaded
                    </h2>
                    <p className="text-base-content/70 text-sm leading-relaxed">
                      Load a PDF drawing or open a saved project to start marking weld points and recording details.
                    </p>
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
      {pdfBlob && !showStatusPage && !showNdtPanel && (
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
                onUpdateDrawing={(dwgId, updates) => {
                  setDrawings((prev) => prev.map((d) => (d.id === dwgId ? { ...d, ...updates } : d)));
                }}
                onDeleteDrawing={handleDeleteDrawing}
                isStacked={false}
                hideHeader
              />
            )}
            {mobileSheetTab === "lines" && (
              <SidePanelLines
                systems={systems}
                lines={lines}
                isOpen={true}
                onToggle={() => {}}
                onSaveSystems={setSystems}
                onSaveLines={setLines}
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
                lines={lines}
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
                parts={partsOnCurrentPage}
                onUpdatePartHeat={handleUpdatePartHeat}
                personnel={personnel}
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
                selectedPartMarkerId={selectedPartMarkerId}
                isOpen={true}
                onToggle={() => {}}
                onSelectPartMarker={setSelectedPartMarkerId}
                onSavePart={handleSavePart}
                onDeletePart={handleDeletePart}
                appMode={appMode}
                isStacked={false}
                hideHeader
              />
            )}
          </BottomSheet>
        </>
      )}

      <ModalParameters
        isOpen={showParameters}
        onClose={() => setShowParameters(false)}
        settings={drawingSettings}
        personnel={personnel}
        projectSettings={projectSettings}
        projectMeta={projectMeta}
        onSave={({ drawingSettings: s, personnel: p, projectSettings: ps, projectMeta: pm }) => {
          if (s != null) setDrawingSettings(s);
          if (p != null) setPersonnel(p);
          if (ps != null) setProjectSettings(ps);
          if (pm != null) setProjectMeta(pm);
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
    </div>
  );
}
