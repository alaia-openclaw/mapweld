import Link from "next/link";

export const metadata = {
  title: "About",
  description:
    "MapWeld is a free weld-tracking tool built by a fabrication project manager. Learn why it exists and how it helps your team.",
  alternates: { canonical: "https://www.mapweld.app/about" },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <main className="flex-1 px-4 py-16 md:py-24">
        <article className="max-w-2xl mx-auto prose prose-base">
          <h1 className="text-3xl md:text-4xl font-extrabold text-base-content tracking-tight">
            About MapWeld
          </h1>

          <p>
            MapWeld is a free, browser-based tool that lets you track welds
            directly on your PDF drawings. No installation, no sign-up, no
            cloud dependency &mdash; your data stays on your device.
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Why it exists
          </h2>
          <p>
            Paper markups get lost. Photos don&apos;t compile into a single
            source of truth. Spreadsheets drift from the drawing. MapWeld was
            built by a fabrication project manager who got tired of chasing
            weld lists and wanted a better way to keep everything in one
            place.
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            What it does
          </h2>
          <ul className="list-disc list-inside space-y-1 text-base-content/80">
            <li>Upload a PDF drawing</li>
            <li>Place numbered weld markers directly on the drawing</li>
            <li>
              Track status per weld (Fit-up, Welding, NDT, Completed, etc.)
            </li>
            <li>Record welder and fitter details, notes, and spool info</li>
            <li>Export everything to Excel</li>
            <li>Works offline as a Progressive Web App</li>
          </ul>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Get in touch
          </h2>
          <p>
            Have a question or suggestion?{" "}
            <Link href="/contact" className="link link-primary">
              Contact us
            </Link>
            .
          </p>

          <div className="mt-12 pt-6 border-t border-base-300">
            <Link href="/" className="link link-primary text-sm">
              &larr; Back to home
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
