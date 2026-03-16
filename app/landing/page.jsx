import Link from "next/link";
import IsometricPipe from "@/components/IsometricPipe";
import PipeSplitSection from "@/components/PipeSplitSection";
import {
  RevealOnScroll,
  StaggerChildren,
  FaqAccordion,
  FloatingShapes,
  ImagePlaceholder,
} from "@/components/LandingAnimated";

export const metadata = {
  title: "MapWeld — Live weld traceability on your drawings",
  description:
    "Mark welds directly on PDF isometrics from the shop floor. Fully offline, file-based, zero IT setup. Free for now.",
};

/* ─── Data ─── */

const howSteps = [
  {
    num: "1",
    title: "Open MapWeld",
    desc: "No install, no login, no account. Works on any device with a browser — desktop, tablet, phone. Open the page and you're ready.",
    imageLabel: "Screenshot: MapWeld start screen",
    side: "left",
  },
  {
    num: "2",
    title: "Load your drawing",
    desc: "Upload a PDF isometric. Your drawing becomes the single source of truth — not a copy beside it in a folder.",
    imageLabel: "Screenshot: PDF loaded with drawing",
    side: "right",
  },
  {
    num: "3",
    title: "Mark welds, spools, parts",
    desc: "Click to place markers. Assign WPS, welder, NDT, status. Spools and parts tracked visually, not in a separate list.",
    imageLabel: "Screenshot: Markers on drawing",
    side: "left",
  },
  {
    num: "4",
    title: "Save & export",
    desc: "Save as a .weldproject file. Export weld registers to Excel, print progress reports, generate summaries — all from the same data.",
    imageLabel: "Screenshot: Export dialog",
    side: "right",
  },
];

const comparisonCards = [
  {
    vs: "vs. Free markup tools",
    text: "Markup tools let you draw on a PDF. MapWeld gives you structured weld data, status tracking, and export-ready reports.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    vs: "vs. Enterprise platforms",
    text: "Enterprise platforms need IT, servers, training budgets, and months of setup. MapWeld runs in a browser, offline, right now.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    vs: "vs. Spreadsheets & paper",
    text: "Spreadsheets drift from the drawing. Paper gets lost. MapWeld keeps weld data where it belongs — on the isometric.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
];

const personas = [
  {
    role: "QC Inspector",
    desc: "Spend your time inspecting, not typing. Data capture happens on the drawing as you go.",
  },
  {
    role: "QA/QC Manager",
    desc: "See real progress, not Excel promises. Traceability built in from the source.",
  },
  {
    role: "Fabrication / Project Manager",
    desc: "Know what's welded, what's pending, what's blocked — without chasing anyone.",
  },
  {
    role: "Document Control",
    desc: "Export data-book artifacts from data that was captured at source — not reassembled after the fact.",
  },
];

const faqItems = [
  { q: "Is MapWeld free?", a: "Free for now. Pricing will come later — start using it today at no cost." },
  { q: "What file types does it support?", a: "PDF for drawings. Save and load projects as .weldproject files." },
  { q: "Can I export weld data?", a: "Yes — Excel export, print-ready reports, and progress summaries." },
  { q: "How does it handle NDT tracking?", a: "Track NDT requirements per weld (RT, UT, MT, PT, VT). See at a glance which welds still need inspection, manage hold points, and attach evidence directly." },
  { q: "How does it handle repairs?", a: "Repairs are tracked as lineage: cut-out, re-weld, retest. Traceability stays intact." },
  { q: "Does it replace our ERP or MES?", a: "No. MapWeld is a capture layer. Export data into whatever system you already use." },
  { q: "Do I need IT to set it up?", a: "No. It runs in a browser, works offline, and saves to local files. No server, no account, no IT ticket." },
  { q: "Where is my data stored?", a: "On your device, in project files you control. Nothing is sent to a cloud." },
];

/* ─── Page ─── */

export default function LandingPageV2() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <section className="relative bg-[#0f172a] text-white overflow-hidden">
        <FloatingShapes variant="hero" />

        {/* Grid bg */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none" aria-hidden>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="herogrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#herogrid)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-8 pb-12 md:pt-12 md:pb-16">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-20 md:mb-28">
            <Link href="/" className="text-2xl font-extrabold tracking-tight">
              MapWeld
            </Link>
            <Link
              href="/app"
              className="btn bg-amber-500 hover:bg-amber-400 text-black border-0 shadow-lg shadow-amber-500/20 hover:shadow-amber-400/30 transition-all duration-300 hover:scale-105 font-bold"
            >
              Start free
            </Link>
          </nav>

          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left: copy */}
            <div className="space-y-8">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight leading-[1.05] animate-fade-up">
                Ditch the
                <br />
                paper.
                <br />
                <span className="text-amber-400 animate-fade-up delay-200 inline-block">
                  Track welds
                  <br />
                  on your drawings.
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-white/50 max-w-lg leading-relaxed animate-fade-up delay-400">
                Open a PDF isometric on any tablet. Mark welds, assign WPS,
                track status — right from the shop floor.
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-white/35 animate-fade-up delay-500">
                {["No install", "Fully offline", "File-based", "No account"].map((b) => (
                  <span key={b} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-amber-400/60" />
                    {b}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2 animate-fade-up delay-600">
                <Link
                  href="/app"
                  className="btn btn-lg bg-amber-500 hover:bg-amber-400 text-black border-0 shadow-xl shadow-amber-500/25 hover:shadow-amber-400/40 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] text-lg px-10 font-bold"
                >
                  Start now — free
                </Link>
                <a
                  href="#how-it-works"
                  className="btn btn-lg btn-ghost text-white/50 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                  See how it works ↓
                </a>
              </div>
            </div>

            {/* Right: pipe illustration */}
            <div className="animate-scale-up delay-500">
              <IsometricPipe className="w-full max-w-2xl mx-auto lg:mx-0" />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          PIPE SPLIT / FEATURES
      ════════════════════════════════════════════ */}
      <PipeSplitSection />

      {/* ════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative px-6 py-24 md:py-32 bg-base-100 scroll-mt-8 overflow-hidden">
        <FloatingShapes variant="light" />

        <div className="relative max-w-6xl mx-auto">
          {/* Section header */}
          <RevealOnScroll className="text-center mb-20 md:mb-28 space-y-4">
            <p className="text-primary font-semibold text-sm uppercase tracking-[0.2em]">
              How it works
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-base-content tracking-tight leading-[1.08]">
              It&apos;s so easy
            </h2>
            <p className="text-base-content/50 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
              No onboarding call. No training. No IT ticket.
              <br className="hidden md:block" /> Just open and start.
            </p>
          </RevealOnScroll>

          {/* Steps */}
          <div className="space-y-20 md:space-y-32">
            {howSteps.map(({ num, title, desc, imageLabel, side }) => (
              <RevealOnScroll
                key={num}
                animation={side === "left" ? "animate-slide-left" : "animate-slide-right"}
              >
                <div
                  className={`flex flex-col items-center gap-12 md:gap-16 ${
                    side === "left" ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Image placeholder */}
                  <div className="relative flex-1 w-full max-w-lg">
                    <span
                      className={`absolute -top-10 ${
                        side === "left" ? "-left-4 md:-left-8" : "-right-4 md:-right-8"
                      } text-[8rem] md:text-[10rem] font-black text-primary/[0.06] leading-none select-none pointer-events-none`}
                    >
                      {num}
                    </span>
                    <ImagePlaceholder label={imageLabel} aspect="16/10" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 space-y-5 text-center md:text-left max-w-md">
                    <div className="flex items-center justify-center md:justify-start gap-4">
                      <span className="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center text-lg font-bold shadow-lg shadow-primary/20">
                        {num}
                      </span>
                      <h3 className="text-2xl md:text-3xl font-extrabold text-base-content">
                        {title}
                      </h3>
                    </div>
                    <p className="text-base-content/55 text-lg leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          COMPARISON
      ════════════════════════════════════════════ */}
      <section className="relative px-6 py-24 md:py-32 bg-[#0f172a] text-white overflow-hidden">
        <FloatingShapes variant="dark" />

        <div className="relative max-w-5xl mx-auto">
          <RevealOnScroll className="text-center mb-16 space-y-4">
            <p className="text-amber-400 font-semibold text-sm uppercase tracking-[0.2em]">
              Why MapWeld
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
              Not another tool.
              <br />
              <span className="text-white/40">The right tool.</span>
            </h2>
          </RevealOnScroll>

          <StaggerChildren className="grid md:grid-cols-3 gap-6 lg:gap-8" staggerMs={180}>
            {comparisonCards.map(({ vs, text, icon }) => (
              <div
                key={vs}
                className="group rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8
                  transition-all duration-500 hover:bg-white/[0.06] hover:border-white/[0.12] hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="text-amber-400/70 mb-5 group-hover:text-amber-400 transition-colors duration-300">
                  {icon}
                </div>
                <h3 className="font-bold text-amber-400 mb-3 text-base uppercase tracking-wide">
                  {vs}
                </h3>
                <p className="text-white/55 text-base leading-relaxed group-hover:text-white/70 transition-colors duration-300">
                  {text}
                </p>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          WHO IT'S FOR
      ════════════════════════════════════════════ */}
      <section className="relative px-6 py-24 md:py-32 bg-base-100 overflow-hidden">
        <FloatingShapes variant="light" />

        <div className="relative max-w-5xl mx-auto">
          <RevealOnScroll className="text-center mb-16 space-y-4">
            <p className="text-primary font-semibold text-sm uppercase tracking-[0.2em]">
              Built for you
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-base-content tracking-tight leading-[1.08]">
              Built for the people
              <br />who do the work
            </h2>
          </RevealOnScroll>

          <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerMs={120}>
            {personas.map(({ role, desc }) => (
              <div
                key={role}
                className="group rounded-3xl border border-base-300 bg-base-200/50 p-8 text-center
                  transition-all duration-500 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1"
              >
                <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5
                  group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h3 className="font-bold text-base-content text-lg mb-2">{role}</h3>
                <p className="text-sm text-base-content/55 leading-relaxed">{desc}</p>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SOCIAL PROOF
      ════════════════════════════════════════════ */}
      <section className="relative px-6 py-20 md:py-24 bg-base-200 border-y border-base-300/50">
        <RevealOnScroll className="max-w-3xl mx-auto text-center space-y-4" animation="animate-scale-up">
          <svg className="w-10 h-10 text-primary/30 mx-auto" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <p className="text-base-content/75 italic text-2xl md:text-3xl leading-relaxed font-light">
            Built by fabrication PMs who got tired of retyping weld lists.
          </p>
          <p className="text-base text-base-content/45">
            Designed for pipe prefab, offshore modules, and shipyards.
            <br />Works offline on the shop floor.
          </p>
        </RevealOnScroll>
      </section>

      {/* ════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════ */}
      <section className="relative px-6 py-24 md:py-32 bg-base-100 overflow-hidden">
        <FloatingShapes variant="light" />

        <div className="relative max-w-3xl mx-auto">
          <RevealOnScroll className="text-center mb-14 space-y-4">
            <p className="text-primary font-semibold text-sm uppercase tracking-[0.2em]">
              FAQ
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-base-content tracking-tight">
              Frequently asked questions
            </h2>
          </RevealOnScroll>

          <FaqAccordion items={faqItems} />
        </div>
      </section>

      {/* ════════════════════════════════════════════
          BOTTOM CTA
      ════════════════════════════════════════════ */}
      <section className="relative px-6 py-24 md:py-32 bg-[#0f172a] text-white overflow-hidden">
        <FloatingShapes variant="dark" />

        <RevealOnScroll className="relative max-w-3xl mx-auto text-center space-y-8" animation="animate-scale-up">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
            Your next weld is
            <br />happening right now.
            <br />
            <span className="text-amber-400">Is it being tracked?</span>
          </h2>
          <p className="text-white/40 text-lg max-w-md mx-auto">
            Open MapWeld and start marking welds on your drawings. Free, offline, instant.
          </p>
          <Link
            href="/app"
            className="btn btn-lg bg-amber-500 hover:bg-amber-400 text-black border-0 shadow-xl shadow-amber-500/25 hover:shadow-amber-400/40 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] text-lg px-12 font-bold"
          >
            Start now — free
          </Link>
        </RevealOnScroll>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <footer className="relative border-t border-base-300 bg-base-200">
        <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <Link href="/" className="text-xl font-extrabold text-base-content">
                MapWeld
              </Link>
              <p className="text-sm text-base-content/50">
                Live weld traceability — from the shop floor.
              </p>
            </div>
            <Link
              href="/app"
              className="btn btn-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
            >
              Start now
            </Link>
          </div>
          <nav className="flex flex-wrap justify-center sm:justify-start gap-x-8 gap-y-3 text-sm text-base-content/60">
            {[
              ["/about", "About"],
              ["/catalog", "Part Catalog"],
              ["/contact", "Contact"],
              ["/privacy", "Privacy Policy"],
              ["/terms", "Terms of Use"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="hover:text-base-content transition-colors duration-200">
                {label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-base-300 pt-5 text-center sm:text-left text-xs text-base-content/40">
            &copy; {new Date().getFullYear()} MapWeld. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
