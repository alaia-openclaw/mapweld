import Link from "next/link";

export const metadata = {
  title: "MapWeld — Live weld traceability on your drawings",
  description:
    "Mark welds directly on PDF isometrics from the shop floor. Fully offline, file-based, zero IT setup. Free for now.",
  alternates: {
    canonical: "https://www.mapweld.app",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "MapWeld",
      url: "https://www.mapweld.app",
      description:
        "Mark welds directly on PDF isometrics from the shop floor. Track WPS, NDT, spools, and repairs. Export weld registers and progress reports. Fully offline, file-based, zero IT setup.",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any (Web-based)",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is MapWeld free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Free for now. Pricing will come later — start using it today at no cost.",
          },
        },
        {
          "@type": "Question",
          name: "What file types does MapWeld support?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "PDF for drawings. Save and load projects as .weldproject files.",
          },
        },
        {
          "@type": "Question",
          name: "Can I export weld data?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes — Excel export, print-ready reports, and progress summaries.",
          },
        },
        {
          "@type": "Question",
          name: "How does MapWeld handle NDT tracking?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Track NDT requirements per weld (RT, UT, MT, PT, VT). See which welds still need inspection, manage hold points, and attach evidence directly.",
          },
        },
        {
          "@type": "Question",
          name: "Does MapWeld work offline?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, fully. It works without internet once loaded. Your data stays on your device.",
          },
        },
        {
          "@type": "Question",
          name: "Do I need IT to set up MapWeld?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. It runs in a browser, works offline, and saves to local files. No server, no account, no IT ticket.",
          },
        },
        {
          "@type": "Question",
          name: "How does MapWeld handle repairs and re-welds?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Repairs are tracked as lineage: cut-out, re-weld, retest. Traceability stays intact.",
          },
        },
        {
          "@type": "Question",
          name: "Does MapWeld replace our ERP or MES?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. MapWeld is a capture layer. Export data into whatever system you already use.",
          },
        },
      ],
    },
  ],
};

function HeroPattern() {
  return (
    <div
      className="absolute inset-0 opacity-[0.03] pointer-events-none"
      aria-hidden
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

function AppMockup() {
  return (
    <div
      className="relative mx-auto w-full max-w-xl rounded-2xl border border-base-300 bg-base-100 shadow-xl overflow-hidden ring-1 ring-black/5"
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-base-300 bg-base-200/80 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-error/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-success/70" />
        </div>
        <div className="flex-1 ml-4 h-2 rounded bg-base-300/60 max-w-[35%]" />
      </div>
      <div className="aspect-[4/3] bg-base-200/50 relative p-6">
        <div className="h-full w-full rounded-xl bg-base-100 border border-base-300 relative overflow-hidden shadow-inner">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 400 300" fill="none">
              <rect
                x="20"
                y="20"
                width="360"
                height="260"
                stroke="currentColor"
                strokeWidth="0.5"
                rx="2"
              />
              <line
                x1="20"
                y1="50"
                x2="380"
                y2="50"
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <line
                x1="20"
                y1="80"
                x2="200"
                y2="80"
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <line
                x1="20"
                y1="110"
                x2="300"
                y2="110"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </svg>
          </div>
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="grid grid-cols-3 gap-8 place-items-center w-3/4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center shadow-sm"
                >
                  <span className="text-sm font-bold text-primary">{i}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
            <div className="h-8 flex-1 rounded-lg bg-primary/15 border border-primary/30" />
            <div className="h-8 w-16 rounded-lg bg-base-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

function IconTarget() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M11 8v6M8 11h6" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4v6h6" />
      <path d="M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

const features = [
  {
    icon: IconTarget,
    title: "Mark welds in minutes",
    desc: "Click-to-place weld markers on PDF isometrics. Tablet-optimized for the shop floor.",
  },
  {
    icon: IconLink,
    title: "Spools, joints, parts — all linked",
    desc: "Tag spool IDs, bolted joints, supports. Everything tied to the drawing.",
  },
  {
    icon: IconClipboard,
    title: "WPS and welder at the source",
    desc: "Assign WPS, fitter, welder per weld. Captured once, never retyped.",
  },
  {
    icon: IconSearch,
    title: "NDT tracking and hold points",
    desc: "Know which welds need inspection, what percentage is done, and what\u2019s blocking progress. Attach RT/UT/VT evidence directly.",
  },
  {
    icon: IconRefresh,
    title: "Repairs stay in the chain",
    desc: "Cut-outs, re-welds, retests tracked as lineage. Traceability survives rework.",
  },
  {
    icon: IconDownload,
    title: "Export-ready outputs",
    desc: "Weld registers, progress reports, print-ready summaries. The data is already there.",
  },
];

const painCards = [
  {
    text: "Inspectors re-enter data that already exists on a marked-up drawing. Hours lost to admin, not quality.",
  },
  {
    text: "NDT percentages live in someone\u2019s head or a side spreadsheet. Which welds still need RT? Nobody knows instantly.",
  },
  {
    text: "By the time the report is ready, three more welds are done and it\u2019s already out of date.",
  },
];

const howSteps = [
  {
    num: "1",
    title: "Open MapWeld",
    desc: "No install, no login. Works on any device with a browser.",
  },
  {
    num: "2",
    title: "Load your drawing and start marking",
    desc: "Upload a PDF isometric. Place welds, assign WPS, log status.",
  },
  {
    num: "3",
    title: "Save and export",
    desc: "Save as a .weldproject file. Export to Excel or print reports anytime.",
  },
];

const simplicityItems = [
  "Don\u2019t have a proper isometric yet? Upload a hand sketch. Mark your welds on it. Replace with the real drawing later.",
  "Don\u2019t need to track part numbers? Then don\u2019t. Just mark welds and statuses \u2014 that\u2019s enough.",
  "Only have 10 welds on a spool? You don\u2019t need an enterprise platform for that. Open MapWeld and start.",
  "Drawing changed mid-project? Update your markup. As-built documentation without starting over.",
];

const comparisonCards = [
  {
    vs: "vs. Free markup tools",
    text: "Markup tools let you draw on a PDF. MapWeld gives you structured weld data, status tracking, and export-ready reports.",
  },
  {
    vs: "vs. Enterprise welding platforms",
    text: "Enterprise platforms need IT, servers, training budgets, and months of setup before a single weld is tracked. MapWeld runs in a browser, offline, right now.",
  },
  {
    vs: "vs. Spreadsheets and paper",
    text: "Spreadsheets drift from the drawing. Paper gets lost. MapWeld keeps weld data where it belongs \u2014 on the isometric.",
  },
];

const personas = [
  {
    role: "QC Inspector / Welding Coordinator",
    desc: "Spend your time inspecting, not typing. Data capture happens on the drawing as you go.",
  },
  {
    role: "QA/QC Manager",
    desc: "See real progress, not Excel promises. Traceability built in.",
  },
  {
    role: "Fabrication / Project Manager",
    desc: "Know what\u2019s welded, what\u2019s pending, what\u2019s blocked \u2014 without chasing anyone.",
  },
  {
    role: "Document Control / Turnover Lead",
    desc: "Export data-book artifacts from data that was captured at source.",
  },
];

const faqItems = [
  {
    q: "Is MapWeld free?",
    a: "Free for now. Pricing will come later \u2014 start using it today at no cost.",
  },
  {
    q: "What file types does it support?",
    a: "PDF for drawings. Save and load projects as .weldproject files.",
  },
  {
    q: "Can I export weld data?",
    a: "Yes \u2014 Excel export, print-ready reports, and progress summaries.",
  },
  {
    q: "How does it handle NDT tracking?",
    a: "Track NDT requirements per weld (RT, UT, MT, PT, VT). See at a glance which welds still need inspection, manage hold points, and attach evidence directly.",
  },
  {
    q: "How does it handle repairs and re-welds?",
    a: "Repairs are tracked as lineage: cut-out, re-weld, retest. Traceability stays intact.",
  },
  {
    q: "Does it replace our ERP or MES?",
    a: "No. MapWeld is a capture layer. Export data into whatever system you already use.",
  },
  {
    q: "Do I need IT to set it up?",
    a: "No. It runs in a browser, works offline, and saves to local files. No server, no account, no IT ticket.",
  },
  {
    q: "Where is my data stored?",
    a: "On your device, in project files you control. Nothing is sent to a cloud.",
  },
];

const trustBadges = [
  {
    label: "No install",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    label: "Fully offline",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
    ),
  },
  {
    label: "File-based",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    label: "No account needed",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M18 8l4-4M22 8l-4-4" opacity="0.5" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroPattern />

      <main className="relative flex-1">
        {/* ─── Hero ─── */}
        <section className="relative px-4 pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-base-content tracking-tight leading-[1.1]">
              Ditch the paper.
              <br />
              <span className="text-primary">
                Fill in weld data directly on your drawings.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-base-content/75 max-w-2xl mx-auto leading-relaxed">
              Open a PDF isometric on any tablet. Mark welds, assign WPS, track
              status&nbsp;&mdash; right from the shop floor. No install. No IT.
              No internet required.
            </p>

            <ul className="flex flex-col gap-2.5 text-left max-w-lg mx-auto text-base-content/80">
              {[
                "Capture weld data at the source \u2014 not hours later at a desk",
                "Works fully offline. File-based. Your data stays yours.",
                "Zero setup \u2014 open the app and start. Hand it to any fitter or inspector.",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <svg className="w-5 h-5 text-primary mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/app"
                className="btn btn-primary btn-lg text-lg px-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Start now &mdash; free for now
              </Link>
              <a
                href="#how-it-works"
                className="btn btn-ghost btn-lg text-base-content/70"
              >
                See how it works &darr;
              </a>
            </div>

            <div className="pt-12 md:pt-16">
              <AppMockup />
            </div>
          </div>
        </section>

        {/* ─── Trust strip ─── */}
        <section className="relative px-4 py-6 md:py-8 border-y border-base-300/50 bg-base-100/40">
          <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {trustBadges.map(({ label, icon }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-sm font-medium text-base-content/70"
              >
                <span className="text-primary">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </section>

        {/* ─── Pain: "Sound familiar?" ─── */}
        <section className="relative px-4 py-16 md:py-20">
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-base-content">
                Sound familiar?
              </h2>
              <p className="text-base-content/70 max-w-2xl mx-auto leading-relaxed text-lg">
                Welds get done at 7&nbsp;AM. The spreadsheet gets updated at
                5&nbsp;PM&nbsp;&mdash; maybe. Your inspectors spend more time
                typing reports than checking quality.
                <span className="font-semibold text-base-content">
                  {" "}That&apos;s not a people problem&nbsp;&mdash; it&apos;s a
                  process problem.
                </span>
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {painCards.map(({ text }) => (
                <div
                  key={text}
                  className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm"
                >
                  <p className="text-base-content/80 leading-relaxed text-[0.95rem]">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Solution bridge ─── */}
        <section className="relative px-4 py-14 md:py-18 bg-primary/5 border-y border-primary/10">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-base-content">
              What if the drawing was the database?
            </h2>
            <p className="text-base-content/75 text-lg leading-relaxed">
              Mark a weld on the isometric&nbsp;&mdash; and the register, the
              status, and the report update themselves. No retyping. No delay.
            </p>
          </div>
        </section>

        {/* ─── Feature grid ─── */}
        <section className="relative px-4 py-16 md:py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-base-content text-center mb-12">
              Everything you need to track welds&nbsp;&mdash; nothing you don&apos;t
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-primary mb-3">
                    <Icon />
                  </div>
                  <h3 className="font-bold text-base-content mb-1.5">
                    {title}
                  </h3>
                  <p className="text-sm text-base-content/70 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section
          id="how-it-works"
          className="relative px-4 py-16 md:py-20 bg-base-100/60 border-y border-base-300/50 scroll-mt-8"
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-base-content text-center mb-12">
              How it works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {howSteps.map(({ num, title, desc }) => (
                <div key={num} className="text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center text-xl font-bold shadow">
                    {num}
                  </div>
                  <h3 className="font-bold text-base-content text-lg">
                    {title}
                  </h3>
                  <p className="text-sm text-base-content/70 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Simplicity: "Use what you need" ─── */}
        <section className="relative px-4 py-16 md:py-20">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-base-content">
                Use what you need. Skip what you don&apos;t.
              </h2>
              <p className="text-base-content/70 text-lg leading-relaxed max-w-2xl mx-auto">
                Other tools force you into a full system before you can track a
                single weld. MapWeld works the way your shop floor already
                does&nbsp;&mdash; start rough, refine as you go.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {simplicityItems.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm"
                >
                  <svg className="w-5 h-5 text-primary mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-base-content/80 leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Comparison ─── */}
        <section className="relative px-4 py-16 md:py-20 bg-base-100/60 border-y border-base-300/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-base-content text-center mb-12">
              Why MapWeld vs. the alternatives
            </h2>
            <div className="grid md:grid-cols-3 gap-5">
              {comparisonCards.map(({ vs, text }) => (
                <div
                  key={vs}
                  className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm"
                >
                  <h3 className="font-bold text-primary mb-2 text-sm uppercase tracking-wide">
                    {vs}
                  </h3>
                  <p className="text-base-content/75 text-sm leading-relaxed">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Who it's for ─── */}
        <section className="relative px-4 py-16 md:py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-base-content text-center mb-12">
              Built for the people who do the work
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {personas.map(({ role, desc }) => (
                <div
                  key={role}
                  className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm text-center"
                >
                  <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-base-content text-sm mb-1.5">
                    {role}
                  </h3>
                  <p className="text-xs text-base-content/70 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Social proof ─── */}
        <section className="relative px-4 py-12 md:py-16 bg-base-100/60 border-y border-base-300/50">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <p className="text-base-content/80 italic text-lg">
              &ldquo;Built by fabrication PMs who got tired of retyping weld
              lists.&rdquo;
            </p>
            <p className="text-sm text-base-content/60">
              Designed for pipe prefab, offshore modules, and shipyards. Works
              offline on the shop floor.
            </p>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="relative px-4 py-16 md:py-20">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-base-content text-center mb-10">
              Frequently asked questions
            </h2>
            <dl className="space-y-6">
              {faqItems.map(({ q, a }) => (
                <div
                  key={q}
                  className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm"
                >
                  <dt className="font-bold text-base-content mb-1">{q}</dt>
                  <dd className="text-base-content/70 text-sm leading-relaxed">
                    {a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ─── Bottom CTA ─── */}
        <section className="relative px-4 py-16 md:py-20 bg-primary/5 border-y border-primary/10">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-base-content">
              Your next weld is happening right now.
              <br />
              <span className="text-primary">Is it being tracked?</span>
            </h2>
            <Link
              href="/app"
              className="btn btn-primary btn-lg text-lg px-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Start now &mdash; free for now
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-base-300 bg-base-200/80">
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <Link href="/" className="text-lg font-bold text-base-content">
                MapWeld
              </Link>
              <p className="text-sm text-base-content/60">
                Live weld traceability &mdash; from the shop floor.
              </p>
            </div>

            <Link href="/app" className="btn btn-primary btn-sm shadow">
              Start now
            </Link>
          </div>

          <nav className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 text-sm text-base-content/70">
            <Link
              href="/about"
              className="hover:text-base-content transition-colors"
            >
              About
            </Link>
            <Link
              href="/catalog"
              className="hover:text-base-content transition-colors"
            >
              Part Catalog
            </Link>
            <Link
              href="/contact"
              className="hover:text-base-content transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/privacy"
              className="hover:text-base-content transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-base-content transition-colors"
            >
              Terms of Use
            </Link>
          </nav>

          <div className="border-t border-base-300 pt-4 text-center sm:text-left text-xs text-base-content/50">
            &copy; {new Date().getFullYear()} MapWeld. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
