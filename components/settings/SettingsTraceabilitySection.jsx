"use client";

/**
 * Shared 3-group section chrome (Material certificates, WPS, WQR, electrodes, personnel…).
 */
function SettingsTraceabilitySection({ number, title, description, children }) {
  return (
    <section className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-base-content/70 border-b border-base-300 pb-1">
        {number} · {title}
      </h4>
      {description ? <p className="text-[11px] text-base-content/55">{description}</p> : null}
      {children}
    </section>
  );
}

export default SettingsTraceabilitySection;
