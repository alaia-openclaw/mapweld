"use client";

import { useState, useMemo } from "react";
import {
  NDT_METHODS,
  NDT_METHOD_LABELS,
  NDT_REQUEST_STATUS,
  NDT_REQUEST_STATUS_LABELS,
  NDT_REPORT_STATUS,
  NDT_REPORT_STATUS_LABELS,
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
} from "@/lib/weld-utils";
import { useNdtScope } from "@/contexts/NdtScopeContext";
import FormNdtReport from "@/components/FormNdtReport";
import FormNdtRequest from "@/components/FormNdtRequest";

function PanelNdtManagement({
  ndtRequests = [],
  ndtReports = [],
  setNdtRequests,
  setNdtReports,
  weldPoints = [],
  setWeldPoints,
  drawingSettings = {},
  getWeldName,
  onClose,
}) {
  const ndtContext = useNdtScope();
  const [view, setView] = useState("list");
  const [editingReportId, setEditingReportId] = useState(null);
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [creatingReport, setCreatingReport] = useState(false);
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [reportFromRequest, setReportFromRequest] = useState(null);

  const reportToEdit = editingReportId
    ? ndtReports.find((r) => r.id === editingReportId)
    : null;
  const requestToEdit = editingRequestId
    ? ndtRequests.find((r) => r.id === editingRequestId)
    : null;

  const methodOptions = useMemo(
    () =>
      sortNdtMethods([
        ...NDT_METHODS,
        ...(drawingSettings?.ndtRequirements || []).map((item) => item?.method),
        ...(ndtRequests || []).map((request) => request?.method),
        ...(ndtReports || []).map((report) => report?.method),
      ]),
    [drawingSettings, ndtRequests, ndtReports]
  );

  function handleCreateReport(linkedRequest = null) {
    setEditingReportId(null);
    setReportFromRequest(linkedRequest ?? null);
    setCreatingReport(true);
    setView("form");
  }

  function handleEditReport(report) {
    setReportFromRequest(null);
    setCreatingReport(false);
    setEditingReportId(report.id);
    setView("form");
  }

  function handleCloseForm() {
    setView("list");
    setCreatingReport(false);
    setEditingReportId(null);
    setReportFromRequest(null);
    setCreatingRequest(false);
    setEditingRequestId(null);
  }

  function handleCreateRequest() {
    setEditingRequestId(null);
    setCreatingRequest(true);
    setView("formRequest");
  }

  function handleEditRequest(request) {
    setCreatingRequest(false);
    setEditingRequestId(request.id);
    setView("formRequest");
  }

  function handleCloseRequestForm() {
    setView("list");
    setCreatingRequest(false);
    setEditingRequestId(null);
  }

  function handleReportSubmit(report) {
    const reportWithStatus = {
      ...report,
      status: NDT_REPORT_STATUS.CREATED,
    };
    setWeldPoints((prev) => applyReportToWelds(reportWithStatus, prev));
    if (reportToEdit) {
      setNdtReports((prev) =>
        prev.map((r) => (r.id === report.id ? reportWithStatus : r))
      );
    } else {
      setNdtReports((prev) => [...prev, reportWithStatus]);
    }
    handleCloseForm();
  }

  function handleValidateReport(report) {
    setNdtReports((prev) =>
      prev.map((r) =>
        r.id === report.id ? { ...r, status: NDT_REPORT_STATUS.COMPLETED } : r
      )
    );
    if (report.requestId) {
      setNdtRequests((prev) =>
        prev.map((r) =>
          r.id === report.requestId ? { ...r, status: NDT_REQUEST_STATUS.COMPLETED } : r
        )
      );
    }
  }

  function handleRequestSubmit(request) {
    if (requestToEdit) {
      setNdtRequests((prev) =>
        prev.map((r) => (r.id === request.id ? request : r))
      );
    } else {
      setNdtRequests((prev) => [...prev, request]);
    }
    handleCloseRequestForm();
  }

  function handleDeleteReport(report) {
    if (confirm(`Delete NDT report (${NDT_METHOD_LABELS[report.method] || report.method}, ${report.reportDate})? Results from this report will be removed from welds (manually overridden results are kept).`)) {
      setWeldPoints((prev) => clearReportResultsFromWelds(report, prev));
      setNdtReports((prev) => prev.filter((r) => r.id !== report.id));
    }
  }

  function handleDeleteRequest(request) {
    if (confirm("Delete this NDT request?")) {
      setNdtRequests((prev) => prev.filter((r) => r.id !== request.id));
    }
  }

  function handleGenerateRequest(request) {
    setNdtRequests((prev) =>
      prev.map((r) =>
        r.id === request.id ? { ...r, status: NDT_REQUEST_STATUS.SENT } : r
      )
    );
  }

  function handleAutoGenerateNdtRequests() {
    const newRequests = [];
    const existingPlusNew = () => [...ndtRequests, ...newRequests];
    methodOptions.forEach((method) => {
      const weldIds = weldPoints
        .filter((w) => {
          const ndtSel = computeNdtSelection(w, drawingSettings, weldPoints, ndtContext);
          if (!ndtSel[method]) return false;
          return (
            isWeldReadyForNdt(w, ndtContext) &&
            !isWeldRepairNeeded(w) &&
            !isWeldAlreadyAcceptedForMethod(w, method) &&
            !isWeldInNdtRequestForMethod(w.id, method, existingPlusNew())
          );
        })
        .map((w) => w.id);
      if (weldIds.length > 0) {
        newRequests.push({
          id: `ndt-req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${method}`,
          createdAt: new Date().toISOString(),
          method,
          title: getNextNdtRequestDisplayName(existingPlusNew(), method),
          status: NDT_REQUEST_STATUS.DRAFT,
          weldIds,
        });
      }
    });
    if (newRequests.length === 0) {
      return;
    }
    setNdtRequests((prev) => [...prev, ...newRequests]);
  }

  const weldsReadyCount = useMemo(
    () => weldPoints.filter((w) => isWeldReadyForNdt(w, ndtContext)).length,
    [weldPoints, ndtContext]
  );

  const recapOptions = useMemo(() => {
    const opts = [];
    methodOptions.forEach((m) => {
      opts.push({ value: `ready-${m}`, label: `Ready for ${m}` });
    });
    opts.push({ value: "not-ready", label: "Not ready" });
    methodOptions.forEach((m) => {
      opts.push({ value: `accepted-${m}`, label: `Already accepted (${m})` });
    });
    methodOptions.forEach((m) => {
      opts.push({ value: `planned-${m}`, label: `Planned (${m})` });
    });
    opts.push({ value: "repair", label: "Repair needed" });
    return opts;
  }, [methodOptions]);

  const [recapFilter, setRecapFilter] = useState("");

  const recapWelds = useMemo(() => {
    if (!recapFilter) return [];
    if (recapFilter === "not-ready") {
      return weldPoints.filter((w) => !isWeldReadyForNdt(w, ndtContext));
    }
    if (recapFilter === "repair") {
      return weldPoints.filter((w) => isWeldRepairNeeded(w));
    }
    if (recapFilter.startsWith("ready-")) {
      const method = recapFilter.slice(6);
      return weldPoints.filter(
        (w) =>
          isWeldReadyForNdt(w, ndtContext) &&
          !isWeldRepairNeeded(w) &&
          !isWeldAlreadyAcceptedForMethod(w, method) &&
          !isWeldInNdtRequestForMethod(w.id, method, ndtRequests)
      );
    }
    if (recapFilter.startsWith("accepted-")) {
      const method = recapFilter.slice(9);
      return weldPoints.filter((w) => isWeldAlreadyAcceptedForMethod(w, method));
    }
    if (recapFilter.startsWith("planned-")) {
      const method = recapFilter.slice(8);
      return weldPoints.filter((w) => isWeldInNdtRequestForMethod(w.id, method, ndtRequests));
    }
    return [];
  }, [weldPoints, recapFilter, ndtRequests, ndtContext]);

  return (
    <div className="flex flex-col h-full bg-base-100 border-l border-base-300">
      <div className="flex items-center justify-between border-b border-base-300 px-4 py-2">
        <h2 className="font-semibold text-lg">NDT management</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {view === "list" && (
          <>
            <section className="mb-4">
              <h3 className="font-medium mb-2">Recap by status</h3>
              <select
                className="select select-bordered select-xs w-full max-w-xs"
                value={recapFilter}
                onChange={(e) => setRecapFilter(e.target.value)}
                aria-label="View welds by NDT status"
              >
                <option value="">Select status to view welds…</option>
                {recapOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {recapFilter && (
                <div className="mt-2 border border-base-300 rounded-lg overflow-hidden">
                  <table className="table table-xs">
                    <thead>
                      <tr>
                        <th className="w-10">#</th>
                        <th>Weld</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recapWelds.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="text-base-content/60 text-sm">
                            No welds in this category.
                          </td>
                        </tr>
                      ) : (
                        recapWelds.map((w, i) => (
                          <tr key={w.id}>
                            <td className="text-base-content/60">{i + 1}</td>
                            <td className="font-medium">{getWeldName(w, weldPoints)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <p className="text-sm text-base-content/70 mb-4">
              {weldsReadyCount} weld{weldsReadyCount !== 1 ? "s" : ""} ready for NDT (fitter + welder info filled).
            </p>

            {/* Workflow: 1. NDT requests */}
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-content text-sm font-bold">1</span>
                <h3 className="font-semibold text-base">NDT requests</h3>
              </div>
              <p className="text-sm text-base-content/70 mb-2">Create a request (draft) then generate it to send. From a sent request you can create a linked report.</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleAutoGenerateNdtRequests}
                  title="Create one NDT request per type for welds that are ready and need that NDT (by %)."
                >
                  Auto generate
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleCreateRequest}
                >
                  Create request
                </button>
              </div>
              {ndtRequests.length === 0 ? (
                <p className="text-sm text-base-content/60 py-2">No NDT requests yet.</p>
              ) : (
                <ul className="space-y-2">
                  {ndtRequests.map((req) => (
                    <li
                      key={req.id}
                      className="border border-base-300 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{req.title || `${req.method || "NDT"} request`}</span>
                        <span className="text-base-content/60 mx-2">·</span>
                        <span className="text-sm font-medium">{NDT_REQUEST_STATUS_LABELS[req.status] ?? req.status ?? "Draft"}</span>
                        <span className="text-base-content/60 mx-2">·</span>
                        <span className="text-sm">{req.weldIds?.length ?? 0} welds</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {req.status === NDT_REQUEST_STATUS.DRAFT && (
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            onClick={() => handleGenerateRequest(req)}
                            title="Mark as sent"
                          >
                            Generate
                          </button>
                        )}
                        {req.status === NDT_REQUEST_STATUS.SENT && (
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            onClick={() => handleCreateReport(req)}
                            title="Create report linked to this request (pre-filled)"
                          >
                            Create report
                          </button>
                        )}
                        <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleEditRequest(req)}>Edit</button>
                        <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleDeleteRequest(req)}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Workflow: 2. Create report (standalone) */}
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-content text-sm font-bold">2</span>
                <h3 className="font-semibold text-base">Create report</h3>
              </div>
              <p className="text-sm text-base-content/70 mb-2">Create a standalone report (not linked to a request), or use a sent request above to create a linked one.</p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => handleCreateReport(null)}
              >
                Create standalone report
              </button>
            </section>

            {/* Workflow: 3. Reports & validate */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-content text-sm font-bold">3</span>
                <h3 className="font-semibold text-base">Reports & validate</h3>
              </div>
              <p className="text-sm text-base-content/70 mb-2">Validate a report to close the workflow (completes the linked request if any).</p>
              {ndtReports.length === 0 ? (
                <p className="text-sm text-base-content/60 py-2">No NDT reports yet.</p>
              ) : (
                <ul className="space-y-2">
                  {ndtReports.map((report) => (
                    <li
                      key={report.id}
                      className="border border-base-300 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{NDT_METHOD_LABELS[report.method] || report.method}</span>
                        <span className="text-base-content/60 mx-2">·</span>
                        <span className="text-sm">{report.reportDate}</span>
                        <span className="text-base-content/60 mx-2">·</span>
                        <span className="text-sm">{NDT_REPORT_STATUS_LABELS[report.status] ?? report.status ?? "Created"}</span>
                        <span className="text-base-content/60 mx-2">·</span>
                        <span className="text-sm">{report.weldResults?.length ?? 0} welds</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {report.status === NDT_REPORT_STATUS.CREATED && (
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            onClick={() => handleValidateReport(report)}
                            title="Close workflow (completes linked request)"
                          >
                            Validate
                          </button>
                        )}
                        <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleEditReport(report)}>Edit</button>
                        <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleDeleteReport(report)}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {view === "form" && (
          <div>
            <h3 className="font-medium mb-3">
              {reportToEdit ? "Edit NDT report" : reportFromRequest ? "Create report from request" : "Create standalone report"}
            </h3>
            <FormNdtReport
              weldPoints={weldPoints}
              ndtRequests={ndtRequests}
              drawingSettings={drawingSettings}
              methodOptions={methodOptions}
              requestId={reportFromRequest?.id ?? null}
              initialRequest={reportFromRequest}
              report={reportToEdit}
              onSubmit={handleReportSubmit}
              onCancel={handleCloseForm}
              getWeldName={getWeldName}
            />
          </div>
        )}

        {view === "formRequest" && (
          <div>
            <h3 className="font-medium mb-3">
              {requestToEdit ? "Edit NDT request" : "Create NDT request"}
            </h3>
            <FormNdtRequest
              weldPoints={weldPoints}
              ndtRequests={ndtRequests}
              methodOptions={methodOptions}
              drawingSettings={drawingSettings}
              request={requestToEdit}
              onSubmit={handleRequestSubmit}
              onCancel={handleCloseRequestForm}
              getWeldName={getWeldName}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default PanelNdtManagement;
