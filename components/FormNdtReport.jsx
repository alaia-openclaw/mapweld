"use client";

import { useState, useCallback, useEffect } from "react";
import {
  NDT_METHODS,
  NDT_METHOD_LABELS,
  NDT_RESULT_OUTCOMES,
  NDT_RESULT_OUTCOME_LABELS,
} from "@/lib/constants";
import { getWeldName, getWeldOverallStatus } from "@/lib/weld-utils";
import { computeNdtSelection } from "@/lib/weld-utils";

function generateId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      const base64 = typeof result === "string" ? result.replace(/^data:.*?;base64,/, "") : "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getWeldStatusLabel(weld, weldPoints, ndtRequests, drawingSettings) {
  const req = (ndtRequests || []).find((r) => (r.weldIds || []).includes(weld.id));
  if (req) return `In NDT request: ${req.title || req.method || req.id}`;
  const ndtSel = computeNdtSelection(weld, drawingSettings, weldPoints);
  const status = getWeldOverallStatus(weld, ndtSel);
  const labels = { complete: "Complete", incomplete: "Incomplete", not_started: "Not started" };
  return labels[status] || status;
}

function FormNdtReport({
  weldPoints = [],
  ndtRequests = [],
  requestId: initialRequestId,
  initialRequest = null,
  report: initialReport,
  onSubmit,
  onCancel,
  getWeldName: getWeldNameProp,
  drawingSettings = {},
}) {
  const getWeldNameLocal = getWeldNameProp || ((w) => getWeldName(w, weldPoints));

  const [method, setMethod] = useState(
    initialReport?.method || initialRequest?.method || NDT_METHODS[0]
  );
  const [reportDate, setReportDate] = useState(
    initialReport?.reportDate || new Date().toISOString().slice(0, 10)
  );
  const [requestId, setRequestId] = useState(
    initialRequestId ?? initialReport?.requestId ?? initialRequest?.id ?? ""
  );
  const [attachments, setAttachments] = useState(initialReport?.attachments || []);
  const [rows, setRows] = useState(() => {
    if (initialReport?.weldResults?.length) {
      return initialReport.weldResults.map((r) => ({
        id: generateId(),
        weldId: r.weldId,
        result: r.result,
      }));
    }
    if (initialRequest?.weldIds?.length) {
      return initialRequest.weldIds.map((weldId) => ({
        id: generateId(),
        weldId,
        result: NDT_RESULT_OUTCOMES.ACCEPTED,
      }));
    }
    return [];
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (requestId) {
      const req = ndtRequests.find((r) => r.id === requestId);
      if (req && req.method !== method) setRequestId("");
    }
  }, [method, ndtRequests, requestId]);

  useEffect(() => {
    if (!requestId || rows.length > 0) return;
    const req = ndtRequests.find((r) => r.id === requestId);
    if (req?.weldIds?.length) {
      setRows(
        req.weldIds.map((weldId) => ({
          id: generateId(),
          weldId,
          result: NDT_RESULT_OUTCOMES.ACCEPTED,
        }))
      );
    }
  }, [requestId, ndtRequests, rows.length]);

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      { id: generateId(), weldId: "", result: NDT_RESULT_OUTCOMES.ACCEPTED },
    ]);
  }, []);

  const removeRow = useCallback((id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const setRowWeld = useCallback((rowId, weldId) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, weldId } : r)));
  }, []);

  const setRowResult = useCallback((rowId, result) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, result } : r)));
  }, []);

  const handleFileSelect = useCallback(async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setIsUploading(true);
    try {
      const newAttachments = await Promise.all(
        Array.from(files).map(async (file) => ({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: file.name,
          base64: await fileToBase64(file),
        }))
      );
      setAttachments((prev) => [...prev, ...newAttachments]);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }, []);

  const removeAttachment = useCallback((id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const seen = new Set();
      const weldResults = rows
        .filter((r) => r.weldId)
        .filter((r) => {
          if (seen.has(r.weldId)) return false;
          seen.add(r.weldId);
          return true;
        })
        .map((r) => ({ weldId: r.weldId, result: r.result }));
      if (weldResults.length === 0) return;
      const report = {
        id: initialReport?.id || `ndt-rpt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: initialReport?.createdAt || new Date().toISOString(),
        requestId: requestId || undefined,
        reportDate,
        method,
        attachments: [...attachments],
        weldResults,
      };
      onSubmit?.(report);
    },
    [initialReport, requestId, reportDate, method, attachments, rows, onSubmit]
  );
  const prefillFromRequest = useCallback(() => {
    if (!requestId) return;
    const req = ndtRequests.find((r) => r.id === requestId);
    if (!req?.weldIds?.length) return;
    setRows(
      req.weldIds.map((weldId) => ({
        id: generateId(),
        weldId,
        result: NDT_RESULT_OUTCOMES.ACCEPTED,
      }))
    );
  }, [requestId, ndtRequests]);

  const validRows = rows.filter((r) => r.weldId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">NDT method</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          {NDT_METHODS.map((m) => (
            <option key={m} value={m}>
              {NDT_METHOD_LABELS[m] || m}
            </option>
          ))}
        </select>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Report date</span>
        </label>
        <input
          type="date"
          className="input input-bordered w-full"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
        />
      </div>

      {ndtRequests.length > 0 && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">Link to NDT request (optional)</span>
          </label>
          <div className="flex gap-2">
            <select
              className="select select-bordered flex-1"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
            >
              <option value="">None</option>
              {ndtRequests
                .filter((r) => r.method === method)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title || `${r.method || "NDT"} (${r.weldIds?.length ?? 0} welds)`}
                  </option>
                ))}
            </select>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={prefillFromRequest}
              disabled={!requestId}
            >
              Prefill welds
            </button>
          </div>
        </div>
      )}

      <div className="form-control">
        <label className="label">
          <span className="label-text">Attachments (PDF/DWG)</span>
        </label>
        <input
          type="file"
          multiple
          accept=".pdf,application/pdf,.dwg"
          className="file-input file-input-bordered w-full"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        {isUploading && <p className="text-sm text-base-content/60 mt-1">Uploading…</p>}
        {attachments.length > 0 && (
          <ul className="mt-2 space-y-1">
            {attachments.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-sm">
                <span className="truncate flex-1">{a.name}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => removeAttachment(a.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="form-control">
        <div className="flex items-center justify-between mb-2">
          <label className="label py-0">
            <span className="label-text">Welds in report</span>
          </label>
          <button type="button" className="btn btn-outline btn-xs" onClick={addRow}>
            + Add
          </button>
        </div>
        <div className="border border-base-300 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
          <table className="table table-xs">
            <thead>
              <tr>
                <th className="min-w-[10rem]">Weld</th>
                <th className="min-w-[8rem]">Status</th>
                <th className="min-w-[10rem]">Result</th>
                <th className="w-24 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const weld = weldPoints.find((w) => w.id === row.weldId);
                const weldLabel = weld ? getWeldNameLocal(weld) : "";
                const selectedElsewhere = rows.filter((r) => r.id !== row.id).map((r) => r.weldId).filter(Boolean);
                const availableWelds = weldPoints.filter(
                  (w) => w.id === row.weldId || !selectedElsewhere.includes(w.id)
                );
                return (
                  <tr key={row.id}>
                    <td>
                      <select
                        className="select select-bordered select-xs w-full min-w-[9rem]"
                        value={row.weldId}
                        onChange={(e) => setRowWeld(row.id, e.target.value)}
                        title={weldLabel ? `Weld: ${weldLabel}` : "Select weld"}
                      >
                        <option value="">Select weld…</option>
                        {availableWelds.map((w) => (
                          <option key={w.id} value={w.id}>
                            {getWeldNameLocal(w)}
                          </option>
                        ))}
                      </select>
                      {weldLabel && (
                        <span className="text-xs font-medium text-base-content mt-0.5 block" aria-hidden>
                          {weldLabel}
                        </span>
                      )}
                    </td>
                    <td className="text-xs text-base-content/70 align-top" title={weld ? getWeldStatusLabel(weld, weldPoints, ndtRequests, drawingSettings) : ""}>
                      {weld ? getWeldStatusLabel(weld, weldPoints, ndtRequests, drawingSettings) : "—"}
                    </td>
                    <td>
                      <select
                        className="select select-bordered select-xs w-full min-w-[9rem]"
                        value={row.result}
                        onChange={(e) => setRowResult(row.id, e.target.value)}
                      >
                        {Object.entries(NDT_RESULT_OUTCOME_LABELS)
                          .filter(([k]) => ["accepted", "rejected", "omitted_or_inconclusive"].includes(k))
                          .map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="align-top text-right whitespace-nowrap">
                      <button
                        type="button"
                        className="btn btn-error btn-outline btn-xs gap-1"
                        onClick={() => removeRow(row.id)}
                        aria-label={`Remove ${weldLabel || "row"} from report`}
                      >
                        <span aria-hidden>×</span>
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="text-sm text-base-content/60 py-2">
            Link to an NDT request and click Prefill, or add rows with + Add.
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={validRows.length === 0}
        >
          {initialReport ? "Update report" : "Create report"}
        </button>
      </div>
    </form>
  );
}

export default FormNdtReport;
