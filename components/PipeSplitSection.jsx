"use client";

import { useInView, FloatingShapes } from "@/components/LandingAnimated";

const advantages = [
  {
    title: "Track as it happens",
    pain: "Welds get done at 7 AM. The spreadsheet gets updated at 5 PM — maybe. Your data is always a day behind.",
    desc: "Capture weld data at the source — on the drawing, on the shop floor, the moment it happens. No retyping at a desk later. The register updates itself.",
    accent: "amber",
  },
  {
    title: "NDT traceability on autopilot",
    pain: "Which welds need RT? What percentage is done? Nobody knows without digging through a side spreadsheet.",
    desc: "NDT requirements, percentages, and repair loops are tracked automatically per weld. No manual recalculation. No second system. See what needs inspection at a glance.",
    accent: "sky",
  },
  {
    title: "Open and start",
    pain: "Enterprise platforms need IT, servers, training budgets, and months before a single weld is tracked.",
    desc: "Runs in a browser, works fully offline, saves to local files. No install, no account, no server, no IT ticket. Hand it to any fitter or inspector and they start immediately.",
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

function IconRealtimeCapture({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={`w-14 h-14 ${className}`} aria-hidden>
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2.5" strokeDasharray="20 120" strokeLinecap="round" />
      <path d="M32 18 L32 32 L42 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="32" r="3" fill="currentColor" opacity="0.6" />
      <path d="M19 10 L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M45 10 L49 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function IconNdtTraceability({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={`w-14 h-14 ${className}`} aria-hidden>
      <circle cx="28" cy="28" r="16" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <circle cx="28" cy="28" r="16" stroke="currentColor" strokeWidth="2.5" strokeDasharray="14 86" strokeLinecap="round" />
      <path d="M40 40 L54 54" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 28 L26 32 L34 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="18" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="18" cy="28" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="38" cy="28" r="1.5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function IconZeroFriction({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={`w-14 h-14 ${className}`} aria-hidden>
      <rect x="14" y="8" width="36" height="48" rx="6" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <rect x="14" y="8" width="36" height="48" rx="6" stroke="currentColor" strokeWidth="2.5" strokeDasharray="20 150" strokeLinecap="round" />
      <circle cx="32" cy="50" r="2" fill="currentColor" opacity="0.4" />
      <path d="M24 24 L28 28 L36 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 34 L40 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <path d="M24 39 L36 39" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
    </svg>
  );
}

const icons = [IconRealtimeCapture, IconNdtTraceability, IconZeroFriction];

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
            Why MapWeld
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Solve the real problems.
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              Not just digitize the old ones.
            </span>
          </h2>
          <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Three things that change how your shop floor tracks welds.
          </p>
        </div>

        {/* Advantage cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {advantages.map((adv, i) => {
            const a = accentMap[adv.accent];
            const Icon = icons[i];
            return (
              <div
                key={adv.title}
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
                    <Icon className={a.text} />
                  </div>
                  <h3 className={`text-2xl font-bold ${a.text}`}>{adv.title}</h3>
                </div>

                {/* Pain point */}
                <div className="relative rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5">
                  <p className="text-[11px] text-white/35 font-semibold uppercase tracking-[0.15em] mb-2">
                    Sound familiar?
                  </p>
                  <p className="text-white/65 text-[15px] leading-relaxed italic">
                    &ldquo;{adv.pain}&rdquo;
                  </p>
                </div>

                {/* Solution */}
                <p className="relative text-white/80 text-base leading-relaxed">
                  {adv.desc}
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
