"use client";

import { useInView, FloatingShapes } from "@/components/LandingAnimated";

const features = [
  {
    title: "Weld Marker",
    pain: "Inspectors re-enter data that already exists on the drawing. Hours lost to admin, not quality.",
    desc: "Click-to-place weld markers on PDF isometrics. Assign WPS, welder, status — captured once at the source.",
    accent: "amber",
  },
  {
    title: "Spool Marker",
    pain: "NDT percentages live in someone's head. Which welds still need RT? Nobody knows instantly.",
    desc: "Tag spool IDs, joints, and assemblies. Everything tied to the drawing — progress visible at a glance.",
    accent: "sky",
  },
  {
    title: "Part Marker",
    pain: "By the time the report is ready, three more welds are done and it's already out of date.",
    desc: "Mark bolted joints, supports, and components. Link parts to heat numbers, specs, and material certs.",
    accent: "emerald",
  },
];

const accentMap = {
  amber: {
    text: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/25",
    glow: "hover:shadow-amber-500/10",
    dot: "bg-amber-400",
    ring: "ring-amber-400/20",
  },
  sky: {
    text: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/25",
    glow: "hover:shadow-sky-500/10",
    dot: "bg-sky-400",
    ring: "ring-sky-400/20",
  },
  emerald: {
    text: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/25",
    glow: "hover:shadow-emerald-500/10",
    dot: "bg-emerald-400",
    ring: "ring-emerald-400/20",
  },
};

function PipeIcon({ accent }) {
  const cls = accentMap[accent]?.text || "text-white";
  return (
    <svg viewBox="0 0 64 64" fill="none" className={`w-14 h-14 ${cls}`} aria-hidden>
      <path d="M8 22 H48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8 42 H48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
      <rect x="4" y="18" width="8" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <rect x="44" y="18" width="8" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <path d="M26 18 L32 10 L38 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PipeSplitSection() {
  const [ref, isVisible] = useInView({ threshold: 0.08 });

  return (
    <section
      ref={ref}
      className="relative px-4 py-24 md:py-32 bg-[#0f172a] text-white overflow-hidden"
    >
      <FloatingShapes variant="dark" />

      {/* Grid bg */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="splitgrid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#splitgrid)" />
        </svg>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Heading */}
        <div
          className={`text-center mb-20 space-y-5 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
        >
          <p className="text-amber-400 font-semibold text-sm uppercase tracking-[0.2em]">
            Your drawing, your database
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Three markers.
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              Complete traceability.
            </span>
          </h2>
          <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            The isometric is already on the shop floor. Now make it your live
            database — no retyping, no delay, no drift.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feat, i) => {
            const a = accentMap[feat.accent];
            return (
              <div
                key={feat.title}
                className={`group relative rounded-3xl border ${a.border} ${a.bg} p-8 md:p-10 space-y-6
                  transition-all duration-500 hover:shadow-2xl ${a.glow} hover:-translate-y-1 hover:scale-[1.02]
                  ${isVisible ? "animate-fade-up" : "opacity-0"}`}
                style={isVisible ? { animationDelay: `${300 + i * 200}ms` } : undefined}
              >
                {/* Decorative corner glow */}
                <div className={`absolute -top-px -right-px w-32 h-32 ${a.bg} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                {/* Icon + title */}
                <div className="relative flex items-center gap-4">
                  <div className={`p-2 rounded-2xl ${a.bg} ring-1 ${a.ring}`}>
                    <PipeIcon accent={feat.accent} />
                  </div>
                  <h3 className={`text-2xl font-bold ${a.text}`}>{feat.title}</h3>
                </div>

                {/* Pain point */}
                <div className="relative rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5">
                  <p className="text-[11px] text-white/35 font-semibold uppercase tracking-[0.15em] mb-2">
                    Sound familiar?
                  </p>
                  <p className="text-white/65 text-[15px] leading-relaxed italic">
                    &ldquo;{feat.pain}&rdquo;
                  </p>
                </div>

                {/* Solution */}
                <p className="relative text-white/80 text-base leading-relaxed">
                  {feat.desc}
                </p>

                {/* Bottom accent line */}
                <div className={`h-0.5 w-0 group-hover:w-full ${a.dot} rounded-full transition-all duration-700`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
