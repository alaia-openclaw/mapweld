"use client";

function MarkupToolbar({
  markupTool,
  onToolChange,
  appMode = "edition",
  onModeChange,
  className = "",
}) {
  const buttonClass = "btn btn-xs btn-ghost h-7 min-h-7 px-2 gap-1";
  const activeClass = "btn-active";
  const iconClass = "h-4 w-4 shrink-0";
  const isEdition = appMode === "edition";

  return (
    <div
      className={`flex items-center gap-0.5 px-2 py-1.5 rounded-lg bg-base-200/70 backdrop-blur-md border border-base-300/50 shadow-sm w-fit ${className}`}
      role="toolbar"
      aria-label="Markup tools"
    >
      {onModeChange && (
        <>
          <button
            type="button"
            className={`${buttonClass} ${isEdition ? "text-success" : "text-base-content/70"}`}
            onClick={() => onModeChange(isEdition ? "inspection" : "edition")}
            title={isEdition ? "Edition — click to lock (inspection)" : "Inspection — click to unlock (edition)"}
            aria-pressed={isEdition}
            aria-label={isEdition ? "Lock to inspection mode" : "Unlock to edition mode"}
          >
            {/* Unlocked = edition; locked = inspection (Heroicons-style) */}
            {isEdition ? (
              <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 017.9-1.5M15 11V7a4 4 0 00-8 0v4m-1 0h10a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </button>
          <span className="w-px h-5 bg-base-300/60 shrink-0 mx-0.5" aria-hidden />
        </>
      )}
      <span className="text-xs text-base-content/60 mr-1 hidden sm:inline">Tools</span>
      <button
        type="button"
        className={`${buttonClass} ${markupTool === "add" ? activeClass : ""} ${!isEdition ? "opacity-40 pointer-events-none" : ""}`}
        onClick={() => onToolChange?.("add")}
        title="Add weld – click on drawing to place"
        aria-pressed={markupTool === "add"}
        disabled={!isEdition}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="hidden sm:inline text-xs">Weld</span>
      </button>
      <button
        type="button"
        className={`${buttonClass} ${markupTool === "select" ? activeClass : ""}`}
        onClick={() => onToolChange?.("select")}
        title="Select – click to select, drag handles to move"
        aria-pressed={markupTool === "select"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
        <span className="hidden sm:inline text-xs">Select</span>
      </button>
      <button
        type="button"
        className={`${buttonClass} ${markupTool === "addSpool" ? activeClass : ""} ${!isEdition ? "opacity-40 pointer-events-none" : ""}`}
        onClick={() => onToolChange?.("addSpool")}
        title="Add spool – click on drawing to place (SP-A, SP-B, …)"
        aria-pressed={markupTool === "addSpool"}
        disabled={!isEdition}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <span className="hidden sm:inline text-xs">Spool</span>
      </button>
      <button
        type="button"
        className={`${buttonClass} ${markupTool === "addPart" ? activeClass : ""} ${!isEdition ? "opacity-40 pointer-events-none" : ""}`}
        onClick={() => onToolChange?.("addPart")}
        title="Add part – click on drawing to place (1, 2, 3…)"
        aria-pressed={markupTool === "addPart"}
        disabled={!isEdition}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        <span className="hidden sm:inline text-xs">Part</span>
      </button>
      <button
        type="button"
        className={`${buttonClass} ${markupTool === "addLine" ? activeClass : ""} ${!isEdition ? "opacity-40 pointer-events-none" : ""}`}
        onClick={() => onToolChange?.("addLine")}
        title="Add line marker – click on drawing to place line on current page"
        aria-pressed={markupTool === "addLine"}
        disabled={!isEdition}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M8 8l-4 4 4 4m8-8l4 4-4 4" />
        </svg>
        <span className="hidden sm:inline text-xs">Line</span>
      </button>
    </div>
  );
}

export default MarkupToolbar;
