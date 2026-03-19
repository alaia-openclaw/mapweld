"use client";

import { useState, useMemo } from "react";
import { NDT_METHODS, NDT_METHOD_LABELS, NDT_REQUEST_STATUS, NDT_REQUEST_STATUS_LABELS, sortNdtMethods } from "@/lib/constants";
import {
  getWeldName,
  isWeldReadyForNdt,
  isWeldRepairNeeded,
  isWeldAlreadyAcceptedForMethod,
} from "@/lib/weld-utils";
import { getNextNdtRequestDisplayName, isWeldInNdtRequestForMethod } from "@/lib/ndt-utils";

function generateId() {
  return `ndt-req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function FormNdtRequest({
  weldPoints = [],
  ndtRequests = [],
  request: initialRequest,
  methodOptions = [],
  hideMethodSelect = false,
  onSubmit,
  onCancel,
  getWeldName: getWeldNameProp,
}) {
  const getWeldNameLocal = getWeldNameProp || ((w) => getWeldName(w, weldPoints));
  const availableMethods = useMemo(
    () => sortNdtMethods([...(methodOptions || []), ...NDT_METHODS, initialRequest?.method]),
    [methodOptions, initialRequest?.method]
  );

  const [method, setMethod] = useState(initialRequest?.method ?? availableMethods[0] ?? NDT_METHODS[0]);
  const [weldIds, setWeldIds] = useState(() => new Set(initialRequest?.weldIds ?? []));
  const [status, setStatus] = useState(initialRequest?.status ?? NDT_REQUEST_STATUS.DRAFT);
  const [notes, setNotes] = useState(initialRequest?.notes ?? "");

  const displayName = useMemo(
    () => getNextNdtRequestDisplayName(ndtRequests, method),
    [ndtRequests, method]
  );

  const { readyForNdt, notReady, alreadyAccepted, planned, repairNeeded } = useMemo(() => {
    const readyForNdtList = [];
    const notReadyList = [];
    const alreadyAcceptedList = [];
    const plannedList = [];
    const repairNeededList = [];
    weldPoints.forEach((w) => {
      if (isWeldRepairNeeded(w)) {
        repairNeededList.push(w);
      } else if (isWeldAlreadyAcceptedForMethod(w, method)) {
        alreadyAcceptedList.push(w);
      } else if (isWeldInNdtRequestForMethod(w.id, method, ndtRequests)) {
        plannedList.push(w);
      } else if (isWeldReadyForNdt(w)) {
        readyForNdtList.push(w);
      } else {
        notReadyList.push(w);
      }
    });
    return {
      readyForNdt: readyForNdtList,
      notReady: notReadyList,
      alreadyAccepted: alreadyAcceptedList,
      planned: plannedList,
      repairNeeded: repairNeededList,
    };
  }, [weldPoints, method, ndtRequests]);

  function toggleWeld(weldId) {
    setWeldIds((prev) => {
      const next = new Set(prev);
      if (next.has(weldId)) next.delete(weldId);
      else next.add(weldId);
      return next;
    });
  }

  function selectAllInGroup(groupWelds) {
    setWeldIds((prev) => {
      const next = new Set(prev);
      groupWelds.forEach((w) => next.add(w.id));
      return next;
    });
  }

  function clearAll() {
    setWeldIds(new Set());
  }

  function handleSubmit(e) {
    e.preventDefault();
    const title = initialRequest?.title ?? displayName;
    const request = {
      id: initialRequest?.id || generateId(),
      createdAt: initialRequest?.createdAt || new Date().toISOString(),
      method,
      title,
      status,
      weldIds: Array.from(weldIds),
      notes: notes.trim() || undefined,
    };
    onSubmit?.(request);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!hideMethodSelect && availableMethods.length > 1 ? (
        <div className="form-control">
          <label className="label">
            <span className="label-text">NDT type</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            disabled={!!initialRequest}
          >
            {availableMethods.map((m) => (
              <option key={m} value={m}>
                {NDT_METHOD_LABELS[m] || m}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="form-control">
          <label className="label">
            <span className="label-text">NDT type</span>
          </label>
          <p className="text-sm font-medium text-base-content/80 py-1">
            {NDT_METHOD_LABELS[method] || method}
          </p>
        </div>
      )}

      <div className="form-control">
        <label className="label">
          <span className="label-text">Request name</span>
        </label>
        <p className="text-sm font-medium text-base-content/80 py-1">
          {initialRequest ? (initialRequest.title || displayName) : displayName}
        </p>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Status</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {Object.entries(NDT_REQUEST_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Welds</span>
        </label>
        <div className="flex gap-2 mb-2">
          <button type="button" className="btn btn-ghost btn-xs" onClick={clearAll}>
            Clear all
          </button>
        </div>
        <div className="border border-base-300 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
          {planned.length > 0 && (
            <div className="p-2 bg-info/10 border-b border-base-300">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase text-info">Planned (in NDT request)</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => selectAllInGroup(planned)}
                >
                  Select all
                </button>
              </div>
              <ul className="menu menu-xs bg-transparent gap-0.5">
                {planned.map((w) => (
                  <li key={w.id}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={weldIds.has(w.id)}
                        onChange={() => toggleWeld(w.id)}
                      />
                      <span>{getWeldNameLocal(w)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {readyForNdt.length > 0 && (
            <div className="p-2 bg-success/10 border-b border-base-300">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase text-success/90">Ready for NDT</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => selectAllInGroup(readyForNdt)}
                >
                  Select all
                </button>
              </div>
              <ul className="menu menu-xs bg-transparent gap-0.5">
                {readyForNdt.map((w) => (
                  <li key={w.id}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={weldIds.has(w.id)}
                        onChange={() => toggleWeld(w.id)}
                      />
                      <span>{getWeldNameLocal(w)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {notReady.length > 0 && (
            <div className="p-2 border-b border-base-300">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase text-base-content/60">Not ready</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => selectAllInGroup(notReady)}
                >
                  Select all
                </button>
              </div>
              <ul className="menu menu-xs bg-base-100 gap-0.5">
                {notReady.map((w) => (
                  <li key={w.id}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={weldIds.has(w.id)}
                        onChange={() => toggleWeld(w.id)}
                      />
                      <span>{getWeldNameLocal(w)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {alreadyAccepted.length > 0 && (
            <div className="p-2 bg-base-200/50 border-b border-base-300">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase text-base-content/70">Already accepted</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => selectAllInGroup(alreadyAccepted)}
                >
                  Select all
                </button>
              </div>
              <ul className="menu menu-xs bg-transparent gap-0.5">
                {alreadyAccepted.map((w) => (
                  <li key={w.id}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={weldIds.has(w.id)}
                        onChange={() => toggleWeld(w.id)}
                      />
                      <span>{getWeldNameLocal(w)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {repairNeeded.length > 0 && (
            <div className="p-2 bg-warning/10 border-b border-base-300">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase text-warning">Repair needed (following a reject)</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => selectAllInGroup(repairNeeded)}
                >
                  Select all
                </button>
              </div>
              <ul className="menu menu-xs bg-transparent gap-0.5">
                {repairNeeded.map((w) => (
                  <li key={w.id}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={weldIds.has(w.id)}
                        onChange={() => toggleWeld(w.id)}
                      />
                      <span>{getWeldNameLocal(w)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {weldPoints.length === 0 && (
          <p className="text-sm text-base-content/60 py-2">No welds in this project.</p>
        )}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Notes (optional)</span>
        </label>
        <textarea
          className="textarea textarea-bordered w-full textarea-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {initialRequest ? "Update request" : "Create request"}
        </button>
      </div>
    </form>
  );
}

export default FormNdtRequest;
