"use client";

import { useMemo } from "react";
import { computeNdtSelection } from "@/lib/weld-utils";
import {
  NDT_METHOD_LABELS,
  WELD_LOCATION_LABELS,
  WELD_TYPE_LABELS,
  formatNdtRequirements,
} from "@/lib/constants";

function DashboardAnalytics({
  weldPoints = [],
  weldStatusByWeldId = new Map(),
  drawingSettings = {},
  spools = [],
}) {
  const stats = useMemo(() => {
    const total = weldPoints.length;
    let complete = 0;
    let incomplete = 0;
    let notStarted = 0;
    const byLocation = { shop: 0, field: 0 };
    const byType = {};
    let weldsRequiringNdt = 0;

    weldPoints.forEach((w) => {
      const status = weldStatusByWeldId.get(w.id);
      if (status === "complete") complete++;
      else if (status === "incomplete") incomplete++;
      else notStarted++;

      const loc = w.weldLocation || "shop";
      byLocation[loc] = (byLocation[loc] || 0) + 1;

      const type = w.weldType || "butt";
      byType[type] = (byType[type] || 0) + 1;

      const ndtSel = computeNdtSelection(w, drawingSettings, weldPoints);
      const anyNdt = Object.values(ndtSel).some(Boolean);
      if (anyNdt) weldsRequiringNdt++;
    });

    const ndtRequirements = drawingSettings.ndtRequirements || [];
    const assignedToSpool = weldPoints.filter((w) => w.spoolId).length;

    return {
      total,
      complete,
      incomplete,
      notStarted,
      byLocation,
      byType,
      weldsRequiringNdt,
      ndtRequirements,
      assignedToSpool,
      spoolCount: spools.length,
    };
  }, [weldPoints, weldStatusByWeldId, drawingSettings, spools]);

  const progressPct =
    stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;

  if (stats.total === 0 && stats.spoolCount === 0) return null;

  return (
    <div className="bg-base-200/80 rounded-lg border border-base-300 p-3 mb-3">
      <div className="flex flex-wrap items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2">
          <span className="text-base-content/60 text-sm font-medium">
            Welds
          </span>
          <span className="font-bold text-lg tabular-nums">{stats.total}</span>
        </div>

        <div className="flex items-center gap-3 min-w-0">
          <span className="text-base-content/60 text-sm font-medium shrink-0">
            Progress
          </span>
          <div className="flex items-center gap-2 min-w-0 flex-1 max-w-48">
            <div className="flex-1 h-2 rounded-full bg-base-300 overflow-hidden min-w-12">
              <div
                className="h-full bg-success transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-medium tabular-nums shrink-0">
              {progressPct}%
            </span>
          </div>
          <div className="flex gap-2 text-xs shrink-0">
            <span className="text-success" title="Complete">
              {stats.complete}
            </span>
            <span className="text-warning" title="Incomplete">
              {stats.incomplete}
            </span>
            <span className="text-base-content/50" title="Not started">
              {stats.notStarted}
            </span>
          </div>
        </div>

        {stats.ndtRequirements.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-base-content/60 text-sm font-medium">
              NDT (drawing)
            </span>
            <span className="text-sm">
              {formatNdtRequirements(stats.ndtRequirements)}
            </span>
            {stats.total > 0 && (
              <span className="text-xs text-base-content/50">
                ({stats.weldsRequiringNdt} welds)
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 text-sm">
          <span className="text-base-content/60">Location</span>
          <span>
            {WELD_LOCATION_LABELS.shop} {stats.byLocation.shop || 0}
          </span>
          <span>
            {WELD_LOCATION_LABELS.field} {stats.byLocation.field || 0}
          </span>
        </div>

        {stats.spoolCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-base-content/60 text-sm">Spools</span>
            <span className="font-medium tabular-nums">{stats.spoolCount}</span>
            {stats.total > 0 && (
              <span className="text-xs text-base-content/50">
                ({stats.assignedToSpool} welds assigned)
              </span>
            )}
          </div>
        )}

        {Object.keys(stats.byType).length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base-content/60 text-sm">Types</span>
            {Object.entries(stats.byType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <span
                  key={type}
                  className="badge badge-ghost badge-sm"
                  title={WELD_TYPE_LABELS[type] || type}
                >
                  {WELD_TYPE_LABELS[type] || type} {count}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardAnalytics;
