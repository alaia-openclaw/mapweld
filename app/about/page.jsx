import Link from "next/link";

export const metadata = {
  title: "About",
  description:
    "Why MapWeld exists, what problem it solves in fabrication, and what it does without pretending to be a full enterprise platform.",
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
            MapWeld is a browser-based weld-tracking tool built for fabrication
            teams who need something more structured than paper or spreadsheets,
            but lighter than a full enterprise rollout. It runs in the browser,
            works offline for core project data, and keeps the drawing at the
            center of the workflow.
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Why it exists
          </h2>
          <p>
            Paper markups get lost. Photos don&apos;t become a live register.
            Spreadsheets drift away from the drawing they are supposed to describe.
            MapWeld exists to close that gap: use the isometric as the working view,
            capture weld information where the work is happening, and export structured
            data when the team needs registers, reporting, or document support.
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
            What it is not
          </h2>
          <p>
            MapWeld is not pretending to be a full ERP, MES, or enterprise QA
            platform. It is the practical capture layer around the drawing:
            quick to open, simple to test, and focused on weld traceability,
            status visibility, and exportable records.
          </p>

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
