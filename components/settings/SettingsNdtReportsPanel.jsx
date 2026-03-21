"use client";

import { NDT_REPORT_STATUS } from "@/lib/constants";

/** Read-only overview of NDT reports in the project (detail editing stays in NDT workflow). */
function SettingsNdtReportsPanel({ ndtReports = [] }) {
  const rows = Array.isArray(ndtReports) ? ndtReports : [];

  return (
    <div className="overflow-x-auto border border-base-300 rounded-lg">
      <table className="table table-xs">
        <thead>
          <tr className="bg-base-200">
            <th>Method</th>
            <th>Report date</th>
            <th>Status</th>
            <th>Weld / ref</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center text-base-content/50 py-6">
                No NDT reports in this project yet.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id || `${r.method}-${r.reportDate}`}>
              <td className="font-medium">{r.method || "—"}</td>
              <td>{r.reportDate || "—"}</td>
              <td>
                <span
                  className={`badge badge-sm ${
                    r.status === NDT_REPORT_STATUS.COMPLETED ? "badge-success" : "badge-ghost"
                  }`}
                >
                  {r.status || "—"}
                </span>
              </td>
              <td className="text-xs font-mono truncate max-w-[12rem]">{r.weldId || r.label || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SettingsNdtReportsPanel;
