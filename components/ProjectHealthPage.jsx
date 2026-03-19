"use client";

import { useMemo } from "react";
import { collectProjectHealthIssues, countIssuesByCategory } from "@/lib/project-health";

const CATEGORY_ORDER = [
  "general",
  "drawings",
  "systems_lines",
  "welds",
  "spools",
  "parts",
  "library",
  "ndt",
];

const CATEGORY_LABELS = {
  general: "General setup",
  drawings: "Drawings & PDFs",
  systems_lines: "Systems & lines",
  welds: "Welds",
  spools: "Spools",
  parts: "Parts",
  library: "Library & links",
  ndt: "NDT",
};

function formatSeveritySummary(counts) {
  const bits = [];
  if (counts.error) bits.push(`${counts.error} error${counts.error === 1 ? "" : "s"}`);
  if (counts.warning) bits.push(`${counts.warning} warning${counts.warning === 1 ? "" : "s"}`);
  if (counts.info) bits.push(`${counts.info} info`);
  return bits.length ? bits.join(" · ") : "No issues";
}

function BadgeSeverity({ severity }) {
  const cls =
    severity === "error"
      ? "badge-error"
      : severity === "warning"
        ? "badge-warning"
        : "badge-ghost border border-base-300";
  return <span className={`badge badge-sm ${cls} shrink-0`}>{severity}</span>;
}

/**
 * Full-screen data-quality panel (same pattern as Status / NDT).
 */
function ProjectHealthPage({
  weldPoints = [],
  drawings = [],
  spools = [],
  parts = [],
  lines = [],
  systems = [],
  personnel = { fitters: [], welders: [], wqrs: [] },
  wpsLibrary = [],
  electrodeLibrary = [],
  drawingSettings = {},
  projectMeta = {},
  partMarkers = [],
  spoolMarkers = [],
  lineMarkers = [],
  getWeldName,
  onClose,
  onSelectWeld,
  onOpenParameters,
}) {
  const issues = useMemo(
    () =>
      collectProjectHealthIssues({
        weldPoints,
        drawings,
        spools,
        parts,
        lines,
        systems,
        personnel,
        wpsLibrary,
        electrodeLibrary,
        drawingSettings,
        projectMeta,
        partMarkers,
        spoolMarkers,
        lineMarkers,
      }),
    [
      weldPoints,
      drawings,
      spools,
      parts,
      lines,
      systems,
      personnel,
      wpsLibrary,
      electrodeLibrary,
      drawingSettings,
      projectMeta,
      partMarkers,
      spoolMarkers,
      lineMarkers,
    ]
  );

  const countsByCategory = useMemo(() => countIssuesByCategory(issues), [issues]);
  const grouped = useMemo(() => {
    const map = {};
    CATEGORY_ORDER.forEach((c) => {
      map[c] = issues.filter((i) => i.category === c);
    });
    return map;
  }, [issues]);

  const totalErrors = issues.filter((i) => i.severity === "error").length;
  const totalWarnings = issues.filter((i) => i.severity === "warning").length;

  function handleOpenParameters() {
    onOpenParameters?.();
    onClose?.();
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-base-100">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-base-300 flex-shrink-0">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Project health</h2>
          <p className="text-xs text-base-content/60 mt-0.5">
            Data checks for PDFs, traceability links, welds, library, and NDT.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {issues.length > 0 && (
            <span className="text-xs sm:text-sm text-base-content/70 tabular-nums">
              {issues.length} finding{issues.length === 1 ? "" : "s"}
              {totalErrors ? (
                <span className="text-error font-medium"> · {totalErrors} error{totalErrors === 1 ? "" : "s"}</span>
              ) : null}
              {totalWarnings ? (
                <span className="text-warning font-medium">
                  {" "}
                  · {totalWarnings} warning{totalWarnings === 1 ? "" : "s"}
                </span>
              ) : null}
            </span>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-4">
        {issues.length === 0 ? (
          <div className="max-w-lg mx-auto text-center py-12 px-4 rounded-2xl border border-success/30 bg-success/5">
            <p className="text-4xl mb-3" aria-hidden>
              ✓
            </p>
            <p className="text-lg font-semibold text-success">No issues detected</p>
            <p className="text-sm text-base-content/70 mt-2">
              Keep project name, parameters, and line–drawing links up to date as the job evolves.
            </p>
            {onOpenParameters && (
              <button type="button" className="btn btn-outline btn-sm mt-6" onClick={handleOpenParameters}>
                Open parameters
              </button>
            )}
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto rounded-xl border border-base-300 overflow-hidden divide-y divide-base-300 bg-base-100">
            {CATEGORY_ORDER.map((cat) => {
              const list = grouped[cat] || [];
              const counts = countsByCategory[cat] || { error: 0, warning: 0, info: 0 };
              const summary = formatSeveritySummary(counts);
              return (
                <details key={cat} className="group bg-base-100 open:bg-base-200/25" open={list.length > 0}>
                  <summary className="cursor-pointer list-none flex flex-wrap items-baseline justify-between gap-2 px-3 sm:px-4 py-3 text-sm sm:text-base font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                    <span>
                      {CATEGORY_LABELS[cat]}
                      <span className="font-normal text-base-content/60 ml-2">
                        · {list.length ? summary : "0 issues"}
                      </span>
                    </span>
                    <span className="text-base-content/40 text-xs font-normal shrink-0 group-open:rotate-0 transition-transform">
                      ▾
                    </span>
                  </summary>
                  <div className="px-3 sm:px-4 pb-3 pt-0 border-t border-base-300/60">
                    {list.length === 0 ? (
                      <p className="text-sm text-base-content/50 py-3">Nothing to report in this category.</p>
                    ) : (
                      <ul className="flex flex-col gap-2 py-3">
                        {list.map((issue) => (
                          <li
                            key={issue.id}
                            className="rounded-lg border border-base-300 bg-base-100 p-3 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3"
                          >
                            <BadgeSeverity severity={issue.severity} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm leading-snug">{issue.title}</p>
                              {issue.detail ? (
                                <p className="text-xs text-base-content/65 mt-1 leading-relaxed">{issue.detail}</p>
                              ) : null}
                              {issue.entityType === "weld" && issue.entityId && getWeldName ? (
                                <p className="text-xs text-base-content/50 mt-1">
                                  Weld:{" "}
                                  <span className="font-mono">
                                    {getWeldName(
                                      weldPoints.find((w) => w.id === issue.entityId) ?? { id: issue.entityId },
                                      weldPoints
                                    ) ?? issue.entityId}
                                  </span>
                                </p>
                              ) : null}
                            </div>
                            {issue.entityType === "weld" && issue.entityId && onSelectWeld ? (
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs shrink-0 self-start"
                                onClick={() => onSelectWeld(issue.entityId)}
                              >
                                Open weld
                              </button>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectHealthPage;
