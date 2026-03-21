"use client";

/**
 * Shared catalog category UI: one flat toolbar row of facet dropdowns (same look for Pipe, Fittings, Flanges, …).
 */

export function CatalogReadOnlyFacet({ label, value }) {
  return (
    <div className="flex flex-col justify-end min-w-[7.5rem] max-w-[min(100vw-2rem,18rem)] py-1.5 px-3 rounded-lg border border-base-300 bg-base-100 min-h-12">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-base-content/60 text-left">
        {label}
      </span>
      <span className="text-xs font-medium text-left leading-snug truncate">{value}</span>
    </div>
  );
}

export function CatalogFacetDropdown({
  label,
  valueDisplay,
  options,
  activeId,
  onSelect,
  disabled = false,
  placeholder = "—",
  menuClassName = "",
}) {
  const active = options.find((o) => String(o.id) === String(activeId));
  const display = active?.label ?? valueDisplay ?? placeholder;

  return (
    <div
      className={`dropdown dropdown-start min-w-[7.5rem] max-w-[min(100vw-2rem,16rem)] flex-1 sm:flex-none ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div
        tabIndex={disabled ? -1 : 0}
        role="button"
        className="btn btn-sm btn-outline border-base-300 bg-base-100 h-auto min-h-12 py-2 px-3 w-full flex flex-col items-stretch gap-0.5 normal-case font-normal"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide text-base-content/60 text-left">
          {label}
        </span>
        <span className="text-xs font-medium text-left whitespace-normal leading-snug truncate">{display}</span>
      </div>
      {!disabled && options.length > 0 ? (
        <ul
          tabIndex={0}
          className={`dropdown-content z-[40] menu p-2 shadow-lg bg-base-100 rounded-box w-[min(100vw-1.5rem,18rem)] max-h-[min(70vh,22rem)] overflow-y-auto border border-base-300 mt-1 ${menuClassName}`}
        >
          {options.map((opt) => (
            <li key={String(opt.id)} className="w-full">
              <button
                type="button"
                className={`w-full text-left whitespace-normal leading-snug py-2.5 min-h-0 h-auto rounded-lg text-xs ${
                  String(activeId) === String(opt.id)
                    ? "active bg-primary text-primary-content font-medium"
                    : ""
                }`}
                onClick={() => {
                  onSelect(opt.id);
                  if (typeof document !== "undefined") document.activeElement?.blur?.();
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Outer shell for spreadsheet-style catalog panels (toolbar + content). */
export const catalogPanelOuterClass =
  "flex flex-col h-[calc(100dvh-10rem)] min-h-[380px] rounded-xl border border-base-300 bg-base-200/60 overflow-hidden";

export const catalogPanelToolbarClass =
  "shrink-0 px-3 py-2 border-b border-base-300 bg-base-200/60 flex flex-wrap items-end gap-2 gap-y-2";
