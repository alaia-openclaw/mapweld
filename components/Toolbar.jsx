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
  onOpenParameters,
  onOpenProjects,
  onOpenNdt,
  onOpenStatus,
  focusPdf = false,
  onToggleFocusPdf,
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
      {hasPdf && onOpenParameters && (
        <button
          type="button"
          className={buttonClass + " btn-ghost"}
          onClick={onOpenParameters}
          title="Parameters"
        >
          Parameters
        </button>
      )}
      {hasPdf && onOpenNdt && (
        <button
          type="button"
          className={buttonClass + " btn-outline"}
          onClick={onOpenNdt}
          title="NDT management"
        >
          NDT
        </button>
      )}
      {hasWelds && onOpenStatus && (
        <button
          type="button"
          className={buttonClass + " btn-outline"}
          onClick={onOpenStatus}
          title="Weld status"
        >
          Status
        </button>
      )}
    </>
  );

  return (
    <div className="navbar bg-base-100 shadow-lg rounded-lg mb-4">
      <div className="flex-1 min-w-0">
        <span className="text-xl font-bold truncate hidden sm:inline">Weld Dashboard</span>
        <span className="text-lg font-bold sm:hidden">WD</span>
        {hasPdf && onModeChange && (
          <div className="join ml-2 hidden md:flex">
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
      <div className="md:hidden flex items-center gap-1">
        {hasPdf && onToggleFocusPdf && (
          <button
            type="button"
            className={`${buttonClass} btn-ghost`}
            onClick={onToggleFocusPdf}
            aria-label="PDF only"
            title="Show only PDF"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        )}
        <div className="dropdown dropdown-end">
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
            className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box z-50 w-56 mt-2 max-h-[80dvh] overflow-y-auto"
          >
            {hasPdf && onToggleFocusPdf && (
              <li>
                <button type="button" onClick={onToggleFocusPdf}>
                  PDF only
                </button>
              </li>
            )}
            {hasPdf && onModeChange && (
              <>
                <li>
                  <button
                    type="button"
                    onClick={() => onModeChange("edition")}
                    className={appMode === "edition" ? "active" : ""}
                  >
                    Edition
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onModeChange("inspection")}
                    className={appMode === "inspection" ? "active" : ""}
                  >
                    Inspection
                  </button>
                </li>
              </>
            )}
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
            {hasPdf && onOpenParameters && (
              <li>
                <button type="button" onClick={onOpenParameters}>
                  Parameters
                </button>
              </li>
            )}
            {hasPdf && onOpenNdt && (
              <li>
                <button type="button" onClick={onOpenNdt}>
                  NDT
                </button>
              </li>
            )}
            {hasWelds && onOpenStatus && (
              <li>
                <button type="button" onClick={onOpenStatus}>
                  Status
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Toolbar;
