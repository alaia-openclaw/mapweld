"use client";

function MarkupToolbar({ markupTool, onToolChange, className = "" }) {
  const buttonClass = "btn btn-sm btn-ghost min-h-10";
  const activeClass = "btn-active";

  return (
    <div
      className={`flex items-center gap-1 px-3 py-2 bg-base-200 rounded-lg ${className}`}
      role="toolbar"
      aria-label="Markup tools"
    >
      <span className="text-sm font-medium text-base-content/70 mr-2">
        Tools:
      </span>
      <button
        type="button"
        className={`${buttonClass} ${markupTool === "add" ? activeClass : ""}`}
        onClick={() => onToolChange?.("add")}
        title="Add weld – click on drawing to place"
        aria-pressed={markupTool === "add"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span className="hidden sm:inline ml-1">Add weld</span>
      </button>
      <button
        type="button"
        className={`${buttonClass} ${markupTool === "select" ? activeClass : ""}`}
        onClick={() => onToolChange?.("select")}
        title="Select – click to select, drag handles to move"
        aria-pressed={markupTool === "select"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
        <span className="hidden sm:inline ml-1">Select</span>
      </button>
      <button
        type="button"
        className={`${buttonClass} ${markupTool === "addSpool" ? activeClass : ""}`}
        onClick={() => onToolChange?.("addSpool")}
        title="Add spool – click on drawing to place (SP-A, SP-B, …)"
        aria-pressed={markupTool === "addSpool"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
        <span className="hidden sm:inline ml-1">Add spool</span>
      </button>
    </div>
  );
}

export default MarkupToolbar;
