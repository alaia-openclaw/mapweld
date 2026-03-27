"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const defaultInViewOptions = {};

export function useInView(options = defaultInViewOptions) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return [ref, isVisible];
}

export function RevealOnScroll({
  children,
  className = "",
  animation = "animate-fade-up",
  delay = "",
  as: Tag = "div",
}) {
  const [ref, isVisible] = useInView();

  return (
    <Tag
      ref={ref}
      className={`${className} ${isVisible ? `${animation} ${delay}` : "opacity-0"}`}
    >
      {children}
    </Tag>
  );
}

export function StaggerChildren({
  children,
  className = "",
  staggerMs = 150,
  animation = "animate-fade-up",
}) {
  const [ref, isVisible] = useInView();

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              className={isVisible ? animation : "opacity-0"}
              style={isVisible ? { animationDelay: `${i * staggerMs}ms` } : undefined}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}

export function FloatingShapes({ variant = "hero" }) {
  if (variant === "hero") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {/* Large gradient orb top-right */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-500/10 to-primary/5 blur-3xl animate-drift" />

        {/* Small orb bottom-left */}
        <div className="absolute bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-primary/8 to-sky-400/5 blur-2xl animate-float-slow" />

        {/* Geometric accent — ring */}
        <div className="absolute top-1/4 right-[15%] w-20 h-20 rounded-full border border-white/[0.06] animate-float delay-500" />
        <div className="absolute bottom-1/3 left-[10%] w-14 h-14 rounded-full border border-white/[0.04] animate-float-rev delay-300" />

        {/* Small dots */}
        <div className="absolute top-[18%] left-[25%] w-2 h-2 rounded-full bg-amber-400/20 animate-pulse-slow" />
        <div className="absolute top-[60%] right-[20%] w-1.5 h-1.5 rounded-full bg-primary/20 animate-pulse-slow delay-1000" />
        <div className="absolute bottom-[25%] right-[35%] w-2.5 h-2.5 rounded-full bg-sky-400/15 animate-pulse-slow delay-2000" />

        {/* Diagonal line accents */}
        <svg className="absolute top-1/3 left-[5%] w-32 h-32 text-white/[0.03] animate-float-slow delay-700" viewBox="0 0 100 100" fill="none">
          <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="1" />
          <line x1="20" y1="100" x2="100" y2="20" stroke="currentColor" strokeWidth="0.5" />
        </svg>

        {/* Spinning ring */}
        <div className="absolute -bottom-10 right-[10%] w-40 h-40 animate-spin-slow">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-white/[0.03]">
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 12" />
          </svg>
        </div>
      </div>
    );
  }

  if (variant === "dark") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-drift" />
        <div className="absolute -bottom-20 right-1/4 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 right-[8%] w-16 h-16 rounded-full border border-white/[0.05] animate-float delay-400" />
        <div className="absolute bottom-1/4 left-[12%] w-2 h-2 rounded-full bg-amber-400/15 animate-pulse-slow delay-600" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute -top-32 right-0 w-80 h-80 rounded-full bg-primary/[0.04] blur-3xl animate-drift" />
      <div className="absolute bottom-0 -left-20 w-64 h-64 rounded-full bg-amber-400/[0.03] blur-2xl animate-float-slow" />
    </div>
  );
}

export function FaqAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [ref, isVisible] = useInView();

  return (
    <div ref={ref} className="space-y-3">
      {items.map(({ q, a }, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={q}
            className={`rounded-2xl border border-base-300 bg-base-100 shadow-sm overflow-hidden transition-all duration-300
              hover:shadow-md hover:border-primary/20
              ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={isVisible ? { animationDelay: `${i * 80}ms` } : undefined}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between p-6 text-left font-bold text-base-content text-lg hover:bg-base-200/30 transition-colors"
            >
              {q}
              <svg
                className={`w-5 h-5 shrink-0 text-primary transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div
              className={`grid transition-all duration-400 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-6 text-base-content/65 text-base leading-relaxed">
                  {a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ImagePlaceholder({ label = "Image", aspect = "4/3", className = "" }) {
  const lower = label.toLowerCase();
  const isLoad = lower.includes("loaded") || lower.includes("drawing");
  const isMarkers = lower.includes("markers") || lower.includes("weld");
  const isExport = lower.includes("export");

  return (
    <div
      className={`group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-24px_rgba(15,23,42,0.35)] ${className}`}
      style={{ aspectRatio: aspect }}
    >
      <div className="absolute inset-x-0 top-0 h-10 border-b border-slate-200 bg-slate-50/95" />
      <div className="absolute left-4 top-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </div>
      <div className="absolute right-4 top-2.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        Product preview
      </div>

      <div className="absolute inset-0 top-10 bg-gradient-to-br from-slate-50 via-white to-slate-100" />

      <div className="absolute inset-y-10 left-0 w-[27%] border-r border-slate-200 bg-slate-50/80 p-3">
        <div className="mb-3 h-7 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
          MapWeld
        </div>
        <div className="space-y-2">
          {[72, 84, 64, 78, 58].map((w, i) => (
            <div key={i} className="h-3 rounded-full bg-slate-200" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Status</div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
            <div className="rounded-lg bg-emerald-50 px-2 py-2 text-emerald-700">Welded</div>
            <div className="rounded-lg bg-amber-50 px-2 py-2 text-amber-700">NDT due</div>
          </div>
        </div>
      </div>

      <div className="absolute inset-y-10 right-0 left-[27%] p-4 md:p-5">
        <div className="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.10),_transparent_40%),linear-gradient(to_bottom_right,_#ffffff,_#f8fafc)]" />
          <svg viewBox="0 0 800 520" className="absolute inset-0 h-full w-full">
            <g stroke="#cbd5e1" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M120 390 L120 180 L320 180 L320 120 L540 120" />
              <path d="M320 180 L500 180 L500 320 L650 320" />
              <path d="M500 180 L600 90" />
              <path d="M320 180 L260 300 L180 300" />
            </g>
            <g stroke="#94a3b8" strokeWidth="2" fill="none" opacity="0.6">
              <path d="M120 390 L90 430" />
              <path d="M650 320 L700 355" />
              <path d="M600 90 L660 55" />
            </g>

            {isLoad && (
              <g>
                <rect x="470" y="42" width="230" height="82" rx="18" fill="#0f172a" opacity="0.96" />
                <text x="500" y="74" fill="#ffffff" fontSize="24" fontWeight="700">ISO-014_REV-B.pdf</text>
                <text x="500" y="102" fill="#94a3b8" fontSize="16">Drawing loaded • ready to mark</text>
              </g>
            )}

            {isMarkers && (
              <g>
                {[
                  [320, 180, 'W-101'],
                  [500, 180, 'W-102'],
                  [500, 320, 'W-103'],
                  [120, 180, 'W-104'],
                  [600, 90, 'W-105'],
                ].map(([x, y, id]) => (
                  <g key={id}>
                    <circle cx={x} cy={y} r="18" fill="#f59e0b" />
                    <circle cx={x} cy={y} r="27" fill="#f59e0b" opacity="0.18" />
                    <text x={x + 22} y={y - 18} fill="#0f172a" fontSize="16" fontWeight="700">{id}</text>
                  </g>
                ))}
                <g>
                  <rect x="448" y="44" width="248" height="128" rx="18" fill="#ffffff" stroke="#e2e8f0" />
                  <text x="470" y="75" fill="#0f172a" fontSize="20" fontWeight="700">Selected weld</text>
                  <text x="470" y="102" fill="#475569" fontSize="16">W-102 • 6Mo spool • WPS-24</text>
                  <rect x="470" y="118" width="78" height="24" rx="12" fill="#dcfce7" />
                  <text x="487" y="135" fill="#166534" fontSize="13" fontWeight="700">Welded</text>
                  <rect x="556" y="118" width="88" height="24" rx="12" fill="#fef3c7" />
                  <text x="575" y="135" fill="#92400e" fontSize="13" fontWeight="700">RT pending</text>
                </g>
              </g>
            )}

            {isExport && (
              <g>
                <rect x="422" y="62" width="286" height="250" rx="22" fill="#ffffff" stroke="#e2e8f0" />
                <text x="450" y="96" fill="#0f172a" fontSize="22" fontWeight="700">Export weld register</text>
                {[
                  ['Drawing', 'ISO-014'],
                  ['Spool', 'SP-22A'],
                  ['Welder', 'WM-07'],
                  ['NDT', 'RT 10%'],
                ].map(([k, v], i) => (
                  <g key={k}>
                    <text x="450" y={132 + i * 34} fill="#64748b" fontSize="14">{k}</text>
                    <text x="560" y={132 + i * 34} fill="#0f172a" fontSize="14" fontWeight="700">{v}</text>
                  </g>
                ))}
                <rect x="450" y="220" width="104" height="34" rx="12" fill="#0f172a" />
                <text x="476" y="242" fill="#ffffff" fontSize="14" fontWeight="700">Excel</text>
                <rect x="564" y="220" width="116" height="34" rx="12" fill="#f59e0b" />
                <text x="590" y="242" fill="#111827" fontSize="14" fontWeight="700">Summary</text>
              </g>
            )}

            {!isLoad && !isMarkers && !isExport && (
              <g>
                <rect x="446" y="58" width="250" height="110" rx="20" fill="#ffffff" stroke="#e2e8f0" />
                <text x="472" y="92" fill="#0f172a" fontSize="22" fontWeight="700">Open MapWeld</text>
                <text x="472" y="122" fill="#475569" fontSize="16">No install • no login • works offline</text>
              </g>
            )}
          </svg>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/[0.02] to-transparent p-4 text-xs font-medium text-slate-500">
        {label}
      </div>
    </div>
  );
}
