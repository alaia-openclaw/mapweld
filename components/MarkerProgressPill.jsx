"use client";

/**
 * Pill-shaped marker label with a left-to-right fill from `progressPercent` (0–100).
 * Expects border/text/bg classes on `className` so the fill uses `currentColor` at low opacity.
 */
function MarkerProgressPill({ children, progressPercent = 0, className = "", style = {} }) {
  const p = Math.max(0, Math.min(100, Number(progressPercent) || 0));
  return (
    <span className={`relative inline-flex overflow-hidden ${className}`} style={style}>
      <span
        className="pointer-events-none absolute inset-y-0 left-0 bg-current opacity-[0.2]"
        style={{ width: `${p}%` }}
        aria-hidden
      />
      <span className="relative z-[1] flex min-h-0 w-full flex-1 items-center justify-center px-1">{children}</span>
    </span>
  );
}

export default MarkerProgressPill;
