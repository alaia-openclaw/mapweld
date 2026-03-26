"use client";

import { useRef } from "react";

/**
 * Opens a modal explaining how project / system / line NDT % rows merge per method.
 */
export default function NdtInheritanceHelpModal({ className = "" }) {
  const dialogRef = useRef(null);

  return (
    <>
      <button
        type="button"
        className={`link link-primary text-xs shrink-0 ${className}`}
        onClick={() => dialogRef.current?.showModal?.()}
      >
        How NDT inheritance works
      </button>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box max-w-lg">
          <h3 className="font-bold text-lg">NDT sampling inheritance</h3>
          <div className="text-sm text-base-content/80 space-y-3 pt-2">
            <p>
              For each weld, methods and shop/field percentages come from your project, system, and line tables. Each
              layer only lists methods you care about; missing methods fall back to the layers below.
            </p>
            <p className="font-medium text-base-content">Merge order (per method)</p>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>
                <strong>Project</strong> defaults — set under Settings → Project info → Project NDT defaults.
              </li>
              <li>
                <strong>System</strong> — optional overrides on each system (same screen, Systems section).
              </li>
              <li>
                <strong>Line</strong> — optional overrides under each line listed beneath its system. Line wins over
                system over project for that method&apos;s shop/field %.
              </li>
            </ol>
            <p>
              Welds use the line from the spool or direct line link. If a line has no system, only project + line
              overrides apply.
            </p>
            <p className="text-xs text-base-content/60">
              Weld form can still set per-weld NDT overrides (Required / Exempt / Auto) on top of this sampling logic.
            </p>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button type="submit" className="btn btn-sm">
                Close
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit" aria-label="Close">
            close
          </button>
        </form>
      </dialog>
    </>
  );
}
