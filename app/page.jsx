import Link from "next/link";

export const metadata = {
  title: "MapWeld — Track welds on PDF drawings",
  description:
    "Upload a drawing, mark welds, and keep status and notes in one place — without chasing screenshots and spreadsheets. Free, no install, works offline.",
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
        "Upload PDF drawings, mark weld points, track status and notes, and export to Excel. Free, no installation required, works offline.",
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
            text: "Yes — free for now.",
          },
        },
        {
          "@type": "Question",
          name: "What file types does MapWeld support?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "PDF for drawings (for now).",
          },
        },
        {
          "@type": "Question",
          name: "Can I export weld data?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes — export weld data to Excel.",
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

const heroBullets = [
  "Click-to-place weld markers on drawings",
  "Simple statuses (e.g. Fit-up, Welding, NDT, Completed)",
  "Export or share progress with your team",
];

const keyFeatures = [
  "Drawing-based weld tracking",
  "Status + notes per weld",
  "Fast search/filter by status",
  "Excel export",
];

const howItWorksSteps = [
  "Upload your drawing (PDF)",
  "Place weld markers on the drawing",
  "Update statuses as work progresses",
];

const faqItems = [
  {
    q: "Is it free?",
    a: "Yes—free for now.",
  },
  {
    q: "What file types?",
    a: "PDF for drawings (for now).",
  },
  {
    q: "Can I export?",
    a: "Yes—export weld data to Excel.",
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
        {/* Hero */}
        <section className="relative px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-base-content tracking-tight leading-[1.1]">
              Ditch the paper.
              <br />
              <span className="text-primary">
                Track welds on your drawings.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-base-content/75 max-w-2xl mx-auto leading-relaxed">
              Upload a drawing, mark welds, and keep status + notes in one place—without chasing screenshots and spreadsheets.
            </p>

            <ul className="flex flex-col gap-2 text-left max-w-md mx-auto list-disc list-inside text-base-content/80">
              {heroBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>

            <div className="flex flex-col items-center gap-2 pt-4">
              <Link
                href="/app"
                className="btn btn-primary btn-lg text-lg px-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Start using it
              </Link>
              <p className="text-sm text-base-content/60">Free for now.</p>
            </div>

            <div className="pt-12 md:pt-16">
              <AppMockup />
            </div>
          </div>
        </section>

        {/* Problem → Solution */}
        <section className="relative px-4 py-16 md:py-20 bg-base-100/60 border-y border-base-300/50">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-base-content">
              The problem
            </h2>
            <p className="text-base-content/70 leading-relaxed">
              Paper markups get lost. Photos don&apos;t compile into a single source of truth. Spreadsheets drift from the drawing.
            </p>
            <h2 className="text-xl md:text-2xl font-bold text-base-content pt-4">
              The solution
            </h2>
            <p className="text-base-content/80 font-medium leading-relaxed">
              The drawing is the database: welds live where they belong.
            </p>
          </div>
        </section>

        {/* Key features */}
        <section className="relative px-4 py-16 md:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-base-content mb-8">
              Key features
            </h2>
            <ul className="flex flex-col gap-3 text-left max-w-md mx-auto list-disc list-inside text-base-content/80">
              {keyFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section className="relative px-4 py-16 md:py-20 bg-base-100/60 border-y border-base-300/50">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-base-content mb-8">
              How it works
            </h2>
            <ol className="flex flex-col gap-4 text-left max-w-md mx-auto list-decimal list-inside text-base-content/80 font-medium">
              {howItWorksSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </section>

        {/* Proof / credibility */}
        <section className="relative px-4 py-12 md:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-base-content/70 italic">
              Built by a fabrication PM who got tired of chasing weld lists.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="relative px-4 py-16 md:py-20 bg-base-100/60 border-y border-base-300/50">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-base-content text-center mb-10">
              FAQ
            </h2>
            <dl className="space-y-6">
              {faqItems.map(({ q, a }) => (
                <div key={q}>
                  <dt className="font-bold text-base-content mb-1">{q}</dt>
                  <dd className="text-base-content/70 pl-0">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="relative px-4 py-16 md:py-20">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <Link
              href="/app"
              className="btn btn-primary btn-lg inline-flex shadow-lg hover:shadow-xl transition-all"
            >
              Start using it
            </Link>
            <p className="text-sm text-base-content/60">Free for now.</p>
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
                Track welds on your PDF drawings.
              </p>
            </div>

            <Link
              href="/app"
              className="btn btn-primary btn-sm shadow"
            >
              Start using it — free
            </Link>
          </div>

          <nav className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 text-sm text-base-content/70">
            <Link href="/about" className="hover:text-base-content transition-colors">
              About
            </Link>
            <Link href="/catalog" className="hover:text-base-content transition-colors">
              Part Catalog
            </Link>
            <Link href="/contact" className="hover:text-base-content transition-colors">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-base-content transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-base-content transition-colors">
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
