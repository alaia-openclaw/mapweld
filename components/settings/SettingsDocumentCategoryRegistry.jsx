"use client";

import { useRef } from "react";
import { getSettingsDocumentCategoryLabel } from "@/lib/settings-documents";

/**
 * Table + upload for vault documents filtered by a single category (e.g. painting report, ITP).
 */
function SettingsDocumentCategoryRegistry({
  category,
  documents = [],
  onUpdateDocument,
  onRemoveDocument,
  onAddDocumentFromFile,
}) {
  const fileInputRef = useRef(null);
  const rows = documents.filter((d) => d?.category === category);

  return (
    <div className="space-y-3 min-w-0">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end sm:justify-between">
        <p className="text-xs text-base-content/70 flex-1">
          PDFs stored in the project vault with category{" "}
          <span className="font-medium">{getSettingsDocumentCategoryLabel(category)}</span>. They can be picked for
          databook export and traceability.
        </p>
        <div className="flex gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onAddDocumentFromFile?.(file);
            }}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            + Upload PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-base-300 rounded-lg">
        <table className="table table-xs table-pin-rows">
          <thead>
            <tr className="bg-base-200">
              <th>Title</th>
              <th>File</th>
              <th className="w-28"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-base-content/50 py-6">
                  No documents in this category yet.
                </td>
              </tr>
            )}
            {rows.map((doc) => (
              <tr key={doc.id} className="hover">
                <td>
                  <input
                    type="text"
                    className="input input-bordered input-xs w-full max-w-md"
                    value={doc.title || ""}
                    onChange={(e) => onUpdateDocument?.(doc.id, { title: e.target.value })}
                    placeholder="Title"
                  />
                </td>
                <td className="text-xs font-mono truncate max-w-[14rem]" title={doc.fileName}>
                  {doc.fileName || "—"}
                </td>
                <td className="text-end">
                  {doc.base64 && (
                    <a
                      href={`data:${doc.mimeType || "application/pdf"};base64,${doc.base64}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-xs"
                    >
                      Open
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-error"
                    onClick={() => onRemoveDocument?.(doc.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SettingsDocumentCategoryRegistry;
