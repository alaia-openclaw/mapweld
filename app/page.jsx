import Link from "next/link";
import IsometricPipe from "@/components/IsometricPipe";
import PipeSplitSection from "@/components/PipeSplitSection";
import BrandLogo from "@/components/BrandLogo";
import LandingStepVideo from "@/components/LandingStepVideo";
import LandingFeedbackStrip from "@/components/LandingFeedbackStrip";
import {
  RevealOnScroll,
  StaggerChildren,
  FaqAccordion,
  FloatingShapes,
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

/** How-it-works clips: optional per-video framing (omit keys to use LandingStepVideo defaults).
 *  aspect — CSS aspect-ratio of the chrome frame (e.g. "16/10", "16/9").
 *  cropSidesPct / cropBottomPct — trim encoded letterbox (% of box); black bars are in the pixels.
 *  objectFit / objectPosition — passed to the <video> element. */
const howSteps = [
  {
    num: "1",
    title: "Load PDF",
    desc: "Open the isometric directly in MapWeld so the drawing becomes the live working surface for the job.",
    videoSrc: "/media/mapweld/step-1-load-pdf.mp4",
    posterSrc: "/media/mapweld/step-1-load-pdf.jpg",
    badge: "Step 1 · Drawing",
    objectPosition: "center top",
    side: "left",
  },
  {
    num: "2",
    title: "Add markers for spools, lines, welds",
    desc: "Drop markers exactly where the work sits on the drawing, so traceability starts at source instead of in a separate spreadsheet later.",
    videoSrc: "/media/mapweld/step-2-add-markers.mp4",
    posterSrc: "/media/mapweld/step-2-add-markers.jpg",
    badge: "Step 2 · Mark-up",
    objectPosition: "center top",
    side: "right",
  },
  {
    num: "3",
    title: "Fill weld information",
    desc: "Capture weld details, status, WPS and inspection context while the drawing is open and the work is in front of you.",
    videoSrc: "/media/mapweld/step-3-fill-weld-info.mp4",
    posterSrc: "/media/mapweld/step-3-fill-weld-info.jpg",
    badge: "Step 3 · Data capture",
    objectPosition: "center top",
    side: "left",
  },
  {
    num: "4",
    title: "Export to Excel",
    desc: "Push the tracked drawing data into a structured Excel register without rebuilding the weld list by hand at the end.",
    videoSrc: "/media/mapweld/step-4-export-excel.mp4",
    posterSrc: "/media/mapweld/step-4-export-excel.jpg",
    badge: "Step 4 · Export",
    objectPosition: "center top",
    side: "right",
  },
];

const painpointCards = [
  {
    title: "Stop double entry",
    text: "Capture the weld once on the drawing instead of marking paper first and retyping everything into a spreadsheet later.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h6" /><path d="M12 9v6" /><rect x="3" y="4" width="7" height="16" rx="2" /><rect x="14" y="4" width="7" height="16" rx="2" />
      </svg>
    ),
  },
  {
    title: "Keep traceability on the isometric",
    text: "Spools, lines, welds and status stay tied to the actual drawing people use in fabrication, inspection and progress follow-up.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h7" /><path d="M13 12h7" /><circle cx="12" cy="12" r="2.5" /><path d="M12 9.5V4" /><path d="M12 20v-5.5" />
      </svg>
    ),
  },
  {
    title: "Export without rebuilding the register",
    text: "When the job needs reporting, export structured data from captured field information instead of reconstructing it after the fact.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><rect x="4" y="18" width="16" height="3" rx="1.5" />
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

const featureProofCards = [
  {
    title: "Live weld status on the drawing",
    text: "The isometric stays central while weld markers, spool references and progress move with the job instead of drifting into side files.",
  },
  {
    title: "Field-friendly data capture",
    text: "Capture the key weld information while the work is in front of you, not hours later when someone has to decode handwritten notes.",
  },
  {
    title: "Structured export when reporting is due",
    text: "Excel output comes from tracked source data, so handover and reporting start from a cleaner base.",
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
  {
    q: "Who is MapWeld for?",
    a: "Fabrication shops, QA/QC teams, and project or document control leads who track welds on PDF isometrics and need structured exports without a heavy enterprise rollout. If that sounds like your team, try the app or email hello@mapweld.app.",
  },
  {
    q: "Can we run a pilot on one project?",
    a: "Yes. Many teams start with a single job or drawing set. Email hello@mapweld.app or use the Contact page with topic “pilot” so we know what you’re trying to validate.",
  },
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
          <nav className="flex items-center justify-between gap-3 mb-20 md:mb-28">
            <BrandLogo href="/" className="text-white" />
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <a
                href="#contact"
                className="btn btn-ghost btn-sm sm:btn-md text-white/80 hover:text-white hover:bg-white/10 border-0"
              >
                Contact
              </a>
              <Link
                href="/app"
                className="btn bg-amber-500 hover:bg-amber-400 text-black border-0 shadow-lg shadow-amber-500/20 hover:shadow-amber-400/30 transition-all duration-300 hover:scale-105 font-bold"
              >
                Start free
              </Link>
            </div>
          </nav>

          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left: copy */}
            <div className="space-y-8">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight leading-[1.05] animate-fade-up">
                Stop chasing
                <br />
                weld lists.
                <br />
                <span className="text-amber-400 animate-fade-up delay-200 block">
                  Track&nbsp;them&nbsp;on
                  <br />
                  the&nbsp;drawing.
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

              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2 animate-fade-up delay-600">
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
                <a
                  href="#contact"
                  className="btn btn-lg btn-ghost text-white/50 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                  Contact
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 animate-fade-up delay-700">
                {[
                  ["Offline-first", "Core workflow works without a cloud backend for project data"],
                  ["Start in minutes", "No login, no install, no setup project just to evaluate it"],
                  ["Contact", "hello@mapweld.app — or jump to the contact section"],
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
      <section id="how-it-works" className="relative px-4 sm:px-6 lg:px-10 py-24 md:py-32 bg-base-100 scroll-mt-8 overflow-hidden">
        <FloatingShapes variant="light" />

        <div className="relative w-full max-w-screen-2xl mx-auto">
          {/* Section header */}
          <RevealOnScroll className="text-center mb-16 md:mb-24 space-y-4">
            <p className="text-primary font-semibold text-sm uppercase tracking-[0.2em]">
              How it works
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-base-content tracking-tight leading-[1.08]">
              Four steps. Real workflow.
            </h2>
            <p className="text-base-content/50 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Load the PDF, place markers, fill the weld data, export the register.
              Short loop in the field. Structured output at the end.
            </p>
          </RevealOnScroll>

          {/* Steps */}
          <div className="space-y-16 md:space-y-28">
            {howSteps.map(
              ({
                num,
                title,
                desc,
                videoSrc,
                posterSrc,
                badge,
                objectPosition,
                side,
                aspect = "16/10",
                cropSidesPct,
                cropBottomPct,
                objectFit,
              }) => (
              <RevealOnScroll
                key={num}
                animation={side === "left" ? "animate-slide-left" : "animate-slide-right"}
              >
                <div
                  className={`flex flex-col items-stretch gap-10 lg:gap-14 xl:gap-16 ${
                    side === "left" ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  <div className="relative w-full min-w-0 lg:flex-[2.25] lg:max-w-none">
                    <span
                      className={`absolute -top-10 ${
                        side === "left" ? "-left-4 md:-left-8" : "-right-4 md:-right-8"
                      } text-[8rem] md:text-[10rem] font-black text-primary/[0.06] leading-none select-none pointer-events-none`}
                    >
                      {num}
                    </span>
                    <LandingStepVideo
                      src={videoSrc}
                      poster={posterSrc}
                      title={title}
                      badge={badge}
                      aspect={aspect}
                      objectPosition={objectPosition}
                      cropSidesPct={cropSidesPct}
                      cropBottomPct={cropBottomPct}
                      objectFit={objectFit}
                    />
                  </div>

                  {/* Text */}
                  <div className="w-full min-w-0 lg:flex-[0.7] shrink-0 space-y-5 text-center lg:text-left max-w-xl mx-auto lg:mx-0 lg:max-w-sm lg:pt-2 lg:self-center">
                    <div className="flex items-center justify-center lg:justify-start gap-4">
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
          PAIN POINTS / VALUE
      ════════════════════════════════════════════ */}
      <section className="relative px-6 py-24 md:py-32 bg-[#0f172a] text-white overflow-hidden">
        <FloatingShapes variant="dark" />

        <div className="relative max-w-5xl mx-auto">
          <RevealOnScroll className="text-center mb-16 space-y-4">
            <p className="text-amber-400 font-semibold text-sm uppercase tracking-[0.2em]">
              Why teams use MapWeld
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
              Built to solve the shop-floor gap
              <br />
              <span className="text-white/40">between the drawing and the register.</span>
            </h2>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-white/55">
              The pain is familiar: markups happen in one place, weld lists live somewhere else,
              and reporting gets rebuilt under pressure. MapWeld closes that loop.
            </p>
          </RevealOnScroll>

          <StaggerChildren className="grid md:grid-cols-3 gap-6 lg:gap-8" staggerMs={180}>
            {painpointCards.map(({ title, text, icon }) => (
              <div
                key={title}
                className="group rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8
                  transition-all duration-500 hover:bg-white/[0.06] hover:border-white/[0.12] hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="text-amber-400/70 mb-5 group-hover:text-amber-400 transition-colors duration-300">
                  {icon}
                </div>
                <h3 className="font-bold text-white mb-3 text-xl tracking-tight">
                  {title}
                </h3>
                <p className="text-white/60 text-base leading-relaxed group-hover:text-white/75 transition-colors duration-300">
                  {text}
                </p>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FEATURE PROOF
      ════════════════════════════════════════════ */}
      <section className="relative px-6 py-24 md:py-28 bg-base-100 border-b border-base-300/60 overflow-hidden">
        <FloatingShapes variant="light" />

        <div className="relative max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.15fr,0.85fr] items-start">
          <RevealOnScroll className="space-y-6">
            <div className="space-y-4">
              <p className="text-primary font-semibold text-sm uppercase tracking-[0.2em]">
                What the product does well
              </p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-base-content tracking-tight leading-[1.08]">
                Focused workflow.
                <br />Useful output.
              </h2>
              <p className="text-base-content/60 text-lg leading-relaxed max-w-2xl">
                MapWeld is deliberately narrow: make the drawing the capture surface,
                keep traceability visible, and give teams structured exportable data when
                reporting time comes.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {featureProofCards.map(({ title, text }) => (
                <div key={title} className="rounded-3xl border border-base-300 bg-base-200/50 p-6 shadow-sm">
                  <p className="text-base font-bold text-base-content leading-snug">{title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-base-content/65">{text}</p>
                </div>
              ))}
            </div>
          </RevealOnScroll>

          <RevealOnScroll className="rounded-3xl border border-base-300 bg-base-200/60 p-6 md:p-8 shadow-sm" animation="animate-slide-right">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Operational fit</p>
            <h3 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight text-base-content">
              Made for fabrication teams that need speed and structure
            </h3>
            <div className="mt-6 space-y-4 text-base-content/70 leading-relaxed">
              <p>
                Use it when the drawing is already the working reference and the team needs a faster
                way to mark spools, lines, welds and inspection status without creating admin debt.
              </p>
              <p>
                It runs in the browser, works offline for the core workflow, and keeps the process light
                enough for trial, pilot use and day-to-day project execution.
              </p>
            </div>
            <div className="mt-6 rounded-2xl border border-base-300 bg-base-100 p-4 text-sm text-base-content/65">
              Want a walkthrough or a pilot on one project?{" "}
              <Link href="/contact?topic=pilot" className="link link-primary">
                Contact us
              </Link>{" "}
              or email{" "}
              <a href="mailto:hello@mapweld.app" className="link link-primary">
                hello@mapweld.app
              </a>
              .
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
          CONTACT · FEEDBACK
      ════════════════════════════════════════════ */}
      <section
        id="contact"
        className="relative px-4 sm:px-6 lg:px-10 py-24 md:py-32 bg-base-200 border-y border-base-300/60 scroll-mt-8 overflow-hidden"
      >
        <FloatingShapes variant="light" />

        <div className="relative max-w-3xl mx-auto space-y-12 md:space-y-14">
          <RevealOnScroll animation="animate-slide-right">
            <LandingFeedbackStrip />
          </RevealOnScroll>

          <RevealOnScroll className="rounded-3xl border border-base-300 bg-base-100 p-6 md:p-8 shadow-sm text-center md:text-left space-y-4">
            <h2 className="text-2xl font-bold text-base-content">Contact</h2>
            <p className="text-base-content/70 leading-relaxed">
              Prefer email or a full message form? We usually reply within a few business days.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center">
              <a href="mailto:hello@mapweld.app" className="link link-primary text-lg font-semibold break-all">
                hello@mapweld.app
              </a>
              <span className="hidden sm:inline text-base-content/30">·</span>
              <Link href="/contact" className="btn btn-primary sm:btn-md w-full sm:w-auto">
                Open contact form
              </Link>
            </div>
          </RevealOnScroll>
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
            <a href="#contact" className="btn btn-lg btn-ghost text-white/70 hover:text-white hover:bg-white/5">
              Talk to the team
            </a>
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
                  Questions? <a href="mailto:hello@mapweld.app" className="hover:text-base-content transition-colors">hello@mapweld.app</a>
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
              ["/#contact", "Contact"],
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
