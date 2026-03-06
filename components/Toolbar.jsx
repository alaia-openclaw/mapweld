"use client";

import { useRef, useState } from "react";

function Toolbar({
  hasPdf,
  hasWelds,
  appMode = "edition",
  onModeChange,
  onLoadPdf,
  onLoadProject,
  onSaveProject,
  onExportExcel,
  onOpenSettings,
  onOpenSpools,
  onOpenProjects,
}) {
  const projectInputRef = useRef(null);

  const buttonClass = "btn btn-sm min-h-12 min-w-12 md:min-w-0";

  const primaryButtons = (
    <>
      <label htmlFor="pdf-file-input" className={`${buttonClass} btn-outline cursor-pointer`}>
        Load PDF
      </label>
      <input
        id="pdf-file-input"
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onLoadPdf?.(file);
          e.target.value = "";
        }}
      />
      <input
        ref={projectInputRef}
        type="file"
        accept=".weldproject,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onLoadProject?.(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className={buttonClass + " btn-outline"}
        onClick={() => projectInputRef.current?.click()}
      >
        Load Project
      </button>
      <button
        type="button"
        className={buttonClass + " btn-primary"}
        onClick={onSaveProject}
        disabled={!hasPdf}
      >
        Save Project
      </button>
      <button
        type="button"
        className={buttonClass + " btn-secondary"}
        onClick={onExportExcel}
        disabled={!hasWelds}
      >
        Export Excel
      </button>
      {onOpenProjects && (
        <button
          type="button"
          className={buttonClass + " btn-outline"}
          onClick={onOpenProjects}
        >
          Projects
        </button>
      )}
      {hasPdf && (
        <>
          <button
            type="button"
            className={buttonClass + " btn-ghost"}
            onClick={onOpenSettings}
            title="Drawing settings"
          >
            Settings
          </button>
          <button
            type="button"
            className={buttonClass + " btn-ghost"}
            onClick={onOpenSpools}
            title="Spools"
          >
            Spools
          </button>
        </>
      )}
    </>
  );

  return (
    <div className="navbar bg-base-100 shadow-lg rounded-lg mb-4">
      <div className="flex-1">
        <span className="text-xl font-bold">Weld Dashboard</span>
        {hasPdf && onModeChange && (
          <div className="join ml-4">
            <button
              type="button"
              className={`join-item btn btn-sm ${appMode === "edition" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => onModeChange("edition")}
            >
              Edition
            </button>
            <button
              type="button"
              className={`join-item btn btn-sm ${appMode === "inspection" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => onModeChange("inspection")}
            >
              Inspection
            </button>
          </div>
        )}
      </div>
      <div className="hidden md:flex md:items-center md:gap-2">
        {primaryButtons}
      </div>
      <div className="md:hidden dropdown dropdown-end">
        <label
          tabIndex={0}
          className={`${buttonClass} btn-ghost`}
          aria-label="Menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </label>
        <ul
          tabIndex={0}
          className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box z-50 w-56 mt-2"
        >
          <li>
            <label htmlFor="pdf-file-input-mobile" className="cursor-pointer">
              Load PDF
            </label>
            <input
              id="pdf-file-input-mobile"
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onLoadPdf?.(file);
                e.target.value = "";
              }}
            />
          </li>
          <li>
            <button type="button" onClick={() => projectInputRef.current?.click()}>
              Load Project
            </button>
          </li>
          <li>
            <button type="button" onClick={onSaveProject} disabled={!hasPdf}>
              Save Project
            </button>
          </li>
          <li>
            <button type="button" onClick={onExportExcel} disabled={!hasWelds}>
              Export Excel
            </button>
          </li>
          {onOpenProjects && (
            <li>
              <button type="button" onClick={onOpenProjects}>
                Projects
              </button>
            </li>
          )}
          {hasPdf && (
            <>
              <li>
                <button type="button" onClick={onOpenSettings}>
                  Settings
                </button>
              </li>
              <li>
                <button type="button" onClick={onOpenSpools}>
                  Spools
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}

export default Toolbar;
