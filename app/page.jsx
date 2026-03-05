import Link from "next/link";

export const metadata = {
  title: "Weld Dashboard — Track welds on PDF drawings",
  description:
    "Load PDF drawings, mark weld points, record welder and fitter details, and export to Excel. No installation, works offline.",
};

function AppMockup() {
  return (
    <div
      className="relative mx-auto w-full max-w-xl rounded-xl border-2 border-base-300 bg-base-100 shadow-2xl overflow-hidden"
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-base-300 bg-base-200 px-4 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-error/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </div>
        <div className="flex-1 ml-4 h-2 rounded bg-base-300/50 max-w-[40%]" />
      </div>
      <div className="aspect-[4/3] bg-base-200 relative p-6">
        <div className="h-full w-full rounded-lg bg-base-100 border border-base-300 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 400 300" fill="none">
              <rect x="20" y="20" width="360" height="260" stroke="currentColor" strokeWidth="0.5" rx="2" />
              <line x1="20" y1="50" x2="380" y2="50" stroke="currentColor" strokeWidth="0.5" />
              <line x1="20" y1="80" x2="200" y2="80" stroke="currentColor" strokeWidth="0.5" />
              <line x1="20" y1="110" x2="300" y2="110" stroke="currentColor" strokeWidth="0.5" />
            </svg>
          </div>
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="grid grid-cols-3 gap-8 place-items-center w-3/4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center"
                >
                  <span className="text-xs font-bold text-primary">{i}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
            <div className="h-8 flex-1 rounded bg-primary/20 border border-primary/40" />
            <div className="h-8 w-16 rounded bg-base-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-base-200 via-base-200 to-base-300">
      <main className="flex-1">
        <section className="px-4 pt-12 pb-16 md:pt-20 md:pb-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-extrabold text-base-content tracking-tight">
              Ditch the paper.
              <br />
              <span className="text-primary">Track welds on your drawings.</span>
            </h1>
            <p className="text-xl text-base-content/80 max-w-2xl mx-auto leading-relaxed">
              Load a PDF, click to place weld points, record welder and fitter details, and export to Excel. Works in your browser. No install. No IT ticket.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link
                href="/app"
                className="btn btn-primary btn-lg text-lg px-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                Try free — no signup
              </Link>
            </div>

            <div className="pt-8 md:pt-12">
              <AppMockup />
            </div>
          </div>
        </section>

        <section className="px-4 py-16 bg-base-100/50 border-y border-base-300/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-base-content mb-12">
              Built for fabrication and inspection
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-base-100 border border-base-300 shadow-sm">
                <div className="w-14 h-14 rounded-xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Load & mark</h3>
                <p className="text-base-content/70 text-sm">
                  Upload your PDF drawing. Click anywhere to add weld points. Shop or field. Assign to spools.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-base-100 border border-base-300 shadow-sm">
                <div className="w-14 h-14 rounded-xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Record details</h3>
                <p className="text-base-content/70 text-sm">
                  Welder, fitter, dates, part numbers, heat numbers, NDT requirements. Everything you need for traceability.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-base-100 border border-base-300 shadow-sm">
                <div className="w-14 h-14 rounded-xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Export & save</h3>
                <p className="text-base-content/70 text-sm">
                  Export to Excel for reports. Save projects for later. Works offline. Your data stays on your device.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-base-100 border border-base-300 shadow-sm">
                <span className="text-success">●</span>
                <span>No signup</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-base-100 border border-base-300 shadow-sm">
                <span className="text-success">●</span>
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-base-100 border border-base-300 shadow-sm">
                <span className="text-success">●</span>
                <span>Data stays local</span>
              </div>
            </div>

            <Link
              href="/app"
              className="btn btn-primary btn-lg inline-flex"
            >
              Start tracking welds
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-base-content/60 border-t border-base-300 bg-base-200/50">
        <Link href="/app" className="link link-hover font-medium">
          Open app
        </Link>
      </footer>
    </div>
  );
}
