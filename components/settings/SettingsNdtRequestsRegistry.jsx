"use client";

import { useState, useMemo, useCallback } from "react";
import {
  NDT_METHODS,
  NDT_METHOD_LABELS,
  NDT_REQUEST_STATUS,
  NDT_REQUEST_STATUS_LABELS,
  sortNdtMethods,
} from "@/lib/constants";
import {
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
import FormNdtRequest from "@/components/FormNdtRequest";

/**
 * NDT request list + create/edit (Settings). Persists via onPersist({ ndtRequests }).
 */
function SettingsNdtRequestsRegistry({
  ndtRequests = [],
  ndtReports = [],
  weldPoints = [],
  drawingSettings = {},
  getWeldName,
  onPersist,
}) {
  const ndtContext = useNdtScope();
  const [view, setView] = useState("list");
  const [editingRequestId, setEditingRequestId] = useState(null);

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

  function handleCloseForm() {
    setView("list");
    setEditingRequestId(null);
  }

  function handleCreateRequest() {
    setEditingRequestId(null);
    setView("form");
  }

  function handleEditRequest(request) {
    setEditingRequestId(request.id);
    setView("form");
  }

  function handleRequestSubmit(request) {
    let next;
    if (requestToEdit) {
      next = ndtRequests.map((r) => (r.id === request.id ? request : r));
    } else {
      next = [...ndtRequests, request];
    }
    onPersist?.({ ndtRequests: next });
    handleCloseForm();
  }

  function handleDeleteRequest(request) {
    if (!confirm("Delete this NDT request?")) return;
    onPersist?.({
      ndtRequests: ndtRequests.filter((r) => r.id !== request.id),
    });
  }

  function handleGenerateRequest(request) {
    onPersist?.({
      ndtRequests: ndtRequests.map((r) =>
        r.id === request.id ? { ...r, status: NDT_REQUEST_STATUS.SENT } : r
      ),
    });
  }

  const handleAutoGenerateNdtRequests = useCallback(() => {
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
    if (newRequests.length === 0) return;
    onPersist?.({ ndtRequests: [...ndtRequests, ...newRequests] });
  }, [methodOptions, ndtRequests, weldPoints, drawingSettings, ndtContext, onPersist]);

  return (
    <div className="space-y-4 min-w-0 text-sm">
      {view === "list" && (
        <>
          <p className="text-xs text-base-content/70">
            Create draft requests, generate to mark as sent, then create NDT reports from the NDT reports section
            (or from the NDT workspace).
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleAutoGenerateNdtRequests}>
              Auto generate
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleCreateRequest}>
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
                    <span className="text-sm font-medium">
                      {NDT_REQUEST_STATUS_LABELS[req.status] ?? req.status ?? "Draft"}
                    </span>
                    <span className="text-base-content/60 mx-2">·</span>
                    <span className="text-sm">{NDT_METHOD_LABELS[req.method] || req.method || "—"}</span>
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
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleEditRequest(req)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => handleDeleteRequest(req)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {view === "form" && (
        <div>
          <h4 className="font-medium text-sm mb-3">
            {requestToEdit ? "Edit NDT request" : "Create NDT request"}
          </h4>
          <FormNdtRequest
            weldPoints={weldPoints}
            ndtRequests={ndtRequests}
            methodOptions={methodOptions}
            drawingSettings={drawingSettings}
            request={requestToEdit}
            onSubmit={handleRequestSubmit}
            onCancel={handleCloseForm}
            getWeldName={getWeldName}
          />
        </div>
      )}
    </div>
  );
}

export default SettingsNdtRequestsRegistry;
