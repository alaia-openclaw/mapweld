"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  NDT_METHODS,
  NDT_METHOD_LABELS,
  NDT_REQUEST_STATUS,
  NDT_REQUEST_STATUS_LABELS,
  NDT_REPORT_STATUS,
  NDT_RESULT_OUTCOME_LABELS,
  sortNdtMethods,
} from "@/lib/constants";
import {
  applyReportToWelds,
  clearReportResultsFromWelds,
  getNextNdtRequestDisplayName,
  isWeldInNdtRequestForMethod,
} from "@/lib/ndt-utils";
import {
  isWeldReadyForNdt,
  isWeldRepairNeeded,
  isWeldAlreadyAcceptedForMethod,
  computeNdtSelection,
  getWeldDisambiguatedLabel,
} from "@/lib/weld-utils";
import { useNdtScope } from "@/contexts/NdtScopeContext";
import FormNdtRequest from "@/components/FormNdtRequest";
import FormNdtReport from "@/components/FormNdtReport";

function generateRequestId() {
  return `ndt-req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
function generateReportId() {
  return `ndt-rpt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getResultLabel(result) {
  if (!result) return "";
  const r = result.toLowerCase();
  if (r === "accepted") return "Accepted";
  if (r === "rejected" || r === "reject") return "Rejected";
  if (r === "omitted_or_inconclusive" || r === "omitted") return "Omitted";
  if (r === "repair") return "Repair";
  return NDT_RESULT_OUTCOME_LABELS[result] ?? result;
}

function getResultClass(result) {
  if (!result) return "";
  const r = (result || "").toLowerCase();
  if (r === "accepted") return "text-success";
  if (r === "rejected" || r === "reject") return "text-error";
  if (r === "omitted_or_inconclusive" || r === "omitted" || r === "repair") return "text-warning";
  return "";
}

function NdtKanbanPage({
  ndtRequests = [],
  ndtReports = [],
  setNdtRequests,
  setNdtReports,
  weldPoints = [],
  setWeldPoints,
  drawingSettings = {},
  getWeldName,
  drawings = [],
  lines = [],
  spools = [],
  onClose,
}) {
  const ndtContext = useNdtScope();
  const [activeTab, setActiveTab] = useState(NDT_METHODS[0]);
  const [dragItem, setDragItem] = useState(null);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [editingReportId, setEditingReportId] = useState(null);
  const [reportFromRequestId, setReportFromRequestId] = useState(null);
  const [viewingRequestId, setViewingRequestId] = useState(null);

  const methodOptions = useMemo(() => {
    const fromDrawing = (drawingSettings?.ndtRequirements || []).map((item) => item?.method);
    const fromWelds = [];
    (weldPoints || []).forEach((w) => {
      fromWelds.push(
        ...Object.keys(w.ndtOverrides || {}),
        ...Object.keys(w.ndtResults || {}),
        ...Object.keys(w.ndtResultOutcome || {}),
      );
    });
    return sortNdtMethods([
      ...NDT_METHODS,
      ...fromDrawing,
      ...fromWelds,
      ...(ndtRequests || []).map((request) => request?.method),
      ...(ndtReports || []).map((report) => report?.method),
    ]);
  }, [drawingSettings, ndtRequests, ndtReports, weldPoints]);

  useEffect(() => {
    if (!methodOptions.includes(activeTab)) {
      setActiveTab(methodOptions[0] || NDT_METHODS[0]);
    }
  }, [activeTab, methodOptions]);

  const method = activeTab;

  const weldLabelContext = useMemo(
    () => ({ drawings, lines, spools, weldPoints }),
    [drawings, lines, spools, weldPoints]
  );

  const groupedWelds = useMemo(() => {
    const ready = [];
    const notReady = [];
    const alreadyAccepted = [];
    const planned = [];
    const repairNeeded = [];
    weldPoints.forEach((w) => {
      const ndtSel = computeNdtSelection(w, drawingSettings, weldPoints, ndtContext);
      if (!ndtSel[method]) return;
      if (isWeldRepairNeeded(w)) repairNeeded.push(w);
      else if (isWeldAlreadyAcceptedForMethod(w, method)) alreadyAccepted.push(w);
      else if (isWeldInNdtRequestForMethod(w.id, method, ndtRequests)) planned.push(w);
      else if (isWeldReadyForNdt(w, ndtContext)) ready.push(w);
      else notReady.push(w);
    });
    return { ready, notReady, alreadyAccepted, planned, repairNeeded };
  }, [weldPoints, method, ndtRequests, drawingSettings, ndtContext]);

  const draftRequests = useMemo(
    () => ndtRequests.filter((r) => r.method === method && (r.status || NDT_REQUEST_STATUS.DRAFT) === NDT_REQUEST_STATUS.DRAFT),
    [ndtRequests, method]
  );
  const sentRequests = useMemo(
    () =>
      ndtRequests.filter(
        (r) =>
          r.method === method &&
          r.status === NDT_REQUEST_STATUS.SENT &&
          !ndtReports.some((report) => report.requestId === r.id)
      ),
    [ndtRequests, ndtReports, method]
  );
  const createdReports = useMemo(
    () => ndtReports.filter((r) => r.method === method && (r.status || NDT_REPORT_STATUS.CREATED) === NDT_REPORT_STATUS.CREATED),
    [ndtReports, method]
  );
  const completedReports = useMemo(
    () => ndtReports.filter((r) => r.method === method && r.status === NDT_REPORT_STATUS.COMPLETED),
    [ndtReports, method]
  );

  const handleAddRequest = useCallback(() => {
    setEditingRequestId(null);
    setRequestFormOpen(true);
  }, []);

  const handleEditRequest = useCallback((req) => {
    setEditingRequestId(req.id);
    setRequestFormOpen(true);
  }, []);

  const handleRequestSubmit = useCallback(
    (request) => {
      const withMethod = { ...request, method, status: NDT_REQUEST_STATUS.DRAFT };
      if (editingRequestId) {
        setNdtRequests((prev) => prev.map((r) => (r.id === editingRequestId ? withMethod : r)));
      } else {
        setNdtRequests((prev) => [...prev, { ...withMethod, id: withMethod.id || generateRequestId() }]);
      }
      setRequestFormOpen(false);
      setEditingRequestId(null);
    },
    [method, editingRequestId, setNdtRequests]
  );

  const handleAddReport = useCallback((fromRequest = null) => {
    setEditingReportId(null);
    setReportFromRequestId(fromRequest?.id ?? null);
    setReportFormOpen(true);
  }, []);

  const handleEditReport = useCallback((report) => {
    setEditingReportId(report.id);
    setReportFromRequestId(null);
    setReportFormOpen(true);
  }, []);

  const handleReportSubmit = useCallback(
    (report) => {
      const reportWithStatus = { ...report, method: report.method || method, status: NDT_REPORT_STATUS.CREATED };
      if (editingReportId) {
        setNdtReports((prev) => prev.map((r) => (r.id === report.id ? reportWithStatus : r)));
      } else {
        setNdtReports((prev) => [...prev, { ...reportWithStatus, id: report.id || generateReportId() }]);
      }
      setReportFormOpen(false);
      setEditingReportId(null);
      setReportFromRequestId(null);
    },
    [method, editingReportId, setNdtReports]
  );

  const requestToEdit = editingRequestId ? ndtRequests.find((r) => r.id === editingRequestId) : null;
  const reportToEdit = editingReportId ? ndtReports.find((r) => r.id === editingReportId) : null;
  const reportFromRequest = reportFromRequestId ? ndtRequests.find((r) => r.id === reportFromRequestId) : null;

  const moveRequestToPending = useCallback(
    (request) => {
      setNdtRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: NDT_REQUEST_STATUS.SENT } : r))
      );
    },
    [setNdtRequests]
  );

  function getRequestFile(request) {
    const welds = (request.weldIds || [])
      .map((id) => weldPoints.find((w) => w.id === id))
      .filter(Boolean);
    const lines = [
      `NDT Request: ${request.title || request.method || "NDT"}`,
      `Method: ${request.method}`,
      `Date: ${new Date().toISOString().slice(0, 10)}`,
      "",
      "Welds:",
      ...welds.map((w) => `- ${getWeldDisambiguatedLabel(w, weldLabelContext)}`),
    ];
    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const filename = `NDT-Request-${request.method || "NDT"}-${request.id?.slice(-6) || "1"}.txt`;
    return { blob, filename, text };
  }

  function handleDownloadRequest(request) {
    const { blob, filename } = getRequestFile(request);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShareRequest(request) {
    const { blob, filename, text } = getRequestFile(request);
    const file = new File([blob], filename, { type: "text/plain" });
    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: request.title || `NDT Request ${request.method}`,
          text: text.slice(0, 200) + (text.length > 200 ? "…" : ""),
          files: [file],
        });
      } catch (err) {
        if (err.name !== "AbortError") fallbackShareRequest(request, text);
      }
      return;
    }
    fallbackShareRequest(request, text);
  }

  function fallbackShareRequest(request, text) {
    const subject = encodeURIComponent(request.title || `NDT Request ${request.method || "NDT"}`);
    const body = encodeURIComponent(text);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  const handleDeleteRequest = useCallback(
    (request) => {
      if (confirm("Delete this NDT request?")) {
        setNdtRequests((prev) => prev.filter((r) => r.id !== request.id));
      }
    },
    [setNdtRequests]
  );

  const handleDeleteReport = useCallback(
    (report) => {
      if (confirm("Delete this NDT report? Results will be removed from welds (manually overridden kept).")) {
        setWeldPoints((prev) => clearReportResultsFromWelds(report, prev));
        setNdtReports((prev) => prev.filter((r) => r.id !== report.id));
      }
    },
    [setNdtReports, setWeldPoints]
  );

  const moveRequestToDraft = useCallback(
    (request) => {
      setNdtRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: NDT_REQUEST_STATUS.DRAFT } : r))
      );
    },
    [setNdtRequests]
  );

  const moveReportToComplete = useCallback(
    (report) => {
      setWeldPoints((prev) => applyReportToWelds({ ...report, status: NDT_REPORT_STATUS.COMPLETED }, prev));
      setNdtReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: NDT_REPORT_STATUS.COMPLETED } : r))
      );
      if (report.requestId) {
        setNdtRequests((prev) =>
          prev.map((r) => (r.id === report.requestId ? { ...r, status: NDT_REQUEST_STATUS.COMPLETED } : r))
        );
      }
    },
    [setNdtReports, setNdtRequests, setWeldPoints]
  );

  const moveReportBackToCreated = useCallback(
    (report) => {
      setWeldPoints((prev) => clearReportResultsFromWelds(report, prev));
      setNdtReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: NDT_REPORT_STATUS.CREATED } : r))
      );
      if (report.requestId) {
        setNdtRequests((prev) =>
          prev.map((r) => (r.id === report.requestId ? { ...r, status: NDT_REQUEST_STATUS.SENT } : r))
        );
      }
    },
    [setNdtReports, setNdtRequests, setWeldPoints]
  );

  const addWeldToRequest = useCallback(
    (requestId, weldId) => {
      setNdtRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r;
          const ids = r.weldIds || [];
          if (ids.includes(weldId)) return r;
          return { ...r, weldIds: [...ids, weldId] };
        })
      );
    },
    [setNdtRequests]
  );

  const removeWeldFromRequest = useCallback(
    (requestId, weldId) => {
      setNdtRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r;
          const ids = (r.weldIds || []).filter((id) => id !== weldId);
          return { ...r, weldIds: ids };
        })
      );
    },
    [setNdtRequests]
  );

  const addWeldToReport = useCallback(
    (reportId, weldId, result = "accepted") => {
      setNdtReports((prev) =>
        prev.map((r) => {
          if (r.id !== reportId) return r;
          const results = r.weldResults || [];
          if (results.some((wr) => wr.weldId === weldId)) return r;
          return { ...r, weldResults: [...results, { weldId, result }] };
        })
      );
    },
    [setNdtReports]
  );

  const removeWeldFromReport = useCallback(
    (reportId, weldId) => {
      setNdtReports((prev) =>
        prev.map((r) => {
          if (r.id !== reportId) return r;
          const results = (r.weldResults || []).filter((wr) => wr.weldId !== weldId);
          return { ...r, weldResults: results };
        })
      );
    },
    [setNdtReports]
  );

  function handleDragStart(e, type, payload) {
    setDragItem({ type, payload });
    e.dataTransfer.setData("application/json", JSON.stringify({ type, payload }));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    setDragItem(null);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e, targetColumn, targetId) {
    e.preventDefault();
    let data;
    try {
      data = JSON.parse(e.dataTransfer.getData("application/json"));
    } catch {
      setDragItem(null);
      return;
    }
    const { type, payload } = data || {};
    setDragItem(null);

    if (targetColumn === "pending" && type === "request" && payload?.requestId) {
      const req = ndtRequests.find((r) => r.id === payload.requestId);
      if (req && req.status === NDT_REQUEST_STATUS.DRAFT) moveRequestToPending(req);
      return;
    }
    if (targetColumn === "request" && type === "request" && payload?.requestId) {
      const req = ndtRequests.find((r) => r.id === payload.requestId);
      if (req && req.status === NDT_REQUEST_STATUS.SENT) moveRequestToDraft(req);
      return;
    }
    if (targetColumn === "request" && type === "weld" && targetId && payload?.weldId) {
      addWeldToRequest(targetId, payload.weldId);
      return;
    }
    if (targetColumn === "report" && type === "request" && payload?.requestId) {
      const req = ndtRequests.find((r) => r.id === payload.requestId);
      if (req) handleAddReport(req);
      return;
    }
    if (targetColumn === "report" && type === "weld" && targetId && payload?.weldId) {
      addWeldToReport(targetId, payload.weldId);
      return;
    }
    if (targetColumn === "complete" && type === "report" && payload?.reportId) {
      const report = ndtReports.find((r) => r.id === payload.reportId);
      if (report && report.status !== NDT_REPORT_STATUS.COMPLETED) moveReportToComplete(report);
      return;
    }
    if (targetColumn === "report" && type === "report" && payload?.reportId) {
      const report = ndtReports.find((r) => r.id === payload.reportId);
      if (report && report.status === NDT_REPORT_STATUS.COMPLETED) moveReportBackToCreated(report);
      return;
    }
  }

  return (
    <div className="flex flex-col h-full bg-base-100">
      <div className="flex-shrink-0 flex items-center justify-between border-b border-base-300 px-4 py-3">
        <h1 className="text-xl font-semibold">NDT workflow</h1>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="flex flex-nowrap overflow-x-auto border-b border-base-300 px-2 sm:px-4 gap-0">
        {methodOptions.map((m) => (
          <button
            key={m}
            type="button"
            className={`shrink-0 px-3 sm:px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === m ? "border-primary text-primary" : "border-transparent text-base-content/70 hover:text-base-content"
            }`}
            onClick={() => setActiveTab(m)}
          >
            {NDT_METHOD_LABELS[m] || m}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {/* Column 1: Weld backlog */}
          <div className="w-56 flex-shrink-0 flex flex-col rounded-lg border border-base-300 bg-base-200/50 overflow-hidden">
            <div className="p-2 border-b border-base-300 bg-base-200 font-medium text-sm">Weld backlog</div>
            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              {[
                { label: "Ready for NDT", welds: groupedWelds.ready, className: "text-success" },
                { label: "Not ready", welds: groupedWelds.notReady, className: "text-base-content/70" },
                { label: "Already accepted", welds: groupedWelds.alreadyAccepted, className: "text-base-content/60" },
                { label: "Planned", welds: groupedWelds.planned, className: "text-info" },
                { label: "Repair needed", welds: groupedWelds.repairNeeded, className: "text-warning" },
              ].map(
                (group) =>
                  group.welds.length > 0 && (
                    <div key={group.label}>
                      <div className={`text-xs font-semibold uppercase mb-1 ${group.className}`}>{group.label}</div>
                      <ul className="space-y-0.5">
                        {group.welds.map((w) => (
                          <li
                            key={w.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, "weld", { weldId: w.id })}
                            onDragEnd={handleDragEnd}
                            className="px-2 py-1 rounded bg-base-100 border border-base-300 cursor-grab active:cursor-grabbing text-xs leading-snug break-words"
                          >
                            {getWeldDisambiguatedLabel(w, weldLabelContext)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
              )}
              {weldPoints.filter((w) => computeNdtSelection(w, drawingSettings, weldPoints, ndtContext)[method]).length === 0 && (
                <p className="text-sm text-base-content/50">No welds for this NDT type.</p>
              )}
            </div>
          </div>

          {/* Column 2: NDT request */}
          <div
            className="w-64 flex-shrink-0 flex flex-col rounded-lg border border-base-300 bg-base-200/50 overflow-hidden"
            onDragOver={handleDragOver}
          >
            <div className="p-2 border-b border-base-300 bg-base-200 font-medium text-sm">NDT request</div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              <button
                type="button"
                className="btn btn-outline btn-sm w-full"
                onClick={handleAddRequest}
              >
                + New request
              </button>
              {draftRequests.map((req) => (
                <div
                  key={req.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, "request", { requestId: req.id })}
                  onDragEnd={handleDragEnd}
                  className="rounded-lg border-2 border-dashed border-base-300 bg-base-100 p-2 cursor-grab active:cursor-grabbing"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "request", req.id)}
                >
                  <div className="font-medium text-sm truncate">{req.title || `Request (${req.weldIds?.length ?? 0})`}</div>
                  <ul className="mt-1 space-y-0.5">
                    {(req.weldIds || []).map((weldId) => {
                      const w = weldPoints.find((p) => p.id === weldId);
                      return (
                        <li
                          key={weldId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, "weld", { weldId })}
                          onDragEnd={handleDragEnd}
                          className="flex items-center justify-between gap-1 px-2 py-0.5 rounded bg-base-200 text-xs"
                        >
                          <span className="min-w-0 break-words leading-snug">
                            {w ? getWeldDisambiguatedLabel(w, weldLabelContext) : weldId}
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs px-1 min-h-0 h-5"
                            onClick={() => removeWeldFromRequest(req.id, weldId)}
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => setViewingRequestId(req.id)}>View</button>
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleEditRequest(req)}>Edit</button>
                    <button type="button" className="btn btn-primary btn-xs" onClick={() => moveRequestToPending(req)}>→ Pending</button>
                    <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleDeleteRequest(req)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Request pending */}
          <div
            className="w-64 flex-shrink-0 flex flex-col rounded-lg border border-primary/30 bg-primary/5 overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "pending")}
          >
            <div className="p-2 border-b border-base-300 bg-primary/10 font-medium text-sm">Request pending</div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              <p className="text-xs text-base-content/60">Drop request here. Use download/share on each card.</p>
              {sentRequests.map((req) => (
                <div
                  key={req.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, "request", { requestId: req.id })}
                  onDragEnd={handleDragEnd}
                  className="rounded-lg border border-primary/40 bg-base-100 p-2 cursor-grab active:cursor-grabbing"
                >
                  <div className="font-medium text-sm truncate">{req.title || `Request (${req.weldIds?.length ?? 0})`}</div>
                  <div className="text-xs text-base-content/60 mt-1">{req.weldIds?.length ?? 0} welds</div>
                  <div className="flex gap-1 mt-2 flex-wrap items-center">
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => setViewingRequestId(req.id)} title="View details">View</button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-square p-1"
                      onClick={() => handleDownloadRequest(req)}
                      title="Download request file"
                      aria-label="Download"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-square p-1"
                      onClick={() => handleShareRequest(req)}
                      title="Share / send via email"
                      aria-label="Share"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => moveRequestToDraft(req)}>← Back</button>
                    <button type="button" className="btn btn-primary btn-xs" onClick={() => handleAddReport(req)}>Create report</button>
                    <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleDeleteRequest(req)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 4: NDT report */}
          <div
            className="w-64 flex-shrink-0 flex flex-col rounded-lg border border-base-300 bg-base-200/50 overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "report")}
          >
            <div className="p-2 border-b border-base-300 bg-base-200 font-medium text-sm">NDT report</div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              <button
                type="button"
                className="btn btn-outline btn-sm w-full"
                onClick={() => handleAddReport(null)}
              >
                + New report
              </button>
              {createdReports.map((report) => (
                <div
                  key={report.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, "report", { reportId: report.id })}
                  onDragEnd={handleDragEnd}
                  className="rounded-lg border-2 border-dashed border-base-300 bg-base-100 p-2 cursor-grab active:cursor-grabbing"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "report", report.id)}
                >
                  <div className="font-medium text-sm">{report.reportDate} · {report.weldResults?.length ?? 0} welds</div>
                  {report.requestId && (() => {
                    const linkedReq = ndtRequests.find((r) => r.id === report.requestId);
                    return linkedReq ? (
                      <div className="text-xs text-base-content/60 mt-0.5">From request: {linkedReq.title || linkedReq.method}</div>
                    ) : null;
                  })()}
                  <ul className="mt-1 space-y-0.5">
                    {(report.weldResults || []).slice(0, 5).map((wr) => {
                      const w = weldPoints.find((p) => p.id === wr.weldId);
                      const name = w ? getWeldDisambiguatedLabel(w, weldLabelContext) : wr.weldId;
                      const statusLabel = getResultLabel(wr.result);
                      const statusClass = getResultClass(wr.result);
                      return (
                        <li key={wr.weldId} className="flex items-center justify-between gap-1 px-2 py-0.5 rounded bg-base-200 text-xs">
                          <span className="min-w-0 flex items-start gap-1">
                            <span className="break-words leading-snug">{name}</span>
                            {statusLabel && <span className={`flex-shrink-0 font-medium ${statusClass}`}>· {statusLabel}</span>}
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs px-1 min-h-0 h-5"
                            onClick={() => removeWeldFromReport(report.id, wr.weldId)}
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                    {(report.weldResults?.length || 0) > 5 && (
                      <li className="text-xs text-base-content/50 px-2">+{(report.weldResults?.length || 0) - 5} more</li>
                    )}
                  </ul>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleEditReport(report)}>Edit</button>
                    <button type="button" className="btn btn-primary btn-xs" onClick={() => moveReportToComplete(report)}>→ Complete</button>
                    <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleDeleteReport(report)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 5: Complete */}
          <div
            className="w-56 flex-shrink-0 flex flex-col rounded-lg border border-success/30 bg-success/5 overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "complete")}
          >
            <div className="p-2 border-b border-base-300 bg-success/10 font-medium text-sm">Complete</div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              <p className="text-xs text-base-content/60">Drop report here to write results to welds.</p>
              {completedReports.map((report) => (
                <div
                  key={report.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, "report", { reportId: report.id })}
                  onDragEnd={handleDragEnd}
                  className="rounded-lg border border-success/40 bg-base-100 p-2 cursor-grab active:cursor-grabbing"
                >
                  <div className="font-medium text-sm">{report.reportDate} · {report.weldResults?.length ?? 0} welds</div>
                  {report.requestId && (() => {
                    const linkedReq = ndtRequests.find((r) => r.id === report.requestId);
                    return linkedReq ? (
                      <div className="text-xs text-base-content/60 mt-0.5">From request: {linkedReq.title || linkedReq.method}</div>
                    ) : null;
                  })()}
                  <ul className="mt-1 space-y-0.5">
                    {(report.weldResults || []).slice(0, 5).map((wr) => {
                      const w = weldPoints.find((p) => p.id === wr.weldId);
                      const name = w ? getWeldDisambiguatedLabel(w, weldLabelContext) : wr.weldId;
                      const statusLabel = getResultLabel(wr.result);
                      const statusClass = getResultClass(wr.result);
                      return (
                        <li key={wr.weldId} className="px-2 py-0.5 rounded bg-base-200 text-xs flex items-start gap-1">
                          <span className="min-w-0 break-words leading-snug">{name}</span>
                          {statusLabel && <span className={`flex-shrink-0 font-medium ${statusClass}`}>· {statusLabel}</span>}
                        </li>
                      );
                    })}
                    {(report.weldResults?.length || 0) > 5 && (
                      <li className="text-xs text-base-content/50 px-2">+{(report.weldResults?.length || 0) - 5} more</li>
                    )}
                  </ul>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => moveReportBackToCreated(report)}>← Reopen</button>
                    <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleDeleteReport(report)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {requestFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-base-100 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto p-4">
            <h3 className="font-semibold mb-3">{requestToEdit ? "Edit request" : "New request"}</h3>
            <FormNdtRequest
              weldPoints={weldPoints}
              ndtRequests={ndtRequests}
              drawingSettings={drawingSettings}
              request={requestToEdit || { method, weldIds: [], status: NDT_REQUEST_STATUS.DRAFT }}
              methodOptions={[method]}
              hideMethodSelect
              onSubmit={handleRequestSubmit}
              onCancel={() => {
                setRequestFormOpen(false);
                setEditingRequestId(null);
              }}
              getWeldName={getWeldName}
            />
          </div>
        </div>
      )}

      {reportFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-base-100 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-4">
            <h3 className="font-semibold mb-3">
              {reportToEdit ? "Edit report" : reportFromRequest ? "Report from request" : "New report"}
            </h3>
            <FormNdtReport
              weldPoints={weldPoints}
              ndtRequests={ndtRequests}
              drawingSettings={drawingSettings}
              methodOptions={[method]}
              hideMethodSelect
              requestId={reportFromRequest?.id ?? reportToEdit?.requestId ?? null}
              initialRequest={reportFromRequest}
              report={reportToEdit}
              onSubmit={handleReportSubmit}
              onCancel={() => {
                setReportFormOpen(false);
                setEditingReportId(null);
                setReportFromRequestId(null);
              }}
              getWeldName={getWeldName}
            />
          </div>
        </div>
      )}

      {viewingRequestId && (() => {
        const req = ndtRequests.find((r) => r.id === viewingRequestId);
        if (!req) return null;
        const statusLabel = NDT_REQUEST_STATUS_LABELS[req.status] ?? req.status;
        const methodLabel = NDT_METHOD_LABELS[req.method] ?? req.method;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewingRequestId(null)}>
            <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-semibold mb-3">Request details</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-base-content/60">Title</dt>
                  <dd className="font-medium">{req.title || "—"}</dd>
                </div>
                <div>
                  <dt className="text-base-content/60">Method</dt>
                  <dd>{methodLabel}</dd>
                </div>
                <div>
                  <dt className="text-base-content/60">Status</dt>
                  <dd>{statusLabel}</dd>
                </div>
                <div>
                  <dt className="text-base-content/60">Welds ({(req.weldIds || []).length})</dt>
                  <dd>
                    <ul className="mt-1 space-y-0.5 max-h-40 overflow-y-auto rounded bg-base-200 p-2">
                      {(req.weldIds || []).map((weldId) => {
                        const w = weldPoints.find((p) => p.id === weldId);
                        return (
                          <li key={weldId} className="text-xs break-words leading-snug">
                            {w ? getWeldDisambiguatedLabel(w, weldLabelContext) : weldId}
                          </li>
                        );
                      })}
                    </ul>
                  </dd>
                </div>
                {req.notes && (
                  <div>
                    <dt className="text-base-content/60">Notes</dt>
                    <dd className="whitespace-pre-wrap">{req.notes}</dd>
                  </div>
                )}
              </dl>
              <div className="flex gap-2 mt-4 flex-wrap">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => { setViewingRequestId(null); handleEditRequest(req); }}>Edit</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setViewingRequestId(null)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default NdtKanbanPage;
