"use client";

import { useRef } from "react";

const iconClass = "h-4 w-4 shrink-0";

function IconLoadPdf() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

function IconFolderOpen() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  );
}

function IconTable() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function IconCog() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function Toolbar({
  hasPdf,
  hasWelds,
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
  const btn = "btn btn-xs h-8 min-h-8 px-2 gap-1.5 md:min-w-0";

  const actions = (
    <>
      <label htmlFor="pdf-file-input" className={`${btn} btn-outline cursor-pointer`} title="Load PDF">
        <IconLoadPdf />
        <span className="hidden lg:inline">PDF</span>
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
      <button
        type="button"
        className={`${btn} btn-ghost`}
        onClick={() => projectInputRef.current?.click()}
        title="Load project"
      >
        <IconFolderOpen />
        <span className="hidden lg:inline">Open</span>
      </button>
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
        className={`${btn} btn-primary`}
        onClick={onSaveProject}
        disabled={!hasPdf}
        title="Save project"
      >
        <IconSave />
        <span className="hidden lg:inline">Save</span>
      </button>
      <button
        type="button"
        className={`${btn} btn-secondary`}
        onClick={onExportExcel}
        disabled={!hasWelds}
        title="Export Excel"
      >
        <IconTable />
        <span className="hidden lg:inline">Excel</span>
      </button>
      {hasPdf && onOpenParameters && (
        <button type="button" className={`${btn} btn-ghost`} onClick={onOpenParameters} title="Parameters">
          <IconCog />
          <span className="hidden xl:inline">Params</span>
        </button>
      )}
      {hasPdf && onOpenNdt && (
        <button type="button" className={`${btn} btn-outline border-base-300`} onClick={onOpenNdt} title="NDT">
          <IconClipboard />
          <span className="hidden xl:inline">NDT</span>
        </button>
      )}
      {hasPdf && onOpenStatus && (
        <button
          type="button"
          className={`${btn} btn-outline border-base-300`}
          onClick={onOpenStatus}
          title="Project progress — welds & spools"
        >
          <IconChart />
          <span className="hidden md:inline">Progress</span>
        </button>
      )}
    </>
  );

  return (
    <div className="flex items-center justify-between gap-2 bg-base-100 shadow-sm rounded-lg mb-3 px-2 py-1.5">
      <div className="flex items-center min-w-0 gap-2">
        <span className="text-lg font-bold truncate hidden sm:inline">Weld Dashboard</span>
        <span className="text-base font-bold sm:hidden">WD</span>
      </div>
      <div className="hidden md:flex md:items-center md:gap-1 flex-wrap justify-end">
        {actions}
      </div>
      <div className="md:hidden flex items-center gap-0.5">
        {hasPdf && onToggleFocusPdf && (
          <button
            type="button"
            className={`${btn} btn-ghost`}
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
          <label tabIndex={0} className={`${btn} btn-ghost`} aria-label="Menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box z-50 w-52 mt-2 max-h-[80dvh] overflow-y-auto"
          >
            {hasPdf && onToggleFocusPdf && (
              <li>
                <button type="button" onClick={onToggleFocusPdf}>
                  PDF only
                </button>
              </li>
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
                Load project
              </button>
            </li>
            <li>
              <button type="button" onClick={onSaveProject} disabled={!hasPdf}>
                Save project
              </button>
            </li>
            <li>
              <button type="button" onClick={onExportExcel} disabled={!hasWelds}>
                Export Excel
              </button>
            </li>
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
            {hasPdf && onOpenStatus && (
              <li>
                <button type="button" onClick={onOpenStatus}>
                  Progress
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
