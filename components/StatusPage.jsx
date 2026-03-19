"use client";

import { useMemo, useState, useCallback } from "react";
import { computeNdtSelection } from "@/lib/weld-utils";
import { useNdtScope } from "@/contexts/NdtScopeContext";
import {
  getWeldPipelineStage,
  WELD_PIPELINE_STAGES,
  SPOOL_LIFECYCLE_STAGES,
  normalizeSpoolLifecycleStage,
} from "@/lib/status-utils";

function BarChart({ items, maxValue, className = "" }) {
  const max = maxValue || Math.max(1, ...items.map((i) => i.value));
  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((row) => (
        <div key={row.label} className="flex items-center gap-2 text-sm">
          <span className="w-28 shrink-0 truncate text-base-content/70" title={row.label}>
            {row.label}
          </span>
          <div className="flex-1 h-2 rounded-full bg-base-300 overflow-hidden min-w-0">
            <div
              className={`h-full rounded-full ${row.color || "bg-primary"}`}
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right tabular-nums text-base-content/80">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function StatusPage({
  weldPoints = [],
  weldStatusByWeldId = new Map(),
  getWeldName,
  onSelectWeld,
  onClose,
  drawingSettings = {},
  spools = [],
  onSpoolsChange,
}) {
  const ndtContext = useNdtScope();
  const [tab, setTab] = useState("overview");
  const [filterLocation, setFilterLocation] = useState("all"); // all | shop | field
  const [search, setSearch] = useState("");

  const safeWeldPoints = useMemo(
    () => (Array.isArray(weldPoints) ? weldPoints : []),
    [weldPoints]
  );
  const safeSpools = useMemo(() => (Array.isArray(spools) ? spools : []), [spools]);

  const weldStages = useMemo(() => {
    const buckets = Object.fromEntries(WELD_PIPELINE_STAGES.map((c) => [c.id, []]));
    safeWeldPoints.forEach((w) => {
      if (filterLocation !== "all" && (w.weldLocation || "shop") !== filterLocation) return;
      const ndtSel = computeNdtSelection(w, drawingSettings, safeWeldPoints, ndtContext);
      const stage = getWeldPipelineStage(w, ndtSel, ndtContext);
      const name = getWeldName?.(w, safeWeldPoints) ?? w.id;
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return;
      if (buckets[stage]) buckets[stage].push(w);
    });
    return buckets;
  }, [safeWeldPoints, drawingSettings, filterLocation, search, getWeldName, ndtContext]);

  const spoolByStage = useMemo(() => {
    const buckets = Object.fromEntries(SPOOL_LIFECYCLE_STAGES.map((c) => [c.id, []]));
    safeSpools.forEach((s) => {
      const stage = normalizeSpoolLifecycleStage(s.lifecycleStage);
      const name = (s.name || "").trim() || s.id;
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return;
      if (buckets[stage]) buckets[stage].push(s);
    });
    return buckets;
  }, [safeSpools, search]);

  const overviewStats = useMemo(() => {
    const weldTotal = safeWeldPoints.length;
    let weldCompleted = 0;
    const weldByStage = Object.fromEntries(WELD_PIPELINE_STAGES.map((c) => [c.id, 0]));
    safeWeldPoints.forEach((w) => {
      const ndtSel = computeNdtSelection(w, drawingSettings, safeWeldPoints, ndtContext);
      const stage = getWeldPipelineStage(w, ndtSel, ndtContext);
      weldByStage[stage] = (weldByStage[stage] || 0) + 1;
      if (stage === "completed") weldCompleted++;
    });
    const spoolTotal = safeSpools.length;
    let spoolShipped = 0;
    const spoolByStage = Object.fromEntries(SPOOL_LIFECYCLE_STAGES.map((c) => [c.id, 0]));
    safeSpools.forEach((s) => {
      const stage = normalizeSpoolLifecycleStage(s.lifecycleStage);
      spoolByStage[stage] = (spoolByStage[stage] || 0) + 1;
      if (stage === "shipped") spoolShipped++;
    });
    const weldProgress = weldTotal > 0 ? Math.round((weldCompleted / weldTotal) * 100) : 0;
    const spoolProgress = spoolTotal > 0 ? Math.round((spoolShipped / spoolTotal) * 100) : 0;
    const combined =
      weldTotal + spoolTotal > 0
        ? Math.round(
            ((weldCompleted + spoolShipped) / Math.max(1, weldTotal + spoolTotal)) * 100
          )
        : 0;
    return {
      weldTotal,
      weldCompleted,
      weldProgress,
      weldByStage,
      spoolTotal,
      spoolShipped,
      spoolProgress,
      spoolByStage,
      combined,
    };
  }, [safeWeldPoints, safeSpools, drawingSettings, ndtContext]);

  const handleSpoolStageChange = useCallback(
    (spoolId, stage) => {
      if (!onSpoolsChange) return;
      onSpoolsChange((prev) =>
        prev.map((s) => (s.id === spoolId ? { ...s, lifecycleStage: stage } : s))
      );
    },
    [onSpoolsChange]
  );

  const weldChartItems = WELD_PIPELINE_STAGES.map((c) => ({
    label: c.label,
    value: overviewStats.weldByStage[c.id] || 0,
    color:
      c.id === "completed"
        ? "bg-success"
        : c.id === "not_started"
          ? "bg-base-content/30"
          : "bg-primary",
  }));

  const spoolChartItems = SPOOL_LIFECYCLE_STAGES.map((c) => ({
    label: c.label,
    value: overviewStats.spoolByStage[c.id] || 0,
    color: c.id === "shipped" ? "bg-success" : c.id === "not_started" ? "bg-base-content/30" : "bg-secondary",
  }));

  return (
    <div className="flex flex-col h-full min-h-0 bg-base-100">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-base-300 flex-shrink-0">
        <h2 className="text-lg font-semibold">Project status</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            placeholder="Search…"
            className="input input-bordered input-sm w-40 max-w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select select-bordered select-sm"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            title="Weld location filter"
          >
            <option value="all">All locations</option>
            <option value="shop">Shop welds</option>
            <option value="field">Field welds</option>
          </select>
          <div className="join">
            {[
              { id: "overview", label: "Overview" },
              { id: "welds", label: "Welds" },
              { id: "spools", label: "Spools" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`join-item btn btn-sm ${tab === t.id ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4">
        {tab === "overview" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-base-300 bg-base-200/50 p-4">
                <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide">
                  Overall progress
                </p>
                <p className="text-3xl font-bold tabular-nums mt-1">{overviewStats.combined}%</p>
                <div className="mt-2 h-2 rounded-full bg-base-300 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${overviewStats.combined}%` }}
                  />
                </div>
                <p className="text-xs text-base-content/50 mt-2">
                  Welds completed + spools shipped vs total
                </p>
              </div>
              <div className="rounded-xl border border-base-300 bg-base-200/50 p-4">
                <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide">
                  Welds
                </p>
                <p className="text-2xl font-bold tabular-nums mt-1">
                  {overviewStats.weldCompleted}/{overviewStats.weldTotal}
                </p>
                <p className="text-sm text-base-content/70">Completed</p>
                <div className="mt-2 h-2 rounded-full bg-base-300 overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full"
                    style={{ width: `${overviewStats.weldProgress}%` }}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-base-300 bg-base-200/50 p-4">
                <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide">
                  Spools
                </p>
                <p className="text-2xl font-bold tabular-nums mt-1">
                  {overviewStats.spoolShipped}/{overviewStats.spoolTotal}
                </p>
                <p className="text-sm text-base-content/70">Shipped</p>
                <div className="mt-2 h-2 rounded-full bg-base-300 overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full"
                    style={{ width: `${overviewStats.spoolProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-base-300 p-4">
                <h3 className="font-semibold mb-3">Weld pipeline</h3>
                <BarChart items={weldChartItems} />
              </div>
              <div className="rounded-xl border border-base-300 p-4">
                <h3 className="font-semibold mb-3">Spool lifecycle</h3>
                <BarChart items={spoolChartItems} />
              </div>
            </div>
          </div>
        )}

        {tab === "welds" && (
          <div className="flex gap-3 overflow-x-auto pb-2 min-h-[280px]">
            {WELD_PIPELINE_STAGES.map((col) => (
              <div
                key={col.id}
                className={`flex-shrink-0 w-52 rounded-lg border border-base-300 flex flex-col ${col.class}`}
              >
                <div className="p-2 border-b border-base-300/80 font-medium flex justify-between items-center">
                  <span>{col.label}</span>
                  <span className="badge badge-ghost badge-sm">{weldStages[col.id]?.length ?? 0}</span>
                </div>
                <div className="flex-1 overflow-auto p-2 space-y-2">
                  {(weldStages[col.id] || []).map((weld) => (
                    <button
                      key={weld.id}
                      type="button"
                      className="btn btn-sm btn-ghost w-full justify-start text-left normal-case h-auto min-h-0 py-2 px-2 rounded-lg border border-base-300/60 hover:border-primary bg-base-100/80"
                      onClick={() => onSelectWeld?.(weld.id)}
                    >
                      <span className="font-medium">
                        {getWeldName?.(weld, safeWeldPoints) ?? weld.id}
                      </span>
                      {weld.weldLocation === "field" && (
                        <span className="ml-1 text-xs opacity-70">(field)</span>
                      )}
                    </button>
                  ))}
                  {(weldStages[col.id] || []).length === 0 && (
                    <p className="text-xs text-base-content/50 py-2 text-center">None</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "spools" && (
          <div className="flex gap-3 overflow-x-auto pb-2 min-h-[280px]">
            {SPOOL_LIFECYCLE_STAGES.map((col) => (
              <div
                key={col.id}
                className={`flex-shrink-0 w-52 rounded-lg border border-base-300 flex flex-col ${col.class}`}
              >
                <div className="p-2 border-b border-base-300/80 font-medium flex justify-between items-center">
                  <span>{col.label}</span>
                  <span className="badge badge-ghost badge-sm">{spoolByStage[col.id]?.length ?? 0}</span>
                </div>
                <div className="flex-1 overflow-auto p-2 space-y-2">
                  {(spoolByStage[col.id] || []).map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border border-base-300/60 bg-base-100/80 p-2 space-y-1"
                    >
                      <span className="font-medium block truncate" title={s.name || s.id}>
                        {s.name?.trim() || s.id}
                      </span>
                      {onSpoolsChange && (
                        <select
                          className="select select-bordered select-xs w-full"
                          value={normalizeSpoolLifecycleStage(s.lifecycleStage)}
                          onChange={(e) => handleSpoolStageChange(s.id, e.target.value)}
                        >
                          {SPOOL_LIFECYCLE_STAGES.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                  {(spoolByStage[col.id] || []).length === 0 && (
                    <p className="text-xs text-base-content/50 py-2 text-center">None</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatusPage;
