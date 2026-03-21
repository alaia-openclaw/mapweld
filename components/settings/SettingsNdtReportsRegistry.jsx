"use client";

import { useMemo, useState, useCallback, Fragment } from "react";
import {
  NDT_METHOD_LABELS,
  NDT_REPORT_STATUS,
  NDT_REPORT_STATUS_LABELS,
  sortNdtMethods,
} from "@/lib/constants";
import { applyReportToWelds, clearReportResultsFromWelds } from "@/lib/ndt-utils";
import { getWeldName } from "@/lib/weld-utils";
import FormNdtReport from "@/components/FormNdtReport";

/**
 * Full NDT report list + create/edit via the same form as the NDT workspace.
 */
function SettingsNdtReportsRegistry({
  ndtReports = [],
  ndtRequests = [],
  weldPoints = [],
  drawingSettings = {},
  getWeldName: getWeldNameProp,
  onPersist,
}) {
  const getWeldNameLocal = getWeldNameProp || ((w) => getWeldName(w, weldPoints));
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState(null);

  const filterNorm = (filter || "").trim().toLowerCase();

  const methodOptions = useMemo(
    () =>
      sortNdtMethods([
        ...(drawingSettings?.ndtRequirements || []).map((item) => item?.method),
        ...(ndtRequests || []).map((request) => request?.method),
        ...(ndtReports || []).map((report) => report?.method),
      ]),
    [drawingSettings, ndtRequests, ndtReports]
  );

  const rows = useMemo(() => {
    const list = Array.isArray(ndtReports) ? ndtReports : [];
    if (!filterNorm) return list;
    return list.filter((r) => {
      const m = (r.method || "").toLowerCase();
      const d = (r.reportDate || "").toLowerCase();
      const idStr = (r.id || "").toLowerCase();
      return m.includes(filterNorm) || d.includes(filterNorm) || idStr.includes(filterNorm);
    });
  }, [ndtReports, filterNorm]);

  const reportToEdit = editingReportId ? ndtReports.find((r) => r.id === editingReportId) : null;

  const handleSubmitReport = useCallback(
    (report) => {
      const reportWithStatus = {
        ...report,
        status:
          reportToEdit?.status ??
          report?.status ??
          NDT_REPORT_STATUS.CREATED,
      };
      const nextWelds = applyReportToWelds(reportWithStatus, weldPoints);
      let nextReports;
      if (reportToEdit) {
        nextReports = ndtReports.map((r) => (r.id === report.id ? reportWithStatus : r));
      } else {
        nextReports = [...ndtReports, reportWithStatus];
      }
      onPersist?.({ ndtReports: nextReports, weldPoints: nextWelds });
      setFormOpen(false);
      setEditingReportId(null);
    },
    [ndtReports, weldPoints, reportToEdit, onPersist]
  );

  const handleValidate = useCallback(
    (report) => {
      const next = ndtReports.map((r) =>
        r.id === report.id ? { ...r, status: NDT_REPORT_STATUS.COMPLETED } : r
      );
      onPersist?.({ ndtReports: next, weldPoints });
    },
    [ndtReports, weldPoints, onPersist]
  );

  const handleDelete = useCallback(
    (report) => {
      if (
        !confirm(
          `Delete NDT report (${NDT_METHOD_LABELS[report.method] || report.method}, ${report.reportDate})? Results from this report will be removed from welds where not manually overridden.`
        )
      )
        return;
      const nextWelds = clearReportResultsFromWelds(report, weldPoints);
      const nextReports = ndtReports.filter((r) => r.id !== report.id);
      onPersist?.({ ndtReports: nextReports, weldPoints: nextWelds });
      if (editingReportId === report.id) {
        setEditingReportId(null);
        setFormOpen(false);
      }
    },
    [ndtReports, weldPoints, editingReportId, onPersist]
  );

  const openAdd = () => {
    setEditingReportId(null);
    setFormOpen(true);
  };

  const openEdit = (id) => {
    setEditingReportId(id);
    setFormOpen(true);
  };

  return (
    <div className="space-y-3 min-w-0">
      <p className="text-xs text-base-content/70">
        Create and validate NDT reports here or from the NDT workspace. Completing a report marks it ready for
        databook / traceability.
      </p>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end sm:justify-between">
            <div className="form-control flex-1 min-w-0 max-w-md">
              <label className="label py-0" htmlFor="ndt-registry-filter">
                <span className="label-text text-xs">Search</span>
              </label>
              <input
                id="ndt-registry-filter"
                type="search"
                className="input input-bordered input-xs w-full"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Method, date, id…"
                autoComplete="off"
              />
            </div>
            <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={openAdd}>
              + Add NDT report
            </button>
          </div>

          <div className="overflow-x-auto border border-base-300 rounded-lg">
            <table className="table table-xs table-pin-rows">
              <thead>
                <tr className="bg-base-200">
                  <th>Method</th>
                  <th>Report date</th>
                  <th>Status</th>
                  <th className="tabular-nums">Welds</th>
                  <th className="w-36"> </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-base-content/50 py-6">
                      No NDT reports yet.
                    </td>
                  </tr>
                )}
                {rows.map((r) => {
                  const n = (r.weldResults || []).length;
                  const isOpen = expandedId === r.id;
                  const welds = (r.weldResults || []).map((row) => {
                    const w = weldPoints.find((wp) => wp.id === row.weldId);
                    return w ? getWeldNameLocal(w, weldPoints) : row.weldId;
                  });
                  return (
                    <Fragment key={r.id}>
                      <tr className={`hover ${isOpen ? "bg-base-200/80" : ""}`}>
                        <td className="font-medium">{NDT_METHOD_LABELS[r.method] || r.method || "—"}</td>
                        <td>{r.reportDate || "—"}</td>
                        <td>
                          <span
                            className={`badge badge-sm ${
                              r.status === NDT_REPORT_STATUS.COMPLETED ? "badge-success" : "badge-ghost"
                            }`}
                          >
                            {NDT_REPORT_STATUS_LABELS[r.status] || r.status || "—"}
                          </span>
                        </td>
                        <td className="text-center tabular-nums">{n}</td>
                        <td>
                          <div className="flex flex-wrap gap-1 justify-end">
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => setExpandedId(isOpen ? null : r.id)}
                            >
                              {isOpen ? "Hide" : "Welds"}
                            </button>
                            {r.status !== NDT_REPORT_STATUS.COMPLETED && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={() => handleValidate(r)}
                              >
                                Complete
                              </button>
                            )}
                            <button type="button" className="btn btn-ghost btn-xs" onClick={() => openEdit(r.id)}>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => handleDelete(r)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-base-200/50">
                          <td colSpan={5} className="!pt-2 !pb-3">
                            <ul className="text-xs list-disc list-inside space-y-0.5 px-1">
                              {welds.length === 0 ? (
                                <li className="list-none text-base-content/50">No welds in this report.</li>
                              ) : (
                                welds.map((name, i) => <li key={i}>{name}</li>)
                              )}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {formOpen && (
          <div className="lg:w-[min(100%,28rem)] shrink-0 border border-base-300 rounded-lg bg-base-200/30 p-3 max-h-[min(70vh,520px)] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h4 className="font-medium text-sm">{reportToEdit ? "Edit NDT report" : "New NDT report"}</h4>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => {
                  setFormOpen(false);
                  setEditingReportId(null);
                }}
              >
                Close
              </button>
            </div>
            <FormNdtReport
              key={reportToEdit?.id || "new"}
              weldPoints={weldPoints}
              ndtRequests={ndtRequests}
              report={reportToEdit || undefined}
              methodOptions={methodOptions}
              drawingSettings={drawingSettings}
              getWeldName={getWeldNameLocal}
              onSubmit={handleSubmitReport}
              onCancel={() => {
                setFormOpen(false);
                setEditingReportId(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsNdtReportsRegistry;
