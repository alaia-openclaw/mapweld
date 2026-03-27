import Link from "next/link";
import IsometricPipe from "@/components/IsometricPipe";
import PipeSplitSection from "@/components/PipeSplitSection";
import BrandLogo from "@/components/BrandLogo";
import {
  RevealOnScroll,
  StaggerChildren,
  FaqAccordion,
  FloatingShapes,
  ImagePlaceholder,
} from "@/components/LandingAnimated";

export const metadata = {
  title: "MapWeld — Weld tracking on PDF isometrics, without spreadsheets",
  description:
    "Track welds directly on PDF drawings. Works offline in the browser, stores project data locally, and exports structured weld registers without server setup.",
  alternates: {
    canonical: "https://www.mapweld.app",
  },
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
    desc: "Capture weld status at the drawing instead of writing notes in the field and retyping them later.",
  },
  {
    role: "QA/QC Manager",
    desc: "See which welds are pending, inspected, or blocked without waiting for another spreadsheet revision.",
  },
  {
    role: "Fabrication / Project Manager",
    desc: "Use the isometric as the live status view for workpacks, weld progress, and hold points.",
  },
  {
    role: "Document Control",
    desc: "Export structured registers from source data instead of rebuilding traceability after the job moves on.",
  },
];

const proofCards = [
  {
    title: "You can verify the core workflow immediately",
    text: "Open the app, load a drawing, place markers, save a project, and export data without speaking to sales or waiting for a setup call.",
  },
  {
    title: "No server dependency for project data",
    text: "MapWeld stores your working data locally in the browser and in files you control. If the internet drops, the core workflow still works.",
  },
  {
    title: "Designed for fabrication reality",
    text: "The point is not pretty annotation. The point is keeping weld status, WPS, NDT, and notes attached to the drawing people are already using.",
  },
];

const honestyPoints = [
  "No account required to try the product",
  "No fake form submissions or gated demo funnel",
  "No claim that MapWeld replaces ERP, MES, or full QA systems",
  "Simple capture layer first: drawing, welds, status, export",
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

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: {
      "@type": "Answer",
      text: a,
    },
  })),
};

/* ─── Page ─── */

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

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
            <BrandLogo href="/" className="text-white" />
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
                Stop chasing
                <br />
                weld lists.
                <br />
                <span className="text-amber-400 animate-fade-up delay-200 inline-block">
                  Track them on
                  <br />
                  the drawing.
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-white/50 max-w-xl leading-relaxed animate-fade-up delay-400">
                MapWeld turns a PDF isometric into a working weld register:
                place markers, assign WPS and NDT, update status, and export
                structured data without spinning up another spreadsheet.
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

              <div className="grid gap-3 sm:grid-cols-3 animate-fade-up delay-700">
                {[
                  ["Offline-first", "Core workflow works without a cloud backend for project data"],
                  ["Start in minutes", "No login, no install, no setup project just to evaluate it"],
                  ["Direct contact", "Email the team at contact@mapweld.app"],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
                    <p className="text-sm font-bold text-white">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/50">{text}</p>
                  </div>
                ))}
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
              From drawing to register
            </h2>
            <p className="text-base-content/50 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              The workflow is deliberately short: open the drawing, place the welds,
              update status, export the data. That&apos;s the point.
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
              Built for the gap
              <br />
              <span className="text-white/40">between paper and enterprise software.</span>
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
          PROOF / HONESTY
      ════════════════════════════════════════════ */}
      <section className="relative px-6 py-24 md:py-28 bg-base-100 border-b border-base-300/60 overflow-hidden">
        <FloatingShapes variant="light" />

        <div className="relative max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.15fr,0.85fr] items-start">
          <RevealOnScroll className="space-y-6">
            <div className="space-y-4">
              <p className="text-primary font-semibold text-sm uppercase tracking-[0.2em]">
                What you can verify
              </p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-base-content tracking-tight leading-[1.08]">
                No borrowed credibility.
                <br />Just clear product claims.
              </h2>
              <p className="text-base-content/60 text-lg leading-relaxed max-w-2xl">
                If a website wants trust, it should make claims you can test. MapWeld is
                intentionally simple to evaluate: open it, try the workflow, inspect where
                your data lives, and decide whether it fits your fabrication process.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {proofCards.map(({ title, text }) => (
                <div key={title} className="rounded-3xl border border-base-300 bg-base-200/50 p-6 shadow-sm">
                  <p className="text-base font-bold text-base-content leading-snug">{title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-base-content/65">{text}</p>
                </div>
              ))}
            </div>
          </RevealOnScroll>

          <RevealOnScroll className="rounded-3xl border border-base-300 bg-base-200/60 p-6 md:p-8 shadow-sm" animation="animate-slide-right">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Straight answer</p>
            <h3 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight text-base-content">
              What MapWeld is — and what it isn&apos;t
            </h3>
            <ul className="mt-6 space-y-3">
              {honestyPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-base-content/70 leading-relaxed">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-base-300 bg-base-100 p-4 text-sm text-base-content/65">
              Want a walkthrough or want to discuss a pilot? Email <a href="mailto:contact@mapweld.app" className="link link-primary">contact@mapweld.app</a>.
            </div>
          </RevealOnScroll>
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
        <RevealOnScroll className="max-w-4xl mx-auto text-center space-y-5" animation="animate-scale-up">
          <div className="inline-flex mx-auto items-center gap-2 rounded-full border border-base-300 bg-base-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/55">
            Why teams try it
          </div>
          <p className="text-base-content/80 text-2xl md:text-4xl leading-relaxed font-light">
            Because spreadsheets are too detached, enterprise suites are too heavy,
            and paper markups die in someone&apos;s backpack.
          </p>
          <p className="text-base text-base-content/50 max-w-2xl mx-auto leading-relaxed">
            MapWeld is the narrow layer in the middle: the drawing stays central,
            weld status stays visible, and exports stay structured.
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
            Try the workflow.
            <br />
            <span className="text-amber-400">Judge the product after that.</span>
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed">
            Load a drawing, place a few welds, export the register. If that short loop feels
            right for your team, MapWeld is worth a closer look.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app"
              className="btn btn-lg bg-amber-500 hover:bg-amber-400 text-black border-0 shadow-xl shadow-amber-500/25 hover:shadow-amber-400/40 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] text-lg px-12 font-bold"
            >
              Open the app
            </Link>
            <Link href="/contact" className="btn btn-lg btn-ghost text-white/70 hover:text-white hover:bg-white/5">
              Talk to the team
            </Link>
          </div>
        </RevealOnScroll>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <footer className="relative border-t border-base-300 bg-base-200">
        <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center sm:items-start gap-3">
              <BrandLogo href="/" />
              <div>
                <p className="text-sm text-base-content/50">
                  Live weld traceability — from the shop floor.
                </p>
                <p className="mt-1 text-xs text-base-content/40">
                  Questions? <a href="mailto:contact@mapweld.app" className="hover:text-base-content transition-colors">contact@mapweld.app</a>
                </p>
              </div>
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
