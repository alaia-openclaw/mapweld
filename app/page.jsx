import Link from "next/link";

export const metadata = {
  title: "Weld Dashboard — Track welds on PDF drawings",
  description:
    "Load PDF drawings, mark weld points, record welder and fitter details, and export to Excel. No installation, works offline.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-2xl text-center space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold text-base-content">
            Track welds on PDF drawings in your browser
          </h1>
          <p className="text-lg text-base-content/80">
            Load your drawing, click to add weld points, record welder and
            fitter details, and export to Excel. No installation required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/app" className="btn btn-primary btn-lg">
              Try free
            </Link>
          </div>

          <ul className="text-left max-w-md mx-auto space-y-3 pt-8 text-base-content/90">
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">1.</span>
              <span>Load a PDF drawing and click on the page to add weld points</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">2.</span>
              <span>
                Record welder, fitter, dates, part numbers, heat numbers, and NDT
                requirements per weld
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">3.</span>
              <span>
                Export to Excel or save your project for later. Works offline.
              </span>
            </li>
          </ul>

          <p className="text-sm text-base-content/60 pt-6">
            No signup required. Your data stays in your browser or on your
            device.
          </p>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-base-content/60 border-t border-base-300">
        <Link href="/app" className="link link-hover">
          Open app
        </Link>
      </footer>
    </div>
  );
}
